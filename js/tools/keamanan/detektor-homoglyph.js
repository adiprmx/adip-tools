import { h as T, kv } from '../../core.js?v=6.13.0';

/* Daftar karakter yang tampak seperti huruf Latin padahal bukan.
   Sumber: Unicode confusables yang umum dipakai untuk menipu (Cyrillic,
   Greek, Armenian, huruf matematika, fullwidth, dan sejenisnya).
   Tiap entri: karakter -> [huruf Latin yang ditiru, nama aksara]. */
const CONFUSABLES = {
  // --- Cyrillic ---
  'а': ['a', 'Cyrillic'], 'А': ['A', 'Cyrillic'],
  'е': ['e', 'Cyrillic'], 'Е': ['E', 'Cyrillic'],
  'о': ['o', 'Cyrillic'], 'О': ['O', 'Cyrillic'],
  'р': ['p', 'Cyrillic'], 'Р': ['P', 'Cyrillic'],
  'с': ['c', 'Cyrillic'], 'С': ['C', 'Cyrillic'],
  'х': ['x', 'Cyrillic'], 'Х': ['X', 'Cyrillic'],
  'у': ['y', 'Cyrillic'], 'У': ['Y', 'Cyrillic'],
  'В': ['B', 'Cyrillic'], 'К': ['K', 'Cyrillic'], 'М': ['M', 'Cyrillic'],
  'Н': ['H', 'Cyrillic'], 'Т': ['T', 'Cyrillic'],
  'З': ['3', 'Cyrillic'], 'з': ['3', 'Cyrillic'],
  'ј': ['j', 'Cyrillic'], 'Ј': ['J', 'Cyrillic'],
  'ѕ': ['s', 'Cyrillic'], 'Ѕ': ['S', 'Cyrillic'],
  'і': ['i', 'Cyrillic'], 'І': ['I', 'Cyrillic'],
  'г': ['r', 'Cyrillic'], 'ԁ': ['d', 'Cyrillic'],
  'ѵ': ['v', 'Cyrillic'], 'Ѵ': ['V', 'Cyrillic'],
  'п': ['n', 'Cyrillic'], 'П': ['n', 'Cyrillic'],
  // --- Greek ---
  'α': ['a', 'Greek'], 'Α': ['A', 'Greek'],
  'ο': ['o', 'Greek'], 'Ο': ['O', 'Greek'],
  'ρ': ['p', 'Greek'], 'Ρ': ['P', 'Greek'],
  'τ': ['t', 'Greek'], 'Τ': ['T', 'Greek'],
  'ν': ['v', 'Greek'], 'Ν': ['N', 'Greek'],
  'κ': ['k', 'Greek'], 'Κ': ['K', 'Greek'],
  'χ': ['x', 'Greek'], 'Χ': ['X', 'Greek'],
  'ε': ['e', 'Greek'], 'Ε': ['E', 'Greek'],
  'η': ['n', 'Greek'], 'Η': ['H', 'Greek'],
  'ι': ['i', 'Greek'], 'Ι': ['I', 'Greek'],
  'μ': ['u', 'Greek'], 'Μ': ['M', 'Greek'],
  'ω': ['w', 'Greek'], 'Β': ['B', 'Greek'], 'Ζ': ['Z', 'Greek'],
  'γ': ['y', 'Greek'], 'υ': ['u', 'Greek'],
  // --- Armenian ---
  'ո': ['n', 'Armenian'], 'ս': ['u', 'Armenian'], 'հ': ['h', 'Armenian'],
  // --- Latin lain yang meniru ---
  'ı': ['i', 'Latin (tanpa titik)'], 'ſ': ['s', 'Latin (s panjang)'],
  'ɑ': ['a', 'Latin (IPA)'], 'ɡ': ['g', 'Latin (IPA)'], 'ʏ': ['Y', 'Latin (IPA)'],
  'K': ['K', 'Simbol Kelvin'], '℮': ['e', 'Simbol'],
  'ℬ': ['B', 'Latin gaya tulis'], 'ℰ': ['E', 'Latin gaya tulis'],
  'ℱ': ['F', 'Latin gaya tulis'], 'ℋ': ['H', 'Latin gaya tulis'],
  'ℐ': ['I', 'Latin gaya tulis'], 'ℒ': ['L', 'Latin gaya tulis'],
  'ℳ': ['M', 'Latin gaya tulis'], 'ℛ': ['R', 'Latin gaya tulis'],
  'ℯ': ['e', 'Latin gaya tulis'], 'ℊ': ['g', 'Latin gaya tulis'],
  'ℴ': ['o', 'Latin gaya tulis'], 'ℭ': ['C', 'Latin gaya tulis'],
  'ℨ': ['Z', 'Latin gaya tulis'], 'ℌ': ['H', 'Latin gaya tulis'],
  'ℑ': ['I', 'Latin gaya tulis'], 'ℜ': ['R', 'Latin gaya tulis'],
  // --- Huruf garis ganda (double-struck) di Letterlike Symbols ---
  // Ketujuh kapital ini TIDAK ada di blok huruf matematika (lubang di
  // U+1D538 dst. — lihat MATH_LUBANG) — mereka hidup di sini (RT2-05).
  // Terverifikasi di Unicode confusables.txt v18.0.0 (UTS #39).
  'ℂ': ['C', 'Huruf garis ganda'], 'ℍ': ['H', 'Huruf garis ganda'],
  'ℕ': ['N', 'Huruf garis ganda'], 'ℙ': ['P', 'Huruf garis ganda'],
  'ℚ': ['Q', 'Huruf garis ganda'], 'ℝ': ['R', 'Huruf garis ganda'],
  'ℤ': ['Z', 'Huruf garis ganda'],
  // ℎ = huruf miring 'h' yang asli (U+1D455 tidak ada di Unicode).
  'ℎ': ['h', 'Simbol Planck'],
  // Keluarga garis ganda miring — terverifikasi confusables.txt v18.0.0
  // (2145→D, 2146→d, 2147→e, 2148→i, 2149→j).
  'ⅅ': ['D', 'Huruf garis ganda'], 'ⅆ': ['d', 'Huruf garis ganda'],
  'ⅇ': ['e', 'Huruf garis ganda'], 'ⅈ': ['i', 'Huruf garis ganda'],
  'ⅉ': ['j', 'Huruf garis ganda'],
  // ℓ = huruf kecil 'l' gaya tulis (U+2113 → l, confusables.txt v18.0.0).
  'ℓ': ['l', 'Latin gaya tulis'],
  'ⅼ': ['l', 'Angka Romawi'], 'Ⅰ': ['I', 'Angka Romawi'], 'Ⅴ': ['V', 'Angka Romawi'],
  'Ⅹ': ['X', 'Angka Romawi'], 'Ⅼ': ['L', 'Angka Romawi'],

  // --- Angka Romawi lengkap (P4-02) — yang multi-huruf (Ⅱ→II)
  // memetakan ke 2–3 huruf Latin; bersihkanHomoglyph menanganinya.
  // ⅠⅤⅩⅬⅼ sudah ada di bawah.
  'Ⅱ': ['II', 'Angka Romawi'],
  'Ⅲ': ['III', 'Angka Romawi'],
  'Ⅳ': ['IV', 'Angka Romawi'],
  'Ⅵ': ['VI', 'Angka Romawi'],
  'Ⅶ': ['VII', 'Angka Romawi'],
  'Ⅷ': ['VIII', 'Angka Romawi'],
  'Ⅸ': ['IX', 'Angka Romawi'],
  'Ⅺ': ['XI', 'Angka Romawi'],
  'Ⅻ': ['XII', 'Angka Romawi'],
  'Ⅽ': ['C', 'Angka Romawi'],
  'Ⅾ': ['D', 'Angka Romawi'],
  'Ⅿ': ['M', 'Angka Romawi'],
  'ⅰ': ['i', 'Angka Romawi'],
  'ⅱ': ['ii', 'Angka Romawi'],
  'ⅲ': ['iii', 'Angka Romawi'],
  'ⅳ': ['iv', 'Angka Romawi'],
  'ⅴ': ['v', 'Angka Romawi'],
  'ⅵ': ['vi', 'Angka Romawi'],
  'ⅶ': ['vii', 'Angka Romawi'],
  'ⅷ': ['viii', 'Angka Romawi'],
  'ⅸ': ['ix', 'Angka Romawi'],
  'ⅹ': ['x', 'Angka Romawi'],
  'ⅺ': ['xi', 'Angka Romawi'],
  'ⅻ': ['xii', 'Angka Romawi'],
  'ⅽ': ['c', 'Angka Romawi'],
  'ⅾ': ['d', 'Angka Romawi'],
  'ⅿ': ['m', 'Angka Romawi'],
  // --- Yunani + Cyrillic tambahan (P4-02) ---
  'ϲ': ['c', 'Greek'],
  'ϳ': ['j', 'Greek'],
  'ғ': ['f', 'Cyrillic'],
  // --- Simbol Yunani + Cyrillic tambahan (P4-10) — bentuknya identik
  // dengan huruf Latin yang sudah terdeteksi (ϰ≈κ, ϱ≈ρ, ϵ≈ε, Ϝ≈F, ϝ≈f,
  // һ≈h, ԝ≈w); PoC 'һello ԝorld' dulu lolos dengan 0 temuan.
  'ϰ': ['k', 'Greek'], 'ϱ': ['p', 'Greek'], 'ϵ': ['e', 'Greek'],
  'Ϝ': ['F', 'Greek'], 'ϝ': ['f', 'Greek'],
  'һ': ['h', 'Cyrillic'], 'ԝ': ['w', 'Cyrillic'],
  // --- Huruf kapital kecil (P4-02) — bentuknya persis huruf
  // kapital; X tidak ada di Unicode. Varian turned/reversed/barred
  // (ᴎᴚᴐʁᴆᴣꝶⱻ) SENGAJA tidak ditambahkan: tidak mirip huruf polos.
  'ᴀ': ['A', 'Huruf kapital kecil'],
  'ʙ': ['B', 'Huruf kapital kecil'],
  'ᴄ': ['C', 'Huruf kapital kecil'],
  'ᴅ': ['D', 'Huruf kapital kecil'],
  'ᴇ': ['E', 'Huruf kapital kecil'],
  'ꜰ': ['F', 'Huruf kapital kecil'],
  'ɢ': ['G', 'Huruf kapital kecil'],
  'ʜ': ['H', 'Huruf kapital kecil'],
  'ɪ': ['I', 'Huruf kapital kecil'],
  'ᴊ': ['J', 'Huruf kapital kecil'],
  'ᴋ': ['K', 'Huruf kapital kecil'],
  'ʟ': ['L', 'Huruf kapital kecil'],
  'ᴍ': ['M', 'Huruf kapital kecil'],
  'ɴ': ['N', 'Huruf kapital kecil'],
  'ᴏ': ['O', 'Huruf kapital kecil'],
  'ᴘ': ['P', 'Huruf kapital kecil'],
  'ꞯ': ['Q', 'Huruf kapital kecil'],
  'ʀ': ['R', 'Huruf kapital kecil'],
  'ꜱ': ['S', 'Huruf kapital kecil'],
  'ᴛ': ['T', 'Huruf kapital kecil'],
  'ᴜ': ['U', 'Huruf kapital kecil'],
  'ᴠ': ['V', 'Huruf kapital kecil'],
  'ᴡ': ['W', 'Huruf kapital kecil'],
  'ᴢ': ['Z', 'Huruf kapital kecil'],
  // --- Huruf modifier/superskrip (P4-02) — huruf kecil mungil
  // di atas garis (dipakai di fonetik, meniru huruf Latin di teks biasa).
  'ᵃ': ['a', 'Huruf superskrip'],
  'ᵇ': ['b', 'Huruf superskrip'],
  'ᶜ': ['c', 'Huruf superskrip'],
  'ᵈ': ['d', 'Huruf superskrip'],
  'ᵉ': ['e', 'Huruf superskrip'],
  'ᶠ': ['f', 'Huruf superskrip'],
  'ᵍ': ['g', 'Huruf superskrip'],
  'ᶢ': ['g', 'Huruf superskrip'],
  'ʰ': ['h', 'Huruf superskrip'],
  'ᶦ': ['i', 'Huruf superskrip'],
  'ʲ': ['j', 'Huruf superskrip'],
  'ᵏ': ['k', 'Huruf superskrip'],
  'ˡ': ['l', 'Huruf superskrip'],
  'ᶫ': ['l', 'Huruf superskrip'],
  'ᵐ': ['m', 'Huruf superskrip'],
  'ᶰ': ['n', 'Huruf superskrip'],
  'ᵒ': ['o', 'Huruf superskrip'],
  'ᵖ': ['p', 'Huruf superskrip'],
  'ʳ': ['r', 'Huruf superskrip'],
  'ˢ': ['s', 'Huruf superskrip'],
  'ᵗ': ['t', 'Huruf superskrip'],
  'ᵘ': ['u', 'Huruf superskrip'],
  'ᶸ': ['u', 'Huruf superskrip'],
  'ᵛ': ['v', 'Huruf superskrip'],
  'ʷ': ['w', 'Huruf superskrip'],
  'ˣ': ['x', 'Huruf superskrip'],
  'ʸ': ['y', 'Huruf superskrip'],
  'ᶻ': ['z', 'Huruf superskrip'],
  'ᴬ': ['A', 'Huruf superskrip'],
  'ᴮ': ['B', 'Huruf superskrip'],
  'ꟲ': ['C', 'Huruf superskrip'],
  'ᴰ': ['D', 'Huruf superskrip'],
  'ᴱ': ['E', 'Huruf superskrip'],
  'ꟳ': ['F', 'Huruf superskrip'],
  'ᴳ': ['G', 'Huruf superskrip'],
  'ᴴ': ['H', 'Huruf superskrip'],
  'ᴵ': ['I', 'Huruf superskrip'],
  'ᴶ': ['J', 'Huruf superskrip'],
  'ᴷ': ['K', 'Huruf superskrip'],
  'ᴸ': ['L', 'Huruf superskrip'],
  'ᴹ': ['M', 'Huruf superskrip'],
  'ᴺ': ['N', 'Huruf superskrip'],
  'ᴼ': ['O', 'Huruf superskrip'],
  'ᴾ': ['P', 'Huruf superskrip'],
  'ꟴ': ['Q', 'Huruf superskrip'],
  'ᴿ': ['R', 'Huruf superskrip'],
  'ᵀ': ['T', 'Huruf superskrip'],
  'ᵁ': ['U', 'Huruf superskrip'],
  'ⱽ': ['V', 'Huruf superskrip'],
  'ᵂ': ['W', 'Huruf superskrip'],
  // --- Huruf subskrip (P4-02) — huruf kecil mungil di bawah garis.
  'ₐ': ['a', 'Huruf subskrip'],
  'ₑ': ['e', 'Huruf subskrip'],
  'ₕ': ['h', 'Huruf subskrip'],
  'ᵢ': ['i', 'Huruf subskrip'],
  'ⱼ': ['j', 'Huruf subskrip'],
  'ₖ': ['k', 'Huruf subskrip'],
  'ₗ': ['l', 'Huruf subskrip'],
  'ₘ': ['m', 'Huruf subskrip'],
  'ₙ': ['n', 'Huruf subskrip'],
  'ₒ': ['o', 'Huruf subskrip'],
  'ₚ': ['p', 'Huruf subskrip'],
  'ᵣ': ['r', 'Huruf subskrip'],
  'ₛ': ['s', 'Huruf subskrip'],
  'ₜ': ['t', 'Huruf subskrip'],
  'ᵤ': ['u', 'Huruf subskrip'],
  'ᵥ': ['v', 'Huruf subskrip'],
  'ₓ': ['x', 'Huruf subskrip'],
  // --- Berbingkai di luar rentang (P4-02) ---
  '🆥': ['d', 'Huruf berbingkai'],
};


