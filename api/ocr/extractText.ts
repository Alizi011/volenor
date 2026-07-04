import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function extractTextWithOcr(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error("OCR: Filen finnes ikke");
  }

  const ext = path.extname(filePath).toLowerCase();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "volenor-ocr-"));

  try {
    const imagePaths: string[] = [];

    if (ext === ".pdf") {
      const outputPrefix = path.join(tempDir, "page");

      await execFileAsync("pdftoppm", [
        "-png",
        "-r",
        "200",
        filePath,
        outputPrefix,
      ]);

      const generatedImages = fs
        .readdirSync(tempDir)
        .filter((file) => file.endsWith(".png"))
        .sort()
        .map((file) => path.join(tempDir, file));

      imagePaths.push(...generatedImages);
    } else if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      imagePaths.push(filePath);
    } else {
      throw new Error(`OCR: Filtype støttes ikke ennå: ${ext}`);
    }

    if (imagePaths.length === 0) {
      throw new Error("OCR: Fant ingen sider/bilder å lese");
    }

    const texts: string[] = [];

    for (const imagePath of imagePaths) {
      const { stdout } = await execFileAsync("tesseract", [
        imagePath,
        "stdout",
        "-l",
        "nor+eng",
      ]);

      texts.push(stdout.trim());
    }

    return {
      text: texts.join("\n\n--- SIDE ---\n\n").trim(),
      pageCount: imagePaths.length,
      usedOcr: true,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}