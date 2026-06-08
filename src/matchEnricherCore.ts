import type { GameState, MatchEvent, Player } from './types';

type PlayerStats = { apps: number; goals: number; assists: number; yellowCards: number; redCards: number; injuries: number; ratingTotal: number; ratingCount: number };

type EnrichedState = GameState & { playerStats?: Record<string, PlayerStats>; lineupWarning?: string };

type EventWithFlags = MatchEvent & { scorerId?: string; assisterId?: string; playerId?: string; cardEnriched?: boolean };

function top(list: Player[], score: (player: Player) => number) {
  return [...(list ?? [])].filter(player => player.position !== 'GK').sort((a, b) => score(b) - score(a));
}

function pickScorer(list: Player[]) {
  const pool = top(list, player => player.shooting + player.attack + player.overall);
  return pool[Math.floor(Math.random() * Math.min(5, Math.max(1, pool.length)))] ?? pool[0];
}

function pickAssist(list: Player[], scorer?: Player) {
  return top(list, player => player.passing + player.technique + player.overall).find(player => player.id !== scorer?.id);
}

function pickKeeper(list: Player[]) {
  return list.find(player => player.position === 'GK');
}

function pickDefender(list: Player[]) {
  const pool = top(list, player => player.defense + player.stamina + player.overall);
  return pool[Math.floor(Math.random() * Math.min(6, Math.max(1, pool.length)))] ?? pool[0];
}

function squadFor(state: EnrichedState, teamName: string): Player[] {
  if (state.club && teamName === state.club.name) {
    const ids = state.club.lineup ?? [];
    return ids.map(playerId => state.players.find(player => player.id === playerId)).filter(Boolean) as Player[];
  }
  return (state.opponentSquads?.[teamName] ?? []).slice(0, 11);
}

function findPlayer(state: EnrichedState, playerId?: string) {
  if (!playerId) return undefined;
  const groups = [state.players, state.transferMarket, state.academyProspects, ...Object.values(state.opponentSquads ?? {})];
  for (const group of groups) {
    const found = group?.find(player => player.id === playerId);
    if (found) return found;
  }
  return undefined;
}

function boost(player: Player | undefined, form: number, morale: number) {
  if (!player) return;
  player.form = Math.min(99, (player.form ?? 50) + form);
  player.morale = Math.min(99, (player.morale ?? 50) + morale);
}

function injure(state: EnrichedState, player: Player | undefined) {
  if (!player) return;
  player.fitness = Math.max(30, (player.fitness ?? 80) - 14);
  player.morale = Math.max(1, (player.morale ?? 50) - 2);
  player.status = 'injured';
  player.injuryUntilDay = state.day + Math.floor(2 + Math.random() * 5);
}

function card(player: Player | undefined, red: boolean) {
  if (!player) return;
  player.form = Math.max(1, (player.form ?? 50) - (red ? 6 : 2));
  player.morale = Math.max(1, (player.morale ?? 50) - (red ? 8 : 2));
  if (red) player.status = 'suspended';
}

function getStats(state: EnrichedState, playerId: string): PlayerStats {
  state.playerStats ??= {};
  state.playerStats[playerId] ??= { apps: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, injuries: 0, ratingTotal: 0, ratingCount: 0 };
  return state.playerStats[playerId];
}

function rate(state: EnrichedState, playerId: string | undefined, value: number) {
  if (!playerId) return;
  const stats = getStats(state, playerId);
  stats.ratingTotal += value;
  stats.ratingCount += 1;
}

function countAppearance(state: EnrichedState, players: Player[]) {
  players.forEach(player => {
    const stats = getStats(state, player.id);
    stats.apps += 1;
    rate(state, player.id, 6.5);
  });
}

function clearExpiredStatuses(state: EnrichedState) {
  const allPlayers = [state.players, ...Object.values(state.opponentSquads ?? {})].flat();
  allPlayers.forEach(player => {
    if (player.status === 'injured' && (player.injuryUntilDay ?? 0) <= state.day) player.status = 'available';
    if (player.status === 'suspended' && (player.suspendedUntilDay ?? 0) <= state.day) player.status = 'available';
  });
}

