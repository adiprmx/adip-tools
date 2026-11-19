import { h as T, fmtBytes, errBox, onLeave, utils } from '../../core.js';

// Audio 8D: suara dibuat berputar dari kiri ke kanan dengan panning
// equal-power. Sinyal digabung jadi satu kanal dulu, lalu posisi panning
// digerakkan sinus pada kecepatan yang dipilih. Gain kiri dan kanan memakai
// hukum equal-power supaya volume total tetap stabil saat berputar.
export function terapkan8D(kanalKiri, kanalKanan, sampleRate, kecepatanHz) {
  const n = kanalKiri.length;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (kanalKiri[i] + (kanalKanan ? kanalKanan[i] : kanalKiri[i])) / 2;
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const pan = Math.sin(2 * Math.PI * kecepatanHz * (i / sampleRate));
    const gL = Math.cos(((pan + 1) * Math.PI) / 4);
    const gR = Math.sin(((pan + 1) * Math.PI) / 4);
    outL[i] = mono[i] * gL;
    outR[i] = mono[i] * gR;
  }
  return [outL, outR];
}

// encodeWav kanonis tinggal di utils (core.js).

export const meta = { "id": "audio-8d", "name": "Audio 8D", "cat": "musik", "icon": "🎧", "desc": "Ubah audio jadi efek 8D yang berputar di telinga kiri dan kanan, lalu unduh hasilnya.", "keywords": "audio 8d,8d audio,panning,equal power,efek putar,headphone", "since": "6.18.0" };

export function render(root) {
  const file = T.input('file', '');
  file.accept = 'audio/*';
  const kecepatan = T.select([['0.1', 'Lambat (1 putaran 10 detik)'], ['0.2', 'Sedang (1 putaran 5 detik)'], ['0.4', 'Cepat (1 putaran 2,5 detik)']], '0.2');
  const box = T.out();
  let url = null;
  onLeave(() => { if (url) URL.revokeObjectURL(url); });

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
      const kiri = audio.getChannelData(0);
      const kanan = audio.numberOfChannels > 1 ? audio.getChannelData(1) : null;
      const [outL, outR] = terapkan8D(kiri, kanan, audio.sampleRate, Number(kecepatan.value));
      const blob = utils.encodeWav([outL, outR], audio.sampleRate);
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(blob);
      T.show(box,
        '<p class="hint">Selesai. Dengarkan dengan earphone atau headphone supaya efek putarnya terasa.</p>' +
        '<audio controls src="' + T.esc(url) + '" style="width:100%"></audio>' +
        '<p class="hint">' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ') jadi WAV ' + fmtBytes(blob.size) + ', ' +
        audio.duration.toFixed(1).replace('.', ',') + ' detik.</p>');
      box.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl('audio-8d.wav', blob, 'audio/wav'), true)));
    } catch (e) {
      T.show(box, errBox('Tidak bisa memproses file ini. Pastikan file-nya audio yang bisa diputar (MP3, WAV, OGG, M4A).'));
    }
  };

  root.appendChild(T.field('File audio', file, 'Semua proses berjalan di perangkatmu, file tidak diunggah ke mana-mana.'));
  root.appendChild(T.field('Kecepatan putaran', kecepatan));
  root.appendChild(T.btn('Buat audio 8D', proses, true));
  root.appendChild(box);
}
