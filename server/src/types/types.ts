import { ModelMessage } from "ai";
import { ObjectId } from "mongodb";

type Chat = {
  _id: ObjectId;
  title?: string;
  messages: ModelMessage[];
};

export { Chat };