/* Karakter yang MIRIP huruf Latin tapi belum tentu palsu (P4-02, tier-2):
   huruf Cherokee — huruf asli di aksaranya sendiri, dan keanggotaan
   confusables UTS #39-nya belum terverifikasi (egress VM mati). Mereka
   tetap dilaporkan (dengan flag mirip) supaya tidak ada vonis "bersih"
   yang salah, tapi TIDAK diganti otomatis oleh bersihkanHomoglyph dan
   ditampilkan di bagian "mirip", bukan "palsu". P4-10 menambah 9 Cherokee
   + 2 IPA (ɒ≈o, ɣ≈y — kemiripannya tergantung font, jadi tier-2). */
const MIRIP = {
  'Ꭺ': ['A', 'Cherokee'], 'Ꭰ': ['D', 'Cherokee'],
  'Ᏸ': ['O', 'Cherokee'], 'ꮎ': ['o', 'Cherokee'],
  // --- Cherokee tambahan (P4-10) — kelas yang sama dengan 4 di atas.
  'Ꮃ': ['W', 'Cherokee'], 'Ꭹ': ['y', 'Cherokee'], 'Ꭲ': ['T', 'Cherokee'],
  'Ꮋ': ['H', 'Cherokee'], 'Ꭼ': ['E', 'Cherokee'], 'Ꮓ': ['Z', 'Cherokee'],
  'Ꮥ': ['S', 'Cherokee'], 'Ꮑ': ['n', 'Cherokee'], 'Ꮇ': ['M', 'Cherokee'],
  // --- IPA (P4-10) — mirip tapi tergantung font, tier-2.
  'ɒ': ['o', 'Latin (IPA)'], 'ɣ': ['y', 'Latin (IPA)'],
};

