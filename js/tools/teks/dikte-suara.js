import { h as T, errBox } from '../../core.js?v=6.12.2';

export const meta = {"id":"dikte-suara","name":"Dikte Suara","cat":"teks","icon":"🗣️","desc":"Ubah ucapan jadi teks langsung di browser.","keywords":"dikte,suara,teks,speech,mengetik,ucapan","since":"6.11.0"};

/* Dikte suara via Web Speech API (SpeechRecognition). Jujur soal dukungan:
   Chrome/Edge (desktop + Android) dan Safari 14.1+ mendukung; Firefox belum.
   Di Chrome, suara dikirim ke layanan Google untuk dikenali (butuh internet). */
export function render(root) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR;
  const langSel = T.select([['id-ID', 'Bahasa Indonesia'], ['en-US', 'English (AS)'], ['en-GB', 'English (UK)']], 'id-ID');
  const hasilTa = T.ta(8, 'Hasil dikte muncul di sini…');
  hasilTa.readOnly = false;
  const liveEl = T.el('<p class="mut" style="font-size:14px;line-height:1.6;min-height:22px"></p>');
  const statusEl = T.el('<p class="hint center" style="margin:6px 0 0"></p>');
  const box = T.out();
  let rec = null, listening = false, finalText = '';

  const setStatus = (s) => { statusEl.textContent = s; };

  const bMulai = T.btn('Mulai bicara', null, true);
  const bStop = T.btn('Berhenti', null);
  bStop.disabled = true;

  const stop = () => {
    if (rec) { try { rec.stop(); } catch (e) {} }
  };

  bMulai.addEventListener('click', () => {
    if (!supported) {
      T.show(box, errBox('Browser ini tidak mendukung pengenalan suara. Coba Chrome atau Edge (komputer atau Android), atau Safari 14.1 ke atas.'));
      return;
    }
    if (listening) return;
    try {
      rec = new SR();
    } catch (e) {
      T.show(box, errBox('Pengenalan suara tidak bisa dimulai di browser ini.'));
      return;
    }
    rec.lang = langSel.value;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += (finalText ? ' ' : '') + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      hasilTa.value = finalText + (interim ? (finalText ? ' ' : '') + interim : '');
      liveEl.textContent = interim ? 'Mendengar: ' + interim : '';
    };
    rec.onerror = (ev) => {
      const err = ev.error || '';
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        T.show(box, errBox('Akses mikrofon ditolak. Izinkan mikrofon di pengaturan browser, lalu coba lagi.'));
      } else if (err === 'network') {
        T.show(box, errBox('Pengenalan suara butuh internet dan tidak bisa terhubung ke layanan browser. Periksa koneksi, lalu coba lagi.'));
      } else if (err === 'no-speech') {
        setStatus('Tidak ada suara yang terdengar, coba bicara lebih jelas.');
        return;
      } else if (err === 'aborted') {
        return;
      } else if (err === 'audio-capture') {
        T.show(box, errBox('Mikrofon tidak bisa dipakai. Pastikan mikrofon terpasang dan tidak dipakai aplikasi lain, lalu coba lagi.'));
      } else if (err === 'bad-grammar') {
        T.show(box, errBox('Pengaturan pengenalan suara tidak dikenali browser ini. Coba muat ulang halaman ini.'));
      } else if (err === 'language-not-supported') {
        T.show(box, errBox('Bahasa yang dipilih tidak didukung pengenalan suara di browser ini. Coba pilih bahasa lain.'));
      } else {
        // Fallback generik TANPA kode mentah (P2-R1-I1): kode error
        // SpeechRecognition (mis. 'audio-capture') tidak pernah tampil
        // apa adanya ke user.
        T.show(box, errBox('Terjadi kendala saat mendengarkan. Coba mulai lagi.'));
      }
    };
    rec.onend = () => {
      listening = false;
      bMulai.disabled = false;
      bStop.disabled = true;
      liveEl.textContent = '';
      if (finalText) setStatus('Selesai. Hasilnya bisa disalin atau diunduh di bawah.');
      else setStatus('Berhenti.');
    };
    try {
      rec.start();
      listening = true;
      bMulai.disabled = true;
      bStop.disabled = false;
      T.hide(box);
      setStatus('Mendengarkan… bicara seperti biasa, hasil muncul langsung di bawah.');
    } catch (e) {
      T.show(box, errBox('Pengenalan suara gagal dimulai. Coba muat ulang halaman ini.'));
    }
  });
  bStop.addEventListener('click', stop);
  T.onLeave(stop);

  const bSalin = T.copyBtn(() => hasilTa.value.trim(), 'Salin teks');
  const bUnduh = T.btn('Unduh .txt', () => {
    const t = hasilTa.value.trim();
    if (!t) { T.toast('Belum ada teks untuk diunduh'); return; }
    T.dl('dikte.txt', t, 'text/plain;charset=utf-8');
  });
  const bBersih = T.btn('Hapus teks', () => {
    finalText = '';
    hasilTa.value = '';
    liveEl.textContent = '';
    setStatus('');
  });

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Bicara, teksnya langsung muncul. Berjalan di <b>Chrome, Edge, dan Safari 14.1 ke atas</b>. Firefox dan sebagian browser lain belum mendukung fitur ini. Pengenalan suara memakai layanan browser, jadi butuh internet dan suara dikirim ke layanan tersebut untuk dikenali.</p>'));
  if (!supported) {
    root.appendChild(T.el('<p class="err">Browser yang dipakai sekarang tidak mendukung pengenalan suara. Coba buka halaman ini di Chrome atau Edge.</p>'));
  }
  root.appendChild(T.field('Bahasa bicara', langSel));
  root.appendChild(T.row(bMulai, bStop));
  root.appendChild(statusEl);
  root.appendChild(liveEl);
  root.appendChild(T.field('Hasil', hasilTa, 'Teks di sini bisa diedit langsung sebelum disalin.'));
  root.appendChild(T.row(bSalin, bUnduh, bBersih));
  root.appendChild(box);
}
