import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "countdown", "name": "Countdown Acara", "cat": "indonesia", "icon": "🎉", "desc": "Hitung mundur ke hari penting.", "keywords": "countdown,hitung,mundur,acara"};
export function render(root) {

    const LEBARAN = new Date(2027, 2, 10, 0, 0, 0); // 10 Mar 2027, perkiraan
    const nextJan1 = () => { const n = new Date(); let y = n.getFullYear(); if (n.getMonth() === 0 && n.getDate() === 1) return new Date(y, 0, 1); return new Date(y + 1, 0, 1); };
    const nextXmas = () => { const n = new Date(); let d = new Date(n.getFullYear(), 11, 25); if (d <= n) d = new Date(n.getFullYear() + 1, 11, 25); return d; };
    const preset = T.select([
      ['lebaran', 'Lebaran / Idulfitri (perkiraan)'],
      ['tahunbaru', 'Tahun Baru'],
      ['natal', 'Natal'],
      ['custom', 'Tanggal sendiri…'],
    ], 'lebaran');
    const namaWrap = T.el('<div></div>');
    const nama = T.input('text', 'Nama acara, cth: Nikahan Budi');
    const tgl = T.input('date');
    const box = T.out();
    let timer = null;
    const targetOf = () => {
      const p = preset.value;
      if (p === 'lebaran') return { d: LEBARAN, label: 'Lebaran / Idulfitri 1448 H', note: 'Tanggal perkiraan. Penetapan resmi bisa bergeser mengikuti sidang isbat.' };
      if (p === 'tahunbaru') return { d: nextJan1(), label: 'Tahun Baru', note: '' };
      if (p === 'natal') return { d: nextXmas(), label: 'Hari Natal', note: '' };
      if (!tgl.value) return null;
      const [y, m, dd] = tgl.value.split('-').map(Number);
      return { d: new Date(y, m - 1, dd), label: nama.value.trim() || 'Acara', note: '' };
    };
    const tick = () => {
      const t = targetOf();
      if (!t) { T.show(box, '<p class="warn">Pilih tanggal dulu ya.</p>'); return; }
      const diff = t.d - new Date();
      if (diff <= 0) { T.show(box, '<div class="big center">Sudah tiba waktunya</div><p class="center mut">' + T.esc(t.label) + '</p>'); return; }
      const s = Math.floor(diff / 1000);
      const dd = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
      const pad = (x) => String(x).padStart(2, '0');
      T.show(box,
        '<p class="center mut">' + T.esc(t.label) + '</p>' +
        '<div class="big center" style="font-variant-numeric:tabular-nums">' + dd + ' hari<br>' + pad(hh) + ':' + pad(mm) + ':' + pad(ss) + '</div>' +
        '<p class="center hint">' + t.d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</p>' +
        (t.note ? '<p class="hint">' + T.esc(t.note) + '</p>' : ''));
    };
    const start = () => { if (timer) clearInterval(timer); tick(); timer = setInterval(tick, 1000); };
    T.onLeave(() => { if (timer) clearInterval(timer); });
    const syncCustom = () => {
      const custom = preset.value === 'custom';
      namaWrap.innerHTML = '';
      if (custom) { namaWrap.appendChild(T.field('Nama acara', nama)); namaWrap.appendChild(T.field('Tanggal', tgl)); }
      start();
    };
    preset.addEventListener('change', syncCustom);
    nama.addEventListener('input', start);
    tgl.addEventListener('change', start);
    root.appendChild(T.field('Acara', preset));
    root.appendChild(namaWrap);
    root.appendChild(box);
    syncCustom();
  
}
