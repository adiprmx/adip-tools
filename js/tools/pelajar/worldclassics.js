import { h as T, utils, errBox, kv, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "worldclassics", "name": "World Classics Reader", "cat": "pelajar", "icon": "📜", "desc": "Baca sastra klasik Tiongkok/Jepang/Korea (public domain) dari Wikisource.", "keywords": "klasik,sastra,wenyan,baca,buku,tiongkok,jepang,korea,wikisource"};

const SUMBER = [['zh', '🇨🇳 Tiongkok'], ['ja', '🇯🇵 Jepang'], ['ko', '🇰🇷 Korea']];
const SL = { zh: 'zh-CN', ja: 'ja', ko: 'ko' };
const UA = 'AdipTools/6.9.19 (https://tools.adipmusic.my.id)';
const BM_KEY = 'at-worldclassics-bm-v1';
const api = (lang, p) => 'https://' + lang + '.wikisource.org/w/api.php?' +
  Object.entries(Object.assign({ format: 'json', origin: '*' }, p)).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
// Wikimedia & gtx menolak request tanpa User-Agent yang jelas
const wfetch = (url, opts) => fetch(url, Object.assign({ headers: { 'User-Agent': UA } }, opts || {}));

const getBm = () => { try { return JSON.parse(localStorage.getItem(BM_KEY) || '[]'); } catch (e) { return []; } };
const setBm = (l) => { try { localStorage.setItem(BM_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };

// Bersihkan HTML Wikisource: buang script/navbox/edit-link, link jadi teks biasa
function bersih(html) {
  const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
  doc.querySelectorAll('script,style,img,.mw-editsection,.noprint,.navbox,.infobox,sup.reference,table').forEach((n) => n.remove());
  doc.querySelectorAll('a').forEach((a) => {
    const sp = doc.createElement('span');
    sp.textContent = a.textContent;
    a.replaceWith(sp);
  });
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => { if (/^on/i.test(a.name) || a.name === 'style') n.removeAttribute(a.name); });
  });
  return doc.body.firstChild;
}

// Ambil blok paragraf untuk diterjemahkan
function blokTeks(root) {
  return [...root.querySelectorAll('p,h2,h3,h4,li,blockquote')]
    .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 1);
}

async function terjemahBatch(lang, teksArr, onProg, signal) {
  const out = new Array(teksArr.length);
  const sl = SL[lang] || 'auto';
  let done = 0;
  const kerja = async (i) => {
    const t = teksArr[i];
    // pecah paragraf super panjang per kalimat klasik
    const potong = t.length > 1800 ? t.match(/[^。！？!?]+[。！？!?]?/g) || [t] : [t];
    const hasil = [];
    for (const c of potong) {
      const u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=id&dt=t&q=' + encodeURIComponent(c);
      let j = null, errTerakhir = null;
      for (let attempt = 0; attempt < 2 && !j; attempt++) {
        try {
          const to = AbortSignal.timeout(20000);
          const r = await wfetch(u, { signal: signal ? AbortSignal.any([signal, to]) : to });
          if (!r.ok) throw new Error('http ' + r.status);
          j = await r.json();
          if (!j[0]) throw new Error('respons tak dikenal');
        } catch (e) { errTerakhir = e; j = null; }
      }
      if (!j) throw new Error('layanan terjemahan tidak merespons (' + (errTerakhir && errTerakhir.name) + ') — coba lagi nanti');
      hasil.push((j[0] || []).map((x) => x[0]).join(''));
    }
    out[i] = hasil.join('');
    done++; onProg(done, teksArr.length);
  };
  const antri = teksArr.map((_, i) => i);
  const pekerja = Array.from({ length: 3 }, async () => {
    while (antri.length) { await kerja(antri.shift()); }
  });
  await Promise.all(pekerja);
  return out;
}

