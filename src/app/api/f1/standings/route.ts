import { NextRequest, NextResponse } from "next/server";
import { getDrivers, getDriversForMeeting, getLatestPositions, OpenF1AuthError } from "@/lib/openf1";
import { buildStandings } from "@/lib/points";

export async function GET(req: NextRequest) {
  const sessionKey = req.nextUrl.searchParams.get("session_key");
  if (!sessionKey) {
    return NextResponse.json({ error: "session_key required" }, { status: 400 });
  }

  const meetingKey = req.nextUrl.searchParams.get("meeting_key");
  const sessionName = req.nextUrl.searchParams.get("session_name") ?? "";
  const isSprint = sessionName.toLowerCase().includes("sprint");

  try {
    const [sessionDrivers, meetingDrivers, positions] = await Promise.all([
      getDrivers(Number(sessionKey)),
      meetingKey ? getDriversForMeeting(Number(meetingKey)) : Promise.resolve([]),
      getLatestPositions(Number(sessionKey)),
    ]);

    // Merge: prefer session-level data, fill gaps with meeting-level data
    const meetingMap = new Map(meetingDrivers.map((d) => [d.driver_number, d]));
    const drivers = sessionDrivers.map((d) => {
      const m = meetingMap.get(d.driver_number);
      if (!m) return d;
      return {
        ...d,
        full_name: d.full_name ?? m.full_name,
        name_acronym: d.name_acronym ?? m.name_acronym,
        team_name: d.team_name ?? m.team_name,
        team_colour: d.team_colour ?? m.team_colour,
        headshot_url: d.headshot_url ?? m.headshot_url,
      };
    });
    // Include any drivers in meeting data not yet in session data
    const sessionNums = new Set(sessionDrivers.map((d) => d.driver_number));
    for (const d of meetingDrivers) {
      if (!sessionNums.has(d.driver_number)) drivers.push(d);
    }

    const standings = buildStandings(positions, drivers, isSprint);
    return NextResponse.json(standings, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof OpenF1AuthError) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
