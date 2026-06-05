import './vip.css';

type VipUiPlayer = {
  name: string;
  avatarUrl: string;
};

const vipUiPlayers: VipUiPlayer[] = [
  { name: 'Lionel Messi', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Lionel%20Messi' },
  { name: 'Cristiano Ronaldo', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Cristiano%20Ronaldo' },
  { name: 'Kylian Mbappé', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kylian%20Mbappe' },
  { name: 'Kylian Mbappe', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kylian%20Mbappe' },
  { name: 'Erling Haaland', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Erling%20Haaland' },
  { name: 'Kevin De Bruyne', avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Kevin%20De%20Bruyne' },
];

function findVip(text: string): VipUiPlayer | null {
  return vipUiPlayers.find(player => text.includes(player.name)) ?? null;
