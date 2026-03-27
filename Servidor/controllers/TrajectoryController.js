const { Trajectory, MissionExecution } = require('../models');
const logger = require('../lib/logger');

class TrajectoryController {
    // Obtener todas las trayectorias
    async getTrajectories(req, res) {
        try {
            const trajectories = await Trajectory.find().sort({ createdAt: -1 });
            res.json(trajectories);
        } catch (error) {
            logger.error('[TrajectoryController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al obtener trayectorias' });
        }
    }

    // Obtener misiones / ejecuciones (opcional, en caso de que quieran ver ejecuciones)
    async getMissions(req, res) {
        try {
            const missions = await MissionExecution.find()
                .populate('trajectoryId masterId participants.droneId')
                .sort({ startTime: -1 });
            res.json(missions);
        } catch (error) {
            logger.error('[TrajectoryController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al obtener misiones' });
        }
    }

    // Crear una nueva trayectoria
    async createTrajectory(req, res) {
        try {
            const { name, description, waypoints, defaultAltitude, patternType, params } = req.body;
            
            if (!name || !waypoints || !Array.isArray(waypoints)) {
                return res.status(400).json({ ok: false, msg: 'Nombre y waypoints son obligatorios' });
            }

            const newTrajectory = new Trajectory({
                name,
                description,
                waypoints,
                defaultAltitude: defaultAltitude || 10,
                createdBy: 'user',
                patternType: patternType || '',
                params: params || {},
            });

            await newTrajectory.save();
            res.status(201).json({ ok: true, data: newTrajectory });
        } catch (error) {
            logger.error('[TrajectoryController] Error creando trayectoria:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al guardar la trayectoria' });
        }
    }
    // Eliminar una trayectoria
    async deleteTrajectory(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Trajectory.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ ok: false, msg: 'Trayectoria no encontrada' });
            res.json({ ok: true, msg: 'Trayectoria eliminada' });
        } catch (error) {
            logger.error('[TrajectoryController] Error eliminando:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al eliminar trayectoria' });
        }
    }

    // Actualizar nombre / descripción de una trayectoria
    async updateTrajectory(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const updated = await Trajectory.findByIdAndUpdate(
                id,
                { ...(name && { name }), ...(description && { description }) },
                { new: true }
            );
            if (!updated) return res.status(404).json({ ok: false, msg: 'Trayectoria no encontrada' });
            res.json({ ok: true, data: updated });
        } catch (error) {
            logger.error('[TrajectoryController] Error actualizando:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al actualizar trayectoria' });
        }
    }
}

module.exports = new TrajectoryController();
