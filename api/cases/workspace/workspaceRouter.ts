import { z } from "zod";

import { createRouter, authedQuery } from "../../middleware";

import { getCaseWorkspace } from "./caseWorkspaceService";

import { registerCasePayment } from "../casePaymentService";
import { addCaseNote } from "../caseNoteService";

export const workspaceRouter = createRouter({
  get: authedQuery
    .input(
      z.object({
        caseId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return getCaseWorkspace(input.caseId);
    }),

  registerPayment: authedQuery
    .input(
      z.object({
        caseId: z.number(),
        amount: z.number(),
        paidDate: z.string(),
        note: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return registerCasePayment({
        caseId: input.caseId,
        amount: input.amount,
        paidDate: input.paidDate,
        note: input.note ?? null,
        createdByUserId: ctx.user.id,
      });
    }),

  addNote: authedQuery
    .input(
      z.object({
        caseId: z.number(),
        note: z.string().trim().min(1, "Notatet kan ikke være tomt."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return addCaseNote({
        caseId: input.caseId,
        note: input.note,
        createdByUserId: ctx.user.id,
      });
    }),
});