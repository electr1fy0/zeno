import { MongoClient } from "mongodb";
import { config } from "../config.js";

let client = null;
let db = null;

async function connectDb() {
  client = new MongoClient(config.mongodb.uri);
  await client.connect();
  db = client.db(config.mongodb.dbName);
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }

  return db;
}

export { connectDb, getDb };
