import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "kompresor-dinamis-audio", "name": "Kompresor Dinamis Audio", "cat": "musik", "icon": "🎚️", "desc": "Ratakan volume keras-pelan pada rekaman supaya enak didengar.", "keywords": "kompresor,audio,volume,dinamik,rekaman,podcast,keras pelan", "since": "6.19.0"};

// Preset kompresor: ambang (dB), lutut (dB), rasio, serangan (detik),
// lepas (detik), tambah volume akhir (dB). Nilai mengikuti praktik umum
// mixing vokal dan podcast.
export const PRESET_KOMPRESOR = {
  ringan: { label: 'Ringan (podcast/vokal)', threshold: -24, knee: 20, ratio: 3, attack: 0.01, release: 0.25, makeup: 3 },
  sedang: { label: 'Sedang (musik)', threshold: -18, knee: 15, ratio: 4, attack: 0.005, release: 0.2, makeup: 4 },
  kuat: { label: 'Kuat (rekaman suaranya naik turun)', threshold: -30, knee: 10, ratio: 8, attack: 0.003, release: 0.3, makeup: 6 },
};

// dB ke pengali linear. Fungsi murni, diuji di Node.
export function dbKeLinear(db) {
  return Math.pow(10, Number(db) / 20);
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const presetSel = T.select(Object.keys(PRESET_KOMPRESOR).map((k) => [k, PRESET_KOMPRESOR[k].label]), 'ringan');
  const infoBox = T.out();
  const outBox = T.out();
  let fileObj = null, bufferAsli = null, busy = false;

  const proses = async () => {
    if (busy) return;
    if (!fileObj || !bufferAsli) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const p = PRESET_KOMPRESOR[presetSel.value] || PRESET_KOMPRESOR.ringan;
    busy = true;
    goBtn.disabled = true;
    T.show(outBox, '<span class="dim">Memproses audio…</span>');
    try {
      const ctx = new OfflineAudioContext(bufferAsli.numberOfChannels, bufferAsli.length, bufferAsli.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = bufferAsli;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = p.threshold;
      comp.knee.value = p.knee;
      comp.ratio.value = p.ratio;
      comp.attack.value = p.attack;
      comp.release.value = p.release;
      const makeup = ctx.createGain();
      makeup.gain.value = dbKeLinear(p.makeup);
      src.connect(comp);
      comp.connect(makeup);
      makeup.connect(ctx.destination);
      src.start(0);
      const hasil = await ctx.startRendering();
      const channels = [];
      for (let c = 0; c < hasil.numberOfChannels; c++) channels.push(hasil.getChannelData(c));
      const wav = utils.encodeWav(channels, hasil.sampleRate);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      const nama = base + '-kompres.wav';
      T.show(outBox,
        '<span class="ok">Selesai.</span>' +
        kv('Durasi', bufferAsli.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)) +
        '<p class="dim" style="font-size:13px;line-height:1.6;margin:8px 0 0">Hasilnya file WAV. Bagian pelan jadi lebih terdengar, bagian keras tidak menusuk.</p>');
      outBox.appendChild(T.row(T.dlBtn(nama, () => blob, 'audio/wav', 'Unduh WAV')));
      T.toast('Audio terkompres');
    } catch (e) {
      T.show(outBox, errBox('Audio tidak bisa diproses. Coba file lain (MP3 atau WAV biasanya aman).'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  };

  const goBtn = T.btn('Kompres audio', proses, true);

  file.addEventListener('change', async () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    bufferAsli = null;
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    T.show(infoBox, '<span class="dim">Membaca audio…</span>');
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await fileObj.arrayBuffer();
      bufferAsli = await ctx.decodeAudioData(ab);
      await ctx.close();
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', bufferAsli.duration.toFixed(1) + ' detik') +
        kv('Kanal', bufferAsli.numberOfChannels === 1 ? 'Mono' : 'Stereo') +
        kv('Ukuran', fmtBytes(fileObj.size)));
    } catch (e) {
      bufferAsli = null;
      T.show(infoBox, errBox('File ini tidak bisa dibaca sebagai audio.'));
    }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Kompresor meratakan suara: yang pelan diangkat, yang keras ditahan. Cocok buat rekaman suara yang volumenya naik turun. Diproses di browser, file tidak diunggah.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, dan format audio umum lainnya.'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Seberapa kuat', presetSel, 'Ringan cukup buat podcast. Kuat buat rekaman yang suaranya jauh dekat.'));
  root.appendChild(T.row(goBtn));
  root.appendChild(outBox);
}
