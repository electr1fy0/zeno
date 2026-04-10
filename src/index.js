import { createApp } from "./app.js";
import { config, validateRuntimeConfig } from "./config.js";
import { connectDb } from "./db/db.js";

async function main() {
  validateRuntimeConfig();
  await connectDb();
  const app = createApp();

  app.listen(config.app.port, () => {
    const baseUrl = config.app.publicBaseUrl || `http://localhost:${config.app.port}`;
    console.log("Server running on " + baseUrl);
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
