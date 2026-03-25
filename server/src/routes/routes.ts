import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  appendToChatById,
  createNewChat,
  getChatById,
  getChatsHistory,
  setTitleForChatById,
} from "../db/queries";
import { getTitle, streamAiReply } from "../lib/lib";
import { ModelMessage } from "ai";
import { ObjectId } from "mongodb";

const router = new Hono();

type MessageBody = {
  message?: unknown;
};

type StreamEvent =
  | { type: "meta"; chatId: string }
  | { type: "chunk"; text: string }
  | { type: "done"; title?: string };

function requireObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new HTTPException(400, { message: "Invalid chat id" });
  }

  return new ObjectId(id);
}

async function requireMessage(c: Context): Promise<string> {
  let body: MessageBody;

  try {
    body = (await c.req.json()) as MessageBody;
  } catch {
    throw new HTTPException(400, { message: "Invalid JSON body" });
  }

  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    throw new HTTPException(400, { message: "Message is required" });
  }

  return body.message.trim();
}

async function getChatOrThrow(id: string) {
  const chat = await getChatById(id);

  if (!chat) {
    throw new HTTPException(404, { message: "Chat not found" });
  }

  return chat;
}

function streamEvents(
  producer: (send: (event: StreamEvent) => void) => Promise<void>,
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        await producer(send);
      } catch (error) {
        controller.error(error);
        return;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

// Sends the entire chat
router.get("/chat/:id", async (c) => {
  const id = c.req.param("id");
  const chat = await getChatOrThrow(id);
  return c.json(chat);
});

// new chat
router.post("/chat", async (c) => {
  const message = await requireMessage(c);
  const wrappedMsg: ModelMessage = {
    role: "user",
    content: message,
  };
  const chat = await createNewChat(wrappedMsg);
  const chatId = chat._id.toHexString();

  return streamEvents(async (send) => {
    send({ type: "meta", chatId });

    let fullReply = "";
    for await (const chunk of streamAiReply([wrappedMsg])) {
      fullReply += chunk;
      send({ type: "chunk", text: chunk });
    }

    const wrappedReply: ModelMessage = {
      role: "assistant",
      content: fullReply,
    };

    await appendToChatById(chat._id, wrappedReply);

    let title: string | undefined;
    if (!chat.title) {
      title = await getTitle(message);
      await setTitleForChatById(chat._id, title);
    }

    send({ type: "done", title });
  });
});

// Inserts a message and Ai reply into the chat one by one
// Sets title if none yet
// Sends reply
router.post("/chat/:id", async (c) => {
  const chatId = requireObjectId(c.req.param("id"));
  const message = await requireMessage(c);

  const wrappedMsg: ModelMessage = {
    role: "user",
    content: message,
  };

  await appendToChatById(chatId, wrappedMsg);

  const chat = await getChatOrThrow(chatId.toHexString());

  return streamEvents(async (send) => {
    let title: string | undefined;
    if (!chat.title) {
      title = await getTitle(message);
      await setTitleForChatById(chatId, title);
    }

    let fullReply = "";
    for await (const chunk of streamAiReply(chat.messages)) {
      fullReply += chunk;
      send({ type: "chunk", text: chunk });
    }

    const wrappedReply: ModelMessage = {
      role: "assistant",
      content: fullReply,
    };

    await appendToChatById(chatId, wrappedReply);

    send({ type: "done", title });
  });
});

// Returns all chats
router.get("/history", async (c) => {
  const chatsHistory = await getChatsHistory();

  return c.json(chatsHistory);
});

router.get("/meow", (c) => c.text("meow"));

export { router };
