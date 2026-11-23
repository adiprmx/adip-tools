import { h as T } from '../../core.js';

export const meta = {"id": "komponen-wireframe", "name": "Komponen Wireframe", "cat": "desain", "icon": "🧩", "desc": "12 komponen wireframe grayscale siap pakai, atur tema dan sudutnya lalu salin kodenya.", "keywords": "wireframe,komponen,desain,html,ui,mockup,hero,footer,sidebar,tabel,modal"};

// Palet grayscale dua tema. Wireframe memang grayscale: tema hanya
// membedakan latar gelap/terang, bukan dekorasi warna.
const PALET = {
  gelap: { kartu: '#18181b', blok: '#27272a', garis: '#27272a', garisKuat: '#3f3f46', redup: '#52525b', teks: '#fafafa', teksRedup: '#a1a1aa', tombol: '#ffffff', tombolTeks: '#000000', input: '#000000' },
  terang: { kartu: '#ffffff', blok: '#f4f4f5', garis: '#e4e4e7', garisKuat: '#d4d4d8', redup: '#d4d4d8', teks: '#18181b', teksRedup: '#71717a', tombol: '#18181b', tombolTeks: '#ffffff', input: '#ffffff' },
};
const RADIUS = {
  bulat: { kartu: '12px', tombol: '8px', bar: '4px', bulat: '50%' },
  tajam: { kartu: '0', tombol: '0', bar: '0', bulat: '0' },
};

