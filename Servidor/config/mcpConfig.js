const config = require('./config');

const mcpConfig = {
    host: config.MCP_HOST,
    port: config.MCP_PORT || config.PORT,
    endpoint: config.MCP_ENDPOINT,

    getFullUrl() {
        return `http://${this.host}:${this.port}${this.endpoint}`;
    }
};

module.exports = mcpConfig;
