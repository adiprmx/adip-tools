import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id": "penerjemah", "name": "Penerjemah", "cat": "liveapi", "icon": "🌏", "desc": "Terjemahkan teks Indonesia↔Inggris secara instan.", "keywords": "terjemah,translate,inggris,indonesia,bahasa"};

const MAX = 400;
const DIR = [['id|en', 'Indonesia → Inggris'], ['en|id', 'Inggris → Indonesia']];

async function translateApi(q, langpair, signal) {
  const res = await fetch(
    'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=' + encodeURIComponent(langpair),
    { signal }
  );
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.quotaFinished === true) {
    const e = new Error('Kuota harian API habis, coba lagi besok');
    e.quota = true;
    throw e;
  }
  const teks = data && data.responseData && data.responseData.translatedText;
  if (typeof teks !== 'string' || !teks.trim()) throw new Error('Respons API tidak valid.');
  return teks;
}

export function render(root) {
  const ta = T.ta(4, 'Ketik teks di sini (maksimal ' + MAX + ' karakter)…');
  ta.maxLength = MAX;
  const sisa = T.el('<div class="dim" style="text-align:right;font-size:12px"></div>');
  const arah = T.select(DIR, 'id|en');
  const box = T.out();
  let ctl = null;
  let hasilTerakhir = '';

  const updateSisa = () => {
    sisa.textContent = (MAX - ta.value.length) + ' karakter tersisa';
  };
  updateSisa();
  ta.addEventListener('input', updateSisa);

  const proses = async () => {
    const q = ta.value.trim();
    if (!q) { T.show(box, '<span class="err">Isi teksnya dulu ya.</span>'); return; }
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const tmr = setTimeout(() => ctl.abort(), 15000);
    T.show(box, '<div class="dim center">Menerjemahkan…</div>');
    try {
      const hasil = await translateApi(q, arah.value, ctl.signal);
      hasilTerakhir = hasil;
      T.show(box,
        '<div class="dim" style="margin-bottom:4px">Hasil terjemahan</div>' +
        '<div class="big" style="text-align:left">' + esc(hasil) + '</div>');
      box.appendChild(T.row(T.copyBtn(() => hasilTerakhir, '📋 Salin hasil')));
    } catch (e) {
      if (e && e.name === 'AbortError') {
        T.show(box, '<span class="err">Waktu habis (15 detik). Periksa koneksi internet lalu coba lagi.</span>');
      } else if (e && e.quota) {
        T.show(box, '<span class="err">Kuota harian API habis, coba lagi besok.</span>');
      } else {
        T.show(box, '<span class="err">Gagal menerjemahkan. Periksa koneksi internet lalu coba lagi.</span><br><span class="dim">(' + esc(e.message || e) + ')</span>');
      }
      const wr = T.el('<div class="mt8"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', proses));
      box.appendChild(wr);
    } finally {
      clearTimeout(tmr);
      ctl = null;
    }
  };

  T.onLeave(() => { if (ctl) ctl.abort(); });

  root.appendChild(T.field('Teks sumber', ta));
  root.appendChild(sisa);
  root.appendChild(T.field('Arah terjemahan', arah));
  root.appendChild(T.row(T.btn('🌏 Terjemahkan', proses, true)));
  root.appendChild(box);
}