// Tiap komponen adalah fungsi (palet, radius) -> HTML, supaya pilihan tema
// dan sudut benar-benar mengubah output (bukan kontrol mati).
export const KOMPONEN = {
  tombol: { label: 'Tombol', buat: (p, r) =>
`<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
  <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:10px 22px;font-size:14px;font-weight:600;pointer-events:none">Tombol Utama</button>
  <button tabindex="-1" aria-hidden="true" style="background:transparent;color:${p.teks};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:10px 22px;font-size:14px;pointer-events:none">Tombol Sekunder</button>
  <button tabindex="-1" aria-hidden="true" style="background:${p.blok};color:${p.teksRedup};border:none;border-radius:${r.tombol};padding:10px 22px;font-size:14px;opacity:.6;pointer-events:none">Nonaktif</button>
</div>` },
  kartu: { label: 'Kartu', buat: (p, r) =>
`<div style="max-width:320px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};overflow:hidden">
  <div style="height:150px;background:${p.blok}"></div>
  <div style="padding:16px">
    <div style="height:14px;width:70%;background:${p.garisKuat};border-radius:${r.bar};margin-bottom:10px"></div>
    <div style="height:10px;width:100%;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
    <div style="height:10px;width:85%;background:${p.blok};border-radius:${r.bar};margin-bottom:14px"></div>
    <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:8px 18px;font-size:13px;font-weight:600;pointer-events:none">Aksi</button>
  </div>
</div>` },
  navbar: { label: 'Navbar', buat: (p, r) =>
`<nav style="display:flex;align-items:center;justify-content:space-between;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:12px 18px">
  <div style="width:90px;height:22px;background:${p.teks};border-radius:${r.bar}"></div>
  <div style="display:flex;gap:16px">
    <div style="width:52px;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
    <div style="width:52px;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
    <div style="width:52px;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
  </div>
  <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:8px 16px;font-size:13px;font-weight:600;pointer-events:none">Masuk</button>
</nav>` },
  login: { label: 'Form Login', buat: (p, r) =>
`<form style="max-width:320px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:24px">
  <div style="height:16px;width:50%;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 20px"></div>
  <input tabindex="-1" aria-hidden="true" placeholder="Email" style="width:100%;box-sizing:border-box;background:${p.input};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:10px 12px;color:${p.teks};margin-bottom:10px;pointer-events:none">
  <input tabindex="-1" aria-hidden="true" placeholder="Kata sandi" type="password" style="width:100%;box-sizing:border-box;background:${p.input};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:10px 12px;color:${p.teks};margin-bottom:16px;pointer-events:none">
  <button tabindex="-1" aria-hidden="true" style="width:100%;background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:11px;font-size:14px;font-weight:600;pointer-events:none">Masuk</button>
</form>` },
  pricing: { label: 'Pricing', buat: (p, r) =>
`<div style="display:flex;gap:12px;flex-wrap:wrap">
  <div style="flex:1;min-width:160px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:20px;text-align:center">
    <div style="height:12px;width:60%;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 12px"></div>
    <div style="height:26px;width:50%;background:${p.teks};border-radius:${r.bar};margin:0 auto 14px"></div>
    <div style="height:10px;width:80%;background:${p.blok};border-radius:${r.bar};margin:0 auto 6px"></div>
    <div style="height:10px;width:70%;background:${p.blok};border-radius:${r.bar};margin:0 auto 16px"></div>
    <button tabindex="-1" aria-hidden="true" style="background:transparent;color:${p.teks};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:8px 18px;font-size:13px;pointer-events:none">Pilih</button>
  </div>
  <div style="flex:1;min-width:160px;background:${p.blok};border:2px solid ${p.tombol};border-radius:${r.kartu};padding:20px;text-align:center">
    <div style="height:12px;width:60%;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 12px"></div>
    <div style="height:26px;width:50%;background:${p.teks};border-radius:${r.bar};margin:0 auto 14px"></div>
    <div style="height:10px;width:80%;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 6px"></div>
    <div style="height:10px;width:70%;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 16px"></div>
    <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:8px 18px;font-size:13px;font-weight:600;pointer-events:none">Pilih</button>
  </div>
</div>` },
  testimoni: { label: 'Testimoni', buat: (p, r) =>
`<div style="max-width:360px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:20px">
  <div style="color:${p.redup};font-size:28px;line-height:1;margin-bottom:8px">&ldquo;</div>
  <div style="height:10px;width:100%;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
  <div style="height:10px;width:92%;background:${p.blok};border-radius:${r.bar};margin-bottom:16px"></div>
  <div style="display:flex;align-items:center;gap:10px">
    <div style="width:38px;height:38px;border-radius:${r.bulat};background:${p.garisKuat}"></div>
    <div>
      <div style="height:11px;width:90px;background:${p.garisKuat};border-radius:${r.bar};margin-bottom:5px"></div>
      <div style="height:9px;width:60px;background:${p.blok};border-radius:${r.bar}"></div>
    </div>
  </div>
</div>` },
  hero: { label: 'Hero', buat: (p, r) =>
`<div style="background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:32px 24px;text-align:center">
  <div style="height:10px;width:90px;background:${p.garisKuat};border-radius:${r.bar};margin:0 auto 16px"></div>
  <div style="height:24px;width:75%;background:${p.teks};border-radius:${r.bar};margin:0 auto 10px"></div>
  <div style="height:24px;width:55%;background:${p.teks};border-radius:${r.bar};margin:0 auto 16px"></div>
  <div style="height:10px;width:65%;background:${p.blok};border-radius:${r.bar};margin:0 auto 6px"></div>
  <div style="height:10px;width:50%;background:${p.blok};border-radius:${r.bar};margin:0 auto 20px"></div>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
    <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:10px 22px;font-size:14px;font-weight:600;pointer-events:none">Mulai</button>
    <button tabindex="-1" aria-hidden="true" style="background:transparent;color:${p.teks};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:10px 22px;font-size:14px;pointer-events:none">Pelajari</button>
  </div>
</div>` },
  footer: { label: 'Footer', buat: (p, r) =>
`<footer style="background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:24px">
  <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:space-between">
    <div style="min-width:140px">
      <div style="width:90px;height:22px;background:${p.teks};border-radius:${r.bar};margin-bottom:12px"></div>
      <div style="height:10px;width:130px;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
      <div style="height:10px;width:100px;background:${p.blok};border-radius:${r.bar}"></div>
    </div>
    <div style="min-width:100px">
      <div style="height:12px;width:70px;background:${p.garisKuat};border-radius:${r.bar};margin-bottom:12px"></div>
      <div style="height:10px;width:90px;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
      <div style="height:10px;width:80px;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
      <div style="height:10px;width:95px;background:${p.blok};border-radius:${r.bar}"></div>
    </div>
    <div style="min-width:100px">
      <div style="height:12px;width:70px;background:${p.garisKuat};border-radius:${r.bar};margin-bottom:12px"></div>
      <div style="height:10px;width:85px;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
      <div style="height:10px;width:95px;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
      <div style="height:10px;width:75px;background:${p.blok};border-radius:${r.bar}"></div>
    </div>
  </div>
  <div style="border-top:1px solid ${p.garis};margin-top:20px;padding-top:14px;display:flex;justify-content:space-between">
    <div style="height:10px;width:120px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="height:10px;width:80px;background:${p.blok};border-radius:${r.bar}"></div>
  </div>
</footer>` },
  sidebar: { label: 'Sidebar', buat: (p, r) =>
`<div style="display:flex;max-width:420px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};overflow:hidden">
  <div style="width:180px;flex:none;background:${p.blok};padding:16px">
    <div style="width:80px;height:20px;background:${p.teks};border-radius:${r.bar};margin-bottom:20px"></div>
    <div style="height:32px;background:${p.kartu};border-radius:${r.tombol};margin-bottom:8px"></div>
    <div style="height:32px;background:transparent;border:1px solid ${p.garis};border-radius:${r.tombol};margin-bottom:8px"></div>
    <div style="height:32px;background:transparent;border:1px solid ${p.garis};border-radius:${r.tombol};margin-bottom:8px"></div>
    <div style="height:32px;background:transparent;border:1px solid ${p.garis};border-radius:${r.tombol}"></div>
  </div>
  <div style="flex:1;padding:16px">
    <div style="height:16px;width:60%;background:${p.garisKuat};border-radius:${r.bar};margin-bottom:12px"></div>
    <div style="height:10px;width:100%;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
    <div style="height:10px;width:85%;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
    <div style="height:10px;width:70%;background:${p.blok};border-radius:${r.bar}"></div>
  </div>
</div>` },
  tabel: { label: 'Tabel', buat: (p, r) =>
`<div style="background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};overflow:hidden">
  <div style="display:flex;gap:12px;padding:12px 16px;background:${p.blok};border-bottom:1px solid ${p.garis}">
    <div style="flex:2;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
  </div>
  <div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid ${p.garis}">
    <div style="flex:2;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
  </div>
  <div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid ${p.garis}">
    <div style="flex:2;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
  </div>
  <div style="display:flex;gap:12px;padding:12px 16px">
    <div style="flex:2;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
    <div style="flex:1;height:12px;background:${p.blok};border-radius:${r.bar}"></div>
  </div>
</div>` },
  modal: { label: 'Modal', buat: (p, r) =>
`<div style="max-width:360px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div style="height:16px;width:45%;background:${p.garisKuat};border-radius:${r.bar}"></div>
    <div style="width:24px;height:24px;background:${p.blok};border-radius:${r.bulat};flex:none"></div>
  </div>
  <div style="height:10px;width:100%;background:${p.blok};border-radius:${r.bar};margin-bottom:6px"></div>
  <div style="height:10px;width:80%;background:${p.blok};border-radius:${r.bar};margin-bottom:20px"></div>
  <div style="display:flex;gap:10px;justify-content:flex-end">
    <button tabindex="-1" aria-hidden="true" style="background:transparent;color:${p.teks};border:1px solid ${p.garisKuat};border-radius:${r.tombol};padding:8px 18px;font-size:13px;pointer-events:none">Batal</button>
    <button tabindex="-1" aria-hidden="true" style="background:${p.tombol};color:${p.tombolTeks};border:none;border-radius:${r.tombol};padding:8px 18px;font-size:13px;font-weight:600;pointer-events:none">Simpan</button>
  </div>
</div>` },
  pengumuman: { label: 'Bar Pengumuman', buat: (p, r) =>
`<div style="display:flex;align-items:center;gap:12px;background:${p.kartu};border:1px solid ${p.garis};border-radius:${r.kartu};padding:12px 16px">
  <div style="width:10px;height:10px;background:${p.teks};border-radius:${r.bulat};flex:none"></div>
  <div style="flex:1;height:12px;background:${p.garisKuat};border-radius:${r.bar}"></div>
  <div style="width:22px;height:22px;background:${p.blok};border-radius:${r.bulat};flex:none"></div>
</div>` },
};

