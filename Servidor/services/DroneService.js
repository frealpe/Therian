// services/DroneService.js
// Lógica de negocio para el registro, actualización y consulta de dispositivos (Master/Slave)
const { Device, Telemetry, CalibrationRecord } = require('../models');
const socketService = require('./SocketService');
const logger = require('../lib/logger');

class DroneService {
    constructor() {
        this.startStatusChecker();
        this.repairRoles();
    }

    // ─────────────────────────────────────────
    // MASTERS
    // ─────────────────────────────────────────

    async upsertMaster(masterId, fields = {}) {
        let macToUse = fields.mac || masterId;
        const defaultName = 'Drone Master';
        
        // --- Lógica de Migración de Identidad ---
        let master = await Device.findOne({ mac: macToUse });

        if (!master && macToUse.includes(':')) {
            // Si no encontramos la MAC real, buscamos si hay un registro de Master genérico para "reclamarlo"
            const legacyMaster = await Device.findOne({ role: 'master', mac: { $not: /:/ } });
            if (legacyMaster) {
                logger.info(`[DroneService] Migrando identidad Master: ${legacyMaster.mac} -> ${macToUse}`);
                legacyMaster.mac = macToUse;
                legacyMaster.name = fields.name || legacyMaster.name || defaultName;
                await legacyMaster.save();
                master = legacyMaster;
            }
        }

        if (!master) {
            // Si después de la migración sigue sin existir, y no es una MAC válida, no permitimos creación
            if (!macToUse.includes(':')) {
                return null; 
            }
            // Si es una MAC válida nueva, se creará abajo en el findOneAndUpdate
        }

        // --- PROTECCIÓN DE ROLES ---
        // Si el dispositivo ya existe como Slave, no permitimos que un mensaje de status lo convierta en Master.
        if (master && master.role === 'slave') {
            logger.warn(`[DroneService] Ignorando status de Master para MAC de Slave: ${macToUse}`);
            return master;
        }

        const oldStatus = master ? master.status : null;

        const updateData = {
           mac: macToUse, 
           name: master ? master.name : (fields.name || defaultName),
           role: 'master', 
           lastSeen: new Date(), 
           status: fields.status || (master ? master.status : 'offline'),
           ipAddress: fields.ipAddress || (master ? master.ipAddress : null),
           wifiSSID: fields.wifiSSID || (master ? master.wifiSSID : null),
           rssi: fields.rssi || (master ? master.rssi : null),
           isActive: master ? master.isActive : true
        };

        master = await Device.findOneAndUpdate(
            { mac: macToUse },
            updateData,
            { new: true, upsert: true } // Upsert permitido solo para MACs reales
        );

        // Notificar al frontend si el estado cambió
        if (oldStatus !== null && oldStatus !== master.status) {
            socketService.emit('device:status_update', { mac: master.mac, status: master.status });
        }

        // Si el Master se reportó explícitamente offline, desconectar a todos sus Slaves
        if (fields.status === 'offline') {
            await Device.updateMany(
                { role: 'slave', masterId: master._id, status: 'online' },
                { $set: { status: 'offline' } }
            );
            logger.info(`[DroneService] 🔌 Master offline: Desconectando Slaves de ${master.name}`);
            socketService.emit('device:status_update', { masterMac: master.mac, cascade: 'offline' });
        }

        return master;
    }

    // Obtener todos los Masters
    async getMasters() {
        return Device.find({ role: 'master' }).sort({ lastSeen: -1 });
    }

    // ─────────────────────────────────────────
    // DRONES (SLAVES)
    // ─────────────────────────────────────────

