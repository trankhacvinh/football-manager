import type { GameState } from './types';
import { enrichMatchState } from './matchEnricherCore';
import { seedVipPlayers } from './vipPlayers';

const KEY = 'football-empire-manager-save-v1';

function normalizeState(state: GameState): GameState {
  return enrichMatchState({
    ...state,
    transferMarket: seedVipPlayers(state.transferMarket ?? []),
  });
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeState(JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify(normalizeState(state)));
}

export function clearGame() {
  localStorage.removeItem(KEY);
}
