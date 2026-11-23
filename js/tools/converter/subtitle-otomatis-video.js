import { h as T, kv, errBox, utils } from '../../core.js';

export const meta = {"id": "subtitle-otomatis-video", "name": "Subtitle Otomatis Video", "cat": "converter", "icon": "💬", "desc": "Buat file subtitle SRT dari suara di video.", "keywords": "subtitle,srt,video,otomatis,transkrip,suara", "since": "6.19.0", "online": true};

// Satu baris subtitle: mulai dan akhir dalam milidetik. Fungsi murni.
export function buatCue(mulaiMs, akhirMs, teks) {
  const mulai = Math.max(0, Math.floor(mulaiMs) || 0);
  let akhir = Math.floor(akhirMs) || 0;
  if (akhir <= mulai) akhir = mulai + 1000;
  return { start: mulai, end: akhir, text: String(teks || '').trim() };
}

export function render(root) {
  // Pengenal suara bawaan browser (Web Speech API). Jujur soal batasnya:
  // Chrome/Edge mengirim suara ke layanan Google untuk dikenali, jadi butuh
  // internet dan bukan proses offline. API ini hanya mendengar dari
  // mikrofon, bukan membaca file video langsung: video diputar lewat
  // speaker, mikrofon menangkap suaranya. Pakai speaker, bukan earphone.
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const didukung = typeof SR === 'function';

  const fi = T.input('file');
  fi.accept = 'video/*';
  const langSel = T.select([
    ['id-ID', 'Bahasa Indonesia'],
    ['en-US', 'Inggris (Amerika)'],
    ['en-GB', 'Inggris (Britania)'],
    ['ms-MY', 'Melayu'],
    ['jv-ID', 'Jawa'],
  ], 'id-ID');
  const videoWrap = T.el('<div hidden></div>');
  const video = document.createElement('video');
  video.controls = true;
  video.setAttribute('playsinline', '');
  video.style.cssText = 'display:block;width:100%;border-radius:12px;background:#000;max-height:360px';
  videoWrap.appendChild(video);
  const statusBox = T.out();
  const cueBox = T.out();
  const outBox = T.out();

  let rec = null, jalan = false, cues = [], mulaiCue = {}, mulaiJalan = false;
  let restartTimer = null;

  const gambarCue = () => {
    if (!cues.length) { T.hide(cueBox); return; }
    const daftar = cues.map((c, i) =>
      '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #27272a">' +
      '<span class="dim" style="min-width:110px">' + utils.fmtSrt(c.start) + '</span>' +
      '<span style="flex:1;line-height:1.5">' + T.esc(c.text) + '</span></div>').join('');
    T.show(cueBox, '<p class="dim" style="font-size:13px;margin:0 0 4px">Subtitle yang sudah dikenali (' + cues.length + ' baris):</p>' + daftar);
  };

  const mulaiDengar = () => {
    if (!didukung || !jalan) return;
    try { rec = new SR(); } catch (e) { return; }
    rec.lang = langSel.value;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (ev) => {
      const sekarang = Math.floor(video.currentTime * 1000);
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const hasil = ev.results[i];
        if (mulaiCue[i] == null) mulaiCue[i] = sekarang;
        if (hasil.isFinal) {
          const teks = (hasil[0] && hasil[0].transcript || '').trim();
          if (teks) {
            cues.push(buatCue(mulaiCue[i], sekarang, teks));
            gambarCue();
          }
          delete mulaiCue[i];
        }
      }
    };
    rec.onerror = (ev) => {
      const err = (ev && ev.error) || '';
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        berhenti('Mikrofon tidak diizinkan. Izinkan akses mikrofon di browser, lalu coba lagi.');
      }
    };
    rec.onend = () => {
      if (!jalan) return;
      if (video.paused || video.ended) { berhenti(); return; }
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => { if (jalan) mulaiDengar(); }, 300);
    };
    try { rec.start(); } catch (e) {}
  };

  const berhenti = (pesan) => {
    jalan = false;
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
    if (video && !video.paused) video.pause();
    mulaiBtn.disabled = false;
    berhentiBtn.disabled = true;
    if (pesan) T.show(statusBox, errBox(pesan));
    else if (cues.length) T.show(statusBox, '<span class="ok">Selesai. ' + cues.length + ' baris subtitle dikenali.</span>');
    else T.show(statusBox, '<span class="dim">Berhenti. Belum ada suara yang dikenali.</span>');
    if (cues.length) {
      T.show(outBox, '');
      outBox.appendChild(T.row(
        T.dlBtn((video.dataset.base || 'video') + '.srt', () => utils.toSrt(cues), 'text/plain;charset=utf-8', 'Unduh SRT'),
        T.copyBtn(() => cues.map((c) => c.text).join('\n'), 'Salin teksnya saja'),
      ));
    }
  };

  const mulai = async () => {
    if (!video.src) { T.show(statusBox, errBox('Pilih dulu file videonya.')); return; }
    if (!didukung) { T.show(statusBox, errBox('Browser ini tidak punya pengenal suara bawaan. Tool ini hanya jalan di Chrome atau Edge.')); return; }
    cues = [];
    mulaiCue = {};
    T.hide(outBox);
    T.hide(cueBox);
    jalan = true;
    mulaiBtn.disabled = true;
    berhentiBtn.disabled = false;
    T.show(statusBox, '<span class="dim">Mendengarkan… putar video sampai habis. Jangan pakai earphone, suara video harus keluar dari speaker supaya tertangkap mikrofon.</span>');
    try { await video.play(); } catch (e) {}
    mulaiDengar();
  };

  const mulaiBtn = T.btn('Mulai buat subtitle', mulai, true);
  const berhentiBtn = T.btn('Berhenti', () => berhenti());
  berhentiBtn.disabled = true;

  video.addEventListener('ended', () => { if (jalan) berhenti(); });
  video.addEventListener('pause', () => { if (jalan && !video.ended) berhenti(); });

  fi.addEventListener('change', () => {
    const f = fi.files && fi.files[0] ? fi.files[0] : null;
    if (jalan) berhenti();
    cues = [];
    T.hide(cueBox); T.hide(outBox); T.hide(statusBox);
    if (!f) { videoWrap.hidden = true; video.removeAttribute('src'); video.load(); return; }
    video.dataset.base = f.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    video.src = URL.createObjectURL(f);
    videoWrap.hidden = false;
  });

  T.onLeave(() => {
    jalan = false;
    if (restartTimer) clearTimeout(restartTimer);
    if (rec) { try { rec.stop(); } catch (e) {} }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Video diputar sambil pengenal suara browser mendengarkan lewat mikrofon, tiap kalimat yang dikenali dicatat beserta waktunya jadi file SRT. Hanya jalan di Chrome atau Edge, butuh internet, dan hasilnya tergantung kejelasan suara. Ini bukan proses offline: Chrome mengirim suara ke layanan Google untuk dikenali.</p>'));
  if (!didukung) {
    root.appendChild(T.el('<p class="err">Browser ini tidak punya pengenal suara bawaan. Buka halaman ini di Chrome atau Edge.</p>'));
  }
  root.appendChild(T.field('Pilih file video', fi));
  root.appendChild(T.field('Bahasa yang diucapkan di video', langSel));
  root.appendChild(videoWrap);
  root.appendChild(T.row(mulaiBtn, berhentiBtn));
  root.appendChild(statusBox);
  root.appendChild(cueBox);
  root.appendChild(outBox);
}
