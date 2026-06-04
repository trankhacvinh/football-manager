import type { AcademyProspect, Club, ClubNews, GameState, LeagueTeam, MatchEvent, MatchResult, Player, Position, Tactic, TransferMessage } from './types';

const firstNames = ['Minh', 'Bảo', 'Khang', 'Duy', 'Long', 'Nam', 'Quân', 'Huy', 'Phong', 'Đạt', 'Việt', 'Sơn', 'Tuấn', 'Hải', 'Khoa'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Võ', 'Huỳnh'];
const botClubs = ['Sài Gòn Tigers', 'Hà Nội Dragons', 'Mekong United', 'Đà Nẵng Warriors', 'Huế Imperial', 'Nha Trang Waves', 'Cần Thơ Lions'];
const MAX_ACTIONS = 3;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min = 1, max = 99) => Math.max(min, Math.min(max, value));
const id = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const msg = (type: TransferMessage['type'], text: string): TransferMessage => ({ type, text });

function makeNews(state: GameState, type: ClubNews['type'], title: string, text: string): ClubNews {
  return { id: id(), day: state.day, season: state.season, type, title, text };
}

function pushNews(state: GameState, news: ClubNews): GameState {
  return { ...state, news: [news, ...(state.news ?? [])].slice(0, 30) };
}

function spendAction(state: GameState, cost = 1): GameState | null {
  return state.actionsRemaining >= cost ? { ...state, actionsRemaining: state.actionsRemaining - cost } : null;
}

function positionForIndex(index: number): Position {
  if (index < 2) return 'GK';
  if (index < 9) return 'DF';
  if (index < 16) return 'MF';
  return 'FW';
}

function generatePlayer(index: number, qualityOffset = 0, forcedAge?: number): Player {
  const position = positionForIndex(index % 22);
  const age = forcedAge ?? rand(17, 33);
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
    ? Math.round(goalkeeping * 0.65 + defense * 0.15 + passing * 0.1 + stamina * 0.1)
    : Math.round((attack + defense + speed + stamina + technique + passing + shooting) / 7);
  return { id: id(), name: `${lastNames[rand(0, lastNames.length - 1)]} ${firstNames[rand(0, firstNames.length - 1)]}`, age, position, overall, potential, value: overall * overall * 120, salary: overall * 75, fitness: rand(82, 100), morale: rand(55, 90), form: rand(45, 85), attack, defense, speed, stamina, technique, passing, shooting, goalkeeping };
}

export function generatePlayers(): Player[] {
  return Array.from({ length: 22 }, (_, i) => generatePlayer(i)).sort((a, b) => b.overall - a.overall);
}

export function generateTransferMarket(count = 20): Player[] {
  return Array.from({ length: count }, (_, i) => generatePlayer(i, rand(-4, 8)))
    .map(p => ({ ...p, value: Math.round(p.value * 1.25), salary: Math.round(p.salary * 1.15) }))
    .sort((a, b) => b.overall - a.overall);
}

export function generateAcademyProspects(count = 3): AcademyProspect[] {
  return Array.from({ length: count }, (_, i) => {
    const roll = rand(1, 100);
    const rarity: AcademyProspect['rarity'] = roll >= 92 ? 'Wonderkid' : roll >= 65 ? 'Triển vọng' : 'Thường';
    const offset = rarity === 'Wonderkid' ? -4 : rarity === 'Triển vọng' ? -9 : -14;
    const p = generatePlayer(i + rand(0, 21), offset, rand(16, 19));
    const potentialBoost = rarity === 'Wonderkid' ? rand(22, 34) : rarity === 'Triển vọng' ? rand(13, 24) : rand(5, 15);
    const prospect = { ...p, potential: clamp(p.overall + potentialBoost, 1, 99) };
    return { ...prospect, signingFee: Math.round(prospect.value * (rarity === 'Wonderkid' ? 0.9 : 0.55)), rarity };
  }).sort((a, b) => b.potential - a.potential);
}

function generateOpponentSquads(teamNames: string[]): Record<string, Player[]> {
  return Object.fromEntries(teamNames.map((name, teamIndex) => [
    name,
    Array.from({ length: 22 }, (_, i) => generatePlayer(i, rand(-6, 10) + Math.floor(teamIndex / 2))).sort((a, b) => b.overall - a.overall),
  ]));
}

