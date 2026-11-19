import { h as T, utils, errBox, esc } from '../../core.js';

// Logika murni (bisa di-test di Node): putuskan hasil dari dua sinyal.
// dnsOk = domain terdaftar di DNS publik. reachable = bisa dijangkau dari koneksi pengguna.
// cspBlocked = cek koneksi langsung diblokir kebijakan keamanan situs (bukan
// situsnya mati / bukan diblokir provider) — hasilnya TIDAK BOLEH divonis
// "kemungkinan diblokir", itu false-positive.
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
  if (o.cspBlocked) return {
    status: 'tidak-pasti',
    judul: 'Tidak bisa dipastikan dari sini',
    detail: 'Situsnya ada dan terdaftar, tapi cek koneksi langsung tidak bisa jalan karena kebijakan keamanan situs ini. Ini bukan berarti situsnya diblokir — coba buka langsung situsnya di browser untuk memastikan.'
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
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=A', { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (j.Status === 0 && j.Answer && j.Answer.length) {
        dnsOk = true;
        ips = j.Answer.filter((a) => a.type === 1).map((a) => a.data);
      }
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Layanan DNS tidak merespons dalam 15 detik. Periksa koneksimu lalu coba lagi.'
        : 'Tidak bisa menghubungi layanan DNS. Periksa koneksimu lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cek));
      box.appendChild(wr);
      return;
    } finally { clearTimeout(timer); }
    // Cek ini TIDAK BISA di-proxy: tujuannya menguji keterjangkauan dari
    // jaringan pengguna sendiri (blokir Nawala terjadi di provider) — lewat
    // proxy, yang diuji jadi jaringan proxy-nya. Bila kebijakan keamanan
    // situs memblokir fetch langsung, hasilnya "tidak bisa dipastikan".
    let reachable = false, cspBlocked = false;
    if (dnsOk) {
      const w = utils.cspWatch();
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10000);
      try {
        await fetch('https://' + domain + '/', { mode: 'no-cors', cache: 'no-store', signal: ac.signal });
        reachable = true;
      } catch (e) { reachable = false; }
      finally { clearTimeout(timer); }
      if (!reachable) {
        await new Promise((r) => setTimeout(r, 100));
        cspBlocked = w.blocked();
      }
      w.stop();
    }
    const v = utils.verdictNawala({ dnsOk, reachable, cspBlocked });
    const warna = v.status === 'aman' ? '#4ade80' : (v.status === 'mungkin-diblokir' ? '#facc15' : (v.status === 'tidak-pasti' ? '#a1a1aa' : '#ef4444'));
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
