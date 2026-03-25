import express from "express";
import {
  appendToChatById,
  createNewChat,
  getChatById,
  getChatsHistory,
  setTitleForChatById,
} from "../db/queries";
import { getAiReply, getTitle } from "../lib/lib";
import { ModelMessage } from "ai";
import { ObjectId } from "mongodb";

const router = express.Router();

// Sends the entire chat
router.get("/chat/:id", async (req, res) => {
  const id = req.params.id;
  const chat = await getChatById(id);

  console.log("chat:", chat);

  // if (!chat) {
  //   return res.status(404).json({ error: "chat not found" });
  // }
  console.log("sending");
  res.send(chat);
});

// new chat
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  const wrappedMsg: ModelMessage = {
    role: "user",
    content: message,
  };
  const chat = await createNewChat(wrappedMsg);

  const aiReply = await getAiReply([wrappedMsg]);

  const wrappedReply: ModelMessage = {
    role: "assistant",
    content: aiReply,
  };
  await appendToChatById(chat._id, wrappedReply);

  chat.messages.push(wrappedReply);
  res.json(chat);
});

// Inserts a message and Ai reply into the chat one by one
// Sets title if none yet
// Sends reply
router.post("/chat/:id", async (req, res) => {
  const id = req.params.id;
  const { message }: { message: string } = req.body;

  const wrappedMsg: ModelMessage = {
    role: "user",
    content: message,
  };

  await appendToChatById(new ObjectId(id), wrappedMsg);

  const chat = await getChatById(id);
  if (!chat) {
    return res.status(404).send("chat not found");
  }
  if (!chat.title) {
    const title = await getTitle(message);
    await setTitleForChatById(new ObjectId(id), title);
  }

  const aiReply = await getAiReply(chat.messages);

  const wrappedReply: ModelMessage = {
    role: "assistant",
    content: aiReply,
  };

  appendToChatById(id, wrappedReply);

  res.send(aiReply);
});

// Returns all chats
router.get("/history", async (req, res) => {
  let chatsHistory = await getChatsHistory();

  res.json(chatsHistory);
});

router.get("/meow", (req, res) => res.send("meow"));

export { router };
