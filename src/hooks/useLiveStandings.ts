"use client";

import useSWR from "swr";
import { DriverStanding } from "@/lib/points";

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

export function useLiveStandings(sessionKey: number | null, meetingKey?: number | null) {
  const { data, error, isLoading } = useSWR<DriverStanding[]>(
    sessionKey
      ? `/api/f1/standings?session_key=${sessionKey}${meetingKey ? `&meeting_key=${meetingKey}` : ""}`
      : null,
    fetcher,
    { refreshInterval: 5000, shouldRetryOnError: false }
  );

  const authRequired = error?.message === "auth_required";

  return { standings: data ?? [], error, isLoading, authRequired };
}