export function buildDefaultLineup(players: Player[]): string[] {
  const pick = (pos: Position, count: number) => players.filter(p => p.position === pos).slice(0, count).map(p => p.id);
  return [...pick('GK', 1), ...pick('DF', 4), ...pick('MF', 4), ...pick('FW', 2)];
}

export function createLeague(userClubName: string): LeagueTeam[] {
  return [userClubName, ...botClubs].map((name, index) => ({ id: id(), name, power: index === 0 ? 62 : rand(54, 74), played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
}

export function createFixtures(userClubName: string, names: string[]): MatchResult[] {
  const opponents = names.filter(n => n !== userClubName);
  return opponents.flatMap((opponent, index) => ([
    { id: id(), round: index + 1, day: 3 + index * 4, home: userClubName, away: opponent, homeScore: 0, awayScore: 0, events: [], played: false },
    { id: id(), round: index + 8, day: 31 + index * 4, home: opponent, away: userClubName, homeScore: 0, awayScore: 0, events: [], played: false },
  ])).sort((a, b) => a.day - b.day);
}

export function createNewGame(clubName: string, stadium: string): GameState {
  const players = generatePlayers();
  const club: Club = { id: id(), name: clubName.trim() || 'PMEDIA FC', stadium: stadium.trim() || 'Empire Arena', budget: 5_000_000, reputation: 25, fans: 8_000, tactic: 'balanced', lineup: buildDefaultLineup(players) };
  const league = createLeague(club.name);
  const opponentNames = league.map(t => t.name).filter(name => name !== club.name);
  const state: GameState = { club, players, transferMarket: generateTransferMarket(), academyProspects: [], news: [], opponentSquads: generateOpponentSquads(opponentNames), league, fixtures: createFixtures(club.name, league.map(t => t.name)), currentRound: 1, season: 1, day: 1, actionsRemaining: MAX_ACTIONS, maxActionsPerDay: MAX_ACTIONS, lastMatch: null, transferMessage: null, lastSeasonSummary: null };
  return pushNews(state, makeNews(state, 'neutral', 'Mùa giải bắt đầu', `${club.name} chính thức bước vào mùa giải đầu tiên.`));
}

function tacticBonus(tactic: Tactic) {
  return { balanced: { attack: 0, defense: 0 }, attacking: { attack: 8, defense: -5 }, defensive: { attack: -5, defense: 8 }, counter: { attack: 4, defense: 4 }, possession: { attack: 3, defense: 2 }, pressing: { attack: 6, defense: -2 } }[tactic];
}

function teamRating(players: Player[], lineup: string[], tactic: Tactic) {
  const active = (lineup.map(pid => players.find(p => p.id === pid)).filter(Boolean) as Player[]);
  const selected = active.length ? active : players.slice(0, 11);
  const bonus = tacticBonus(tactic);
  const avg = (fn: (p: Player) => number) => selected.reduce((sum, p) => sum + fn(p), 0) / selected.length;
  return { attack: avg(p => p.position === 'GK' ? p.passing : (p.attack + p.shooting + p.passing + p.technique) / 4) + bonus.attack, defense: avg(p => p.position === 'GK' ? p.goalkeeping : (p.defense + p.stamina + p.speed) / 3) + bonus.defense, overall: avg(p => p.overall) + avg(p => (p.fitness + p.morale + p.form - 180) / 12) };
}

function goalsFor(attack: number, defense: number, homeBonus: number) {
  let goals = 0;
  const edge = attack - defense + homeBonus;
  for (let i = 0; i < 5 + rand(0, 3); i++) if (rand(1, 100) + edge > 72) goals++;
  return Math.min(5, goals);
}

function addStanding(team: LeagueTeam, gf: number, ga: number) {
  team.played++; team.goalsFor += gf; team.goalsAgainst += ga;
  if (gf > ga) { team.won++; team.points += 3; } else if (gf === ga) { team.drawn++; team.points += 1; } else team.lost++;
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

function randomDailyEvent(state: GameState): GameState {
  if (!state.club || Math.random() > 0.42) return state;
  const roll = rand(1, 100);
  if (roll <= 24) {
    const bonus = rand(60_000, 180_000);
    const next = { ...state, club: { ...state.club, budget: state.club.budget + bonus } };
    return pushNews(next, makeNews(next, 'good', 'Nhà tài trợ thưởng nóng', `Nhà tài trợ địa phương hỗ trợ thêm ${bonus.toLocaleString('vi-VN')} VND cho CLB.`));
  }
  if (roll <= 45) {
    const player = state.players[rand(0, Math.min(state.players.length - 1, 10))];
    const players = state.players.map(p => p.id === player.id ? { ...p, morale: clamp(p.morale + rand(5, 10)), form: clamp(p.form + rand(3, 8)) } : p);
    const next = { ...state, players };
    return pushNews(next, makeNews(next, 'good', `${player.name} gây ấn tượng`, `${player.name} có buổi tập rất tốt, tinh thần và phong độ được cải thiện.`));
  }
  if (roll <= 62) {
    const player = state.players[rand(0, Math.min(state.players.length - 1, 10))];
    const players = state.players.map(p => p.id === player.id ? { ...p, fitness: clamp(p.fitness - rand(8, 16), 30, 100), morale: clamp(p.morale - rand(1, 4)) } : p);
    const next = { ...state, players };
    return pushNews(next, makeNews(next, 'bad', `${player.name} bị đau nhẹ`, `${player.name} bị đau trong buổi tập và giảm thể lực.`));
  }
  if (roll <= 78) {
    const fans = rand(120, 420);
    const next = { ...state, club: { ...state.club, fans: state.club.fans + fans } };
    return pushNews(next, makeNews(next, 'good', 'Fan hào hứng trước mùa giải', `CLB có thêm ${fans.toLocaleString('vi-VN')} người hâm mộ mới.`));
  }
  if (roll <= 90) {
    const next = { ...state, transferMarket: generateTransferMarket() };
    return pushNews(next, makeNews(next, 'market', 'Thị trường chuyển nhượng biến động', 'Một số cầu thủ mới đã xuất hiện trên thị trường chuyển nhượng.'));
  }
  const next = { ...state, academyProspects: generateAcademyProspects() };
  return pushNews(next, makeNews(next, 'academy', 'Scout báo tin tài năng trẻ', 'Bộ phận scout phát hiện một nhóm cầu thủ trẻ đáng chú ý.'));
}

export function getTodayMatch(state: GameState) {
  return state.fixtures.find(f => !f.played && f.day === state.day) || null;
}

export function advanceDay(state: GameState): GameState {
  if (isSeasonFinished(state)) return state;
  const players = state.players.map(p => ({ ...p, fitness: clamp(p.fitness + rand(4, 9)), morale: clamp(p.morale + rand(-1, 2)) }));
  const base = { ...state, day: state.day + 1, actionsRemaining: state.maxActionsPerDay, players, transferMessage: msg('info', `Đã sang ngày ${state.day + 1}. Hành động đã được làm mới.`) };
  return randomDailyEvent(base);
}

export function simulateNextRound(state: GameState): GameState {
  const club = state.club;
  if (!club) return state;
  const match = getTodayMatch(state);
  if (!match) return { ...state, transferMessage: msg('error', 'Hôm nay không có trận đấu. Hãy dùng ngày trống để huấn luyện, scout hoặc chuyển nhượng.') };
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const userRating = teamRating(actionState.players, club.lineup, club.tactic);
  const opponent = actionState.league.find(t => t.name === (match.home === club.name ? match.away : match.home));
  const opponentPower = opponent?.power ?? 60;
  const userIsHome = match.home === club.name;
  const userGoals = goalsFor(userRating.attack + userRating.overall * 0.2, opponentPower, userIsHome ? 5 : 0);
  const oppGoals = goalsFor(opponentPower, userRating.defense + userRating.overall * 0.15, userIsHome ? 0 : 5);
  const homeScore = userIsHome ? userGoals : oppGoals;
  const awayScore = userIsHome ? oppGoals : userGoals;
  const fixtures = actionState.fixtures.map(f => f.id === match.id ? { ...f, homeScore, awayScore, events: buildEvents(match.home, match.away, homeScore, awayScore), played: true } : f);
  const league = actionState.league.map(t => ({ ...t }));
  const homeTeam = league.find(t => t.name === match.home);
  const awayTeam = league.find(t => t.name === match.away);
  if (homeTeam && awayTeam) { addStanding(homeTeam, homeScore, awayScore); addStanding(awayTeam, awayScore, homeScore); }
  const sortedLeague = league.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
  const players = actionState.players.map(p => ({ ...p, fitness: clamp(p.fitness - rand(2, 8), 30, 100), form: clamp(p.form + (userGoals >= oppGoals ? rand(0, 4) : rand(-4, 1))) }));
  const prize = userGoals > oppGoals ? 180_000 : userGoals === oppGoals ? 75_000 : 20_000;
  const resultState = { ...actionState, club: { ...club, budget: club.budget + prize, fans: club.fans + (userGoals > oppGoals ? 350 : userGoals === oppGoals ? 80 : -120) }, players, league: sortedLeague, fixtures, currentRound: actionState.currentRound + 1, lastMatch: fixtures.find(f => f.id === match.id) || null, transferMessage: msg('success', 'Trận đấu hôm nay đã kết thúc.') };
  return pushNews(resultState, makeNews(resultState, userGoals > oppGoals ? 'good' : userGoals === oppGoals ? 'neutral' : 'bad', `Kết quả: ${match.home} ${homeScore}-${awayScore} ${match.away}`, userGoals > oppGoals ? 'Đội bóng có thêm tiền thưởng và fan mới.' : userGoals === oppGoals ? 'Một trận hòa giúp đội bóng có thêm chút tiền thưởng.' : 'Kết quả không như mong muốn, một số fan đã rời đi.'));
}

export function setTactic(state: GameState, tactic: Tactic): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  return { ...actionState, club: { ...state.club, tactic }, transferMessage: msg('info', 'Đã thay đổi chiến thuật. Mất 1 lượt hành động.') };
}

export function setLineup(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const exists = state.club.lineup.includes(playerId);
  const lineup = exists ? state.club.lineup.filter(id => id !== playerId) : state.club.lineup.length < 11 ? [...state.club.lineup, playerId] : state.club.lineup;
  return { ...state, club: { ...state.club, lineup } };
}

export function trainTeam(state: GameState): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  if (actionState.club!.budget < 50_000) return { ...state, transferMessage: msg('error', 'Không đủ ngân sách để huấn luyện.') };
  const players = actionState.players.map(p => ({ ...p, overall: clamp(p.overall + (p.age <= 23 && p.overall < p.potential && Math.random() > 0.72 ? 2 : 0)), fitness: clamp(p.fitness + rand(4, 10)), morale: clamp(p.morale + rand(1, 5)) })).sort((a, b) => b.overall - a.overall);
  const next = { ...actionState, players, club: { ...actionState.club!, budget: actionState.club!.budget - 50_000 }, transferMessage: msg('success', 'Đội bóng đã hoàn tất buổi huấn luyện hôm nay.') };
  return pushNews(next, makeNews(next, 'neutral', 'Buổi huấn luyện hoàn tất', 'Toàn đội vừa hoàn tất buổi huấn luyện trong ngày.'));
}

export function buyPlayer(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const player = actionState.transferMarket?.find(p => p.id === playerId);
  if (!player) return { ...state, transferMessage: msg('error', 'Không tìm thấy cầu thủ trên thị trường.') };
  if (actionState.club!.budget < player.value) return { ...state, transferMessage: msg('error', `Ngân sách không đủ để mua ${player.name}.`) };
  const next = { ...actionState, club: { ...actionState.club!, budget: actionState.club!.budget - player.value }, players: [...actionState.players, player].sort((a, b) => b.overall - a.overall), transferMarket: actionState.transferMarket.filter(p => p.id !== playerId), transferMessage: msg('success', `Đã chiêu mộ ${player.name}.`) };
  return pushNews(next, makeNews(next, 'market', 'Tân binh cập bến', `${player.name} đã gia nhập CLB với giá ${player.value.toLocaleString('vi-VN')} VND.`));
}

export function sellPlayer(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  if (actionState.players.length <= 16) return { ...state, transferMessage: msg('error', 'Đội hình còn quá mỏng, không thể bán thêm cầu thủ.') };
  const player = actionState.players.find(p => p.id === playerId);
  if (!player) return { ...state, transferMessage: msg('error', 'Không tìm thấy cầu thủ trong đội.') };
  const saleValue = Math.round(player.value * 0.85);
  const next = { ...actionState, club: { ...actionState.club!, budget: actionState.club!.budget + saleValue, lineup: actionState.club!.lineup.filter(id => id !== playerId) }, players: actionState.players.filter(p => p.id !== playerId), transferMarket: [...(actionState.transferMarket ?? []), { ...player, value: Math.round(player.value * 1.15) }].sort((a, b) => b.overall - a.overall), transferMessage: msg('success', `Đã bán ${player.name} và thu về ${saleValue.toLocaleString('vi-VN')} VND.`) };
  return pushNews(next, makeNews(next, 'market', 'Cầu thủ rời CLB', `${player.name} đã rời đội bóng. CLB thu về ${saleValue.toLocaleString('vi-VN')} VND.`));
}

export function refreshTransferMarket(state: GameState): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const cost = 120_000;
  if (actionState.club!.budget < cost) return { ...state, transferMessage: msg('error', 'Không đủ ngân sách để làm mới thị trường.') };
  const next = { ...actionState, club: { ...actionState.club!, budget: actionState.club!.budget - cost }, transferMarket: generateTransferMarket(), transferMessage: msg('info', 'Đã làm mới danh sách cầu thủ trên thị trường chuyển nhượng.') };
  return pushNews(next, makeNews(next, 'market', 'Làm mới thị trường', 'Đội ngũ tuyển trạch đã cập nhật danh sách cầu thủ có thể mua.'));
}

export function scoutAcademy(state: GameState): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const cost = 180_000;
  if (actionState.club!.budget < cost) return { ...state, transferMessage: msg('error', 'Không đủ ngân sách để scout tài năng trẻ.') };
  const prospects = generateAcademyProspects();
  const hasWonderkid = prospects.some(p => p.rarity === 'Wonderkid');
  const next = { ...actionState, club: { ...actionState.club!, budget: actionState.club!.budget - cost }, academyProspects: prospects, transferMessage: msg('success', 'Bộ phận scout đã gửi về 3 tài năng trẻ mới.') };
  return pushNews(next, makeNews(next, 'academy', hasWonderkid ? 'Phát hiện Wonderkid!' : 'Scout gửi báo cáo học viện', hasWonderkid ? 'Một tài năng trẻ hiếm đã xuất hiện trong báo cáo scout.' : 'Bộ phận scout đã gửi danh sách 3 cầu thủ trẻ mới.'));
}

