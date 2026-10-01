import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "rate-card-endorse", "name": "Rate Card Endorse", "cat": "bisnis", "icon": "📣", "desc": "Estimasi tarif endorse dari jumlah followers & engagement rate.", "keywords": "endorse,rate card,influencer,tarif,instagram,followers,engagement,iklan,promosi"};
export function render(root) {
  const KEY = 'rate-card-endorse-formula';
  let f = { base: 25, erLow: 0.5, erMid: 1, erHigh: 1.5, storyPct: 40, reelsPct: 150 };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') f = { ...f, ...s };
  } catch (e) { /* abaikan */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) { /* abaikan */ } };

  const folI = T.input('text', 'cth: 50000'); folI.inputMode = 'numeric';
  const erI = T.input('text', 'cth: 2.5'); erI.inputMode = 'decimal';
  const baseI = T.input('text', 'cth: 25', String(f.base)); baseI.inputMode = 'decimal';
  const lowI = T.input('text', 'cth: 0.5', String(f.erLow)); lowI.inputMode = 'decimal';
  const midI = T.input('text', 'cth: 1', String(f.erMid)); midI.inputMode = 'decimal';
  const highI = T.input('text', 'cth: 1.5', String(f.erHigh)); highI.inputMode = 'decimal';
  const storyI = T.input('text', 'cth: 40', String(f.storyPct)); storyI.inputMode = 'decimal';
  const reelsI = T.input('text', 'cth: 150', String(f.reelsPct)); reelsI.inputMode = 'decimal';
  const box = T.out();

  let last = null;

  const hitung = () => {
    const fol = Math.floor(T.num(folI.value) || 0);
    const er = T.num(erI.value);
    if (!(fol > 0)) { T.hide(box); last = null; return; }
    if (!(er >= 0 && er <= 100)) { T.show(box, '<p class="warn">Engagement rate harus 0–100%.</p>'); last = null; return; }
    const base = T.num(baseI.value), fl = T.num(lowI.value), fm = T.num(midI.value), fh = T.num(highI.value);
    const sp = T.num(storyI.value), rp2 = T.num(reelsI.value);
    if (![base, fl, fm, fh, sp, rp2].every((v) => v >= 0)) {
      T.show(box, '<p class="warn">Semua angka formula harus ≥ 0.</p>'); last = null; return;
    }
    f = { base, erLow: fl, erMid: fm, erHigh: fh, storyPct: sp, reelsPct: rp2 };
    save();
    const faktor = er < 1 ? fl : er <= 3 ? fm : fh;
    const feed = base * fol * faktor;
    const story = feed * sp / 100;
    const reels = feed * rp2 / 100;
    last = { fol, er, faktor, feed, story, reels };
    T.show(box,
      '<div class="kv"><span class="k">Followers</span><span class="v">' + T.fmt(fol) + '</span></div>' +
      '<div class="kv"><span class="k">Engagement rate</span><span class="v">' + T.esc(String(er)) + '% (faktor ×' + T.esc(String(faktor)) + ')</span></div>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13.5px">' +
      '<tr style="border-bottom:1px solid var(--line)"><th style="text-align:left;padding:8px">Paket</th><th style="text-align:right;padding:8px">Tarif</th></tr>' +
      '<tr style="border-bottom:1px solid var(--line)"><td style="padding:8px">Story (' + T.esc(String(sp)) + '% feed)</td><td style="text-align:right;padding:8px;font-weight:650">' + T.rp(story) + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--line)"><td style="padding:8px">Feed postingan</td><td style="text-align:right;padding:8px;font-weight:700">' + T.rp(feed) + '</td></tr>' +
      '<tr><td style="padding:8px">Reels (' + T.esc(String(rp2)) + '% feed)</td><td style="text-align:right;padding:8px;font-weight:650">' + T.rp(reels) + '</td></tr>' +
      '</table>' +
      '<div style="margin-top:12px" id="rc-copy-slot"></div>');
    box.querySelector('#rc-copy-slot').appendChild(T.copyBtn(() =>
      'RATE CARD ENDORSE\n' +
      'Followers: ' + T.fmt(fol) + ' | ER: ' + er + '%\n\n' +
      'Story: ' + T.rp(story) + '\n' +
      'Feed postingan: ' + T.rp(feed) + '\n' +
      'Reels: ' + T.rp(reels) + '\n\n' +
      '*Estimasi kasar, tarif final bisa nego.'
    , 'Salin teks rate card'));
  };
  [folI, erI, baseI, lowI, midI, highI, storyI, reelsI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau pasang tarif endorse tapi bingung mulai dari mana? Masukkan followers & engagement rate, tarif per paket langsung kehitung — formulanya bisa kamu atur sendiri.</p>'));
  root.appendChild(T.grid2(
    T.field('Jumlah followers', folI),
    T.field('Engagement rate (%)', erI, 'Rata-rata like+komen ÷ followers × 100')
  ));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Formula (bisa diedit, tersimpan otomatis)</p>'));
  root.appendChild(T.grid2(
    T.field('Tarif dasar per follower (Rp)', baseI),
    T.field('Faktor ER < 1%', lowI)
  ));
  root.appendChild(T.grid2(
    T.field('Faktor ER 1–3%', midI),
    T.field('Faktor ER > 3%', highI)
  ));
  root.appendChild(T.grid2(
    T.field('Story (% dari feed)', storyI),
    T.field('Reels (% dari feed)', reelsI)
  ));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Tarif = tarif dasar × followers × faktor ER. Ini patokan kasar — akun niche dengan audiens loyal biasanya bisa pasang lebih tinggi dari angka ini.</p>'));
}
