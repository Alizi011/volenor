import "dotenv/config";

import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

// Importere verktøy for filhåndtering og statiske filer
import { serveStatic } from "@hono/node-server/serve-static";
import * as fs from "node:fs";
import * as path from "node:path";
import { getDocumentProxy, extractText } from "unpdf";
import OpenAI from "openai";

// --- KORREKTE IMPORTER BASERT PÅ PROSJEKTETS STRUKTUR ---
// Vi la til 'sql' her
import { sql } from "drizzle-orm"; 
import * as schema from "@db/schema";
import { getDb } from "./queries/connection"; 


const app = new Hono<{ Bindings: HttpBindings }>();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sørg for at den fysiske opplastingsmappen eksisterer på din VPS
const uploadDir = path.join(process.cwd(), "opplastede_dokumenter");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.put("/api/documents/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    const amount =
      body.amount === undefined || body.amount === null || body.amount === ""
        ? 0
        : Number(String(body.amount).replace(",", "."));

    if (!Number.isFinite(amount)) {
      return c.json(
        {
          success: false,
          message: "Beløp er ugyldig",
        },
        400
      );
    }

    const tags = JSON.stringify(body.tags ?? []);

    await getDb().execute(sql`
      UPDATE documents
      SET
        name = ${body.name ?? ""},
        category = ${body.category ?? ""},
          familyMemberId = ${
    body.familyMemberId === undefined || body.familyMemberId === ""
      ? null
      : Number(body.familyMemberId)
  },
        date = ${body.date ?? new Date().toISOString().slice(0, 10)},
        amount = ${amount},
        tags = ${tags},
        notes = ${body.notes ?? ""}
      WHERE id = ${id}
    `);

    return c.json({
      success: true,
      message: "Dokument oppdatert",
    });

  } catch (error: any) {
    console.error(error);
    console.error(error.message);
    console.error(error.stack);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});


// --- ENDEPUNKT FOR LIVE FILOPPLASTING ---
app.post("/api/last_opp", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["document"] as File | undefined;

    if (!file) {
      return c.json({ success: false, message: "Ingen fil mottatt." }, 400);
    }

    // Generer et unikt fysisk filnavn på serveren
    const fileExt = path.extname(file.name);
    const uniqueName = `doc_${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`;
    const targetPath = path.join(uploadDir, uniqueName);

    // Skriv filen til disken på din VPS
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);

    // Den relative stien lagres i databasen
    const relativePath = `opplastede_dokumenter/${uniqueName}`;
    const dateStr = new Date().toISOString().slice(0, 10);

    const name = (body["name"] as string) || file.name;
    const category = (body["category"] as string) || "Fakturaer";
    const tags = (body["tags"] as string) || null;
    const notes = (body["notes"] as string) || null;
    const type = (body["type"] as "pdf" | "image" | "doc") || "pdf";
    const householdId = parseInt((body["householdId"] as string) || "1");
    const familyMemberId = body["familyMemberId"] ? parseInt(body["familyMemberId"] as string) : null;
    const amount = Number(String(body["amount"] || "0").replace(",", "."));
    const financeType = (body["financeType"] as string) || "none";
    const dueDate = (body["dueDate"] as string) || null;
    const isPaid = body["isPaid"] === "1" ? 1 : 0;
    const financialDocumentType = (body["financialDocumentType"] as string) || "none";
    const financialCategory = (body["financialCategory"] as string) || null;

    // Her bruker vi getDb().execute(sql`...`) for å tvinge inn fileData feltet.
    // Vi setter tags til "[]" som standard streng i stede for null.
    await getDb().execute(sql`
      INSERT INTO documents 
      (householdId, familyMemberId, name, category, date, size, type, tags, notes, fileData, amount, financeType, dueDate, isPaid, financialDocumentType, financialCategory) 
      VALUES (${householdId}, ${familyMemberId}, ${name}, ${category}, ${dateStr}, ${file.size}, ${type}, ${tags ?? "[]"}, ${notes}, ${relativePath}, ${amount}, ${financeType}, ${dueDate}, ${isPaid}, ${financialDocumentType}, ${financialCategory})
          `);

const shouldCreateFinanceEntry =
  financeType !== "none" &&
  amount > 0;

