const KEY='football-empire-manager-save-v1';
function readSave(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function countAi(s){return Object.values(s.opponentSquads||{}).reduce((n,a)=>n+(a?a.length:0),0)}
function render(){const s=readSave();const el=document.getElementById('app');if(!s){el.innerHTML='<p>Chưa có save game. Hãy vào game tạo đội trước.</p>';return}el.innerHTML='<h2>'+((s.club&&s.club.name)||'Unknown Club')+'</h2><ul><li>Đội mình: '+(s.players||[]).length+'</li