const KEY = 'football-empire-manager-save-v1';

function readSave() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

function countAiPlayers(state: any) {
  return Object.values(state?.opponentSquads || {}).reduce((sum: number, squad: any) => sum + (Array.isArray(squad) ? squad.length : 0), 0);
}

function renderPanel() {
  const old = document.getElementById('player-admin-panel');
  if (old) old.remove();
  const state = readSave();
  const panel = document.createElement('div');
  panel.id = 'player-admin-panel';
  panel