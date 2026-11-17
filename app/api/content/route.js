import { NextResponse } from "next/server";
import { getSiteContent } from "../../../lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSiteContent(), {
    headers: { "Cache-Control": "no-store" },
  });
}
