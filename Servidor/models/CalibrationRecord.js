// models/CalibrationRecord.js
// Historial de sesiones de calibración BNO055 por sensor
const mongoose = require('mongoose');
const { Schema } = mongoose;

const CalibrationRecordSchema = new Schema({
    droneId:    { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    mac:        { type: String, required: true, index: true },
    // Sensor seleccionado: 'gyro' | 'accel' | 'mag' | 'full'
    sensor:     { type: String, enum: ['gyro', 'accel', 'mag', 'full'], default: 'full' },
    // 22-byte offset profile (vacío en calibraciones parciales)
    offsets:    { type: [Number], default: [] },
    // Niveles finales de calibración reportados por el BNO055 (0-3)
    stats: {
        sys:   { type: Number, default: 0 },
        gyro:  { type: Number, default: 0 },
        accel: { type: Number, default: 0 },
        mag:   { type: Number, default: 0 },
    },
    durationMs: { type: Number, default: 0 },  // duración de la sesión en ms
    notes:      { type: String, default: '' },  // comentarios opcionales
}, {
    timestamps: true  // createdAt, updatedAt automáticos
});

module.exports = mongoose.model('CalibrationRecord', CalibrationRecordSchema);
