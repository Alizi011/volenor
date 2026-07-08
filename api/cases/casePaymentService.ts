import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { createEvent } from "./caseEventService";

interface RegisterCasePaymentInput {
  caseId: number;
  amount: number;
  paidDate: string;
  note?: string | null;
  createdByUserId?: number | null;
}

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function registerCasePayment(input: RegisterCasePaymentInput) {
  const db = getDb();

  const caseResult: any = await db.execute(sql`
    SELECT *
    FROM cases
    WHERE id = ${input.caseId}
    LIMIT 1
  `);

  const currentCase = normalizeRows(caseResult)[0];

  if (!currentCase) {
    throw new Error("Saken finnes ikke.");
  }

  const paymentAmount = Number(input.amount);
  const oldBalance = Number(currentCase.currentBalance ?? 0);
  const newBalance = Math.max(oldBalance - paymentAmount, 0);

  await db.execute(sql`
    INSERT INTO financial_items
    (
      householdId,
      debtCaseId,
      title,
      type,
      status,
      creditorName,
      originalAmount,
      currentAmount,
      currency,
      paidDate,
      notes
    )
    VALUES
    (
      ${currentCase.householdId},
      ${input.caseId},
      ${`Betaling - ${currentCase.title}`},
      ${"invoice"},
      ${"paid"},
      ${currentCase.title},
      ${paymentAmount},
      ${0},
      ${"NOK"},
      ${input.paidDate},
      ${input.note ?? null}
    )
  `);

  await db.execute(sql`
    UPDATE cases
    SET
      currentBalance = ${newBalance},
      status = ${newBalance === 0 ? "closed" : currentCase.status},
      closedAt = ${newBalance === 0 ? input.paidDate : currentCase.closedAt},
      lastActivityAt = CURRENT_TIMESTAMP
    WHERE id = ${input.caseId}
  `);

  await createEvent({
    caseId: input.caseId,
    eventType: "payment_registered",
    title: "Betaling registrert",
    description:
      input.note ??
      `Betaling på ${paymentAmount} kr registrert.`,
    amount: paymentAmount,
    balanceAfter: newBalance,
    source: "manual",
    createdByUserId: input.createdByUserId ?? null,
  });

  return {
    success: true,
    caseId: input.caseId,
    paidAmount: paymentAmount,
    previousBalance: oldBalance,
    newBalance,
    closed: newBalance === 0,
  };
}