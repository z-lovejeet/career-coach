import { searchCareers } from "@/server/onet/catalogue";
import { handleError, ok, requireUser } from "@/server/http";

export async function GET(request: Request) {
  try {
    await requireUser();
    const q = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
    return ok(searchCareers(q, 8));
  } catch (error) {
    return handleError(error, "careers/search");
  }
}
