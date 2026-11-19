import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"info-paket-dotnet","name":"Info Paket .NET","cat":"liveapi","icon":"📦","desc":"Cari paket .NET di NuGet: versi terbaru, deskripsi, dan unduhan.","keywords":"dotnet,nuget,paket,.net,csharp,aspnet","since":"6.18.0"};

// Info paket .NET lewat NuGet, tanpa key. Alurnya mengikuti protokol NuGet v3:
// baca dulu daftar layanan di index.json terverifikasi, lalu pakai alamat
// SearchQueryService dari daftar itu untuk mencari.
// Terverifikasi 18 Nov 2026: api.nuget.org/v3/index.json -> 200, CORS *.
// Dicek ulang 19 Nov 2026: index.json 200, layanan pencariannya 200.
// Beda dari Info Paket NPM/Python/Rust: ini registry paket .NET (NuGet).
const INDEX = 'https://api.nuget.org/v3/index.json';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Ambil alamat layanan pencari dari index.json. Mengembalikan null bila
// daftar layanannya tidak membawa SearchQueryService.
export function cariLayananCari(indexJson) {
  const daftar = indexJson && Array.isArray(indexJson.resources) ? indexJson.resources : [];
  const layanan = daftar.find((r) => r && r['@type'] === 'SearchQueryService' && typeof r['@id'] === 'string');
  return layanan ? layanan['@id'] : null;
}

// Validasi alamat layanan pencari dari index.json (pola RED-G2-05):
// hanya layanan NuGet resmi (host *.nuget.org) atau Azure Search
// (*.search.windows.net) lewat https yang boleh di-fetch. Tanpa cek ini,
// respons index.json yang dimanipulasi bisa mengarahkan fetch ke URL mana
// pun, termasuk perangkat di jaringan lokal.
export function layananCariAman(u) {
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === 'nuget.org' || host.endsWith('.nuget.org') || host.endsWith('.search.windows.net');
  } catch { return false; }
}

export function ringkasNuget(j) {
  if (!j || !Array.isArray(j.data)) return null;
  return {
    total: typeof j.totalHits === 'number' ? j.totalHits : j.data.length,
    daftar: j.data.map((p) => ({
      id: typeof p.id === 'string' ? p.id : '-',
      versi: typeof p.version === 'string' ? p.version : '-',
      deskripsi: typeof p.description === 'string' ? p.description : '',
      unduhan: typeof p.totalDownloads === 'number' ? p.totalDownloads : null,
      proyek: typeof p.projectUrl === 'string' && p.projectUrl.indexOf('https://') === 0 ? p.projectUrl : '',
    })),
  };
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Newtonsoft.Json, Serilog');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');
  let layananCari = null;

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const nama = String(inp.value || '').trim();
    if (nama.length < 2) {
      T.show(box, errBox('Tulis minimal 2 huruf, contoh: Newtonsoft.Json.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari paket ' + esc(nama) + ' di NuGet…</p>');
    try {
      if (!layananCari) {
        layananCari = cariLayananCari(await getJSON(INDEX));
        if (!layananCari) throw new Error('bad-data');
        if (!layananCariAman(layananCari)) throw new Error('layanan-tidak-valid');
      }
      const q = new URLSearchParams({ q: nama, take: '5' });
      const hasil = ringkasNuget(await getJSON(layananCari + '?' + q.toString()));
      if (!hasil) throw new Error('bad-data');
      if (!hasil.daftar.length) {
        T.show(box, '<p class="center dim">Paket tidak ditemukan di NuGet. Periksa ejaannya.</p>');
        return;
      }
      T.show(box,
        '<p class="dim" style="font-size:13px">Ditemukan ' + hasil.total.toLocaleString('id-ID') + ' paket, menampilkan ' + hasil.daftar.length + ' teratas.</p>' +
        '<div style="margin-top:10px">' +
        hasil.daftar.map((p) =>
          '<div style="border-bottom:1px solid #2e2823;padding:10px 0">' +
          '<div style="font-weight:700;word-break:break-all">' + esc(p.id) + ' <span class="dim" style="font-weight:400;font-size:12.5px">v' + esc(p.versi) + '</span></div>' +
          (p.deskripsi ? '<p class="dim" style="font-size:13px;line-height:1.5;margin-top:4px">' + esc(p.deskripsi) + '</p>' : '') +
          '<div class="dim" style="font-size:12.5px;margin-top:4px">' + (p.unduhan == null ? '' : 'Diunduh ' + p.unduhan.toLocaleString('id-ID') + ' kali · ') +
          '<a href="https://www.nuget.org/packages/' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener">Lihat di NuGet</a>' +
          (p.proyek ? ' · <a href="' + esc(p.proyek) + '" target="_blank" rel="noopener">Situs proyek</a>' : '') + '</div></div>').join('') +
        '</div>' +
        '<p class="hint">Sumber: NuGet, registry resmi paket .NET.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server NuGet tidak merespons dalam 10 detik.'
        : e.message === 'layanan-tidak-valid'
        ? 'Alamat layanan pencarian dari NuGet tidak sesuai yang diharapkan, jadi pencarian dibatalkan demi keamanan. Coba lagi nanti.'
        : 'Gagal mencari paket. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari paket .NET di NuGet untuk melihat versi terbaru, deskripsi, dan jumlah unduhannya.</p>'));
  root.appendChild(T.field('Nama paket', inp, 'Contoh: Newtonsoft.Json'));
  root.appendChild(T.row(T.btn('🔍 Cari paket', cari, true)));
  root.appendChild(box);
}
