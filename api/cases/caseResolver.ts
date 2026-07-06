import { createCase } from "./caseService";
import { resolveDocument } from "../resolution/resolutionEngine";

export async function processInboxDocument(
  inboxDocument: any,
  analysis: any
) {
  const decision = await resolveDocument(inboxDocument, analysis);

  if (decision.action === "update_case" && decision.caseId) {
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
      analysis.currentBalance ?? analysis.amount ?? null,

    externalReference:
      analysis.caseReference ?? null,

    createdByUserId:
      inboxDocument.uploadedByUserId,
  });

  return {
    ...newCase,
    matched: false,
    action: decision.action,
    reason: decision.reason,
    confidence: decision.confidence,
  };
}