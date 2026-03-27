const mqtt          = require('mqtt');
const z             = require('zod');
const config        = require('../config/config');
const logger        = require('../lib/logger');
const socketService  = require('../services/SocketService');
const droneService   = require('../services/DroneService');
const missionService = require('../services/MissionControlService');
const { Device }     = require('../models');
const fs             = require('fs');

const brokerUrl = config.BROKER;
const isSecure  = brokerUrl.startsWith('mqtts') || brokerUrl.startsWith('wss');

const options = {
  username:        config.MQTT_USER,
  password:        config.MQTT_PASS,
  clientId:        'NodeGateway_' + Math.random().toString(16).substr(2, 8),
  reconnectPeriod: 3000,
  keepalive:       60,
  ...(isSecure && {
    key:                config.TLS_KEY_PATH  ? fs.readFileSync(config.TLS_KEY_PATH)  : undefined,
    cert:               config.TLS_CERT_PATH ? fs.readFileSync(config.TLS_CERT_PATH) : undefined,
    ca:                 config.TLS_CA_PATH   ? fs.readFileSync(config.TLS_CA_PATH)   : undefined,
    rejectUnauthorized: config.MQTT_REJECT_UNAUTHORIZED,
  })
};

// --- Esquemas de Validación ---
const MasterStatusSchema = z.object({
    status: z.string().optional().default('online'),
    mqttConnected: z.boolean().optional(),
    ipAddress: z.string().nullable().optional(),
    wifiSSID: z.string().nullable().optional(),
    name: z.string().optional(),
    mac: z.string().optional(),
});

const TelemetrySchema = z.object({
    lt: z.coerce.number().optional(), // lat
    ln: z.coerce.number().optional(), // lon
    sp: z.coerce.number().optional(), // speed
    s:  z.coerce.number().optional(), // sat
    r:  z.coerce.number().optional(), // roll
    p:  z.coerce.number().optional(), // pitch
    y:  z.coerce.number().optional(), // yaw
    az: z.coerce.number().optional(), // accelZ
    b:  z.coerce.number().optional(), // battery
    a:  z.coerce.number().optional(), // altitude
    qw: z.coerce.number().optional(),
    qx: z.coerce.number().optional(),
    qy: z.coerce.number().optional(),
    qz: z.coerce.number().optional(),
    mx: z.coerce.number().optional(),
    my: z.coerce.number().optional(),
    mz: z.coerce.number().optional(),
}).passthrough(); // Permitir campos extra (legacy)

const TOPICS = [
  'drone/master/+/status',
  'drone/master/+/telemetry',
  'drone/slave/+/data',
  'drone/slave/+/iam',
  'drone/slave/+/calib_report',   // BNO055 calibration complete
  'drone/sensor/+/mmwave',  // GeoBoard_03: mmWave obstacle detection
  'drone/uwb/+/position',   // GeoBoard_03: UWB real-time position
];

let mqttClient;

