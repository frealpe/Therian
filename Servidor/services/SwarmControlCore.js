/**
 * SwarmControlCore.js
 * 
 * SWARM CONTROL CORE - Bionic Butterfly Autonomous System
 * 
 * Professional reactive navigation, cooperative swarm management, 
 * and advanced flight control logic.
 */

const socketService = require('./SocketService');
const logger = require('../lib/logger');

// ─── Constants ────────────────────────────────────────────────────────────────
const LOOP_INTERVAL_MS = 100;
const DT = LOOP_INTERVAL_MS / 1000;

// Safety & Limits
const ALT_MIN = 1.0;
const ALT_MAX = 10.0;
const MMWAVE_SAFETY_RADIUS = 0.6;
const COOPERATIVE_RADIUS = 1.0;
const REPULSION_FORCE = 0.5;

// PID Defaults
const KP = 1.2;
const KI = 0.1;
const KD = 0.4;
const PID_THRESHOLD = 0.4; // Correct if error > 0.4m

class SwarmControlCore {
    constructor() {
        this.active = false;
        this.loopTimer = null;
        this.waypoints = [];
        this.fleet = new Map(); // key: mac, val: DroneState
        this.mqttPublish = null;
    }

    setMqttPublisher(publishFn) {
        this.mqttPublish = publishFn;
    }

    /**
     * Start the swarm mission
     * @param {Array} waypoints Global trajectory points
     * @param {Array} droneMacs List of participating drones
     */
    async startMission(waypoints, droneMacs) {
        this.waypoints = waypoints;
        this.active = true;
        
        // Initialize fleet states
        this.fleet.clear();
        const droneCount = droneMacs.length;
        
        droneMacs.forEach((mac, index) => {
            // Distribute trajectory: Each drone starts at a synchronized offset
            const offset = Math.floor((index / droneCount) * waypoints.length);
            
            this.fleet.set(mac, {
                mac,
                pos: { x: 0, y: 1.5, z: 0 },
                vel: { x: 0, y: 0, z: 0 },
                home: { x: 0, y: 1.5, z: 0 },
                targetIdx: offset,
                mode: 'MISSION', // MISSION | LANDING | SAFETY | FAULT
                pid: {
                    integral: { x: 0, y: 0, z: 0 },
                    lastError: { x: 0, y: 0, z: 0 }
                },
                mmWave: { dist: 10, angle: 0 },
                battery: 100,
                connected: true,
                lastSeen: Date.now()
            });
        });

        this._startLoop();
        logger.info(`[CORE] Swarm mission started with ${droneCount} drones.`);
    }

    stopMission(toLanding = true) {
        // ── Stop the control loop immediately ──────────────────────
        this.active = false;
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }

        if (toLanding) {
            // Send a single LAND command to every drone — no more loop
            this.fleet.forEach((state, mac) => {
                this._publishCmd(mac, 'LAND', state.home || state.pos);
            });
            logger.info('[CORE] Mission STOP → LAND command sent to all drones.');
        } else {
            logger.info('[CORE] Mission terminated immediately. No landing command sent.');
        }

