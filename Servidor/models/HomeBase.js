const mongoose = require('mongoose');

/**
 * HomeBase — Punto de origen (WP-0) de cada drone en el área UWB 10x10m.
 * Las coordenadas x, y, z son métricas relativas al centro de la cuadrícula.
 */
const HomeBaseSchema = new mongoose.Schema({
    droneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
        unique: true
    },
    droneMac: { type: String, required: true },
    name: { type: String, default: 'Home Base' },
    x: { type: Number, default: 0.0 },  // metros, relativo al origen UWB
    y: { type: Number, default: 1.5 },  // altura en metros (default seguro)
    z: { type: Number, default: 0.0 }   // metros, relativo al origen UWB
}, { timestamps: true });

HomeBaseSchema.index({ droneMac: 1 });

module.exports = mongoose.model('HomeBase', HomeBaseSchema);
