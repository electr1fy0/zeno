import { ModelMessage } from "ai";

type Chat = {
  _id: string;
  title?: string;
  messages: ModelMessage[];
};

export { Chat };
