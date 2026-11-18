import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "equalizer-audio", "name": "Equalizer Audio", "cat": "musik", "icon": "🎚️", "desc": "Atur bass, tengah, dan treble lagu, dengarkan dulu, lalu unduh.", "keywords": "audio,equalizer,bass,treble,mid,suara,eq", "since": "6.17.0"};

/* Enkode PCM 16-bit jadi file WAV (salinan per tool, lihat balik-audio). */
export function encodeWav(channels, sampleRate) {
  const numCh = channels.length;
  const len = channels[0].length;
  const blockAlign = numCh * 2;
  const dataSize = len * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const wstr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * blockAlign, true); v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true); wstr(36, 'data'); v.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/* Rantai saringan yang sama dipakai pratinjau (live) dan ekspor
   (offline): rak bawah 250 Hz, puncak 1000 Hz, rak atas 4000 Hz. */
export function makeEqChain(ctx, gains) {
  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf'; low.frequency.value = 250; low.gain.value = gains.low;
  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 0.9; mid.gain.value = gains.mid;
  const high = ctx.createBiquadFilter();
  high.type = 'highshelf'; high.frequency.value = 4000; high.gain.value = gains.high;
  low.connect(mid); mid.connect(high);
  return { input: low, output: high, low, mid, high };
}

const PRESETS = {
  rata: { label: 'Rata (tanpa perubahan)', low: 0, mid: 0, high: 0 },
  bass: { label: 'Bass kuat', low: 8, mid: 0, high: -2 },
  vokal: { label: 'Vokal jelas', low: -2, mid: 5, high: 3 },
  cerah: { label: 'Treble cerah', low: -2, mid: 0, high: 7 },
};

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const eqBox = T.out();
  const gains = { low: 0, mid: 0, high: 0 };
  let fileObj = null, decoded = null, busy = false;
  let previewSrc = null, previewChain = null, previewOn = false;

  const sliderRow = (label, key) => {
    const wrap = T.el('<div style="margin:10px 0"></div>');
    const head = T.el('<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>' + label + '</span><span class="dim"></span></div>');
    const valEl = head.querySelectorAll('span')[1];
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '-12'; input.max = '12'; input.step = '1'; input.value = '0';
    input.style.width = '100%';
    input.style.accentColor = '#ff6f61';
    const paint = () => {
      const v = parseInt(input.value, 10);
      gains[key] = v;
      valEl.textContent = (v > 0 ? '+' : '') + v;
      if (previewChain) previewChain[key].gain.value = v;
    };
    input.addEventListener('input', paint);
    paint();
    wrap.appendChild(head);
    wrap.appendChild(input);
    return { wrap, input, paint };
  };
  const lowRow = sliderRow('Bass (suara rendah)', 'low');
  const midRow = sliderRow('Tengah (suara vokal)', 'mid');
  const highRow = sliderRow('Treble (suara tinggi)', 'high');
  const applyPreset = (key) => {
    const p = PRESETS[key];
    lowRow.input.value = p.low; midRow.input.value = p.mid; highRow.input.value = p.high;
    lowRow.paint(); midRow.paint(); highRow.paint();
  };

  const stopPreview = () => {
    if (previewSrc) { try { previewSrc.stop(); } catch (e) {} try { previewSrc.disconnect(); } catch (e) {} }
    previewSrc = null;
    previewChain = null;
    previewOn = false;
    playBtn.textContent = 'Dengarkan';
  };
  const playBtn = T.btn('Dengarkan', () => {
    if (!decoded) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    if (previewOn) { stopPreview(); return; }
    try {
      const ctx = T.actx();
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      previewChain = makeEqChain(ctx, gains);
      src.connect(previewChain.input);
      previewChain.output.connect(ctx.destination);
      src.onended = () => { if (previewSrc === src) stopPreview(); };
      previewSrc = src;
      previewOn = true;
      playBtn.textContent = 'Berhenti';
      src.start();
    } catch (e) {
      T.show(outBox, errBox('Pratinjau tidak bisa diputar di browser ini.'));
    }
  });
  playBtn.disabled = true;

  const goBtn = T.btn('Unduh hasil (WAV)', async () => {
    if (busy) return;
    if (!decoded) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    busy = true;
    goBtn.disabled = true;
    stopPreview();
    T.hide(outBox);
    T.show(outBox, '<span class="dim">Sedang memproses…</span>');
    try {
      const offline = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
      const src = offline.createBufferSource();
      src.buffer = decoded;
      const chain = makeEqChain(offline, gains);
      src.connect(chain.input);
      chain.output.connect(offline.destination);
      src.start();
      const rendered = await offline.startRendering();
      const channels = [];
      for (let c = 0; c < rendered.numberOfChannels; c++) channels.push(rendered.getChannelData(c));
      const blob = encodeWav(channels, rendered.sampleRate);
      const base = (fileObj ? fileObj.name : 'audio').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      T.dl(base + '-eq.wav', blob, 'audio/wav');
      T.show(outBox, '<span class="ok">Selesai. Audio terunduh.</span>' +
        kv('Bass', (gains.low > 0 ? '+' : '') + gains.low) +
        kv('Tengah', (gains.mid > 0 ? '+' : '') + gains.mid) +
        kv('Treble', (gains.high > 0 ? '+' : '') + gains.high) +
        kv('Durasi', rendered.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Audio terunduh');
    } catch (e) {
      T.show(outBox, errBox('Proses gagal. Coba file yang lebih kecil atau muat ulang halaman.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);
  goBtn.disabled = true;

  file.addEventListener('change', async () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox);
    stopPreview();
    decoded = null;
    playBtn.disabled = true;
    goBtn.disabled = true;
    if (!fileObj) { T.hide(infoBox); eqBox.hidden = true; return; }
    T.show(infoBox, '<span class="dim">Membaca file…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      decoded = await T.actx().decodeAudioData(ab);
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      eqBox.hidden = false;
      playBtn.disabled = false;
      goBtn.disabled = false;
    } catch (e) {
      T.show(infoBox, errBox('File ini tidak bisa dibaca sebagai audio. Coba file MP3, WAV, atau M4A lain.'));
      eqBox.hidden = true;
    }
  });

  const presetRow = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px"></div>');
  Object.keys(PRESETS).forEach((k) => {
    const b = T.btn(PRESETS[k].label, () => applyPreset(k));
    b.classList.add('small');
    presetRow.appendChild(b);
  });

  T.onLeave(() => { stopPreview(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Geser pengaturannya, dengarkan langsung perubahannya, lalu unduh kalau sudah pas. Angka plus berarti suara di bagian itu dikuatkan, minus berarti dilemahkan.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(eqBox);
  eqBox.appendChild(presetRow);
  eqBox.appendChild(lowRow.wrap);
  eqBox.appendChild(midRow.wrap);
  eqBox.appendChild(highRow.wrap);
  root.appendChild(T.row(playBtn, goBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Hasilnya format WAV, jadi ukurannya lebih besar dari MP3.</p>'));
}
