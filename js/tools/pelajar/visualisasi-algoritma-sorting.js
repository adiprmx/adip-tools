import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'visualisasi-algoritma-sorting', name: 'Visualisasi Algoritma Sorting', cat: 'pelajar', icon: '📊', desc: 'Lihat cara kerja bubble, insertion, selection, merge, dan quick sort lewat batang yang bergerak langkah demi langkah.', keywords: 'sorting,algoritma,bubble sort,insertion sort,selection sort,merge sort,quick sort,visualisasi,belajar coding', since: '6.17.0' };

// Tiap algoritma menghasilkan daftar langkah: { arr, banding: [i,j], tukar: [i,j], selesai: [i], pesan }.
// Langkah direkam dari array, jadi logikanya bisa diuji tanpa DOM.
export function langkahBubble(input) {
  const a = input.slice(), out = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      out.push({ arr: a.slice(), banding: [j, j + 1], pesan: 'Bandingkan ' + a[j] + ' dan ' + a[j + 1] + '.' });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        out.push({ arr: a.slice(), tukar: [j, j + 1], pesan: a[j + 1] + ' lebih besar, tukar posisinya.' });
      }
    }
    out.push({ arr: a.slice(), selesai: [n - 1 - i], pesan: 'Angka terbesar di putaran ini sudah di tempatnya.' });
  }
  out.push({ arr: a.slice(), selesai: a.map((_, i) => i), pesan: 'Selesai, semua sudah urut.' });
  return out;
}

export function langkahInsertion(input) {
  const a = input.slice(), out = [];
  for (let i = 1; i < a.length; i++) {
    const kunci = a[i];
    let j = i - 1;
    out.push({ arr: a.slice(), banding: [i], pesan: 'Ambil angka ' + kunci + ', cari tempatnya di kiri.' });
    while (j >= 0 && a[j] > kunci) {
      out.push({ arr: a.slice(), banding: [j, j + 1], pesan: a[j] + ' lebih besar dari ' + kunci + ', geser ke kanan.' });
      a[j + 1] = a[j];
      j--;
      out.push({ arr: a.slice(), tukar: [j + 1, j + 2], pesan: 'Geser ' + a[j + 1] + ' ke kanan.' });
    }
    a[j + 1] = kunci;
    out.push({ arr: a.slice(), selesai: [j + 1], pesan: 'Taruh ' + kunci + ' di posisinya.' });
  }
  out.push({ arr: a.slice(), selesai: a.map((_, i) => i), pesan: 'Selesai, semua sudah urut.' });
  return out;
}

export function langkahSelection(input) {
  const a = input.slice(), out = [];
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      out.push({ arr: a.slice(), banding: [min, j], pesan: 'Cari yang paling kecil: bandingkan ' + a[min] + ' dan ' + a[j] + '.' });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      out.push({ arr: a.slice(), tukar: [i, min], pesan: 'Tukar ' + a[i] + ' ke depan.' });
    }
    out.push({ arr: a.slice(), selesai: [i], pesan: 'Posisi ' + (i + 1) + ' sudah benar.' });
  }
  out.push({ arr: a.slice(), selesai: a.map((_, i) => i), pesan: 'Selesai, semua sudah urut.' });
  return out;
}

export function langkahMerge(input) {
  const a = input.slice(), out = [];
  const gabung = (lo, mid, hi) => {
    const kiri = a.slice(lo, mid + 1), kanan = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < kiri.length && j < kanan.length) {
      out.push({ arr: a.slice(), banding: [lo + i, mid + 1 + j], pesan: 'Bandingkan ' + kiri[i] + ' dan ' + kanan[j] + ', ambil yang lebih kecil.' });
      if (kiri[i] <= kanan[j]) a[k++] = kiri[i++];
      else a[k++] = kanan[j++];
      out.push({ arr: a.slice(), tukar: [k - 1], pesan: 'Taruh ' + a[k - 1] + ' di posisi ' + k + '.' });
    }
    while (i < kiri.length) { a[k++] = kiri[i++]; out.push({ arr: a.slice(), tukar: [k - 1], pesan: 'Sisa kiri dipindah.' }); }
    while (j < kanan.length) { a[k++] = kanan[j++]; out.push({ arr: a.slice(), tukar: [k - 1], pesan: 'Sisa kanan dipindah.' }); }
  };
  const bagi = (lo, hi) => {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    out.push({ arr: a.slice(), pesan: 'Bagi jadi dua: posisi ' + (lo + 1) + ' sampai ' + (mid + 1) + ' dan ' + (mid + 2) + ' sampai ' + (hi + 1) + '.' });
    bagi(lo, mid);
    bagi(mid + 1, hi);
    gabung(lo, mid, hi);
  };
  bagi(0, a.length - 1);
  out.push({ arr: a.slice(), selesai: a.map((_, i) => i), pesan: 'Selesai, semua sudah urut.' });
  return out;
}

