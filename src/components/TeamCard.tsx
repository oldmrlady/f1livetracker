"use client";

import type { TeamWithPoints } from "@/lib/teams";

interface Props {
  team: TeamWithPoints;
  sessionCount: number;
  onDelete?: (id: string) => void;
}

export function TeamCard({ team, sessionCount, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700">
        <span className="font-semibold text-white truncate">{team.name}</span>
        {onDelete && (
          <button
            onClick={() => onDelete(team.id)}
            className="ml-2 flex-shrink-0 text-neutral-500 hover:text-red-400 transition-colors"
            aria-label={`Delete ${team.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Driver chips */}
      <div className="p-3 flex flex-wrap gap-2">
        {team.drivers.map((d) => (
          <div
            key={d.driverNumber}
            className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-600 text-xs"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.teamColour }}
            />
            <span className="text-white font-medium">{d.acronym}</span>
            <span className="text-neutral-400">
              {team.driverPoints?.[d.driverNumber] ?? 0}pt
            </span>
          </div>
        ))}
        {team.drivers.length === 0 && (
          <span className="text-xs text-neutral-500">No driver data yet</span>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-t border-neutral-700">
        <span className="text-xs text-neutral-400">
          {sessionCount} {sessionCount === 1 ? "race" : "races"}
        </span>
        <span className="text-2xl font-bold text-white">
          {team.totalPoints}
          <span className="text-base font-normal text-neutral-400 ml-1">pts</span>
        </span>
      </div>
    </div>
  );
}