export function signAcademyProspect(state: GameState, playerId: string): GameState {
  if (!state.club) return state;
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const prospect = actionState.academyProspects.find(p => p.id === playerId);
  if (!prospect) return { ...state, transferMessage: msg('error', 'Không tìm thấy cầu thủ trẻ này.') };
  if (actionState.club!.budget < prospect.signingFee) return { ...state, transferMessage: msg('error', `Không đủ ngân sách để ký ${prospect.name}.`) };
  const { signingFee, rarity, ...player } = prospect;
  const next = { ...actionState, club: { ...actionState.club!, budget: actionState.club!.budget - signingFee }, players: [...actionState.players, player].sort((a, b) => b.overall - a.overall), academyProspects: actionState.academyProspects.filter(p => p.id !== playerId), transferMessage: msg('success', `Đã ký hợp đồng với ${player.name} (${rarity}).`) };
  return pushNews(next, makeNews(next, 'academy', 'Cầu thủ trẻ ký hợp đồng', `${player.name} (${rarity}) đã gia nhập đội hình.`));
}

export function restTeam(state: GameState): GameState {
  const actionState = spendAction(state);
  if (!actionState) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  const next = { ...actionState, players: actionState.players.map(p => ({ ...p, fitness: clamp(p.fitness + rand(10, 18)), morale: clamp(p.morale + rand(1, 4)) })), transferMessage: msg('success', 'Toàn đội đã nghỉ hồi phục.') };
  return pushNews(next, makeNews(next, 'neutral', 'Nghỉ hồi phục', 'Toàn đội được nghỉ để hồi phục thể lực và tinh thần.'));
}