if (shouldCreateFinanceEntry) {
  const documentRows: any = await getDb().execute(sql`
    SELECT id FROM documents
    WHERE fileData = ${relativePath}
    ORDER BY id DESC
    LIMIT 1
  `);

  

  const rows = Array.isArray(documentRows)
    ? Array.isArray(documentRows[0])
      ? documentRows[0]
      : documentRows
    : [];

  const documentId = rows[0]?.id;

  

  if (documentId) {
    await getDb().execute(sql`
      INSERT INTO finance_entries
      (householdId, familyMemberId, documentId, title, amount, type, category, date, status, notes)
      VALUES (
        ${householdId},
        ${familyMemberId},
        ${documentId},
        ${name},
        ${amount},
        ${financeType},
        ${financialCategory || category},
        ${dueDate || dateStr},
        ${isPaid === 1 ? "paid" : "pending"},
        ${notes}
      )
    `);

        // Opprett også FinancialItem i den nye økonomimotoren
    const financialStatus = isPaid === 1 ? "paid" : "unpaid";
    const financialItemType = "invoice";

    await getDb().execute(sql`
      INSERT INTO financial_items
      (
        householdId,
        familyMemberId,
        documentId,
        financeEntryId,
        title,
        type,
        status,
        creditorName,
        originalAmount,
        currentAmount,
        currency,
        category,
        dueDate,
        paidDate,
        notes
      )
      VALUES (
        ${householdId},
        ${familyMemberId},
        ${documentId},
        null,
        ${name},
        ${financialItemType},
        ${financialStatus},
        ${name},
        ${amount},
        ${isPaid === 1 ? 0 : amount},
        ${"NOK"},
        ${financialCategory || category},
        ${dueDate},
        ${isPaid === 1 ? dateStr : null},
        ${notes}
      )
    `);

    const financialRows: any = await getDb().execute(sql`
      SELECT id FROM financial_items
      WHERE documentId = ${documentId}
      ORDER BY id DESC
      LIMIT 1
    `);

    const financialResultRows = Array.isArray(financialRows)
      ? Array.isArray(financialRows[0])
        ? financialRows[0]
        : financialRows
      : [];

    const financialItemId = financialResultRows[0]?.id;

    if (financialItemId) {
      await getDb().execute(sql`
        INSERT INTO financial_events
        (
          householdId,
          financialItemId,
          documentId,
          eventType,
          title,
          description,
          amountChange,
          eventDate
        )
        VALUES (
          ${householdId},
          ${financialItemId},
          ${documentId},
          ${"invoice_created"},
          ${"Regning opprettet fra dokument"},
          ${name},
          ${amount},
          ${dateStr}
        )
      `);
    }

  } else {
    console.log("FINANCE: fant ikke documentId, økonomipost ble ikke opprettet");
  }
}

   return c.json({
  success: true,
  message: "Fil lagret fysisk og registrert i MariaDB!",
  filePath: `/${relativePath}`,
});

  } catch (error: any) {
    console.error("Opplastingsfeil på backenden:", error);
    return c.json({ success: false, message: "Serverfeil: " + error.message }, 500);
  }
});


// --- ENDEPUNKT FOR OPPLASTING AV BANKUTSKRIFT ---
app.post("/api/last_opp_bank", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["document"] as File | undefined;

    if (!file) {
      return c.json({ success: false, message: "Ingen bankutskrift mottatt." }, 400);
    }

    const fileExt = path.extname(file.name);
    const uniqueName = `bank_${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`;
    const targetPath = path.join(uploadDir, uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);

    const relativePath = `opplastede_dokumenter/${uniqueName}`;

    const name = (body["name"] as string) || file.name;
    const bankName = (body["bankName"] as string) || null;
    const accountNumber = (body["accountNumber"] as string) || null;
    const periodStart = (body["periodStart"] as string) || null;
    const periodEnd = (body["periodEnd"] as string) || null;
    const householdId = parseInt((body["householdId"] as string) || "1");
    const familyMemberId = body["familyMemberId"]
      ? parseInt(body["familyMemberId"] as string)
      : null;

    await getDb().execute(sql`
      INSERT INTO bank_statements
      (householdId, familyMemberId, name, bankName, accountNumber, periodStart, periodEnd, fileData, status)
      VALUES (${householdId}, ${familyMemberId}, ${name}, ${bankName}, ${accountNumber}, ${periodStart}, ${periodEnd}, ${relativePath}, "uploaded")
    `);

    return c.json({
      success: true,
      message: "Bankutskrift lagret!",
      filePath: `/${relativePath}`,
    });
  } catch (error: any) {
    console.error("Bankopplastingsfeil:", error);
    return c.json({ success: false, message: "Serverfeil: " + error.message }, 500);
  }
});

