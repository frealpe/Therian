const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  lat:      { type: Number, required: true },
  lon:      { type: Number, required: true },
  altitude: { type: Number, default: 10 },   // metros sobre el suelo
  speed:    { type: Number, default: 5  },   // km/h en ese segmento
  holdTime: { type: Number, default: 0  }    // segundos de espera en el punto
}, { _id: false });

const TrajectorySchema = new mongoose.Schema({
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  createdBy:       { type: String, default: 'system' },
  defaultAltitude: { type: Number, default: 10 },
  version:         { type: Number, default: 1 },
  waypoints:       { type: [WaypointSchema], default: [] },
  // Pattern metadata for frontend restore
  patternType:     { type: String, default: '' },
  params:          { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

TrajectorySchema.index({ name: 1 });

module.exports = mongoose.model('Trajectory', TrajectorySchema);
