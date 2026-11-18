import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"tafsir-quran","name":"Tafsir Quran","cat":"liveapi","icon":"📖","desc":"Tafsir Al-Qur'an per surah, ayat demi ayat, dalam bahasa Indonesia.","keywords":"tafsir,quran,al-quran,surah,ayat,arti,islam","since":"6.16.0"};

const API = 'https://equran.id/api/v2/tafsir/';

export function render(root) {
  const box = T.out();
  const inp = T.input('number', 'Nomor surah 1-114');
  inp.min = '1'; inp.max = '114'; inp.value = '1';
  let nomor = 1;
  let dataSurah = null;

  const tampil = (d) => {
    dataSurah = d;
    const list = Array.isArray(d.tafsir) ? d.tafsir : [];
    let html = '<div class="center"><div style="font-size:26px" dir="rtl" lang="ar">' + esc(d.nama || '') + '</div>' +
      '<div style="font-weight:800;font-size:19px;margin-top:4px">' + esc((d.nomor || nomor) + '. ' + (d.namaLatin || '')) + '</div>' +
      '<div class="dim">' + esc([d.arti, d.tempatTurun, d.jumlahAyat ? d.jumlahAyat + ' ayat' : ''].filter(Boolean).join(' · ')) + '</div></div>';
    if (d.deskripsi) {
      const bersih = String(d.deskripsi).replace(/<[^>]*>/g, '');
      html += '<p class="dim" style="font-size:13.5px;line-height:1.7">' + esc(bersih.slice(0, 600)) + (bersih.length > 600 ? '…' : '') + '</p>';
    }
    if (!list.length) {
      html += '<p class="center dim">Tafsir untuk surah ini belum tersedia.</p>';
    } else {
      html += '<p class="hint">Ketuk nomor ayat untuk membaca tafsirnya.</p>';
      list.forEach((t) => {
        const teks = String(t.teks || '').trim();
        html += '<details style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
          '<summary style="cursor:pointer;font-weight:700">Ayat ' + esc(String(t.ayat)) + '</summary>' +
          '<p style="font-size:14px;line-height:1.8;margin:10px 0 2px;white-space:pre-line">' + esc(teks || 'Tafsir ayat ini belum tersedia.') + '</p></details>';
      });
    }
    html += '<p class="hint">Sumber: equran.id</p>';
    T.show(box, html);
  };

  const muat = async (n) => {
    nomor = Math.max(1, Math.min(114, parseInt(n, 10) || 1));
    inp.value = String(nomor);
    T.show(box, '<p class="mut">Mengambil tafsir surah ' + nomor + '…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(API + nomor, { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || !j.data || !j.data.namaLatin) throw new Error('bad-data');
      tampil(j.data);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server equran.id tidak merespons dalam 20 detik.'
        : 'Gagal ambil tafsir. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', () => muat(nomor)));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  const tombolSebelum = T.btn('← Surah sebelumnya', () => muat(nomor - 1));
  const tombolSesudah = T.btn('Surah berikutnya →', () => muat(nomor + 1));
  const tombolBuka = T.btn('Buka', () => muat(inp.value), true);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(inp.value); });
  root.appendChild(T.field('Nomor surah (1-114)', inp, 'Contoh: 1 untuk Al-Fatihah, 36 untuk Yasin, 112 untuk Al-Ikhlas.'));
  root.appendChild(T.row(tombolSebelum, tombolBuka, tombolSesudah));
  root.appendChild(box);
  muat(1);
}
