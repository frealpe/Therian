// controllers/DroneController.js
// Endpoints HTTP REST para consultar el estado de la flota
const droneService = require('../services/DroneService');

class DroneController {

    // GET /api/drones/masters
    async getMasters(req, res) {
        try {
            const masters = await droneService.getMasters();
            res.json({ ok: true, data: masters });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }

    // GET /api/drones
    // GET /api/drones?masterId=xxx
    async getDrones(req, res) {
        try {
            const { masterId } = req.query;
            const drones = await droneService.getDrones(masterId || null);
            res.json({ ok: true, data: drones });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }

    // GET /api/drones/:droneId/telemetry?limit=50
    async getTelemetry(req, res) {
        try {
            const { droneId }  = req.params;
            const limit        = parseInt(req.query.limit) || 50;
            const data         = await droneService.getLastTelemetry(droneId, limit);
            res.json({ ok: true, data });
        } catch (err) {
            res.status(500).json({ ok: false, error: err.message });
        }
    }

    // POST /api/drones/:droneId/calibration/calculate
    async calculateCalibration(req, res) {
        try {
            const { droneId } = req.params;
            const sampleSize  = parseInt(req.body.sampleSize) || 250;
            const result      = await droneService.calculateBNO055Calibration(droneId, sampleSize);
            res.json({ ok: true, data: result });
        } catch (err) {
            res.status(400).json({ ok: false, error: err.message });
        }
    }
}

module.exports = new DroneController();
