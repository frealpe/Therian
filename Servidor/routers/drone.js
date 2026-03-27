// routers/drone.js — Rutas REST para la flota de drones
const { Router } = require('express');
const droneController = require('../controllers/DroneController');

const router = Router();

// Listar todos los Masters
router.get('/masters',                   droneController.getMasters.bind(droneController));

// Listar drones (opcionalmente filtrar por ?masterId=xxx)
router.get('/',                          droneController.getDrones.bind(droneController));

// Últimos N registros de telemetría de un drone
router.get('/:droneId/telemetry',        droneController.getTelemetry.bind(droneController));

// Calcular calibración de IMU basada en históricos
router.post('/:droneId/calibration/calculate', droneController.calculateCalibration.bind(droneController));

module.exports = router;
