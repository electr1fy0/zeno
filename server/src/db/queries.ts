import { ObjectId, OptionalId } from "mongodb";
import { Chat } from "../types/types";
import { getDb } from "./db";
import { ModelMessage } from "ai";

export async function getChatById(id: string): Promise<Chat> {
  const db = getDb();
  const chat = await db.collection<Chat>("chat").findOne({ chatId: id });

  if (!chat) throw Error("failed to get chat by id");

  return chat;
}

export async function setTitleForChatById(id: string, title: string) {
  const db = getDb();
  await db
    .collection("chat")
    .updateOne({ _id: new ObjectId(id) }, { title: title });
}

export async function appendToChatById(id: string, message: ModelMessage) {
  const db = getDb();

  await db.collection<Chat>("chat").updateOne(
    { _id: id },
    {
      $push: {
        messages: {
          ...message,
        },
      },
    },
  );
}

export async function getChatsHistory(): Promise<Chat[]> {
  const db = getDb();

  return await db.collection<Chat>("chat").find({}).toArray();
}

export async function createNewChat(msg: ModelMessage): Promise<Chat> {
  const db = getDb();

  const insertedDoc = await db.collection<OptionalId<Chat>>("chats").insertOne({
    messages: [msg],
  });

  const mongoChat = await db
    .collection<Chat>("chats")
    .findOne({ _id: insertedDoc.insertedId });

  if (!mongoChat) {
    throw new Error("Failed to fetch newly created chat");
  }

  return mongoChat;
}