export function render(root) {
  let ctl = null, lang = 'zh', judul = '', chapters = [], chIdx = 0;
  let fontSize = 20, view = 'orig';
  const cacheTeks = new Map(); // (judul|section|view) -> html
  onLeave(() => { if (ctl) ctl.abort(); });
  const abort = () => { if (ctl) ctl.abort(); ctl = new AbortController(); return ctl.signal; };

  const srcSel = T.select(SUMBER, 'zh');
  const qInp = T.input('text', 'Judul karya… mis. 紅樓夢 / 源氏物語 / 춘향전', '');
  qInp.autocomplete = 'off';
  const hasilBox = T.out(), babBox = T.out(), bacaBox = T.out(), navBox = T.out(), bmBox = T.out();

  const cari = async () => {
    const q = qInp.value.trim();
    if (!q) { T.show(hasilBox, errBox('Isi dulu judul karyanya.')); return; }
    lang = srcSel.value;
    const sig = abort();
    T.show(hasilBox, '<p class="dim">Mencari di Wikisource…</p>');
    T.hide(babBox); T.hide(bacaBox); T.hide(navBox);
    try {
      const j = await (await wfetch(api(lang, { action: 'query', list: 'search', srsearch: q, srlimit: 15 }), { signal: sig })).json();
      const list = ((j.query || {}).search) || [];
      if (!list.length) { T.show(hasilBox, '<p class="dim">Tidak ketemu. Coba judul asli (mis. 紅樓夢 untuk Tiongkok).</p>'); return; }
      T.show(hasilBox, '<p class="dim" style="font-size:12.5px">' + list.length + ' hasil:</p><div style="display:grid;gap:6px">' +
        list.map((s, i) => '<button class="btn" data-s="' + i + '" style="text-align:left"><b>' + T.esc(s.title) + '</b>' +
          (s.snippet ? '<div class="dim" style="font-size:12px;font-weight:normal">' + s.snippet.replace(/<[^>]+>/g, '').slice(0, 120) + '…</div>' : '') + '</button>').join('') + '</div>');
      hasilBox.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => bukaKarya(list[+b.getAttribute('data-s')].title); });
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(hasilBox, errBox('Gagal mencari: ' + e.message));
    }
  };

  const bukaKarya = async (title) => {
    judul = title; chIdx = 0; cacheTeks.clear();
    const sig = abort();
    T.show(babBox, '<p class="dim">Memuat daftar bab…</p>');
    T.hide(bacaBox); T.hide(navBox);
    try {
      const [js, jp] = await Promise.all([
        (await wfetch(api(lang, { action: 'parse', page: judul, prop: 'sections' }), { signal: sig })).json(),
        (await wfetch(api(lang, { action: 'query', list: 'allpages', apprefix: judul + '/', aplimit: 200, apnamespace: 0 }), { signal: sig })).json(),
      ]);
      if (js.error) throw new Error(js.error.info || 'halaman tidak ditemukan');
      const subs = ((jp.query || {}).allpages || []).map((p) => p.title).filter((t) => t !== judul);
      if (subs.length) {
        // karya ber-bab sebagai subhalaman (mis. 紅樓夢/第001回)
        chapters = subs.map((t) => ({ label: t.slice(judul.length + 1), kind: 'sub', ref: t }));
      } else {
        const secs = (js.parse && js.parse.sections) || [];
        chapters = secs.map((s) => ({ label: s.line || 'Bagian', kind: 'sec', ref: s.index }));
        if (!chapters.length) chapters = [{ label: 'Teks', kind: 'sec', ref: 0 }];
      }
      tampilDaftarBab();
      bukaBab(0);
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(babBox, errBox('Gagal membuka karya: ' + e.message));
    }
  };

  const tampilDaftarBab = () => {
    const maks = 60;
    const l = chapters.slice(0, maks);
    T.show(babBox, '<p style="font-size:14px;margin:12px 0 6px"><b>📖 ' + T.esc(judul) + '</b> <span class="dim" style="font-size:12px">(' + chapters.length + ' bagian)</span></p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;max-height:150px;overflow:auto">' +
      l.map((c, i) => '<button class="btn" data-b="' + i + '" style="font-size:12px' + (i === chIdx ? ';border-color:#ff7a59;color:#ff7a59' : '') + '">' + T.esc(c.label || ('Bagian ' + (i + 1))) + '</button>').join('') +
      (chapters.length > maks ? '<span class="dim" style="font-size:12px">…+' + (chapters.length - maks) + ' lagi</span>' : '') + '</div>');
    babBox.querySelectorAll('[data-b]').forEach((b) => { b.onclick = () => bukaBab(+b.getAttribute('data-b')); });
  };

  const bukaBab = async (i) => {
    chIdx = Math.max(0, Math.min(i, Math.max(0, chapters.length - 1)));
    tampilDaftarBab();
    await muatBab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const muatBab = async () => {
    const ch = chapters[chIdx];
    const key = lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|' + view;
    const namaBab = ch.label || 'Teks';
    if (cacheTeks.has(key)) { tampilBaca(cacheTeks.get(key), namaBab); return; }
    const sig = abort();
    T.show(bacaBox, '<p class="dim">Memuat ' + (view === 'orig' ? 'teks asli' : 'terjemahan') + '…</p>');
    T.hide(navBox);
    try {
      const params = ch.kind === 'sub'
        ? { action: 'parse', page: ch.ref, prop: 'text' }
        : { action: 'parse', page: judul, prop: 'text', section: ch.ref };
      const j = await (await wfetch(api(lang, params), { signal: sig })).json();
      if (j.error) throw new Error(j.error.info || 'gagal memuat');
      const node = bersih(j.parse.text['*']);
      let html;
      if (view === 'orig') {
        html = node.innerHTML;
      } else {
        const blok = blokTeks(node);
        if (!blok.length) throw new Error('tidak ada paragraf teks');
        html = await terjemahKe(node, blok, sig);
      }
      cacheTeks.set(key, html);
      tampilBaca(html, namaBab);
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(bacaBox, errBox('Gagal memuat bab: ' + e.message));
    }
  };

  const terjemahKe = async (node, blok, sig) => {
    T.show(bacaBox, '<p class="dim">Menerjemahkan <span id="wc-prog">0</span>/' + blok.length + ' paragraf… (terjemahan mesin, kualitas bervariasi untuk teks klasik)</p>');
    const prog = () => { const e = bacaBox.querySelector('#wc-prog'); if (e) e.textContent = String(doneCount); };
    let doneCount = 0;
    const hasil = await terjemahBatch(lang, blok, (d) => { doneCount = d; prog(); }, sig);
    const isBi = view === 'bi';
    const wrap = node.cloneNode(true);
    const els = [...wrap.querySelectorAll('p,h2,h3,h4,li,blockquote')].filter((n) => n.textContent.replace(/\s+/g, ' ').trim().length > 1);
    els.forEach((el, i) => {
      if (i >= hasil.length) return;
      if (isBi) {
        const d = document.createElement('div');
        d.style.cssText = 'border-left:2px solid #ff7a5966;padding-left:10px;margin:10px 0;color:#c9bda9;font-size:0.92em';
        d.textContent = hasil[i];
        el.after(d);
      } else {
        el.textContent = hasil[i];
      }
    });
    return wrap.innerHTML;
  };

  const tampilBaca = (html, namaBab) => {
    const bm = getBm().some((b) => b.lang === lang && b.judul === judul && b.ch === chIdx);
    const prog = chapters.length ? Math.round((chIdx + 1) / chapters.length * 100) : 100;
    T.show(bacaBox,
      '<div style="margin-top:6px;border-top:3px solid #ff7a59;border-radius:0 0 4px 4px"><div class="dim" style="font-size:11px;text-align:right">' + prog + '%</div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0">' +
      '<b style="font-size:14px">' + T.esc(namaBab || 'Teks') + '</b>' +
      '<button class="btn" data-bm="1" style="font-size:12px">' + (bm ? '★ Bookmark' : '☆ Bookmark') + '</button></div>' +
      '<article style="font-size:' + fontSize + 'px;line-height:2;border:1px solid #ffffff14;border-radius:12px;padding:16px;background:#12100d;overflow-wrap:anywhere">' + html + '</article>' +
      '<p class="dim" style="font-size:11.5px;margin-top:8px">Sumber teks: ' + T.esc(lang) + '.wikisource.org (public domain)' +
      (view === 'orig' ? '' : ' · Terjemahan mesin otomatis — bisa tidak akurat untuk bahasa klasik') + '</p>');
    bacaBox.querySelector('[data-bm]').onclick = (e) => {
      let l = getBm();
      l = bm ? l.filter((b) => !(b.lang === lang && b.judul === judul && b.ch === chIdx))
             : [{ lang, judul, ch: chIdx, t: Date.now() }, ...l];
      setBm(l); e.target.textContent = bm ? '☆ Bookmark' : '★ Bookmark';
      T.toast(bm ? 'Bookmark dihapus' : 'Ditandai!');
      tampilBm();
    };
    // nav prev/next
    T.show(navBox, '<div style="display:flex;gap:8px;margin-top:10px">' +
      (chIdx > 0 ? '<button class="btn" data-n="p">← Sebelumnya</button>' : '') +
      (chIdx < chapters.length - 1 ? '<button class="btn primary" data-n="n">Berikutnya →</button>' : '') + '</div>');
    const pn = navBox.querySelector('[data-n=p]'); if (pn) pn.onclick = () => bukaBab(chIdx - 1);
    const nn = navBox.querySelector('[data-n=n]'); if (nn) nn.onclick = () => bukaBab(chIdx + 1);
  };

  const tampilBm = () => {
    const l = getBm();
    if (!l.length) { T.hide(bmBox); return; }
    T.show(bmBox, '<div style="margin-top:16px;border-top:1px dashed #ffffff20;padding-top:10px"><b style="font-size:13px">🔖 Bookmark & Terakhir dibaca</b>' +
      '<div style="display:grid;gap:6px;margin-top:8px">' + l.slice(0, 10).map((b, i) =>
        '<button class="btn" data-bm2="' + i + '" style="text-align:left;font-size:12.5px"><b>' + T.esc(b.judul) + '</b> <span class="dim">· ' + T.esc(b.lang) + ' · bagian ' + ((b.ch || 0) + 1) + '</span></button>').join('') + '</div></div>');
    bmBox.querySelectorAll('[data-bm2]').forEach((b) => {
      b.onclick = () => { const x = getBm()[+b.getAttribute('data-bm2')]; if (!x) return; lang = x.lang; srcSel.value = lang; bukaKarya(x.judul).then(() => bukaBab(x.ch || 0)); };
    });
  };

  // kontrol baca
  const viewSel = T.select([['orig', 'Teks Asli'], ['id', '🇮🇩 Indonesia'], ['bi', 'Bilingual']], 'orig');
  const fsRange = document.createElement('input');
  fsRange.type = 'range'; fsRange.min = '16'; fsRange.max = '28'; fsRange.value = '20';
  fsRange.style.width = '140px';
  viewSel.onchange = () => { view = viewSel.value; if (judul) muatBab(); };
  fsRange.oninput = () => { fontSize = +fsRange.value; const a = bacaBox.querySelector('article'); if (a) a.style.fontSize = fontSize + 'px'; };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Perpustakaan sastra klasik Tiongkok, Jepang, dan Korea — teks <b>public domain</b> langsung dari Wikisource (bukan bajakan). Cari karya, baca per bab, terjemahkan ke Indonesia, tandai bacaanmu.</p>'));
  root.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 2fr;gap:8px"></div>'));
  const fr = root.lastChild;
  fr.appendChild(T.field('Sumber', srcSel));
  fr.appendChild(T.field('Judul karya', qInp));
  root.appendChild(T.row(T.btn('🔍 Cari Karya', cari, true)));
  root.appendChild(hasilBox);
  root.appendChild(babBox);
  root.appendChild(T.el('<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin-top:10px"></div>'));
  const cr = root.lastChild;
  cr.appendChild(T.field('Tampilan', viewSel));
  const fsWrap = T.el('<div><label style="font-size:12px" class="dim">Ukuran huruf</label><br></div>');
  fsWrap.appendChild(fsRange);
  cr.appendChild(fsWrap);
  root.appendChild(bacaBox);
  root.appendChild(navBox);
  root.appendChild(bmBox);
  tampilBm();
}
