import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  timestamp,
  int,
  decimal,
} from "drizzle-orm/mysql-core";

const id = () => int("id", { unsigned: true }).autoincrement().primaryKey();

// Users
export const users = mysqlTable("users", {
  id: id(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Households
export const households = mysqlTable("households", {
  id: id(),
  ownerUserId: int("ownerUserId", { unsigned: true }).notNull(), // Endret til int
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  maxFamilyMembers: int("maxFamilyMembers", { unsigned: true }).default(4).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

// Plans
export const plans = mysqlTable("plans", {
  id: id(),
  name: varchar("name", { length: 100 }).notNull(),
  priceMonthly: int("priceMonthly", { unsigned: true }).notNull(), // Endret til int
  includedUsers: int("includedUsers", { unsigned: true }).default(1).notNull(),
  includedFamilyMembers: int("includedFamilyMembers", { unsigned: true }).default(4).notNull(),
  isActive: int("isActive", { unsigned: true }).default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// Subscriptions
export const subscriptions = mysqlTable("subscriptions", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  planId: int("planId", { unsigned: true }).notNull(),           // Endret til int
  status: mysqlEnum("status", ["active", "past_due", "canceled", "manual_free", "inactive"]).default("inactive").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  grantedByAdmin: int("grantedByAdmin", { unsigned: true }).default(0).notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Family Members
export const familyMembers = mysqlTable("family_members", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  name: varchar("name", { length: 255 }).notNull(),
  relation: varchar("relation", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  notes: text("notes"),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;

// Documents
export const documents = mysqlTable("documents", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(),
  familyMemberId: int("familyMemberId", { unsigned: true }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default("Fakturaer").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  size: int("size", { unsigned: true }).default(0), // Endret til int
  type: mysqlEnum("type", ["pdf", "image", "doc"]).default("pdf").notNull(),
  tags: text("tags").default("[]").notNull(),
  notes: text("notes"),
  fileData: text("fileData"),
  amount: int("amount", { unsigned: true }).default(0),
  financeType: mysqlEnum("financeType", ["expense", "income", "none"]).default("none"),
  dueDate: varchar("dueDate", { length: 10 }),
  isPaid: int("isPaid", { unsigned: true }).default(0),
financialDocumentType: mysqlEnum("financialDocumentType", [
  "none",
  "expense",
  "income",
  "debt",
  "legal",
  "contract",
  "receipt",
  "insurance",
  "tax",
  "bank",
  "other",
]).default("none"),
financialCategory: varchar("financialCategory", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Tasks
export const tasks = mysqlTable("tasks", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  familyMemberId: int("familyMemberId", { unsigned: true }),     // Endret til int
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

// Calendar Events
export const calendarEvents = mysqlTable("calendar_events", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  color: varchar("color", { length: 50 }).default("#e8ff47"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// Inbox Items
export const inboxItems = mysqlTable("inbox_items", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  familyMemberId: int("familyMemberId", { unsigned: true }),     // Endret til int
  name: varchar("name", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  size: int("size", { unsigned: true }).default(0),               // Endret til int
  type: mysqlEnum("type", ["pdf", "image", "doc"]).default("pdf").notNull(),
  fileData: text("fileData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InboxItem = typeof inboxItems.$inferSelect;
export type InsertInboxItem = typeof inboxItems.$inferInsert;

// Finance Entries
export const financeEntries = mysqlTable("finance_entries", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  familyMemberId: int("familyMemberId", { unsigned: true }),     // Endret til int
  documentId: int("documentId", { unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  amount: int("amount", { unsigned: true }).notNull(),           // Endret til int
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

// Bank Statements
export const bankStatements = mysqlTable("bank_statements", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(),
  familyMemberId: int("familyMemberId", { unsigned: true }),
  name: varchar("name", { length: 255 }).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  periodStart: varchar("periodStart", { length: 10 }),
  periodEnd: varchar("periodEnd", { length: 10 }),
  fileData: text("fileData"),
  status: mysqlEnum("status", [
    "uploaded",
    "processing",
    "processed",
    "failed",
  ]).default("uploaded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bankAccounts = mysqlTable("bank_accounts", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(),
  familyMemberId: int("familyMemberId", { unsigned: true }),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  includeInAnalysis: int("includeInAnalysis", { unsigned: true })
    .default(1)
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

// Bank Transactions
export const bankTransactions = mysqlTable("bank_transactions", {
  id: id(),

  statementId: int("statementId", { unsigned: true }).notNull(),

  householdId: int("householdId", { unsigned: true }).notNull(),

  transactionDate: varchar("transactionDate", { length: 10 }).notNull(),

  description: varchar("description", { length: 255 }).notNull(),

  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),

balance: decimal("balance", { precision: 12, scale: 2 }),


  direction: mysqlEnum("direction", [
    "income",
    "expense",
  ]).notNull(),

  matchedFinanceEntryId: int("matchedFinanceEntryId", {
    unsigned: true,
  }),

  matchedDocumentId: int("matchedDocumentId", {
    unsigned: true,
  }),

  matchStatus: mysqlEnum("matchStatus", [
    "unmatched",
    "matched",
    "possible",
    "ignored",
  ]).default("unmatched").notNull(),

  aiConfidence: int("aiConfidence", { unsigned: true }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;

export type BankStatement = typeof bankStatements.$inferSelect;
export type InsertBankStatement = typeof bankStatements.$inferInsert;

// Budgets
export const budgets = mysqlTable("budgets", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  category: varchar("category", { length: 100 }).notNull(),
  monthlyLimit: int("monthlyLimit", { unsigned: true }).notNull(), // Endret til int
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// Debt Cases
export const debtCases = mysqlTable("debt_cases", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  familyMemberId: int("familyMemberId", { unsigned: true }),     // Endret til int
  title: varchar("title", { length: 255 }).notNull(),
  creditor: varchar("creditor", { length: 255 }).notNull(),
  originalAmount: int("originalAmount", { unsigned: true }).notNull(), // Endret til int
  currentAmount: int("currentAmount", { unsigned: true }).notNull(),   // Endret til int
  status: mysqlEnum("status", ["open", "negotiating", "payment_plan", "legal", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
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
  id: id(),
  debtCaseId: int("debtCaseId", { unsigned: true }).notNull(), // Endret til int
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebtNote = typeof debtNotes.$inferSelect;
export type InsertDebtNote = typeof debtNotes.$inferInsert;

// Communications
export const communications = mysqlTable("communications", {
  id: id(),
  debtCaseId: int("debtCaseId", { unsigned: true }).notNull(), // Endret til int
  type: mysqlEnum("type", ["letter", "email", "phone", "meeting", "sms", "other"]).default("other").notNull(),
  direction: mysqlEnum("direction", ["sent", "received"]).default("received").notNull(),
  date: varchar("date", { length: 30 }).notNull(),
  description: text("description").notNull(),
  documentIds: text("documentIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = typeof communications.$inferInsert;

// Custom Categories
export const customCategories = mysqlTable("custom_categories", {
  id: id(),
  householdId: int("householdId", { unsigned: true }).notNull(), // Endret til int
  familyMemberId: int("familyMemberId", { unsigned: true }),     // Endret til int
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomCategory = typeof customCategories.$inferSelect;
export type InsertCustomCategory = typeof customCategories.$inferInsert;

// User Settings
export const userSettings = mysqlTable("user_settings", {
  id: id(),
  userId: int("userId", { unsigned: true }).notNull().unique(), // Endret til int
  theme: mysqlEnum("theme", ["dark", "light"]).default("dark").notNull(),
  language: varchar("language", { length: 10 }).default("nb").notNull(),
  lastVisited: timestamp("lastVisited").defaultNow().notNull(),
});

export type UserSetting = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;