export function isSeasonFinished(state: GameState): boolean {
  return state.fixtures.length > 0 && state.fixtures.every(f => f.played);
}

function calculateSeasonReward(rank: number) {
  if (rank === 1) return { prize: 2_000_000, reputationGain: 8, fanGain: 5_000 };
  if (rank === 2) return { prize: 1_250_000, reputationGain: 5, fanGain: 2_800 };
  if (rank === 3) return { prize: 850_000, reputationGain: 3, fanGain: 1_600 };
  if (rank <= 5) return { prize: 450_000, reputationGain: 1, fanGain: 700 };
  return { prize: 200_000, reputationGain: 0, fanGain: 150 };
}

function progressPlayerForNewSeason(player: Player): Player {
  const age = player.age + 1;
  const growth = age <= 23 && player.overall < player.potential ? rand(1, 4) : age <= 28 && player.overall < player.potential && Math.random() > 0.65 ? 1 : 0;
  const decline = age >= 32 ? rand(0, 2) : 0;
  const nextOverall = clamp(player.overall + growth - decline);
  const ratio = nextOverall / Math.max(player.overall, 1);
  return { ...player, age, overall: nextOverall, value: Math.round(nextOverall * nextOverall * 120), salary: Math.round(player.salary * (ratio > 1 ? 1.04 : 0.99)), fitness: rand(84, 100), morale: clamp(player.morale + rand(-3, 6)), form: rand(45, 85), attack: clamp(Math.round(player.attack * ratio)), defense: clamp(Math.round(player.defense * ratio)), speed: clamp(Math.round(player.speed * (age >= 31 ? 0.98 : ratio))), stamina: clamp(Math.round(player.stamina * (age >= 31 ? 0.98 : ratio))), technique: clamp(Math.round(player.technique * ratio)), passing: clamp(Math.round(player.passing * ratio)), shooting: clamp(Math.round(player.shooting * ratio)), goalkeeping: clamp(Math.round(player.goalkeeping * ratio)) };
}

