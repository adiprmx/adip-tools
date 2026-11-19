import { h as T, fmtBytes, errBox, onLeave, utils } from '../../core.js';

// Stereo ke mono: kedua kanal dirata-rata. Mono ke stereo: kanal yang sama
// diduplikasi ke kiri dan kanan; opsi lebar menambah jeda kecil di kanal
// kanan supaya terdengar lebih luas.
export function keMono(kanalKiri, kanalKanan) {
  const n = kanalKiri.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (kanalKiri[i] + kanalKanan[i]) / 2;
  return out;
}

export function keStereo(mono, lebarMs, sampleRate) {
  const n = mono.length;
  const jeda = Math.round((lebarMs / 1000) * sampleRate);
  const kiri = new Float32Array(mono);
  const kanan = new Float32Array(n);
  for (let i = 0; i < n; i++) kanan[i] = i >= jeda ? mono[i - jeda] : 0;
  return [kiri, kanan];
}

// encodeWav kanonis tinggal di utils (core.js).

export const meta = { "id": "audio-ke-mono-stereo", "name": "Audio ke Mono / Stereo", "cat": "musik", "icon": "🔊", "desc": "Ubah audio stereo jadi mono atau mono jadi stereo, lalu unduh hasilnya.", "keywords": "mono,stereo,audio,konversi audio,kanal,suara", "since": "6.18.0" };

export function render(root) {
  const file = T.input('file', '');
  file.accept = 'audio/*';
  const mode = T.select([['ke-mono', 'Stereo ke mono'], ['ke-stereo', 'Mono ke stereo']], 'ke-mono');
  const lebar = T.select([['0', 'Duplikat biasa (tanpa efek)'], ['12', 'Sedikit lebar (jeda 12 ms)'], ['25', 'Lebih lebar (jeda 25 ms)']], '12');
  const boxLebar = T.el('<div></div>');
  boxLebar.appendChild(T.field('Efek lebar', lebar, 'Jeda kecil di kanal kanan supaya suara terasa lebih luas.'));
  boxLebar.style.display = 'none';
  const box = T.out();
  let url = null;
  onLeave(() => { if (url) URL.revokeObjectURL(url); });

  mode.addEventListener('change', () => {
    boxLebar.style.display = mode.value === 'ke-stereo' ? '' : 'none';
  });

  const proses = async () => {
    const f = file.files && file.files[0];
    if (!f) {
      T.show(box, errBox('Pilih file audio dulu.'));
      return;
    }
    T.show(box, '<p class="hint">Memproses, tunggu sebentar...</p>');
    try {
      const buf = await f.arrayBuffer();
      const ctx = T.actx();
      const audio = await ctx.decodeAudioData(buf);
      let channels, nama, ket;
      if (mode.value === 'ke-mono') {
        if (audio.numberOfChannels < 2) {
          T.show(box, errBox('File ini sudah mono, tidak ada yang diubah.'));
          return;
        }
        channels = [keMono(audio.getChannelData(0), audio.getChannelData(1))];
        nama = 'audio-mono.wav';
        ket = 'Stereo jadi mono (1 kanal)';
      } else {
        const mono = audio.numberOfChannels > 1
          ? keMono(audio.getChannelData(0), audio.getChannelData(1))
          : audio.getChannelData(0);
        channels = keStereo(mono, Number(lebar.value), audio.sampleRate);
        nama = 'audio-stereo.wav';
        ket = 'Mono jadi stereo (2 kanal)';
      }
      const blob = utils.encodeWav(channels, audio.sampleRate);
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      T.show(box,
        '<p class="hint">Selesai. ' + ket + '.</p>' +
        '<audio controls src="' + T.esc(url) + '" style="width:100%"></audio>' +
        '<p class="hint">' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ') jadi WAV ' + fmtBytes(blob.size) + ', ' +
        audio.duration.toFixed(1).replace('.', ',') + ' detik.</p>');
      box.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(nama, blob, 'audio/wav'), true)));
    } catch (e) {
      T.show(box, errBox('Tidak bisa memproses file ini. Pastikan file-nya audio yang bisa diputar (MP3, WAV, OGG, M4A).'));
    }
  };

  root.appendChild(T.field('File audio', file, 'Semua proses berjalan di perangkatmu, file tidak diunggah ke mana-mana.'));
  root.appendChild(T.field('Arah konversi', mode));
  root.appendChild(boxLebar);
  root.appendChild(T.btn('Ubah audio', proses, true));
  root.appendChild(box);
}
