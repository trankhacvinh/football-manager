const FEM_KEY='football-empire-manager-save-v1';
const rawSetItem=localStorage.setItem.bind(localStorage);
function top(list,score){return [...(list||[])].filter(p=>p.position!=='GK').sort((a,b)=>score(b)-score(a))}
function pickScorer(list){return top(list,p=>(p.shooting||0)+(p.attack||0)+(p.overall||0))[Math.floor(Math.random()*Math.min(5,Math.max(1,list.length)))]||{name:'Một cầu thủ'}}
function pickAssist(list,scorer){return top(list,p=>(p.passing||0)+(p.technique||0)+(p.overall||0)).find(p=>p.id!==scorer.id)||{name:'Đồng đội'}}
function pickKeeper(list){return (list||[]).find(p=>p.position==='GK')||{name:'Thủ môn'}}
function squadFor(s,team){if(s.club&&team===s.club.name){const ids=s.club.lineup||[];return ids.map(id=>(s.players||[]).find(p=>p.id===id)).filter(Boolean)}return ((s.opponentSquads||{})[team]||[]).slice(0,11)}
function boost(p,a,b){if(!p)return;p.form=Math.min(99,(p.form||50)+a);p.morale=Math.min(99,(p.morale||50)+b)}
function hurt(p){if(!p)return;p.fitness=Math.max(30,(p.fitness||80)-8);p.morale=Math.max(1,(p.morale||50)-1)}
function enrich(s){const m=s&&s.lastMatch;if(!m||m.scorersEnriched)return s;const home=squadFor(s,m.home),away=squadFor(s,m.away);(m.events||[]).forEach(e=>{const text=e.text||'';if(e.type==='goal'&&!text.includes(' — ')){const team=text.startsWith(m.home)?m.home:m.away;const squad=team===m.home?home:away;const p=pickScorer(squad);const a=pickAssist(squad,p);boost(p,3,2);boost(a,1,1);e.text=team+' ghi bàn — '+p.name+' dứt điểm sau đường chuyền của '+a.name+'.'}else if(e.type==='save'&&!text.includes(' — ')){const team=Math.random()>0.5?m.home:m.away;const g=pickKeeper(team===m.home?home:away);boost(g,1,1);e.text='Cứu thua — '+g.name+' bay người cản phá cú sút nguy hiểm.'}else if(e.type==='injury'&&!text.includes(' — ')){const squad=Math.random()>0.5?home:away;const p=squad[Math.floor(Math.random()*Math.max(1,squad.length))];hurt(p);e.text='Chấn thương nhẹ — '+(p?.name||'Một cầu thủ')+' bị đau và giảm thể lực.'}});m.scorersEnriched=true;return s}
localStorage.setItem=function(k,v){if(k===FEM_KEY){try{v=JSON.stringify(enrich(JSON.parse(v)))}catch{}}return rawSetItem(k,v)};
