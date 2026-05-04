"use client";

import { useRef } from "react";
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

export function useLiveStandings(sessionKey: number | null, meetingKey?: number | null, sessionName?: string | null) {
  const lastStandings = useRef<DriverStanding[]>([]);

  const { data, error, isLoading } = useSWR<DriverStanding[]>(
    sessionKey
      ? `/api/f1/standings?session_key=${sessionKey}${meetingKey ? `&meeting_key=${meetingKey}` : ""}${sessionName ? `&session_name=${encodeURIComponent(sessionName)}` : ""}`
      : null,
    fetcher,
    { refreshInterval: 5000, shouldRetryOnError: (err) => err?.message !== "auth_required" }
  );

  // Preserve the last non-empty standings so they stay visible after a race ends
  if (data && data.length > 0) {
    lastStandings.current = data;
  }

  const authRequired = error?.message === "auth_required";
  const standings = (data && data.length > 0) ? data : lastStandings.current;

  return { standings, error, isLoading, authRequired };
}
