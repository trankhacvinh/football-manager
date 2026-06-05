import './vip.css';

const VIP_NAMES = ['Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Kylian Mbappe', 'Erling Haaland', 'Kevin De Bruyne'];

function enhanceVipElements() {
  document.querySelectorAll('.player-card, tr, .player-modal, .pitch-player, .opponent-player').forEach((element) => {
    const text = element.textContent ?? '';
    const isVip = VIP_NAMES.some((name) => text.includes(name));
    if (!isVip || element.classList.contains('vip