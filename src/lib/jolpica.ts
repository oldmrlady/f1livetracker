const BASE = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLOURS: Record<string, string> = {
  "Red Bull": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#229971",
  "Alpine F1 Team": "#FF87BC",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB F1 Team": "#6692FF",
  "VCARB": "#6692FF",
  "Haas F1 Team": "#B6BABD",
  "Kick Sauber": "#52E252",
  "Audi": "#52E252",
  "Cadillac": "#FFFFFF",
};

export interface JolpikaDriverStanding {
  position: number;
  points: number;
  wins: number;
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColour: string;
  headshotUrl: null;
}

export async function getDriverStandings(year: number): Promise<{ standings: JolpikaDriverStanding[]; round: number }> {
  const res = await fetch(`${BASE}/${year}/driverStandings.json`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Jolpica error: ${res.status}`);

  const json = await res.json();
  const lists = json?.MRData?.StandingsTable?.StandingsLists ?? [];
  if (!lists.length) return { standings: [], round: 0 };

  const list = lists[0];
  const round = parseInt(list.round ?? "0", 10);

  const standings: JolpikaDriverStanding[] = (list.DriverStandings ?? []).map((entry: Record<string, unknown>) => {
    const driver = entry.Driver as Record<string, string>;
    const constructor = ((entry.Constructors as unknown[])?.[0] ?? {}) as Record<string, string>;
    const teamName = constructor.name ?? "Unknown";
    return {
      position: parseInt(entry.position as string, 10),
      points: parseFloat(entry.points as string),
      wins: parseInt(entry.wins as string, 10),
      driverNumber: parseInt(driver.permanentNumber ?? "0", 10),
      name: `${driver.givenName} ${driver.familyName}`,
      acronym: driver.code ?? "???",
      teamName,
      teamColour: TEAM_COLOURS[teamName] ?? "#6b7280",
      headshotUrl: null,
    };
  });

  return { standings, round };
}

export interface RaceResult {
  position: number;
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColour: string;
  points: number;
  status: string;
  fastestLap: boolean;
}

export interface LastRace {
  raceName: string;
  round: number;
  date: string;
  results: RaceResult[];
}

export async function getLastRaceResults(year: number): Promise<LastRace | null> {
  const res = await fetch(`${BASE}/${year}/last/results.json`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Jolpica error: ${res.status}`);

  const json = await res.json();
  const races = json?.MRData?.RaceTable?.Races ?? [];
  if (!races.length) return null;

  const race = races[0];
  const fastestLapDriver = (race.Results ?? []).find(
    (r: Record<string, unknown>) => (r.FastestLap as Record<string, string> | undefined)?.rank === "1"
  );
  const fastestLapNumber = fastestLapDriver
    ? parseInt((fastestLapDriver.Driver as Record<string, string>).permanentNumber ?? "0", 10)
    : null;

  const results: RaceResult[] = (race.Results ?? []).map((r: Record<string, unknown>) => {
    const driver = r.Driver as Record<string, string>;
    const constructor = r.Constructor as Record<string, string>;
    const teamName = constructor.name ?? "Unknown";
    const driverNumber = parseInt(driver.permanentNumber ?? "0", 10);
    return {
      position: parseInt(r.position as string, 10),
      driverNumber,
      name: `${driver.givenName} ${driver.familyName}`,
      acronym: driver.code ?? "???",
      teamName,
      teamColour: TEAM_COLOURS[teamName] ?? "#6b7280",
      points: parseFloat(r.points as string),
      status: r.status as string,
      fastestLap: driverNumber === fastestLapNumber,
    };
  });

  return {
    raceName: race.raceName,
    round: parseInt(race.round, 10),
    date: race.date,
    results,
  };
}
