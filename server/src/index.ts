import express, { Router } from "express";
import "dotenv/config";
import { connectDb, getDb } from "./db/db";
import { router } from "./routes/routes";

async function main() {
  await connectDb();

  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    next();
  });

  app.options("/", (req, res) => {
    res.sendStatus(204);
  });
  app.use("/", router);

  app.listen(3000, () => console.log("running..."));
}

main();
