import { findBestCaseMatch } from "../caseSimilarity";
import {
  ResolutionContext,
  ResolutionRule,
} from "./types";

export const duplicateRule: ResolutionRule = {
  name: "Duplicate Rule",

  async execute(
    context: ResolutionContext
  ) {
    const match = await findBestCaseMatch(
      context.analysis
    );

    if (!match.matchedCase) {
      return null;
    }

    if (match.score >= 80) {
      return {
        action: "update_case",
        caseId: Number(match.matchedCase.id),
        reason: match.reasons.join(", "),
        confidence: match.score,
      };
    }

    if (match.score >= 50) {
      return {
        action: "manual_review",
        reason: match.reasons.join(", "),
        confidence: match.score,
      };
    }

    return null;
  },
};