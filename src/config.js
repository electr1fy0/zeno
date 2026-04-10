import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath });

function readEnv(name, { required = false } = {}) {
  const value = process.env[name]?.trim();

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

function readNumberEnv(name, fallback) {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsed;
}

const config = {
  app: {
    get env() {
      return readEnv("NODE_ENV") || "development";
    },
    get port() {
      return readNumberEnv("PORT", 3000);
    },
    get publicBaseUrl() {
      return readEnv("PUBLIC_BASE_URL");
    },
  },
  session: {
    get cookieName() {
      return readEnv("SESSION_COOKIE_NAME") || "zeno.sid";
    },
    get secret() {
      return readEnv("SESSION_SECRET");
    },
    get maxAgeMs() {
      return readNumberEnv("SESSION_MAX_AGE_MS", 1000 * 60 * 60 * 24);
    },
  },
  mongodb: {
    get uri() {
      return readEnv("MONGODB_URI");
    },
    get dbName() {
      return readEnv("MONGODB_DB_NAME");
    },
  },
  ai: {
    get googleApiKey() {
      return readEnv("GOOGLE_GENERATIVE_AI_API_KEY");
    },
    get model() {
      return readEnv("GOOGLE_MODEL");
    },
    get embeddingModel() {
      return readEnv("GOOGLE_EMBEDDING_MODEL");
    },
  },
};

function validateRuntimeConfig() {
  readEnv("SESSION_SECRET", { required: true });
  readEnv("MONGODB_URI", { required: true });
  readEnv("MONGODB_DB_NAME", { required: true });
  readEnv("GOOGLE_GENERATIVE_AI_API_KEY", { required: true });
  readEnv("GOOGLE_MODEL", { required: true });
  readEnv("GOOGLE_EMBEDDING_MODEL", { required: true });
}

export { config, validateRuntimeConfig };
