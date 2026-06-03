import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CalendarDays, Dumbbell, RotateCcw, Play, WalletCards, ShoppingCart, RefreshCw, X, Eye, ChevronsRight, Search, Moon, Newspaper } from 'lucide-react';
import { advanceDay, buyPlayer, createNewGame, getTodayMatch, refreshTransferMarket, restTeam, scoutAcademy, sellPlayer, setLineup, setTactic, signAcademyProspect, simulateNextRound, startNextSeason, trainTeam } from './gameEngine';
import { clearGame, loadGame, saveGame } from './storage';
import type { AcademyProspect, GameState, Player, Position, Tactic } from './types';
import './styles.css';
import './news.css';

const currency = new Intl.NumberFormat('vi-VN');
const tacticLabels: Record<Tactic, string> = { balanced: 'Cân bằng', attacking: 'Tấn công', defensive: 'Phòng ngự', counter: 'Phản công', possession: 'Kiểm soát bóng', pressing: 'Pressing tầm cao' };
const money = (value: number) => `${currency.format(value)} VND`;
const ensureState = (state: GameState): GameState => ({ ...state, day: state.day ?? 1, actionsRemaining: state.actionsRemaining ?? 3, maxActionsPerDay: state.maxActionsPerDay ?? 3, academyProspects: state.academyProspects ?? [], news: state.news ?? [] });

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="card stat-card"><div className="stat-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong></div></div>;
}

function NewGame({ onCreate }: { onCreate: (state: GameState) => void }) {
  const [name, setName] = useState('PMEDIA FC');
  const [stadium, setStadium] = useState('Pmedia Arena');
  return <main className="landing"><section className="hero-card"><div className="badge">Football Empire Manager MVP</div><h1>Xây dựng câu lạc bộ bóng đá của riêng anh</h1><p>Bắt đầu với một đội bóng nhỏ, quản lý lịch ngày, scout tài năng trẻ, huấn luyện, chuyển nhượng và thi đấu theo mùa giải.</p><div className="create-form"><label>Tên câu lạc bộ</label><input value={name} onChange={e => setName(e.target.value)} /><label>Sân vận động</label><input value={stadium} onChange={e => setStadium(e.target.value)} /><button onClick={() => onCreate(createNewGame(name, stadium))}>Tạo sự nghiệp mới</button></div></section></main>;
}

function PlayerDetailModal({ player, origin, onClose, onBuy, onSell, onSign, canBuy }: { player: Player | AcademyProspect | null; origin: 'squad' | 'market' | 'academy'; onClose: () => void; onBuy?: () => void; onSell?: () => void; onSign?: () => void; canBuy?: boolean }) {
  if (!player) return null;
  const prospect = player as AcademyProspect;
  const stats = [['Tấn công', player.attack], ['Phòng thủ', player.defense], ['Tốc độ', player.speed], ['Thể lực', player.stamina], ['Kỹ thuật', player.technique], ['Chuyền bóng', player.passing], ['Dứt điểm', player.shooting], ['Thủ môn', player.goalkeeping]];
  return <div className="modal-backdrop" onClick={onClose}><section className="player-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="modal-hero"><div><span className={`pos pos-${player.position.toLowerCase()}`}>{player.position}</span><h2>{player.name}</h2><p>{player.age} tuổi • Giá trị {money(player.value)} • Lương {money(player.salary)}{origin === 'academy' && ` • Phí ký ${money(prospect.signingFee)}`}</p></div><div className="overall-badge"><span>OVR</span><strong>{player.overall}</strong></div></div><div className="detail-summary"><div><span>Tiềm năng</span><strong>{player.potential}</strong></div><div><span>Thể lực</span><strong>{player.fitness}</strong></div><div><span>Tinh thần</span><strong>{player.morale}</strong></div><div><span>Phong độ</span><strong>{player.form}</strong></div></div><div className="attribute-grid">{stats.map(([label, value]) => <div key={label} className="attribute-row"><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i style={{ width: `${value}%` }} /></div></div>)}</div><div className="modal-actions">{origin === 'market' && <button disabled={!canBuy} onClick={onBuy}><ShoppingCart size={16} /> Mua cầu thủ</button>}{origin === 'academy' && <button disabled={!canBuy} onClick={onSign}><Search size={16} /> Ký hợp đồng</button>}{origin === 'squad' && <button className="danger" onClick={onSell}>Bán cầu thủ</button>}<button className="ghost" onClick={onClose}>Đóng</button></div></section></div>;
}