    // Registrar o actualizar un Drone cuando responde IAM (vía ESP-NOW → MQTT)
    async upsertDrone(droneId, masterId, name) {
        const master = await Device.findOne({ mac: masterId, role: 'master' });
        if (!master) {
            logger.warn(`[DroneService] Master no registrado: ${masterId}`);
            return null;
        }

        // Buscar primero el drone para preservar su nombre si ya existe
        const existingDrone = await Device.findOne({ mac: droneId });

        const drone = await Device.findOneAndUpdate(
            { mac: droneId },
            { 
               mac: droneId, 
               masterId: master._id, 
               name: existingDrone ? existingDrone.name : name, 
               role: 'slave', 
               lastSeen: new Date(), 
               status: 'online',
               isActive: existingDrone ? existingDrone.isActive : true
            },
            { new: true, upsert: true } // upsert:true → crea el Slave si no existe aún
        );

        // Notificar al frontend
        socketService.emit('device:status_update', { mac: drone.mac, status: 'online' });

        return drone;
    }

    // Obtener todos los Drones (con nombre del Master)
    async getDrones(masterMac = null) {
        const query = { role: 'slave' };
        if (masterMac) {
            const master = await Device.findOne({ mac: masterMac, role: 'master' });
            if (master) query.masterId = master._id;
        }
        return Device.find(query).populate('masterId', 'name mac').sort({ lastSeen: -1 });
    }

    // Actualizar estado de un Drone
    async setDroneStatus(droneId, status) {
        const updated = await Device.findOneAndUpdate({ mac: droneId }, { status, lastSeen: new Date() }, { new: true });
        if (updated) {
            socketService.emit('device:status_update', { mac: updated.mac, status: updated.status });
        }
        return updated;
    }

    // ─────────────────────────────────────────
    // TELEMETRÍA
    // ─────────────────────────────────────────

    // Guardar un punto de telemetría de un Drone
    async saveTelemetry(droneId, masterId, payload) {
        const [drone, master] = await Promise.all([
            Device.findOne({ mac: droneId, role: 'slave' }),
            Device.findOne({ mac: masterId, role: 'master' })
        ]);

        if (!drone || !master) {
            if (!drone) {
                logger.warn(`[DroneService] Telemetría descartada: Slave ${droneId} no encontrado (revisa si está registrado como Master por error).`);
            }
            if (!master) {
                logger.warn(`[DroneService] Telemetría descartada: Master ${masterId} no encontrado.`);
            }
            return null;
        }

        // Actualizar el estado del drone a online si está recibiendo datos
        let statusChanged = false;
        if (drone.status !== 'online') {
            await Device.findByIdAndUpdate(drone._id, { 
                status: 'online', 
                lastSeen: new Date(),
                rssi: payload.rssi || drone.rssi
            });
            statusChanged = true;
        } else {
            await Device.findByIdAndUpdate(drone._id, { 
                lastSeen: new Date(),
                rssi: payload.rssi || drone.rssi
            });
        }

        if (statusChanged) {
            socketService.emit('device:status_update', { mac: drone.mac, status: 'online' });
        }

        return Telemetry.create({
            droneId:  drone._id,
            masterId: master._id,
            // Supports short keys (NEW fw) and long keys (legacy fw)
            gps: {
                lat:        payload.lt  ?? payload.lat  ?? payload.gps_lat        ?? payload.gps?.lat        ?? 0,
                lon:        payload.ln  ?? payload.lon  ?? payload.gps_lon        ?? payload.gps?.lon        ?? 0,
                speed:      payload.sp  ?? payload.spd  ?? payload.gps_speed      ?? payload.gps?.speed      ?? 0,
                satellites: payload.s   ?? payload.sat  ?? payload.gps_satellites ?? payload.gps?.satellites ?? 0,
            },
            imu: {
                roll:   payload.r   ?? payload.imuRoll   ?? payload.imu?.roll   ?? 0,
                pitch:  payload.p   ?? payload.imuPitch  ?? payload.imu?.pitch  ?? 0,
                yaw:    payload.y   ?? payload.imuYaw    ?? payload.imu?.yaw    ?? 0,
                accelZ: payload.az  ?? payload.imuAccelZ ?? payload.imu?.accelZ ?? 0,
                magX:   payload.mx  ?? payload.imuMagX   ?? payload.imu?.magX   ?? 0,
                magY:   payload.my  ?? payload.imuMagY   ?? payload.imu?.magY   ?? 0,
                magZ:   payload.mz  ?? payload.imuMagZ   ?? payload.imu?.magZ   ?? 0,
            },
            barometer: {
                altitude:    (payload.a !== undefined ? payload.a / 100 : undefined) ?? payload.alt  ?? payload.baro_alt_m ?? payload.barometer?.altitude ?? 0,
                pressure:    payload.baro_pressure        ?? payload.barometer?.pressure    ?? 0,
                temperature: payload.baro_temperature     ?? payload.barometer?.temperature ?? 0,
            },
            battery:   payload.b ?? payload.bat ?? payload.battery_voltage ?? payload.battery ?? 0,
            timestamp: new Date(),
        });
    }

