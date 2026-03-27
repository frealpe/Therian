// Exporta todos los modelos de la flota de drones
module.exports = {
  Device:             require('./Device'),
  Telemetry:          require('./Telemetry'),
  Trajectory:         require('./Trajectory'),
  MissionExecution:   require('./MissionExecution'),
  HomeBase:           require('./HomeBase'),
  CalibrationRecord:  require('./CalibrationRecord'),
};