        this.fleet.clear();
    }

    /**
     * Update drone status from telemetry/UWB
     */
    updateDroneState(mac, data) {
        const state = this.fleet.get(mac);
        if (!state) return;

        if (data.pos) {
            // Velocity calculation for prediction
            state.vel = {
                x: (data.pos.x - state.pos.x) / DT,
                y: (data.pos.y - state.pos.y) / DT,
                z: (data.pos.z - state.pos.z) / DT
            };
            state.pos = { ...data.pos };
        }
        if (data.battery !== undefined) state.battery = data.battery;
        if (data.mmWave) state.mmWave = data.mmWave;
        if (data.home) state.home = data.home;
        
        state.lastSeen = Date.now();
        state.connected = true;
    }

    _startLoop() {
        if (this.loopTimer) clearInterval(this.loopTimer);
        this.loopTimer = setInterval(() => this._controlLoop(), LOOP_INTERVAL_MS);
    }

    _controlLoop() {
        if (!this.active) return;

        // 1. Fault Tolerance Check
        this._checkFaults();

        // 2. Trajectory Redistribution if needed
        this._syncTrajectory();

        this.fleet.forEach((state, mac) => {
            let controlVector = { x: 0, y: 0, z: 0 };
            let currentTarget = null;
            let currentMode = state.mode;

            // --- PRIORITY 1: mmWave Safety ---
            if (state.mmWave.dist < MMWAVE_SAFETY_RADIUS) {
                currentMode = 'SAFETY';
                controlVector = this._calculateRepulsion(state.mmWave.angle);
                this._logSafety(mac, 'mmWave Collision Avoidance Activated');
            } 
            
            // --- PRIORITY 2: Cooperative Separation ---
            else {
                const coopVector = this._calculateCooperativeSeparation(mac, state);
                if (coopVector) {
                    currentMode = 'COOPERATIVE';
                    controlVector = coopVector;
                } 
                
                // --- PRIORITY 3: Mission / Landing ---
                else {
                    if (state.mode === 'MISSION') {
                        currentTarget = this.waypoints[state.targetIdx];
                        // Advance index if close to target
                        if (this._distance(state.pos, currentTarget) < 0.5) {
                            state.targetIdx = (state.targetIdx + 1) % this.waypoints.length;
                        }
                    } else if (state.mode === 'LANDING') {
                        currentTarget = state.home;
                        if (this._distance(state.pos, currentTarget) < 0.2) {
                            this._publishCmd(mac, 'DISARM', currentTarget);
                            return;
                        }
                    }

                    if (currentTarget) {
                        controlVector = this._calculatePID(state, currentTarget);
                    }
                }
            }

            // --- Apply Dynamics & Send ---
            const finalPos = {
                x: state.pos.x + controlVector.x * DT,
                y: this._clamp(state.pos.y + controlVector.y * DT, ALT_MIN, ALT_MAX),
                z: state.pos.z + controlVector.z * DT
            };

            this._publishCmd(mac, currentMode, finalPos);
            
            // Real-time notification
            socketService.emit('core:update', {
                mac,
                pos: finalPos,
                mode: currentMode,
                battery: state.battery
            });
        });
    }

    // --- Algorithmic Components ---

    _calculatePID(state, target) {
        const err = {
            x: target.x - state.pos.x,
            y: target.y - state.pos.y,
            z: target.z - state.pos.z
        };

        const distErr = Math.sqrt(err.x ** 2 + err.y ** 2 + err.z ** 2);
        if (distErr < PID_THRESHOLD) return { x: 0, y: 0, z: 0 }; // Prompt: "Apply correction if error > 0.4m"

        // Proportional
        const p = { x: err.x * KP, y: err.y * KP, z: err.z * KP };

        // Integral
        state.pid.integral.x += err.x * DT;
        state.pid.integral.y += err.y * DT;
        state.pid.integral.z += err.z * DT;
        const i = { x: state.pid.integral.x * KI, y: state.pid.integral.y * KI, z: state.pid.integral.z * KI };

        // Derivative
        const d = {
            x: (err.x - state.pid.lastError.x) / DT * KD,
            y: (err.y - state.pid.lastError.y) / DT * KD,
            z: (err.z - state.pid.lastError.z) / DT * KD
        };

        state.pid.lastError = { ...err };

        return {
            x: p.x + i.x + d.x,
            y: p.y + i.y + d.y,
            z: p.z + i.z + d.z
        };
    }

    _calculateRepulsion(angleDeg) {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: -Math.cos(rad) * REPULSION_FORCE,
            y: 0,
            z: -Math.sin(rad) * REPULSION_FORCE
        };
    }

    _calculateCooperativeSeparation(myMac, myState) {
        let sepVector = { x: 0, y: 0, z: 0 };
        let count = 0;

        // Prediction horizon (1.0 second)
        const PREDICTION_TIME = 1.0;

        this.fleet.forEach((otherState, otherMac) => {
            if (myMac === otherMac || !otherState.connected) return;

            // Current distance
            const dist = this._distance(myState.pos, otherState.pos);

            // Predicted distance
            const myPred = {
                x: myState.pos.x + myState.vel.x * PREDICTION_TIME,
                y: myState.pos.y + myState.vel.y * PREDICTION_TIME,
                z: myState.pos.z + myState.vel.z * PREDICTION_TIME
            };
            const otherPred = {
                x: otherState.pos.x + otherState.vel.x * PREDICTION_TIME,
                y: otherState.pos.y + otherState.vel.y * PREDICTION_TIME,
                z: otherState.pos.z + otherState.vel.z * PREDICTION_TIME
            };
            const predDist = this._distance(myPred, otherPred);

            // Trigger if current OR predicted distance is too low
            if (dist < COOPERATIVE_RADIUS || predDist < COOPERATIVE_RADIUS) {
                const diff = {
                    x: myState.pos.x - otherState.pos.x,
                    y: myState.pos.y - otherState.pos.y,
                    z: myState.pos.z - otherState.pos.z
                };
                const weight = 1 / (dist + 0.1); // Weight by proximity
                sepVector.x += diff.x * weight;
                sepVector.y += diff.y * weight;
                sepVector.z += diff.z * weight;
                count++;
            }
        });

        if (count === 0) return null;

        return {
            x: (sepVector.x / count) * REPULSION_FORCE,
            y: (sepVector.y / count) * REPULSION_FORCE,
            z: (sepVector.z / count) * REPULSION_FORCE
        };
    }

    _syncTrajectory() {
        const activeCount = Array.from(this.fleet.values()).filter(s => s.connected && s.battery > 15).length;
        if (activeCount === 0 || activeCount === this.lastActiveCount) return;

        this.lastActiveCount = activeCount;
        let i = 0;
        this.fleet.forEach((state) => {
            if (state.connected && state.battery > 15) {
                const newOffset = Math.floor((i / activeCount) * this.waypoints.length);
                state.targetIdx = newOffset;
                i++;
            }
        });
    }

    _checkFaults() {
        const now = Date.now();
        this.fleet.forEach((state, mac) => {
            // Disconnect if no data for 2 seconds
            if (now - state.lastSeen > 2000) {
                state.connected = false;
                state.mode = 'FAULT';
            }
            // Critical battery
            if (state.battery < 10) {
                state.mode = 'LANDING';
                this._logSafety(mac, 'Critical Battery - Auto Landing');
            }
        });
    }

    // --- Utilities ---

    _distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
    }

    _clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    _logSafety(mac, msg) {
        logger.warn(`[SAFETY] [${mac}] ${msg}`);
        socketService.emit('core:log', { mac, msg, timestamp: Date.now() });
    }

    _publishCmd(mac, type, pos) {
        if (!this.mqttPublish) return;
        this.mqttPublish(`drone/slave/${mac}/commands`, {
            type,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            ts: Date.now()
        });
    }
}

module.exports = new SwarmControlCore();
