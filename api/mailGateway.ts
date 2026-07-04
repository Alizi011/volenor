import { Hono } from "hono";
import * as fs from "node:fs";
import * as path from "node:path";
import { simpleParser } from "mailparser";

export const mailGatewayRouter = new Hono();

mailGatewayRouter.get("/api/mail_gateway/messages", async (c) => {
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

mailGatewayRouter.get("/api/mail_gateway/parse_first", async (c) => {
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