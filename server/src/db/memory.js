import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

function toObjectId(userId) {
  return new ObjectId(userId);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNoteSummary(note) {
  return {
    id: note._id.toHexString(),
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function toTaskSummary(task) {
  return {
    id: task._id.toHexString(),
    title: task.title,
    done: Boolean(task.done),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function createNote(userId, content) {
  const db = getDb();
  const now = new Date();
  const result = await db.collection("notes").insertOne({
    userId: toObjectId(userId),
    content,
    createdAt: now,
    updatedAt: now,
  });

  const note = await db.collection("notes").findOne({ _id: result.insertedId });
  return toNoteSummary(note);
}

async function listNotes(userId) {
  const notes = await getDb()
    .collection("notes")
    .find({ userId: toObjectId(userId) })
    .sort({ updatedAt: -1 })
    .toArray();

  return notes.map(toNoteSummary);
}

async function createTask(userId, title) {
  const db = getDb();
  const now = new Date();
  const result = await db.collection("tasks").insertOne({
    userId: toObjectId(userId),
    title,
    done: false,
    createdAt: now,
    updatedAt: now,
  });

  const task = await db.collection("tasks").findOne({ _id: result.insertedId });
  return toTaskSummary(task);
}

async function listTasks(userId) {
  const tasks = await getDb()
    .collection("tasks")
    .find({ userId: toObjectId(userId) })
    .sort({ done: 1, updatedAt: -1 })
    .toArray();

  return tasks.map(toTaskSummary);
}

async function findMatchingDocument(collectionName, userId, fieldName, query) {
  const collection = getDb().collection(collectionName);
  const trimmedQuery = query.trim();
  const userObjectId = toObjectId(userId);

  if (ObjectId.isValid(trimmedQuery)) {
    const byId = await collection.findOne({
      _id: new ObjectId(trimmedQuery),
      userId: userObjectId,
    });

    if (byId) {
      return { status: "matched", document: byId };
    }
  }

  const exactRegex = new RegExp("^" + escapeRegex(trimmedQuery) + "$", "i");
  const exactMatches = await collection
    .find({
      userId: userObjectId,
      [fieldName]: exactRegex,
    })
    .limit(5)
    .toArray();

  if (exactMatches.length === 1) {
    return { status: "matched", document: exactMatches[0] };
  }

  if (exactMatches.length > 1) {
    return {
      status: "ambiguous",
      matches: exactMatches,
    };
  }

  const containsRegex = new RegExp(escapeRegex(trimmedQuery), "i");
  const partialMatches = await collection
    .find({
      userId: userObjectId,
      [fieldName]: containsRegex,
    })
    .limit(5)
    .toArray();

  if (partialMatches.length === 1) {
    return { status: "matched", document: partialMatches[0] };
  }

  if (partialMatches.length > 1) {
    return {
      status: "ambiguous",
      matches: partialMatches,
    };
  }

  return { status: "not_found" };
}

async function deleteNote(userId, query) {
  const match = await findMatchingDocument("notes", userId, "content", query);

  if (match.status !== "matched") {
    return {
      status: match.status,
      matches: (match.matches || []).map(toNoteSummary),
    };
  }

  await getDb().collection("notes").deleteOne({ _id: match.document._id });

  return {
    status: "deleted",
    note: toNoteSummary(match.document),
  };
}

async function setTaskDoneState(userId, query, done) {
  const match = await findMatchingDocument("tasks", userId, "title", query);

  if (match.status !== "matched") {
    return {
      status: match.status,
      matches: (match.matches || []).map(toTaskSummary),
    };
  }

  const updatedTask = await getDb().collection("tasks").findOneAndUpdate(
    { _id: match.document._id },
    {
      $set: {
        done,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  return {
    status: "updated",
    task: toTaskSummary(updatedTask),
  };
}

async function deleteTask(userId, query) {
  const match = await findMatchingDocument("tasks", userId, "title", query);

  if (match.status !== "matched") {
    return {
      status: match.status,
      matches: (match.matches || []).map(toTaskSummary),
    };
  }

  await getDb().collection("tasks").deleteOne({ _id: match.document._id });

  return {
    status: "deleted",
    task: toTaskSummary(match.document),
  };
}

export {
  createNote,
  listNotes,
  deleteNote,
  createTask,
  listTasks,
  setTaskDoneState,
  deleteTask,
};
