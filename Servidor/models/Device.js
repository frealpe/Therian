const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const DeviceSchema = new mongoose.Schema({
  uid: { 
    type: String, 
    required: true, 
    unique: true, 
    default: uuidv4 
  }, // Generado con librería UUID
  mac: { 
    type: String, 
    required: true, 
    unique: true 
  }, // MAC Address del dispositivo
  role: { 
    type: String, 
    enum: ['master', 'slave'], 
    required: true 
  }, // Rol del dispositivo
  name: { 
    type: String, 
    required: true 
  }, // Nombre (ej. "master", "slave1", "slave2")
  status: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'offline' 
  }, // Estado en red
  isActive: {
    type: Boolean,
    default: true
  }, // Si el dispositivo está habilitado o no
  
  // Campos específicos o heredados que pueden ser útiles:
  masterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Device',
    default: null 
  }, // Si es slave, referencia a su master
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { type: String, default: null },
  wifiSSID:  { type: String, default: null },
  rssi:      { type: Number, default: null },

  // Perfil de calibración BNO055 (22 bytes, guardados tras calibración automática)
  bno055Offsets:      { type: [Number], default: [] },
  bno055CalibratedAt: { type: Date,   default: null }
}, { timestamps: true });

DeviceSchema.index({ uid: 1 });
DeviceSchema.index({ mac: 1 });
DeviceSchema.index({ role: 1 });
DeviceSchema.index({ status: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
