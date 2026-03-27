const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const z = require('zod');

// Cargar y expandir variables de entorno
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const configSchema = z.object({
  PORT: z.preprocess((val) => parseInt(val, 10), z.number().default(8080)),
  MONGO_URI: z.string(),
  BROKER: z.string().default('mqtt://localhost:1883'),
  MQTT_USER: z.string().optional(),
  MQTT_PASS: z.string().optional(),
  MQTT_REJECT_UNAUTHORIZED: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  TLS_KEY_PATH: z.string().optional(),
  TLS_CERT_PATH: z.string().optional(),
  TLS_CA_PATH: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'groq', 'ollama']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  GROQ_MODEL: z.string().default('llama3-70b-8192'),
  OLLAMA_MODEL: z.string().default('llama3.1'),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MCP_HOST: z.string().default('localhost'),
  MCP_PORT: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().optional()),
  MCP_ENDPOINT: z.string().default('/mcp'),
});

const envVars = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_CNN, // Compatibilidad con MONGODB_CNN
  BROKER: process.env.BROKER,
  MQTT_USER: process.env.MQTT_USER,
  MQTT_PASS: process.env.MQTT_PASS,
  MQTT_REJECT_UNAUTHORIZED: process.env.MQTT_REJECT_UNAUTHORIZED,
  TLS_KEY_PATH: process.env.TLS_KEY_PATH,
  TLS_CERT_PATH: process.env.TLS_CERT_PATH,
  TLS_CA_PATH: process.env.TLS_CA_PATH,
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GROQ_MODEL: process.env.GROQ_MODEL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  MCP_HOST: process.env.MCP_HOST,
  MCP_PORT: process.env.MCP_PORT || process.env.PORT,
  MCP_ENDPOINT: process.env.MCP_ENDPOINT,
};

const parsedConfig = configSchema.safeParse(envVars);

if (!parsedConfig.success) {
  process.stderr.write(`❌ Error de configuración: ${JSON.stringify(parsedConfig.error.format())}\n`);
  process.exit(1);
}

module.exports = parsedConfig.data;
