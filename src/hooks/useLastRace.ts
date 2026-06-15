"use client";

import useSWR from "swr";
import type { LastRace } from "@/lib/jolpica";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch_error");
  return res.json();
}

export function useLastRace() {
  const { data, error, isLoading } = useSWR<LastRace | null>(
    "/api/f1/last-race",
    fetcher,
    { refreshInterval: 300_000 }
  );

  return { race: data ?? null, isLoading, error };
}
