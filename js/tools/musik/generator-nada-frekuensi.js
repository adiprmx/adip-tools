import { h as T, actx, onLeave, errBox } from '../../core.js';

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

export const meta = { "id": "generator-nada-frekuensi", "name": "Generator Nada & Frekuensi", "cat": "musik", "icon": "🎵", "desc": "Bunyikan nada pada frekuensi berapa pun (20-20.000 Hz) dengan pilihan bentuk gelombang.", "keywords": "generator nada,frekuensi,hz,osilator,tes suara,nada,440,suara", "since": "6.18.0" };

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
  let osc = null;
  let gain = null;

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
  root.appendChild(T.grid2(
    T.field('Bentuk gelombang', gelombang),
    T.field('Volume', volume),
  ));
  root.appendChild(T.row(
    T.btn('Bunyikan', main, true),
    T.btn('Berhenti', () => { berhenti(); T.show(box, '<p class="hint">Berhenti.</p>'); }),
  ));
  root.appendChild(box);
  tampilInfo();
}