// --- ENDEPUNKT FOR Å HENTE BANKUTSKRIFTER ---
app.get("/api/bank_statements", async (c) => {
  try {
    const result: any = await getDb().execute(sql`
      SELECT
        id,
        householdId,
        familyMemberId,
        name,
        bankName,
        accountNumber,
        periodStart,
        periodEnd,
        fileData,
        status,
        createdAt
      FROM bank_statements
      ORDER BY createdAt DESC
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    return c.json({
      success: true,
      bankStatements: rows.map((row: any) => ({
        id: String(row.id),
        householdId: row.householdId,
        familyMemberId: row.familyMemberId,
        name: row.name,
        bankName: row.bankName,
        accountNumber: row.accountNumber,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        fileData: row.fileData ? `/${row.fileData}` : null,
        status: row.status,
        createdAt: row.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Feil ved henting av bankutskrifter:", error);
    return c.json(
      {
        success: false,
        message: "Serverfeil: " + error.message,
      },
      500
    );
  }
});

app.get("/api/inbox_documents", async (c) => {
  try {
    const result: any = await getDb().execute(sql`
      SELECT *
      FROM inbox_documents
      ORDER BY createdAt DESC
    `);

    const rows = Array.isArray(result) ? result[0] ?? result : [];

    return c.json({
      success: true,
      inboxDocuments: rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch inbox documents:", error);
    return c.json(
      { success: false, message: error.message || "Kunne ikke hente innboks" },
      500
    );
  }
});

// --- LEGG TIL ET DOKUMENT I DOKUMENTINNBOKSEN ---
app.post("/api/inbox_documents", async (c) => {
  try {
    const body = await c.req.json();

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
        ${body.householdId ?? 1},
        ${body.uploadedByUserId ?? null},
        ${body.source ?? "email"},
        ${body.fromEmail ?? null},
        ${body.subject ?? null},
        ${body.fileName},
        ${body.fileUrl},
        ${body.mimeType ?? null},
        ${body.fileSize ?? null},
        'new'
      )
    `);

    return c.json({
      success: true,
      message: "Dokument lagt i dokumentinnboksen",
    });

  } catch (error: any) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});


