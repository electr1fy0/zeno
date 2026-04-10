import { ObjectId } from "mongodb";
import { cosineSimilarity } from "ai";
import { getDb } from "./db.js";

function toObjectId(userId) {
  return new ObjectId(userId);
}

function toNoteSummary(note) {
  return {
    id: note._id.toHexString(),
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function toStoredEmbedding(embedding) {
  return embedding.map(Number) | null;
}

async function createNote(userId, content, embedding) {
  const db = getDb();
  const now = new Date();
  const result = await db.collection("notes").insertOne({
    userId: toObjectId(userId),
    content,
    embedding: toStoredEmbedding(embedding),
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

async function searchNotes(userId, query, queryEmbedding) {
  const embedding = toStoredEmbedding(queryEmbedding);
  void query;

  if (!embedding || embedding.length === 0) {
    return [];
  }

  const notes = await getDb()
    .collection("notes")
    .find({
      userId: toObjectId(userId),
      embedding: { $type: "array" },
    })
    .toArray();

  return notes
    .map((note) => ({
      note,
      score:
        Array.isArray(note.embedding) &&
        note.embedding.length === embedding.length
          ? cosineSimilarity(embedding, note.embedding)
          : -1,
    }))
    .filter((entry) => Number.isFinite(entry.score) && entry.score > 0.15)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((entry) => ({
      ...toNoteSummary(entry.note),
      score: Number(entry.score.toFixed(3)),
    }));
}

async function findMatchingDocument(collectionName, userId, fieldName, query) {
  const collection = getDb().collection(collectionName);
  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();
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

  const documents = await collection
    .find({
      userId: userObjectId,
    })
    .limit(50)
    .toArray();

  const exactMatches = documents.filter((document) => {
    const value = String(document[fieldName] || "").trim().toLowerCase();
    return value === lowerQuery;
  });

  if (exactMatches.length === 1) {
    return { status: "matched", document: exactMatches[0] };
  }

  if (exactMatches.length > 1) {
    return {
      status: "ambiguous",
      matches: exactMatches,
    };
  }

  const partialMatches = documents.filter((document) => {
    const value = String(document[fieldName] || "").toLowerCase();
    return value.indexOf(lowerQuery) !== -1;
  });

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

export { createNote, listNotes, searchNotes, deleteNote };
