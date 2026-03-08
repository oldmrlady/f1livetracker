"use client";

import { useState, useEffect } from "react";
import { TEAMS_STORAGE_KEY, type Team } from "@/lib/teams";

const DEFAULT_TEAMS: Team[] = [
  {
    id: "default-daphne",
    name: "DAPHNE",
    // Russell #63, Norris #1, Lindblad #41, Bearman #87, Gasly #10, Albon #23
    driverNumbers: [63, 1, 41, 87, 10, 23],
    createdAt: 0,
  },
  {
    id: "default-graham",
    name: "GRAHAM",
    // Antonelli #12, Leclerc #16, Hadjar #6, Bortoleto #5, Hulkenberg #27, Bottas #77
    driverNumbers: [12, 16, 6, 5, 27, 77],
    createdAt: 1,
  },
  {
    id: "default-anna",
    name: "ANNA",
    // Verstappen #3, Piastri #81, Hamilton #44, Sainz #55, Lawson #30, Ocon #31
    driverNumbers: [3, 81, 44, 55, 30, 31],
    createdAt: 2,
  },
];

const DEFAULT_IDS = new Set(DEFAULT_TEAMS.map((t) => t.id));

function readTeams(): Team[] {
  if (typeof window === "undefined") return [];
  try {
    const stored: Team[] = JSON.parse(localStorage.getItem(TEAMS_STORAGE_KEY) || "[]");
    // Strip any previously-saved copies of the defaults, then prepend fresh ones
    const userTeams = stored.filter((t) => !DEFAULT_IDS.has(t.id));
    return [...DEFAULT_TEAMS, ...userTeams];
  } catch {
    return [...DEFAULT_TEAMS];
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
