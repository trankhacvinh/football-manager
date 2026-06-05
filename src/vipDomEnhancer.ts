import './vip.css';

setInterval(() => document.querySelectorAll('.player-card,tr,.player-modal,.pitch-player,.opponent-player').forEach((e) => { if (/Lionel Messi|Cristiano Ronaldo|Kylian Mbapp[eé]|Erling Haaland|Kevin De Bruyne/.test(e.textContent || '')) e.classList.add('vip-player-card'); }), 1000);
