import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

import { analyzeInboxDocument } from "../inbox/analyzeInboxDocument";

export async function runDocumentWorkflow(
  inboxDocumentId: number
) {
  await getDb().execute(sql`
    UPDATE inbox_documents
    SET status = 'processing'
    WHERE id = ${inboxDocumentId}
  `);

  try {

    const result = await analyzeInboxDocument(
      inboxDocumentId
    );

    await getDb().execute(sql`
      UPDATE inbox_documents
      SET status = 'completed'
      WHERE id = ${inboxDocumentId}
    `);

    return result;

  } catch (error) {

    await getDb().execute(sql`
      UPDATE inbox_documents
      SET status = 'manual_review'
      WHERE id = ${inboxDocumentId}
    `);

    throw error;
  }
}