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

    // Den relative stien lagres i 'fileData'-kolonnen i databasen
    const relativePath = `opplastede_dokumenter/${uniqueName}`;
    const dateStr = new Date().toISOString().slice(0, 10);

    const name = (body["name"] as string) || file.name;
    const category = (body["category"] as string) || "Fakturaer";
    const tags = (body["tags"] as string) || null;
    const notes = (body["notes"] as string) || null;
    const type = (body["type"] as "pdf" | "image" | "doc") || "pdf";
    const householdId = parseInt((body["householdId"] as string) || "1");
    const familyMemberId = body["familyMemberId"] ? parseInt(body["familyMemberId"] as string) : null;

    // Her bruker vi getDb() og schema.documents nøyaktig slik resten av appen din gjør!
    await getDb().insert(schema.documents).values({
      householdId,
      familyMemberId,
      name,
      category,
      date: dateStr,
      size: file.size, 
      type,
      tags,
      notes,
      fileData: relativePath, 
    });

    return c.json({ success: true, message: "Fil lagret fysisk og registrert i MariaDB!" });

  } catch (error: any) {
    console.error("Opplastingsfeil på backenden:", error);
    return c.json({ success: false, message: "Serverfeil: " + error.message }, 500);
  }
});

// Gjør mappen tilgjengelig over HTTP for visning og nedlasting
app.use("/opplastede_dokumenter/*", serveStatic({ root: "." }));
// ---------------------------------------------

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

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