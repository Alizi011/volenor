import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function findMatchingCase(
  analysis: any
) {
  const db = getDb();

  //
  // 1. Match på saksreferanse
  //
  if (analysis.caseReference) {
    const referenceResult: any =
      await db.execute(sql`
        SELECT *
        FROM cases
        WHERE externalReference =
          ${analysis.caseReference}
        ORDER BY id DESC
        LIMIT 1
      `);

    const referenceRows =
      normalizeRows(referenceResult);

    if (referenceRows.length > 0) {
      return referenceRows[0];
    }
  }

  //
  // 2. Match på opprinnelig kreditor
  //
  const supplier =
    analysis.originalCreditor ??
    analysis.supplier;

  if (!supplier) {
    return null;
  }

  const supplierResult: any =
    await db.execute(sql`
      SELECT *
      FROM cases
      WHERE
        LOWER(title) = LOWER(${supplier})
        OR LOWER(originalCreditor) =
           LOWER(${supplier})
      ORDER BY id DESC
      LIMIT 1
    `);

  const supplierRows =
    normalizeRows(supplierResult);

  return supplierRows[0] ?? null;
}