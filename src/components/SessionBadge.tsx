"use client";

import { Session } from "@/lib/openf1";

interface Props {
  session: Session | null;
  isLoading: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  started: "bg-green-500 animate-pulse",
  finished: "bg-neutral-500",
  upcoming: "bg-yellow-500",
};

export function SessionBadge({ session, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="h-6 w-48 bg-neutral-800 rounded-full animate-pulse" />
    );
  }

  if (!session) return null;

  const status = session.status ?? "finished";
  const dot = STATUS_STYLES[status] ?? "bg-neutral-500";

  return (
    <div className="flex items-center gap-2 rounded-full bg-neutral-800 px-3 py-1 text-sm">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-neutral-200 font-medium">
        {session.country_name} — {session.session_name}
      </span>
      <span className="text-neutral-500 capitalize">{status}</span>
    </div>
  );
}
