import express from "express";
import { embed, type ModelMessage } from "ai";
import "dotenv/config";
import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { generateText } from "ai";
import "dotenv/config";

// const model = google.embedding("gemini-embedding-2-preview");
const model = google("gemini-3.1-flash-lite-preview");

// const { embedding } = await embed({
//   model,
//   value: "such a nice day it is",
// });

type Chat = {
  id: number;
  messages: ModelMessage[];
};

let chats: Record<number, Chat> = {};

async function getResponse(chatId: number, msg: string): Promise<string> {
  let chat: Chat = chats[chatId];
  console.log(chat);
  chat.messages.push({ role: "user", content: msg });

  const { text, reasoning } = await generateText({
    model: model,
    messages: chat.messages,
  });

  chat.messages.push({ role: "assistant", content: text });

  return text;
}

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  next();
});
app.options("/chat/:id", (req, res) => {
  if (req.method == "OPTIONS") {
    res.sendStatus(204);
  }
});

app.post("/chat/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const { message } = req.body;
  console.log(message, id);
  console.log("chat: ", chats[id]);
  const aiResp = await getResponse(id, message);
  res.send(aiResp);
});
app.get("/chat", (req, res) => {
  let id = Math.floor(Math.random() * 100);
  console.log("id:", id);
  chats[id] = {
    id: id,
    messages: [
      {
        role: "system",
        content: "dont use any markdown formatting in your output",
      },
    ],
  };
  res.send(id);
  console.log(chats);
});

app.listen(3000, () => console.log("running..."));
