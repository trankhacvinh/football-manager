import './playerAdmin.css';
const K='football-empire-manager-save-v1';
type S={players?:unknown[];transferMarket?:unknown[];academyProspects?:unknown[];opponentSquads?:Record<string,unknown[]>};
function data():S|null{try{return JSON.parse(localStorage.getItem(K)||'null')}catch{return null}}
function ai(s:S){return Object.values(s.opponentSquads||{}).reduce((a,b)=>a+(b?.length||0),0)}
function panel(){const s=data();const o=document.getElementById('pa-panel');if