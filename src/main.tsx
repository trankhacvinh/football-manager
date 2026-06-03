import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CalendarDays, Dumbbell, RotateCcw, Play, WalletCards } from 'lucide-react';
import { createNewGame, setLineup, setTactic, simulateNextRound, trainTeam } from './gameEngine';
import { clearGame, loadGame, saveGame } from './storage';
import type { GameState, Player, Tactic } from './types';
import './styles.css';

const currency = new Intl.NumberFormat('vi-VN');
const tacticLabels: Record<Tactic, string> = {
  balanced: 'Can bang',
  attacking: 'Tan cong',
  defensive: 'Phong ngu',
  counter: 'Phan cong',
  possession: 'Kiem soat bong',
  pressing: 'Pressing tam cao',
};

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="card stat-card"><div className="stat-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong></div></div>;
}

function NewGame({ onCreate }: { onCreate: (state: GameState) => void }) {
  const [name, setName] = useState('PMEDIA FC');
  const [stadium, setStadium] = useState('Pmedia Arena');

  return <main className="landing">
    <section className="hero-card">
      <div className="badge">Football Empire Manager MVP</div>
      <h1>Xay dung cau lac bo bong da cua rieng anh</h1>
      <p>Bat dau voi mot doi bong nho, tuyen cau thu, chon chien thuat, gia lap tran dau va dua CLB len ngoi vo dich.</p>
      <div className="create-form">
        <label>Ten cau lac bo</label>
        <input value={name} onChange={e => setName(e.target.value)} />
        <label>San van dong</label>
        <input value={stadium} onChange={e => setStadium(e.target.value)} />
        <button onClick={() => onCreate(createNewGame(name, stadium))}>Tao su nghiep moi</button>
      </div>
    </section>
  </main>;
}

