import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

export interface CreateCaseInput {
  householdId: number;
  title: string;
  type: string;
  priority?: string;
  summary?: string | null;
  originalCreditor?: string | null;
  collectionAgency?: string | null;
  publicAuthority?: string | null;
  originalClaim?: number | null;
  interestAmount?: number | null;
  feeAmount?: number | null;
  collectionFee?: number | null;
  legalCost?: number | null;
  deadline?: string | null;
  currentBalance?: number | null;
  externalReference?: string | null;
  createdByUserId?: number | null;
}

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

function formatCaseNumber(id: number) {
  return `CASE-${String(id).padStart(6, "0")}`;
}

export async function createCase(input: CreateCaseInput) {
  await getDb().execute(sql`
    INSERT INTO cases
    (
      householdId,
      title,
      type,
      status,
      priority,
      aiStatus,
      summary,
      originalCreditor,
      collectionAgency,
      publicAuthority, 
      currentBalance,
      originalClaim,
      interestAmount,
      feeAmount,
      collectionFee,
      legalCost,
      externalReference,
      openedAt,
      deadline,
      createdByUserId,
      lastActivityAt
    )
    VALUES
    (
      ${input.householdId},
      ${input.title},
      ${input.type},
      ${"active"},
      ${input.priority ?? "normal"},
      ${"pending"},
      ${input.summary ?? null},
      ${input.originalCreditor ?? null},
      ${input.collectionAgency ?? null},
      ${input.publicAuthority ?? null},
      ${input.currentBalance ?? null},
      ${input.originalClaim ?? null},
      ${input.interestAmount ?? null},
      ${input.feeAmount ?? null},
      ${input.collectionFee ?? null},
      ${input.legalCost ?? null},
      ${input.deadline ?? null},
      ${input.externalReference ?? null},
      ${new Date().toISOString().slice(0, 10)},
      ${input.createdByUserId ?? null},
      CURRENT_TIMESTAMP
    )
  `);

  const result: any = await getDb().execute(sql`
    SELECT id
    FROM cases
    WHERE householdId = ${input.householdId}
      AND title = ${input.title}
    ORDER BY id DESC
    LIMIT 1
  `);

  const rows = normalizeRows(result);
  const id = rows[0]?.id;

  if (!id) {
    throw new Error("Kunne ikke finne opprettet sak");
  }

  const caseNumber = formatCaseNumber(Number(id));

  await getDb().execute(sql`
    UPDATE cases
    SET caseNumber = ${caseNumber}
    WHERE id = ${id}
  `);

  return {
    id: Number(id),
    caseNumber,
    title: input.title,
    type: input.type,
    status: "active",
    priority: input.priority ?? "normal",
  };
}

export async function getCase(id: number) {
  const result: any = await getDb().execute(sql`
    SELECT *
    FROM cases
    WHERE id = ${id}
    LIMIT 1
  `);

  return normalizeRows(result)[0] ?? null;
}