/* Rentang huruf berlingkar/berbingkai (P4-02): tiap blok 26 huruf
   berurutan, seperti MATH_RANGES. [awal kode, huruf Latin awal, gaya] */
const ENCLOSED_RANGES = [
  [0x24B6, 'A', 'Huruf berlingkar'], [0x24D0, 'a', 'Huruf berlingkar'],
  [0x1F130, 'A', 'Huruf berbingkai'],
  [0x1F150, 'A', 'Huruf berlingkar negatif'],
  [0x1F170, 'A', 'Huruf berbingkai negatif'],
];

/* Lubang di blok huruf matematika: 24 titik kode yang TIDAK ADA di Unicode
   (karakter aslinya hidup di Letterlike Symbols, mis. ℎ U+210E, ℂ U+2102).
   Terverifikasi lawan unicodedata Python (RT2-10): 1 miring (h), 8 kapital
   tulis tangan (B E F H I L M R), 3 kecil tulis tangan (e g o), 5 fraktur
   (C H I R Z), 7 garis ganda (C H N P Q R Z). Tanpa pengecualian ini,
   padananLatin() melaporkan karakter yang tidak ada sebagai huruf palsu
   dan "versi bersih" merusak teks. */
const MATH_LUBANG = new Set([
  0x1D455,
  0x1D49D, 0x1D4A0, 0x1D4A1, 0x1D4A3, 0x1D4A4, 0x1D4A7, 0x1D4A8, 0x1D4AD,
  0x1D4BA, 0x1D4BC, 0x1D4C4,
  0x1D506, 0x1D50B, 0x1D50C, 0x1D515, 0x1D51D,
  0x1D53A, 0x1D53F, 0x1D545, 0x1D547, 0x1D548, 0x1D549, 0x1D551,
]);

