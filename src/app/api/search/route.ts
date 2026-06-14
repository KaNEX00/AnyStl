import { NextRequest, NextResponse } from "next/server";
import { SearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchAll } = await import("@/lib/scrapers");
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    const { results, errors } = await searchAll(query);
    const response: SearchResponse & { errors?: string[] } = {
      query,
      results,
    };
    if (errors.length > 0) response.errors = errors;
    return NextResponse.json(response);
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: `Search failed: ${error}` },
      { status: 500 }
    );
  }
}
