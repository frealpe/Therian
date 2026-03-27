const { Router } = require('express');
const agentService = require('../services/AgentService');
const logger = require('../lib/logger');

const router = Router();

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ currentStatus: 'error', error: 'El campo message es requerido' });
        }

        const reply = await agentService.processCommand(message);
        
        res.json({
            currentStatus: 'success',
            response: reply
        });
    } catch (error) {
        logger.error('[AGENT] Error procesando chat:', { error: error.message });
        res.status(500).json({
            currentStatus: 'error',
            error: error.message || 'Error interno del servidor'
        });
    }
});

module.exports = router;
