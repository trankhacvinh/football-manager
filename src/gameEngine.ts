import type { Club, GameState, LeagueTeam, MatchEvent, MatchResult, Player, Position, Tactic, TransferMessage } from './types';

const firstNames = ['Minh', 'Bảo', 'Khang', 'Duy', 'Long', 'Nam', 'Quân', 'Huy', 'Phong', 'Đạt', 'Việt', 'Sơn', 'Tuấn', 'Hải', 'Khoa'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Võ', 'Huỳnh'];
const botClubs = ['Sài Gòn Tigers', 'Hà Nội Dragons', 'Mekong United', 'Đà Nẵng Warriors', 'Huế Imperial', 'Nha Trang Waves', 'Cần Thơ Lions'];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min = 1, max = 99) => Math.max(min, Math.min(max, value));
const id = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function positionForIndex(index: number): Position {
  if (index < 2) return 'GK';
  if (index < 9) return 'DF';
  if (index < 16) return 'MF';
  return 'FW';
}

function generatePlayer(index: number, qualityOffset = 0): Player {
  const position = positionForIndex(index % 22);
  const age = rand(17, 33);
  const base = rand(48, 72) + qualityOffset;
  const potential = clamp(base + rand(3, age < 22 ? 25 : 10));
  const boost = (target: Position) => position === target ? rand(8, 18) : rand(-3, 6);

  const attack = clamp(base + boost('FW'));
  const defense = clamp(base + boost('DF'));
  const goalkeeping = position === 'GK' ? clamp(base + rand(12, 22)) : rand(5, 25);
  const shooting = clamp(base + boost('FW'));
  const passing = clamp(base + boost('MF'));
  const technique = clamp(base + rand(-5, 12));
  const speed = clamp(base + rand(-8, 12));
  const stamina = clamp(base + rand(-5, 12));
  const overall = position === 'GK'
    ? Math.round((goalkeeping * 0.65 + defense * 0.15 + passing * 0.1 + stamina * 0.1))
    : Math.round((attack + defense + speed + stamina + technique + passing + shooting) / 7);

  return {
    id: id(),
    name: `${lastNames[rand(0, lastNames.length - 1)]} ${firstNames[rand(0, firstNames.length - 1)]}`,
    age,
    position,
    overall,
    potential,
    value: overall * overall * 120,
    salary: overall * 75,
    fitness: rand(82, 100),
    morale: rand(55, 90),
    form: rand(45, 85),
    attack,
    defense,
    speed,
    stamina,
    technique,
    passing,
    shooting,
    goalkeeping,
  };
}

export function generatePlayers(): Player[] {
  return Array.from({ length: 22 }, (_, index) => generatePlayer(index)).sort((a, b) => b.overall - a.overall);
}

export function generateTransferMarket(count = 20): Player[] {
  return Array.from({ length: count }, (_, index) => generatePlayer(index, rand(-4, 8)))
    .map(player => ({
      ...player,
      value: Math.round(player.value * 1.25),
      salary: Math.round(player.salary * 1.15),
    }))
    .sort((a, b) => b.overall - a.overall);
}

export function buildDefaultLineup(players: Player[]): string[] {
  const pick = (pos: Position, count: number) => players.filter(p => p.position === pos).slice(0, count).map(p => p.id);
  return [...pick('GK', 1), ...pick('DF', 4), ...pick('MF', 4), ...pick('FW', 2)];
}

export function createNewGame(clubName: string, stadium: string): GameState {
  const players = generatePlayers();
  const club: Club = {
    id: id(),
    name: clubName.trim() || 'PMEDIA FC',
    stadium: stadium.trim() || 'Empire Arena',
    budget: 5_000_000,
    reputation: 25,
    fans: 8_000,
    tactic: 'balanced',
    lineup: buildDefaultLineup(players),
  };

  const league = createLeague(club.name);
  const fixtures = createFixtures(club.name, league.map(t => t.name));

  return { club, players, transferMarket: generateTransferMarket(), league, fixtures, currentRound: 1, season: 1, lastMatch: null, transferMessage: null };
}