// --- TEST: LES TEKST FRA INNBOKS-DOKUMENT ---
app.post("/api/inbox_documents/:id/extract_text", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const result: any = await getDb().execute(sql`
      SELECT *
      FROM inbox_documents
      WHERE id = ${id}
      LIMIT 1
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    const doc = rows[0];

    if (!doc) {
      return c.json(
        { success: false, message: "Dokument ikke funnet" },
        404
      );
    }

    const relativeFilePath = String(doc.fileUrl || "").replace(/^\//, "");
    const filePath = path.join(process.cwd(), relativeFilePath);

    if (!fs.existsSync(filePath)) {
      return c.json(
        {
          success: false,
          message: "Filen ble ikke funnet på serveren.",
          filePath,
        },
        404
      );
    }

    const ext = path.extname(filePath).toLowerCase();

    if (ext !== ".pdf") {
      return c.json(
        {
          success: false,
          message: "Foreløpig støtter teksttest kun PDF.",
          fileName: doc.fileName,
          extension: ext,
        },
        400
      );
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    return c.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      totalPages,
      textLength: text.length,
      textPreview: text.slice(0, 2000),
    });
  } catch (error: any) {
    console.error("Feil ved tekstuttrekk fra innboks-dokument:", error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});

// --- SEND EKSISTERENDE DOKUMENT TIL AI-INNBOKS ---
app.post("/api/documents/:id/send_to_inbox", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const result: any = await getDb().execute(sql`
      SELECT *
      FROM documents
      WHERE id = ${id}
      LIMIT 1
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    const doc = rows[0];

    if (!doc) {
      return c.json(
        { success: false, message: "Dokument ikke funnet" },
        404
      );
    }

    const fileUrl = doc.fileData
      ? String(doc.fileData).startsWith("/")
        ? doc.fileData
        : `/${doc.fileData}`
      : null;

    if (!fileUrl) {
      return c.json(
        { success: false, message: "Dokumentet mangler filsti" },
        400
      );
    }

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
        ${doc.householdId ?? 1},
        ${null},
        ${"existing_document"},
        ${null},
        ${"Sendt fra dokumentarkiv"},
        ${doc.name ?? "Dokument"},
        ${fileUrl},
        ${doc.type ?? null},
        ${doc.size ?? null},
        ${"new"}
      )
    `);

    return c.json({
      success: true,
      message: "Dokument sendt til AI-innboks",
    });
  } catch (error: any) {
    console.error("Feil ved sending til AI-innboks:", error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});


// --- ENDEPUNKT FOR Å STARTE ANALYSE AV BANKUTSKRIFT ---
app.post("/api/analyze_bank_statement", async (c) => {
  try {
    console.log("OPENAI_API_KEY finnes:", !!process.env.OPENAI_API_KEY);
    const body = await c.req.json();
    const statementId = body.statementId;

    if (!statementId) {
      return c.json(
        {
          success: false,
          message: "statementId mangler",
        },
        400
      );
    }

    const result: any = await getDb().execute(sql`
      SELECT
        id,
        householdId,
        familyMemberId,
        name,
        bankName,
        accountNumber,
        periodStart,
        periodEnd,
        fileData,
        status,
        createdAt
      FROM bank_statements
      WHERE id = ${statementId}
      LIMIT 1
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    if (rows.length === 0) {
      return c.json(
        {
          success: false,
          message: "Bankutskrift ikke funnet",
        },
        404
      );
    }

    const statement = rows[0];

const pdfPath = path.join(process.cwd(), statement.fileData);

if (!fs.existsSync(pdfPath)) {
  return c.json(
    {
      success: false,
      message: "PDF-filen ble ikke funnet.",
    },
    404
  );
}

const pdfBuffer = fs.readFileSync(pdfPath);
const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
const { totalPages, text } = await extractText(pdf, { mergePages: true });

const transactionDateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;

const dateMatches = [...text.matchAll(transactionDateRegex)];

const transactionBlocks = dateMatches.map((match, index) => {
  const start = match.index ?? 0;
  const nextStart = dateMatches[index + 1]?.index ?? text.length;

  const rawText = text
    .slice(start, nextStart)
    .replace(/\s+/g, " ")
    .trim();

  return {
    index,
    date: match[0],
    rawText,
  };
});

const parsedTransactionsPreview = transactionBlocks
  .map((block) => {
   const amountMatches = [
  ...block.rawText.matchAll(/\b\d+(?:,\d{2})\b/g),
];

    const amountText = amountMatches[0]?.[0] ?? null;

    if (!amountText) {
      return null;
    }

    const amount = Number(
      amountText
        .replace(/\s/g, "")
        .replace(",", ".")
    );

    const description = block.rawText
      .replace(block.date, "")
      .replace(amountText, "")
      .replace(/\b\d{4}\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      index: block.index,
      date: block.date,
      description,
      amountText,
      amount,
      rawText: block.rawText,
    };
  })
  .filter(Boolean);

const transactionsForAi = parsedTransactionsPreview.slice(0, 50);

let aiPreview = null;
let aiTransactionsPreview: any[] = [];

let aiStatementMetadata: any = {
  bankName: null,
  periodStart: null,
  periodEnd: null,
  accounts: [],
};

const metadataResponse = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: `
Du er en norsk bankutskrift-parser.

Les teksten fra bankutskriften og hent ut metadata.

Returner:
- bankName: bankens navn hvis mulig
- periodStart: startdato for perioden i format YYYY-MM-DD eller null
- periodEnd: sluttdato for perioden i format YYYY-MM-DD eller null
- accounts: alle kontonumre du finner i dokumentet

For hver konto:
- accountNumber
- accountName hvis mulig
- ownerName hvis mulig
- includeSuggested: true hvis kontoen virker relevant for transaksjonsanalyse, false hvis den virker som oppsummering, lån, kredittkortoversikt eller ikke relevant

Tekst fra bankutskrift:
${text.slice(0, 6000)}
`,
  text: {
    format: {
      type: "json_schema",
      name: "bank_statement_metadata",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          bankName: { type: ["string", "null"] },
          periodStart: { type: ["string", "null"] },
          periodEnd: { type: ["string", "null"] },
          accounts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                accountNumber: { type: "string" },
                accountName: { type: ["string", "null"] },
                ownerName: { type: ["string", "null"] },
                includeSuggested: { type: "boolean" },
              },
              required: [
                "accountNumber",
                "accountName",
                "ownerName",
                "includeSuggested"
              ],
            },
          },
        },
        required: ["bankName", "periodStart", "periodEnd", "accounts"],
      },
    },
  },
});

