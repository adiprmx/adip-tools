import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "info-metadata-video", "name": "Info Metadata Video", "cat": "converter", "icon": "📹", "desc": "Detail teknis video: format gambar, durasi, ukuran layar, dan lainnya.", "keywords": "video,metadata,info,detail,codec,durasi,bitrate,resolusi", "since": "6.17.0"};

// Urai keluaran "ffmpeg -i" jadi info terstruktur. Murni, bisa diuji di Node
// dengan keluaran ffprobe/ffmpeg asli.
export function uraiInfoFFmpeg(teks) {
  const info = { durasi: 0, bitrate: '', video: null, audio: null };
  const s = String(teks || '');
  const mDur = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(s);
  if (mDur) info.durasi = (+mDur[1]) * 3600 + (+mDur[2]) * 60 + parseFloat(mDur[3]);
  const mBr = /bitrate:\s*([\d.]+\s*\w+\/s)/.exec(s);
  if (mBr) info.bitrate = mBr[1];
  const mV = /Stream\s*#\d+:\d+[^:]*:\s*Video:\s*([a-z0-9_]+).*?,\s*(\d+)x(\d+)/i.exec(s);
  if (mV) {
    // Gambar per detik dicari terpisah di baris yang sama: pola opsional
    // di dalam satu regex malas tidak akan pernah menangkapnya.
    const barisVideo = s.slice(mV.index).split('\n')[0];
    const mF = /([\d.]+)\s*fps/.exec(barisVideo);
    info.video = {
      codec: mV[1],
      lebar: parseInt(mV[2], 10),
      tinggi: parseInt(mV[3], 10),
      fps: mF ? parseFloat(mF[1]) : 0,
    };
  }
  const mA = /Stream\s*#\d+:\d+[^:]*:\s*Audio:\s*([a-z0-9_]+)[^,]*,\s*(\d+)\s*Hz,\s*([^,]+)/i.exec(s);
  if (mA) {
    info.audio = { codec: mA[1], sampleRate: parseInt(mA[2], 10), kanal: mA[3].trim() };
  }
  return info;
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'video/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  let fileObj = null;
  let dasar = null; // info dari elemen video (durasi, ukuran layar)
  let busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  const fmtDur = (d) => {
    if (!Number.isFinite(d) || d <= 0) return '-';
    const mnt = Math.floor(d / 60);
    const dtk = (d % 60).toFixed(1);
    return mnt > 0 ? mnt + ' menit ' + dtk + ' detik' : dtk + ' detik';
  };

  const tampilkan = (ff) => {
    let html = '<span class="ok">Detail video terbaca.</span>' +
      kv('Nama file', T.esc(fileObj.name)) +
      kv('Ukuran file', fmtBytes(fileObj.size));
    const durasi = (ff && ff.durasi) || (dasar && dasar.durasi) || 0;
    html += kv('Durasi', fmtDur(durasi));
    if (ff && ff.video) {
      html += kv('Format gambar', T.esc(ff.video.codec.toUpperCase())) +
        kv('Ukuran layar', ff.video.lebar + ' x ' + ff.video.tinggi) +
        kv('Gambar per detik', ff.video.fps ? ff.video.fps + ' fps' : '-');
    } else if (dasar && dasar.w) {
      html += kv('Ukuran layar', dasar.w + ' x ' + dasar.h);
    }
    if (ff && ff.audio) {
      html += kv('Format suara', T.esc(ff.audio.codec.toUpperCase())) +
        kv('Suara', T.esc(ff.audio.kanal) + ', ' + ff.audio.sampleRate + ' Hz');
    } else if (ff) {
      html += kv('Suara', 'tidak ada trek suara');
    }
    if (ff && ff.bitrate) html += kv('Bitrate keseluruhan', T.esc(ff.bitrate));
    T.show(outBox, html);
  };

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    dasar = null;
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(fileObj);
    const v = document.createElement('video');
    const fDipilih = fileObj;
    v.preload = 'metadata';
    v.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(v);
      if (fileObj !== fDipilih) { URL.revokeObjectURL(url); return; }
      dasar = { durasi: d, w: v.videoWidth || 0, h: v.videoHeight || 0 };
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', fmtDur(dasar.durasi)) +
        kv('Ukuran layar', dasar.w ? dasar.w + ' x ' + dasar.h : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      dasar = null;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Browser tidak bisa membaca video ini, tapi detail teknisnya tetap bisa dicoba lewat tombol di bawah.</p>');
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });

  const goBtn = T.btn('Lihat detail lengkap', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) {
      // Tanpa mesin ffmpeg, tampilkan info dasar dari browser saja.
      tampilkan(null);
      return;
    }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const inName = 'input' + ext;
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      // ffmpeg tanpa file tujuan hanya mencetak info lalu berhenti. Baris
      // log ditampung lewat listener, lalu diurai jadi info terstruktur.
      const barisLog = [];
      const onLog = ({ message }) => { if (message) barisLog.push(String(message)); };
      ffmpeg.on('log', onLog);
      try {
        setStage('Membaca detail teknis…', 50);
        await ffmpeg.exec(['-i', inName]);
      } catch (e) { /* ffmpeg -i memang berhenti tanpa file tujuan */ }
      try { ffmpeg.off('log', onLog); } catch (e) {}
      await cleanupFFmpeg(ffmpeg, [inName]);
      const ff = uraiInfoFFmpeg(barisLog.join('\n'));
      if (!ff.video && !ff.audio && !ff.durasi) {
        tampilkan(null);
        outBox.appendChild(T.el('<p class="hint" style="margin-top:8px">Detail teknis dari mesin tidak terbaca untuk file ini. Yang tampil hanya info dasar dari browser.</p>'));
        return;
      }
      tampilkan(ff);
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else {
        T.show(outBox, errBox(friendlyError(e)));
        const retry = T.btn('Coba lagi', () => goBtn.click());
        outBox.appendChild(retry);
      }
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);
  const cancelBtn = T.btn('Batalkan', () => { cancelFFmpeg(); });
  cancelBtn.hidden = true;

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lihat detail teknis sebuah video: format gambar dan suaranya, durasi, ukuran layar, dan gambar per detiknya. Berguna sebelum mengunggah atau mengedit.</p>'));
  root.appendChild(T.field('Pilih video', file, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Detail lengkap memakai mesin ' + CORE_SIZE_LABEL + ' yang diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