export function startNextSeason(state: GameState): GameState {
  if (!state.club || !isSeasonFinished(state)) return state;
  const userRank = state.league.findIndex(team => team.name === state.club?.name) + 1;
  const champion = state.league[0]?.name ?? state.club.name;
  const reward = calculateSeasonReward(userRank || state.league.length);
  const players = state.players.map(progressPlayerForNewSeason).sort((a, b) => b.overall - a.overall);
  const club: Club = { ...state.club, budget: state.club.budget + reward.prize, reputation: clamp(state.club.reputation + reward.reputationGain, 1, 100), fans: Math.max(0, state.club.fans + reward.fanGain), lineup: buildDefaultLineup(players) };
  const league = createLeague(club.name);
  const opponentNames = league.map(t => t.name).filter(name => name !== club.name);
  const next = { ...state, club, players, transferMarket: generateTransferMarket(), academyProspects: [], opponentSquads: generateOpponentSquads(opponentNames), league, fixtures: createFixtures(club.name, league.map(t => t.name)), currentRound: 1, season: state.season + 1, day: 1, actionsRemaining: MAX_ACTIONS, maxActionsPerDay: MAX_ACTIONS, lastMatch: null, transferMessage: msg('info', 'Mùa giải mới đã bắt đầu. Lịch thi đấu và thị trường chuyển nhượng đã được làm mới.'), lastSeasonSummary: { season: state.season, champion, userRank, prize: reward.prize, reputationGain: reward.reputationGain, fanGain: reward.fanGain } };
  return pushNews(next, makeNews(next, 'good', `Mùa ${state.season} khép lại`, `${champion} vô địch. ${club.name} nhận thưởng ${reward.prize.toLocaleString('vi-VN')} VND và bước vào mùa mới.`));
}
