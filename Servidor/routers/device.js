const { Router } = require('express');
const deviceController = require('../controllers/DeviceController');
const droneService = require('../services/DroneService');

const router = Router();

router.get('/all', deviceController.getDevices.bind(deviceController));
router.get('/', deviceController.getDevices.bind(deviceController));
router.post('/', deviceController.createDevice.bind(deviceController));
router.put('/:id', deviceController.updateDevice.bind(deviceController));
router.delete('/:id', deviceController.deleteDevice.bind(deviceController));

// Historial de calibraciones BNO055 por MAC
router.get('/:mac/calibrations', async (req, res) => {
    try {
        const records = await droneService.getCalibrationHistory(req.params.mac, 30);
        res.json({ ok: true, data: records });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
