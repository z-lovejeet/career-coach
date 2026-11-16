import { extractFromImages, extractFromText } from "@/server/agents/cv-extractor";
import { enforceQuota, fail, handleError, ok, readJSON, requireUser } from "@/server/http";

export const maxDuration = 60;

/** POST { text } for text PDFs, or { images: dataURL[] } for scanned CVs (vision OCR). */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await readJSON<{ text?: unknown; images?: unknown }>(request);
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const images = Array.isArray(body.images)
      ? body.images.filter((i): i is string => typeof i === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(i) && i.length < 4_500_000)
      : [];

    if (text.length < 80 && images.length === 0) return fail(400, "empty_cv", "We couldn't read any text from that file.");
    await enforceQuota(session, "cv", 12);

    const result = text.length >= 80 ? await extractFromText(text) : await extractFromImages(images);
    return ok({ profile: result.data, method: text.length >= 80 ? "text" : "ocr", model: result.meta.model });
  } catch (error) {
    return handleError(error, "cv/extract");
  }
}
