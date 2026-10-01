import { h as T, utils } from '../../core.js?v=6.0.0';

export const meta = {"id": "password-strength", "name": "Cek Kekuatan Password", "cat": "keamanan", "icon": "🛡️", "desc": "Ukur seberapa kuat password kamu.", "keywords": "password,kuat,cek,sandi"};
export function render(root) {

    const inp = T.input('password', 'Ketik password di sini…');
    inp.autocomplete = 'new-password';
    const bShow = T.btn('👁️', () => {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      bShow.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
    bShow.classList.add('small');
    const bar = T.el('<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden;margin:12px 0 6px"><div id="pwbar" style="height:100%;width:0%;border-radius:6px;transition:width .3s"></div></div>');
    const out = T.out();

    function nilai(pw) {
      let skor = 0;
      const saran = [];
      const len = pw.length;
      skor += Math.min(40, len * 4);
      let jenis = 0;
      if (/[a-z]/.test(pw)) jenis++; else saran.push('Tambah huruf kecil (a-z).');
      if (/[A-Z]/.test(pw)) jenis++; else saran.push('Tambah huruf besar (A-Z).');
      if (/[0-9]/.test(pw)) jenis++; else saran.push('Tambah angka (0-9).');
      if (/[^a-zA-Z0-9]/.test(pw)) jenis++; else saran.push('Tambah simbol (!@#$%).');
      skor += jenis * 12;
      if (!pw) { skor = 0; }
      if (len > 0 && len < 8) saran.push('Terlalu pendek. Minimal 8 karakter, idealnya 12 atau lebih.');
      if (/(.)\1{2,}/.test(pw)) { skor -= 10; saran.push('Hindari karakter berulang seperti "aaa" atau "111".'); }
      if (/password|sandi|123456|qwerty|admin|abc123|letmein/i.test(pw)) { skor -= 25; saran.push('Password terlalu umum. Jangan pakai kata yang mudah ditebak.'); }
      if (/123|abc|qwe|asd|098/i.test(pw)) { skor -= 8; saran.push('Hindari pola berurutan seperti "123" atau "abc".'); }
      skor = Math.max(0, Math.min(100, Math.round(skor)));
      const lbl = skor < 30 ? ['Sangat Lemah', 'err'] : skor < 50 ? ['Lemah', 'err'] : skor < 65 ? ['Cukup', 'warn'] : skor < 85 ? ['Kuat', 'ok'] : ['Sangat Kuat', 'ok'];
      return { skor, lbl, saran };
    }
    const warna = (s) => s < 30 ? '#ef4444' : s < 50 ? '#f97316' : s < 65 ? '#eab308' : s < 85 ? '#22c55e' : '#10b981';

    const cek = () => {
      const pw = inp.value;
      const { skor, lbl, saran } = nilai(pw);
      bar.querySelector('#pwbar, div').style.width = skor + '%';
      bar.firstElementChild.style.background = warna(skor);
      T.show(out,
        '<div class="kv"><span class="k">Skor</span><span class="v big ' + lbl[1] + '">' + skor + '<span class="dim" style="font-size:14px">/100</span></span></div>' +
        '<div class="kv"><span class="k">Penilaian</span><span class="v ' + lbl[1] + '">' + lbl[0] + '</span></div>' +
        (saran.length
          ? '<div style="margin-top:8px"><b>Saran perbaikan:</b><ul style="margin:6px 0 0;padding-left:20px">' + saran.map((s) => '<li>' + T.esc(s) + '</li>').join('') + '</ul></div>'
          : '<div class="ok" style="margin-top:8px">👍 Password sudah bagus. Tetap jangan pakai ulang di situs lain.</div>'));
    };
    inp.addEventListener('input', cek);
    root.appendChild(T.field('Password', T.row(inp, bShow), '🔒 Password hanya dihitung di HP/browser ini, tidak dikirim ke mana pun.'));
    root.appendChild(bar);
    root.appendChild(out);
    cek();
  
}
