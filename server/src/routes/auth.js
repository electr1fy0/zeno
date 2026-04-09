import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../db/db.js";

const authRouter = express.Router();

function readCredentials(body) {
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function toPublicUser(user) {
  return {
    id: user._id.toHexString(),
    username: user.username,
  };
}

authRouter.post("/register", async (req, res) => {
  const credentials = readCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const db = getDb();
  const users = db.collection("users");
  const existingUser = await users.findOne({ username: credentials.username });
  if (existingUser) {
    res.status(409).json({ error: "Username is already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(credentials.password, 10);
  const createdAt = new Date();
  const result = await users.insertOne({
    username: credentials.username,
    passwordHash,
    createdAt,
  });

  req.session.userId = result.insertedId.toHexString();
  req.session.username = credentials.username;

  res.status(201).json({
    user: {
      id: result.insertedId.toHexString(),
      username: credentials.username,
    },
  });
});

authRouter.post("/login", async (req, res) => {
  const credentials = readCredentials(req.body);
  if (!credentials) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const db = getDb();
  const user = await db.collection("users").findOne({
    username: credentials.username,
  });

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.userId = user._id.toHexString();
  req.session.username = user.username;

  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }

    res.clearCookie("zeno.sid");
    res.status(204).end();
  });
});

authRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDb();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(req.session.userId),
  });

  if (!user) {
    req.session.destroy(() => undefined);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ user: toPublicUser(user) });
});

export { authRouter };
