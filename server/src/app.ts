import { ModelMessage } from "ai";

type Chat = {
  id: number;
  title?: string;
  messages: ModelMessage[];
};

export { Chat };
