const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../lib/logger');

async function dbConnection() {
    try {
        await mongoose.connect(config.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 
        });
        logger.info(`✅ [MongoDB] Conectado con éxito`);
    } catch (err) {
        logger.error('❌ [MongoDB] Error de conexión:', { error: err.message });
    }
}

module.exports = { dbConnection };
