import { h as T } from '../../core.js?v=6.12.2';

const KEY = 'adip-tools-tasbih-digital';
const DZIKIR = [
  ['subhanallah', 'Subhanallah', 'سُبْحَانَ اللهِ', 'Mahasuci Allah'],
  ['alhamdulillah', 'Alhamdulillah', 'الْحَمْدُ لِلَّهِ', 'Segala puji bagi Allah'],
  ['allahu-akbar', 'Allahu Akbar', 'اللَّهُ أَكْبَرُ', 'Allah Mahabesar'],
  ['istighfar', 'Istighfar', 'أَسْتَغْفِرُ اللَّهَ', 'Aku memohon ampun kepada Allah'],
  ['shalawat', 'Shalawat', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', 'Semoga Allah memberi rahmat kepada Nabi Muhammad'],
];

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
};
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

export const meta = {"id": "tasbih-digital", "name": "Tasbih Digital", "cat": "indonesia", "icon": "📿", "desc": "Hitung dzikir dengan ketukan: pilih bacaan, pasang target, dan lihat jumlah hari ini.", "keywords": "tasbih,dzikir,hitung,subhanallah,alhamdulillah,allahu akbar,istighfar,shalawat,wirid", "since": "6.11.0"};
export function render(root) {
  const saved = load();
  let state = {
    dzikir: saved.dzikir || 'subhanallah',
    target: saved.target != null ? saved.target : 33,
    count: saved.count || 0,
    rounds: saved.rounds || 0,
    day: saved.day || todayKey(),
    dayTotal: saved.dayTotal || 0,
  };
  if (state.day !== todayKey()) { state.day = todayKey(); state.dayTotal = 0; save(state); }

  const dzikirSel = T.select(DZIKIR.map((d) => [d[0], d[1] + ' (' + d[3] + ')']), state.dzikir);
  const targetSel = T.select([['33', '33 kali'], ['99', '99 kali'], ['100', '100 kali'], ['500', '500 kali'], ['1000', '1000 kali'], ['0', 'Bebas, tanpa target']], String(state.target));
  const box = T.out();

  const dzikirNow = () => DZIKIR.find((d) => d[0] === state.dzikir) || DZIKIR[0];

  const tampil = () => {
    const d = dzikirNow();
    const target = state.target;
    const sisa = target > 0 ? target - state.count : null;
    const persen = target > 0 ? Math.min(100, Math.round((state.count / target) * 100)) : 0;
    T.show(box,
      '<p class="center" style="font-size:26px;line-height:1.8" dir="rtl" lang="ar">' + T.esc(d[2]) + '</p>' +
      '<p class="center hint" style="margin-top:-6px">' + T.esc(d[1]) + ' · ' + T.esc(d[3]) + '</p>' +
      '<div class="big center" style="font-size:64px;line-height:1.1">' + state.count + '</div>' +
      (target > 0
        ? '<p class="center hint">dari target ' + target + ' kali' + (sisa > 0 ? ' · sisa ' + sisa + ' ketukan' : '') + '</p>' +
          '<div style="height:8px;border-radius:99px;background:#ffffff14;overflow:hidden;margin:8px 0 4px"><div style="height:100%;width:' + persen + '%;background:#fff;border-radius:99px"></div></div>'
        : '<p class="center hint">tanpa target, ketuk sepuasnya</p>') +
      (state.count === 0
        ? '<p class="center hint">Belum ada hitungan. Ketuk tombol besar di bawah untuk mulai.</p>'
        : '') +
      '<p class="center hint" style="margin-top:10px">Putaran selesai: ' + state.rounds + ' · Hari ini: ' + state.dayTotal + ' ketukan</p>');
  };

  const ketuk = () => {
    state.count += 1;
    state.dayTotal += 1;
    if (state.target > 0 && state.count >= state.target) {
      state.rounds += 1;
      state.count = 0;
      if (navigator.vibrate) { try { navigator.vibrate(200); } catch (e) {} }
      T.toast('Satu putaran selesai, alhamdulillah');
    }
    save(state);
    tampil();
  };

  const kurangi = () => {
    if (state.count > 0) { state.count -= 1; state.dayTotal = Math.max(0, state.dayTotal - 1); save(state); tampil(); }
  };
  const ulangi = () => { state.count = 0; save(state); tampil(); };

  dzikirSel.addEventListener('change', () => { state.dzikir = dzikirSel.value; save(state); tampil(); });
  targetSel.addEventListener('change', () => { state.target = parseInt(targetSel.value, 10) || 0; save(state); tampil(); });

  const tapBtn = T.btn('Ketuk untuk menghitung', ketuk, true);
  tapBtn.style.cssText = 'width:100%;min-height:96px;font-size:20px;border-radius:16px;margin-top:4px';

  root.appendChild(T.el('<p class="note">Pengganti tasbih di genggaman. Hitungan tersimpan di HP ini, jadi tetap ada walau aplikasinya ditutup.</p>'));
  root.appendChild(T.grid2(
    T.field('Bacaan dzikir', dzikirSel),
    T.field('Target per putaran', targetSel, 'HP akan bergetar setiap satu putaran selesai')
  ));
  root.appendChild(box);
  root.appendChild(T.row(tapBtn));
  root.appendChild(T.row(
    T.btn('Kurangi 1', kurangi),
    T.btn('Ulangi dari 0', ulangi)
  ));
  tampil();
}