export function createLeague(userClubName: string): LeagueTeam[] {
  const names = [userClubName, ...botClubs];
  return names.map((name, index) => ({
    id: id(),
    name,
    power: index === 0 ? 62 : rand(54, 74),
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

export function createFixtures(userClubName: string, names: string[]): MatchResult[] {
  const opponents = names.filter(n => n !== userClubName);
  return opponents.flatMap((opponent, index) => ([
    { id: id(), round: index + 1, home: userClubName, away: opponent, homeScore: 0, awayScore: 0, events: [], played: false },
    { id: id(), round: index + 8, home: opponent, away: userClubName, homeScore: 0, awayScore: 0, events: [], played: false },
  ])).sort((a, b) => a.round - b.round);
}

function message(type: TransferMessage['type'], text: string): TransferMessage {
  return { type, text };
}

function tacticBonus(tactic: Tactic) {
  const table = {
    balanced: { attack: 0, defense: 0 },
    attacking: { attack: 8, defense: -5 },
    defensive: { attack: -5, defense: 8 },
    counter: { attack: 4, defense: 4 },
    possession: { attack: 3, defense: 2 },
    pressing: { attack: 6, defense: -2 },
  };
  return table[tactic];
}

function teamRating(players: Player[], lineup: string[], tactic: Tactic) {
  const selected = lineup.map(pid => players.find(p => p.id === pid)).filter(Boolean) as Player[];
  const active = selected.length ? selected : players.slice(0, 11);
  const bonus = tacticBonus(tactic);
  const avg = (fn: (p: Player) => number) => active.reduce((sum, p) => sum + fn(p), 0) / active.length;
  return {
    attack: avg(p => p.position === 'GK' ? p.passing : (p.attack + p.shooting + p.passing + p.technique) / 4) + bonus.attack,
    defense: avg(p => p.position === 'GK' ? p.goalkeeping : (p.defense + p.stamina + p.speed) / 3) + bonus.defense,
    overall: avg(p => p.overall) + avg(p => (p.fitness + p.morale + p.form - 180) / 12),
  };
}

function goalsFor(attack: number, defense: number, homeBonus: number) {
  let chances = 0;
  const edge = attack - defense + homeBonus;
  const rolls = 5 + rand(0, 3);
  for (let i = 0; i < rolls; i++) {
    if (rand(1, 100) + edge > 72) chances++;
  }
  return Math.min(5, chances);
}

function addStanding(team: LeagueTeam, gf: number, ga: number) {
  team.played++;
  team.goalsFor += gf;
  team.goalsAgainst += ga;
  if (gf > ga) {
    team.won++;
    team.points += 3;
  } else if (gf === ga) {
    team.drawn++;
    team.points += 1;
  } else {
    team.lost++;
  }
}

function buildEvents(home: string, away: string, homeScore: number, awayScore: number): MatchEvent[] {
  const events: MatchEvent[] = [{ minute: 1, type: 'info', text: `Trận đấu bắt đầu: ${home} vs ${away}.` }];
  for (let i = 0; i < homeScore; i++) events.push({ minute: rand(8, 88), type: 'goal', text: `${home} ghi bàn! Khán đài nổ tung.` });
  for (let i = 0; i < awayScore; i++) events.push({ minute: rand(8, 88), type: 'goal', text: `${away} ghi bàn sau một pha tấn công sắc nét.` });
  if (Math.random() > 0.55) events.push({ minute: rand(20, 80), type: 'save', text: 'Thủ môn có pha cứu thua quan trọng.' });
  if (Math.random() > 0.72) events.push({ minute: rand(55, 90), type: 'injury', text: 'Một cầu thủ bị đau nhẹ và cần theo dõi sau trận.' });
  events.push({ minute: 90, type: 'info', text: `Kết thúc trận đấu: ${home} ${homeScore}-${awayScore} ${away}.` });
  return events.sort((a, b) => a.minute - b.minute);
}

export function simulateNextRound(state: GameState): GameState {
  const club = state.club;
  if (!club) return state;
  const match = state.fixtures.find(f => !f.played);
  if (!match) return state;

  const userRating = teamRating(state.players, club.lineup, club.tactic);
  const opponent = state.league.find(t => t.name === (match.home === club.name ? match.away : match.home));
  const opponentPower = opponent?.power ?? 60;
  const userIsHome = match.home === club.name;

  const userGoals = goalsFor(userRating.attack + userRating.overall * 0.2, opponentPower, userIsHome ? 5 : 0);
  const oppGoals = goalsFor(opponentPower, userRating.defense + userRating.overall * 0.15, userIsHome ? 0 : 5);
  const homeScore = userIsHome ? userGoals : oppGoals;
  const awayScore = userIsHome ? oppGoals : userGoals;
  const events = buildEvents(match.home, match.away, homeScore, awayScore);

  const fixtures = state.fixtures.map(f => f.id === match.id ? { ...f, homeScore, awayScore, events, played: true } : f);
  const league = state.league.map(t => ({ ...t }));
  const homeTeam = league.find(t => t.name === match.home);
  const awayTeam = league.find(t => t.name === match.away);
  if (homeTeam && awayTeam) {
    addStanding(homeTeam, homeScore, awayScore);
    addStanding(awayTeam, awayScore, homeScore);
  }

  const sortedLeague = league.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
  const updatedPlayers = state.players.map(p => ({ ...p, fitness: clamp(p.fitness - rand(2, 8), 30, 100), form: clamp(p.form + (userGoals >= oppGoals ? rand(0, 4) : rand(-4, 1)), 1, 99) }));
  const prize = userGoals > oppGoals ? 180_000 : userGoals === oppGoals ? 75_000 : 20_000;
  const updatedClub = { ...club, budget: club.budget + prize, fans: club.fans + (userGoals > oppGoals ? 350 : userGoals === oppGoals ? 80 : -120) };
  const lastMatch = fixtures.find(f => f.id === match.id) || null;

  return { ...state, club: updatedClub, players: updatedPlayers, league: sortedLeague, fixtures, currentRound: state.currentRound + 1, lastMatch };
}

export function setTactic(state: GameState, tactic: Tactic): GameState {
  if (!state.club) return state;
  return { ...state, club: { ...state.club, tactic } };
}

export function setLineup(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const exists = state.club.lineup.includes(playerId);
  const lineup = exists ? state.club.lineup.filter(id => id !== playerId) : state.club.lineup.length < 11 ? [...state.club.lineup, playerId] : state.club.lineup;
  return { ...state, club: { ...state.club, lineup } };
}

export function trainTeam(state: GameState): GameState {
  if (!state.club) return state;
  const players = state.players.map(p => {
    const growth = p.age <= 23 && p.overall < p.potential ? 2 : 1;
    return {
      ...p,
      overall: clamp(p.overall + (Math.random() > 0.72 ? growth : 0)),
      fitness: clamp(p.fitness + rand(4, 10)),
      morale: clamp(p.morale + rand(1, 5)),
    };
  }).sort((a, b) => b.overall - a.overall);
  return { ...state, players, club: { ...state.club, budget: state.club.budget - 50_000 } };
}

export function buyPlayer(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const player = state.transferMarket?.find(p => p.id === playerId);
  if (!player) return { ...state, transferMessage: message('error', 'Không tìm thấy cầu thủ trên thị trường.') };
  if (state.club.budget < player.value) {
    return { ...state, transferMessage: message('error', `Ngân sách không đủ để mua ${player.name}.`) };
  }

  return {
    ...state,
    club: { ...state.club, budget: state.club.budget - player.value },
    players: [...state.players, player].sort((a, b) => b.overall - a.overall),
    transferMarket: state.transferMarket.filter(p => p.id !== playerId),
    transferMessage: message('success', `Đã chiêu mộ ${player.name} với giá ${player.value.toLocaleString('vi-VN')} VND.`),
  };
}

export function sellPlayer(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  if (state.players.length <= 16) {
    return { ...state, transferMessage: message('error', 'Đội hình còn quá mỏng, không thể bán thêm cầu thủ.') };
  }
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { ...state, transferMessage: message('error', 'Không tìm thấy cầu thủ trong đội.') };

  const saleValue = Math.round(player.value * 0.85);
  return {
    ...state,
    club: { ...state.club, budget: state.club.budget + saleValue, lineup: state.club.lineup.filter(id => id !== playerId) },
    players: state.players.filter(p => p.id !== playerId),
    transferMarket: [...(state.transferMarket ?? []), { ...player, value: Math.round(player.value * 1.15) }].sort((a, b) => b.overall - a.overall),
    transferMessage: message('success', `Đã bán ${player.name} và thu về ${saleValue.toLocaleString('vi-VN')} VND.`),
  };
}

export function refreshTransferMarket(state: GameState): GameState {
  if (!state.club) return state;
  const cost = 120_000;
  if (state.club.budget < cost) return { ...state, transferMessage: message('error', 'Không đủ ngân sách để làm mới thị trường.') };
  return {
    ...state,
    club: { ...state.club, budget: state.club.budget - cost },
    transferMarket: generateTransferMarket(),
    transferMessage: message('info', 'Đã làm mới danh sách cầu thủ trên thị trường chuyển nhượng.'),
  };
}
