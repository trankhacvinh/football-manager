import { getMissionReward, sideMissions } from './sideMissions';
import type { ClubNews, GameLog, GameState, SideMission, TransferMessage } from './types';

const id = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const msg = (type: TransferMessage['type'], text: string): TransferMessage => ({ type, text });

function makeLog(state: GameState, mission: SideMission, reward: number): GameLog {
  return {
    id: id(),
    day: state.day,
    season: state.season,
    actor: state.club?.name ?? 'CLB',
    type: 'finance',
    message: `Hoàn thành nhiệm vụ "${mission.title}", nhận ${reward.toLocaleString('vi-VN')} VND.`,
    meta: {
      action: 'side_mission',
      missionId: mission.id,
      mission: mission.title,
      reward,
      fanGain: mission.fanGain,
      reputationGain: mission.reputationGain,
    },
  };
}

function makeNews(state: GameState, mission: SideMission, reward: number): ClubNews {
  return {
    id: id(),
    day: state.day,
    season: state.season,
    type: 'good',
    title: `Hoàn thành: ${mission.title}`,
    text: `CLB nhận ${reward.toLocaleString('vi-VN')} VND, tăng ${mission.fanGain.toLocaleString('vi-VN')} fan và +${mission.reputationGain} danh tiếng.`,
  };
}

export function completeSideMission(state: GameState, missionId: string): GameState {
  const club = state.club;
  if (!club || state.gameOver) return state;

  const mission = sideMissions.find(item => item.id === missionId);
  if (!mission) return { ...state, transferMessage: msg('error', 'Không tìm thấy nhiệm vụ này.') };

  if (state.actionsRemaining <= 0) return { ...state, transferMessage: msg('error', 'Hôm nay đã hết lượt hành động.') };
  if (club.fans < mission.minFans || club.reputation < mission.minReputation) {
    return { ...state, transferMessage: msg('error', 'CLB chưa đủ fan hoặc danh tiếng để mở khóa nhiệm vụ này.') };
  }

  const availableDay = state.sideMissionCooldowns?.[mission.id] ?? 0;
  if (state.day < availableDay) {
    return { ...state, transferMessage: msg('error', `Nhiệm vụ này cần chờ đến ngày ${availableDay}.`) };
  }

  const reward = getMissionReward(state, mission);
  const nextClub = {
    ...club,
    budget: club.budget + reward,
    fans: club.fans + mission.fanGain,
    reputation: Math.min(100, club.reputation + mission.reputationGain),
  };
  const next: GameState = {
    ...state,
    club: nextClub,
    actionsRemaining: state.actionsRemaining - 1,
    sideMissionCooldowns: {
      ...(state.sideMissionCooldowns ?? {}),
      [mission.id]: state.day + mission.cooldownDays,
    },
    logs: [makeLog(state, mission, reward), ...(state.logs ?? [])].slice(0, 250),
    news: [makeNews(state, mission, reward), ...(state.news ?? [])].slice(0, 30),
    transferMessage: msg('success', `Đã hoàn thành "${mission.title}" và nhận ${reward.toLocaleString('vi-VN')} VND.`),
  };
  return next;
}
