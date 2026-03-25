import "dotenv/config";
import { app } from "./app";
import { connectDb } from "./db/db";

async function main() {
  await connectDb();

  const port = Number(Bun.env.PORT ?? 3000);

  Bun.serve({
    fetch: app.fetch,
    port,
    idleTimeout: 255,
  });

  console.log(`running on http://localhost:${port}`);
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
