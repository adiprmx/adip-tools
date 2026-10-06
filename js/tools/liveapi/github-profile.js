import { h as T, utils, esc } from '../../core.js?v=6.9.5';

export const meta = {"id": "github-profile", "name": "Profil GitHub", "cat": "liveapi", "icon": "🐙", "desc": "Lihat profil GitHub siapapun: avatar, bio, followers, repo.", "keywords": "github,profil,username,avatar,followers,repo,developer"};

export function render(root) {
  const inp = T.input('text', 'Username GitHub', '');
  const box = T.out();

  const fetchJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/vnd.github.v3+json' } });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const cari = async () => {
    const u = inp.value.trim();
    if (!u) { T.show(box, '<span class="err">Isi username GitHub dulu.</span>'); return; }
    T.show(box, '<div class="dim center">Mencari profil @' + esc(u) + '…</div>');
    try {
      const d = await fetchJson('https://api.github.com/users/' + encodeURIComponent(u));
      let tgl = '';
      try { tgl = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { tgl = ''; }
      const profilUrl = 'https://github.com/' + encodeURIComponent(d.login);
      const isi = T.el(
        '<div>' +
        '<div class="center" style="margin-bottom:12px">' +
          '<img src="' + esc(d.avatar_url || '') + '" alt="avatar" referrerpolicy="no-referrer" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:1px solid #ffffff20" loading="lazy">' +
          '<div style="font-size:20px;font-weight:700;margin-top:10px">' + esc(d.name || d.login) + '</div>' +
          '<div class="dim">@' + esc(d.login) + '</div>' +
          (d.bio ? '<div class="info" style="margin-top:8px;max-width:420px">' + esc(d.bio) + '</div>' : '') +
        '</div>' +
        '<div class="kv"><span class="k">Followers</span><span class="v">' + T.fmt(d.followers || 0) + '</span></div>' +
        '<div class="kv"><span class="k">Following</span><span class="v">' + T.fmt(d.following || 0) + '</span></div>' +
        '<div class="kv"><span class="k">Repo publik</span><span class="v">' + T.fmt(d.public_repos || 0) + '</span></div>' +
        (tgl ? '<div class="kv"><span class="k">Akun dibuat</span><span class="v">' + esc(tgl) + '</span></div>' : '') +
        (d.location ? '<div class="kv"><span class="k">Lokasi</span><span class="v">' + esc(d.location) + '</span></div>' : '') +
        '</div>'
      );
      box.appendChild(isi);
      const wrap = T.el('<div class="center" style="margin-top:12px"></div>');
      const a = document.createElement('a');
      a.href = profilUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'tbtn tbtn-primary';
      a.textContent = '🐙 Buka profil di GitHub';
      wrap.appendChild(a);
      box.appendChild(wrap);
    } catch (e) {
      const st = e && e.status;
      let msg;
      if (e && e.name === 'AbortError') msg = 'Waktu habis — GitHub tidak merespons dalam 15 detik. Periksa koneksi internet lalu coba lagi.';
      else if (st === 404) msg = 'Username "' + u + '" tidak ditemukan di GitHub.';
      else if (st === 403) msg = 'Limit akses GitHub tercapai (60 request/jam tanpa login). Coba lagi nanti.';
      else msg = 'Gagal memuat profil GitHub. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div class="mt8"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.field('Username GitHub', inp));
  root.appendChild(T.row(T.btn('🔍 Cari profil', cari, true)));
  root.appendChild(box);
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') cari(); });
}
