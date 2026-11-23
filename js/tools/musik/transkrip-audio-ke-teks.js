import { h as T, errBox } from '../../core.js';

export const meta = {"id": "transkrip-audio-ke-teks", "name": "Transkrip Audio ke Teks", "cat": "musik", "icon": "📝", "desc": "Ubah suara jadi tulisan dengan pengenal suara bawaan browser.", "keywords": "transkrip,audio,teks,suara,tulisan,podcast", "since": "6.16.0", "online": true};

export function render(root) {
  // Pengenal suara bawaan browser (Web Speech API). Jujur soal batasnya:
  // Chrome/Edge mengirim suara ke layanan Google untuk dikenali, jadi
  // butuh internet dan bukan proses offline. Firefox/Safari tidak
  // menyediakan API ini, jadi tool menampilkan penjelasan, bukan
  // berpura-pura jalan. API ini hanya mendengar dari mikrofon, bukan
  // membaca file audio langsung.
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = typeof SR === 'function';

  const langSel = T.select([
    ['id-ID', 'Bahasa Indonesia'],
    ['en-US', 'Inggris (Amerika)'],
    ['en-GB', 'Inggris (Britania)'],
    ['ms-MY', 'Melayu'],
    ['jv-ID', 'Jawa'],
  ], 'id-ID');
  const statusBox = T.out();
  const outBox = T.out();
  const interimBox = T.out();
  const hasilTa = T.ta(8, 'Hasil ketikan akan muncul di sini.', '');
  hasilTa.readOnly = true;
  hasilTa.style.whiteSpace = 'pre-wrap';

  let rec = null;
  let listening = false;
  let finals = '';
  let restarts = 0;
  let lastStartAt = 0;
  let lastError = '';

  const setStatus = (html) => T.show(statusBox, html);
  /* Saat error muncul, status "Mendengarkan…" dan teks sementara harus
     hilang — kalau tidak, layar menampilkan status jalan bersama kotak
     error (temuan E2E v6.16.0). */
  const showError = (msg) => {
    T.hide(statusBox);
    T.hide(interimBox);
    T.show(outBox, errBox(msg));
  };
  const refreshHasil = (interim) => {
    hasilTa.value = finals + (interim ? (finals ? ' ' : '') + interim : '');
  };
  const updateButtons = () => {
    startBtn.disabled = !supported || listening;
    stopBtn.disabled = !listening;
  };

  const startBtn = T.btn('Mulai mendengarkan', () => {
    if (!supported || listening) return;
    lastError = '';
    finals = hasilTa.value;
    restarts = 0;
    listening = true;
    updateButtons();
    T.hide(outBox);
    setStatus('<span class="dim">Mendengarkan… Bicara ke mikrofon, atau putar audionya dekat mikrofon.</span>');
    startRec();
  }, true);
  const stopBtn = T.btn('Berhenti', () => {
    listening = false;
    updateButtons();
    if (rec) { try { rec.stop(); } catch (e) {} }
    setStatus('<span class="dim">Berhenti. Hasil ketikan di bawah bisa disalin atau diunduh.</span>');
  });
  const clearBtn = T.btn('Bersihkan hasil', () => {
    finals = '';
    hasilTa.value = '';
    T.hide(interimBox);
  });
  const copyBtn = T.copyBtn(() => hasilTa.value, 'Salin teks');
  const dlBtn = T.dlBtn('transkrip.txt', () => hasilTa.value, 'text/plain', 'Unduh .txt');

  const startRec = () => {
    try {
      rec = new SR();
    } catch (e) {
      listening = false;
      updateButtons();
      showError('Pengenal suara tidak bisa dimulai di browser ini. Coba Chrome atau Edge versi terbaru.');
      return;
    }
    rec.lang = langSel.value;
    rec.continuous = true;
    rec.interimResults = true;
    lastStartAt = Date.now();
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finals += (finals ? ' ' : '') + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      refreshHasil(interim);
      if (interim) T.show(interimBox, '<p class="dim" style="font-size:13px;line-height:1.6;margin:0">Sedang didengar: ' + T.esc(interim) + '</p>');
      else T.hide(interimBox);
    };
    rec.onerror = (ev) => {
      const code = ev && ev.error ? String(ev.error) : '';
      lastError = code;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        listening = false;
        updateButtons();
        showError('Mikrofon tidak diizinkan. Izinkan akses mikrofon di browser, lalu tekan Mulai lagi.');
      } else if (code === 'audio-capture') {
        listening = false;
        updateButtons();
        showError('Tidak ada mikrofon yang terdeteksi di perangkat ini.');
      } else if (code === 'network') {
        listening = false;
        updateButtons();
        showError('Pengenal suara butuh internet dan tidak bisa terhubung. Cek koneksi, lalu coba lagi.');
      }
      // 'no-speech' dan 'aborted' tidak ditampilkan: normal saat jeda
      // bicara, dan pengenal akan jalan lagi lewat onend.
    };
    rec.onend = () => {
      if (!listening) return;
      // Chrome berhenti sendiri setelah jeda hening. Nyalakan lagi
      // selama pengguna belum menekan Berhenti. Pengaman: bila
      // berhenti kurang dari setengah detik setelah mulai berulang
      // kali, berarti ada masalah, jangan putar tanpa henti.
      if (Date.now() - lastStartAt < 500) {
        restarts += 1;
        if (restarts >= 3) {
          listening = false;
          updateButtons();
          showError('Pengenal suara berhenti berulang kali. Coba muat ulang halaman, atau pakai Chrome versi terbaru.');
          return;
        }
      } else {
        restarts = 0;
      }
      startRec();
    };
    try {
      rec.start();
    } catch (e) {
      listening = false;
      updateButtons();
      showError('Pengenal suara tidak bisa dimulai. Coba muat ulang halaman.');
    }
  };

  T.onLeave(() => {
    listening = false;
    if (rec) { try { rec.stop(); } catch (e) {} }
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah suara jadi tulisan. Tekan Mulai, lalu bicara ke mikrofon. Untuk rekaman yang sudah jadi file, putar audionya lewat pengeras suara di dekat mikrofon.</p>'));
  root.appendChild(T.field('Bahasa yang diucapkan', langSel));
  root.appendChild(T.row(startBtn, stopBtn, clearBtn));
  root.appendChild(statusBox);
  root.appendChild(interimBox);
  root.appendChild(T.field('Hasil ketikan', hasilTa));
  root.appendChild(T.row(copyBtn, dlBtn));
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Batas yang perlu diketahui: tool ini memakai pengenal suara bawaan Chrome atau Edge, jadi hanya jalan di browser itu dan butuh internet. Suara dikirim ke layanan Google untuk dikenali, bukan diproses offline di perangkatmu. Hasilnya tidak selalu tepat, terutama bila suara tidak jelas, ada suara lain, atau pembicara berganti ganti.</p>'));

  if (!supported) {
    showError('Browser ini tidak punya pengenal suara bawaan. Tool ini hanya jalan di Chrome atau Edge di komputer dan Android. Firefox dan Safari belum mendukungnya.');
  }
  updateButtons();
}
