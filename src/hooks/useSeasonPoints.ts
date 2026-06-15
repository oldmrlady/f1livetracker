"use client";

import useSWR from "swr";
import type { SeasonPointsResponse } from "@/lib/teams";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_error");
  return res.json();
}

export function useSeasonPoints() {
  const { data, error, isLoading } = useSWR<SeasonPointsResponse>(
    "/api/f1/season-points",
    fetcher,
    { refreshInterval: 300_000 }
  );

  return {
    pointsByDriver: data?.pointsByDriver ?? {},
    drivers: data?.drivers ?? [],
    standings: data?.standings ?? [],
    round: data?.round ?? 0,
    isLoading,
    error,
  };
}