function PlayersTable({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const lineup = state.club?.lineup ?? [];
  return <div className="card">
    <div className="section-title"><h2>Danh sach cau thu</h2><span>{lineup.length}/11 da chon</span></div>
    <div className="table-wrap"><table>
      <thead><tr><th>Chon</th><th>Cau thu</th><th>VT</th><th>Tuoi</th><th>OVR</th><th>POT</th><th>The luc</th><th>Luong</th></tr></thead>
      <tbody>{state.players.map((p: Player) => <tr key={p.id} className={lineup.includes(p.id) ? 'selected-row' : ''}>
        <td><input type="checkbox" checked={lineup.includes(p.id)} onChange={() => setState(setLineup(state, p.id))} /></td>
        <td><strong>{p.name}</strong><small>Gia tri {currency.format(p.value)}</small></td>
        <td><span className={`pos pos-${p.position.toLowerCase()}`}>{p.position}</span></td>
        <td>{p.age}</td><td>{p.overall}</td><td>{p.potential}</td><td>{p.fitness}</td><td>{currency.format(p.salary)}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

function LeagueTable({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Bang xep hang</h2><span>Mua {state.season}</span></div>
    <div className="table-wrap"><table>
      <thead><tr><th>#</th><th>CLB</th><th>Tran</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Diem</th></tr></thead>
      <tbody>{state.league.map((t, index) => <tr key={t.id} className={t.name === state.club?.name ? 'selected-row' : ''}>
        <td>{index + 1}</td><td><strong>{t.name}</strong></td><td>{t.played}</td><td>{t.won}</td><td>{t.drawn}</td><td>{t.lost}</td><td>{t.goalsFor - t.goalsAgainst}</td><td><strong>{t.points}</strong></td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

function MatchPanel({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const nextMatch = state.fixtures.find(f => !f.played);
  const completed = !nextMatch;
  const champion = state.league[0]?.name;
  return <div className="card match-card">
    <div className="section-title"><h2>Tran dau</h2><span>Vong {state.currentRound}</span></div>
    {completed ? <div className="champion"><Trophy /><h3>Mua giai ket thuc</h3><p>Nha vo dich: <strong>{champion}</strong></p></div> : <>
      <div className="versus"><strong>{nextMatch.home}</strong><span>vs</span><strong>{nextMatch.away}</strong></div>
      <button className="primary" disabled={(state.club?.lineup.length ?? 0) !== 11} onClick={() => setState(simulateNextRound(state))}><Play size={18} /> Gia lap tran tiep theo</button>
      {(state.club?.lineup.length ?? 0) !== 11 && <p className="warning">Can chon dung 11 cau thu truoc khi da tran.</p>}
    </>}
    {state.lastMatch && <div className="timeline"><h3>Tran gan nhat: {state.lastMatch.home} {state.lastMatch.homeScore}-{state.lastMatch.awayScore} {state.lastMatch.away}</h3>
      {state.lastMatch.events.map((event, index) => <div key={index} className={`event event-${event.type}`}><span>{event.minute}'</span><p>{event.text}</p></div>)}
    </div>}
  </div>;
}

function Tactics({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  return <div className="card"><div className="section-title"><h2>Chien thuat</h2><span>{state.club ? tacticLabels[state.club.tactic] : ''}</span></div>
    <div className="tactic-grid">{(Object.keys(tacticLabels) as Tactic[]).map(t => <button key={t} className={state.club?.tactic === t ? 'active' : ''} onClick={() => setState(setTactic(state, t))}>{tacticLabels[t]}</button>)}</div>
  </div>;
}

function Fixtures({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Lich thi dau</h2><span>{state.fixtures.filter(f => f.played).length}/{state.fixtures.length}</span></div>
    <div className="fixture-list">{state.fixtures.map(f => <div key={f.id} className={f.played ? 'fixture played' : 'fixture'}>
      <span>Vong {f.round}</span><strong>{f.home} {f.played ? `${f.homeScore}-${f.awayScore}` : 'vs'} {f.away}</strong>
    </div>)}</div>
  </div>;
}

function Dashboard({ state, setState, onReset }: { state: GameState; setState: (s: GameState) => void; onReset: () => void }) {
  const avgOverall = useMemo(() => Math.round(state.players.slice(0, 11).reduce((s, p) => s + p.overall, 0) / 11), [state.players]);
  const club = state.club!;
  return <main className="app-shell">
    <header className="topbar"><div><span className="badge">Season {state.season}</span><h1>{club.name}</h1><p>{club.stadium}</p></div><button className="ghost" onClick={onReset}><RotateCcw size={16} /> Reset</button></header>
    <section className="stats-grid">
      <StatCard title="Ngan sach" value={`${currency.format(club.budget)} VND`} icon={<WalletCards />} />
      <StatCard title="Fan" value={currency.format(club.fans)} icon={<Users />} />
      <StatCard title="Suc manh doi hinh" value={`${avgOverall}/99`} icon={<Trophy />} />
      <StatCard title="Vong dau" value={`${Math.min(state.currentRound, 14)}/14`} icon={<CalendarDays />} />
    </section>
    <section className="main-grid">
      <div className="left-col">
        <MatchPanel state={state} setState={setState} />
        <PlayersTable state={state} setState={setState} />
      </div>
      <div className="right-col">
        <Tactics state={state} setState={setState} />
        <div className="card"><div className="section-title"><h2>Huan luyen</h2><Dumbbell /></div><p>Hoi phuc the luc, tang tinh than va co co hoi tang chi so cau thu tre.</p><button onClick={() => setState(trainTeam(state))}>Huan luyen tuan nay -50.000</button></div>
        <LeagueTable state={state} />
        <Fixtures state={state} />
      </div>
    </section>
  </main>;
}

function App() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  useEffect(() => { if (state) saveGame(state); }, [state]);
  if (!state || !state.club) return <NewGame onCreate={setState} />;
  return <Dashboard state={state} setState={setState} onReset={() => { clearGame(); setState(null); }} />;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
