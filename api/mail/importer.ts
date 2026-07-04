import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

export interface InboxDocumentFileInput {
  originalFileName: string;
  storedFileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  displayOrder?: number;
}

export interface CreateInboxDocumentInput {
  householdId: number;
  uploadedByUserId?: number | null;
  source: string;
  fromEmail?: string | null;
  subject?: string | null;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status?: string;
  files: InboxDocumentFileInput[];
}

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function createInboxDocumentPackage(input: CreateInboxDocumentInput) {
  await getDb().execute(sql`
    INSERT INTO inbox_documents
    (
      householdId,
      uploadedByUserId,
      source,
      fromEmail,
      subject,
      fileName,
      fileUrl,
      mimeType,
      fileSize,
      status
    )
    VALUES
    (
      ${input.householdId},
      ${input.uploadedByUserId ?? null},
      ${input.source},
      ${input.fromEmail ?? null},
      ${input.subject ?? null},
      ${input.fileName},
      ${input.fileUrl},
      ${input.mimeType ?? null},
      ${input.fileSize ?? null},
      ${input.status ?? "new"}
    )
  `);

  const documentResult: any = await getDb().execute(sql`
    SELECT id
    FROM inbox_documents
    WHERE householdId = ${input.householdId}
      AND source = ${input.source}
      AND fileUrl = ${input.fileUrl}
    ORDER BY id DESC
    LIMIT 1
  `);

  const documentRows = normalizeRows(documentResult);
  const inboxDocumentId = documentRows[0]?.id;

  if (!inboxDocumentId) {
    throw new Error("Kunne ikke finne opprettet inbox_document");
  }

  for (const file of input.files) {
    await getDb().execute(sql`
      INSERT INTO inbox_document_files
      (
        inboxDocumentId,
        originalFileName,
        storedFileName,
        fileUrl,
        mimeType,
        fileSize,
        pageCount,
        displayOrder
      )
      VALUES
      (
        ${inboxDocumentId},
        ${file.originalFileName},
        ${file.storedFileName},
        ${file.fileUrl},
        ${file.mimeType ?? null},
        ${file.fileSize ?? null},
        ${file.pageCount ?? null},
        ${file.displayOrder ?? 0}
      )
    `);
  }

  return {
    inboxDocumentId,
    fileCount: input.files.length,
  };
}