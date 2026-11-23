import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"cek-email-sekali-pakai","name":"Cek Email Sekali Pakai","cat":"liveapi","icon":"📧","desc":"Cek apakah alamat email berasal dari layanan email sekali pakai.","keywords":"email,sekali pakai,disposable,cek email,validasi email,spam","since":"6.18.0", "online": true};

// Cek email sekali pakai (disposable) lewat validator.pizza, tanpa key.
// Terverifikasi 18 Nov 2026: www.validator.pizza/email/test@example.com -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
// Beda dari Cek Email Bocor (cek kebocoran data): tool ini menilai apakah
// alamat email itu sekali pakai dan apakah domainnya bisa menerima email.
const API = 'https://www.validator.pizza/email/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Ringkas respons mentah jadi nilai yang gampang dibaca.
// Field disposable: true = email sekali pakai.
export function ringkasHasil(j) {
  if (!j || typeof j !== 'object') return null;
  return {
    email: typeof j.email === 'string' ? j.email : '',
    domain: typeof j.domain === 'string' ? j.domain : '',
    sekaliPakai: j.disposable === true,
    formatBenar: j.status === 200,
    punyaMx: j.mx === true,
    umurDomainHari: typeof j.domain_age_in_days === 'number' ? j.domain_age_in_days : null,
    penyediaMx: Array.isArray(j.mx_providers) ? j.mx_providers.filter((x) => typeof x === 'string') : [],
  };
}

export function render(root) {
  const box = T.out();
  const inp = T.input('email', 'Contoh: nama@email.com');
  inp.setAttribute('autocomplete', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cek));
    box.appendChild(w);
  };

  const cek = async () => {
    const email = String(inp.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      T.show(box, errBox('Tulis alamat email yang benar, contoh: nama@email.com.'));
      return;
    }
    T.show(box, '<p class="mut">Memeriksa ' + esc(email) + '…</p>');
    try {
      const hasil = ringkasHasil(await getJSON(API + encodeURIComponent(email)));
      if (!hasil || !hasil.email) throw new Error('bad-data');
      const umur = hasil.umurDomainHari == null ? '-'
        : hasil.umurDomainHari >= 365
          ? Math.floor(hasil.umurDomainHari / 365) + ' tahun'
          : hasil.umurDomainHari + ' hari';
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:17px">' +
        (hasil.sekaliPakai ? 'Email sekali pakai' : 'Bukan email sekali pakai') + '</div>' +
        '<p class="dim" style="font-size:13px;line-height:1.6;margin-top:6px">' +
        (hasil.sekaliPakai
          ? 'Alamat ini berasal dari layanan email sekali pakai. Biasanya dipakai untuk daftar tanpa memakai email asli.'
          : 'Alamat ini bukan dari layanan email sekali pakai yang dikenal.') + '</p></div>' +
        '<div style="margin-top:10px">' +
        '<div class="kv"><span class="k">Alamat</span><span class="v" style="word-break:break-all">' + esc(hasil.email) + '</span></div>' +
        '<div class="kv"><span class="k">Domain</span><span class="v">' + esc(hasil.domain || '-') + '</span></div>' +
        '<div class="kv"><span class="k">Bisa menerima email</span><span class="v">' + (hasil.punyaMx ? 'Ya' : 'Tidak terdeteksi') + '</span></div>' +
        '<div class="kv"><span class="k">Umur domain</span><span class="v">' + esc(umur) + '</span></div>' +
        (hasil.penyediaMx.length ? '<div class="kv"><span class="k">Layanan email domain ini</span><span class="v">' + esc(hasil.penyediaMx.slice(0, 3).join(', ')) + '</span></div>' : '') +
        '</div>' +
        '<p class="hint">Sumber: validator.pizza. Email yang kamu tulis dikirim ke layanan itu untuk dicek.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server pemeriksa tidak bisa dihubungi dalam 10 detik.'
        : 'Pemeriksaan gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); });
  root.appendChild(T.el('<p class="note">Cek apakah sebuah alamat email berasal dari layanan email sekali pakai, dan apakah domainnya bisa menerima email.</p>'));
  root.appendChild(T.field('Alamat email', inp, 'Email hanya dipakai untuk pengecekan ini'));
  root.appendChild(T.row(T.btn('Cek email', cek, true)));
  root.appendChild(box);
}
