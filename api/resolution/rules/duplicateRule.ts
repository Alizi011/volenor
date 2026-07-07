import { sql } from "drizzle-orm";
import { getDb } from "../../queries/connection";
import {
  ResolutionContext,
  ResolutionRule,
} from "./types";

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export const duplicateRule: ResolutionRule = {
  name: "Duplicate Rule",

  async execute(context: ResolutionContext) {

    const analysis = context.analysis;

    const result: any = await getDb().execute(sql`
      SELECT *
      FROM cases
      WHERE status = 'active'
        AND type = ${analysis.caseType}
    `);

    const cases = normalizeRows(result);

    let bestMatch: any = null;
    let bestScore = 0;

    for (const c of cases) {

      let score = 0;

      if (
        analysis.caseReference &&
        c.externalReference &&
        analysis.caseReference === c.externalReference
      ) {
        score += 100;
      }

      if (
        analysis.originalCreditor &&
        c.originalCreditor &&
        analysis.originalCreditor
          .toLowerCase()
          .trim() ===
        c.originalCreditor
          .toLowerCase()
          .trim()
      ) {
        score += 35;
      }

      if (
        analysis.collectionAgency &&
        c.collectionAgency &&
        analysis.collectionAgency
          .toLowerCase()
          .trim() ===
        c.collectionAgency
          .toLowerCase()
          .trim()
      ) {
        score += 25;
      }

      if (
        analysis.currentBalance &&
        c.currentBalance &&
        Math.abs(
          Number(analysis.currentBalance) -
          Number(c.currentBalance)
        ) <= 1
      ) {
        score += 15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }

    if (bestScore >= 80) {
      return {
        action: "update_case",
        caseId: Number(bestMatch.id),
        reason: `Samme sak funnet (${bestScore} poeng).`,
        confidence: bestScore,
      };
    }

    if (bestScore >= 50) {
      return {
        action: "manual_review",
        reason: `Mulig duplikat (${bestScore} poeng).`,
        confidence: bestScore,
      };
    }

    return null;
  },
};