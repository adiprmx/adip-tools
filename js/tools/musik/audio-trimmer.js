import { h as T, utils } from '../../core.js?v=6.2.0';

export const meta = {"id": "audio-trimmer", "name": "Audio Trimmer", "cat": "musik", "icon": "✂️", "desc": "Potong audio di browser, export WAV.", "keywords": "audio,potong,mp3,trim"};
export function render(root) {

    const file = T.input('file');
    file.accept = 'audio/*';
    const wrap = T.el('<div></div>');
    let buf = null, srcNode = null;
    T.onLeave(() => { try { srcNode && srcNode.stop(); } catch (e) {} });
    const stopPrev = () => { try { srcNode && srcNode.stop(); } catch (e) {} srcNode = null; };

    const drawWave = (canvas, s0, s1) => {
      const W = canvas.width = Math.min(720, canvas.clientWidth * 2 || 640), H = canvas.height = 160;
      const g = canvas.getContext('2d');
      const ch = buf.getChannelData(0), len = buf.length;
      g.fillStyle = '#18181b'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8b8b93';
      const step = Math.max(1, Math.floor(len / W));
      for (let x = 0; x < W; x++) {
        let mn = 1, mx = -1;
        for (let i = x * step; i < (x + 1) * step && i < len; i += 4) {
          const v = ch[i];
          if (v < mn) mn = v; if (v > mx) mx = v;
        }
        const y1 = (1 - (mx + 1) / 2) * H, y2 = (1 - (mn + 1) / 2) * H;
        g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
      // area potongan
      const x0 = (s0 / buf.duration) * W, x1 = (s1 / buf.duration) * W;
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, 0, x0, H); g.fillRect(x1, 0, W - x1, H);
      g.fillStyle = '#fff'; g.fillRect(x0 - 1, 0, 2, H); g.fillRect(x1 - 1, 0, 2, H);
    };

    const encodeWav = (s0, s1) => {
      const sr = buf.sampleRate, nCh = buf.numberOfChannels;
      const a = Math.max(0, Math.floor(s0 * sr)), b = Math.min(buf.length, Math.floor(s1 * sr));
      const frames = Math.max(0, b - a);
      const ab = new ArrayBuffer(44 + frames * nCh * 2), v = new DataView(ab);
      const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true); ws(8, 'WAVE');
      ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, nCh, true); v.setUint32(24, sr, true);
      v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
      ws(36, 'data'); v.setUint32(40, frames * nCh * 2, true);
      const chans = [];
      for (let c = 0; c < nCh; c++) chans.push(buf.getChannelData(c));
      let o = 44;
      for (let i = a; i < b; i++) for (let c = 0; c < nCh; c++) {
        const x = Math.max(-1, Math.min(1, chans[c][i]));
        v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2;
      }
      return new Blob([ab], { type: 'audio/wav' });
    };

    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      stopPrev();
      try {
        const c = T.actx();
        buf = await c.decodeAudioData(await f.arrayBuffer());
      } catch (e) { wrap.innerHTML = '<p class="err">Gagal membaca file audio. Coba file MP3/WAV/OGG lain.</p>'; return; }
      wrap.innerHTML = '';
      const info = T.el('<p class="mut" style="font-size:13px"></p>');
      const canvas = T.el('<canvas class="prev" style="width:100%"></canvas>');
      const sIn = T.input('number', '0', '0'), eIn = T.input('number', '', buf.duration.toFixed(2));
      [sIn, eIn].forEach((i) => { i.step = '0.1'; i.min = '0'; i.max = String(buf.duration); });
      const getRange = () => {
        let s = Math.max(0, +sIn.value || 0), e = Math.min(buf.duration, +eIn.value || buf.duration);
        if (e <= s) e = Math.min(buf.duration, s + 1);
        return [s, e];
      };
      const refresh = () => {
        const [s, e] = getRange();
        info.textContent = 'Durasi file ' + buf.duration.toFixed(2) + ' dtk · potongan ' + (e - s).toFixed(2) + ' dtk';
        drawWave(canvas, s, e);
      };
      const playBtn = T.btn('Putar potongan', () => {
        stopPrev();
        const c = T.actx(), [s, e] = getRange();
        srcNode = c.createBufferSource();
        srcNode.buffer = buf; srcNode.connect(c.destination);
        srcNode.start(0, s, e - s);
        T.toast('Memutar ' + (e - s).toFixed(1) + ' detik');
      }, true);
      const stopBtn = T.btn('Stop', stopPrev);
      const dlBtn = T.btn('Export WAV', () => {
        const [s, e] = getRange();
        T.dl('potongan-' + Math.round(s) + '-' + Math.round(e) + 's.wav', encodeWav(s, e), 'audio/wav');
        T.toast('WAV diunduh');
      });
      [sIn, eIn].forEach((i) => i.addEventListener('input', refresh));
      wrap.appendChild(info);
      wrap.appendChild(canvas);
      wrap.appendChild(T.grid2(T.field('Mulai (detik)', sIn), T.field('Selesai (detik)', eIn)));
      wrap.appendChild(T.row(playBtn, stopBtn, dlBtn));
      wrap.appendChild(T.el('<p class="hint">Semua proses jalan lokal di browser, file tidak di-upload ke mana pun. Export menghasilkan WAV 16-bit.</p>'));
      requestAnimationFrame(refresh);
    });
    root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, OGG, M4A…'));
    root.appendChild(wrap);
  
}
