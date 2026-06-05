import './playerAdmin.css';

const KEY='football-empire-manager-save-v1';
type Save={players?:unknown[];transferMarket?:unknown[];academyProspects?:unknown[];opponentSquads?:Record<string,unknown[]>};
function load():Save|null{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function countAi(s:Save){return Object.values(s.opponentSquads||{}).reduce((a,b)=>a+(b?.length||0),0)}
function openPanel(){
 const s=load();
 const old=document.getElementById('pa-panel'); if(old) old.remove();
 const p=document.createElement('div'); p.id='pa-panel';
 p.innerHTML='<b>Quản lý cầu thủ</b><button id="pa-close">×</button>'+(s?`<p>Đội mình: ${s.players?.length||0}</p><p>Market: ${s.transferMarket?.length||