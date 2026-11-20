import { h as T, utils } from '../../core.js';

// Password yang paling sering dipakai / mudah ditebak (dari daftar bocor
// publik yang umum beredar). Password yang SAMA PERSIS atau MENGANDUNG
// salah satu kata ini dinilai lemah apa pun panjangnya — penyerang
// mencoba daftar seperti ini lebih dulu.
const UMUM = [
  'password', 'password1', 'passw0rd', '123456', '12345678', '123456789',
  '1234567890', '1234567', '12345', '1234', '123123', '123321', '000000',
  '111111', '654321', 'qwerty', 'qwerty123', 'qwertyuiop', 'abc123',
  'letmein', 'admin', 'admin123', 'user123', 'welcome', 'monkey', 'dragon',
  'iloveyou', 'princess', 'football', 'baseball', 'sunshine', 'master',
  'shadow', 'superman', 'michael', 'jennifer', 'charlie', 'donald',
  'aa123456', '1q2w3e4r', '123qwe', 'qwe123', 'asdfgh', 'zxcvbn',
  'sandi', 'rahasia',
];

// Nilai kekuatan password secara jujur dari PERKIRAAN entropi (bit):
// panjang × log2(jumlah karakter yang mungkin dipakai), dikurangi penalti
// pola yang mudah ditebak. Ini perkiraan kasar untuk membandingkan
// password, BUKAN jaminan keamanan. Diekspor agar bisa diuji di Node.
export function nilaiPassword(pw) {
  const saran = [];
  const len = pw.length;
  if (!len) return { skor: 0, bit: 0, lbl: ['Belum diisi', 'dim'], saran: ['Ketik password untuk dicek.'] };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26; else saran.push('Tambah huruf kecil (a-z).');
  if (/[A-Z]/.test(pw)) pool += 26; else saran.push('Tambah huruf besar (A-Z).');
  if (/[0-9]/.test(pw)) pool += 10; else saran.push('Tambah angka (0-9).');
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33; else saran.push('Tambah simbol (!@#$%).');
  if (/[^\x00-\x7F]/.test(pw)) pool += 100;
  let bit = len * Math.log2(pool);
  const kecil = pw.toLowerCase();
  if (UMUM.includes(kecil)) {
    bit = Math.min(bit, 8);
    saran.push('Password ini ada di daftar password yang paling sering dipakai — penyerang mencobanya paling dulu.');
  } else {
    const kena = UMUM.filter((w) => w.length >= 4 && kecil.includes(w));
    if (kena.length) {
      bit = Math.min(bit, 25);
      saran.push('Mengandung kata yang umum ditebak ("' + kena[0] + '") — jauh lebih lemah dari kelihatannya.');
    }
  }
  if (/^(.)\1+$/.test(pw)) { bit = Math.min(bit, 6); saran.push('Satu karakter yang diulang-ulang sangat mudah ditebak.'); }
  else if (/(.)\1{2,}/.test(pw)) { bit -= 10; saran.push('Hindari karakter berulang seperti "aaa" atau "111".'); }
  if (/123|234|345|456|567|678|789|987|876|765|654|543|abc|bcd|xyz|qwe|asd|zxc/i.test(pw)) { bit -= 8; saran.push('Hindari pola berurutan seperti "123" atau "abc".'); }
  if (len < 8) saran.push('Terlalu pendek. Minimal 8 karakter, idealnya 12 atau lebih.');
  // Pola pendek yang diulang utuh ("abcabcabc") kekuatannya ≈ satu pola saja.
  for (let p = 1; p <= Math.floor(len / 2); p++) {
    if (len % p === 0 && pw === pw.slice(0, p).repeat(len / p)) {
      bit = Math.min(bit, p * Math.log2(pool));
      saran.push('Pola yang diulang-ulang kekuatannya cuma sekuat satu polanya.');
      break;
    }
  }
  bit = Math.max(0, Math.round(bit));
  // 90 bit ≈ patokan "sangat kuat" (mis. 14 karakter acak campuran ≈ 92 bit).
  const skor = Math.max(0, Math.min(100, Math.round(bit / 90 * 100)));
  const lbl = skor < 30 ? ['Sangat Lemah', 'err'] : skor < 50 ? ['Lemah', 'err'] : skor < 70 ? ['Cukup', 'warn'] : skor < 85 ? ['Kuat', 'ok'] : ['Sangat Kuat', 'ok'];
  return { skor, bit, lbl, saran };
}

export const meta = {"id": "password-strength", "name": "Cek Kekuatan Password", "cat": "keamanan", "icon": "🛡️", "desc": "Ukur seberapa kuat password kamu.", "keywords": "password,kuat,cek,sandi"};
export function render(root) {

    const inp = T.input('password', 'Ketik password di sini…');
    inp.autocomplete = 'new-password';
    const bShow = T.btn('👁️', () => {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      bShow.textContent = inp.type === 'password' ? '👁️' : '🙈';
      bShow.setAttribute('aria-label', inp.type === 'password' ? 'Lihat sandi' : 'Sembunyikan sandi');
    });
    bShow.setAttribute('aria-label', 'Lihat sandi');
    bShow.classList.add('small');
    const bar = T.el('<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden;margin:12px 0 6px"><div id="pwbar" style="height:100%;width:0%;border-radius:6px;transition:width .3s"></div></div>');
    const out = T.out();

    const warna = (s) => s < 30 ? '#ef4444' : s < 50 ? '#f97316' : s < 70 ? '#eab308' : s < 85 ? '#22c55e' : '#10b981';

    const cek = () => {
      const pw = inp.value;
      const { skor, bit, lbl, saran } = nilaiPassword(pw);
      bar.querySelector('#pwbar, div').style.width = skor + '%';
      bar.firstElementChild.style.background = warna(skor);
      T.show(out,
        '<div class="kv"><span class="k">Skor</span><span class="v big ' + lbl[1] + '">' + skor + '<span class="dim" style="font-size:14px">/100</span></span></div>' +
        '<div class="kv"><span class="k">Penilaian</span><span class="v ' + lbl[1] + '">' + lbl[0] + '</span></div>' +
        '<div class="kv"><span class="k">Perkiraan kekuatan</span><span class="v">~' + bit + ' bit</span></div>' +
        (saran.length
          ? '<div style="margin-top:8px"><b>Saran perbaikan:</b><ul style="margin:6px 0 0;padding-left:20px">' + saran.map((s) => '<li>' + T.esc(s) + '</li>').join('') + '</ul></div>'
          : '<div class="ok" style="margin-top:8px">👍 Password sudah bagus. Tetap jangan pakai ulang di situs lain.</div>') +
        '<div class="hint" style="margin-top:8px">Angka ini perkiraan kasar dari panjang &amp; ragam karakternya — password dari kata biasa atau pola yang umum jauh lebih mudah ditebak dari angkanya. Skor tinggi bukan jaminan aman.</div>');
    };
    inp.addEventListener('input', cek);
    root.appendChild(T.field('Password', T.row(inp, bShow), '🔒 Password hanya dihitung di HP/browser ini, tidak dikirim ke mana pun.'));
    root.appendChild(bar);
    root.appendChild(out);
    cek();
  
}
