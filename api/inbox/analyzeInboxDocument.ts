import * as fs from "node:fs";
import * as path from "node:path";
import { sql } from "drizzle-orm";
import { getDocumentProxy, extractText } from "unpdf";
import OpenAI from "openai";

import { getDb } from "../queries/connection";
import { extractTextWithOcr } from "../ocr/extractText";
import { processInboxDocument } from "../cases/caseResolver";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeRows(result: any): any[] {
  return Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : [];
}

export async function analyzeInboxDocument(id: number) {
  const result: any = await getDb().execute(sql`
    SELECT *
    FROM inbox_documents
    WHERE id = ${id}
    LIMIT 1
  `);

  const rows = normalizeRows(result);
  const doc = rows[0];

  if (!doc) {
    throw new Error("Dokument ikke funnet");
  }

  const relativeFilePath = String(doc.fileUrl || "").replace(/^\//, "");
  const filePath = path.join(process.cwd(), relativeFilePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Filen ble ikke funnet: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();

  if (ext !== ".pdf") {
    throw new Error("AI-analyse støtter foreløpig kun PDF");
  }

  const pdfBuffer = fs.readFileSync(filePath);
  const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
  const extracted = await extractText(pdf, { mergePages: true });

  let totalPages = extracted.totalPages;
  let text = extracted.text;
  let usedOcr = false;

  if (!text || text.trim().length < 50) {
    const ocrResult = await extractTextWithOcr(filePath);

    text = ocrResult.text;
    totalPages = ocrResult.pageCount;
    usedOcr = true;
  }

  const aiResponse = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `
Du er en norsk dokumentanalyse-agent for Volenor.

Analyser dokumentteksten og hent ut strukturert informasjon.

VIKTIG:
Leverandør/kreditor skal hentes fra selve dokumentinnholdet.
Ikke bruk e-postavsender, filnavn eller teknisk avsender som leverandør.

Hvis dokumentet gjelder inkasso, purring, gjeld, krav, namsmann, forliksråd eller rettslig inndrivelse:
- skill mellom hovedkrav, renter, gebyrer, inkassosalær, saksomkostninger og total saldo
- finn alle parter som er nevnt
- finn opprinnelig kreditor
- finn inkassoselskap
- finn offentlig/rettslig instans hvis nevnt
- finn saksnummer eller referanse hvis mulig
- hvis bare ett beløp finnes, bruk dette som både currentBalance og originalClaim hvis det virker som hovedkrav/saldo

Returner:
- documentType
- supplier
- amount
- dueDate
- summary
- confidence
- caseType
- originalCreditor
- collectionAgency
- publicAuthority
- originalClaim
- interestAmount
- feeAmount
- collectionFee
- legalCost
- currentBalance
- deadline
- caseReference
- recommendedAction
- priority
- reason

Dokumenttekst:
${text.slice(0, 12000)}
`,
    text: {
      format: {
        type: "json_schema",
        name: "inbox_document_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            documentType: {
              type: "string",
              enum: [
                "invoice",
                "receipt",
                "bank_statement",
                "insurance",
                "debt_collection",
                "letter",
                "contract",
                "unknown",
              ],
            },
            supplier: { type: ["string", "null"] },
            amount: { type: ["number", "null"] },
            dueDate: { type: ["string", "null"] },
            summary: { type: "string" },
            confidence: { type: "number" },

            caseType: {
              type: "string",
              enum: [
                "none",
                "debt_collection",
                "debt",
                "legal",
                "payment_reminder",
                "unknown",
              ],
            },
            originalCreditor: { type: ["string", "null"] },
            collectionAgency: { type: ["string", "null"] },
            publicAuthority: { type: ["string", "null"] },
            originalClaim: { type: ["number", "null"] },
            interestAmount: { type: ["number", "null"] },
            feeAmount: { type: ["number", "null"] },
            collectionFee: { type: ["number", "null"] },
            legalCost: { type: ["number", "null"] },
            currentBalance: { type: ["number", "null"] },
            deadline: { type: ["string", "null"] },
            caseReference: { type: ["string", "null"] },
            recommendedAction: {
              type: "string",
              enum: [
                "create_case",
                "update_existing_case",
                "create_bill",
                "archive",
                "review_manually",
                "none",
              ],
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high", "urgent"],
            },
            reason: { type: "string" },
          },
          required: [
            "documentType",
            "supplier",
            "amount",
            "dueDate",
            "summary",
            "confidence",
            "caseType",
            "originalCreditor",
            "collectionAgency",
            "publicAuthority",
            "originalClaim",
            "interestAmount",
            "feeAmount",
            "collectionFee",
            "legalCost",
            "currentBalance",
            "deadline",
            "caseReference",
            "recommendedAction",
            "priority",
            "reason",
          ],
        },
      },
    },
  });

  const analysis = JSON.parse(aiResponse.output_text);

  const resolvedCase = await processInboxDocument(doc, analysis);

  await getDb().execute(sql`
    UPDATE inbox_documents
    SET
      detectedType = ${analysis.documentType},
      detectedSender = ${analysis.supplier},
      detectedAmount = ${analysis.amount},
      detectedDueDate = ${analysis.dueDate},
      aiSummary = ${analysis.summary},
      aiConfidence = ${Math.round((analysis.confidence ?? 0) * 100)}
    WHERE id = ${id}
  `);

  return {
    success: true,
    message: "Dokument analysert",
    documentId: id,
    totalPages,
    usedOcr,
    analysis,
    case: resolvedCase,
  };
}