const mongoose = require('mongoose');

// Sub-esquema para cada dron participante en la misión
const ParticipantSchema = new mongoose.Schema({
  droneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  angle:   { type: Number, default: 0 },   // ángulo en la formación (grados)
  offsetX: { type: Number, default: 0 },   // desplazamiento lateral (metros)
  offsetY: { type: Number, default: 0 },   // desplazamiento longitudinal (metros)
  status:  { type: String, enum: ['pending', 'flying', 'done', 'aborted'], default: 'pending' }
}, { _id: false });

// Sub-esquema de formación swarm
const FormationSchema = new mongoose.Schema({
  type:    { type: String, enum: ['line', 'circle', 'v-shape', 'grid', 'custom'], default: 'line' },
  radius:  { type: Number, default: 5  }, // radio en metros para formación circular
  spacing: { type: Number, default: 3  }  // separación entre drones en metros
}, { _id: false });

const MissionExecutionSchema = new mongoose.Schema({
  trajectoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trajectory', required: true },
  masterId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Device',     required: true },
  formation:    { type: FormationSchema, default: () => ({}) },
  startTime:    { type: Date, default: Date.now },
  endTime:      { type: Date, default: null },
  status:       { type: String, enum: ['scheduled', 'running', 'completed', 'aborted'], default: 'scheduled' },
  participants: { type: [ParticipantSchema], default: [] }
}, { timestamps: true });

MissionExecutionSchema.index({ masterId: 1 });
MissionExecutionSchema.index({ status: 1 });
MissionExecutionSchema.index({ startTime: -1 });

module.exports = mongoose.model('MissionExecution', MissionExecutionSchema);
