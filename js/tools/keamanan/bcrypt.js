import { h as T, utils } from '../../core.js?v=5.0.1';

export const meta = {"id": "bcrypt", "name": "Bcrypt Hasher", "cat": "keamanan", "icon": "🔐", "desc": "Hash password ala bcrypt + verifikasi."};

export function render(root) {

    const CDN = 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js';
    const status = T.out();
    const wrap = T.el('<div></div>');
    const pwInp = T.input('password', 'Password yang mau di-hash…');
    const rounds = T.select([['8', '8 putaran (cepat)'], ['10', '10 putaran (standar)'], ['12', '12 putaran (lebih aman)'], ['14', '14 putaran (lambat)']], '10');
    const hashOut = T.out();
    const vPw = T.input('password', 'Password untuk diverifikasi…');
    const vHash = T.ta(3, 'Tempel hash bcrypt di sini…');
    const vOut = T.out();

    // bcryptjs 2.4.3 dist mengekspos global `dcodeIO.bcrypt`; cek keduanya
    const B = () => window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);

    const goHash = () => {
      const pw = pwInp.value;
      if (!pw) { T.show(hashOut, '<span class="err">Isi passwordnya dulu.</span>'); return; }
      try {
        T.show(hashOut, '<span class="dim">Menghitung hash… (bisa beberapa detik)</span>');
        setTimeout(() => {
          try {
            const salt = B().genSaltSync(parseInt(rounds.value, 10));
            const h = B().hashSync(pw, salt);
            T.show(hashOut,
              '<div class="kv"><span class="k">Hash</span><span class="v" class="monoall" style="font-size:12px">' + T.esc(h) + '</span></div>');
            hashOut.appendChild(T.row(T.btn('Salin Hash', () => T.copy(h))));
          } catch (e) { T.show(hashOut, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
        }, 30);
      } catch (e) { T.show(hashOut, '<span class="err">Gagal: ' + T.esc(e.message) + '</span>'); }
    };
    const goVerify = () => {
      const pw = vPw.value, h = vHash.value.trim();
      if (!pw || !h) { T.show(vOut, '<span class="err">Isi password dan hash-nya dulu.</span>'); return; }
      try {
        const ok = B().compareSync(pw, h);
        T.show(vOut, ok
          ? '<span class="ok">✅ Cocok! Password sesuai dengan hash ini.</span>'
          : '<span class="err">❌ Tidak cocok. Password tidak sesuai dengan hash ini.</span>');
      } catch (e) { T.show(vOut, '<span class="err">Hash tidak valid: ' + T.esc(e.message) + '</span>'); }
    };

    T.show(status, '<span class="dim">⏳ Memuat library bcrypt…</span>');
    root.appendChild(status);
    root.appendChild(wrap);
    T.hide(wrap);

    T.loadScript(CDN).then((ok) => {
      if (!ok || !B()) {
        status.innerHTML = '<span class="err">⚠️ CDN tidak bisa dimuat, cek koneksi internet kamu.</span>';
        const retry = T.btn('🔄 Coba Lagi', () => {
          status.innerHTML = '<span class="dim">⏳ Memuat library bcrypt…</span>';
          T.loadScript(CDN).then((ok2) => {
            if (!ok2 || !B()) {
              status.innerHTML = '<span class="err">⚠️ Masih gagal. Coba lagi nanti.</span>';
              status.appendChild(retry);
              return;
            }
            init();
          });
        });
        retry.style.marginTop = '10px';
        status.appendChild(retry);
        return;
      }
      init();
    });
    let booted = false;
    function init() {
      if (booted) return; booted = true;
      T.hide(status);
      wrap.appendChild(T.field('Password', pwInp));
      wrap.appendChild(T.field('Tingkat keamanan', rounds, 'Makin banyak putaran, makin lama dihitung tapi makin aman.'));
      wrap.appendChild(T.row(T.btn('🔐 Buat Hash', goHash, true)));
      wrap.appendChild(hashOut);
      wrap.appendChild(T.el('<hr class="divi">'));
      wrap.appendChild(T.el('<h3 class="h3">Verifikasi</h3>'));
      wrap.appendChild(T.field('Password', vPw));
      wrap.appendChild(T.field('Hash bcrypt', vHash));
      wrap.appendChild(T.row(T.btn('Cek Kecocokan', goVerify)));
      wrap.appendChild(vOut);
      wrap.hidden = false;
    }
  
}
