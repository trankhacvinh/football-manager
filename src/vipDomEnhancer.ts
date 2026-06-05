import './vip.css';
const vips=['Lionel Messi','Cristiano Ronaldo','Kylian Mbappé','Kylian Mbappe','Erling Haaland','Kevin De Bruyne'];
const avatar=(n:string)=>`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(n.replace('é','e'))}`;
function hit(t:string){return vips.find(n=>t.includes(n));}
function badge(e:Element){if(e.querySelector('.vip-badge'))return;const b=document.createElement('span');b.className='vip-badge';b.textContent='VIP';e.appendChild(b)}