/* Rentang huruf matematika (U+1D400–U+1D7FF): tiap blok 26 huruf berurutan.
   [awal kode, huruf Latin awal, gaya] */
const MATH_RANGES = [
  [0x1D400, 'A', 'tebal'], [0x1D41A, 'a', 'tebal'],
  [0x1D434, 'A', 'miring'], [0x1D44E, 'a', 'miring'],
  [0x1D468, 'A', 'tebal miring'], [0x1D482, 'a', 'tebal miring'],
  [0x1D49C, 'A', 'tulis tangan'], [0x1D4B6, 'a', 'tulis tangan'],
  [0x1D4D0, 'A', 'tulis tangan tebal'], [0x1D4EA, 'a', 'tulis tangan tebal'],
  [0x1D504, 'A', 'fraktur'], [0x1D51E, 'a', 'fraktur'],
  [0x1D538, 'A', 'garis ganda'], [0x1D552, 'a', 'garis ganda'],
  [0x1D56C, 'A', 'fraktur tebal'], [0x1D586, 'a', 'fraktur tebal'],
  [0x1D5A0, 'A', 'sans'], [0x1D5BA, 'a', 'sans'],
  [0x1D5D4, 'A', 'sans tebal'], [0x1D5EE, 'a', 'sans tebal'],
  [0x1D608, 'A', 'sans miring'], [0x1D622, 'a', 'sans miring'],
  [0x1D63C, 'A', 'sans tebal miring'], [0x1D656, 'a', 'sans tebal miring'],
  [0x1D670, 'A', 'monospace'], [0x1D68A, 'a', 'monospace'],
];

