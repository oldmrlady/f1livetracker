"use client";

import { DriverStanding } from "@/lib/points";
import Image from "next/image";

interface Props {
  selected: DriverStanding[];
  onRemove: (driverNumber: number) => void;
  onClear: () => void;
}

export function CombinedPointsPanel({ selected, onRemove, onClear }: Props) {
  const total = selected.reduce((sum, d) => sum + d.points, 0);

  if (selected.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center text-neutral-500 text-sm">
        Click drivers to add them to your group
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700">
        <span className="text-sm font-semibold text-neutral-200">Selected Drivers</span>
        <button
          onClick={onClear}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Driver chips */}
      <div className="p-3 flex flex-wrap gap-2">
        {selected.map((d) => (
          <div
            key={d.driverNumber}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-neutral-800 border border-neutral-600 text-sm"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.teamColour }}
            />
            {d.headshotUrl && (
              <Image
                src={d.headshotUrl}
                alt={d.name}
                width={20}
                height={20}
                className="rounded-full"
                unoptimized
              />
            )}
            <span className="text-white font-medium">{d.acronym}</span>
            <span className="text-neutral-400">{d.points}pt</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(d.driverNumber);
              }}
              className="ml-0.5 text-neutral-500 hover:text-white transition-colors leading-none"
              aria-label={`Remove ${d.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-t border-neutral-700">
        <span className="text-sm text-neutral-400">
          Combined ({selected.length} {selected.length === 1 ? "driver" : "drivers"})
        </span>
        <span className="text-2xl font-bold text-white">
          {total}
          <span className="text-base font-normal text-neutral-400 ml-1">pts</span>
        </span>
      </div>

      {/* Breakdown bar */}
      {selected.length > 1 && total > 0 && (
        <div className="px-4 pb-3">
          <div className="flex rounded-full overflow-hidden h-2">
            {selected.map((d) => (
              <div
                key={d.driverNumber}
                style={{
                  backgroundColor: d.teamColour,
                  width: `${(d.points / total) * 100}%`,
                }}
                title={`${d.acronym}: ${d.points}pts (${Math.round((d.points / total) * 100)}%)`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {selected.map((d) => (
              <span key={d.driverNumber} className="text-xs text-neutral-500">
                {d.acronym} {Math.round((d.points / total) * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
