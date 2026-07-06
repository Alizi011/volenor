export interface ResolutionResult {
  action:
    | "create_case"
    | "update_case"
    | "create_bill"
    | "archive"
    | "manual_review";

  caseId?: number;

  reason: string;

  confidence: number;
}

import { resolutionRules } from "./rules";

export async function resolveDocument(
  inboxDocument: any,
  analysis: any
): Promise<ResolutionResult> {

  const context = {
    inboxDocument,
    analysis,
  };

  for (const rule of resolutionRules) {

    const result = await rule.execute(context);

    if (result) {
      return result;
    }

  }

  return {
    action: "create_case",
    reason: "Ingen regler traff.",
    confidence: 100,
  };
}

