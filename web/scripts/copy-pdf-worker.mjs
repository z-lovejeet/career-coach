// Copies the pdf.js worker into public/ so the browser can load it for CV parsing.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const source = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
if (existsSync(source)) {
  mkdirSync("public", { recursive: true });
  copyFileSync(source, "public/pdf.worker.min.mjs");
} else {
  console.warn("[postinstall] pdfjs-dist not installed yet; skipping worker copy");
}
