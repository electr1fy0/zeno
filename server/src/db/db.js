import { MongoClient } from "mongodb";

let client = null;
let db = null;

async function connectDb() {
  const uri =
    process.env.MONGODB_URI ??
    "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";
  const dbName = process.env.MONGODB_DB_NAME ?? "zeno";

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }

  return db;
}

export { connectDb, getDb };