// ──────────────────────────────────────────────
// Router de mensajes MQTT entrantes
// ──────────────────────────────────────────────
async function handleMessage(topic, msgStr) {
  logger.debug(`📥 RAW MSG on [${topic}]: "${msgStr}"`);
  let payload = {};
  try { payload = JSON.parse(msgStr); } catch { payload = { raw: msgStr }; }

  const parts = topic.split('/'); // ['drone', 'master'|'slave', id, type]

  // Emitir al frontend (WebSocket) siempre
  socketService.emit('mqtt:message', { topic, data: payload });

  if (parts[1] === 'master' && parts[3] === 'status') {
    const masterId = parts[2];
    logger.info(`📡 Master Status received from topic ID: ${masterId}`, { payload });
  try {
    const validated = MasterStatusSchema.parse(payload);
    const status = validated.status;
    const mqttConnected = (typeof validated.mqttConnected !== 'undefined') ? !!validated.mqttConnected : (status === 'online');
    const master = await Device.findOne({ mac: masterId, role: 'master' });
    if (master && master.isActive === false) {
      logger.info(`[MQTT] Mensaje ignorado del Master ${masterId} (Deshabilitado)`);
      return;
    }

    await droneService.upsertMaster(masterId, {
      status:        status,
      mqttConnected: mqttConnected,
      ipAddress:     validated.ipAddress     || null,
      wifiSSID:      validated.wifiSSID      || null,
      name:          validated.name          || masterId,
      mac:           validated.mac           || masterId,
    });
    } catch (e) {
        logger.error('[MQTT] upsertMaster error:', { error: e.message, masterId });
    }
    return;
  }

  if (parts[1] === 'slave' && parts[3] === 'iam') {
    const droneId  = parts[2];
    const masterId = payload.masterId || 'unknown';
    const name     = payload.name     || droneId;
    await droneService.upsertDrone(droneId, masterId, name)
      .catch(e => logger.error('[MQTT] upsertDrone error:', { error: e.message, droneId }));
    return;
  }

  if (parts[1] === 'slave' && parts[3] === 'data') {
    const droneId  = parts[2];
    const masterId = payload.masterId || 'unknown';
    try {
        const validated = TelemetrySchema.parse(payload);
        
        // Verificar si el Slave está activo
        const slave = await Device.findOne({ mac: droneId, role: 'slave' });
        if (slave && slave.isActive === false) return;

        await droneService.saveTelemetry(droneId, masterId, validated);
        missionService.updateTelemetry(droneId, validated);
    } catch (e) {
        logger.error('[MQTT] saveTelemetry validation error:', { error: e.message, droneId });
    }
    return;
  }

  if (parts[1] === 'slave' && parts[3] === 'calib_report') {
    const droneId = parts[2];
    const offsets = payload.offsets || [];
    const sensor  = payload.sensor  || 'full';   
    const stats   = {                             
        cs: payload.cs ?? payload.sys_calib  ?? 0,
        cg: payload.cg ?? payload.gyro_calib ?? 0,
        ca: payload.ca ?? payload.acc_calib  ?? 0,
        cm: payload.cm ?? payload.mag_calib  ?? 0,
    };
    const durationMs = payload.durationMs ?? 0;
    logger.info(`🧭 calib_report recibido de ${droneId}`, { sensor, stats });
    await droneService.saveBNO055Offsets(droneId, offsets, { sensor, stats, durationMs })
      .catch(e => logger.error('[MQTT] saveBNO055Offsets error:', { error: e.message, droneId }));
    socketService.emit('calib:complete', { mac: droneId, offsets, stats, sensor, timestamp: Date.now() });
    return;
  }

  // drone/sensor/{droneId}/mmwave  → GeoBoard_03 obstacle detection
  if (parts[1] === 'sensor' && parts[3] === 'mmwave') {
    const droneMac = parts[2];
    const distance = parseFloat(payload.distance ?? payload.dist ?? 99);
    const angle    = parseFloat(payload.angle ?? 0);
    missionService.handleMmWave(droneMac, distance, angle);
    return;
  }

  // drone/uwb/{droneId}/position  → GeoBoard_03 UWB real position update
  if (parts[1] === 'uwb' && parts[3] === 'position') {
    const droneMac = parts[2];
    const x = parseFloat(payload.x ?? 0);
    const y = parseFloat(payload.y ?? 1.5);
    const z = parseFloat(payload.z ?? 0);
    missionService.updateUWBPosition(droneMac, x, y, z);
    return;
  }
}

// ──────────────────────────────────────────────
// Conexión y handlers
// ──────────────────────────────────────────────
function connect() {
  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on('connect', () => {
    logger.info(`✅ [MQTT] Conectado a ${brokerUrl}`);
    TOPICS.forEach(topic => {
      mqttClient.subscribe(topic, { qos: 1 }, (err) => {
        if (err) logger.error(`❌ [MQTT] Error suscribiéndose a ${topic}:`, { error: err.message });
        else     logger.info(`📡 [MQTT] Suscrito a: ${topic}`);
      });
    });
  });

  mqttClient.on('message', (topic, message, packet) => {
    const msgStr = message.toString();
    const isRetained = packet.retain ? ' [RETAINED]' : '';
    logger.debug(`📥 [MQTT] ${topic}${isRetained}`);
    handleMessage(topic, msgStr);
  });

  mqttClient.on('error',     err => logger.error('❌ [MQTT] Error:', { error: err.message }));
  mqttClient.on('reconnect', ()  => logger.info('🔄 [MQTT] Reconectando...'));
  mqttClient.on('close',     ()  => logger.info('🔌 [MQTT] Conexión cerrada'));
  mqttClient.on('offline',   ()  => logger.warn('📴 [MQTT] Cliente offline'));
}

// Publicar hacia MQTT (desde el Frontend vía WebSocket o desde el servidor)
function publicarMQTT(topic, mensaje) {
  if (mqttClient && mqttClient.connected) {
    const payload = typeof mensaje === 'string' ? mensaje : JSON.stringify(mensaje);
    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) logger.error(`❌ [MQTT] Error publicando en ${topic}:`, { error: err.message });
      else     logger.debug(`📤 [MQTT] Publicado en ${topic}`);
    });
  } else {
    logger.warn('⚠️  [MQTT] Cliente no conectado, mensaje descartado', { topic });
  }
}

module.exports = { connect, publicarMQTT };
