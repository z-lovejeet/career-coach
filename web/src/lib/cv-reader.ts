"use client";

/**
 * Reads a CV in the browser.
 *  - PDF with a text layer → extract text (pdf.js). Only text is sent to the server.
 *  - Scanned PDF (little or no text) → render up to 3 pages to JPEG for vision OCR.
 *  - Image (PNG / JPG / WebP) → downscale and send for vision OCR.
 */
export type CvPayload = { kind: "text"; text: string; pages: number } | { kind: "images"; images: string[]; pages: number };

const MAX_BYTES = 8 * 1024 * 1024;

export async function readCv(file: File, onStage?: (stage: string) => void): Promise<CvPayload> {
  if (file.size > MAX_BYTES) throw new Error("That file is larger than 8 MB.");
  if (file.type.startsWith("image/")) {
    onStage?.("Preparing image for OCR");
    return { kind: "images", images: [await downscale(await loadImage(URL.createObjectURL(file)))], pages: 1 };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Upload a PDF or an image (PNG, JPG).");
  }

  onStage?.("Opening PDF");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;

  onStage?.("Extracting text");
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    const out: string[] = [];
    for (const item of content.items as Array<{ str: string; transform: number[]; hasEOL?: boolean }>) {
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 4) { out.push(line); line = ""; }
      line += (line && !line.endsWith(" ") ? " " : "") + item.str;
      if (item.hasEOL) { out.push(line); line = ""; }
      lastY = y ?? lastY;
    }
    out.push(line);
    pages.push(out.map((l) => l.trim()).filter(Boolean).join("\n"));
  }
  const text = pages.join("\n\n").trim();
  if (text.replace(/\s/g, "").length >= 200) return { kind: "text", text, pages: doc.numPages };

  onStage?.("Scanned document detected — rendering pages for OCR");
  const images: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.82));
  }
  return { kind: "images", images, pages: doc.numPages };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open that image."));
    img.src = src;
  });
}

function downscale(img: HTMLImageElement, max = 1700): Promise<string> {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return Promise.resolve(canvas.toDataURL("image/jpeg", 0.85));
}
