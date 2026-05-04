"use client";


import useSWR from "swr";
import { Session } from "@/lib/openf1";
import type { TeamWithPoints } from "@/lib/teams";
import { useLiveStandings } from "@/hooks/useLiveStandings";
import { useSeasonPoints } from "@/hooks/useSeasonPoints";
import { useTeams } from "@/hooks/useTeams";
import { DriverCard } from "@/components/DriverCard";
import { SessionBadge } from "@/components/SessionBadge";
import { TeamCard } from "@/components/TeamCard";


async function sessionFetcher(url: string) {
  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error("auth_required") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error("fetch_error");
  return res.json();
}

export default function Home() {

  const { data: session, isLoading: sessionLoading, error: sessionError } = useSWR<Session>(
    "/api/f1/session",
    sessionFetcher,
    { refreshInterval: 30_000, shouldRetryOnError: (err) => err?.message !== "auth_required" }
  );

  const isSprint = session?.session_name?.toLowerCase() === "sprint";

  const { standings, isLoading: standingsLoading, authRequired } = useLiveStandings(
    session?.session_key ?? null,
    session?.meeting_key ?? null,
    session?.session_name ?? null
  );

  const { pointsByDriver, drivers, sessionCount } = useSeasonPoints();
  const { teams, deleteTeam } = useTeams();

  const needsApiKey = sessionError?.message === "auth_required" || authRequired;

  // Enrich live standings with season driver metadata when current session data is sparse
  const driverMetaMap = new Map(drivers.map((d) => [d.driverNumber, d]));
  const enrichedStandings = standings.map((s) => {
    const meta = driverMetaMap.get(s.driverNumber);
    if (!meta) return s;
    return {
      ...s,
      name: s.name.startsWith("Driver #") ? meta.name : s.name,
      acronym: s.acronym.startsWith("#") ? meta.acronym : s.acronym,
      teamName: s.teamName === "Unknown Team" ? meta.teamName : s.teamName,
      teamColour: s.teamColour === "#6b7280" ? meta.teamColour : s.teamColour,
      headshotUrl: s.headshotUrl ?? meta.headshotUrl,
    };
  });

  const isLive = session?.status === "started";
  const isEmpty = !standingsLoading && standings.length === 0;

  const teamsWithPoints: TeamWithPoints[] = teams.map((team) => {
    const driverPoints: Record<number, number> = {};
    for (const n of team.driverNumbers) {
      driverPoints[n] = pointsByDriver[n] ?? 0;
    }
    return {
      ...team,
      totalPoints: Object.values(driverPoints).reduce((s, p) => s + p, 0),
      driverPoints,
      drivers: team.driverNumbers
        .map((n) => drivers.find((d) => d.driverNumber === n))
        .filter(Boolean) as TeamWithPoints["drivers"],
    };
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">F1</div>
            <h1 className="text-lg font-bold text-white">Live Points Tracker</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && (
              <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/30 animate-pulse">
                LIVE
              </span>
            )}
            <SessionBadge session={session ?? null} isLoading={sessionLoading} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* API key required banner */}
        {needsApiKey && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex gap-3">
            <span className="text-yellow-400 text-lg flex-shrink-0">⚠</span>
            <div className="text-sm">
              <p className="font-semibold text-yellow-300 mb-0.5">API key required during live sessions</p>
              <p className="text-yellow-400/80">
                OpenF1 restricts all access during a live session — a paid API key is required.{" "}
                Get one at{" "}
                <a
                  href="https://openf1.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-300"
                >
                  openf1.org
                </a>
                , then add{" "}
                <code className="font-mono bg-yellow-500/20 px-1 rounded">OPENF1_USERNAME</code>
                {" "}and{" "}
                <code className="font-mono bg-yellow-500/20 px-1 rounded">OPENF1_PASSWORD</code>
                {" "}to your <code className="font-mono bg-yellow-500/20 px-1 rounded">.env.local</code> and restart.
              </p>
            </div>
          </div>
        )}

        {/* Teams */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Teams
            </h2>
          </div>

          {teamsWithPoints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center text-neutral-500 text-sm">
              Create a team to track cumulative season points across drivers
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {teamsWithPoints.map((team, i) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  sessionCount={sessionCount}
                  onDelete={i >= 3 ? deleteTeam : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* Race standings */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-3">
            Race Standings
          </h2>

          {standingsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-neutral-900 animate-pulse" />
              ))}
            </div>
          )}

          {isEmpty && !sessionLoading && (
            <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
              <p className="text-neutral-500 text-sm">No race data available.</p>
              <p className="text-neutral-600 text-xs mt-1">
                Data will appear when a race session is active.
              </p>
            </div>
          )}

          {enrichedStandings.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {enrichedStandings.map((standing) => (
                <DriverCard
                  key={standing.driverNumber}
                  standing={standing}
                />
              ))}
            </div>
          )}
        </section>

        {/* Points key */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-2">
            Points System{isSprint ? " — Sprint" : ""}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(isSprint ? [8, 7, 6, 5, 4, 3, 2, 1] : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]).map((pts, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs"
              >
                <span className="text-neutral-500">P{i + 1}</span>
                <span className="font-bold text-white">{pts}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

    </main>
  );
}
