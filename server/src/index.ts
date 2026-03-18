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

interface Chat {
  messages: ModelMessage[];
}

let chat: Chat = {
  messages: [
    {
      role: "system",
      content: "dont use any markdown formatting in your output",
    },
  ],
};

async function getResponse(msg: string): Promise<string> {
  chat.messages.push({ role: "user", content: msg });
  const { text, reasoning } = await generateText({
    model: model,
    prompt: chat.messages,
  });
  chat.messages.push({ role: "assistant", content: text });

  return text;
}

const app = express();

app.use(express.json());

app.post("/chat/:id", async (req, res) => {
  const { message } = req.body;
  console.log(message);
  const aiResp = await getResponse(message);
  res.send(aiResp);
});

app.listen(3000, () => console.log("running..."));
