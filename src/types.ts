export type Position = 'GK' | 'DF' | 'MF' | 'FW';
export type Tactic = 'balanced' | 'attacking' | 'defensive' | 'counter' | 'possession' | 'pressing';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  overall: number;
  potential: number;
  value: number;
  salary: number;
  fitness: number;
  morale: number;
  form: number;
  attack: number;
  defense: number;
  speed: number;
  stamina: number;
  technique: number;
  passing: number;
  shooting: number;
  goalkeeping: number;
}

export interface Club {
  id: string;
  name: string;
  stadium: string;
  budget: number;
  reputation: number;
  fans: number;
  tactic: Tactic;
  lineup: string[];
}

export interface LeagueTeam {
  id: string;
  name: string;
  power: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface MatchEvent {
  minute: number;
  text: string;
  type: 'info' | 'goal' | 'card' | 'injury' | 'save';
}

export interface MatchResult {
  id: string;
  round: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  played: boolean;
}

export interface TransferMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface SeasonSummary {
  season: number;
  champion: string;
  userRank: number;
  prize: number;
  reputationGain: number;
  fanGain: number;
}

export interface GameState {
  club: Club | null;
  players: Player[];
  transferMarket: Player[];
  league: LeagueTeam[];
  fixtures: MatchResult[];
  currentRound: number;
  season: number;
  lastMatch: MatchResult | null;
  transferMessage?: TransferMessage | null;
  lastSeasonSummary?: SeasonSummary | null;
}
