"use client";

import type { TeamWithPoints } from "@/lib/teams";
import { useSeasonPoints } from "@/hooks/useSeasonPoints";
import { useLastRace } from "@/hooks/useLastRace";
import { useTeams } from "@/hooks/useTeams";
import { DriverCard } from "@/components/DriverCard";
import { TeamCard } from "@/components/TeamCard";

export default function Home() {
  const { pointsByDriver, drivers, round } = useSeasonPoints();
  const { race, isLoading: raceLoading } = useLastRace();
  const { teams, deleteTeam } = useTeams();

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
            <h1 className="text-lg font-bold text-white">Points Tracker</h1>
          </div>
          {round > 0 && (
            <span className="text-xs text-neutral-500">After Round {round}</span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Teams */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-3">
            Teams
          </h2>

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
                  sessionCount={round}
                  onDelete={i >= 3 ? deleteTeam : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* Last race results */}
        <section>
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              {race ? race.raceName : "Last Race"}
            </h2>
            {race && (
              <span className="text-xs text-neutral-600">
                Round {race.round} · {new Date(race.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {raceLoading && (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-neutral-900 animate-pulse" />
              ))}
            </div>
          )}

          {!raceLoading && !race && (
            <div className="rounded-xl border border-dashed border-neutral-800 p-12 text-center">
              <p className="text-neutral-500 text-sm">No race results available yet.</p>
            </div>
          )}

          {race && race.results.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {race.results.map((result) => (
                <DriverCard key={result.driverNumber} result={result} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