// Bangun HTML satu komponen dengan opsi {tema: 'gelap'|'terang', radius: 'bulat'|'tajam'}.
// Fungsi murni (tanpa DOM) supaya bisa diuji langsung.
export function bangunHtml(kunci, opsi) {
  const k = KOMPONEN[kunci] || KOMPONEN.tombol;
  const o = opsi || {};
  const p = PALET[o.tema === 'terang' ? 'terang' : 'gelap'];
  const r = RADIUS[o.radius === 'tajam' ? 'tajam' : 'bulat'];
  return k.buat(p, r);
}

export function render(root) {
  const KEYS = Object.keys(KOMPONEN);
  const sel = T.select(KEYS.map((k) => [k, KOMPONEN[k].label]), 'tombol');
  const selTema = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const selRadius = T.select([['bulat', 'Bulat'], ['tajam', 'Tajam']], 'bulat');
  const prevBox = T.el('<div style="margin:12px 0"></div>');
  const kodeBox = T.el('<div style="margin:12px 0"></div>');
  const opsi = () => ({ tema: selTema.value, radius: selRadius.value });
  const salinBtn = T.copyBtn(() => bangunHtml(sel.value, opsi()), 'Salin kode HTML');

  function gambar() {
    const html = bangunHtml(sel.value, opsi());
    prevBox.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:8px">Pratinjau:</div>' + html;
    kodeBox.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:8px">Kode HTML:</div>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12px;line-height:1.5;overflow-x:auto;max-height:260px;overflow-y:auto">' +
      T.esc(html) + '</pre>';
  }

  sel.addEventListener('change', gambar);
  selTema.addEventListener('change', gambar);
  selRadius.addEventListener('change', gambar);
  root.append(
    T.el('<p class="dim" style="font-size:13px">Pilih komponen, atur tema dan sudutnya, lihat pratinjaunya, lalu salin kode HTML-nya. Semua grayscale, tinggal ganti warna sesuai brand kamu.</p>'),
    T.field('Pilih komponen', sel),
    T.grid2(T.field('Tema', selTema), T.field('Sudut', selRadius)),
    prevBox, kodeBox, salinBtn
  );
  gambar();
}
