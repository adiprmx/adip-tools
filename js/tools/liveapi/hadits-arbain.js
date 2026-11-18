import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"hadits-arbain","name":"Hadits Arbain","cat":"liveapi","icon":"📜","desc":"Hadits Arbain An-Nawawi nomor 1 sampai 42, teks Arab dan terjemahan Indonesia.","keywords":"hadits,arbain,nawawi,hadis,islam,arab,terjemahan","since":"6.16.0"};

const API = 'https://api.myquran.com/v2/hadits/arbain/';

export function render(root) {
  const box = T.out();
  const inp = T.input('number', 'Nomor hadits 1-42');
  inp.min = '1'; inp.max = '42'; inp.value = '1';
  let nomor = 1;

  const tampil = (d) => {
    const arab = d.arab || '';
    const terjemah = d.terjemah || d.arti || d.indonesia || '';
    let html = '<div class="center"><div class="dim">Hadits Arbain An-Nawawi</div>' +
      '<div style="font-weight:800;font-size:20px;margin:4px 0">Nomor ' + esc(String(nomor)) + ' dari 42</div></div>' +
      (arab ? '<p dir="rtl" lang="ar" style="font-size:19px;line-height:2;text-align:right;margin:14px 0">' + esc(arab) + '</p>' : '') +
      (terjemah ? '<p style="font-size:14.5px;line-height:1.8">' + esc(terjemah) + '</p>' : '<p class="dim center">Terjemahan tidak tersedia untuk hadits ini.</p>') +
      '<p class="hint">Sumber: MyQuran, api.myquran.com</p>';
    T.show(box, html);
  };

  const muat = async (n) => {
    nomor = Math.max(1, Math.min(42, parseInt(n, 10) || 1));
    inp.value = String(nomor);
    T.show(box, '<p class="mut">Mengambil hadits nomor ' + nomor + '…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API + nomor, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || !j.data || !j.data.arab) throw new Error('bad-data');
      tampil(j.data);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server MyQuran tidak merespons dalam 15 detik.'
        : 'Gagal ambil hadits. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', () => muat(nomor)));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  const tombolSebelum = T.btn('← Sebelumnya', () => muat(nomor - 1));
  const tombolSesudah = T.btn('Berikutnya →', () => muat(nomor + 1));
  const tombolBuka = T.btn('Buka', () => muat(inp.value), true);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(inp.value); });
  root.appendChild(T.field('Nomor hadits (1-42)', inp));
  root.appendChild(T.row(tombolSebelum, tombolBuka, tombolSesudah));
  root.appendChild(box);
  muat(1);
}
