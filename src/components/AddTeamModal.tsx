"use client";

import { useState, useEffect, useRef } from "react";
import type { DriverMeta } from "@/lib/teams";

interface Props {
  drivers: DriverMeta[];
  onAdd: (name: string, driverNumbers: number[]) => void;
  onClose: () => void;
}

export function AddTeamModal({ drivers, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(driverNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(driverNumber)) next.delete(driverNumber);
      else next.add(driverNumber);
      return next;
    });
  }

  function handleCreate() {
    if (!name.trim() || selected.size === 0) return;
    onAdd(name.trim(), Array.from(selected));
  }

  // Group drivers by team for easier selection
  const byTeam = drivers.reduce<Record<string, DriverMeta[]>>((acc, d) => {
    const team = d.teamName;
    if (!acc[team]) acc[team] = [];
    acc[team].push(d);
    return acc;
  }, {});

  const canCreate = name.trim().length > 0 && selected.size > 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700">
          <h2 className="text-base font-bold text-white">New Team</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Team name input */}
        <div className="px-5 py-4 border-b border-neutral-800">
          <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold block mb-2">
            Team Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="e.g. My Dream Team"
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-neutral-400"
          />
        </div>

        {/* Driver list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Select Drivers
            </label>
            {selected.size > 0 && (
              <span className="text-xs text-neutral-400">{selected.size} selected</span>
            )}
          </div>

          {drivers.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">
              Loading drivers…
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(byTeam).map(([teamName, teamDrivers]) => (
                <div key={teamName}>
                  <div className="text-xs text-neutral-500 mb-1.5 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: teamDrivers[0]?.teamColour ?? "#6b7280" }}
                    />
                    {teamName}
                  </div>
                  <div className="space-y-1">
                    {teamDrivers.map((d) => {
                      const isSelected = selected.has(d.driverNumber);
                      return (
                        <button
                          key={d.driverNumber}
                          onClick={() => toggle(d.driverNumber)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-red-500 bg-red-950/30"
                              : "border-neutral-700 bg-neutral-800 hover:border-neutral-500"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? "border-red-500 bg-red-500" : "border-neutral-500"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="font-mono text-xs text-neutral-400 w-6">#{d.driverNumber}</span>
                          <span className="text-sm text-white flex-1">{d.name}</span>
                          <span className="text-xs font-bold text-neutral-400">{d.acronym}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-neutral-600 text-neutral-300 text-sm hover:border-neutral-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
}
