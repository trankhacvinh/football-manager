type VipUiPlayer = {
  name: string;
  avatarUrl: string;
};

const vipUiPlayers: VipUiPlayer[] = [
  { name: 'Lionel Messi', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Lionel%20Messi' },
  { name: 'Cristiano Ronaldo', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Cristiano%20Ronaldo' },
  { name: 'Kylian Mbappé', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kylian%20Mbappe' },
  { name: 'Kylian Mbappe', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kylian%20Mbappe' },
  { name: 'Erling Haaland', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Erling%20Haaland' },
  { name: 'Kevin De Bruyne', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kevin%20De%20Bruyne' },
];

function findVip(text: string): VipUiPlayer | null {
  return vipUiPlayers.find(player => text.includes(player.name)) ?? null;
}

function addVipBadge(target: Element) {
  if (target.querySelector('.vip-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'vip-badge';
  badge.textContent = 'VIP';
  target.appendChild(badge);
}

function addAvatar(container: Element, vip: VipUiPlayer, compact = false) {
  if (container.querySelector('.vip-avatar')) return;
  const avatar = document.createElement('img');
  avatar.className = compact ? 'vip-avatar vip-avatar-compact' : 'vip-avatar';
  avatar.src = vip.avatarUrl;
  avatar.alt = vip.name;
  avatar.loading = 'lazy';
  container.prepend(avatar);
}

function enhancePlayerCard(card: Element, vip: VipUiPlayer) {
  card.classList.add('vip-player-card');
  addAvatar(card, vip);
  const title = card.querySelector('strong');
  if (title) addVipBadge(title);
}

function enhanceTableRow(row: Element, vip: VipUiPlayer) {
  row.classList.add('vip-player-row');
  const firstButton = row.querySelector('.link-button');
  if (firstButton) {
    addAvatar(firstButton, vip, true);
    const title = firstButton.querySelector('strong');
    if (title) addVipBadge(title);
  }
}

function enhanceModal(modal: Element, vip: VipUiPlayer) {
  modal.classList.add('vip-player-modal');
  const hero = modal.querySelector('.modal-hero');
  if (hero) {
    addAvatar(hero, vip);
    const title = hero.querySelector('h2');
    if (title) addVipBadge(title);
  }
}

function enhancePitchPlayer(button: Element, vip: VipUiPlayer) {
  button.classList.add('vip-pitch-player');
  const title = button.querySelector('strong');
  if (title) addVipBadge(title);
  addAvatar(button, vip, true);
}

function enhanceVipUi() {
  document.querySelectorAll('.player-card, tr, .player-modal, .pitch-player, .opponent-player').forEach(element => {
    const vip = findVip(element.textContent ?? '');
    if (!vip) return;
    if (element.classList.contains('player-card')) enhancePlayerCard(element, vip);
    else if (element.classList.contains('player-modal')) enhanceModal(element, vip);
    else if (element.classList.contains('pitch-player')) enhancePitchPlayer(element, vip);
    else if (element.tagName.toLowerCase() === 'tr') enhanceTableRow(element, vip);
    else element.classList.add('vip-player-row');
  });
}

const observer = new MutationObserver(() => enhanceVipUi());

function startVipEnhancer() {
  enhanceVipUi();
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startVipEnhancer, { once: true });
} else {
  startVipEnhancer();
}
