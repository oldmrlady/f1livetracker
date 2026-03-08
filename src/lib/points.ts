import { F1_POINTS } from "./openf1";

export interface DriverStanding {
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColour: string;
  headshotUrl: string | null;
  position: number;
  points: number;
  gap: string;
}

export function positionToPoints(position: number): number {
  return F1_POINTS[position - 1] ?? 0;
}

export function buildStandings(
  positions: { driver_number: number; position: number }[],
  drivers: {
    driver_number: number;
    full_name: string;
    name_acronym: string;
    team_name: string;
    team_colour: string;
    headshot_url: string | null;
  }[]
): DriverStanding[] {
  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const standings: DriverStanding[] = positions
    .map((p) => {
      const driver = driverMap.get(p.driver_number);
      if (!driver) return null;
      return {
        driverNumber: p.driver_number,
        name: driver.full_name ?? `Driver #${p.driver_number}`,
        acronym: driver.name_acronym ?? `#${p.driver_number}`,
        teamName: driver.team_name ?? "Unknown Team",
        teamColour: driver.team_colour ? `#${driver.team_colour}` : "#6b7280",
        headshotUrl: driver.headshot_url,
        position: p.position,
        points: positionToPoints(p.position),
        gap: "",
      };
    })
    .filter(Boolean) as DriverStanding[];

  // Compute gap to leader
  const leaderPts = standings[0]?.points ?? 0;
  for (const s of standings) {
    s.gap = s.points === leaderPts ? "—" : `-${leaderPts - s.points}`;
  }

  return standings;
}
