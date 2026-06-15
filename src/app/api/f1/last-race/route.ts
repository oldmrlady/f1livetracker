import { NextResponse } from "next/server";
import { getLastRaceResults } from "@/lib/jolpica";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const race = await getLastRaceResults(year);
    return NextResponse.json(race, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch last race" }, { status: 500 });
  }
}