aiStatementMetadata = JSON.parse(metadataResponse.output_text);

console.log("========== BANK METADATA ==========");
console.log(aiStatementMetadata);
console.log("==================================");



await getDb().execute(sql`
  UPDATE bank_statements
  SET
    bankName = ${aiStatementMetadata.bankName ?? statement.bankName},
    periodStart = ${aiStatementMetadata.periodStart ?? statement.periodStart},
    periodEnd = ${aiStatementMetadata.periodEnd ?? statement.periodEnd}
  WHERE id = ${statement.id}
`);

await getDb().execute(sql`
  DELETE FROM bank_statement_accounts
  WHERE statementId = ${statement.id}
`);

for (const account of aiStatementMetadata.accounts ?? []) {
  const existingBankAccountResult: any = await getDb().execute(sql`
    SELECT id
    FROM bank_accounts
    WHERE householdId = ${statement.householdId}
      AND accountNumber = ${account.accountNumber}
    LIMIT 1
  `);

  const existingBankAccountRows = Array.isArray(existingBankAccountResult)
    ? Array.isArray(existingBankAccountResult[0])
      ? existingBankAccountResult[0]
      : existingBankAccountResult
    : [];

  const matchedBankAccountId = existingBankAccountRows[0]?.id ?? null;

  await getDb().execute(sql`
    INSERT INTO bank_statement_accounts
    (
      statementId,
      householdId,
      accountNumber,
      accountName,
      ownerName,
      includeSuggested,
      matchedBankAccountId
    )
    VALUES
    (
      ${statement.id},
      ${statement.householdId},
      ${account.accountNumber},
      ${account.accountName ?? null},
      ${account.ownerName ?? null},
      ${account.includeSuggested ? 1 : 0},
      ${matchedBankAccountId}
    )
    ON DUPLICATE KEY UPDATE
      statementId = VALUES(statementId),
      accountName = VALUES(accountName),
      ownerName = VALUES(ownerName),
      includeSuggested = VALUES(includeSuggested),
      matchedBankAccountId = VALUES(matchedBankAccountId)
  `);
}


if (transactionsForAi.length > 0) {
  const aiResponse = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `
Du er en norsk banktransaksjons-parser.

Tolk disse banktransaksjonene.

Regler:
- Behold sourceIndex fra input.
- direction skal være "income", "expense" eller "unknown".
- Bruk norsk kategori hvis mulig.
- merchant er butikk/motpart hvis mulig, ellers null.
- cashflowType skal være én av:
  fixed_income, variable_income, fixed_expense, variable_expense,
  internal_transfer, private_transfer, saving_investment,
  one_time_income, one_time_expense, unknown.
- Bruk internal_transfer ved overføring mellom egne kontoer.
- Bruk private_transfer ved Vipps/familie/venner.
- Bruk fixed_income for lønn/pensjon/NAV som gjentas.
- Bruk fixed_expense for faste regninger som husleie, lån, forsikring.
- Bruk variable_expense for vanlig forbruk som mat, transport, klær.
- Bruk one_time_income eller one_time_expense når det virker som en engangshendelse.
- confidence er mellom 0 og 1.

Transaksjoner:
${JSON.stringify(transactionsForAi, null, 2)}
`,
    text: {
      format: {
        type: "json_schema",
        name: "bank_transactions_batch",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  sourceIndex: { type: "number" },
                  date: { type: "string" },
                  amount: { type: "number" },
                  direction: {
                    type: "string",
                    enum: ["income", "expense", "unknown"],
                  },
                  description: { type: "string" },
                  merchant: {
                    type: ["string", "null"],
                  },
                  category: {
  type: ["string", "null"],
},
cashflowType: {
  type: "string",
  enum: [
    "fixed_income",
    "variable_income",
    "fixed_expense",
    "variable_expense",
    "internal_transfer",
    "private_transfer",
    "saving_investment",
    "one_time_income",
    "one_time_expense",
    "unknown"
  ],
},
confidence: { type: "number" },

                },
                required: [
                  "sourceIndex",
                  "date",
                  "amount",
                  "direction",
                  "description",
                  "merchant",
                  "category",
                  "cashflowType",
                  "confidence",
                ],
              },
            },
          },
          required: ["transactions"],
        },
      },
    },
  });

  const aiParsed = JSON.parse(aiResponse.output_text);
  aiTransactionsPreview = aiParsed.transactions ?? [];
  aiPreview = aiTransactionsPreview[0] ?? null;

  await getDb().execute(sql`
  DELETE FROM bank_transactions
  WHERE statementId = ${statement.id}
`);

