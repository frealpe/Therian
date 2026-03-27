const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const socketIo = require('socket.io');

const socketService  = require('../services/SocketService');
const mqttService    = require('../mqtt/conectMqtt');
const missionService = require('../services/MissionControlService');
const { dbConnection } = require('../database/config');


const config         = require('../config/config');
const logger         = require('./logger');

class Server {
    constructor() {
        this.app      = express();
        this.port     = config.PORT;
        this.server   = http.createServer(this.app);
        this.protocol = 'http';

        // ---- WebSocket (Socket.io) ----
        this.io = socketIo(this.server, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });
        socketService.initialize(this.io);

        this.middlewares();
        this.conectarMqtt();
        dbConnection(); // Conectar a MongoDB
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Health-check simple
        this.app.get('/health', (_req, res) => res.json({ status: 'ok' }));

        // Flota de Drones (Masters, Drones, Telemetría)
        this.app.use('/api/drones', require('../routers/drone'));
        
        // Router de compatibilidad con Frontend "Gestión de Dispositivos"
        this.app.use('/api/data/devices', require('../routers/device'));
        
        // Misiones y Trayectorias
        this.app.use('/api/data/trajectories', require('../routers/trajectory'));
        
        // Mission Control GeoBoard_03
        this.app.use('/api/mission', require('../routers/mission'));

        // AI Agent Co-pilot
        this.app.use('/api/agent', require('../routers/agent'));
    }

    conectarMqtt() {
        mqttService.connect();
        // Wire MQTT publisher into MissionControlService
        missionService.setMqttPublisher(mqttService.publicarMQTT);

        // Wire MQTT publisher into AgentService
        const agentService = require('../services/AgentService');
        agentService.setMqttPublisher(mqttService.publicarMQTT);
    }

    listen() {
        this.server.listen(this.port, () => {
            logger.info(`🚀 Servidor corriendo en ${this.protocol}://localhost:${this.port}`);
        });
    }
}

module.exports = Server;
