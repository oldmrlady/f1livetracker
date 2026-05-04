"use client";

import useSWR from "swr";
import type { SeasonPointsResponse } from "@/lib/teams";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error("auth_required") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error("fetch_error");
  return res.json();
}

export function useSeasonPoints() {
  const { data, error, isLoading } = useSWR<SeasonPointsResponse>(
    "/api/f1/season-points",
    fetcher,
    {
      refreshInterval: (data) => (data?.hasLiveData ? 30_000 : 0),
      shouldRetryOnError: (err) => err?.message !== "auth_required",
    }
  );

  return {
    pointsByDriver: data?.pointsByDriver ?? {},
    drivers: data?.drivers ?? [],
    sessionCount: data?.sessionCount ?? 0,
    hasLiveData: data?.hasLiveData ?? false,
    isLoading,
    error,
  };
}