/** Cari padanan Latin untuk satu karakter; null bila bukan confusable. */
export function padananLatin(ch) {
  const hit = CONFUSABLES[ch];
  if (hit) return { latin: hit[0], aksara: hit[1] };
  const mirip = MIRIP[ch];
  if (mirip) return { latin: mirip[0], aksara: mirip[1], mirip: true };
  const cp = ch.codePointAt(0);
  // Fullwidth: Ａ-Ｚ (FF21–FF3A), ａ-ｚ (FF41–FF5A), ０-９ (FF10–FF19)
  if (cp >= 0xFF21 && cp <= 0xFF3A) return { latin: String.fromCharCode(cp - 0xFF21 + 65), aksara: 'Fullwidth' };
  if (cp >= 0xFF41 && cp <= 0xFF5A) return { latin: String.fromCharCode(cp - 0xFF41 + 97), aksara: 'Fullwidth' };
  if (cp >= 0xFF10 && cp <= 0xFF19) return { latin: String.fromCharCode(cp - 0xFF10 + 48), aksara: 'Fullwidth' };
  if (MATH_LUBANG.has(cp)) return null; // titik kode unassigned (RT2-10)
  for (const [awal, latinAwal, gaya] of MATH_RANGES) {
    if (cp >= awal && cp < awal + 26) {
      return { latin: String.fromCharCode(latinAwal.charCodeAt(0) + (cp - awal)), aksara: 'Huruf matematika (' + gaya + ')' };
    }
  }
  for (const [awal, latinAwal, gaya] of ENCLOSED_RANGES) {
    if (cp >= awal && cp < awal + 26) {
      return { latin: String.fromCharCode(latinAwal.charCodeAt(0) + (cp - awal)), aksara: gaya };
    }
  }
  return null;
}

