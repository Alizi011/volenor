import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users,
  households,
  documents,
  tasks,
  calendarEvents,
  inboxItems,
  financeEntries,
  budgets,
  debtCases,
  debtNotes,
  communications,
  familyMembers,
  customCategories,
  userSettings,
} from "@db/schema";

const db = () => getDb();

const parseJson = <T,>(val: string | null | undefined, fallback: T): T => {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
};

async function getHouseholdIdForUser(userId: number) {
  const rows = await db()
    .select()
    .from(households)
    .where(eq(households.ownerUserId, userId))
    .limit(1);

  const household = rows.at(0);

  if (!household) {
    throw new Error("Household not found for user");
  }

  return household.id;
}

export const synapseRouter = createRouter({
  documents: createRouter({
   list: authedQuery.query(async ({ ctx }) => {
  try {
    const householdId = await getHouseholdIdForUser(ctx.user.id);

    const documentsList = await db()
      .select()
      .from(documents)
      .where(eq(documents.householdId, householdId))
      .orderBy(desc(documents.id));

    return documentsList.map((r) => ({
      id: r.id,
      householdId: r.householdId,
      familyMemberId: r.familyMemberId,
      name: r.name || "Uten navn",
      category:
        !r.category || r.category === "Fakturaer"
          ? "invoices"
          : r.category,
      date: r.date || new Date().toISOString().slice(0, 10),
      size: r.size ? Number(r.size) : 0,
      type: r.type || "pdf",
      notes: r.notes || "",
      fileData: r.fileData || null,
      tags: parseJson<string[]>(r.tags, []),
    }));

  } catch (dbError: any) {
    console.error("KRITISK FEIL I DOCUMENTS.LIST:", dbError);
    throw new Error("Databasefeil ved henting av dokumenter: " + dbError.message);
  }
}),

    create: authedQuery
      .input(
        z.object({
          name: z.string(),
          category: z.string(),
          date: z.string(),
          size: z.number().optional(),
          type: z.enum(["pdf", "image", "doc"]),
          tags: z.string().optional(),
          notes: z.string().optional(),
          fileData: z.string().optional(),
          familyMemberId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(documents)
          .values({
            ...input,
            householdId,
            size: input.size ?? 0,
            tags: input.tags ?? "[]",
            notes: input.notes ?? "",
            fileData: input.fileData ?? null, // Sikrer at fileData sendes som null hvis den mangler
          } as any);

        return { id: Number(result[0].insertId) };
      }),

    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await db().update(documents).set(input.data).where(eq(documents.id, input.id));
        return { success: true };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),
  }),

  tasks: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db()
        .select()
        .from(tasks)
        .where(eq(tasks.householdId, householdId))
        .orderBy(desc(tasks.id));
    }),

    create: authedQuery
      .input(
        z.object({
          title: z.string(),
          category: z.enum(["invoice", "signature", "scan", "other"]),
          dueDate: z.string(),
          priority: z.enum(["high", "medium", "low"]),
          status: z.enum(["new", "in_progress", "done", "archived"]),
          tags: z.string().optional(),
          notes: z.string().optional(),
          familyMemberId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(tasks)
          .values({
            ...input,
            householdId,
            tags: input.tags ?? "[]",
            notes: input.notes ?? "",
          });

        return { id: Number(result[0].insertId) };
      }),

    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await db().update(tasks).set(input.data).where(eq(tasks.id, input.id));
        return { success: true };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(tasks).where(eq(tasks.id, input.id));
      return { success: true };
    }),
  }),

  calendar: createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const householdId = await getHouseholdIdForUser(ctx.user.id);

    return db()
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.householdId, householdId))
      .orderBy(desc(calendarEvents.startDate));
  }),

  create: authedQuery
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      const result = await db()
        .insert(calendarEvents)
        .values({
          householdId,
          title: input.title,
          description: input.description ?? "",
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          color: input.color ?? "#e8ff47",
        });

      return { id: Number(result[0].insertId) };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db()
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, input.id));

      return { success: true };
    }),
}),

  inbox: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db()
        .select()
        .from(inboxItems)
        .where(eq(inboxItems.householdId, householdId))
        .orderBy(desc(inboxItems.createdAt));
    }),

    create: authedQuery
      .input(
        z.object({
          name: z.string(),
          date: z.string(),
          size: z.number().optional(),
          type: z.enum(["pdf", "image", "doc"]),
          fileData: z.string().optional(),
          familyMemberId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(inboxItems)
          .values({
            ...input,
            householdId,
            size: input.size ?? 0,
          } as any);

        return { id: Number(result[0].insertId) };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(inboxItems).where(eq(inboxItems.id, input.id));
      return { success: true };
    }),
  }),

  finances: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db()
        .select()
        .from(financeEntries)
        .where(eq(financeEntries.householdId, householdId))
        .orderBy(desc(financeEntries.createdAt));
    }),

    create: authedQuery
      .input(
        z.object({
          title: z.string(),
          amount: z.number(),
          type: z.enum(["income", "expense"]),
          category: z.string(),
          date: z.string(),
          status: z.enum(["paid", "pending", "overdue"]),
          notes: z.string().optional(),
          isRecurring: z.number().optional(),
          recurringInterval: z.string().optional(),
          familyMemberId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(financeEntries)
          .values({
            ...input,
            householdId,
            notes: input.notes ?? "",
            isRecurring: input.isRecurring ?? 0,
          });

        return { id: Number(result[0].insertId) };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(financeEntries).where(eq(financeEntries.id, input.id));
      return { success: true };
    }),
  }),

  budgets: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db().select().from(budgets).where(eq(budgets.householdId, householdId));
    }),

    create: authedQuery
      .input(z.object({ category: z.string(), monthlyLimit: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(budgets)
          .values({
            ...input,
            householdId,
          });

        return { id: Number(result[0].insertId) };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(budgets).where(eq(budgets.id, input.id));
      return { success: true };
    }),
  }),

  debtCases: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      const rows = await db()
        .select()
        .from(debtCases)
        .where(eq(debtCases.householdId, householdId))
        .orderBy(desc(debtCases.createdAt));

      return rows.map((r) => ({
        ...r,
        documentIds: parseJson<string[]>(r.documentIds, []),
        notes: [],
        communications: [],
      }));
    }),

    create: authedQuery
      .input(
        z.object({
          title: z.string(),
          creditor: z.string(),
          originalAmount: z.number(),
          currentAmount: z.number(),
          status: z.enum(["open", "negotiating", "payment_plan", "legal", "resolved", "closed"]),
          priority: z.enum(["critical", "high", "medium", "low"]),
          familyMemberId: z.number().optional(),
          documentIds: z.string().optional(),
          interestRate: z.number().nullable().optional(),
          dueDate: z.string().nullable().optional(),
          referenceNumber: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(debtCases)
          .values({
            ...input,
            householdId,
            documentIds: input.documentIds ?? "[]",
          });

        return { id: Number(result[0].insertId) };
      }),

    update: authedQuery
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await db().update(debtCases).set(input.data).where(eq(debtCases.id, input.id));
        return { success: true };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(debtNotes).where(eq(debtNotes.debtCaseId, input.id));
      await db().delete(communications).where(eq(communications.debtCaseId, input.id));
      await db().delete(debtCases).where(eq(debtCases.id, input.id));
      return { success: true };
    }),

    close: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db()
        .update(debtCases)
        .set({ status: "closed", closedAt: new Date() })
        .where(eq(debtCases.id, input.id));

      return { success: true };
    }),
  }),

  debtNotes: createRouter({
    list: authedQuery
      .input(z.object({ debtCaseId: z.number() }))
      .query(async ({ input }) => {
        return db()
          .select()
          .from(debtNotes)
          .where(eq(debtNotes.debtCaseId, input.debtCaseId))
          .orderBy(desc(debtNotes.createdAt));
      }),

    create: authedQuery
      .input(z.object({ debtCaseId: z.number(), content: z.string() }))
      .mutation(async ({ input }) => {
        const result = await db().insert(debtNotes).values(input);
        return { id: Number(result[0].insertId) };
      }),
  }),

  communications: createRouter({
    list: authedQuery
      .input(z.object({ debtCaseId: z.number() }))
      .query(async ({ input }) => {
        return db()
          .select()
          .from(communications)
          .where(eq(communications.debtCaseId, input.debtCaseId))
          .orderBy(desc(communications.createdAt));
      }),

    create: authedQuery
      .input(
        z.object({
          debtCaseId: z.number(),
          type: z.enum(["letter", "email", "phone", "meeting", "sms", "other"]),
          direction: z.enum(["sent", "received"]),
          date: z.string(),
          description: z.string(),
          documentIds: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await db()
          .insert(communications)
          .values({
            ...input,
            documentIds: input.documentIds ?? "[]",
          });

        return { id: Number(result[0].insertId) };
      }),
  }),

  family: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db()
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.householdId, householdId))
        .orderBy(desc(familyMembers.createdAt));
    }),

    create: authedQuery
      .input(
        z.object({
          name: z.string(),
          relation: z.string(),
          color: z.string(),
          notes: z.string().optional(),
          dateOfBirth: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const existing = await db()
          .select()
          .from(familyMembers)
          .where(eq(familyMembers.householdId, householdId));

        if (existing.length >= 4) {
          throw new Error("Maks 4 familiemedlemmer er inkludert i abonnementet.");
        }

        const result = await db()
          .insert(familyMembers)
          .values({
            ...input,
            householdId,
            notes: input.notes ?? "",
          });

        return { id: Number(result[0].insertId) };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(familyMembers).where(eq(familyMembers.id, input.id));
      return { success: true };
    }),
  }),

  categories: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const householdId = await getHouseholdIdForUser(ctx.user.id);

      return db()
        .select()
        .from(customCategories)
        .where(eq(customCategories.householdId, householdId));
    }),

    create: authedQuery
      .input(
        z.object({
          label: z.string(),
          icon: z.string(),
          color: z.string(),
          familyMemberId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const householdId = await getHouseholdIdForUser(ctx.user.id);

        const result = await db()
          .insert(customCategories)
          .values({
            ...input,
            householdId,
          });

        return { id: Number(result[0].insertId) };
      }),

    delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db().delete(customCategories).where(eq(customCategories.id, input.id));
      return { success: true };
    }),
  }),

  settings: createRouter({
    get: authedQuery.query(async ({ ctx }) => {
      const rows = await db()
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.user.id));

      return rows[0] ?? null;
    }),

    upsert: authedQuery
      .input(z.object({ theme: z.enum(["dark", "light"]).optional(), language: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db()
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, ctx.user.id));

        if (existing.length > 0) {
          await db().update(userSettings).set(input).where(eq(userSettings.userId, ctx.user.id));
        } else {
          await db()
            .insert(userSettings)
            .values({
              userId: ctx.user.id,
              theme: input.theme ?? "dark",
              language: input.language ?? "nb",
            });
        }

        return { success: true };
          }),
  }),
});

export const adminRouter = createRouter({
  users: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");

      return db()
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
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
      db().select().from(documents).then((r) => r.length),
      db().select().from(tasks).then((r) => r.length),
      db().select().from(debtCases).then((r) => r.length),
      db().select().from(financeEntries).then((r) => r.length),
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