    // Obtener últimos N registros de telemetría de un Drone
    async getLastTelemetry(droneId, limit = 50) {
        const drone = await Device.findOne({ mac: droneId, role: 'slave' });
        if (!drone) return [];
        return Telemetry.find({ droneId: drone._id })
            .sort({ timestamp: -1 })
            .limit(limit);
    }

    // Guardar perfil de offsets BNO055 y crear registro de calibración
    async saveBNO055Offsets(mac, offsets = [], { sensor = 'full', stats = {}, durationMs = 0 } = {}) {
        if (!Array.isArray(offsets) || offsets.length !== 22) {
            logger.warn(`[DroneService] saveBNO055Offsets: formato inválido para ${mac}`);
            return null;
        }
        const drone = await Device.findOneAndUpdate(
            { mac, role: 'slave' },
            { $set: { bno055Offsets: offsets, bno055CalibratedAt: new Date() } },
            { new: true }
        );
        if (!drone) return null;

        // Crear registro histórico de la sesión
        const record = await CalibrationRecord.create({
            droneId:    drone._id,
            mac,
            sensor,
            offsets,
            stats: {
                sys:   stats.cs ?? 0,
                gyro:  stats.cg ?? 0,
                accel: stats.ca ?? 0,
                mag:   stats.cm ?? 0,
            },
            durationMs,
        });

        logger.info(`[DroneService] ✅ BNO055 offsets guardados para ${mac} (${sensor}), record: ${record._id}`);
        socketService.emit('device:status_update', { mac, bno055CalibratedAt: drone.bno055CalibratedAt });
        return drone;
    }

