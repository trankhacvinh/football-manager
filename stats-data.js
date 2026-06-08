const KEY='football-empire-manager-save-v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function renderStats(){const s=read();const el=document.getElementById('app');if(!s){el.textContent='No save game found';return}const stats=s.playerStats||{};el.textContent='Total tracked players: '+Object.keys(stats).length}
renderStats();
