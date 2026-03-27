const mongoose = require('mongoose');

// Colección de serie temporal: optimizada para inserciones masivas de telemetría
// NOTA MongoDB 5+ soporta timeseries nativo; para activarlo ver README o usar el helper abajo
const TelemetrySchema = new mongoose.Schema({
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
  droneId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },

  gps: {
    lat:        { type: Number, default: 0 },
    lon:        { type: Number, default: 0 },
    speed:      { type: Number, default: 0 }, // km/h
    satellites: { type: Number, default: 0 }
  },
  imu: {
    roll:   { type: Number, default: 0 },
    pitch:  { type: Number, default: 0 },
    yaw:    { type: Number, default: 0 },
    accelZ: { type: Number, default: 0 },
    magX:   { type: Number, default: 0 },
    magY:   { type: Number, default: 0 },
    magZ:   { type: Number, default: 0 }
  },
  barometer: {
    pressure:    { type: Number, default: 0 }, // hPa
    altitude:    { type: Number, default: 0 }, // metros
    temperature: { type: Number, default: 0 }  // °C
  },
  battery:   { type: Number, default: 0 }, // Voltios
  timestamp: { type: Date,   default: Date.now, index: true }
}, {
  // Sin timestamps de Mongoose (la serie temporal usa su propio campo timestamp)
  timestamps: false,
  // Colección fija si MongoDB < 5, de lo contrario usar createTimeSeries() más abajo
  versionKey: false
});

// TTL: borrar registros >24h automáticamente (ajusta según necesidad)
TelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// Índice compuesto para consultas por drone en rango de tiempo
TelemetrySchema.index({ droneId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', TelemetrySchema);

/**
 * HELPER: Para activar colección time-series nativa en MongoDB 5+
 * Ejecutar UNA SOLA VEZ en la base de datos:
 *
 * db.createCollection("telemetries", {
 *   timeseries: {
 *     timeField: "timestamp",
 *     metaField: "droneId",
 *     granularity: "seconds"
 *   }
 * });
 */
