import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CalendarDays, Dumbbell, RotateCcw, Play, WalletCards, ShoppingCart, RefreshCw, X, Eye } from 'lucide-react';
import { buyPlayer, createNewGame, refreshTransferMarket, sellPlayer, setLineup, setTactic, simulateNextRound, trainTeam } from './gameEngine';
import { clearGame, loadGame, saveGame } from './storage';
import type { GameState, Player, Position, Tactic } from './types';
import './styles.css';

const currency = new Intl.NumberFormat('vi-VN');
const tacticLabels: Record<Tactic, string> = {
  balanced: 'Cân bằng',
  attacking: 'Tấn công',
  defensive: 'Phòng ngự',
  counter: 'Phản công',
  possession: 'Kiểm soát bóng',
  pressing: 'Pressing tầm cao',
};

function money(value: number) {
  return `${currency.format(value)} VND`;
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="card stat-card"><div className="stat-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong></div></div>;
}

function NewGame({ onCreate }: { onCreate: (state: GameState) => void }) {
  const [name, setName] = useState('PMEDIA FC');
  const [stadium, setStadium] = useState('Pmedia Arena');

  return <main className="landing">
    <section className="hero-card">
      <div className="badge">Football Empire Manager MVP</div>
      <h1>Xây dựng câu lạc bộ bóng đá của riêng anh</h1>
      <p>Bắt đầu với một đội bóng nhỏ, tuyển cầu thủ, chọn chiến thuật, giả lập trận đấu và đưa CLB lên ngôi vô địch.</p>
      <div className="create-form">
        <label>Tên câu lạc bộ</label>
        <input value={name} onChange={e => setName(e.target.value)} />
        <label>Sân vận động</label>
        <input value={stadium} onChange={e => setStadium(e.target.value)} />
        <button onClick={() => onCreate(createNewGame(name, stadium))}>Tạo sự nghiệp mới</button>
      </div>
    </section>
  </main>;
}

function PlayerDetailModal({ player, origin, onClose, onBuy, onSell, canBuy }: { player: Player | null; origin: 'squad' | 'market'; onClose: () => void; onBuy?: () => void; onSell?: () => void; canBuy?: boolean }) {
  if (!player) return null;
  const mainStats = [
    ['Tấn công', player.attack],
    ['Phòng thủ', player.defense],
    ['Tốc độ', player.speed],
    ['Thể lực', player.stamina],
    ['Kỹ thuật', player.technique],
    ['Chuyền bóng', player.passing],
    ['Dứt điểm', player.shooting],
    ['Thủ môn', player.goalkeeping],
  ];

  return <div className="modal-backdrop" onClick={onClose}>
    <section className="player-modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <div className="modal-hero">
        <div>
          <span className={`pos pos-${player.position.toLowerCase()}`}>{player.position}</span>
          <h2>{player.name}</h2>
          <p>{player.age} tuổi • Giá trị {money(player.value)} • Lương {money(player.salary)}</p>
        </div>
        <div className="overall-badge"><span>OVR</span><strong>{player.overall}</strong></div>
      </div>
      <div className="detail-summary">
        <div><span>Tiềm năng</span><strong>{player.potential}</strong></div>
        <div><span>Thể lực</span><strong>{player.fitness}</strong></div>
        <div><span>Tinh thần</span><strong>{player.morale}</strong></div>
        <div><span>Phong độ</span><strong>{player.form}</strong></div>
      </div>
      <div className="attribute-grid">
        {mainStats.map(([label, value]) => <div key={label} className="attribute-row">
          <div><span>{label}</span><strong>{value}</strong></div>
          <div className="bar"><i style={{ width: `${value}%` }} /></div>
        </div>)}
      </div>
      <div className="modal-actions">
        {origin === 'market' && <button disabled={!canBuy} onClick={onBuy}><ShoppingCart size={16} /> Mua cầu thủ</button>}
        {origin === 'squad' && <button className="danger" onClick={onSell}>Bán cầu thủ</button>}
        <button className="ghost" onClick={onClose}>Đóng</button>
      </div>
    </section>
  </div>;
}

