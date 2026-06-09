const FB_KEY='football-empire-manager-save-v1';
const rawSet=localStorage.setItem.bind(localStorage);
function readSave(){try{return JSON.parse(localStorage.getItem(FB_KEY)||'null')}catch{return null}}
function writeSave(s){rawSet(FB_KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('football-state-updated',{detail:s}))}
function refreshStatus(s){const day=s.day||1;[...(s.players||[]),...Object.values(s.opponentSquads||{}).flat()].forEach(p=>{if(p.status==='injured'&&(p.injuryUntilDay||0)<=day)p.status='available';if(p.status==='suspended'&&(p.suspendedUntilDay||0)<=day)p.status='available'});return s}
function cleanLineup(s){if(!s.club)return s;const blocked=new Set((s.players||[]).filter(p=>p.status==='injured'||p.status==='suspended').map(p=>p.id));const before=(s.club.lineup||[]).length;s.club.lineup=(s.club.lineup||[]).filter(id=>!blocked.has(id));if(s.club.lineup.length!==before)s.lineupWarning='Một số cầu thủ chấn thương/treo giò đã bị loại khỏi đội hình.';return s}
function buildReport(s){const m=s.lastMatch;if(!m)return s;const ev=m.events||[];const by=t=>ev.filter(e=>e.type===t).map(e=>(e.minute||0)+"' "+e.text);const summary=m.homeScore===m.awayScore?'Hai đội chia điểm.':m.homeScore>m.awayScore?m.home+' giành chiến thắng.':m.away+' giành chiến thắng.';s.lastMatchReport={title:m.home+' vs '+m.away,score:m.home+' '+m.homeScore+' - '+m.awayScore+' '+m.away,summary,goals:by('goal'),saves:by('save'),cards:by('card'),injuries:by('injury')};return s}
function normalize(s){return s?buildReport(cleanLineup(refreshStatus(s))):s}
localStorage.setItem=function(k,v){if(k===FB_KEY){try{v=JSON.stringify(normalize(JSON.parse(v)))}catch{}}const r=rawSet(k,v);if(k===FB_KEY){try{window.dispatchEvent(new CustomEvent('football-state-updated',{detail:JSON.parse(v)}))}catch{}}return r};
window.footballNormalizeNow=function(){const s=readSave();if(s)writeSave(normalize(s));return readSave()};