const detectedAccountNumber =
  aiStatementMetadata.accounts?.[0]?.accountNumber ?? null;

let matchedBankAccount: any = null;

if (detectedAccountNumber) {
  const accountResult: any = await getDb().execute(sql`
    SELECT *
    FROM bank_accounts
    WHERE householdId = ${statement.householdId}
      AND accountNumber = ${detectedAccountNumber}
    LIMIT 1
  `);

  const accountRows = Array.isArray(accountResult)
    ? Array.isArray(accountResult[0])
      ? accountResult[0]
      : accountResult
    : [];

  matchedBankAccount = accountRows[0] ?? null;
}

for (const tx of aiTransactionsPreview) {
  if (matchedBankAccount && Number(matchedBankAccount.includeInAnalysis) === 0) {
    continue;
  }

  await getDb().execute(sql`
    INSERT INTO bank_transactions
    (
      statementId,
      householdId,
      familyMemberId,
      bankAccountId,
      transactionDate,
      description,
      amount,
      balance,
      direction,
      matchStatus,
      aiConfidence,
      merchant,
      category,
      cashflowType,
      rawText,
      note,
      receiptStatus
    )
    VALUES
    (
      ${statement.id},
      ${statement.householdId},
      ${matchedBankAccount?.familyMemberId ?? statement.familyMemberId ?? null},
      ${matchedBankAccount?.id ?? null},
      ${tx.date},
      ${tx.description},
      ${tx.amount},
      ${null},
      ${tx.direction === "income" ? "income" : "expense"},
      ${"unmatched"},
      ${Math.round((tx.confidence ?? 0) * 100)},
      ${tx.merchant ?? null},
      ${tx.category ?? null},
      ${tx.cashflowType ?? "unknown"},
      ${parsedTransactionsPreview.find((p: any) => p.index === tx.sourceIndex)?.rawText ?? null},
      ${null},
      ${"none"}
    )
  `);
}

await getDb().execute(sql`
  UPDATE bank_statements
  SET status = "processed"
  WHERE id = ${statement.id}
`);

  console.log("========== AI TRANSAKSJONER ==========");
  console.log(aiTransactionsPreview.slice(0, 10));
  console.log("======================================");
}


console.log("========== BANKANALYSE ==========");

console.log("========== BANKANALYSE ==========");
console.log("statementId:", statement.id);
console.log("bank:", statement.bankName);
console.log("fileData:", statement.fileData);
console.log("PDF:", pdfPath);
console.log("Sider:", totalPages);
console.log("Tekstutdrag:", text.slice(0, 1000));
console.log("Transaksjonsblokker funnet:", transactionBlocks.length);
console.log("Transaksjonsblokker:", transactionBlocks.slice(0, 5));
console.log("Tolket preview:", parsedTransactionsPreview.slice(0, 5));
console.log("=================================");

return c.json({
  success: true,
  message: "PDF ble lest",
  totalPages,
  textPreview: text.slice(0, 1000),
  transactionBlocks,
  parsedTransactionsPreview,
  aiPreview,
  aiTransactionsPreview,
  aiStatementMetadata,
  statement: {

        id: String(statement.id),
        householdId: statement.householdId,
        familyMemberId: statement.familyMemberId,
        name: statement.name,
        bankName: statement.bankName,
        accountNumber: statement.accountNumber,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        fileData: statement.fileData ? `/${statement.fileData}` : null,
        status: statement.status,
        createdAt: statement.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Feil ved analyse av bankutskrift:", error);

    return c.json(
      {
        success: false,
        message: "Serverfeil: " + error.message,
      },
      500
    );
  }
});

