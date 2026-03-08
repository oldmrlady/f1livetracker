"use client";

import { DriverStanding } from "@/lib/points";
import Image from "next/image";

interface Props {
  standing: DriverStanding;
}

export function DriverCard({ standing }: Props) {
  const { driverNumber, name, acronym, teamName, teamColour, headshotUrl, position, points } =
    standing;

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-3">
      {/* Position badge */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className="text-lg font-bold text-neutral-300">{position}</span>
      </div>

      {/* Team colour bar */}
      <div
        className="flex-shrink-0 w-1 h-10 rounded-full"
        style={{ backgroundColor: teamColour }}
      />

      {/* Headshot */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-neutral-800">
        {headshotUrl ? (
          <Image
            src={headshotUrl}
            alt={name}
            width={40}
            height={40}
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 font-bold">
            {acronym}
          </div>
        )}
      </div>

      {/* Driver info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{name}</div>
        <div className="text-xs text-neutral-400 truncate">{teamName}</div>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-white">{points}</div>
      </div>
    </div>
  );
}
