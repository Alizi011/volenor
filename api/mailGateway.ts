import { Hono } from "hono";
import * as fs from "node:fs";
import * as path from "node:path";
import { simpleParser } from "mailparser";
import { createInboxDocumentPackage } from "./mail/importer";

export const mailGatewayRouter = new Hono();

mailGatewayRouter.get("/messages", async (c) => {
  try {
    const maildirNew = "/root/Maildir/new";

    if (!fs.existsSync(maildirNew)) {
      return c.json({ success: true, messages: [], message: "Maildir/new finnes ikke ennå" });
    }

    const files = fs.readdirSync(maildirNew);

    const messages = files.map((fileName) => {
      const filePath = path.join(maildirNew, fileName);
      const raw = fs.readFileSync(filePath, "utf8");

      return {
        fileName,
        filePath,
        from: raw.match(/^From:\s*(.*)$/im)?.[1] ?? null,
        to: raw.match(/^To:\s*(.*)$/im)?.[1] ?? null,
        subject: raw.match(/^Subject:\s*(.*)$/im)?.[1] ?? null,
        date: raw.match(/^Date:\s*(.*)$/im)?.[1] ?? null,
        preview: raw.slice(0, 1000),
      };
    });

    return c.json({ success: true, count: messages.length, messages });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

mailGatewayRouter.get("/parse_first", async (c) => {
  try {
    const maildirNew = "/root/Maildir/new";

    if (!fs.existsSync(maildirNew)) {
      return c.json({ success: false, message: "Maildir finnes ikke" });
    }

    const files = fs.readdirSync(maildirNew);

    if (files.length === 0) {
      return c.json({ success: false, message: "Ingen e-poster funnet" });
    }

    const filePath = path.join(maildirNew, files[0]);
    const parsed = await simpleParser(fs.readFileSync(filePath));

    return c.json({
      success: true,
      subject: parsed.subject,
      from: parsed.from?.text,
      to: Array.isArray(parsed.to)
        ? parsed.to.map((t) => t.text).join(", ")
        : parsed.to?.text,
      text: parsed.text?.substring(0, 500),
      html: parsed.html ? true : false,
      attachments: parsed.attachments.map((a) => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      })),
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
  });

  mailGatewayRouter.post("/import_first", async (c) => {
  try {
    const maildirNew = "/root/Maildir/new";
    const processedDir = "/root/Maildir/processed";
    const processingDir = "/root/Maildir/processing";

    if (!fs.existsSync(maildirNew)) {
      return c.json({ success: false, message: "Maildir finnes ikke" }, 404);
    }

    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    if (!fs.existsSync(processingDir)) {
  fs.mkdirSync(processingDir, { recursive: true });
}
    const files = fs.readdirSync(maildirNew);

    if (files.length === 0) {
      return c.json({ success: false, message: "Ingen e-poster funnet" }, 404);
    }

    const mailFileName = files[0];
    const originalMailFilePath = path.join(maildirNew, mailFileName);
    const mailFilePath = path.join(processingDir, mailFileName);

fs.renameSync(originalMailFilePath, mailFilePath);

const parsed = await simpleParser(fs.readFileSync(mailFilePath));

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

    const attachments = parsed.attachments.filter((a) =>
      allowedTypes.includes(a.contentType)
    );

if (attachments.length === 0) {
  fs.renameSync(mailFilePath, path.join(processedDir, mailFileName));

  return c.json(
    {
      success: false,
      message: "E-posten har ingen støttede vedlegg",
      subject: parsed.subject,
    },
    400
  );
}

    const uploadRoot = path.join(process.cwd(), "opplastede_dokumenter");
    const emailUploadDir = path.join(uploadRoot, "email");

    if (!fs.existsSync(emailUploadDir)) {
      fs.mkdirSync(emailUploadDir, { recursive: true });
    }

    const savedFiles = attachments.map((attachment, index) => {
      const originalFileName = attachment.filename || `vedlegg_${index + 1}`;
      const safeName = originalFileName.replace(/[^a-zA-Z0-9æøåÆØÅ._-]/g, "_");
      const storedFileName = `email_${Date.now()}_${Math.round(
        Math.random() * 1e9
      )}_${safeName}`;

      const targetPath = path.join(emailUploadDir, storedFileName);
      fs.writeFileSync(targetPath, attachment.content);

      const fileUrl = `/opplastede_dokumenter/email/${storedFileName}`;

      return {
        originalFileName,
        storedFileName,
        fileUrl,
        mimeType: attachment.contentType ?? null,
        fileSize: attachment.size ?? null,
        pageCount: null,
        displayOrder: index,
      };
    });

    const mainFile = savedFiles[0];

    const result = await createInboxDocumentPackage({
      householdId: 1,
      uploadedByUserId: null,
      source: "email",
      fromEmail: parsed.from?.text ?? null,
      subject: parsed.subject ?? null,
      fileName: parsed.subject || mainFile.originalFileName || "E-post dokumentpakke",
      fileUrl: mainFile.fileUrl,
      mimeType: mainFile.mimeType,
      fileSize: savedFiles.reduce((sum, file) => sum + (file.fileSize ?? 0), 0),
      status: "new",
      files: savedFiles,
    });

    fs.renameSync(mailFilePath, path.join(processedDir, mailFileName));

    return c.json({
      success: true,
      message: "E-post importert som dokumentpakke",
      inboxDocumentId: result.inboxDocumentId,
      fileCount: result.fileCount,
      subject: parsed.subject,
      from: parsed.from?.text ?? null,
    });
  } catch (error: any) {
    console.error("Feil ved import av e-post:", error);

    return c.json(
      {
        success: false,
        message: error.message,
      },
      500
    );
  }
});
