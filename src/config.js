import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  app: {
    env: process.env.NODE_ENV?.trim() || "development",
    port: Number(process.env.PORT) || 3000,
    publicBaseUrl: process.env.PUBLIC_BASE_URL?.trim() || "",
  },
  session: {
    cookieName: process.env.SESSION_COOKIE_NAME?.trim() || "zeno.sid",
    secret: process.env.SESSION_SECRET?.trim() || "",
    maxAgeMs: Number(process.env.SESSION_MAX_AGE_MS) || 1000 * 60 * 60 * 24,
  },
  mongodb: {
    uri: process.env.MONGODB_URI?.trim() || "",
    dbName: process.env.MONGODB_DB_NAME?.trim() || "",
  },
  ai: {
    googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || "",
    model: process.env.GOOGLE_MODEL?.trim() || "",
    embeddingModel: process.env.GOOGLE_EMBEDDING_MODEL?.trim() || "",
  },
};

export { config };
