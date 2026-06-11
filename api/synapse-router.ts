import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  documents,
  tasks,
  inboxItems,
  financeEntries,
  budgets,
  debtCases,
  debtNotes,
  communications,
  familyMembers,
  customCategories,
  userSettings,
  users,
} from "@db/schema";

const db = () => getDb();

const parseJson = <T,>(val: string | null | undefined, fallback: T): T => {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
};

export const synapseRouter = createRouter({
  // ─── DOCUMENTS ───
  documents: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const rows = await db().select().from(documents).where(eq(documents.userId, ctx.user.id)).orderBy(desc(documents.createdAt));
      return rows.map((r) => ({ ...r, tags: parseJson<string[]>(r.tags, []) }));
    }),
    create: authedQuery
      .input(z.object({ name: z.string(), category: z.string(), date: z.string(), size: z.number().optional(), type: z.enum(["pdf", "image", "doc"]), tags: z.string().optional(), notes: z.string().optional(), fileData: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(documents).values({ ...input, userId: ctx.user.id, size: input.size ?? 0, tags: input.tags ?? "[]", notes: input.notes ?? "" });
        return { id: Number(result[0].insertId) };
      }),
    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().update(documents).set(input.data).where(eq(documents.id, input.id));
        return { success: true };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(documents).where(eq(documents.id, input.id));
        return { success: true };
      }),
  }),

  // ─── TASKS ───
  tasks: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(tasks).where(eq(tasks.userId, ctx.user.id)).orderBy(desc(tasks.createdAt));
    }),
    create: authedQuery
      .input(z.object({ title: z.string(), category: z.enum(["invoice", "signature", "scan", "other"]), dueDate: z.string(), priority: z.enum(["high", "medium", "low"]), status: z.enum(["new", "in_progress", "done", "archived"]), tags: z.string().optional(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(tasks).values({ ...input, userId: ctx.user.id, tags: input.tags ?? "[]", notes: input.notes ?? "" });
        return { id: Number(result[0].insertId) };
      }),
    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().update(tasks).set(input.data).where(eq(tasks.id, input.id));
        return { success: true };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(tasks).where(eq(tasks.id, input.id));
        return { success: true };
      }),
  }),

  // ─── INBOX ───
  inbox: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(inboxItems).where(eq(inboxItems.userId, ctx.user.id)).orderBy(desc(inboxItems.createdAt));
    }),
    create: authedQuery
      .input(z.object({ name: z.string(), date: z.string(), size: z.number().optional(), type: z.enum(["pdf", "image", "doc"]), fileData: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(inboxItems).values({ ...input, userId: ctx.user.id, size: input.size ?? 0 });
        return { id: Number(result[0].insertId) };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(inboxItems).where(eq(inboxItems.id, input.id));
        return { success: true };
      }),
  }),

  // ─── FINANCES ───
  finances: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(financeEntries).where(eq(financeEntries.userId, ctx.user.id)).orderBy(desc(financeEntries.createdAt));
    }),
    create: authedQuery
      .input(z.object({ title: z.string(), amount: z.number(), type: z.enum(["income", "expense"]), category: z.string(), date: z.string(), status: z.enum(["paid", "pending", "overdue"]), notes: z.string().optional(), isRecurring: z.number().optional(), recurringInterval: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(financeEntries).values({ ...input, userId: ctx.user.id, notes: input.notes ?? "", isRecurring: input.isRecurring ?? 0 });
        return { id: Number(result[0].insertId) };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(financeEntries).where(eq(financeEntries.id, input.id));
        return { success: true };
      }),
  }),

  // ─── BUDGETS ───
  budgets: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(budgets).where(eq(budgets.userId, ctx.user.id));
    }),
    create: authedQuery
      .input(z.object({ category: z.string(), monthlyLimit: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(budgets).values({ ...input, userId: ctx.user.id });
        return { id: Number(result[0].insertId) };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(budgets).where(eq(budgets.id, input.id));
        return { success: true };
      }),
  }),

  // ─── DEBT CASES ───
  debtCases: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const rows = await db().select().from(debtCases).where(eq(debtCases.userId, ctx.user.id)).orderBy(desc(debtCases.createdAt));
      return rows.map((r) => ({ ...r, documentIds: parseJson<string[]>(r.documentIds, []), notes: [], communications: [] }));
    }),
    create: authedQuery
      .input(z.object({ title: z.string(), creditor: z.string(), originalAmount: z.number(), currentAmount: z.number(), status: z.enum(["open", "negotiating", "payment_plan", "legal", "resolved", "closed"]), priority: z.enum(["critical", "high", "medium", "low"]), memberId: z.string().nullable(), documentIds: z.string().optional(), interestRate: z.number().nullable().optional(), dueDate: z.string().nullable().optional(), referenceNumber: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(debtCases).values({ ...input, userId: ctx.user.id, documentIds: input.documentIds ?? "[]" });
        return { id: Number(result[0].insertId) };
      }),
    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().update(debtCases).set(input.data).where(eq(debtCases.id, input.id));
        return { success: true };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(debtNotes).where(eq(debtNotes.debtCaseId, input.id));
        await db().delete(communications).where(eq(communications.debtCaseId, input.id));
        await db().delete(debtCases).where(eq(debtCases.id, input.id));
        return { success: true };
      }),
    close: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().update(debtCases).set({ status: "closed", closedAt: new Date() }).where(eq(debtCases.id, input.id));
        return { success: true };
      }),
  }),

  // ─── DEBT NOTES ───
  debtNotes: createRouter({
    list: authedQuery
      .input(z.object({ debtCaseId: z.number() }))
      .query(async ({ input }) => {
        return db().select().from(debtNotes).where(eq(debtNotes.debtCaseId, input.debtCaseId)).orderBy(desc(debtNotes.createdAt));
      }),
    create: authedQuery
      .input(z.object({ debtCaseId: z.number(), content: z.string() }))
      .mutation(async ({ input }) => {
        const result = await db().insert(debtNotes).values(input);
        return { id: Number(result[0].insertId) };
      }),
  }),

  // ─── COMMUNICATIONS ───
  communications: createRouter({
    list: authedQuery
      .input(z.object({ debtCaseId: z.number() }))
      .query(async ({ input }) => {
        return db().select().from(communications).where(eq(communications.debtCaseId, input.debtCaseId)).orderBy(desc(communications.createdAt));
      }),
    create: authedQuery
      .input(z.object({ debtCaseId: z.number(), type: z.enum(["letter", "email", "phone", "meeting", "sms", "other"]), direction: z.enum(["sent", "received"]), date: z.string(), description: z.string(), documentIds: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await db().insert(communications).values({ ...input, documentIds: input.documentIds ?? "[]" });
        return { id: Number(result[0].insertId) };
      }),
  }),

  // ─── FAMILY MEMBERS ───
  family: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(familyMembers).where(eq(familyMembers.userId, ctx.user.id)).orderBy(desc(familyMembers.createdAt));
    }),
    create: authedQuery
      .input(z.object({ name: z.string(), relation: z.string(), color: z.string(), notes: z.string().optional(), dateOfBirth: z.string().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(familyMembers).values({ ...input, userId: ctx.user.id, notes: input.notes ?? "" });
        return { id: Number(result[0].insertId) };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(familyMembers).where(eq(familyMembers.id, input.id));
        return { success: true };
      }),
  }),

  // ─── CUSTOM CATEGORIES ───
  categories: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      return db().select().from(customCategories).where(eq(customCategories.userId, ctx.user.id));
    }),
    create: authedQuery
      .input(z.object({ label: z.string(), icon: z.string(), color: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db().insert(customCategories).values({ ...input, userId: ctx.user.id });
        return { id: Number(result[0].insertId) };
      }),
    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx: _ctx, input }) => {
        await db().delete(customCategories).where(eq(customCategories.id, input.id));
        return { success: true };
      }),
  }),

  // ─── SETTINGS ───
  settings: createRouter({
    get: authedQuery.query(async ({ ctx }) => {
      const rows = await db().select().from(userSettings).where(eq(userSettings.userId, ctx.user.id));
      return rows[0] ?? null;
    }),
    upsert: authedQuery
      .input(z.object({ theme: z.enum(["dark", "light"]).optional(), language: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db().select().from(userSettings).where(eq(userSettings.userId, ctx.user.id));
        if (existing.length > 0) {
          await db().update(userSettings).set(input).where(eq(userSettings.userId, ctx.user.id));
        } else {
          await db().insert(userSettings).values({ userId: ctx.user.id, theme: input.theme ?? "dark", language: input.language ?? "nb" });
        }
        return { success: true };
      }),
  }),
});

// ─── ADMIN ROUTER ───
export const adminRouter = createRouter({
  users: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return db().select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
    }),
    count: authedQuery.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const rows = await db().select().from(users);
      return rows.length;
    }),
  }),
  stats: authedQuery.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const [docCount, taskCount, debtCount, finCount] = await Promise.all([
      db().select().from(documents).then(r => r.length),
      db().select().from(tasks).then(r => r.length),
      db().select().from(debtCases).then(r => r.length),
      db().select().from(financeEntries).then(r => r.length),
    ]);
    const userRows = await db().select().from(users);
    return {
      totalUsers: userRows.length,
      totalDocuments: docCount,
      totalTasks: taskCount,
      totalDebtCases: debtCount,
      totalFinances: finCount,
    };
  }),
});
