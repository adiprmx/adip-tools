import { h as T, utils, LOCAL_NOTE } from '../../core.js';

// Halaman Ketik Fokus: halaman ketik kosong tanpa gangguan, lengkap
// dengan hitung kata, target kata, dan timer sesi. Tulisan tersimpan
// otomatis di browser ini saja, jadi tidak hilang bila halaman tertutup.
export const meta = {"id": "halaman-ketik-fokus", "name": "Halaman Ketik Fokus", "cat": "produktivitas", "icon": "✍️", "desc": "Halaman ketik kosong tanpa gangguan, lengkap dengan hitung kata.", "keywords": "ketik fokus,menulis tanpa gangguan,hitung kata,menulis,distraction free", "since": "6.19.0"};

const LS_TULISAN = 'adipTools_ketik-fokus_tulisan';
const LS_TARGET = 'adipTools_ketik-fokus_target';
const KECEPATAN_BACA = 200; // kata per menit, patokan umum membaca
const KECEPATAN_BICARA = 130; // kata per menit, patokan umum berbicara

// Hitung statistik tulisan. Murni, bisa diuji di Node.
export function hitungKata(teks) {
  const s = String(teks || '');
  const kata = s.trim() ? s.trim().split(/\s+/).length : 0;
  const karakter = s.length;
  const karakterTanpaSpasi = s.replace(/\s/g, '').length;
  const kalimat = s.trim() ? (s.match(/[^.!?]+[.!?]+["')\]]*\s*/g) || []).length || (s.trim() ? 1 : 0) : 0;
  const paragraf = s.trim() ? s.trim().split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  return {
    kata, karakter, karakterTanpaSpasi, kalimat, paragraf,
    menitBaca: kata ? Math.max(1, Math.round(kata / KECEPATAN_BACA)) : 0,
    menitBicara: kata ? Math.max(1, Math.round(kata / KECEPATAN_BICARA)) : 0,
  };
}

// Format durasi detik jadi "12:34". Murni, bisa diuji di Node.
export function fmtDurasi(detik) {
  const d = Math.max(0, Math.floor(Number(detik) || 0));
  const m = Math.floor(d / 60);
  const s = d % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export function render(root) {
  const teksI = document.createElement('textarea');
  teksI.className = 'inp';
  teksI.placeholder = 'Mulai mengetik di sini…';
  teksI.setAttribute('aria-label', 'Area menulis');
  teksI.style.cssText = 'width:100%;min-height:340px;resize:vertical;font-size:16px;line-height:1.8;padding:16px';
  const targetI = T.input('number', 'Target kata, misal 500');
  targetI.inputMode = 'numeric';
  targetI.min = '0';
  const statBox = T.out();
  const progresBox = T.out();
  const timerBox = T.out();
  const statusBox = T.out();

  let detikSesi = 0;
  let timerJalan = false;
  let timerId = null;
  let fokusAktif = false;

  try { teksI.value = localStorage.getItem(LS_TULISAN) || ''; } catch (e) {}
  try { targetI.value = localStorage.getItem(LS_TARGET) || ''; } catch (e) {}

  function simpan() {
    try {
      localStorage.setItem(LS_TULISAN, teksI.value);
      localStorage.setItem(LS_TARGET, targetI.value);
    } catch (e) {}
  }

  function catat() {
    const s = hitungKata(teksI.value);
    T.show(statBox, '<div class="row" style="flex-wrap:wrap;gap:8px 16px;font-size:13px">'
      + '<span style="white-space:nowrap"><b class="big" style="font-size:20px">' + T.fmt(s.kata) + '</b> kata</span>'
      + '<span class="dim" style="white-space:nowrap">' + T.fmt(s.karakter) + ' karakter</span>'
      + '<span class="dim" style="white-space:nowrap">' + T.fmt(s.kalimat) + ' kalimat</span>'
      + '<span class="dim" style="white-space:nowrap">' + T.fmt(s.paragraf) + ' paragraf</span>'
      + '<span class="dim" style="white-space:nowrap">Dibaca ±' + s.menitBaca + ' mnt</span>'
      + '</div>');
    const target = Math.max(0, parseInt(targetI.value, 10) || 0);
    if (target > 0) {
      const persen = Math.min(100, Math.round((s.kata / target) * 100));
      const sampai = s.kata >= target;
      T.show(progresBox, '<div style="margin-top:8px"><div style="height:8px;border-radius:99px;background:#ffffff14;overflow:hidden"><div style="height:100%;width:' + persen + '%;background:#fff;border-radius:99px"></div></div>'
        + '<div class="dim" style="font-size:12px;margin-top:4px">' + (sampai ? 'Target ' + T.fmt(target) + ' kata tercapai.' : T.fmt(s.kata) + ' dari ' + T.fmt(target) + ' kata (' + persen + '%).') + '</div></div>');
    } else {
      T.hide(progresBox);
    }
  }

  function catatTimer() {
    T.show(timerBox, '<span class="dim" style="font-size:13px">Waktu sesi: <b>' + fmtDurasi(detikSesi) + '</b> ' + (timerJalan ? '(berjalan)' : '(berhenti)') + '</span>');
  }

  function mulaiTimer() {
    if (timerJalan) return;
    timerJalan = true;
    timerId = setInterval(() => { detikSesi++; catatTimer(); }, 1000);
    catatTimer();
    timerB.textContent = 'Berhenti';
  }

  function berhentiTimer() {
    timerJalan = false;
    if (timerId) { clearInterval(timerId); timerId = null; }
    catatTimer();
    timerB.textContent = 'Mulai timer';
  }

  const timerB = T.btn('Mulai timer', () => { timerJalan ? berhentiTimer() : mulaiTimer(); });
  T.onLeave(() => { if (timerId) clearInterval(timerId); });

  let tundaSimpan = null;
  teksI.addEventListener('input', () => {
    catat();
    if (tundaSimpan) clearTimeout(tundaSimpan);
    tundaSimpan = setTimeout(simpan, 500);
  });
  targetI.addEventListener('input', () => { catat(); simpan(); });

  function unduh(ekstensi, mime) {
    if (!teksI.value.trim()) { T.toast('Tulisanmu masih kosong'); return; }
    T.dl('tulisan.' + ekstensi, teksI.value, mime);
    T.toast('Berhasil diunduh');
  }

  const wadah = T.el('<div></div>');
  const barisAksi = T.el('<div class="row" style="flex-wrap:wrap"></div>');
  barisAksi.appendChild(timerB);
  barisAksi.appendChild(T.btn('Unduh .txt', () => unduh('txt', 'text/plain;charset=utf-8')));
  barisAksi.appendChild(T.btn('Unduh .md', () => unduh('md', 'text/markdown;charset=utf-8')));
  barisAksi.appendChild(T.btn('Salin', () => {
    if (!teksI.value.trim()) { T.toast('Tulisanmu masih kosong'); return; }
    T.copy(teksI.value);
  }));
  barisAksi.appendChild(T.btn('Hapus tulisan', () => {
    if (!teksI.value) return;
    teksI.value = '';
    simpan();
    catat();
    T.toast('Tulisan dihapus');
  }));
  const fokusB = T.btn('Mode fokus', () => {
    fokusAktif = !fokusAktif;
    wadah.classList.toggle('mode-fokus', fokusAktif);
    document.querySelectorAll('.mode-fokus-sembunyi').forEach((n) => { n.style.display = fokusAktif ? 'none' : ''; });
    fokusB.textContent = fokusAktif ? 'Keluar mode fokus' : 'Mode fokus';
    if (fokusAktif) teksI.focus();
  });
  barisAksi.appendChild(fokusB);

  const kepala = T.el(`<p class="note mode-fokus-sembunyi">🔒 ${LOCAL_NOTE}</p>`);
  const petunjuk = T.el('<p class="note mode-fokus-sembunyi">Tulisan tersimpan otomatis di browser ini. Mode fokus menyembunyikan semua tombol supaya kamu bisa konsentrasi.</p>');

  wadah.appendChild(kepala);
  wadah.appendChild(petunjuk);
  wadah.appendChild(T.field('Target kata (boleh kosong)', targetI, 'Isi target kalau kamu menulis dengan patokan jumlah kata.'));
  wadah.appendChild(teksI);
  wadah.appendChild(statBox);
  wadah.appendChild(progresBox);
  wadah.appendChild(timerBox);
  wadah.appendChild(barisAksi);
  wadah.appendChild(statusBox);
  root.appendChild(wadah);
  catat();
  catatTimer();
}
