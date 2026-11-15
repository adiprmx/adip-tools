import { h as T, utils, errBox, esc } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node): putuskan hasil dari dua sinyal.
// dnsOk = domain terdaftar di DNS publik. reachable = bisa dijangkau dari koneksi pengguna.
utils.verdictNawala = function (o) {
  if (!o.dnsOk) return {
    status: 'tidak-ada',
    judul: 'Domain tidak ditemukan',
    detail: 'Domain ini tidak terdaftar di DNS publik, atau DNS-nya sedang bermasalah. Bukan soal diblokir atau tidak.'
  };
  if (o.reachable) return {
    status: 'aman',
    judul: 'Kemungkinan tidak diblokir',
    detail: 'Dari jaringanmu saat ini situs ini bisa dijangkau. Kalau tetap tidak bisa dibuka di browser, coba hapus cache atau ganti browser.'
  };
  return {
    status: 'mungkin-diblokir',
    judul: 'Kemungkinan diblokir di jaringanmu',
    detail: 'Situsnya ada dan terdaftar, tapi dari koneksimu tidak bisa dijangkau. Ini bisa karena diblokir provider (Nawala/Internet Positif), bisa juga karena situsnya sedang mati. Coba dari jaringan lain atau nanti lagi untuk memastikan.'
  };
};

export const meta = {"id": "cek-nawala", "name": "Cek Nawala", "cat": "keamanan", "icon": "🚫", "desc": "Apakah situs ini diblokir di jaringanmu?", "keywords": "nawala,internet positif,blokir,trust positif,kominfo,diblokir", "since": "6.11.0"};

export function render(root) {
  const input = T.input('text', 'misal: example.com', '');
  const box = T.out();

  async function cek() {
    const domain = input.value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0];
    if (!domain) { T.show(box, errBox('Isi dulu alamat situsnya.')); return; }
    T.show(box, '<span class="dim">Memeriksa DNS dan koneksi ke ' + esc(domain) + '…</span>');
    let dnsOk = false, ips = [];
    try {
      const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=A');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (j.Status === 0 && j.Answer && j.Answer.length) {
        dnsOk = true;
        ips = j.Answer.filter((a) => a.type === 1).map((a) => a.data);
      }
    } catch (e) {
      T.show(box, errBox('Tidak bisa menghubungi layanan DNS. Periksa koneksimu lalu coba lagi.'));
      return;
    }
    let reachable = false;
    if (dnsOk) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10000);
      try {
        await fetch('https://' + domain + '/', { mode: 'no-cors', cache: 'no-store', signal: ac.signal });
        reachable = true;
      } catch (e) { reachable = false; }
      finally { clearTimeout(timer); }
    }
    const v = utils.verdictNawala({ dnsOk, reachable });
    const warna = v.status === 'aman' ? '#4ade80' : (v.status === 'mungkin-diblokir' ? '#facc15' : '#ef4444');
    T.show(box,
      `<div style="font-size:16px;font-weight:600;color:${warna}">${v.judul}</div>` +
      `<p style="font-size:14px;line-height:1.6;color:#d4d4d4">${v.detail}</p>` +
      (dnsOk && ips.length ? `<div class="kv"><span>Alamat server (dari DNS publik)</span><b>${esc(ips.slice(0, 4).join(', '))}</b></div>` : '') +
      `<div class="hint">Cara kerjanya: alamat situs dicek di DNS publik, lalu dicoba dijangkau langsung dari koneksimu. Pemblokiran Nawala/Internet Positif terjadi di jaringan provider, jadi hasilnya bisa beda antar provider dan antar daerah. Situs yang memang sedang mati memberi hasil yang sama seperti diblokir.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Masukkan alamat situs tanpa https://. Cek ini memakai koneksimu sendiri, jadi hasilnya menggambarkan jaringan yang sedang kamu pakai.</p>'));
  root.appendChild(T.field('Alamat situs', input));
  root.appendChild(T.btn('Cek', cek, true));
  root.appendChild(box);
}
