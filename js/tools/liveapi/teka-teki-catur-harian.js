import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"teka-teki-catur-harian","name":"Teka-Teki Catur Harian","cat":"liveapi","icon":"♞","desc":"Teka-teki catur baru tiap hari dari Lichess, lengkap dengan papan dan jawabannya.","keywords":"catur,puzzle,teka-teki,lichess,skak,cekmat","since":"6.16.0", "online": true};

const API = 'https://lichess.org/api/puzzle/daily';

const GLIF = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const TEMA = {
  endgame: 'Akhir permainan', middlegame: 'Tengah permainan', opening: 'Pembukaan',
  crushing: 'Serangan mematikan', mateIn1: 'Skakmat 1 langkah', mateIn2: 'Skakmat 2 langkah',
  mateIn3: 'Skakmat 3 langkah', mateIn4: 'Skakmat 4 langkah', mateIn5: 'Skakmat 5 langkah',
  advancedPawn: 'Pion jauh', advantage: 'Unggul posisi', attraction: 'Pancingan',
  backRankMate: 'Skakmat baris belakang', bishopEndgame: 'Akhir gajah', clearance: 'Buka jalan',
  defensiveMove: 'Langkah bertahan', discoveredAttack: 'Serangan terbuka', doubleCheck: 'Skak ganda',
  fork: 'Garpu', hangingPiece: 'Buah menggantung', interference: 'Halangan', intermezzo: 'Langkah sela',
  knightEndgame: 'Akhir kuda', long: 'Langkah panjang', master: 'Level master', masterVsMaster: 'Master lawan master',
  pawnEndgame: 'Akhir pion', pin: 'Jepitan', promotion: 'Promosi pion', queenEndgame: 'Akhir menteri',
  queenRookEndgame: 'Akhir menteri benteng', quietMove: 'Langkah tenang', rookEndgame: 'Akhir benteng',
  sacrifice: 'Korban buah', short: 'Langkah pendek', skewer: 'Tusukan', smotheredMate: 'Skakmat terkunci',
  superGM: 'Level grandmaster', trappedPiece: 'Buah terjebak', veryLong: 'Langkah sangat panjang',
  xRayAttack: 'Serangan tembus', zugzwang: 'Zugzwang',
};

function petakDariUci(uci) {
  if (!uci || uci.length < 4) return [];
  return [uci.slice(0, 2), uci.slice(2, 4)];
}

function langkahJadiTeks(uci) {
  if (!uci || uci.length < 4) return uci || '';
  let t = uci.slice(0, 2) + ' ke ' + uci.slice(2, 4);
  if (uci.length >= 5) {
    const prom = { q: 'menteri', r: 'benteng', b: 'gajah', n: 'kuda' }[uci[4].toLowerCase()];
    if (prom) t += ', jadi ' + prom;
  }
  return t;
}

function papanHtml(fen, sorot) {
  const bagian = String(fen || '').split(' ');
  const baris = (bagian[0] || '').split('/');
  const giliranHitam = bagian[1] === 'b';
  const grid = [];
  baris.forEach((r) => {
    const row = [];
    for (const ch of r) {
      if (/[1-8]/.test(ch)) { for (let i = 0; i < +ch; i++) row.push(''); }
      else row.push(ch);
    }
    grid.push(row);
  });
  while (grid.length < 8) grid.push(new Array(8).fill(''));
  const sorotSet = new Set(sorot || []);
  const namaFile = 'abcdefgh';
  let html = '<div style="display:inline-block;border:2px solid #2e2823;border-radius:8px;overflow:hidden;line-height:0">';
  for (let r = 0; r < 8; r++) {
    const ri = giliranHitam ? 7 - r : r;
    html += '<div style="display:flex">';
    for (let c = 0; c < 8; c++) {
      const ci = giliranHitam ? 7 - c : c;
      const nama = namaFile[ci] + (8 - ri);
      const terang = (ri + ci) % 2 === 0;
      const bg = sorotSet.has(nama) ? '#ff6f61' : terang ? '#e8e0d5' : '#7a6a58';
      const buah = (grid[ri] && grid[ri][ci]) || '';
      const warnaBuah = buah && buah === buah.toUpperCase() ? '#fff' : '#161311';
      const bayang = buah && buah === buah.toUpperCase() ? 'text-shadow:0 0 3px #000, 0 1px 2px #000' : 'text-shadow:0 0 2px rgba(255,255,255,.35)';
      html += '<div style="width:38px;height:38px;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;color:' + warnaBuah + ';' + bayang + '" title="' + esc(nama) + '">' + (GLIF[buah] || '') + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil teka-teki hari ini dari Lichess…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const p = j && j.puzzle;
      const g = j && j.game;
      if (!p || !p.fen || !Array.isArray(p.solution) || !p.solution.length) throw new Error('bad-data');
      const giliran = String(p.fen).split(' ')[1] === 'b' ? 'Hitam' : 'Putih';
      const tema = (p.themes || []).map((t) => TEMA[t] || t).filter(Boolean);
      const solusi = p.solution.map(langkahJadiTeks);
      let html = '<p class="center dim">Giliran <b style="color:#e8e0d5">' + esc(giliran) + '</b> jalan. Cari langkah terbaik, lalu cek jawabanmu.</p>' +
        '<div class="center" style="margin:10px 0">' + papanHtml(p.fen, petakDariUci(p.lastMove)) + '</div>' +
        '<p class="hint center">Petak warna coral itu langkah terakhir lawan.</p>';
      if (g && g.players) {
        const putih = g.players.find((x) => x.color === 'white');
        const hitam = g.players.find((x) => x.color === 'black');
        if (putih || hitam) {
          html += '<p class="dim center" style="font-size:12.5px">Dari partai ' + esc(putih ? putih.name + ' (' + putih.rating + ')' : '?') + ' lawan ' + esc(hitam ? hitam.name + ' (' + hitam.rating + ')' : '?') + '</p>';
        }
      }
      html += '<div class="kv"><span class="k">Tingkat kesulitan</span><span class="v">' + esc(String(p.rating || '-')) + '</span></div>';
      if (tema.length) html += '<div class="kv"><span class="k">Jenis teka-teki</span><span class="v">' + esc(tema.join(', ')) + '</span></div>';
      html += '<div class="kv"><span class="k">Posisi (FEN)</span><span class="v" style="font-family:monospace;font-size:11.5px;word-break:break-all">' + esc(p.fen) + '</span></div>';
      html += '<div id="jwb-catur" style="margin-top:10px"></div>';
      html += '<p class="hint">Sumber: Lichess, lichess.org · <a href="https://lichess.org/training/daily" target="_blank" rel="noopener">Mainkan di Lichess</a></p>';
      T.show(box, html);
      const wadahJawaban = box.querySelector('#jwb-catur');
      const tombol = T.btn('👀 Lihat jawaban', () => {
        const daftar = solusi.map((s, i) => '<div>' + (i + 1) + '. ' + esc(s) + '</div>').join('');
        wadahJawaban.innerHTML = '<div style="border:1px solid #2e2823;border-radius:10px;padding:12px"><div style="font-weight:700;margin-bottom:6px">Jawaban</div>' + daftar + '</div>';
      });
      wadahJawaban.appendChild(tombol);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Lichess tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal ambil teka-teki. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  root.appendChild(box);
  muat();
}
