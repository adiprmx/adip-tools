import { h as T, actx, onLeave, errBox, kvRows } from '../../core.js';

// Generator nada: osilator WebAudio yang berbunyi terus sampai dihentikan.
// Frekuensi bisa diatur langsung (20-20.000 Hz) atau lewat tombol nada.
// Nama nada terdekat dihitung dari A4 = 440 Hz (standar konser).
export const NAMA_NADA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function hzKeNada(hz) {
  if (!(hz > 0)) return null;
  const midi = 69 + 12 * Math.log2(hz / 440);
  const bulat = Math.round(midi);
  const nama = NAMA_NADA[((bulat % 12) + 12) % 12] + (Math.floor(bulat / 12) - 1);
  const sen = Math.round((midi - bulat) * 100);
  return { nama, sen, hzTepat: 440 * Math.pow(2, (bulat - 69) / 12) };
}

export const NADA_CEPAT = [
  ['C4', 261.63], ['D4', 293.66], ['E4', 329.63], ['F4', 349.23],
  ['G4', 392], ['A4', 440], ['B4', 493.88], ['C5', 523.25],
];

/* --- Dari nama nada (diserap dari Frekuensi Nada, B8 v6.21.0) --- */
const OFFSET_NADA = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

// "A4", "C#5", "Bb3" -> { midi, label }. Terima kres (#/♯) dan mol (b/♭),
// oktaf -1 sampai 9. Null bila format tidak dikenali. Murni, bisa diuji.
export function parseNamaNada(txt) {
  const m = /^\s*([a-gA-G])\s*([#b\u266f\u266d]?)\s*(-?\d+)\s*$/.exec(txt || '');
  if (!m) return null;
  const aks = m[2];
  let semi = OFFSET_NADA[m[1].toLowerCase()];
  if (aks === '#' || aks === '\u266f') semi += 1;
  else if (aks === 'b' || aks === '\u266d') semi -= 1;
  const okt = parseInt(m[3], 10);
  if (!Number.isFinite(okt) || okt < -1 || okt > 9) return null;
  return { midi: (okt + 1) * 12 + semi, label: m[1].toUpperCase() + aks + okt };
}

export function midiKeHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// "440 Hz", "1.234,56 Hz" (pemisah ribuan titik, desimal koma).
export function fmtHz(f) {
  let s = f.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  const p = s.split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return p.join(',') + ' Hz';
}

// Tabel referensi oktaf 4 (C4-B4): [nama, Hz].
export const REF_OKTAF4 = NAMA_NADA.map((n, i) => [n + '4', midiKeHz(60 + i)]);

export const meta = { "id": "generator-nada-frekuensi", "name": "Generator Nada & Frekuensi", "cat": "musik", "icon": "🎵", "desc": "Bunyikan nada pada frekuensi berapa pun (20-20.000 Hz) atau dari nama nada, lengkap dengan nomor MIDI dan pilihan bentuk gelombang.", "keywords": "generator nada,frekuensi,hz,osilator,tes suara,nada,440,suara,frekuensi nada,midi,oktaf,tuning,nama nada", "since": "6.18.0" };

export function render(root) {
  const freq = T.input('number', 'Frekuensi (Hz)', '440');
  const slider = T.input('range', '', '440');
  slider.min = '20';
  slider.max = '20000';
  const gelombang = T.select([['sine', 'Halus (sine)'], ['triangle', 'Lembut (triangle)'], ['square', 'Kotak (square)'], ['sawtooth', 'Gergaji (sawtooth)']], 'sine');
  const volume = T.input('range', '', '50');
  volume.min = '0';
  volume.max = '100';
  const info = T.el('<p class="hint" style="margin:6px 0"></p>');
  const box = T.out();
  const nadaInp = T.input('text', 'Contoh: A4, C#5, Bb3', 'A4');
  const nadaOut = T.out();
  let osc = null;
  let gain = null;
  let oscSingkat = null;
  let gainSingkat = null;

  const hentikanSingkat = () => {
    try { if (oscSingkat) { oscSingkat.stop(); oscSingkat.disconnect(); gainSingkat.disconnect(); } } catch (e) { /* sudah berhenti */ }
    oscSingkat = null; gainSingkat = null;
  };
  onLeave(hentikanSingkat);

  const tampilInfo = () => {
    const hz = T.num(freq.value);
    if (!(hz >= 20 && hz <= 20000)) {
      info.textContent = 'Frekuensi antara 20 sampai 20.000 Hz.';
      return;
    }
    const n = hzKeNada(hz);
    const sen = n.sen === 0 ? 'pas' : (n.sen > 0 ? n.sen + ' sen di atas ' : Math.abs(n.sen) + ' sen di bawah ');
    info.textContent = hz + ' Hz, nada terdekat ' + n.nama + ' (' + sen + ', ' + n.nama + ' tepatnya ' + n.hzTepat.toFixed(2).replace('.', ',') + ' Hz).';
  };

  const berhenti = () => {
    if (osc) { try { osc.stop(); } catch (e) {} osc = null; }
    if (gain) { try { gain.disconnect(); } catch (e) {} gain = null; }
  };
  onLeave(berhenti);

  const main = () => {
    const hz = T.num(freq.value);
    if (!(hz >= 20 && hz <= 20000)) {
      T.show(box, errBox('Isi frekuensi antara 20 sampai 20.000 Hz.'));
      return;
    }
    try {
      berhenti();
      const ctx = actx();
      if (ctx.state === 'suspended') ctx.resume();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.type = gelombang.value;
      osc.frequency.value = hz;
      gain.gain.value = (Number(volume.value) / 100) * 0.5;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      const n = hzKeNada(hz);
      T.show(box, '<p class="hint">Berbunyi: ' + hz + ' Hz (' + n.nama + ', ' + gelombang.value + '). Tekan Berhenti untuk mematikan.</p>');
    } catch (e) {
      T.show(box, errBox('Tidak bisa membunyikan nada di perangkat ini. Coba browser lain.'));
    }
  };

  freq.addEventListener('input', () => {
    const hz = T.num(freq.value);
    if (hz >= 20 && hz <= 20000) slider.value = String(hz);
    tampilInfo();
    if (osc) osc.frequency.value = hz;
  });
  slider.addEventListener('input', () => {
    freq.value = slider.value;
    tampilInfo();
    if (osc) osc.frequency.value = Number(slider.value);
  });
  volume.addEventListener('input', () => {
    if (gain) gain.gain.value = (Number(volume.value) / 100) * 0.5;
  });

  // --- Dari nama nada: ketik nama nada, lihat MIDI + Hz-nya, dengar sebentar. ---
  const hitungNada = () => {
    const p = parseNamaNada(nadaInp.value);
    if (!p) {
      T.show(nadaOut, errBox('Format nada tidak dikenali. Contoh yang benar: A4, C#5, Bb3, F2.'));
      return;
    }
    const hz = midiKeHz(p.midi);
    const dgr = T.btn('Dengar sebentar', () => {
      hentikanSingkat();
      try {
        const c = actx(), t = c.currentTime;
        oscSingkat = c.createOscillator(); gainSingkat = c.createGain();
        oscSingkat.type = 'sine'; oscSingkat.frequency.value = hz;
        gainSingkat.gain.setValueAtTime(0.0001, t);
        gainSingkat.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
        gainSingkat.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        oscSingkat.connect(gainSingkat); gainSingkat.connect(c.destination);
        oscSingkat.start(t); oscSingkat.stop(t + 1.3);
        oscSingkat.onended = () => { oscSingkat = null; gainSingkat = null; };
      } catch (e) { /* audio tidak tersedia */ }
    }, true);
    const pakai = T.btn('Pakai nada ini', () => {
      freq.value = String(Math.round(hz * 100) / 100);
      slider.value = String(Math.round(hz));
      tampilInfo();
      if (osc) osc.frequency.value = hz;
      T.toast(p.label + ' dipakai (' + fmtHz(hz) + ')');
    });
    T.show(nadaOut,
      kvRows([
        ['Nada', p.label],
        ['Nomor MIDI', String(p.midi)],
        ['Frekuensi', fmtHz(hz)],
      ]) +
      '<div style="margin-top:10px"></div>' +
      '<div class="hint" style="margin-top:8px">Rumus: 440 × 2^(midi−69)/12, A4 = 440 Hz sebagai acuan standar.</div>');
    const slot = nadaOut.querySelector('div[style^="margin-top:10px"]');
    if (slot) { slot.appendChild(dgr); slot.appendChild(pakai); }
    else { nadaOut.appendChild(dgr); nadaOut.appendChild(pakai); }
  };
  nadaInp.addEventListener('input', hitungNada);

  root.appendChild(T.field('Frekuensi (Hz)', freq, 'Pendengaran manusia umumnya 20 sampai 20.000 Hz.'));
  root.appendChild(T.field('Geser frekuensi', slider));
  root.appendChild(info);
  const tombolNada = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px"></div>');
  NADA_CEPAT.forEach(([nama, hz]) => {
    const b = T.btn(nama + ' (' + hz + ' Hz)', () => {
      freq.value = String(hz);
      slider.value = String(Math.round(hz));
      tampilInfo();
      if (osc) osc.frequency.value = hz;
    });
    tombolNada.appendChild(b);
  });
  root.appendChild(tombolNada);
  root.appendChild(T.el('<div style="margin:14px 0 6px;font-size:13px;font-weight:700">Atau dari nama nada</div>'));
  root.appendChild(T.field('Nama nada', nadaInp, 'Huruf A–G + kres (#) atau mol (b) + oktaf'));
  root.appendChild(nadaOut);
  root.appendChild(T.grid2(
    T.field('Bentuk gelombang', gelombang),
    T.field('Volume', volume),
  ));
  root.appendChild(T.row(
    T.btn('Bunyikan', main, true),
    T.btn('Berhenti', () => { berhenti(); T.show(box, '<p class="hint">Berhenti.</p>'); }),
  ));
  root.appendChild(box);
  root.appendChild(T.el('<div style="margin-top:14px;font-size:13px;opacity:.7">Referensi oktaf 4:</div>'));
  const ref = T.out();
  T.show(ref, kvRows(REF_OKTAF4.map(([n, hz]) => [n, fmtHz(hz)])));
  root.appendChild(ref);
  tampilInfo();
  hitungNada();
}
