import { createCase } from "./caseService";

export async function processInboxDocument(
  inboxDocument: any,
  analysis: any
) {
  const newCase = await createCase({
    householdId: inboxDocument.householdId,
    title:
      analysis.supplier ??
      inboxDocument.subject ??
      "Ny sak",

    type:
      analysis.caseType ??
      analysis.documentType ??
      "general",

    priority:
      analysis.priority ?? "normal",

    summary:
      analysis.summary ?? null,

    currentBalance:
      analysis.currentBalance ??
      analysis.amount ??
      null,

    externalReference:
      analysis.caseReference ?? null,

    createdByUserId:
      inboxDocument.uploadedByUserId,
  });

  return newCase;
}