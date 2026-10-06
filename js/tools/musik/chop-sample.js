import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "chop-sample", "name": "Kalkulator Chop Sample", "cat": "musik", "icon": "✂️", "desc": "Bagi sample jadi chop: durasi per chop + konversi ke beat.", "keywords": "chop,sample,bpm,beat,time-stretch,produser,sampling,loop"};

/* Fungsi murni — bisa diuji tanpa DOM. */
export function durasiPerChop(totalMs, jumlah) {
  if (!(totalMs > 0) || !(jumlah > 0)) return NaN;
  return totalMs / jumlah;
}
export function beatPerChop(chopMs, bpm) {
  if (!(chopMs > 0) || !(bpm > 0)) return NaN;
  return chopMs / (60000 / bpm);
}

export function render(root) {

    const fmtID = (n, des) => (+n).toFixed(des == null ? 2 : des).replace('.', ',');

    const MODE = [['durasi', '⏱️ Durasi → Chop'], ['beat', '🥁 Chop per Beat']];
    let mode = 'durasi';
    const btnDurasi = T.btn(MODE[0][1], null);
    const btnBeat = T.btn(MODE[1][1], null);
    const barTab = T.el('<div style="display:flex;gap:8px;margin-bottom:12px"></div>');
    barTab.appendChild(btnDurasi); barTab.appendChild(btnBeat);
    btnDurasi.style.flex = '1'; btnBeat.style.flex = '1';

    const box = T.out();
    const wadah = T.el('<div></div>');
    const baris = T.row();
    const salin = T.copyBtn(() => baris._teks || '', 'Salin hasil');
    baris.appendChild(salin);

    const tabel = (rows) =>
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      rows.map(([k, v]) =>
        '<tr><td style="padding:7px 8px;color:#a1a1aa;border-bottom:1px solid #27272a;vertical-align:top">' + T.esc(k) + '</td>' +
        '<td style="padding:7px 8px;border-bottom:1px solid #27272a;font-family:monospace;text-align:right;word-break:break-all">' + T.esc(v) + '</td></tr>'
      ).join('') + '</table>';

    const renderMode = () => {
      btnDurasi.classList.toggle('primary', mode === 'durasi');
      btnBeat.classList.toggle('primary', mode === 'beat');
      wadah.innerHTML = '';
      T.hide(box);
      if (mode === 'durasi') renderDurasi();
      else renderBeat();
    };

    /* ---- Mode 1: durasi sample dibagi N chop ---- */
    const renderDurasi = () => {
      const iDur = T.input('number', 'cth: 4', '4');
      const iSat = T.select([['detik', 'Detik'], ['ms', 'Milidetik (ms)']], 'detik');
      const iChop = T.input('number', 'cth: 8', '8');
      const iBpm = T.input('number', 'cth: 120 (opsional)', '120');
      [iDur, iSat, iChop, iBpm].forEach((i) => i.addEventListener('input', hitung));
      iSat.addEventListener('change', hitung);
      wadah.appendChild(T.grid2(
        T.field('Durasi sample', iDur),
        T.field('Satuan', iSat)
      ));
      wadah.appendChild(T.grid2(
        T.field('Jumlah chop', iChop, 'Berapa potong sample dibagi.'),
        T.field('BPM (opsional)', iBpm, 'Diisi untuk konversi ke beat.')
      ));

      function hitung() {
        const dur = T.num(iDur.value), n = Math.floor(T.num(iChop.value)), bpm = T.num(iBpm.value);
        if (!(dur > 0) || !(n > 0)) {
          T.show(box, '<p class="center mut">Isi durasi sample dan jumlah chop dulu dengan angka yang masuk akal.</p>');
          baris._teks = '';
          return;
        }
        const totalMs = iSat.value === 'ms' ? dur : dur * 1000;
        const per = durasiPerChop(totalMs, n);
        const rows = [
          ['Durasi total', fmtID(totalMs, 1) + ' ms (' + fmtID(totalMs / 1000) + ' dtk)'],
          ['Jumlah chop', String(n)],
          ['Durasi per chop', fmtID(per, 2) + ' ms'],
        ];
        let teks = 'Durasi sample ' + fmtID(totalMs, 1) + ' ms dibagi ' + n + ' chop = ' + fmtID(per, 2) + ' ms per chop';
        if (bpm > 0) {
          const ketukMs = 60000 / bpm;
          const bpc = beatPerChop(per, bpm);
          rows.push(
            ['Tempo', fmtID(bpm, 1) + ' BPM'],
            ['1 ketuk', fmtID(ketukMs, 2) + ' ms'],
            ['Beat per chop', '≈ ' + fmtID(bpc, 3) + ' ketuk'],
          );
          teks += ' | ' + fmtID(bpm, 1) + ' BPM → ≈ ' + fmtID(bpc, 3) + ' ketuk per chop';
        }
        T.show(box, tabel(rows) +
          '<p class="center hint">Pakai angka "beat per chop" buat time-stretch: kalau hasilnya 0,5 berarti tiap chop pas setengah ketuk di grid beat.</p>');
        baris._teks = teks;
      }
      hitung();
    };

    /* ---- Mode 2: 1 chop per ketuk dari BPM + bar ---- */
    const renderBeat = () => {
      const iBpm = T.input('number', 'cth: 120', '120');
      const iBar = T.input('number', 'cth: 4', '4');
      const iKetuk = T.input('number', 'cth: 4', '4');
      [iBpm, iBar, iKetuk].forEach((i) => i.addEventListener('input', hitung));
      wadah.appendChild(T.grid2(
        T.field('Tempo (BPM)', iBpm),
        T.field('Jumlah bar', iBar)
      ));
      wadah.appendChild(T.field('Ketuk per bar', iKetuk, 'Umumnya 4. Waltz pakai 3.'));

      function hitung() {
        const bpm = T.num(iBpm.value), bar = Math.floor(T.num(iBar.value)), ketuk = Math.floor(T.num(iKetuk.value));
        if (!(bpm > 0) || !(bar > 0) || !(ketuk > 0)) {
          T.show(box, '<p class="center mut">Isi BPM, jumlah bar, dan ketuk per bar dulu dengan angka yang masuk akal.</p>');
          baris._teks = '';
          return;
        }
        const ketukMs = 60000 / bpm;
        const totalKetuk = bar * ketuk;
        const totalMs = totalKetuk * ketukMs;
        T.show(box, tabel([
          ['Tempo', fmtID(bpm, 1) + ' BPM'],
          ['Total ketuk', String(totalKetuk) + ' (' + bar + ' bar × ' + ketuk + ')'],
          ['Durasi per chop', fmtID(ketukMs, 2) + ' ms'],
          ['Durasi total', fmtID(totalMs, 1) + ' ms (' + fmtID(totalMs / 1000) + ' dtk)'],
        ]) +
          '<p class="center hint">Potong sample tepat tiap ' + fmtID(ketukMs, 2) + ' ms biar tiap chop jatuh pas di tiap ketuk.</p>');
        baris._teks = fmtID(bpm, 1) + ' BPM, ' + bar + ' bar × ' + ketuk + ' ketuk → ' + totalKetuk + ' chop @ ' + fmtID(ketukMs, 2) + ' ms (total ' + fmtID(totalMs / 1000) + ' dtk)';
      }
      hitung();
    };

    btnDurasi.addEventListener('click', () => { mode = 'durasi'; renderMode(); });
    btnBeat.addEventListener('click', () => { mode = 'beat'; renderMode(); });
    root.appendChild(barTab);
    root.appendChild(wadah);
    root.appendChild(box);
    root.appendChild(baris);
    renderMode();

}