/** Pindai teks; kembalikan daftar temuan { char, posisi, kode, latin, aksara }. */
export function deteksiHomoglyph(teks) {
  const hasil = [];
  let posisi = 0;
  for (const ch of String(teks == null ? '' : teks)) {
    const p = padananLatin(ch);
    if (p) {
      hasil.push({
        char: ch,
        posisi: posisi + 1,
        kode: 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
        latin: p.latin,
        aksara: p.aksara,
        mirip: !!p.mirip,
      });
    }
    posisi++;
  }
  return hasil;
}

/** Ganti semua karakter palsu dengan huruf Latin aslinya. */
export function bersihkanHomoglyph(teks) {
  let out = '';
  for (const ch of String(teks == null ? '' : teks)) {
    const p = padananLatin(ch);
    // Tier-2 "mirip" tidak diganti otomatis: bisa jadi huruf asli di
    // aksaranya sendiri — penggantiannya keputusan pengguna (P4-02).
    out += (p && !p.mirip) ? p.latin : ch;
  }
  return out;
}

export const meta = {"id": "detektor-homoglyph", "name": "Detektor Huruf Palsu", "cat": "keamanan", "icon": "🔍", "desc": "Cek teks/URL: adakah huruf yang tampak Latin padahal dari aksara lain (trik penipuan link).", "keywords": "homoglyph,huruf palsu,unicode,cyrillic,phishing,url palsu,confusable,spoof", "since": "6.13.0"};
export function render(root) {

    const inp = T.ta(4, 'Tempel teks atau URL di sini, cth: аdipmusic.my.id');
    const box = T.out();
    const cleanTa = T.ta(3, 'Versi bersih muncul di sini…');
    cleanTa.readOnly = true;

    const pindai = () => {
      const teks = inp.value;
      if (!teks.trim()) { T.toast('Tempel teks atau URL dulu'); return; }
      const temuan = deteksiHomoglyph(teks);
      cleanTa.value = bersihkanHomoglyph(teks);
      // Dua tingkat temuan (P4-02): "palsu" = karakter yang bentuknya
      // memang meniru huruf Latin; "mirip" = bentuknya mirip tapi bisa
      // juga huruf asli di aksaranya sendiri (mis. Cherokee) — perlu
      // dicek konteksnya, bukan langsung divonis palsu.
      const palsu = temuan.filter((t) => !t.mirip);
      const mirip = temuan.filter((t) => t.mirip);
      if (!temuan.length) {
        T.show(box, '<div class="info" style="font-size:14px;line-height:1.6">✅ Tidak ditemukan huruf palsu. Semua karakter di teks ini huruf biasa.</div>' +
          '<p class="hint">Catatan: detektor ini mengenali pola huruf palsu yang umum. Link tetap bisa berbahaya dengan cara lain — jangan klik link dari orang yang tidak dikenal.</p>');
        return;
      }
      // Sorot: bangun HTML dengan escape penuh (input user tidak pernah mentah ke innerHTML).
      // Batas tampil 500 temuan per tingkat: 10.000 <mark> + 10.000 baris daftar membekukan
      // UI ~6,4 dtk (RT2-11). Jumlah total di judul tetap utuh; sisanya
      // diringkas satu baris supaya tidak ada info yang hilang diam-diam.
      const MAKS_TAMPIL = 500;
      const tampilPalsu = palsu.slice(0, MAKS_TAMPIL);
      const tampilMirip = mirip.slice(0, MAKS_TAMPIL);
      let sorot = '';
      const chars = [...teks];
      const setPalsu = new Set(tampilPalsu.map((t) => t.posisi - 1));
      const setMirip = new Set(tampilMirip.map((t) => t.posisi - 1));
      chars.forEach((ch, i) => {
        if (setPalsu.has(i)) {
          sorot += '<mark style="background:#ff6f6133;border:1px solid #ff6f61;border-radius:4px;padding:0 2px;color:#ffb4ab">' + T.esc(ch) + '</mark>';
        } else if (setMirip.has(i)) {
          sorot += '<mark style="background:#f5c54233;border:1px solid #f5c542;border-radius:4px;padding:0 2px;color:#ffd970">' + T.esc(ch) + '</mark>';
        } else {
          sorot += T.esc(ch);
        }
      });
      const buatDaftar = (daftar, total) => {
        let d = '';
        daftar.forEach((t) => {
          d += '<div class="kv"><span class="k">Karakter ke-' + t.posisi + ': "' + T.esc(t.char) + '" (' + T.esc(t.kode) + ')</span>' +
            '<span class="v">aksara ' + T.esc(t.aksara) + ' — meniru huruf "' + T.esc(t.latin) + '"</span></div>';
        });
        if (total > MAKS_TAMPIL) {
          d += '<p class="hint">…dan ' + T.fmt(total - MAKS_TAMPIL) + ' temuan lainnya tidak ditampilkan satu per satu — jumlah total di atas sudah mencakup semuanya.</p>';
        }
        return d;
      };
      let html = '';
      if (palsu.length) {
        html += '<div class="err" style="font-size:14px;line-height:1.6;margin-bottom:8px">⚠️ Ditemukan <b>' + palsu.length + '</b> huruf palsu — teks ini memakai karakter yang tampak seperti huruf Latin padahal bukan. Ini trik umum untuk membuat link/nama palsu terlihat asli.</div>';
      }
      if (mirip.length) {
        html += '<div class="warn" style="font-size:14px;line-height:1.6;margin-bottom:8px">⚠️ Ditemukan <b>' + mirip.length + '</b> karakter yang <b>mirip</b> huruf Latin — bentuknya hampir sama, tapi karakter ini juga huruf asli di aksaranya sendiri, jadi belum tentu palsu. Periksa konteksnya: kalau ini URL atau nama merek yang kamu kenal, ketik alamat aslinya sendiri di browser.</div>';
      }
      html += '<div style="font-size:14px;line-height:1.9;white-space:pre-wrap;word-break:break-all;border:1px solid #2e2823;border-radius:8px;padding:10px;background:#12100d">' + sorot + '</div>';
      if (palsu.length) html += '<div style="margin-top:10px">' + buatDaftar(tampilPalsu, palsu.length) + '</div>';
      if (mirip.length) {
        html += '<div style="margin-top:10px">' + buatDaftar(tampilMirip, mirip.length) + '</div>' +
          '<p class="hint">Karakter "mirip" tidak diganti otomatis di versi bersih di bawah — karena bisa jadi huruf asli, penggantiannya harus kamu putuskan sendiri.</p>';
      }
      html += '<p class="hint">Kalau ini URL dari pesan/chat yang tidak dikenal, jangan diklik. Ketik alamat aslinya sendiri di browser.</p>';
      T.show(box, html);
    };

    root.appendChild(T.el('<p class="note">Penipu sering memakai huruf dari aksara lain yang bentuknya sama persis dengan huruf Latin — misal "а" Cyrillic di depan "dip". Mata tidak bisa membedakan, tapi tool ini bisa.</p>'));
    root.appendChild(T.field('Teks atau URL yang mau dicek', inp));
    root.appendChild(T.row(
      T.btn('Pindai Huruf Palsu', pindai, true),
      T.btn('Contoh: URL palsu', () => { inp.value = 'аdipmusic.my.id'; pindai(); })
    ));
    root.appendChild(box);
    root.appendChild(T.field('Versi bersih (huruf palsu diganti huruf Latin asli)', cleanTa, 'Bandingkan dengan alamat asli yang kamu kenal.'));
    root.appendChild(T.row(T.copyBtn(() => cleanTa.value, 'Salin Versi Bersih')));

}
