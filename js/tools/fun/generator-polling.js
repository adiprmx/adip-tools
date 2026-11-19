import { h as T, utils } from '../../core.js';

export const meta = {"id": "generator-polling", "name": "Generator Polling", "cat": "fun", "icon": "🗳️", "desc": "Buat polling dengan pertanyaan dan pilihanmu sendiri, bagikan lewat tautan, dan lihat hasilnya langsung.", "keywords": "polling,vote,pilihan,suara,jajak pendapat,bagikan,tautan", "since": "6.19.0"};

/* Polling dikodekan ke tautan (tanpa server): pertanyaan + pilihan masuk
   ke hash URL sebagai base64url JSON. Suara tersimpan per perangkat di
   localStorage, jadi hasil di HP lain tidak ikut berubah. */
export function kodePolling(tanya, opsi) {
  const json = JSON.stringify({ t: tanya, o: opsi });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function bacaKodePolling(kode) {
  try {
    const b64 = kode.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const d = JSON.parse(json);
    if (typeof d.t !== 'string' || !Array.isArray(d.o) || d.o.length < 2) return null;
    return { tanya: d.t.slice(0, 200), opsi: d.o.filter((o) => typeof o === 'string').map((o) => o.slice(0, 80)).slice(0, 8) };
  } catch (e) {
    return null;
  }
}

/* Persen per pilihan, dinormalisasi supaya totalnya 100 (sisa dibulatkan
   ke pilihan terbanyak). -0 tidak pernah tampil (D-G4-04). */
export function hitungPersen(suara) {
  const total = suara.reduce((s, v) => s + v, 0);
  if (total <= 0) return suara.map(() => 0);
  const mentah = suara.map((v) => (v / total) * 100);
  const bulat = mentah.map((v) => Math.floor(v));
  let sisa = 100 - bulat.reduce((s, v) => s + v, 0);
  const urut = mentah.map((v, i) => ({ i, sisa: v - Math.floor(v) })).sort((a, b) => b.sisa - a.sisa);
  for (const u of urut) {
    if (sisa <= 0) break;
    bulat[u.i]++; sisa--;
  }
  return bulat.map((v) => (Object.is(v, -0) ? 0 : v));
}

export function buatPolling(tanya, opsi) {
  return { tanya, opsi, suara: opsi.map(() => 0), pilihanku: -1 };
}

const LS_PREFIX = 'polling-suara-';

export function render(root) {
  const box = T.out();
  const tanyaI = T.input('text', 'cth: Makan siang di mana?', 'Makan siang di mana?');
  const opsiI = T.ta(4, 'Warung Padang\nAyam Geprek\nBakso\nSoto', 'Warung Padang\nAyam Geprek\nBakso\nSoto');
  let P = null, kode = '';

  const simpanSuara = () => {
    try { localStorage.setItem(LS_PREFIX + kode, JSON.stringify({ suara: P.suara, pilihanku: P.pilihanku })); } catch (e) {}
  };
  const muatSuara = () => {
    try {
      const raw = localStorage.getItem(LS_PREFIX + kode);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d.suara) && d.suara.length === P.opsi.length) {
        P.suara = d.suara.map((v) => Math.max(0, Number(v) || 0));
        P.pilihanku = typeof d.pilihanku === 'number' ? d.pilihanku : -1;
      }
    } catch (e) {}
  };

  const gambar = () => {
    if (!P) {
      T.show(box, '<p class="hint center">Tulis pertanyaan dan pilihannya, lalu tekan "Buat polling". Tautan polling bisa dibagikan ke siapa saja.</p>');
      return;
    }
    const persen = hitungPersen(P.suara);
    const total = P.suara.reduce((s, v) => s + v, 0);
    let html = '<p class="hint center">' + T.fmt(total) + ' suara · suara tersimpan di HP ini saja</p>' +
      '<div style="font-size:19px;font-weight:700;line-height:1.4;margin:8px 0 12px">' + T.esc(P.tanya) + '</div>';
    P.opsi.forEach((o, i) => {
      const dipilih = P.pilihanku === i;
      html += '<button type="button" class="btn poll-opsi" data-i="' + i + '" style="display:block;width:100%;text-align:left;margin:6px 0;position:relative;overflow:hidden;' + (dipilih ? 'border-color:#fff;' : '') + '">' +
        '<span style="position:absolute;left:0;top:0;bottom:0;width:' + persen[i] + '%;background:#ffffff1a"></span>' +
        '<span style="position:relative;display:flex;justify-content:space-between;gap:8px"><span>' + (dipilih ? '✓ ' : '') + T.esc(o) + '</span><b>' + persen[i] + '% · ' + T.fmt(P.suara[i]) + '</b></span></button>';
    });
    html += '<p class="hint" style="margin-top:10px">Ketuk pilihan untuk memilih. Ketuk lagi pilihanmu untuk membatalkan suara.</p>';
    T.show(box, html);
    box.querySelectorAll('.poll-opsi').forEach((b) => {
      b.addEventListener('click', () => {
        const i = Number(b.getAttribute('data-i'));
        if (P.pilihanku === i) {
          P.suara[i] = Math.max(0, P.suara[i] - 1);
          P.pilihanku = -1;
        } else {
          if (P.pilihanku >= 0) P.suara[P.pilihanku] = Math.max(0, P.suara[P.pilihanku] - 1);
          P.suara[i]++;
          P.pilihanku = i;
          T.beep(660, 0.07);
        }
        simpanSuara();
        gambar();
      });
    });
    const tautan = location.origin + location.pathname + '#poll=' + kode;
    const bar = T.el('<div class="row" style="flex-wrap:wrap;margin-top:12px"></div>');
    bar.appendChild(T.copyBtn(() => tautan, '🔗 Salin tautan polling'));
    bar.appendChild(T.copyBtn(() => 'Polling: ' + P.tanya + '\n' + P.opsi.map((o, i) => '- ' + o + ': ' + persen[i] + '% (' + P.suara[i] + ' suara)').join('\n') + '\nIkut milih: ' + tautan, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      bar.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: 'Polling: ' + P.tanya, url: tautan }).catch(() => {}); }));
    }
    box.appendChild(bar);
  };

  const buat = () => {
    const tanya = tanyaI.value.trim();
    const opsi = opsiI.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8);
    if (!tanya) { T.toast('Tulis dulu pertanyaannya'); return; }
    if (opsi.length < 2) { T.toast('Minimal 2 pilihan jawaban'); return; }
    kode = kodePolling(tanya, opsi);
    P = buatPolling(tanya, opsi);
    muatSuara();
    try { history.replaceState(null, '', '#poll=' + kode); } catch (e) {}
    gambar();
  };

  const dariHash = () => {
    const m = String(location.hash || '').match(/#poll=([A-Za-z0-9_-]+)/);
    if (!m) return false;
    const d = bacaKodePolling(m[1]);
    if (!d) return false;
    kode = m[1];
    P = buatPolling(d.tanya, d.opsi);
    tanyaI.value = d.tanya;
    opsiI.value = d.opsi.join('\n');
    muatSuara();
    return true;
  };

  root.appendChild(T.el('<p class="hint">Polling tanpa akun dan tanpa server. Pertanyaan dan pilihanmu dikemas ke dalam tautan, jadi siapa pun yang membuka tautan itu melihat polling yang sama. Suaranya sendiri tersimpan di masing-masing HP.</p>'));
  root.appendChild(T.field('Pertanyaan', tanyaI));
  root.appendChild(T.field('Pilihan jawaban (satu per baris)', opsiI, 'Minimal 2, maksimal 8 pilihan.'));
  root.appendChild(T.row(T.btn('🗳️ Buat polling', buat, true)));
  root.appendChild(box);
  if (!dariHash()) gambar();
  else gambar();
}
