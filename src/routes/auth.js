import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../db/db.js";

const authRouter = express.Router();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongPassword(value) {
  return (
    value.length >= 8 &&
    /[0-9]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function readCredentials(body) {
  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return { error: "Email and password are required" };
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (!email || !password.trim()) {
    return { error: "Email and password are required" };
  }

  if (!isEmail(email)) {
    return { error: "Enter a valid email" };
  }

  return { email, password };
}

function toPublicUser(user) {
  return {
    id: user._id.toHexString(),
    email: user.email,
  };
}

function clearSession(req, res) {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: "Failed to clear session" });
      return;
    }

    res.clearCookie("zeno.sid");
    res.status(204).end();
  });
}

authRouter.post("/register", async (req, res) => {
  const credentials = readCredentials(req.body);
  if (credentials.error) {
    res.status(400).json({ error: credentials.error });
    return;
  }

  if (!isStrongPassword(credentials.password)) {
    res.status(400).json({
      error:
        "Password needs 8+ characters, a number, uppercase, lowercase, and a symbol.",
    });
    return;
  }

  const db = getDb();
  const users = db.collection("users");
  const existingUser = await users.findOne({ email: credentials.email });
  if (existingUser) {
    res.status(409).json({ error: "Email is already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(credentials.password, 10);
  const createdAt = new Date();
  const result = await users.insertOne({
    email: credentials.email,
    passwordHash,
    createdAt,
  });

  req.session.userId = result.insertedId.toHexString();
  req.session.email = credentials.email;

  res.status(201).json({
    user: {
      id: result.insertedId.toHexString(),
      email: credentials.email,
    },
  });
});

authRouter.post("/login", async (req, res) => {
  const credentials = readCredentials(req.body);
  if (credentials.error) {
    res.status(400).json({ error: credentials.error });
    return;
  }

  const db = getDb();
  const user = await db.collection("users").findOne({
    email: credentials.email,
  });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValidPassword = await bcrypt.compare(
    credentials.password,
    user.passwordHash,
  );
  if (!isValidPassword) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user._id.toHexString();
  req.session.email = user.email;

  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  clearSession(req, res);
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

authRouter.delete("/account", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = new ObjectId(req.session.userId);
  const db = getDb();

  await db.collection("chats").deleteMany({ userId });
  await db.collection("notes").deleteMany({ userId });
  await db.collection("users").deleteOne({ _id: userId });

  clearSession(req, res);
});

export { authRouter };