    // Obtener historial de calibraciones de un drone
    async getCalibrationHistory(mac, limit = 20) {
        return CalibrationRecord.find({ mac })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    // ─────────────────────────────────────────
    // CALIBRACIÓN DE SENSORES
    // ─────────────────────────────────────────

    // Calcular Offsets de Calibración del BNO055 basado en telemetría reciente
    async calculateBNO055Calibration(droneId, sampleSize = 250) {
        const drone = await Device.findOne({ mac: droneId, role: 'slave' });
        if (!drone) throw new Error(`Drone no encontrado: ${droneId}`);

        // 1. Obtener los últimos N registros que tengan datos de magnetómetro válidos
        const telemetryData = await Telemetry.find({
            droneId: drone._id,
            'imu.magX': { $ne: 0 },
            'imu.magY': { $ne: 0 },
            'imu.magZ': { $ne: 0 }
        })
        .sort({ timestamp: -1 })
        .limit(sampleSize);

        if (telemetryData.length < 50) {
            throw new Error(`Datos insuficientes para calibración. Se requieren al menos 50 muestras, pero solo hay ${telemetryData.length}. El drone necesita moverse en forma de 8.`);
        }

        // 2. Extraer valores Min y Max para calcular el centro de la esfera (Hard Iron Offset)
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        telemetryData.forEach(t => {
            const { magX, magY, magZ } = t.imu;
            if (magX < minX) minX = magX;
            if (magX > maxX) maxX = magX;
            if (magY < minY) minY = magY;
            if (magY > maxY) maxY = magY;
            if (magZ < minZ) minZ = magZ;
            if (magZ > maxZ) maxZ = magZ;
        });

        // Hard Iron Offsets (Centro de la elipsoide de lecturas magnéticas)
        const offsetX = (maxX + minX) / 2.0;
        const offsetY = (maxY + minY) / 2.0;
        const offsetZ = (maxZ + minZ) / 2.0;

        // BNO055 Magnetometer offset registers are 16-bit little endian, typically in 1/16 uT (microTesla) scale.
        // We simulate a generic 22-byte profile response here (accelerometer/gyro offset usually requires static rest, 0-ed out here to preserve existing).
        // Format: Accel X(2), Y(2), Z(2), Mag X(2), Y(2), Z(2), Gyro X(2), Y(2), Z(2), Accel_Radius(2), Mag_Radius(2)
        
        let offsets = new Array(22).fill(0);
        
        // Emulate packing 16-bit little-endian for Magnetometer (Bytes 6 to 11)
        const pack16LE = (value) => {
            const intVal = Math.round(value);
            return [intVal & 0xFF, (intVal >> 8) & 0xFF];
        };

        const magXBytes = pack16LE(offsetX);
        const magYBytes = pack16LE(offsetY);
        const magZBytes = pack16LE(offsetZ);

        offsets[6] = magXBytes[0]; offsets[7] = magXBytes[1];
        offsets[8] = magYBytes[0]; offsets[9] = magYBytes[1];
        offsets[10] = magZBytes[0]; offsets[11] = magZBytes[1];
        
        // Arbitrary radius for BNO055 mag radius (Byte 20-21), standard is typically ~1000 for earth's field
        const magRadius = pack16LE(1000);
        offsets[20] = magRadius[0]; offsets[21] = magRadius[1];

        return {
            mac: droneId,
            samplesUsed: telemetryData.length,
            hardIronOffsets: { x: offsetX.toFixed(2), y: offsetY.toFixed(2), z: offsetZ.toFixed(2) },
            payload22Bytes: offsets
        };
    }

    // ─────────────────────────────────────────
    // VERIFICADOR DE ESTADO (HEARTBEAT)
    // ─────────────────────────────────────────
    startStatusChecker() {
        // Ejecutar cada 10 segundos
        setInterval(async () => {
            try {
                // 30 segundos sin telemetría = Offline
                const thirtySecondsAgo = new Date(Date.now() - 30000);
                
                const staleDevices = await Device.find({ 
                    status: 'online', 
                    lastSeen: { $lt: thirtySecondsAgo } 
                });

                if (staleDevices.length > 0) {
                    for (const device of staleDevices) {
                        device.status = 'offline';
                        await device.save();
                        logger.info(`[DroneService] 🔌 Dispositivo marcado offline por inactividad: ${device.name || device.mac}`);
                        socketService.emit('device:status_update', { mac: device.mac, status: 'offline' });
                    }
                }
            } catch (err) {
                logger.error('[DroneService] Error chequeando dispositivos offline:', { error: err.message });
            }
        }, 10000);
    }

    // ─────────────────────────────────────────
    // UTILIDADES DE MANTENIMIENTO
    // ─────────────────────────────────────────

    async repairRoles() {
        try {
            // Buscar dispositivos que son "master" pero tienen nombre de "slave"
            // Esto corrige errores causados por mensajes MQTT retenidos en tópicos incorrectos
            const wronglyMarkedMasters = await Device.find({ 
                role: 'master', 
                $or: [
                    { name: { $regex: /^Slave/i } },
                    { mac: 'FC:B4:67:72:48:1C' } // Fix específico solicitado por el usuario
                ]
            });

            if (wronglyMarkedMasters.length > 0) {
                logger.info(`[DroneService] 🛠  Reparando ${wronglyMarkedMasters.length} roles incorrectos...`);
                for (const dev of wronglyMarkedMasters) {
                    logger.info(`[DroneService] -> Cambiando ${dev.mac} (${dev.name}) de Master a Slave.`);
                    dev.role = 'slave';
                    // Si el Master actual es el C0:4... asociarlo si es posible, o dejarlo para el próximo IAM
                    await dev.save();
                }
            }
        } catch (err) {
            logger.error('[DroneService] Error reparando roles:', { error: err.message });
        }
    }
}

module.exports = new DroneService();
