import './vip.css';

const VIP_NAMES = ['Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Kylian Mbappe', 'Erling Haaland', 'Kevin De Bruyne'];

function enhanceVipElements() {
  const targets = document.querySelectorAll('.player-card, tr, .player-modal, .pitch-player, .opponent-player');
  targets.forEach((element) => {
    const text = element.textContent ?? '';
    const isVip = VIP_NAMES.some((name) => text.includes(name));
    if (!isVip || element.classList.contains('vip-enhanced')) return;
    element.classList.add('vip-enhanced', 'vip-player-card');
    const title = element.querySelector('strong, h2');
    if (!title || title.querySelector('.vip-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'vip-badge';
    badge.textContent = 'VIP';
    title.appendChild(badge);
  });
}

function startVipEnhancer() {
  enhanceVipElements();
  const observer = new MutationObserver(enhanceVipElements);
  observer.observe(document.body, { childList: true,