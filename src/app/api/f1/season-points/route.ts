import { NextResponse } from "next/server";
import { getSessions, getDriversForMeeting, getPositionsForSession, OpenF1AuthError, F1_POINTS } from "@/lib/openf1";
import type { DriverMeta, SeasonPointsResponse } from "@/lib/teams";

function positionToPoints(position: number): number {
  return F1_POINTS[position - 1] ?? 0;
}

export async function GET() {
  try {
    const now = Date.now();
    const year = new Date().getFullYear();

    const sessions = await getSessions(year);
    const raceSessions = sessions.filter(
      (s) => new Date(s.date_start).getTime() <= now
    );

    if (!raceSessions.length) {
      return NextResponse.json({
        pointsByDriver: {},
        drivers: [],
        year,
        sessionCount: 0,
        hasLiveData: false,
      } satisfies SeasonPointsResponse);
    }

    const liveSession = raceSessions.find(
      (s) => new Date(s.date_start).getTime() <= now && new Date(s.date_end).getTime() >= now
    );

    // Fetch positions for all started sessions in parallel
    const positionResults = await Promise.allSettled(
      raceSessions.map((s) => {
        const isLive = liveSession?.session_key === s.session_key;
        return getPositionsForSession(s.session_key, isLive ? false : 3600);
      })
    );

    // Aggregate points per driver across all sessions
    const pointsByDriver: Record<number, number> = {};
    for (const result of positionResults) {
      if (result.status !== "fulfilled") continue;
      for (const pos of result.value) {
        const pts = positionToPoints(pos.position);
        pointsByDriver[pos.driver_number] = (pointsByDriver[pos.driver_number] ?? 0) + pts;
      }
    }

    // Get driver metadata from all sessions of each meeting (better coverage)
    const meetingKeys = [...new Set(raceSessions.map((s) => s.meeting_key))];
    const meetingDriverArrays = await Promise.all(
      meetingKeys.map((k) => getDriversForMeeting(k))
    );
    // Merge all drivers across meetings, picking best data per driver number
    const bestDriverMap = new Map<number, (typeof meetingDriverArrays)[0][0]>();
    for (const arr of meetingDriverArrays) {
      for (const d of arr) {
        const ex = bestDriverMap.get(d.driver_number);
        const score = (x: typeof d) => (x.full_name ? 2 : 0) + (x.headshot_url ? 1 : 0);
        if (!ex || score(d) > score(ex)) bestDriverMap.set(d.driver_number, d);
      }
    }
    const rawDrivers = Array.from(bestDriverMap.values());
    const drivers: DriverMeta[] = rawDrivers.map((d) => ({
      driverNumber: d.driver_number,
      name: d.full_name ?? `Driver #${d.driver_number}`,
      acronym: d.name_acronym ?? `#${d.driver_number}`,
      teamName: d.team_name ?? "Unknown Team",
      teamColour: d.team_colour ? `#${d.team_colour}` : "#6b7280",
      headshotUrl: d.headshot_url,
    }));

    return NextResponse.json({
      pointsByDriver,
      drivers,
      year,
      sessionCount: raceSessions.length,
      hasLiveData: !!liveSession,
    } satisfies SeasonPointsResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof OpenF1AuthError) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch season points" }, { status: 500 });
  }
}
