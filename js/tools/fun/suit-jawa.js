import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "suit-jawa", "name": "Suit Jawa", "cat": "fun", "icon": "✊", "desc": "Gunting-batu-kertas lawan komputer. Suit...!", "keywords": "suit,gunting,batu,kertas,game,jawa"};

const LS_KEY = 'suit-jawa-skor';
const PILIHAN = [
  { id: 'gunting', icon: '✌️', name: 'Gunting' },
  { id: 'batu', icon: '✊', name: 'Batu' },
  { id: 'kertas', icon: '🖐️', name: 'Kertas' },
];
const MENANG = { gunting: 'kertas', kertas: 'batu', batu: 'gunting' };

const PESAN_MENANG = [
  'Menang! Suit-mu sakti hari ini.',
  'Gila, jitu banget tebakanmu!',
  'Komputernya sampai bengong. Menang!',
  'Suit level dewa. Lanjutin!',
];
const PESAN_KALAH = [
  'Kalah... komputernya lagi hoki.',
  'Yah, kebaca gerak-gerikmu. Coba lagi!',
  'Komputer menang ronde ini. Balas dendam?',
  'Kurang beruntung. Suit lagi gih.',
];
const PESAN_SERI = [
  'Seri! Great minds suit alike.',
  'Sama-sama mikirnya. Seri!',
  'Kompak banget, seri lagi.',
];

function loadSkor() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return { m: s.m | 0, k: s.k | 0, s: s.s | 0 };
  } catch (e) { return { m: 0, k: 0, s: 0 }; }
}
function saveSkor(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ }
}
const acak = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function render(root) {
  let skor = loadSkor();
  let jalan = false;

  const arena = T.out();
  const papan = T.el('<p class="center hint" style="margin-top:10px"></p>');
  const gambarPapan = () => {
    papan.innerHTML = 'Papan skor — Menang <b style="color:var(--ok)">' + skor.m + '</b> · ' +
      'Kalah <b style="color:var(--err)">' + skor.k + '</b> · Seri <b>' + skor.s + '</b>';
  };
  gambarPapan();

  const tombolRow = T.el('<div style="display:flex;gap:10px;justify-content:center;margin:12px 0"></div>');
  const tombol = PILIHAN.map((p) => {
    const b = T.el('<button type="button" class="btn" style="font-size:30px;padding:12px 18px" title="' + p.name + '">' + p.icon + '</button>');
    b.addEventListener('click', () => main(p.id));
    tombolRow.appendChild(b);
    return b;
  });

  let timer = null;
  T.onLeave(() => { if (timer) clearInterval(timer); });

  const setTombol = (on) => tombol.forEach((b) => { b.disabled = !on; });

  const main = (pilihanku) => {
    if (jalan) return;
    jalan = true; setTombol(false);
    const pilihanKomputer = acak(PILIHAN).id;
    const urutan = ['✊', '✌️', '🖐️'];
    let i = 0;
    T.show(arena, '<div class="center" style="padding:10px 0"><div id="suit-anim" style="font-size:52px">✊</div>' +
      '<p class="hint">Suit...!</p></div>');
    const animEl = arena.querySelector('#suit-anim');
    timer = setInterval(() => {
      i++;
      if (animEl) animEl.textContent = urutan[i % urutan.length];
      T.beep(300 + i * 80, 0.08, 'square');
      if (i >= 6) {
        clearInterval(timer); timer = null;
        buka(pilihanku, pilihanKomputer);
      }
    }, 220);
  };

  const buka = (aku, komputer) => {
    const ikon = (id) => PILIHAN.find((p) => p.id === id).icon;
    const nama = (id) => PILIHAN.find((p) => p.id === id).name;
    let hasil, pesan, warna;
    if (aku === komputer) { hasil = 'seri'; skor.s++; pesan = acak(PESAN_SERI); warna = 'var(--warn)'; T.beep(440, 0.15); }
    else if (MENANG[aku] === komputer) { hasil = 'menang'; skor.m++; pesan = acak(PESAN_MENANG); warna = 'var(--ok)'; T.beep(523, 0.12); T.beep(784, 0.18, 'sine', 0.12); }
    else { hasil = 'kalah'; skor.k++; pesan = acak(PESAN_KALAH); warna = 'var(--err)'; T.beep(200, 0.2, 'sawtooth'); }
    saveSkor(skor); gambarPapan();
    const label = hasil === 'menang' ? 'KAMU MENANG' : hasil === 'kalah' ? 'KAMU KALAH' : 'SERI';
    T.show(arena,
      '<div class="center" style="padding:6px 0">' +
      '<div style="display:flex;gap:24px;justify-content:center;align-items:center">' +
      '<div><div style="font-size:46px">' + ikon(aku) + '</div><div class="hint">Kamu: ' + nama(aku) + '</div></div>' +
      '<div style="font-size:20px;color:var(--dim)">vs</div>' +
      '<div><div style="font-size:46px">' + ikon(komputer) + '</div><div class="hint">Komputer: ' + nama(komputer) + '</div></div>' +
      '</div>' +
      '<p style="font-size:16px;font-weight:800;margin:10px 0 4px;color:' + warna + '">' + label + '</p>' +
      '<p class="hint">' + T.esc(pesan) + '</p></div>');
    jalan = false; setTombol(true);
  };

  const reset = T.btn('Reset Skor', () => {
    skor = { m: 0, k: 0, s: 0 }; saveSkor(skor); gambarPapan();
    T.toast('Papan skor direset. Mulai dari nol lagi!');
  });

  root.appendChild(T.el('<p class="center hint">Pilih jagoanmu, lawan komputer.<br>Gunting ✌️ motong kertas 🖐️, kertas bungkus batu ✊, batu menghancurkan gunting.</p>'));
  root.appendChild(tombolRow);
  root.appendChild(arena);
  root.appendChild(papan);
  root.appendChild(T.row(reset));
}
