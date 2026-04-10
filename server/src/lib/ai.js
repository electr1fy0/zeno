import { google } from "@ai-sdk/google";
import { embed, generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createNote, listNotes, searchNotes, deleteNote } from "../db/memory.js";

const model = google(
  process.env.GOOGLE_MODEL ?? "gemini-3.1-flash-lite-preview",
);
const embeddingModel = google.embedding(
  process.env.GOOGLE_EMBEDDING_MODEL ?? "gemini-embedding-001",
);

const MEMORY_SYSTEM_PROMPT = `
You are Zeno, a helpful assistant with tools for personal notes.

Rules:
- Use note tools only when the user explicitly asks to remember, save, add, list, show, or delete a note.
- Do not store memories proactively from casual conversation.
- Use semantic note search when the user asks what you remember about a topic or asks you to recall something specific.
- If a tool reports ambiguous matches, ask the user to clarify which one they mean.
- If the user asks to list notes, present them neatly as concise bullets.
- Keep replies clear and concise unless the user asks for more detail.
`.trim();

async function getChatTitle(message) {
  const { text } = await generateText({
    model,
    prompt:
      "Return only a short chat title under six words for this user message: " +
      message,
  });

  return text.trim().replace(/^["']|["']$/g, "") || "New chat";
}

async function getEmbedding(text) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });

  return embedding;
}

function buildTools(userId) {
  return {
    create_note: tool({
      description: "Save a personal note for the current user.",
      inputSchema: z.object({
        content: z.string().min(1).describe("The note content to store."),
      }),
      execute: async ({ content }) => ({
        status: "created",
        note: await createNote(userId, content.trim(), await getEmbedding(content.trim())),
      }),
    }),
    list_notes: tool({
      description: "List the current user's saved notes.",
      inputSchema: z.object({}),
      execute: async () => ({
        status: "listed",
        notes: await listNotes(userId),
      }),
    }),
    search_notes: tool({
      description:
        "Find the saved notes most relevant to a topic or question using semantic similarity.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The topic, phrase, or question to search notes for."),
      }),
      execute: async ({ query }) => ({
        status: "searched",
        query,
        notes: await searchNotes(userId, query.trim(), await getEmbedding(query.trim())),
      }),
    }),
    delete_note: tool({
      description: "Delete a saved note by id or matching content.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The note id or note text to delete."),
      }),
      execute: async ({ query }) => deleteNote(userId, query),
    }),
  };
}

function formatList(items, renderItem) {
  return items
    .map((item, index) => `${index + 1}. ${renderItem(item)}`)
    .join("\n");
}

function formatToolFallback(steps) {
  const toolResults = steps.flatMap((step) => step.toolResults || []);

  if (!toolResults.length) {
    return "I couldn't complete that request.";
  }

  const lastResult = toolResults[toolResults.length - 1];
  const output = lastResult.output || {};

  switch (lastResult.toolName) {
    case "create_note":
      return `Saved note: ${output.note.content}`;
    case "list_notes":
      if (!output.notes || output.notes.length === 0) {
        return "You don't have any saved notes yet.";
      }

      return `Here are your notes:\n${formatList(output.notes, (note) => note.content)}`;
    case "search_notes":
      if (!output.notes || output.notes.length === 0) {
        return "I couldn't find any saved notes related to that.";
      }

      return `Here’s what I found in your notes:\n${formatList(
        output.notes,
        (note) => note.content,
      )}`;
    case "delete_note":
      if (output.status === "deleted" && output.note) {
        return `Deleted note: ${output.note.content}`;
      }
      if (output.status === "ambiguous" && output.matches?.length) {
        return `I found multiple matching notes:\n${formatList(output.matches, (note) => `${note.id}: ${note.content}`)}\nReply with the exact note text or id to delete.`;
      }
      return "I couldn't find a matching note to delete.";
    default:
      return "Done.";
  }
}

async function getAssistantReply(messages, userId) {
  const result = await generateText({
    model,
    system: MEMORY_SYSTEM_PROMPT,
    messages,
    tools: buildTools(userId),
    stopWhen: stepCountIs(5),
  });

  const text = result.text.trim();
  if (text) {
    return text;
  }

  return formatToolFallback(result.steps);
}

export { getAssistantReply, getChatTitle };
