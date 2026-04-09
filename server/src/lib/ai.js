import { google } from "@ai-sdk/google";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import {
  createNote,
  listNotes,
  deleteNote,
  createTask,
  listTasks,
  setTaskDoneState,
  deleteTask,
} from "../db/memory.js";

const model = google(
  process.env.GOOGLE_MODEL ?? "gemini-3.1-flash-lite-preview",
);

const MEMORY_SYSTEM_PROMPT = `
You are Zeno, a helpful assistant with tools for personal notes and tasks.

Rules:
- Use note/task tools only when the user explicitly asks to remember, save, add, list, show, complete, reopen, or delete a note/task.
- Do not store memories proactively from casual conversation.
- Prefer notes for memory/fact storage and tasks for action items the user explicitly wants tracked.
- If a tool reports ambiguous matches, ask the user to clarify which one they mean.
- If the user asks to list tasks, present them neatly as checklist-style bullets.
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

function buildTools(userId) {
  return {
    create_note: tool({
      description: "Save a personal note for the current user.",
      inputSchema: z.object({
        content: z.string().min(1).describe("The note content to store."),
      }),
      execute: async ({ content }) => ({
        status: "created",
        note: await createNote(userId, content.trim()),
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
    create_task: tool({
      description: "Create a task for the current user.",
      inputSchema: z.object({
        title: z.string().min(1).describe("The task title."),
      }),
      execute: async ({ title }) => ({
        status: "created",
        task: await createTask(userId, title.trim()),
      }),
    }),
    list_tasks: tool({
      description: "List the current user's tasks.",
      inputSchema: z.object({}),
      execute: async () => ({
        status: "listed",
        tasks: await listTasks(userId),
      }),
    }),
    complete_task: tool({
      description: "Mark a task as complete using its id or title.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The task id or task title to mark complete."),
      }),
      execute: async ({ query }) => setTaskDoneState(userId, query, true),
    }),
    reopen_task: tool({
      description: "Mark a task as not done using its id or title.",
      inputSchema: z.object({
        query: z.string().min(1).describe("The task id or title to reopen."),
      }),
      execute: async ({ query }) => setTaskDoneState(userId, query, false),
    }),
    delete_task: tool({
      description: "Delete a task by id or title.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("The task id or task title to delete."),
      }),
      execute: async ({ query }) => deleteTask(userId, query),
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
    case "delete_note":
      if (output.status === "deleted" && output.note) {
        return `Deleted note: ${output.note.content}`;
      }
      if (output.status === "ambiguous" && output.matches?.length) {
        return `I found multiple matching notes:\n${formatList(output.matches, (note) => `${note.id}: ${note.content}`)}\nReply with the exact note text or id to delete.`;
      }
      return "I couldn't find a matching note to delete.";
    case "create_task":
      return `Added task: ${output.task.title}`;
    case "list_tasks":
      if (!output.tasks || output.tasks.length === 0) {
        return "You don't have any tasks yet.";
      }

      return `Here are your tasks:\n${formatList(
        output.tasks,
        (task) => `[${task.done ? "x" : " "}] ${task.title}`,
      )}`;
    case "complete_task":
      if (output.status === "updated" && output.task) {
        return `Marked task as done: ${output.task.title}`;
      }
      if (output.status === "ambiguous" && output.matches?.length) {
        return `I found multiple matching tasks:\n${formatList(output.matches, (task) => `${task.id}: ${task.title}`)}\nReply with the exact task title or id to complete.`;
      }
      return "I couldn't find a matching task to complete.";
    case "reopen_task":
      if (output.status === "updated" && output.task) {
        return `Reopened task: ${output.task.title}`;
      }
      if (output.status === "ambiguous" && output.matches?.length) {
        return `I found multiple matching tasks:\n${formatList(output.matches, (task) => `${task.id}: ${task.title}`)}\nReply with the exact task title or id to reopen.`;
      }
      return "I couldn't find a matching task to reopen.";
    case "delete_task":
      if (output.status === "deleted" && output.task) {
        return `Deleted task: ${output.task.title}`;
      }
      if (output.status === "ambiguous" && output.matches?.length) {
        return `I found multiple matching tasks:\n${formatList(output.matches, (task) => `${task.id}: ${task.title}`)}\nReply with the exact task title or id to delete.`;
      }
      return "I couldn't find a matching task to delete.";
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
