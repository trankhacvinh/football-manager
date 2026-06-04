import type { GameState } from './types';
import { seedVipPlayers } from './vipPlayers';

const KEY = 'football-empire-manager-save-v1';

function withVipPlayers(state: GameState): GameState {
  return {
    ...state,
    transferMarket: seedVipPlayers(state.transferMarket ?? []),
  };
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? withVipPlayers(JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState) {
  localStorage.setItem(KEY, JSON.stringify(withVipPlayers(state)));
}

export function clearGame() {
  localStorage.removeItem(KEY);
}
