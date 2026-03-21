import { MongoClient, Db } from "mongodb";

const uri =
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.7.0";
let client: MongoClient;
let db: Db;

export async function connectDb() {
  client = new MongoClient(uri);
  await client.connect();

  db = client.db("meowdb");
}

export function getDb(): Db {
  if (!db) throw new Error("Db not initialized");
  return db;
}
