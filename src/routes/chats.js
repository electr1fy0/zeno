import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db/db.js";
import { getAssistantReply } from "../lib/ai.js";

const chatRouter = express.Router();

function requireAuth(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return req.session.userId;
}

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function readMessage(body) {
  if (!body || typeof body.message !== "string") {
    return null;
  }

  return body.message.trim() || null;
}

function buildChatTitle(message) {
  const title = message.trim().replace(/\s+/g, " ");
  return title.length > 48 ? title.slice(0, 48).trimEnd() + "..." : title;
}

function toChatResponse(chat) {
  return {
    _id: chat._id.toHexString(),
    title: chat.title,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messages: (chat.messages || []).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
}

chatRouter.get("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) {
    return;
  }

  const chats = await getDb()
    .collection("chats")
    .find({ userId: new ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .project({ title: 1, createdAt: 1, updatedAt: 1 })
    .toArray();

  res.json(
    chats.map((chat) => ({
      _id: chat._id.toHexString(),
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    })),
  );
});

chatRouter.get("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) {
    return;
  }

  const chatId = parseId(req.params.id);
  if (!chatId) {
    res.status(400).json({ error: "Invalid chat id" });
    return;
  }

  const chat = await getDb()
    .collection("chats")
    .findOne({
      _id: chatId,
      userId: new ObjectId(userId),
    });

  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  res.json(toChatResponse(chat));
});

chatRouter.post("/", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) {
    return;
  }

  const message = readMessage(req.body);
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    const now = new Date();
    const userMessage = { role: "user", content: message };
    const assistantMessage = {
      role: "assistant",
      content: await getAssistantReply([userMessage], userId),
    };
    const title = buildChatTitle(message);

    const result = await getDb()
      .collection("chats")
      .insertOne({
        userId: new ObjectId(userId),
        title,
        messages: [userMessage, assistantMessage],
        createdAt: now,
        updatedAt: now,
      });

    const chat = await getDb()
      .collection("chats")
      .findOne({ _id: result.insertedId });
    res.status(201).json(toChatResponse(chat));
  } catch (error) {
    console.error("Failed to create chat", error);
    res.status(500).json({ error: "Could not start chat." });
  }
});

chatRouter.post("/:id/messages", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) {
    return;
  }

  const chatId = parseId(req.params.id);
  if (!chatId) {
    res.status(400).json({ error: "Invalid chat id" });
    return;
  }

  const message = readMessage(req.body);
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const db = getDb();
  const chat = await db.collection("chats").findOne({
    _id: chatId,
    userId: new ObjectId(userId),
  });

  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  try {
    const userMessage = { role: "user", content: message };
    const assistantMessage = {
      role: "assistant",
      content: await getAssistantReply(
        [...(chat.messages || []), userMessage],
        userId,
      ),
    };

    const setFields = {
      updatedAt: new Date(),
    };

    if (!chat.title) {
      setFields.title = buildChatTitle(message);
    }

    const updatedChat = await db.collection("chats").findOneAndUpdate(
      {
        _id: chatId,
        userId: new ObjectId(userId),
      },
      {
        $set: setFields,
        $push: {
          messages: {
            $each: [userMessage, assistantMessage],
          },
        },
      },
      { returnDocument: "after" },
    );

    res.json(toChatResponse(updatedChat));
  } catch (error) {
    console.error("Failed to append chat message", error);
    res.status(500).json({ error: "Could not send message." });
  }
});

chatRouter.delete("/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) {
    return;
  }

  const chatId = parseId(req.params.id);
  if (!chatId) {
    res.status(400).json({ error: "Invalid chat id" });
    return;
  }

  const result = await getDb()
    .collection("chats")
    .deleteOne({
      _id: chatId,
      userId: new ObjectId(userId),
    });

  if (!result.deletedCount) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  res.status(204).end();
});

export { chatRouter };
