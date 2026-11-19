import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "pisah-audio-per-hening", "name": "Pisah Audio per Hening", "cat": "musik", "icon": "✂️", "desc": "Bagi rekaman panjang jadi beberapa file di tiap jeda hening.", "keywords": "pisah,audio,hening,diam,rekaman,potong,segmen", "since": "6.19.0"};

// Cari segmen bersuara: deteksi hening per jendela 10 ms (RMS), gabungkan
// bagian bersuara yang dipisah hening kurang dari heningMs, buang segmen
// yang lebih pendek dari minSegmenMs, beri jeda padMs di tiap sisi.
// Fungsi murni, diuji di Node. Beda dengan potong-hening-audio: tool itu
// membuang hening jadi satu file, tool ini memecah jadi banyak file.
export function cariSegmenBersuara(channels, sampleRate, opts) {
  const o = opts || {};
  const thresholdDb = (o.thresholdDb == null) ? -40 : o.thresholdDb;
  const heningMs = (o.heningMs == null) ? 500 : o.heningMs;
  const minSegmenMs = (o.minSegmenMs == null) ? 300 : o.minSegmenMs;
  const padMs = (o.padMs == null) ? 100 : o.padMs;
  const len = channels[0].length;
  const win = Math.max(1, Math.floor(sampleRate * 0.01));
  const threshold = Math.pow(10, thresholdDb / 20);
  const numWin = Math.ceil(len / win);
  const loud = new Array(numWin).fill(false);
  for (let w = 0; w < numWin; w++) {
    const start = w * win;
    const end = Math.min(len, start + win);
    let sum = 0, n = 0;
    for (let c = 0; c < channels.length; c++) {
      const ch = channels[c];
      for (let i = start; i < end; i++) { sum += ch[i] * ch[i]; n++; }
    }
    loud[w] = Math.sqrt(sum / Math.max(1, n)) > threshold;
  }
  const mergeGap = Math.max(1, Math.ceil(heningMs / 10));
  const regions = [];
  let s = -1, lastLoud = -1;
  for (let w = 0; w < numWin; w++) {
    if (loud[w]) {
      if (s < 0) { s = w; lastLoud = w; }
      else if (w - lastLoud <= mergeGap) { lastLoud = w; }
      else { regions.push([s, lastLoud]); s = w; lastLoud = w; }
    }
  }
  if (s >= 0) regions.push([s, lastLoud]);
  const pad = Math.ceil(padMs / 10);
  const minWin = Math.ceil(minSegmenMs / 10);
  const spans = [];
  for (const [a, b] of regions) {
    if (b - a + 1 < minWin) continue;
    spans.push([
      Math.max(0, (a - pad) * win),
      Math.min(len, (b + 1 + pad) * win),
    ]);
  }
  return { spans, totalFrames: len, sampleRate };
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const heningSel = T.select([
    ['300', 'Jeda 0,3 detik sudah memisah'],
    ['500', 'Jeda 0,5 detik (disarankan)'],
    ['1000', 'Jeda 1 detik'],
    ['2000', 'Jeda 2 detik'],
  ], '500');
  const levelSel = T.select([
    ['-50', 'Hanya yang benar-benar hening'],
    ['-40', 'Hening biasa (disarankan)'],
    ['-30', 'Termasuk yang agak pelan'],
  ], '-40');
  const infoBox = T.out();
  const outBox = T.out();
  let fileObj = null, bufferAsli = null, busy = false;

  const proses = async () => {
    if (busy) return;
    if (!fileObj || !bufferAsli) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.show(outBox, '<span class="dim">Mencari jeda hening…</span>');
    try {
      const channels = [];
      for (let c = 0; c < bufferAsli.numberOfChannels; c++) channels.push(bufferAsli.getChannelData(c));
      const r = cariSegmenBersuara(channels, bufferAsli.sampleRate, {
        thresholdDb: Number(levelSel.value),
        heningMs: Number(heningSel.value),
      });
      if (!r.spans.length) {
        T.show(outBox, errBox('Tidak ditemukan jeda hening yang cukup panjang. Coba turunkan batas hening atau pilih jeda yang lebih pendek.'));
        return;
      }
      if (r.spans.length > 100) {
        T.show(outBox, errBox('Ditemukan ' + r.spans.length + ' potongan, terlalu banyak. Coba naikkan jeda pemisah atau batas hening.'));
        return;
      }
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      const hasil = r.spans.map(([a, b], i) => {
        const seg = channels.map((ch) => ch.slice(a, b));
        const wav = utils.encodeWav(seg, bufferAsli.sampleRate);
        return {
          name: base + '-bagian-' + (i + 1) + '.wav',
          data: wav,
          mulai: a / bufferAsli.sampleRate,
          durasi: (b - a) / bufferAsli.sampleRate,
        };
      });
      const daftar = hasil.map((h, i) =>
        '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #27272a">' +
        '<span style="flex:1;line-height:1.5">Bagian ' + (i + 1) + ' <span class="dim">(' + h.mulai.toFixed(1) + ' dtk, ' + h.durasi.toFixed(1) + ' detik)</span></span>' +
        '<button type="button" class="btn" data-seg="' + i + '" style="flex:none">Unduh</button></div>').join('');
      T.show(outBox,
        '<span class="ok">Selesai. Rekaman terpecah jadi ' + hasil.length + ' file.</span>' +
        kv('Durasi asli', bufferAsli.duration.toFixed(1) + ' detik') +
        daftar);
      outBox.querySelectorAll('button[data-seg]').forEach((b) => {
        b.addEventListener('click', () => {
          const h = hasil[Number(b.dataset.seg)];
          T.dl(h.name, new Blob([h.data], { type: 'audio/wav' }), 'audio/wav');
        });
      });
      outBox.appendChild(T.row(T.zipBtn(base + '-terpisah.zip', () => hasil.map((h) => ({ name: h.name, data: h.data })), 'Unduh semua (ZIP)')));
      T.toast(hasil.length + ' potongan siap');
    } catch (e) {
      T.show(outBox, errBox('Audio tidak bisa diproses. Coba file lain.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  };

  const goBtn = T.btn('Pisah audio', proses, true);

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
        kv('Ukuran', fmtBytes(fileObj.size)));
    } catch (e) {
      bufferAsli = null;
      T.show(infoBox, errBox('File ini tidak bisa dibaca sebagai audio.'));
    }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Rekaman panjang dipotong di tiap jeda diam, jadi tiap potongan berisi satu bagian bersuara. Cocok buat memecah rekaman rapat, wawancara, atau latihan vokal. Hasilnya file WAV per potongan.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, dan format audio umum lainnya.'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(
    T.field('Jeda yang memisah', heningSel, 'Diam sepanjang ini dianggap pemisah antar bagian.'),
    T.field('Batas hening', levelSel, 'Seberapa pelan suara dianggap hening.'),
  ));
  root.appendChild(T.row(goBtn));
  root.appendChild(outBox);
}