app.get("/api/bank_transactions/:statementId", async (c) => {
  try {
    const statementId = Number(c.req.param("statementId"));

    const result: any = await getDb().execute(sql`
      SELECT *
      FROM bank_transactions
      WHERE statementId = ${statementId}
      ORDER BY transactionDate DESC, id DESC
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    return c.json({
      success: true,
      transactions: rows,
    });
  } catch (error: any) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});

app.put("/api/bank_transactions/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    const amount =
      body.amount === undefined || body.amount === null || body.amount === ""
        ? null
        : Number(String(body.amount).replace(",", "."));

    if (!Number.isFinite(amount)) {
      return c.json(
        {
          success: false,
          message: "Beløp er ugyldig",
        },
        400
      );
    }

    await getDb().execute(sql`
      UPDATE bank_transactions
      SET
        merchant = ${body.merchant ?? null},
        category = ${body.category ?? null},
        cashflowType = ${body.cashflowType ?? "unknown"},
        description = ${body.description ?? ""},
        direction = ${body.direction ?? "expense"},
        matchStatus = ${body.matchStatus ?? "unmatched"},
        amount = ${amount},
        note = ${body.note ?? null}
      WHERE id = ${id}
    `);

    return c.json({
      success: true,
      message: "Banktransaksjon oppdatert",
    });

  } catch (error: any) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});

app.get("/api/bank_statement_accounts/suggestions", async (c) => {
  try {
    const result: any = await getDb().execute(sql`
      SELECT
        bsa.*,
        bs.bankName
      FROM bank_statement_accounts bsa
      LEFT JOIN bank_statements bs ON bs.id = bsa.statementId
      WHERE bsa.matchedBankAccountId IS NULL OR bsa.matchedBankAccountId = 0
      ORDER BY bsa.createdAt DESC
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    return c.json({
      success: true,
      suggestions: rows,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.put("/api/bank_accounts/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    await getDb().execute(sql`
      UPDATE bank_accounts
      SET
        bankName = ${body.bankName ?? null},
        accountName = ${body.accountName ?? null},
        accountType = ${body.accountType ?? null},
        familyMemberId = ${body.familyMemberId ?? null},
        ownerFamilyMemberId = ${body.ownerFamilyMemberId ?? null},
        accountHolderName = ${body.accountHolderName ?? null},
        disposersJson = ${body.disposersJson ?? JSON.stringify(body.disposers ?? [])},
        includeInAnalysis = ${body.includeInAnalysis ? 1 : 0}
      WHERE id = ${id}
    `);

    return c.json({
      success: true,
      message: "Bankkonto oppdatert",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});

app.post("/api/bank_accounts/from_suggestion", async (c) => {
  try {
    const body = await c.req.json();
    const suggestionId = Number(body.suggestionId);
    const familyMemberId = body.familyMemberId ? Number(body.familyMemberId) : null;

    const result: any = await getDb().execute(sql`
      SELECT *
      FROM bank_statement_accounts
      WHERE id = ${suggestionId}
      LIMIT 1
    `);

    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : [];

    const suggestion = rows[0];

    if (!suggestion) {
      return c.json({ success: false, message: "Forslag ikke funnet" }, 404);
    }

    const insertResult: any = await getDb().execute(sql`
      INSERT INTO bank_accounts
      (
        householdId,
        familyMemberId,
        bankName,
        accountNumber,
        accountName,
        includeInAnalysis
      )
      VALUES
      (
        ${suggestion.householdId},
        ${familyMemberId},
        ${body.bankName ?? null},
        ${suggestion.accountNumber},
        ${suggestion.accountName ?? null},
        ${suggestion.includeSuggested ?? 1}
      )
    `);

    const newAccountId = insertResult?.[0]?.insertId ?? insertResult?.insertId ?? null;

    await getDb().execute(sql`
      UPDATE bank_statement_accounts
      SET matchedBankAccountId = ${newAccountId}
      WHERE id = ${suggestionId}
    `);

    return c.json({
      success: true,
      message: "Bankkonto opprettet",
      bankAccountId: newAccountId,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Gjør mappen tilgjengelig over HTTP for visning og nedlasting
app.use("/opplastede_dokumenter/*", serveStatic({ root: "." }));

// --- TRPC ADAPTER ---
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Fallback for ukjente API-ruter
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");

  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");

  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}