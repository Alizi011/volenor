import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

// Users table (from auth)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Documents
export const documents = mysqlTable("documents", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  size: bigint("size", { mode: "number", unsigned: true }).default(0),
  type: mysqlEnum("type", ["pdf", "image", "doc"]).default("pdf").notNull(),
  tags: text("tags"),
  notes: text("notes"),
  fileData: text("fileData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Tasks
export const tasks = mysqlTable("tasks", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["invoice", "signature", "scan", "other"]).default("other").notNull(),
  dueDate: varchar("dueDate", { length: 10 }).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "done", "archived"]).default("new").notNull(),
  tags: text("tags"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Inbox Items
export const inboxItems = mysqlTable("inbox_items", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  size: bigint("size", { mode: "number", unsigned: true }).default(0),
  type: mysqlEnum("type", ["pdf", "image", "doc"]).default("pdf").notNull(),
  fileData: text("fileData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InboxItem = typeof inboxItems.$inferSelect;
export type InsertInboxItem = typeof inboxItems.$inferInsert;

// Finance Entries
export const financeEntries = mysqlTable("finance_entries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  amount: bigint("amount", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).default("expense").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["paid", "pending", "overdue"]).default("pending").notNull(),
  notes: text("notes"),
  isRecurring: int("isRecurring", { unsigned: true }).default(0),
  recurringInterval: varchar("recurringInterval", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinanceEntry = typeof financeEntries.$inferSelect;
export type InsertFinanceEntry = typeof financeEntries.$inferInsert;

// Budgets
export const budgets = mysqlTable("budgets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  monthlyLimit: bigint("monthlyLimit", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// Debt Cases
export const debtCases = mysqlTable("debt_cases", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  creditor: varchar("creditor", { length: 255 }).notNull(),
  originalAmount: bigint("originalAmount", { mode: "number", unsigned: true }).notNull(),
  currentAmount: bigint("currentAmount", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["open", "negotiating", "payment_plan", "legal", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  memberId: varchar("memberId", { length: 50 }),
  documentIds: text("documentIds"),
  interestRate: int("interestRate", { unsigned: true }),
  dueDate: varchar("dueDate", { length: 10 }),
  referenceNumber: varchar("referenceNumber", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  closedAt: timestamp("closedAt"),
});

export type DebtCase = typeof debtCases.$inferSelect;
export type InsertDebtCase = typeof debtCases.$inferInsert;

// Debt Notes
export const debtNotes = mysqlTable("debt_notes", {
  id: serial("id").primaryKey(),
  debtCaseId: bigint("debtCaseId", { mode: "number", unsigned: true }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtNote = typeof debtNotes.$inferSelect;
export type InsertDebtNote = typeof debtNotes.$inferInsert;

// Communications
export const communications = mysqlTable("communications", {
  id: serial("id").primaryKey(),
  debtCaseId: bigint("debtCaseId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["letter", "email", "phone", "meeting", "sms", "other"]).default("other").notNull(),
  direction: mysqlEnum("direction", ["sent", "received"]).default("received").notNull(),
  date: varchar("date", { length: 30 }).notNull(),
  description: text("description").notNull(),
  documentIds: text("documentIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = typeof communications.$inferInsert;

// Family Members
export const familyMembers = mysqlTable("family_members", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  relation: varchar("relation", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  notes: text("notes"),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;

// Custom Categories
export const customCategories = mysqlTable("custom_categories", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomCategory = typeof customCategories.$inferSelect;
export type InsertCustomCategory = typeof customCategories.$inferInsert;

// User Settings
export const userSettings = mysqlTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  theme: mysqlEnum("theme", ["dark", "light"]).default("dark").notNull(),
  language: varchar("language", { length: 10 }).default("nb").notNull(),
  lastVisited: timestamp("lastVisited").defaultNow().notNull(),
});

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;
