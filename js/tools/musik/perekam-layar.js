import { h as T, fmtBytes, errBox } from '../../core.js?v=6.13.0';

export const meta = {"id":"perekam-layar","name":"Perekam Layar","cat":"musik","icon":"🖥️","desc":"Rekam layar laptop atau HP beserta suaranya, lihat hasilnya, lalu unduh sebagai video WebM.","keywords":"rekam layar,screen recorder,tangkap layar,video layar,webm","since":"6.13.0"};

/* Perekam layar: getDisplayMedia + MediaRecorder. Audio layar (bila dipilih)
   dan mikrofon digabung jadi satu rekaman. Semua diproses di browser. */
const fmtDur = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60), d = s % 60;
  return (m < 10 ? '0' + m : m) + ':' + (d < 10 ? '0' + d : d);
};

export function render(root) {
  const didukung = typeof MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  const box = T.out();
  const videoEl = document.createElement('video');
  videoEl.controls = true;
  videoEl.playsInline = true;
  videoEl.style.cssText = 'width:100%;border-radius:10px;border:1px solid #ffffff20;background:#000;display:block;aspect-ratio:16/9';
  const durEl = T.el('<div style="font-size:28px;font-weight:700;text-align:center;letter-spacing:1px;font-variant-numeric:tabular-nums">00:00</div>');
  const statusEl = T.el('<p class="hint center" style="margin:4px 0 0">Siap merekam</p>');

  const cekAudioLayar = document.createElement('input');
  cekAudioLayar.type = 'checkbox'; cekAudioLayar.id = 'rekam-layar-audio'; cekAudioLayar.checked = true;
  cekAudioLayar.style.cssText = 'width:18px;height:18px;accent-color:#ff6f61;flex:none';
  const labAudioLayar = document.createElement('label');
  labAudioLayar.setAttribute('for', 'rekam-layar-audio');
  labAudioLayar.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer';
  labAudioLayar.appendChild(cekAudioLayar);
  labAudioLayar.appendChild(document.createTextNode('Rekam suara dari layar (bila tersedia di pilihan layar)'));

  const cekMic = document.createElement('input');
  cekMic.type = 'checkbox'; cekMic.id = 'rekam-layar-mic'; cekMic.checked = false;
  cekMic.style.cssText = 'width:18px;height:18px;accent-color:#ff6f61;flex:none';
  const labMic = document.createElement('label');
  labMic.setAttribute('for', 'rekam-layar-mic');
  labMic.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer';
  labMic.appendChild(cekMic);
  labMic.appendChild(document.createTextNode('Tambah suara dari mikrofon (untuk penjelasan sambil merekam)'));

  let displayStream = null, micStream = null, rec = null, chunks = [];
  let blob = null, blobUrl = null, t0 = 0, tickId = 0, durasiAkhir = 0;
  let recording = false;
  /* ditinggal: tool sudah ditinggal user (navigasi) — await yang baru
     selesai sesudah itu WAJIB dibuang, bukan dijadikan rekaman hantu.
     sedangMemulai: pemilih layar sedang terbuka — klik ke-2 ditolak. */
  let ditinggal = false, sedangMemulai = false;

  const hentikanSemuaTrack = () => {
    [displayStream, micStream].forEach((s) => {
      if (s) s.getTracks().forEach((t) => { try { t.stop(); } catch (e) {} });
    });
    displayStream = null; micStream = null;
  };

  const cleanup = () => {
    clearInterval(tickId);
    if (rec && recording) { try { rec.stop(); } catch (e) {} }
    hentikanSemuaTrack();
    recording = false;
  };
  /* onLeave dikuras app.js saat pindah route (runLeaveCbs). Wrapper ini
     menandai "sudah ditinggal" — cleanup() sendiri juga dipakai di jalur
     error, dan di sana flag TIDAK boleh diset (user masih di tool). */
  T.onLeave(() => { ditinggal = true; cleanup(); });

  const bRekam = T.btn('Mulai rekam layar', null, true);
  const bStop = T.btn('Berhenti', null);
  bStop.disabled = true;
  const bUnduh = T.btn('Unduh video WebM', () => {
    if (!blob) { T.toast('Belum ada rekaman'); return; }
    T.dl('rekaman-layar.webm', blob, blob.type || 'video/webm');
  });
  bUnduh.disabled = true;

  const pilihMime = () => {
    const kandidat = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (const m of kandidat) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
    }
    return '';
  };

  bRekam.addEventListener('click', async () => {
    if (!didukung) {
      T.show(box, errBox('Browser ini tidak mendukung perekaman layar. Coba Chrome, Edge, atau Firefox terbaru di laptop.'));
      return;
    }
    /* Guard klik ganda: tombol di-disable SEBELUM await (pemilih layar bisa
       terbuka lama; klik ke-2 selama itu bikin stream ke-2 yang bocor). */
    if (recording || sedangMemulai) return;
    sedangMemulai = true;
    bRekam.disabled = true;
    try {
      statusEl.textContent = 'Menunggu kamu memilih layar…';
      displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: cekAudioLayar.checked });
    } catch (e) {
      sedangMemulai = false;
      bRekam.disabled = false;
      statusEl.textContent = 'Perekaman dibatalkan';
      T.show(box, errBox('Perekaman layar dibatalkan atau tidak diizinkan. Pilih layar di jendela yang muncul, lalu coba lagi.'));
      return;
    }
    /* Guard rekaman hantu: pemilih diselesaikan SETELAH tool ditinggal —
       buang stream-nya, jangan mulai rekaman tanpa UI. */
    if (ditinggal) { hentikanSemuaTrack(); sedangMemulai = false; return; }

    // Mikrofon opsional: bila gagal, rekaman tetap jalan tanpa suara mikrofon.
    micStream = null;
    if (cekMic.checked) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        micStream = null;
        T.toast('Mikrofon tidak bisa dipakai, rekaman lanjut tanpa suara mikrofon');
      }
    }
    if (ditinggal) { hentikanSemuaTrack(); sedangMemulai = false; return; }

    const tracks = displayStream.getTracks().slice();
    if (micStream) tracks.push(...micStream.getAudioTracks());
    const gabungan = new MediaStream(tracks);

    chunks = [];
    blob = null;
    durasiAkhir = 0;
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    videoEl.removeAttribute('src');
    videoEl.muted = true;
    videoEl.srcObject = displayStream;
    try { await videoEl.play(); } catch (e) {}
    /* Guard rekaman hantu ke-3 (P4-11): play() tertunda lalu tool
       ditinggal — play() resolve sesudah cleanup() men-null-kan
       displayStream. Tanpa guard ini, kode lanjut membuat MediaRecorder
       yatim lalu crash di displayStream.getVideoTracks(). Buang stream
       dan berhenti, sama seperti dua guard di atas. */
    if (ditinggal) { hentikanSemuaTrack(); videoEl.srcObject = null; sedangMemulai = false; return; }
    bUnduh.disabled = true;
    T.hide(box);

    try {
      const mime = pilihMime();
      rec = mime ? new MediaRecorder(gabungan, { mimeType: mime }) : new MediaRecorder(gabungan);
    } catch (e) {
      cleanup();
      sedangMemulai = false;
      bRekam.disabled = false;
      videoEl.srcObject = null;
      T.show(box, errBox('Perekam tidak bisa dimulai di browser ini.'));
      statusEl.textContent = 'Perekam tidak bisa dimulai';
      return;
    }

    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = () => {
      recording = false;
      clearInterval(tickId);
      durasiAkhir = (Date.now() - t0) / 1000;
      videoEl.srcObject = null;
      videoEl.muted = false;
      hentikanSemuaTrack();
      blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
      blobUrl = URL.createObjectURL(blob);
      videoEl.src = blobUrl;
      statusEl.textContent = 'Rekaman selesai, putar dulu sebelum diunduh';
      bUnduh.disabled = false;
      bRekam.disabled = false;
      bStop.disabled = true;
      cekAudioLayar.disabled = false;
      cekMic.disabled = false;
      T.show(box,
        '<div class="kv"><span class="k">Durasi</span><span class="v"><b>' + fmtDur(durasiAkhir) + '</b></span></div>' +
        '<div class="kv"><span class="k">Ukuran video</span><span class="v"><b>' + fmtBytes(blob.size) + '</b></span></div>' +
        '<p class="hint">Video tersimpan sebagai WebM dan bisa diputar di browser atau pemutar video. Bila suaranya tidak ada, coba pilih tab browser saat memilih layar, atau aktifkan mikrofon.</p>');
    };

    // Bila user menekan "Berhenti berbagi" dari browser, akhiri rekaman dengan rapi.
    const vTrack = displayStream.getVideoTracks()[0];
    if (vTrack) {
      vTrack.addEventListener('ended', () => {
        if (rec && recording) { try { rec.stop(); } catch (e) {} }
      });
    }

    rec.start(250);
    recording = true;
    sedangMemulai = false;
    t0 = Date.now();
    durEl.textContent = '00:00';
    statusEl.textContent = '● Merekam… ketuk Berhenti kalau sudah cukup';
    tickId = setInterval(() => { durEl.textContent = fmtDur((Date.now() - t0) / 1000); }, 500);
    bRekam.disabled = true;
    bStop.disabled = false;
    cekAudioLayar.disabled = true;
    cekMic.disabled = true;
  });

  bStop.addEventListener('click', () => {
    if (rec && recording) { try { rec.stop(); } catch (e) {} }
  });

  root.appendChild(T.el('<p class="note">Diproses di browser, video tidak diunggah ke mana-mana.</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih layar, jendela, atau tab browser untuk direkam. Rekaman berhenti otomatis bila kamu menekan "Berhenti berbagi" di browser.</p>'));
  if (!didukung) {
    root.appendChild(T.el('<p class="err">Browser ini tidak mendukung perekaman layar (butuh getDisplayMedia dan MediaRecorder). Coba Chrome, Edge, atau Firefox terbaru di laptop.</p>'));
  }
  root.appendChild(durEl);
  root.appendChild(statusEl);
  root.appendChild(videoEl);
  root.appendChild(T.el('<div style="display:flex;flex-direction:column;gap:10px;margin-top:12px"></div>'));
  root.lastChild.appendChild(labAudioLayar);
  root.lastChild.appendChild(labMic);
  root.appendChild(T.row(bRekam, bStop));
  root.appendChild(T.row(bUnduh));
  root.appendChild(box);
}
