import { createCase } from "./caseService";
import { findMatchingCase } from "./caseMatcher";

export async function processInboxDocument(
  inboxDocument: any,
  analysis: any
) {

    const existingCase = await findMatchingCase(analysis);

if (existingCase) {
  return {
    id: Number(existingCase.id),
    caseNumber: existingCase.caseNumber,
    title: existingCase.title,
    type: existingCase.type,
    status: existingCase.status,
    priority: existingCase.priority,
    matched: true,
  };
}

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