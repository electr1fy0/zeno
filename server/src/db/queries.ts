import { ObjectId, OptionalId } from "mongodb";
import { Chat } from "../types/types";
import { getDb } from "./db";
import { ModelMessage } from "ai";

export async function getChatById(id: string): Promise<Chat> {
  const db = getDb();

  const chat = await db
    .collection<Chat>("chats")
    .findOne({ _id: new ObjectId(id) });
  if (!chat) throw Error("failed to get chat by id");

  return chat;
}

export async function setTitleForChatById(id: ObjectId, title: string) {
  const db = getDb();
  await db
    .collection("chats")
    .updateOne({ _id: id }, { $set: { title: title } });
}

export async function appendToChatById(id: ObjectId, message: ModelMessage) {
  const db = getDb();

  await db.collection<Chat>("chats").updateOne(
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

  return await db.collection<Chat>("chats").find({}).toArray();
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
