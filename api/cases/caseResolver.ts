import { createCase } from "./caseService";
import { resolveDocument } from "../resolution/resolutionEngine";
import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { createEvent } from "./caseEventService";

export async function processInboxDocument(
  inboxDocument: any,
  analysis: any
) {
  const decision = await resolveDocument(inboxDocument, analysis);

  if (decision.action === "update_case" && decision.caseId) {
    await getDb().execute(sql`
      UPDATE inbox_documents
      SET caseId = ${decision.caseId}
      WHERE id = ${inboxDocument.id}
    `);

    await createEvent({
      caseId: decision.caseId,
      inboxDocumentId: inboxDocument.id,
      eventType: "document_received",
      title: "Nytt dokument mottatt",
      description:
        analysis.summary ?? "Dokument koblet til eksisterende sak.",
      amount: analysis.currentBalance ?? analysis.amount ?? null,
      source: "ai",
      aiConfidence: decision.confidence,
      createdByUserId: inboxDocument.uploadedByUserId,
    });

    return {
      id: decision.caseId,
      matched: true,
      action: decision.action,
      reason: decision.reason,
      confidence: decision.confidence,
    };
  }

  if (decision.action !== "create_case") {
    return {
      action: decision.action,
      reason: decision.reason,
      confidence: decision.confidence,
      matched: false,
    };
  }

  const newCase = await createCase({
    householdId: inboxDocument.householdId,
    title: analysis.supplier ?? inboxDocument.subject ?? "Ny sak",
    type: analysis.caseType ?? analysis.documentType ?? "general",
    priority: analysis.priority ?? "normal",
    summary: analysis.summary ?? null,
    currentBalance: analysis.currentBalance ?? analysis.amount ?? null,
    externalReference: analysis.caseReference ?? null,
    originalCreditor: analysis.originalCreditor ?? null,
    collectionAgency: analysis.collectionAgency ?? null,
    publicAuthority: analysis.publicAuthority ?? null,

    originalClaim: analysis.originalClaim ?? null,
    interestAmount: analysis.interestAmount ?? null,
    feeAmount: analysis.feeAmount ?? null,
    collectionFee: analysis.collectionFee ?? null,
    legalCost: analysis.legalCost ?? null,

    deadline: analysis.deadline ?? null,
    createdByUserId: inboxDocument.uploadedByUserId,
  });

  await getDb().execute(sql`
    UPDATE inbox_documents
    SET caseId = ${newCase.id}
    WHERE id = ${inboxDocument.id}
  `);


  await createEvent({
    caseId: newCase.id,
    inboxDocumentId: inboxDocument.id,
    eventType: "case_created",
    title: "Sak opprettet",
    description:
      analysis.summary ?? "Ny sak opprettet automatisk.",
    amount: analysis.currentBalance ?? analysis.amount ?? null,
    source: "ai",
    aiConfidence: decision.confidence,
    createdByUserId: inboxDocument.uploadedByUserId,
  });

  return {
    ...newCase,
    matched: false,
    action: decision.action,
    reason: decision.reason,
    confidence: decision.confidence,
  };
}