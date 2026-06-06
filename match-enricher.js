const FEM_KEY='football-empire-manager-save-v1';
const rawSetItem=localStorage.setItem.bind(localStorage);
function pickScorer(list){
  const pool=(list||[]).filter(p=>p.position!=='GK');
  const sorted=pool.sort((a,b)=>((b.shooting||0)+(b.attack||0)+(b.overall||0))-((a.shooting||0)+(a.attack||0)+(a.overall||0)));
  return sorted[Math.floor(Math.random()*Math.min(5,sorted.length))]||sorted[0]||{name:'Một cầu thủ'};
}
function squadFor(s,team){
  if(s.club&&team===s.club.name){const ids=s.club.lineup||[];return ids.map(id=>(s.players||[]).find(p=>p.id===id)).filter(Boolean)}
  return ((s.opponentSquads||{})[team]||[]).slice(0,11);
}
function enrich(s){
  const m=s&&s.lastMatch;if(!m||m.scorersEnriched)return s;
  const home=squadFor(s,m.home),away=squadFor(s,m.away);
  let h=0,a=0;
  (m.events||[]).forEach(e=>{if(e.type!=='goal')return;if(e.text.includes(' — '))return;const team=e.text.startsWith(m.home)?m.home:m.away;const p=pickScorer(team===m.home?home:away);e.text=team+' ghi bàn — '+p.name+' dứt điểm thành công.';if(team===m.home)h++;else a++;});
  m.scorersEnriched=true;return s;
}
localStorage.setItem=function(k,v){
  if(k===FEM_KEY){try{v=JSON.stringify(enrich(JSON.parse(v)))}catch{}}
  return rawSetItem(k,v);
};
