const KEY='football-empire-manager-save-v1';
let editId='';
function readSave(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function cell(v){return String(v??'')}
function num(v){return Number(v||0)}
function render(){const s=readSave();const el=document.getElementById('app');if(!s){el.textContent='No save game found';return}const players=s.players||[];let html='<p>Club: '+cell(s.club?.name)+' | Players: '+players.length+' | Market: '+(s.transferMarket||[]).length+' | Academy: '+(s.academyProspects||[]).length+'</p>';if(editId){const p=players.find(x=>x.id===editId);if(p)html+='<h3>Edit player</h3><p><input id="n" value="'+cell(p.name)+'"> Age <input id="age" type="number" value="'+cell(p.age)+'"> OVR <input id="ovr" type="number" value="'+cell(p.overall)+'"> POT <input id="pot" type="number" value="'+cell(p.potential)+'"> Salary <input id="sal" type="number" value="'+cell(p.salary)+'"> <button onclick="saveEdit()">Save</button> <button onclick="cancelEdit()">Cancel</button></p>'}html+='<table border="1" cellpadding="6"><tr><th>Name</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th>Salary</th><th></th></tr>';players.forEach(p=>{html+='<tr><td>'+cell(p.name)+'</td><td>'+cell(p.position)+'</td><td>'+cell(p.age)+'</td><td>'+cell(p.overall)+'</td><td>'+cell(p.potential)+'</td><td>'+cell(p.salary)+'</td><td><button onclick="editPlayer(\''+p.id+'\')">Edit</button></td></tr>'});html+='</table>';el.innerHTML=html}
function editPlayer(id){editId=id;render()}
function cancelEdit(){editId='';render()}
function saveEdit(){const s=readSave();const p=(s.players||[]).find(x=>x.id===editId);if(!p)return;p.name=document.getElementById('n').value;p.age=num(document.getElementById('age').value);p.overall=num(document.getElementById('ovr').value);p.potential=num(document.getElementById('pot').value);p.salary=num(document.getElementById('sal').value);save(s);editId='';render()}
