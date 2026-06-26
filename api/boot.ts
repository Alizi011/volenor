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

// --- KORREKTE IMPORTER BASERT PÅ PROSJEKTETS STRUKTUR ---
// Vi la til 'sql' her
import { sql } from "drizzle-orm"; 
import * as schema from "@db/schema";
import { getDb } from "./queries/connection"; 

const app = new Hono<{ Bindings: HttpBindings }>();

// Sørg for at den fysiske opplastingsmappen eksisterer på din VPS
const uploadDir = path.join(process.cwd(), "opplastede_dokumenter");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

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
    const amount = parseInt((body["amount"] as string) || "0");
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

// --- ENDEPUNKT FOR Å STARTE ANALYSE AV BANKUTSKRIFT ---
app.post("/api/analyze_bank_statement", async (c) => {
  try {
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

    console.log("========== BANKANALYSE ==========");
    console.log("statementId:", statement.id);
    console.log("bank:", statement.bankName);
    console.log("accountNumber:", statement.accountNumber);
    console.log("fileData:", statement.fileData);
    console.log("status:", statement.status);
    console.log("=================================");

    return c.json({
      success: true,
      message: "Analyse-endepunkt fungerer",
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