function CalendarPanel({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const todayMatch = getTodayMatch(state);
  const nextMatch = state.fixtures.find(f => !f.played);
  return <div className="card calendar-card"><div className="section-title"><h2>Lịch ngày</h2><CalendarDays /></div><div className="day-box"><div><span>Ngày hiện tại</span><strong>Ngày {state.day}</strong></div><div><span>Lượt hành động</span><strong>{state.actionsRemaining}/{state.maxActionsPerDay}</strong></div></div>{todayMatch ? <div className="today-match"><span>Hôm nay có trận</span><strong>{todayMatch.home} vs {todayMatch.away}</strong></div> : <p>Hôm nay không có trận. Anh nên dùng lượt để huấn luyện, scout, nghỉ hồi phục hoặc chuyển nhượng.</p>}{nextMatch && !todayMatch && <p className="muted">Trận tiếp theo: ngày {nextMatch.day}, vòng {nextMatch.round}: {nextMatch.home} vs {nextMatch.away}</p>}<div className="card-actions"><button className="ghost" onClick={() => setState(restTeam(state))}><Moon size={16} /> Nghỉ hồi phục</button><button onClick={() => setState(advanceDay(state))}><ChevronsRight size={16} /> Sang ngày mới</button></div></div>;
}

function NewsPanel({ state }: { state: GameState }) {
  const news = state.news ?? [];
  return <div className="card news-card"><div className="section-title"><h2>Tin tức CLB</h2><Newspaper /></div>{news.length === 0 ? <p>Chưa có tin tức nào. Hãy sang ngày mới hoặc thực hiện hành động để tạo sự kiện.</p> : <div className="news-list">{news.slice(0, 8).map(item => <div key={item.id} className={`news-item news-${item.type}`}><span>Mùa {item.season} • Ngày {item.day}</span><strong>{item.title}</strong><p>{item.text}</p></div>)}</div>}</div>;
}

function FormationPitch({ state, onView }: { state: GameState; onView: (player: Player, origin: 'squad' | 'market' | 'academy') => void }) {
  const selected = (state.club?.lineup ?? []).map(id => state.players.find(p => p.id === id)).filter(Boolean) as Player[];
  const group = (pos: Position) => selected.filter(p => p.position === pos);
  const expected: Record<Position, number> = { GK: 1, DF: 4, MF: 4, FW: 2 };
  const positions: Position[] = ['FW', 'MF', 'DF', 'GK'];
  const warnings = (['GK', 'DF', 'MF', 'FW'] as Position[]).filter(pos => group(pos).length !== expected[pos]).map(pos => `${pos}: ${group(pos).length}/${expected[pos]}`);
  return <div className="card"><div className="section-title"><h2>Sơ đồ đội hình 4-4-2</h2><span>{selected.length}/11 cầu thủ</span></div><div className="pitch"><div className="pitch-lines" />{positions.map(pos => <div key={pos} className="pitch-line">{group(pos).length ? group(pos).map(player => <button key={player.id} className="pitch-player" onClick={() => onView(player, 'squad')}><span className={`pos pos-${player.position.toLowerCase()}`}>{player.position}</span><strong>{player.name.split(' ').slice(-2).join(' ')}</strong><small>OVR {player.overall}</small></button>) : <div className="empty-line">Thiếu {pos}</div>}</div>)}</div>{warnings.length > 0 && <div className="formation-warning">Đội hình chưa đúng khuyến nghị 4-4-2: {warnings.join(' • ')}</div>}</div>;
}

function PlayersTable({ state, setState, onView }: { state: GameState; setState: (s: GameState) => void; onView: (player: Player, origin: 'squad' | 'market' | 'academy') => void }) {
  const lineup = state.club?.lineup ?? [];
  return <div className="card"><div className="section-title"><h2>Danh sách cầu thủ</h2><span>{lineup.length}/11 đã chọn</span></div><div className="table-wrap"><table><thead><tr><th>Chọn</th><th>Cầu thủ</th><th>VT</th><th>Tuổi</th><th>OVR</th><th>POT</th><th>Thể lực</th><th>Lương</th><th></th></tr></thead><tbody>{state.players.map(p => <tr key={p.id} className={lineup.includes(p.id) ? 'selected-row' : ''}><td><input type="checkbox" checked={lineup.includes(p.id)} onChange={() => setState(setLineup(state, p.id))} /></td><td><button className="link-button" onClick={() => onView(p, 'squad')}><strong>{p.name}</strong><small>Giá trị {money(p.value)}</small></button></td><td><span className={`pos pos-${p.position.toLowerCase()}`}>{p.position}</span></td><td>{p.age}</td><td>{p.overall}</td><td>{p.potential}</td><td>{p.fitness}</td><td>{currency.format(p.salary)}</td><td className="row-actions"><button className="ghost small-btn" onClick={() => onView(p, 'squad')}><Eye size={14} /> Xem</button><button className="danger small-btn" onClick={() => setState(sellPlayer(state, p.id))}>Bán</button></td></tr>)}</tbody></table></div></div>;
}

function AcademyPanel({ state, setState, onView }: { state: GameState; setState: (s: GameState) => void; onView: (player: AcademyProspect, origin: 'academy') => void }) {
  const prospects = state.academyProspects ?? [];
  return <div className="card"><div className="section-title"><h2>Học viện & Scout</h2><button onClick={() => setState(scoutAcademy(state))}><Search size={16} /> Scout -180.000</button></div><p>Tìm 3 cầu thủ trẻ. Mỗi lượt scout có xác suất ra Wonderkid tiềm năng cao.</p><div className="market-grid">{prospects.map(p => <div key={p.id} className="player-card academy-card"><div className="player-card-head"><div><button className="link-button" onClick={() => onView(p, 'academy')}><strong>{p.name}</strong><span>{p.age} tuổi • {p.position} • {p.rarity}</span></button></div><b>{p.potential}</b></div><div className="player-metrics"><span>OVR {p.overall}</span><span>POT {p.potential}</span><span>Phí ký {currency.format(p.signingFee)}</span></div><div className="card-actions"><button className="ghost" onClick={() => onView(p, 'academy')}><Eye size={16} /> Xem</button><button disabled={(state.club?.budget ?? 0) < p.signingFee} onClick={() => setState(signAcademyProspect(state, p.id))}>Ký</button></div></div>)}</div></div>;
}

function TransferMarket({ state, setState, onView }: { state: GameState; setState: (s: GameState) => void; onView: (player: Player, origin: 'squad' | 'market' | 'academy') => void }) {
  const market = state.transferMarket ?? [];
  return <div className="card"><div className="section-title"><h2>Thị trường chuyển nhượng</h2><button className="ghost small-btn" onClick={() => setState(refreshTransferMarket(state))}><RefreshCw size={15} /> Làm mới -120.000</button></div>{state.transferMessage && <div className={`notice notice-${state.transferMessage.type}`}>{state.transferMessage.text}</div>}<div className="market-grid">{market.slice(0, 12).map(player => <div key={player.id} className="player-card"><div className="player-card-head"><div><button className="link-button" onClick={() => onView(player, 'market')}><strong>{player.name}</strong><span>{player.age} tuổi • {player.position}</span></button></div><b>{player.overall}</b></div><div className="player-metrics"><span>POT {player.potential}</span><span>Thể lực {player.fitness}</span><span>Lương {currency.format(player.salary)}</span></div><div className="player-price"><span>Giá mua</span><strong>{money(player.value)}</strong></div><div className="card-actions"><button className="ghost" onClick={() => onView(player, 'market')}><Eye size={16} /> Xem</button><button disabled={(state.club?.budget ?? 0) < player.value} onClick={() => setState(buyPlayer(state, player.id))}><ShoppingCart size={16} /> Mua</button></div></div>)}</div></div>;
}

function LeagueTable({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Bảng xếp hạng</h2><span>Mùa {state.season}</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>CLB</th><th>Trận</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Điểm</th></tr></thead><tbody>{state.league.map((t, index) => <tr key={t.id} className={t.name === state.club?.name ? 'selected-row' : ''}><td>{index + 1}</td><td><strong>{t.name}</strong></td><td>{t.played}</td><td>{t.won}</td><td>{t.drawn}</td><td>{t.lost}</td><td>{t.goalsFor - t.goalsAgainst}</td><td><strong>{t.points}</strong></td></tr>)}</tbody></table></div></div>;
}

function SeasonSummaryCard({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const completed = state.fixtures.length > 0 && state.fixtures.every(f => f.played);
  const summary = state.lastSeasonSummary;
  const userRank = state.league.findIndex(team => team.name === state.club?.name) + 1;
  const champion = state.league[0]?.name;
  if (!completed && !summary) return null;
  return <div className="card season-card"><div className="section-title"><h2>Tổng kết mùa giải</h2><Trophy /></div>{completed ? <><div className="season-hero"><strong>{champion}</strong><span>Nhà vô địch mùa {state.season}</span></div><div className="detail-summary"><div><span>Thứ hạng</span><strong>#{userRank}</strong></div><div><span>Trận đã đá</span><strong>{state.fixtures.length}</strong></div><div><span>Điểm</span><strong>{state.league.find(t => t.name === state.club?.name)?.points ?? 0}</strong></div><div><span>Fan</span><strong>{currency.format(state.club?.fans ?? 0)}</strong></div></div><button className="primary" onClick={() => setState(startNextSeason(state))}><ChevronsRight size={18} /> Sang mùa giải mới</button></> : summary && <><div className="season-hero"><strong>Mùa {summary.season} đã khép lại</strong><span>Vô địch: {summary.champion}</span></div><div className="detail-summary"><div><span>Thứ hạng</span><strong>#{summary.userRank}</strong></div><div><span>Tiền thưởng</span><strong>{money(summary.prize)}</strong></div><div><span>Danh tiếng</span><strong>+{summary.reputationGain}</strong></div><div><span>Fan</span><strong>+{currency.format(summary.fanGain)}</strong></div></div></>}</div>;
}

function MatchPanel({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const todayMatch = getTodayMatch(state);
  const completed = state.fixtures.length > 0 && state.fixtures.every(f => f.played);
  return <div className="card match-card"><div className="section-title"><h2>Trận đấu</h2><span>Ngày {state.day}</span></div>{completed ? <div className="champion"><Trophy /><h3>Mùa giải kết thúc</h3></div> : todayMatch ? <><div className="versus"><strong>{todayMatch.home}</strong><span>vs</span><strong>{todayMatch.away}</strong></div><button className="primary" disabled={(state.club?.lineup.length ?? 0) !== 11 || state.actionsRemaining <= 0} onClick={() => setState(simulateNextRound(state))}><Play size={18} /> Đá trận hôm nay</button>{(state.club?.lineup.length ?? 0) !== 11 && <p className="warning">Cần chọn đúng 11 cầu thủ trước khi đá trận.</p>}</> : <p>Hôm nay không có trận đấu.</p>}{state.lastMatch && <div className="timeline"><h3>Trận gần nhất: {state.lastMatch.home} {state.lastMatch.homeScore}-{state.lastMatch.awayScore} {state.lastMatch.away}</h3>{state.lastMatch.events.map((event, index) => <div key={index} className={`event event-${event.type}`}><span>{event.minute}'</span><p>{event.text}</p></div>)}</div>}</div>;
}

function Tactics({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  return <div className="card"><div className="section-title"><h2>Chiến thuật</h2><span>{state.club ? tacticLabels[state.club.tactic] : ''}</span></div><div className="tactic-grid">{(Object.keys(tacticLabels) as Tactic[]).map(t => <button key={t} disabled={state.actionsRemaining <= 0} className={state.club?.tactic === t ? 'active' : ''} onClick={() => setState(setTactic(state, t))}>{tacticLabels[t]}</button>)}</div></div>;
}

function Fixtures({ state }: { state: GameState }) {
  return <div className="card"><div className="section-title"><h2>Lịch thi đấu</h2><span>{state.fixtures.filter(f => f.played).length}/{state.fixtures.length}</span></div><div className="fixture-list">{state.fixtures.map(f => <div key={f.id} className={f.played ? 'fixture played' : f.day === state.day ? 'fixture today-fixture' : 'fixture'}><span>Ngày {f.day} • Vòng {f.round}</span><strong>{f.home} {f.played ? `${f.homeScore}-${f.awayScore}` : 'vs'} {f.away}</strong></div>)}</div></div>;
}

function Dashboard({ state: rawState, setState, onReset }: { state: GameState; setState: (s: GameState) => void; onReset: () => void }) {
  const state = ensureState(rawState);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | AcademyProspect | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<'squad' | 'market' | 'academy'>('squad');
  const avgOverall = useMemo(() => Math.round(state.players.slice(0, 11).reduce((s, p) => s + p.overall, 0) / 11), [state.players]);
  const club = state.club!;
  const viewPlayer = (player: Player | AcademyProspect, origin: 'squad' | 'market' | 'academy') => { setSelectedPlayer(player); setSelectedOrigin(origin); };
  const closeModal = () => setSelectedPlayer(null);
  const selectedCost = selectedOrigin === 'academy' ? (selectedPlayer as AcademyProspect | null)?.signingFee ?? 0 : selectedPlayer?.value ?? 0;
  const selectedCanBuy = club.budget >= selectedCost;
  return <main className="app-shell"><header className="topbar"><div><span className="badge">Mùa {state.season} • Ngày {state.day}</span><h1>{club.name}</h1><p>{club.stadium}</p></div><button className="ghost" onClick={onReset}><RotateCcw size={16} /> Chơi lại</button></header><section className="stats-grid"><StatCard title="Ngân sách" value={money(club.budget)} icon={<WalletCards />} /><StatCard title="Người hâm mộ" value={currency.format(club.fans)} icon={<Users />} /><StatCard title="Lượt hôm nay" value={`${state.actionsRemaining}/${state.maxActionsPerDay}`} icon={<CalendarDays />} /><StatCard title="Sức mạnh đội hình" value={`${avgOverall}/99`} icon={<Trophy />} /></section><section className="main-grid"><div className="left-col"><SeasonSummaryCard state={state} setState={setState} /><CalendarPanel state={state} setState={setState} /><MatchPanel state={state} setState={setState} /><FormationPitch state={state} onView={viewPlayer} /><AcademyPanel state={state} setState={setState} onView={viewPlayer} /><TransferMarket state={state} setState={setState} onView={viewPlayer} /><PlayersTable state={state} setState={setState} onView={viewPlayer} /></div><div className="right-col"><NewsPanel state={state} /><Tactics state={state} setState={setState} /><div className="card"><div className="section-title"><h2>Huấn luyện</h2><Dumbbell /></div><p>Mất 1 lượt hành động. Hồi phục thể lực, tăng tinh thần và có cơ hội tăng chỉ số cho cầu thủ trẻ.</p><button disabled={state.actionsRemaining <= 0} onClick={() => setState(trainTeam(state))}>Huấn luyện -50.000</button></div><LeagueTable state={state} /><Fixtures state={state} /></div></section><PlayerDetailModal player={selectedPlayer} origin={selectedOrigin} canBuy={selectedCanBuy} onClose={closeModal} onBuy={() => { if (selectedPlayer) setState(buyPlayer(state, selectedPlayer.id)); closeModal(); }} onSign={() => { if (selectedPlayer) setState(signAcademyProspect(state, selectedPlayer.id)); closeModal(); }} onSell={() => { if (selectedPlayer) setState(sellPlayer(state, selectedPlayer.id)); closeModal(); }} /></main>;
}

function App() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  useEffect(() => { if (state) saveGame(state); }, [state]);
  if (!state || !state.club) return <NewGame onCreate={setState} />;
  return <Dashboard state={state} setState={setState} onReset={() => { clearGame(); setState(null); }} />;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
