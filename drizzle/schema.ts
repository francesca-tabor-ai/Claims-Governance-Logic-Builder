import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents table for storing ADRs, governance rules, and platform standards
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["adr", "governance", "standard", "other"]).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  vectorized: tinyint("vectorized").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Generations table for tracking code generation runs
 */
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  contextQuery: text("contextQuery").notNull(),
  cotReasoning: text("cotReasoning"),
  generatedCode: text("generatedCode"),
  generatedTests: text("generatedTests"),
  status: mysqlEnum("status", ["pending", "reasoning", "generating", "validating", "completed", "failed"]).default("pending").notNull(),
  generationTimeMs: int("generationTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

/**
 * Validations table for test results and compliance checks
 */
export const validations = mysqlTable("validations", {
  id: int("id").autoincrement().primaryKey(),
  generationId: int("generationId").notNull(),
  testsPassed: tinyint("testsPassed").default(0).notNull(),
  testCoverage: int("testCoverage").default(0).notNull(),
  adrCompliant: tinyint("adrCompliant").default(0).notNull(),
  cpApViolations: int("cpApViolations").default(0).notNull(),
  piiMaskingEnforced: tinyint("piiMaskingEnforced").default(0).notNull(),
  validationDetails: text("validationDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Validation = typeof validations.$inferSelect;
export type InsertValidation = typeof validations.$inferInsert;

/**
 * Metrics table for tracking success metrics over time
 */
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  totalGenerations: int("totalGenerations").default(0).notNull(),
  successfulGenerations: int("successfulGenerations").default(0).notNull(),
  averageTestCoverage: int("averageTestCoverage").default(0).notNull(),
  determinismRate: int("determinismRate").default(0).notNull(),
  averageGenerationTimeMs: int("averageGenerationTimeMs").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;