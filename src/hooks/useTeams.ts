"use client";

import { useState, useEffect } from "react";
import { TEAMS_STORAGE_KEY, type Team } from "@/lib/teams";

function readTeams(): Team[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TEAMS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(() => readTeams());

  useEffect(() => {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  }, [teams]);

  function addTeam(name: string, driverNumbers: number[]) {
    const team: Team = {
      id: crypto.randomUUID(),
      name,
      driverNumbers,
      createdAt: Date.now(),
    };
    setTeams((prev) => [...prev, team]);
  }

  function deleteTeam(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  return { teams, addTeam, deleteTeam };
}
