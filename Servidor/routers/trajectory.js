const { Router } = require('express');
const trajectoryController = require('../controllers/TrajectoryController');

const router = Router();

// Obtener todas las trayectorias
router.get('/', trajectoryController.getTrajectories.bind(trajectoryController));

// Obtener todas las misiones configuradas
router.get('/missions', trajectoryController.getMissions.bind(trajectoryController));

// Guardar una nueva trayectoria
router.post('/', trajectoryController.createTrajectory.bind(trajectoryController));

// Actualizar nombre/descripción de una trayectoria
router.put('/:id', trajectoryController.updateTrajectory.bind(trajectoryController));

// Eliminar una trayectoria
router.delete('/:id', trajectoryController.deleteTrajectory.bind(trajectoryController));

module.exports = router;