function FormationPitch({ state, onView }: { state: GameState; onView: (player: Player, origin: 'squad' | 'market') => void }) {
  const lineupIds = state.club?.lineup ?? [];
  const selected = lineupIds.map(id => state.players.find(p => p.id === id)).filter(Boolean) as Player[];
  const group = (pos: Position) => selected.filter(p => p.position === pos);
  const expected: Record<Position, number> = { GK: 1, DF: 4, MF: 4, FW: 2 };
  const positions: Position[] = ['FW', 'MF', 'DF', 'GK'];
  const warnings = (['GK', 'DF', 'MF', 'FW'] as Position[])
    .filter(pos => group(pos).length !== expected[pos])
    .map(pos => `${pos}: ${group(pos).length}/${expected[pos]}`);

  return <div className="card">
    <div className="section-title"><h2>Sơ đồ đội hình 4-4-2</h2><span>{selected.length}/11 cầu thủ</span></div>
    <div className="pitch">
      <div className="pitch-lines" />
      {positions.map(pos => <div key={pos} className={`pitch-line pitch-${pos.toLowerCase()}`}>
        {group(pos).length ? group(pos).map(player => <button key={player.id} className="pitch-player" onClick={() => onView(player, 'squad')}>
          <span className={`pos pos-${player.position.toLowerCase()}`}>{player.position}</span>
          <strong>{player.name.split(' ').slice(-2).join(' ')}</strong>
          <small>OVR {player.overall}</small>
        </button>) : <div className="empty-line">Thiếu {pos}</div>}
      </div>)}
    </div>
    {warnings.length > 0 && <div className="formation-warning">Đội hình chưa đúng khuyến nghị 4-4-2: {warnings.join(' • ')}</div>}
  </div>;
}

