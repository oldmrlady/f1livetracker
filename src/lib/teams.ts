export const TEAMS_STORAGE_KEY = "f1_teams";

export interface DriverMeta {
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColour: string;
  headshotUrl: string | null;
}

export interface Team {
  id: string;
  name: string;
  driverNumbers: number[];
  createdAt: number;
}

export interface TeamWithPoints extends Team {
  totalPoints: number;
  drivers: DriverMeta[];
  driverPoints: Record<number, number>;
}

export interface SeasonPointsResponse {
  pointsByDriver: Record<number, number>;
  drivers: DriverMeta[];
  year: number;
  sessionCount: number;
  hasLiveData: boolean;
}
