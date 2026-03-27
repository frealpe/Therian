/**
 * MissionControlService.js — GeoBoard_03 Orchestrator
 * 
 * Priority Chain (per 100ms loop):
 *   1. Evasión (mmWave)  > 2. Corrección (UWB)  > 3. Trayectoria (JSON)
 * 
 * Safety:  Altitude clamped to [1.0m, 3.0m] at all times.
 */

const socketService = require('./SocketService');
const { HomeBase } = require('../models');
const swarmCore = require('./SwarmControlCore');
const logger = require('../lib/logger');

// ─── Constants ────────────────────────────────────────────────────────────────

const LOOP_INTERVAL_MS        = 100;   // Control loop period
const MMWAVE_SAFETY_RADIUS_M  = 0.8;  // Obstacle threshold (metros)
const EVASION_MAGNITUDE_M     = 0.5;  // How far to jump on evasion
const SCURVE_STEPS            = 10;   // Intermediate points for smooth return
const ALT_MIN                 = 1.0;  // GeoBoard_03 safety floor (m)
const ALT_MAX                 = 3.0;  // GeoBoard_03 safety ceiling (m)

// ─── MissionControlService ────────────────────────────────────────────────────

class MissionControlService {
    constructor() {
        if (MissionControlService.instance) return MissionControlService.instance;

        // Singleton state
        this._active       = false;
        this._loopTimer    = null;
        this._waypoints    = [];     // The 36-point circular trajectory
        this._mqttPublish  = null;   // Injected by server.js after MQTT connects

        // Per-drone state map  key = droneMac
        // { mac, droneId, currentPos, homeBase, mode, evasionActive, sCurveQueue }
        this._fleet = new Map();

        MissionControlService.instance = this;
    }

    // ──────────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────────

    /**
     * Inject the MQTT publish function after the server initializes it.
     * @param {Function} publishFn  (topic, payload) => void
     */
    setMqttPublisher(publishFn) {
        this._mqttPublish = publishFn;
        swarmCore.setMqttPublisher(publishFn);
    }

    // ──────────────────────────────────────────────
    // Mission lifecycle
    // ──────────────────────────────────────────────

    /**
     * Start a mission for a set of drones using a trajectory.
     * @param {Array}  waypoints  Array of {x,y,z} objects (36 points for circular)
     * @param {Array}  droneIds   Array of droneMac strings
     */
    async startMission(waypoints, droneIds) {
        if (this._active) {
            logger.warn('[MCS] Mission already active. Stop first.');
            return { ok: false, msg: 'Mission already active' };
        }

        const formattedWaypoints = waypoints.map(wp => ({
            x: wp.x !== undefined ? wp.x : (wp.lat || 0),
            y: wp.y !== undefined ? wp.y : (wp.altitude || 1.5),
            z: wp.z !== undefined ? wp.z : (wp.lon || 0)
        }));

        this._active = true;
        
        // Load HomeBases and start Swarm Core
        for (const mac of droneIds) {
            const base = await HomeBase.findOne({ droneMac: mac });
            if (base) {
                swarmCore.updateDroneState(mac, { home: { x: base.x, y: base.y, z: base.z } });
            }
        }

        await swarmCore.startMission(formattedWaypoints, droneIds);

        logger.info(`[MCS] 🚀 SWARM CORE Started. Drones: ${droneIds.length}`);
        socketService.emit('mission:start', { state: 'ACTIVE', activeDrones: droneIds });
        return { ok: true };
    }

    stopMission(reason = 'manual') {
        if (!this._active) return;
        this._active = false;
        swarmCore.stopMission(true); // Go to landing
        logger.info(`[MCS] 🛑 Mission stopping... Reason: ${reason}`);
        socketService.emit('mission:stop', { reason });
    }

    getState() {
        const fleet = Array.from(swarmCore.fleet.entries()).map(([mac, s]) => ({
            mac, mode: s.mode, pos: s.pos, targetIdx: s.targetIdx, battery: s.battery
        }));
        return { active: this._active, droneCount: fleet.length, fleet };
    }

    // ──────────────────────────────────────────────
    // Sensor inputs
    // ──────────────────────────────────────────────

    /**
     * Process a UWB position report.
     * Priority 2: Corrects drone's known position for trajectory following.
     */
    updateUWBPosition(droneMac, x, y, z) {
        swarmCore.updateDroneState(droneMac, { pos: { x, y, z } });
        socketService.emit('mission:uwb_update', { droneMac, pos: { x, y, z } });
    }

    /**
     * Process a mmWave sensor reading.
     * Priority 1: If within safety radius, trigger evasion immediately.
     * @param {string} droneMac
     * @param {number} distance  metres to obstacle
     * @param {number} angle     degrees, from front of drone
     */
    handleMmWave(droneMac, distance, angle) {
        swarmCore.updateDroneState(droneMac, { mmWave: { dist: distance, angle } });
    }

    /**
     * Process general telemetry (battery, IMU, etc.)
     */
    updateTelemetry(droneMac, payload) {
        swarmCore.updateDroneState(droneMac, { 
            battery: payload.battery,
            imu: payload.imu
        });
    }

    // ──────────────────────────────────────────────
    // Home Base management
    // ──────────────────────────────────────────────

    async setHomeBase(droneMac, droneId, x, y, z) {
        const base = await HomeBase.findOneAndUpdate(
            { droneMac },
            { droneMac, droneId, x, y, z },
            { upsert: true, new: true }
        );
        // Update in-memory state too
        swarmCore.updateDroneState(droneMac, { home: { x, y, z } });

        socketService.emit('mission:base_update', { droneMac, base: { x, y, z } });
        return base;
    }

    async getHomeBases() {
        return HomeBase.find().sort({ droneMac: 1 });
    }

    // ──────────────────────────────────────────────
    // Private — Control Loop
    // ──────────────────────────────────────────────

    // Clamping and loop logic moved to SwarmControlCore
    _clampAlt(y) {
        return Math.max(1.0, Math.min(10.0, y));
    }

    // ──────────────────────────────────────────────
    // Private — MQTT Dispatch
    // ──────────────────────────────────────────────

    _publishCommand(droneMac, pos, type) {
        if (!this._mqttPublish) return;
        const topic = `drone/slave/${droneMac}/commands`;
        const payload = { type, x: pos.x, y: pos.y, z: pos.z, ts: Date.now() };
        this._mqttPublish(topic, payload);
    }
}

module.exports = new MissionControlService();
