import { h as T } from '../../core.js?v=6.6.0';

export const meta = {"id": "cocoklogi-nama", "name": "Cocoklogi Nama", "cat": "fun", "icon": "💘", "desc": "Cek kecocokan dua nama, hasilnya konsisten.", "keywords": "cocoklogi,nama,jodoh,kecocokan,cinta,pasangan,fun"};

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h + s.charCodeAt(i)) >>> 0);
  return h;
}
function cocok(a, b) {
  const pair = [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join('|');
  return (hashStr(pair) % 100) + 1;
}
function labelFor(p) {
  if (p < 30) return ['Mending temenan aja', 'Nggak apa-apa, teman baik juga rezeki.'];
  if (p < 60) return ['Lumayan cocok', 'Ada potensi nih, tinggal usaha dikit lagi.'];
  if (p < 85) return ['Cocok banget', 'Chemistry-nya kerasa, lanjutkan!'];
  return ['Jodoh nih kayaknya', 'Fix, kapan undangannya? 😆'];
}

export function render(root) {
  const n1 = T.input('text', 'Nama pertama');
  const n2 = T.input('text', 'Nama kedua');
  const box = T.out();
  const cek = () => {
    const a = n1.value.trim(), b = n2.value.trim();
    if (!a || !b) { T.show(box, '<p class="center mut">Isi dua-duanya dulu dong.</p>'); return; }
    if (a.toLowerCase() === b.toLowerCase()) {
      T.show(box, '<p class="center mut">Namanya sama? Ya 100% cocok lah sama diri sendiri. 😄</p>');
      return;
    }
    const p = cocok(a, b);
    const [label, sub] = labelFor(p);
    T.show(box,
      '<div class="big center">' + p + '<span class="mut" style="font-size:15px">%</span></div>' +
      '<p class="center" style="font-size:16px;margin:8px 0 4px"><b>' + T.esc(label) + '</b></p>' +
      '<p class="center mut">' + T.esc(sub) + '</p>' +
      '<p class="center" style="margin-top:10px">' + T.esc(a) + ' 💘 ' + T.esc(b) + '</p>');
  };
  [n1, n2].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); }));
  root.appendChild(T.grid2(T.field('Nama pertama', n1), T.field('Nama kedua', n2)));
  root.appendChild(T.row(T.btn('Cek kecocokan', cek, true)));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint center">Cuma hiburan ya, jangan baper. Pasangan nama yang sama selalu dapat hasil yang sama, mau dicek kapan pun.</p>'));
}