export function langkahQuick(input) {
  const a = input.slice(), out = [];
  const partisi = (lo, hi) => {
    const pivot = a[hi];
    let i = lo - 1;
    out.push({ arr: a.slice(), banding: [hi], pesan: 'Patokan (pivot): ' + pivot + '. Yang lebih kecil pindah ke kiri patokan.' });
    for (let j = lo; j < hi; j++) {
      out.push({ arr: a.slice(), banding: [j, hi], pesan: 'Bandingkan ' + a[j] + ' dengan patokan ' + pivot + '.' });
      if (a[j] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        out.push({ arr: a.slice(), tukar: [i, j], pesan: a[i] + ' lebih kecil, pindah ke kiri.' });
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    out.push({ arr: a.slice(), selesai: [i + 1], pesan: 'Patokan ' + pivot + ' sudah di tempatnya.' });
    return i + 1;
  };
  const urut = (lo, hi) => {
    if (lo >= hi) return;
    const p = partisi(lo, hi);
    urut(lo, p - 1);
    urut(p + 1, hi);
  };
  urut(0, a.length - 1);
  out.push({ arr: a.slice(), selesai: a.map((_, i) => i), pesan: 'Selesai, semua sudah urut.' });
  return out;
}

export const ALGORITMA = {
  bubble: { nama: 'Bubble Sort', fn: langkahBubble, jelas: 'Bandingkan pasangan sebelah-sebelahan, yang besar menggelembung ke kanan.' },
  insertion: { nama: 'Insertion Sort', fn: langkahInsertion, jelas: 'Ambil satu angka, selipkan ke tempat yang benar di bagian kiri yang sudah urut.' },
  selection: { nama: 'Selection Sort', fn: langkahSelection, jelas: 'Cari angka paling kecil, taruh paling depan. Ulangi untuk sisanya.' },
  merge: { nama: 'Merge Sort', fn: langkahMerge, jelas: 'Bagi daftar jadi dua sampai tinggal satu, lalu gabung lagi sambil diurutkan.' },
  quick: { nama: 'Quick Sort', fn: langkahQuick, jelas: 'Pilih satu patokan, pisahkan yang lebih kecil ke kiri dan yang lebih besar ke kanan.' },
};

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.sv-panggung{display:flex;align-items:flex-end;gap:3px;height:220px;background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:12px;margin:12px 0;overflow:hidden}' +
    '.sv-batang{flex:1;background:#8a7f70;border-radius:4px 4px 0 0;min-width:4px;transition:height .18s ease,background .12s}' +
    '.sv-batang.banding{background:#ffd166}' +
    '.sv-batang.tukar{background:#ff6f61}' +
    '.sv-batang.selesai{background:#2e7d4f}' +
    '.sv-pesan{min-height:44px;font-size:14px;line-height:1.5}' +
    '@media (prefers-reduced-motion:reduce){.sv-batang{transition:none}}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Pilih cara mengurutkan, lalu tekan Mainkan. Batang kuning sedang dibandingkan, batang coral sedang dipindah, batang hijau sudah di tempatnya.</p>'));

  const algoSel = T.select(Object.entries(ALGORITMA).map(([k, v]) => [k, v.nama]), 'bubble');
  const jelasEl = T.el('<p class="hint"></p>');
  const jumlahSel = T.select([['8', '8 angka'], ['12', '12 angka'], ['20', '20 angka'], ['30', '30 angka']], '12');
  const kecepatanSel = T.select([['600', 'Pelan'], ['300', 'Sedang'], ['120', 'Cepat'], ['40', 'Sangat cepat']], '300');
  const angkaI = T.input('text', 'Atau tulis angkamu sendiri, pisahkan koma. Contoh: 5, 2, 9, 1');

  const panggung = T.el('<div class="sv-panggung"></div>');
  const pesanEl = T.el('<p class="sv-pesan" aria-live="polite"></p>');
  const statEl = T.el('<p class="hint"></p>');

  let langkah = [], idx = 0, timer = null, sedangJalan = false;
  let bandingTotal = 0, tukarTotal = 0;

  function acakAngka(n) {
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.map((v) => v * 3 + Math.floor(Math.random() * 3));
  }

  function gambar() {
    const s = langkah[idx] || { arr: [] };
    const maks = Math.max(...s.arr, 1);
    panggung.innerHTML = '';
    s.arr.forEach((v, i) => {
      const b = document.createElement('div');
      b.className = 'sv-batang';
      b.style.height = Math.max(6, (v / maks) * 100) + '%';
      b.title = String(v);
      if (s.banding && s.banding.includes(i)) b.classList.add('banding');
      if (s.tukar && s.tukar.includes(i)) b.classList.add('tukar');
      if (s.selesai && s.selesai.includes(i)) b.classList.add('selesai');
      panggung.appendChild(b);
    });
    pesanEl.textContent = s.pesan || '';
    statEl.textContent = 'Langkah ' + (idx + 1) + ' dari ' + langkah.length + ' · Dibandingkan ' + bandingTotal + ' kali · Dipindah ' + tukarTotal + ' kali';
  }

  function hitungStatSampai(i) {
    bandingTotal = 0; tukarTotal = 0;
    for (let k = 0; k <= i && k < langkah.length; k++) {
      if (langkah[k].banding) bandingTotal++;
      if (langkah[k].tukar) tukarTotal++;
    }
  }

  function siapkan() {
    berhenti();
    let awal;
    const tulis = angkaI.value.trim();
    if (tulis) {
      awal = tulis.split(/[,;\s]+/).map((x) => Number(x)).filter((v) => isFinite(v));
      if (awal.length < 2 || awal.length > 40) { T.toast('Tulis 2 sampai 40 angka, pisahkan dengan koma'); return; }
      if (awal.some((v) => v <= 0)) { T.toast('Angkanya harus lebih dari 0'); return; }
    } else {
      awal = acakAngka(parseInt(jumlahSel.value, 10));
    }
    langkah = ALGORITMA[algoSel.value].fn(awal);
    idx = 0;
    hitungStatSampai(0);
    gambar();
    jelasEl.textContent = ALGORITMA[algoSel.value].jelas;
  }

  function maju() {
    if (idx >= langkah.length - 1) { berhenti(); return; }
    idx++;
    hitungStatSampai(idx);
    gambar();
  }
  function mundur() {
    if (idx <= 0) return;
    idx--;
    hitungStatSampai(idx);
    gambar();
  }
  function mainkan() {
    if (sedangJalan || !langkah.length) return;
    if (idx >= langkah.length - 1) { idx = 0; hitungStatSampai(0); gambar(); }
    sedangJalan = true;
    btnMain.textContent = 'Jeda';
    const jeda = parseInt(kecepatanSel.value, 10);
    timer = setInterval(() => {
      if (idx >= langkah.length - 1) { berhenti(); return; }
      maju();
    }, jeda);
  }
  function berhenti() {
    if (timer) { clearInterval(timer); timer = null; }
    sedangJalan = false;
    if (btnMain) btnMain.textContent = 'Mainkan';
  }
  onLeave(berhenti);

  const btnMain = T.btn('Mainkan', () => (sedangJalan ? berhenti() : mainkan()), true);
  const btnAcak = T.btn('Angka baru', () => { angkaI.value = ''; siapkan(); });
  const btnLangkah = T.btn('Satu langkah', () => { berhenti(); maju(); });
  const btnMundur = T.btn('Mundur', () => { berhenti(); mundur(); });

  algoSel.addEventListener('change', siapkan);
  jumlahSel.addEventListener('change', () => { angkaI.value = ''; siapkan(); });
  kecepatanSel.addEventListener('change', () => { if (sedangJalan) { berhenti(); mainkan(); } });

  root.append(
    T.field('Cara mengurutkan', algoSel),
    jelasEl,
    T.grid2(T.field('Jumlah angka', jumlahSel), T.field('Kecepatan', kecepatanSel)),
    T.field('Angka sendiri (opsional)', angkaI),
    T.row(btnAcak, btnMain, btnLangkah, btnMundur),
    panggung,
    pesanEl,
    statEl,
  );
  siapkan();
}
