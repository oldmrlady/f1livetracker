import { NextResponse } from "next/server";
import { getLatestSession, OpenF1AuthError } from "@/lib/openf1";

export async function GET() {
  try {
    const session = await getLatestSession();
    return NextResponse.json(session);
  } catch (e) {
    if (e instanceof OpenF1AuthError) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
