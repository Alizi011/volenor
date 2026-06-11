// Relations are defined here for Drizzle's relational query API
// See: https://orm.drizzle.team/docs/relations

import { relations } from "drizzle-orm";
import {
  users,
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
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  tasks: many(tasks),
  inboxItems: many(inboxItems),
  finances: many(financeEntries),
  budgets: many(budgets),
  debtCases: many(debtCases),
  familyMembers: many(familyMembers),
  customCategories: many(customCategories),
}));

export const debtCasesRelations = relations(debtCases, ({ many }) => ({
  notes: many(debtNotes),
  communications: many(communications),
}));

export const debtNotesRelations = relations(debtNotes, ({ one }) => ({
  debtCase: one(debtCases, {
    fields: [debtNotes.debtCaseId],
    references: [debtCases.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  debtCase: one(debtCases, {
    fields: [communications.debtCaseId],
    references: [debtCases.id],
  }),
}));
