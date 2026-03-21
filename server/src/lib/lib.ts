import { google } from "@ai-sdk/google";
import { generateText, ModelMessage } from "ai";
const model = google("gemini-3.1-flash-lite-preview");

const getTitle = async (msg: string): Promise<string> => {
  const { text } = await generateText({
    model: model,
    prompt:
      "give me a single short chat title without any formatting describing this whole following message: " +
      msg,
  });

  return text;
};

async function getAiReply(messages: ModelMessage[]): Promise<string> {
  const { text } = await generateText({
    model,
    messages,
  });

  return text;
}
export { getTitle, getAiReply };
