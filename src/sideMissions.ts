import type { GameState, SideMission } from './types';

export const sideMissions: SideMission[] = [
  {
    id: 'fan-photo-day',
    title: 'Chụp ảnh với fan',
    description: 'Tổ chức buổi giao lưu nhỏ để cầu thủ chụp ảnh với người hâm mộ địa phương.',
    minFans: 0,
    minReputation: 0,
    baseReward: 75_000,
    fanReward: 2,
    reputationReward: 1_500,
    fanGain: 80,
    reputationGain: 0,
    cooldownDays: 3,
  },
  {
    id: 'shirt-sale',
    title: 'Bán áo đấu',
    description: 'Mở gian hàng bán áo đấu và vật phẩm lưu niệm cho fan.',
    minFans: 2_000,
    minReputation: 8,
    baseReward: 120_000,
    fanReward: 4,
    reputationReward: 2_500,
    fanGain: 40,
    reputationGain: 1,
    cooldownDays: 4,
  },
  {
    id: 'local-sponsor-meetup',
    title: 'Gặp nhà tài trợ địa phương',
    description: 'Ban lãnh đạo gặp doanh nghiệp địa phương để xin hỗ trợ tài chính ngắn hạn.',
    minFans: 5_000,
    minReputation: 18,
    baseReward: 260_000,
    fanReward: 3,
    reputationReward: 5_500,
    fanGain: 25,
    reputationGain: 1,
    cooldownDays: 6,
  },
  {
    id: 'community-cup-event',
    title: 'Sự kiện bóng đá cộng đồng',
    description: 'Tổ chức sự kiện cộng đồng, tăng fan và nhận phí tài trợ truyền thông.',
    minFans: 10_000,
    minReputation: 28,
    baseReward: 420_000,
    fanReward: 5,
    reputationReward: 8_000,
    fanGain: 180,
    reputationGain: 2,
    cooldownDays: 8,
  },
  {
    id: 'premium-brand-campaign',
    title: 'Chiến dịch thương hiệu cao cấp',
    description: 'Ký chiến dịch quảng bá lớn với nhãn hàng, yêu cầu CLB có danh tiếng tốt.',
    minFans: 20_000,
    minReputation: 45,
    baseReward: 900_000,
    fanReward: 8,
    reputationReward: 14_000,
    fanGain: 250,
    reputationGain: 3,
    cooldownDays: 12,
  },
];

export function getMissionReward(state: GameState, mission: SideMission): number {
  const fans = state.club?.fans ?? 0;
  const reputation = state.club?.reputation ?? 0;
  return Math.round(mission.baseReward + fans * mission.fanReward + reputation * mission.reputationReward);
}

export function getMissionAvailableDay(state: GameState, missionId: string): number {
  return state.sideMissionCooldowns?.[missionId] ?? 0;
}

export function isMissionUnlocked(state: GameState, mission: SideMission): boolean {
  const club = state.club;
  if (!club) return false;
  return club.fans >= mission.minFans && club.reputation >= mission.minReputation;
}

export function isMissionReady(state: GameState, mission: SideMission): boolean {
  return isMissionUnlocked(state, mission) && state.day >= getMissionAvailableDay(state, mission.id);
}
