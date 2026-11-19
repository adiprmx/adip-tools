import { h as T, utils, kv } from '../../core.js';
import { polaRegexBerbahaya } from '../../regex-aman.js';

export const meta = {"id": "cari-ganti-teks", "name": "Cari & Ganti Teks", "cat": "teks", "icon": "🔁", "desc": "Ganti massal kata atau frasa di teks, mode biasa atau pola regex, dengan hitungan penggantian dan pratinjau hasil.", "keywords": "cari ganti,find replace,teks,regex,ganti kata,massal", "since": "6.13.0"};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Deteksi kuantifer bersarang — pola seperti (a+)+, (a*)*, (\w+)+ — yang
// membuat mesin regex mencoba kombinasi secara eksponensial (ReDoS RT2-09:
// (a+)+$ pada 'a'×28 + '!' = 29,6 dtk, n=30 ≈ 2 menit). Pemindai linear:
// kelas karakter [...] dan escape \x dilewati supaya tidak salah baca,
// lalu tiap grup (...) yang diikuti kuantifer dicek isi kuantifernya.
// Awalan grup (?:, (?=, (?!, (?<nama> bukan kuantifer — dikecualikan.
function adaKuantiferBersarang(pola) {
  let bersih = '';
  for (let i = 0; i < pola.length; i++) {
    const c = pola[i];
    if (c === '\\') { i++; continue; }
    if (c === '[') {
      i++;
      if (pola[i] === '^') i++;
      if (pola[i] === ']') i++;
      while (i < pola.length && pola[i] !== ']') { if (pola[i] === '\\') i++; i++; }
      continue;
    }
    bersih += c;
  }
  const tumpuk = [];
  for (let i = 0; i < bersih.length; i++) {
    const c = bersih[i];
    if (c === '(') { tumpuk.push(i); continue; }
    if (c !== ')') continue;
    const awal = tumpuk.pop();
    if (awal == null) continue;
    let isi = bersih.slice(awal + 1, i);
    // Buang awalan non-capturing / lookahead / grup bernama.
    if (isi.startsWith('?:') || isi.startsWith('?=') || isi.startsWith('?!')) isi = isi.slice(2);
    else if (isi.startsWith('?<')) { const tutup = isi.indexOf('>'); if (tutup !== -1) isi = isi.slice(tutup + 1); }
    const sesudah = bersih[i + 1];
    if ((sesudah === '+' || sesudah === '*' || sesudah === '{') && /[+*?{]/.test(isi)) return true;
  }
  return false;
}

// Pemindai pola regex berbahaya (ReDoS) tinggal di js/regex-aman.js (G4 C1G4).
// Pemindai lama adaKuantiferBersarang di atas TETAP dipakai (OR): semua
// penolakan lama dipertahankan (termasuk backref yang tertolak insidental).

// Batas mode regex (RT2-09): pola & teks dibatasi supaya pencocokan
// sinkron tidak bisa mengunci tab berlama-lama. Mode literal tidak
// dibatasi pola (escapeRegex membuatnya aman) — hanya teksnya.
const MAKS_TEKS_REGEX = 200000;
const MAKS_POLA_REGEX = 500;
// P4-13: pratinjau hasil dipotong di 200 ribu karakter — render <pre>
// hasil ekspansi literal 10 MB membekukan tab 6,5 dtk. Salin/pakai-hasil
// tetap memakai hasil UTUH (hasilTerakhir), hanya tampilannya dipotong.
const MAKS_TAMPIL_HASIL = 200000;

// Mengembalikan { hasil, jumlah } atau { error: 'pesan ramah' }.
function cariGanti(teks, cari, ganti, opts) {
  opts = opts || {};
  if (!cari) return { error: 'Tulis dulu kata atau pola yang mau dicari.' };
  if (opts.regex) {
    if (cari.length > MAKS_POLA_REGEX) return { error: 'Polanya terlalu panjang (maksimal 500 karakter) — coba pola yang lebih pendek.' };
    if (String(teks).length > MAKS_TEKS_REGEX) return { error: 'Teksnya terlalu panjang untuk mode regex (maksimal 200.000 karakter) — potong dulu teksnya, atau pakai mode teks biasa.' };
    if (adaKuantiferBersarang(cari)) return { error: 'Polanya bisa membuat browser macet (kuantifer di dalam kuantifer, mis. (a+)+). Coba pola yang lebih sederhana, mis. a+ saja.' };
    if (polaRegexBerbahaya(cari)) return { error: 'Polanya bisa membuat browser macet (pilihan di dalam pola yang tumpang tindih, mis. (a|b|ab)+ — tiap huruf bisa cocok dengan beberapa cara sekaligus). Coba pisahkan pilihannya atau pakai pola yang lebih sederhana.' };
  }
  let pola;
  try {
    const sumber = opts.regex ? cari : escapeRegex(cari);
    pola = new RegExp(sumber, 'g' + (opts.caseSensitive ? '' : 'i'));
  } catch (e) {
    return { error: 'Polanya belum benar — cek lagi tanda kurung dan karakter khususnya. Contoh pola yang benar: \\d+ untuk angka, \\b\\w+\\b untuk kata.' };
  }
  const cocok = String(teks).match(pola);
  const jumlah = cocok ? cocok.length : 0;
  let hasil;
  try {
    hasil = String(teks).replace(pola, opts.regex ? ganti : ganti.replace(/\$/g, '$$$$'));
  } catch (e) {
    return { error: 'Teks penggantinya belum bisa dipakai — cek lagi bila memakai $1, $2, dan kawan-kawan.' };
  }
  return { hasil, jumlah };
}

utils.cariGantiTeks = cariGanti;

export function render(root) {
  const taIn = T.ta(8, 'Tempel teksmu di sini…', '');
  const cariI = T.input('text', 'Kata atau frasa yang dicari', '');
  const gantiI = T.input('text', 'Ganti dengan (boleh dikosongkan untuk menghapus)', '');
  const modeI = T.select([
    ['literal', 'Teks biasa (cocok persis)'],
    ['regex', 'Pola regex (untuk yang sudah paham regex)'],
  ], 'literal');
  const caseI = T.input('checkbox', '');
  const box = T.out();
  const statBox = T.out();
  let hasilTerakhir = '';

  const proses = () => {
    const r = cariGanti(taIn.value, cariI.value, gantiI.value, {
      regex: modeI.value === 'regex',
      caseSensitive: caseI.checked,
    });
    if (r.error) {
      T.show(statBox, '<span class="err">' + T.esc(r.error) + '</span>');
      T.show(box, '');
      hasilTerakhir = '';
      return;
    }
    hasilTerakhir = r.hasil;
    T.show(statBox,
      kv('Ditemukan & diganti', T.fmt(r.jumlah) + ' kali') +
      kv('Panjang teks awal', T.fmt(taIn.value.length) + ' karakter') +
      kv('Panjang teks hasil', T.fmt(r.hasil.length) + ' karakter'));
    const tampilHasil = r.hasil.length > MAKS_TAMPIL_HASIL
      ? r.hasil.slice(0, MAKS_TAMPIL_HASIL) + '\n… (pratinjau dipotong: ' + T.fmt(r.hasil.length - MAKS_TAMPIL_HASIL) + ' karakter lainnya tidak ditampilkan — salin hasil untuk versi lengkap)'
      : r.hasil;
    T.show(box, '<pre class="pre">' + T.esc(tampilHasil) + '</pre>');
  };

  const salin = () => {
    if (!hasilTerakhir && !taIn.value) { T.toast('Belum ada hasil yang bisa disalin.'); return; }
    T.copy(hasilTerakhir);
  };

  const pakaiHasil = () => {
    if (!hasilTerakhir && !taIn.value) { T.toast('Belum ada hasil yang bisa dipakai.'); return; }
    taIn.value = hasilTerakhir;
    proses();
    T.toast('Hasilnya sudah jadi teks awal — bisa dicari-ganti lagi.');
  };

  const chkWrap = T.el('<label class="chk" style="display:flex;gap:8px;align-items:center"></label>');
  chkWrap.appendChild(caseI);
  chkWrap.appendChild(document.createTextNode(' Bedakan huruf besar dan kecil'));

  root.appendChild(T.el('<p class="note">Ganti kata atau frasa di seluruh teks sekaligus. Tulis yang dicari, tulis penggantinya, dan lihat pratinjau hasilnya sebelum disalin.</p>'));
  root.appendChild(T.field('Teks awal', taIn));
  root.appendChild(T.grid2(
    T.field('Cari', cariI),
    T.field('Ganti dengan', gantiI)
  ));
  root.appendChild(T.field('Mode pencarian', modeI, 'Mode regex: pakai pola seperti \\d+ (angka) atau [A-Z]+ (huruf besar). Di teks pengganti, $1 artinya hasil tangkapan pertama.'));
  root.appendChild(T.field('Opsi', chkWrap));
  root.appendChild(T.row(
    T.btn('Cari & Ganti', proses, true),
    T.btn('Salin hasil', salin),
    T.btn('Pakai hasil', pakaiHasil)
  ));
  root.appendChild(statBox);
  root.appendChild(box);
}