function PlayersTable({ state, setState, onView }: { state: GameState; setState: (s: GameState) => void; onView: (player: Player, origin: 'squad' | 'market') => void }) {
  const lineup = state.club?.lineup ?? [];
  return <div className="card">
    <div className="section-title"><h2>Danh sách cầu thủ</h2><span>{lineup.length}/11 đã chọn</span></div>
    <div className="table-wrap"><table>
      <thead><tr><th>Chọn</th><th>Cầu thủ</th><th>VT</th><th>Tuổi</th><th>OVR</th><th>POT</th><th>Thể lực</th><th>Lương</th><th></th></tr></thead>
      <tbody>{state.players.map((p: Player) => <tr key={p.id} className={lineup.includes(p.id) ? 'selected-row' : ''}>
        <td><input type="checkbox" checked={lineup.includes(p.id)} onChange={() => setState(setLineup(state, p.id))} /></td>
        <td><button className="link-button" onClick={() => onView(p, 'squad')}><strong>{p.name}</strong><small>Giá trị {money(p.value)}</small></button></td>
        <td><span className={`pos pos-${p.position.toLowerCase()}`}>{p.position}</span></td>
        <td>{p.age}</td><td>{p.overall}</td><td>{p.potential}</td><td>{p.fitness}</td><td>{currency.format(p.salary)}</td>
        <td className="row-actions"><button className="ghost small-btn" onClick={() => onView(p, 'squad')}><Eye size={14} /> Xem</button><button className="danger small-btn" onClick={() => setState(sellPlayer(state, p.id))}>Bán</button></td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

function TransferMarket({ state, setState, onView }: { state: GameState; setState: (s: GameState) => void; onView: (player: Player, origin: 'squad' | 'market') => void }) {
  const market = state.transferMarket ?? [];
  return <div className="card">
    <div className="section-title"><h2>Thị trường chuyển nhượng</h2><button className="ghost small-btn" onClick={() => setState(refreshTransferMarket(state))}><RefreshCw size={15} /> Làm mới -120.000</button></div>
    {state.transferMessage && <div className={`notice notice-${state.transferMessage.type}`}>{state.transferMessage.text}</div>}
    <div className="market-grid">
      {market.slice(0, 12).map(player => <div key={player.id} className="player-card">
        <div className="player-card-head"><div><button className="link-button" onClick={() => onView(player, 'market')}><strong>{player.name}</strong><span>{player.age} tuổi • {player.position}</span></button></div><b>{player.overall}</b></div>
        <div className="player-metrics"><span>POT {player.potential}</span><span>Thể lực {player.fitness}</span><span>Lương {currency.format(player.salary)}</span></div>
        <div className="player-price"><span>Giá mua</span><strong>{money(player.value)}</strong></div>
        <div className="card-actions"><button className="ghost" onClick={() => onView(player, 'market')}><Eye size={16} /> Xem chi tiết</button><button disabled={(state.club?.budget ?? 0) < player.value} onClick={() => setState(buyPlayer(state, player.id))}><ShoppingCart size={16} /> Mua</button></div>
      </div>)}
    </div>
  </div>;
}

function LeagueTable({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Bảng xếp hạng</h2><span>Mùa {state.season}</span></div>
    <div className="table-wrap"><table>
      <thead><tr><th>#</th><th>CLB</th><th>Trận</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Điểm</th></tr></thead>
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
    <div className="section-title"><h2>Trận đấu</h2><span>Vòng {state.currentRound}</span></div>
    {completed ? <div className="champion"><Trophy /><h3>Mùa giải kết thúc</h3><p>Nhà vô địch: <strong>{champion}</strong></p></div> : <>
      <div className="versus"><strong>{nextMatch.home}</strong><span>vs</span><strong>{nextMatch.away}</strong></div>
      <button className="primary" disabled={(state.club?.lineup.length ?? 0) !== 11} onClick={() => setState(simulateNextRound(state))}><Play size={18} /> Giả lập trận tiếp theo</button>
      {(state.club?.lineup.length ?? 0) !== 11 && <p className="warning">Cần chọn đúng 11 cầu thủ trước khi đá trận.</p>}
    </>}
    {state.lastMatch && <div className="timeline"><h3>Trận gần nhất: {state.lastMatch.home} {state.lastMatch.homeScore}-{state.lastMatch.awayScore} {state.lastMatch.away}</h3>
      {state.lastMatch.events.map((event, index) => <div key={index} className={`event event-${event.type}`}><span>{event.minute}'</span><p>{event.text}</p></div>)}
    </div>}
  </div>;
}

function Tactics({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  return <div className="card"><div className="section-title"><h2>Chiến thuật</h2><span>{state.club ? tacticLabels[state.club.tactic] : ''}</span></div>
    <div className="tactic-grid">{(Object.keys(tacticLabels) as Tactic[]).map(t => <button key={t} className={state.club?.tactic === t ? 'active' : ''} onClick={() => setState(setTactic(state, t))}>{tacticLabels[t]}</button>)}</div>
  </div>;
}

function Fixtures({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Lịch thi đấu</h2><span>{state.fixtures.filter(f => f.played).length}/{state.fixtures.length}</span></div>
    <div className="fixture-list">{state.fixtures.map(f => <div key={f.id} className={f.played ? 'fixture played' : 'fixture'}>
      <span>Vòng {f.round}</span><strong>{f.home} {f.played ? `${f.homeScore}-${f.awayScore}` : 'vs'} {f.away}</strong>
    </div>)}</div>
  </div>;
}

function Dashboard({ state, setState, onReset }: { state: GameState; setState: (s: GameState) => void; onReset: () => void }) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<'squad' | 'market'>('squad');
  const avgOverall = useMemo(() => Math.round(state.players.slice(0, 11).reduce((s, p) => s + p.overall, 0) / 11), [state.players]);
  const club = state.club!;
  const viewPlayer = (player: Player, origin: 'squad' | 'market') => { setSelectedPlayer(player); setSelectedOrigin(origin); };
  const closeModal = () => setSelectedPlayer(null);
  const selectedCanBuy = selectedPlayer ? club.budget >= selectedPlayer.value : false;

  return <main className="app-shell">
    <header className="topbar"><div><span className="badge">Mùa {state.season}</span><h1>{club.name}</h1><p>{club.stadium}</p></div><button className="ghost" onClick={onReset}><RotateCcw size={16} /> Chơi lại</button></header>
    <section className="stats-grid">
      <StatCard title="Ngân sách" value={money(club.budget)} icon={<WalletCards />} />
      <StatCard title="Người hâm mộ" value={currency.format(club.fans)} icon={<Users />} />
      <StatCard title="Sức mạnh đội hình" value={`${avgOverall}/99`} icon={<Trophy />} />
      <StatCard title="Vòng đấu" value={`${Math.min(state.currentRound, 14)}/14`} icon={<CalendarDays />} />
    </section>
    <section className="main-grid">
      <div className="left-col">
        <MatchPanel state={state} setState={setState} />
        <FormationPitch state={state} onView={viewPlayer} />
        <TransferMarket state={state} setState={setState} onView={viewPlayer} />
        <PlayersTable state={state} setState={setState} onView={viewPlayer} />
      </div>
      <div className="right-col">
        <Tactics state={state} setState={setState} />
        <div className="card"><div className="section-title"><h2>Huấn luyện</h2><Dumbbell /></div><p>Hồi phục thể lực, tăng tinh thần và có cơ hội tăng chỉ số cho cầu thủ trẻ.</p><button onClick={() => setState(trainTeam(state))}>Huấn luyện tuần này -50.000</button></div>
        <LeagueTable state={state} />
        <Fixtures state={state} />
      </div>
    </section>
    <PlayerDetailModal
      player={selectedPlayer}
      origin={selectedOrigin}
      canBuy={selectedCanBuy}
      onClose={closeModal}
      onBuy={() => { if (selectedPlayer) setState(buyPlayer(state, selectedPlayer.id)); closeModal(); }}
      onSell={() => { if (selectedPlayer) setState(sellPlayer(state, selectedPlayer.id)); closeModal(); }}
    />
  </main>;
}

function App() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  useEffect(() => { if (state) saveGame(state); }, [state]);
  if (!state || !state.club) return <NewGame onCreate={setState} />;
  return <Dashboard state={state} setState={setState} onReset={() => { clearGame(); setState(null); }} />;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
