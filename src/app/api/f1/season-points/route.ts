import { NextResponse } from "next/server";
import { getDriverStandings } from "@/lib/jolpica";
import type { SeasonPointsResponse } from "@/lib/teams";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const { standings, round } = await getDriverStandings(year);

    const pointsByDriver: Record<number, number> = {};
    for (const s of standings) {
      pointsByDriver[s.driverNumber] = s.points;
    }

    const drivers = standings.map((s) => ({
      driverNumber: s.driverNumber,
      name: s.name,
      acronym: s.acronym,
      teamName: s.teamName,
      teamColour: s.teamColour,
      headshotUrl: null,
    }));

    return NextResponse.json({
      pointsByDriver,
      drivers,
      standings,
      year,
      round,
    } satisfies SeasonPointsResponse, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}
