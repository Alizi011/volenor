import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

export interface CreateCaseEventInput {
  caseId: number;

  eventType: string;

  title: string;

  description?: string | null;

  inboxDocumentId?: number | null;

  documentId?: number | null;

  amount?: number | null;

  originalClaim?: number | null;

  interestAmount?: number | null;

  feeAmount?: number | null;

  collectionFee?: number | null;

  legalCost?: number | null;

  balanceAfter?: number | null;

  source?: string;

  aiConfidence?: number | null;

  metadataJson?: any;

  createdByUserId?: number | null;
}

export async function createEvent(
  input: CreateCaseEventInput
) {

  const result: any = await getDb().execute(sql`
    INSERT INTO case_events (

      caseId,

      inboxDocumentId,

      documentId,

      eventType,

      title,

      description,

      originalClaim,

      interestAmount,

      feeAmount,

      collectionFee,

      legalCost,

      amount,

      balanceAfter,

      source,

      aiConfidence,

      metadataJson,

      createdByUserId

    )

    VALUES (

      ${input.caseId},

      ${input.inboxDocumentId ?? null},

      ${input.documentId ?? null},

      ${input.eventType},

      ${input.title},

      ${input.description ?? null},

      ${input.originalClaim ?? null},

      ${input.interestAmount ?? null},

      ${input.feeAmount ?? null},

      ${input.collectionFee ?? null},

      ${input.legalCost ?? null},

      ${input.amount ?? null},

      ${input.balanceAfter ?? null},

      ${input.source ?? "system"},

      ${input.aiConfidence ?? null},

      ${input.metadataJson
        ? JSON.stringify(input.metadataJson)
        : null},

      ${input.createdByUserId ?? null}

    )
  `);

  return result;
}