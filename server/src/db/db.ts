import { MongoClient, Db } from "mongodb";

const uri =
  Bun.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.7.0";
const dbName = Bun.env.MONGODB_DB_NAME ?? "meowdb";
let client: MongoClient;
let db: Db;

export async function connectDb() {
  client = new MongoClient(uri);
  await client.connect();

  db = client.db(dbName);
}

export function getDb(): Db {
  if (!db) throw new Error("Db not initialized");
  return db;
}
