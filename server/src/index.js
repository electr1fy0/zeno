import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDb } from "./db/db.js";

dotenv.config({ path: "server/.env" });

async function main() {
  await connectDb();

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log("Server running on http://localhost:" + port);
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
