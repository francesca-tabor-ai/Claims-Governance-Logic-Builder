import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, documents, InsertDocument, generations, InsertGeneration, validations, InsertValidation, metrics, InsertMetric } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Document queries
export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return result;
}

export async function getDocumentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(documents.createdAt);
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function updateDocument(id: number, updates: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(documents).set(updates).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(documents).where(eq(documents.id, id));
}

// Generation queries
export async function createGeneration(gen: InsertGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generations).values(gen);
  return result;
}

export async function getGenerationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(generations).where(eq(generations.userId, userId)).orderBy(generations.createdAt);
}

export async function getGenerationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  return result[0];
}

export async function updateGeneration(id: number, updates: Partial<InsertGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(generations).set(updates).where(eq(generations.id, id));
}

// Validation queries
export async function createValidation(val: InsertValidation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(validations).values(val);
  return result;
}

export async function getValidationByGenerationId(generationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(validations).where(eq(validations.generationId, generationId)).limit(1);
  return result[0];
}

// Metrics queries
export async function createMetric(metric: InsertMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(metrics).values(metric);
  return result;
}

export async function getMetricsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(metrics).where(eq(metrics.userId, userId)).orderBy(metrics.createdAt);
}
