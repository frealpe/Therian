const { ChatOpenAI } = require('@langchain/openai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatGroq } = require('@langchain/groq');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { AgentExecutor, createOpenAIToolsAgent } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const z = require('zod');
const config = require('../config/config');
const logger = require('../lib/logger');

class AgentService {
    constructor() {
        this.mqttPublish = null;
        this.agentExecutor = null;
        this.initAgent();
    }

    setMqttPublisher(publishFn) {
        this.mqttPublish = publishFn;
    }

    async initAgent() {
        const provider = config.AI_PROVIDER;
        let llm;

        try {
            if (provider === 'gemini') {
                if (!config.GOOGLE_API_KEY || config.GOOGLE_API_KEY.includes('YOUR_')) {
                    logger.warn('[AgentService] Google API Key no configurada. El agente IA no estará disponible.');
                    return;
                }
                llm = new ChatGoogleGenerativeAI({
                    modelName: config.GEMINI_MODEL,
                    temperature: 0,
                    apiKey: config.GOOGLE_API_KEY
                });
            } else if (provider === 'groq') {
                if (!config.GROQ_API_KEY || config.GROQ_API_KEY.includes('YOUR_')) {
                    logger.warn('[AgentService] Groq API Key no configurada. El agente IA no estará disponible.');
                    return;
                }
                llm = new ChatGroq({
                    modelName: config.GROQ_MODEL,
                    temperature: 0,
                    apiKey: config.GROQ_API_KEY
                });
            } else if (provider === 'ollama') {
                llm = new ChatOpenAI({
                    modelName: config.OLLAMA_MODEL,
                    temperature: 0,
                    openAIApiKey: 'ollama', 
                    configuration: {
                        baseURL: config.OLLAMA_BASE_URL 
                    }
                });
            } else {
                // OpenAI (default)
                if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.includes('YOUR_')) {
                    logger.warn('[AgentService] OpenAI API Key no configurada. El agente IA no estará disponible.');
                    return;
                }
                llm = new ChatOpenAI({
                    modelName: config.OPENAI_MODEL,
                    temperature: 0,
                    openAIApiKey: config.OPENAI_API_KEY
                });
            }

            // Definir herramientas
            const sendWaypointTool = new DynamicStructuredTool({
                name: "send_waypoint",
                description: "Envía un comando WAYPOINT a un dron específico para que vuele a una coordenada (x, y, z).",
                schema: z.object({
                    mac: z.string().describe("La dirección MAC del dron esclavo (ej. 'Slave_D8' o MAC completa)"),
                    x: z.number().describe("Coordenada X en metros"),
                    y: z.number().describe("Coordenada Y en metros"),
                    z: z.number().describe("Coordenada Z en metros")
                }),
                func: async ({ mac, x, y, z }) => {
                    if (this.mqttPublish) {
                        const topic = `esp32/drone/command/${mac}`;
                        const payload = JSON.stringify({ type: 'WAYPOINT', x, y, z });
                        this.mqttPublish(topic, payload);
                        return `Comando WAYPOINT enviado a ${mac}: X=${x}, Y=${y}, Z=${z}`;
                    }
                    return "Error: No hay conexión MQTT activa.";
                }
            });

            const tools = [sendWaypointTool];

            const prompt = ChatPromptTemplate.fromMessages([
                ["system", "Eres el controlador de un enjambre de drones. Tu objetivo es ayudar al usuario a mover los drones enviando comandos. " +
                           "Usa la herramienta 'send_waypoint' para cada movimiento. " +
                           "Si el usuario pide mover varios, envíalos uno por uno."],
                new MessagesPlaceholder("chat_history"),
                ["human", "{input}"],
                new MessagesPlaceholder("agent_scratchpad"),
            ]);

            const agent = await createOpenAIToolsAgent({
                llm,
                tools,
                prompt,
            });

            this.agentExecutor = new AgentExecutor({
                agent,
                tools,
            });

            logger.info('[AgentService] Agente IA inicializado correctamente.');
        } catch (error) {
            logger.error('[AgentService] Error inicializando agente:', { error: error.message });
        }
    }

    async processCommand(message) {
        if (!this.agentExecutor) {
            return "El agente IA no está disponible en este momento. Por favor verifica las API Keys en el servidor.";
        }

        try {
            const result = await this.agentExecutor.invoke({
                input: message,
                chat_history: [],
            });
            return result.output;
        } catch (error) {
            logger.error('[AgentService] Error procesando comando:', { error: error.message });
            return "Lo siento, hubo un error procesando tu comando.";
        }
    }
}

module.exports = new AgentService();
