"use client";

import type { RaceResult } from "@/lib/jolpica";

interface Props {
  result: RaceResult;
}

export function DriverCard({ result }: Props) {
  const { position, name, acronym, teamName, teamColour, points, status, fastestLap } = result;
  // Classified finishers: "Finished", "+1 Lap", "+2 Laps", "Lapped", etc.
  const dnf = status !== "Finished" && !status.startsWith("+") && !status.toLowerCase().includes("lap");

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-3">
      {/* Position badge */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className={`text-lg font-bold ${dnf ? "text-neutral-600" : "text-neutral-300"}`}>
          {dnf ? "—" : position}
        </span>
      </div>

      {/* Team colour bar */}
      <div
        className="flex-shrink-0 w-1 h-10 rounded-full"
        style={{ backgroundColor: teamColour }}
      />

      {/* Acronym avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center text-xs text-neutral-400 font-bold">
        {acronym}
      </div>

      {/* Driver info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{name}</div>
        <div className="text-xs text-neutral-400 truncate">
          {teamName}
          {dnf && <span className="ml-1.5 text-red-400">{status}</span>}
        </div>
      </div>

      {/* Points + fastest lap */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-white">{points > 0 ? points : ""}</div>
        {fastestLap && (
          <div className="text-xs text-purple-400 font-semibold">FL</div>
        )}
      </div>
    </div>
  );
}