function cleanLineup(state: EnrichedState) {
  if (!state.club) return;
  const blocked = new Set(state.players.filter(player => player.status === 'injured' || player.status === 'suspended').map(player => player.id));
  const before = state.club.lineup.length;
  state.club.lineup = state.club.lineup.filter(playerId => !blocked.has(playerId));
  if (state.club.lineup.length !== before) state.lineupWarning = 'Một số cầu thủ chấn thương/treo giò đã bị loại khỏi đội hình.';
}

function enrichEvents(state: EnrichedState, home: Player[], away: Player[]) {
  const match = state.lastMatch;
  if (!match || match.scorersEnriched) return;
  (match.events as EventWithFlags[]).forEach(event => {
    const text = event.text ?? '';
    if (event.type === 'goal' && !text.includes(' — ')) {
      const teamName = text.startsWith(match.home) ? match.home : match.away;
      const squad = teamName === match.home ? home : away;
      const scorer = pickScorer(squad);
      const assister = pickAssist(squad, scorer);
      boost(scorer, 3, 2);
      boost(assister, 1, 1);
      if (scorer) { getStats(state, scorer.id).goals += 1; rate(state, scorer.id, 8.2); event.scorerId = scorer.id; }
      if (assister) { getStats(state, assister.id).assists += 1; rate(state, assister.id, 7.4); event.assisterId = assister.id; }
      event.text = `${teamName} ghi bàn — ${scorer?.name ?? 'Một cầu thủ'} dứt điểm sau đường chuyền của ${assister?.name ?? 'đồng đội'}.`;
    } else if (event.type === 'save' && !text.includes(' — ')) {
      const teamName = Math.random() > 0.5 ? match.home : match.away;
      const keeper = pickKeeper(teamName === match.home ? home : away);
      boost(keeper, 1, 1);
      rate(state, keeper?.id, 7.1);
      event.playerId = keeper?.id;
      event.text = `Cứu thua — ${keeper?.name ?? 'Thủ môn'} bay người cản phá cú sút nguy hiểm.`;
    } else if (event.type === 'injury' && !text.includes(' — ')) {
      const squad = Math.random() > 0.5 ? home : away;
      const player = squad[Math.floor(Math.random() * Math.max(1, squad.length))];
      injure(state, player);
      if (player) { getStats(state, player.id).injuries += 1; rate(state, player.id, 5.8); event.playerId = player.id; }
      event.text = `Chấn thương — ${player?.name ?? 'Một cầu thủ'} phải nghỉ đến ngày ${player?.injuryUntilDay ?? state.day + 3}.`;
    }
  });
}

function addCards(state: EnrichedState, home: Player[], away: Player[]) {
  const match = state.lastMatch;
  if (!match || (match.events as EventWithFlags[]).some(event => event.cardEnriched)) return;
  const count = Math.random() > 0.45 ? 1 : 2;
  for (let i = 0; i < count; i += 1) {
    const isHome = Math.random() > 0.5;
    const squad = isHome ? home : away;
    const teamName = isHome ? match.home : match.away;
    const player = pickDefender(squad);
    const red = Math.random() > 0.86;
    card(player, red);
    if (red && player) player.suspendedUntilDay = state.day + 2;
    if (player) {
      const stats = getStats(state, player.id);
      if (red) stats.redCards += 1; else stats.yellowCards += 1;
      rate(state, player.id, red ? 5.2 : 5.9);
    }
    (match.events as EventWithFlags[]).push({ minute: Math.floor(25 + Math.random() * 60), type: 'card', cardEnriched: true, playerId: player?.id, text: `${red ? 'Thẻ đỏ' : 'Thẻ vàng'} — ${player?.name ?? 'Một cầu thủ'} của ${teamName} phạm lỗi chiến thuật.` });
  }
}

export function enrichMatchState(input: GameState): GameState {
  const state = input as EnrichedState;
  clearExpiredStatuses(state);
  const match = state.lastMatch;
  if (match && !match.scorersEnriched) {
    const home = squadFor(state, match.home);
    const away = squadFor(state, match.away);
    countAppearance(state, home);
    countAppearance(state, away);
    enrichEvents(state, home, away);
    addCards(state, home, away);
    match.events = [...(match.events ?? [])].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    match.scorersEnriched = true;
  }
  cleanLineup(state);
  return state;
}
