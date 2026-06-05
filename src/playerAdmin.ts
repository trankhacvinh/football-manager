const KEY = 'football-empire-manager-save-v1';

function readSave(): any {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function makeButton() {
  if (document.getElementById('player-admin-button')) return;
  const button = document.createElement('button');
  button.id = 'player-admin-button';
  button.type = 'button';
  button.textContent = 'Quản lý cầu