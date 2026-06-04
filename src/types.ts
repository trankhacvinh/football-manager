export type Position = 'GK' | 'DF' | 'MF' | 'FW';
export type Tactic = 'balanced' | 'attacking' | 'defensive' | 'counter' | 'possession' | 'pressing';
export type PlayerOwnerType = 'user' | 'opponent' | 'market' | 'academy' | 'unknown';

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

export interface OpponentClub {
  name: string;
  budget: number;
  reputation: number;
  tactic: Tactic;
}

export interface PlayerOwnership {
  playerId: string;
  ownerType: PlayerOwnerType;
  ownerName: string;
  source: 'players' | 'opponentSquads' | 'transferMarket' | 'academyProspects' | 'unknown';
}

export interface PlayerIntegrityIssue {
  id: string;
  severity: 'warning' | 'error';
  playerId: string;
  playerName: string;
  type: 'duplicate' | 'missing_owner' | 'owner_mismatch' | 'orphan_registry';
  message: string;
  locations: string[];
}

export interface GameOverSummary {
  season: number;
  day: number;
  reason: 'bankrupt';
  title: string;
  message: string;
  finalBudget: number;
  fans: number;
  reputation: number;
  players: number;
  leagueRank: number;
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
  day: number;
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

export interface AcademyProspect extends Player {
  signingFee: number;
  rarity: 'Thường' | 'Triển vọng' | 'Wonderkid';
}

export interface ClubNews {
  id: string;
  day: number;
  season: number;
  type: 'good' | 'bad' | 'neutral' | 'market' | 'academy' | 'match';
  title: string;
  text: string;
}

export interface GameLog {
  id: string;
  day: number;
  season: number;
  actor: string;
  type: 'ai' | 'transfer' | 'training' | 'finance' | 'tactic' | 'match' | 'system';
  message: string;
  meta?: Record<string, string | number>;
}

export interface GameState {
  club: Club | null;
  players: Player[];
  transferMarket: Player[];
  academyProspects: AcademyProspect[];
  news: ClubNews[];
  logs: GameLog[];
  opponentClubs: Record<string, OpponentClub>;
  opponentSquads: Record<string, Player[]>;
  playerOwnership: Record<string, PlayerOwnership>;
  ownershipIssues: PlayerIntegrityIssue[];
  league: LeagueTeam[];
  fixtures: MatchResult[];
  currentRound: number;
  season: number;
  day: number;
  actionsRemaining: number;
  maxActionsPerDay: number;
  nextSalaryDay: number;
  salaryIntervalDays: number;
  gameOver: GameOverSummary | null;
  lastMatch: MatchResult | null;
  transferMessage?: TransferMessage | null;
  lastSeasonSummary?: SeasonSummary | null;
}
