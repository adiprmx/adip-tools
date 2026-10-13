import { h as T, utils, errBox, kv, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "worldclassics", "name": "World Classics Reader", "cat": "pelajar", "icon": "📜", "desc": "Baca sastra klasik Tiongkok/Jepang/Korea (public domain) dari Wikisource + terjemahan Indonesia.", "keywords": "klasik,sastra,wenyan,baca,buku,tiongkok,jepang,korea,wikisource,terjemahan"};

const SUMBER = [['zh', 'Tiongkok'], ['ja', 'Jepang'], ['ko', 'Korea']];
const SL = { zh: 'zh-CN', ja: 'ja', ko: 'ko' };
const NAMA_BAHASA = { zh: 'Tiongkok klasik', ja: 'Jepang klasik', ko: 'Korea klasik' };
const UA = 'AdipTools/6.9.19 (https://tools.adipmusic.my.id)';
const BM_KEY = 'at-worldclassics-bm-v1';
const HIST_KEY = 'at-worldclassics-hist-v1';
const AI_URL = 'https://text.pollinations.ai/openai';
const GAYA = {
  literal: 'sedekat mungkin dengan struktur kalimat aslinya (harfiah), tanpa menambah tafsir',
  natural: 'bahasa Indonesia yang alami dan mudah dibaca, makna setara dengan aslinya',
  novel: 'gaya bahasa novel yang indah dan mengalir seperti karya sastra, tetap setia pada makna aslinya',
};
const api = (lang, p) => 'https://' + lang + '.wikisource.org/w/api.php?' +
  Object.entries(Object.assign({ format: 'json', origin: '*' }, p)).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
const wfetch = (url, opts) => {
  const o = Object.assign({ headers: { 'User-Agent': UA } }, opts || {});
  const to = AbortSignal.timeout(25000);
  o.signal = o.signal ? AbortSignal.any([o.signal, to]) : to;
  return fetch(url, o);
};

const getBm = () => { try { return JSON.parse(localStorage.getItem(BM_KEY) || '[]'); } catch (e) { return []; } };
const setBm = (l) => { try { localStorage.setItem(BM_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };
const getHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } };
const setHist = (l) => { try { localStorage.setItem(HIST_KEY, JSON.stringify(l.slice(0, 30))); } catch (e) {} };

// Bersihkan HTML Wikisource: buang script/navbox/edit-link; link wiki dipertahankan untuk navigasi dalam reader
function bersih(html) {
  const doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
  doc.querySelectorAll('script,style,img,.mw-editsection,.noprint,.navbox,.infobox,sup.reference,table').forEach((n) => n.remove());
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!/^(\/wiki\/|#)/.test(href)) {
      const sp = doc.createElement('span');
      sp.textContent = a.textContent;
      a.replaceWith(sp);
    } else {
      a.setAttribute('rel', 'noopener');
    }
  });
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => { if (/^on/i.test(a.name) || a.name === 'style') n.removeAttribute(a.name); });
  });
  return doc.body.firstChild;
}

function blokTeks(root) {
  return [...root.querySelectorAll('p,h2,h3,h4,li,blockquote')]
    .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 1);
}

// Terjemahan mesin (Google, cepat) — dipakai untuk mode Literal & sebagai cadangan
async function terjemahBatch(lang, teksArr, onProg, signal) {
  const out = new Array(teksArr.length);
  const sl = SL[lang] || 'auto';
  let done = 0;
  const kerja = async (i) => {
    const t = teksArr[i];
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

// Terjemahan AI (gaya Natural/Novel) via API publik; gagal -> jatuh ke mesin per paragraf
async function terjemahAI(lang, teksArr, mode, onProg, signal) {
  const batch = [];
  let cur = [], curLen = 0;
  teksArr.forEach((t, i) => {
    cur.push({ t, i }); curLen += t.length;
    if (curLen > 1400 || cur.length >= 8) { batch.push(cur); cur = []; curLen = 0; }
  });
  if (cur.length) batch.push(cur);
  const out = new Array(teksArr.length);
  let done = 0;
  const kerja = async (b) => {
    const to = AbortSignal.timeout(90000);
    const sig = signal ? AbortSignal.any([signal, to]) : to;
    let hasil = null;
    try {
      const prompt = 'Terjemahkan setiap teks ' + (NAMA_BAHASA[lang] || lang) + ' berikut ke Bahasa Indonesia (' + GAYA[mode] + ').\n' +
        'Balas HANYA dengan JSON array berisi string terjemahan — jumlah elemen SAMA PERSIS (' + b.length + '), urutan sama, tanpa markdown, tanpa penjelasan.\n\n' +
        b.map((x, k) => (k + 1) + '. ' + x.t).join('\n');
      const r = await fetch(AI_URL, {
        method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', temperature: 0.4, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const isi = (((j.choices || [])[0] || {}).message || {}).content || '';
      const m = isi.match(/\[[\s\S]*\]/);
      const arr = m ? JSON.parse(m[0]) : null;
      if (Array.isArray(arr) && arr.length === b.length) hasil = arr.map(String);
    } catch (e) { hasil = null; }
    if (!hasil) hasil = await terjemahBatch(lang, b.map((x) => x.t), () => {}, sig);
    b.forEach((x, k) => { out[x.i] = hasil[k]; });
    done += b.length; onProg(done, teksArr.length);
  };
  const antri = batch.slice();
  await Promise.all(Array.from({ length: 2 }, async () => { while (antri.length) await kerja(antri.shift()); }));
  return out;
}

export function render(root) {
  let ctl = null, lang = 'zh', judul = '', chapters = [], chIdx = 0, pageTitle = '';
  let fontSize = 20, view = 'orig', mode = 'natural';
  let timerHist = null, rafScroll = false;
  const cacheTeks = new Map(); // (lang|judul|ref|view|mode) -> html
  onLeave(() => { if (ctl) ctl.abort(); clearTimeout(timerHist); window.removeEventListener('scroll', jadwalProgres); });
  const abort = () => { if (ctl) ctl.abort(); ctl = new AbortController(); return ctl.signal; };

  const srcSel = T.select(SUMBER, 'zh');
  const qInp = T.input('text', 'Judul karya… mis. 紅樓夢 / 源氏物語 / 춘향전', '');
  qInp.autocomplete = 'off';
  const hasilBox = T.out(), rakBox = T.out(), babBox = T.out(), bacaBox = T.out(),
    navBox = T.out(), progBox = T.out(), statusBox = T.out();

  const cari = async () => {
    const q = qInp.value.trim();
    if (!q) { T.show(hasilBox, errBox('Isi dulu judul karyanya.')); return; }
    lang = srcSel.value;
    const sig = abort();
    T.show(hasilBox, '<p class="dim">Mencari di Wikisource…</p>');
    T.hide(babBox); T.hide(bacaBox); T.hide(navBox); T.hide(progBox);
    try {
      const j = await (await wfetch(api(lang, { action: 'query', list: 'search', srsearch: q, srlimit: 15 }), { signal: sig })).json();
      const list = ((j.query || {}).search) || [];
      if (!list.length) { T.show(hasilBox, '<p class="dim">Tidak ketemu. Coba judul asli (mis. 紅樓夢 untuk Tiongkok).</p>'); return; }
      T.show(hasilBox, '<p class="dim" style="font-size:12.5px">' + list.length + ' hasil — pilih karya untuk mulai membaca:</p><div style="display:grid;gap:6px">' +
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
    T.hide(bacaBox); T.hide(navBox); T.hide(progBox);
    try {
      const [js, jp] = await Promise.all([
        (await wfetch(api(lang, { action: 'parse', page: judul, prop: 'sections' }), { signal: sig })).json(),
        (await wfetch(api(lang, { action: 'query', list: 'allpages', apprefix: judul + '/', aplimit: 200, apnamespace: 0 }), { signal: sig })).json(),
      ]);
      if (js.error) throw new Error(js.error.info || 'halaman tidak ditemukan');
      const subs = ((jp.query || {}).allpages) || [];
      const daftar = subs.map((p) => p.title).filter((t) => t !== judul);
      if (daftar.length) {
        chapters = daftar.map((t) => ({ label: t.slice(judul.length + 1) || t, kind: 'sub', ref: t }));
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
    const ch = chapters[chIdx] || {};
    T.show(babBox, '<p style="font-size:14px;margin:12px 0 6px"><b>' + T.esc(judul) + '</b> <span class="dim" style="font-size:12px">(' + chapters.length + ' bagian)</span></p>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="dim" style="font-size:12px">Bab</label>' +
      '<select data-c="bab" style="flex:1;min-width:180px;max-width:100%">' +
      chapters.map((c, i) => '<option value="' + i + '"' + (i === chIdx ? ' selected' : '') + '>' + T.esc(c.label || ('Bagian ' + (i + 1))) + '</option>').join('') +
      '</select></div>');
    babBox.querySelector('[data-c=bab]').onchange = (e) => bukaBab(+e.target.value);
  };

  const bukaBab = async (i, resumeY) => {
    simpanHist();
    chIdx = Math.max(0, Math.min(i, Math.max(0, chapters.length - 1)));
    tampilDaftarBab();
    await muatBab();
    window.scrollTo({ top: typeof resumeY === 'number' ? resumeY : 0, behavior: 'smooth' });
  };

  // Navigasi dari link di dalam teks bacaan
  const bukaJudul = (title) => {
    if (title === pageTitle) return;
    if (title.indexOf(judul + '/') === 0) {
      const idx = chapters.findIndex((c) => c.kind === 'sub' && c.ref === title);
      if (idx >= 0) { bukaBab(idx); return; }
      chapters = [{ label: title.slice(judul.length + 1), kind: 'sub', ref: title }];
      chIdx = 0; tampilDaftarBab(); muatBab();
      return;
    }
    bukaKarya(title);
  };

  const muatBab = async () => {
    const ch = chapters[chIdx];
    if (!ch) return;
    pageTitle = ch.kind === 'sub' ? ch.ref : judul;
    const key = lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|' + view + '|' + mode;
    const namaBab = ch.label || 'Teks';
    if (cacheTeks.has(key)) { tampilBaca(cacheTeks.get(key), namaBab, ''); return; }
    const sig = abort();
    T.show(bacaBox, '<p class="dim">Memuat ' + (view === 'orig' ? 'teks asli' : 'bacaan') + '…</p>');
    T.hide(navBox); T.hide(progBox); T.hide(statusBox);
    try {
      const params = ch.kind === 'sub'
        ? { action: 'parse', page: ch.ref, prop: 'text' }
        : { action: 'parse', page: judul, prop: 'text', section: ch.ref };
      const j = await (await wfetch(api(lang, params), { signal: sig })).json();
      if (j.error) throw new Error(j.error.info || 'gagal memuat');
      const node = bersih(j.parse.text['*']);
      let html, catatan = '';
      if (view === 'orig') {
        html = node.innerHTML;
      } else {
        const ck = lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|terjemah|' + mode;
        if (cacheTeks.has(ck)) {
          html = cacheTeks.get(ck);
        } else {
          html = node.innerHTML;
          catatan = 'Terjemahan mode ' + mode + ' belum tersedia — tekan "Terjemahkan bab".';
        }
      }
      cacheTeks.set(key, html);
      tampilBaca(html, namaBab, catatan);
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(bacaBox, errBox('Gagal memuat bab: ' + e.message));
    }
  };

  const terjemahBab = async () => {
    const ch = chapters[chIdx];
    if (!ch) return;
    const btn = tbBtn;
    btn.disabled = true;
    const sig = abort();
    T.show(statusBox, '<p class="dim">Menerjemahkan bab (' + mode + ')… kamu tetap bisa membaca teks asli.</p>');
    try {
      const params = ch.kind === 'sub'
        ? { action: 'parse', page: ch.ref, prop: 'text' }
        : { action: 'parse', page: judul, prop: 'text', section: ch.ref };
      const j = await (await wfetch(api(lang, params), { signal: sig })).json();
      if (j.error) throw new Error(j.error.info || 'gagal memuat');
      const node = bersih(j.parse.text['*']);
      const blok = blokTeks(node);
      if (!blok.length) throw new Error('tidak ada paragraf teks');
      T.show(statusBox, '<p class="dim">Menerjemahkan <span data-p="n">0</span>/' + blok.length + ' paragraf…</p>');
      const pn = statusBox.querySelector('[data-p=n]');
      const hasil = mode === 'literal'
        ? await terjemahBatch(lang, blok, (d) => { if (pn) pn.textContent = d; }, sig)
        : await terjemahAI(lang, blok, mode, (d) => { if (pn) pn.textContent = d; }, sig);
      const wrap = node.cloneNode(true);
      const els = [...wrap.querySelectorAll('p,h2,h3,h4,li,blockquote')].filter((n) => n.textContent.replace(/\s+/g, ' ').trim().length > 1);
      els.forEach((el, i) => {
        if (i >= hasil.length) return;
        if (view === 'bi' || viewSel.value === 'orig') {
          const d = document.createElement('div');
          d.style.cssText = 'border-left:2px solid #ff7a5966;padding-left:10px;margin:10px 0;color:#c9bda9;font-size:0.92em';
          d.textContent = hasil[i];
          el.after(d);
        } else {
          el.textContent = hasil[i];
        }
      });
      const ck = lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|terjemah|' + mode;
      cacheTeks.set(ck, wrap.innerHTML);
      cacheTeks.delete(lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|id|' + mode);
      cacheTeks.delete(lang + '|' + judul + '|' + ch.kind + ':' + ch.ref + '|bi|' + mode);
      T.show(statusBox, '<p class="dim">Terjemahan ' + mode + ' tersedia' + (mode === 'literal' ? ' (mesin)' : ' (AI)') + '.</p>');
      if (viewSel.value === 'orig') viewSel.value = 'bi';
      view = viewSel.value;
      muatBab();
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(statusBox, errBox('Terjemahan gagal: ' + e.message + ' Teks asli tetap dapat dibaca.'));
    } finally {
      btn.disabled = false;
    }
  };

  const tampilBaca = (html, namaBab, catatan) => {
    const bm = getBm().some((b) => b.lang === lang && b.judul === judul && b.ch === chIdx);
    T.show(bacaBox,
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0">' +
      '<b style="font-size:14px">' + T.esc(namaBab || 'Teks') + '</b>' +
      '<button class="btn" data-bm="1" style="font-size:12px" aria-pressed="' + bm + '">' + (bm ? 'Hapus bookmark' : 'Simpan bookmark') + '</button></div>' +
      '<article data-a="isi" style="font-size:' + fontSize + 'px;line-height:2;border:1px solid #ffffff14;border-radius:12px;padding:16px;background:#12100d;overflow-wrap:anywhere">' + html + '</article>' +
      '<p class="dim" style="font-size:11.5px;margin-top:8px">Sumber teks: ' + T.esc(lang) + '.wikisource.org (public domain) · ' +
      '<a href="https://' + T.esc(lang) + '.wikisource.org/wiki/' + encodeURIComponent(pageTitle.replace(/ /g, '_')) + '" target="_blank" rel="noopener" style="color:#8ab8ff">Lihat aslinya</a>' +
      (view === 'orig' ? '' : ' · Terjemahan ' + (mode === 'literal' ? 'mesin' : 'AI') + ' — bisa tidak akurat untuk bahasa klasik') + '</p>');
    if (catatan) T.show(statusBox, '<p class="dim">' + T.esc(catatan) + '</p>');
    bacaBox.querySelector('[data-bm]').onclick = (e) => {
      let l = getBm();
      l = bm ? l.filter((b) => !(b.lang === lang && b.judul === judul && b.ch === chIdx))
             : [{ lang, judul, ch: chIdx, label: namaBab, t: Date.now() }, ...l];
      setBm(l);
      e.target.textContent = bm ? 'Simpan bookmark' : 'Hapus bookmark';
      e.target.setAttribute('aria-pressed', String(!bm));
      T.toast(bm ? 'Bookmark dihapus' : 'Ditandai!');
      tampilRak();
    };
    // link dalam bacaan: #jangkar -> scroll, /wiki/ se-origin -> buka dalam reader
    const origin = 'https://' + lang + '.wikisource.org';
    bacaBox.querySelectorAll('article a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href.charAt(0) === '#') {
        a.onclick = (ev) => {
          ev.preventDefault();
          let t = null;
          try { t = bacaBox.querySelector('[id="' + decodeURIComponent(href.slice(1)).replace(/"/g, '') + '"]'); } catch (e) {}
          if (t) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        };
        return;
      }
      let url = null;
      try { url = new URL(href, origin); } catch (e) {}
      if (url && url.origin === origin && url.pathname.indexOf('/wiki/') === 0) {
        const title = decodeURIComponent(url.pathname.slice(6)).replace(/_/g, ' ');
        if (title && title.length <= 240 && !/[:#{}\[\]|\r\n]/.test(title)) {
          a.onclick = (ev) => { ev.preventDefault(); bukaJudul(title); };
          return;
        }
      }
      a.setAttribute('target', '_blank');
    });
    T.show(navBox, '<div style="display:flex;gap:8px;margin-top:10px">' +
      (chIdx > 0 ? '<button class="btn" data-n="p">Bab sebelumnya</button>' : '') +
      (chIdx < chapters.length - 1 ? '<button class="btn primary" data-n="n">Bab berikutnya</button>' : '') + '</div>');
    const pn = navBox.querySelector('[data-n=p]'); if (pn) pn.onclick = () => bukaBab(chIdx - 1);
    const nn = navBox.querySelector('[data-n=n]'); if (nn) nn.onclick = () => bukaBab(chIdx + 1);
    T.show(progBox, '<div style="margin-top:10px" role="status" aria-label="Progres membaca"><div style="height:6px;border-radius:99px;background:#2a251f;overflow:hidden"><i data-p="bar" style="display:block;height:100%;width:0%;background:#ff7a59;transition:width .2s"></i></div><div class="dim" style="font-size:11px;text-align:right;margin-top:2px"><span data-p="txt">0%</span> dibaca</div></div>');
    hitungProgres();
  };

  const hitungProgres = () => {
    const art = bacaBox.querySelector('[data-a=isi]');
    const bar = progBox.querySelector('[data-p=bar]'), txt = progBox.querySelector('[data-p=txt]');
    if (!art || !bar) return 0;
    const r = art.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const total = r.height;
    const sudah = Math.min(Math.max(vh - r.top, 0), total);
    const p = total > 0 ? Math.round(sudah / total * 100) : 100;
    bar.style.width = p + '%'; if (txt) txt.textContent = p + '%';
    return p;
  };
  const jadwalProgres = () => {
    if (rafScroll) return;
    rafScroll = true;
    requestAnimationFrame(() => {
      rafScroll = false;
      const p = hitungProgres();
      if (p > 0) {
        clearTimeout(timerHist);
        timerHist = setTimeout(simpanHist, 4000);
      }
    });
  };
  window.addEventListener('scroll', jadwalProgres, { passive: true });

  const simpanHist = () => {
    if (!judul || !chapters.length) return;
    const ch = chapters[chIdx];
    const p = hitungProgres();
    const y = window.scrollY || 0;
    const ada = getHist().some((x) => x.lang === lang && x.judul === judul && x.ch === chIdx);
    if (p === 0 && y === 0 && !ada) return; // jangan catat bab yang belum dibaca sama sekali
    const item = { lang, judul, ch: chIdx, label: ch ? ch.label : '', progress: p, y, t: Date.now() };
    const l = getHist().filter((x) => !(x.lang === lang && x.judul === judul && x.ch === chIdx));
    setHist([item, ...l]);
    tampilRak();
  };

  const tampilRak = () => {
    const hist = getHist(), bm = getBm();
    if (!hist.length && !bm.length) {
      T.show(rakBox, '<details open style="border:1px solid #ffffff18;border-radius:12px;padding:10px 14px;margin-top:12px"><summary style="font-size:13px;cursor:pointer"><b>Lanjut Baca &amp; Bookmark</b></summary><p class="dim" style="font-size:12.5px">Belum ada bacaan tersimpan.</p></details>');
      return;
    }
    let isi = '<details open style="border:1px solid #ffffff18;border-radius:12px;padding:10px 14px;margin-top:12px"><summary style="font-size:13px;cursor:pointer"><b>Lanjut Baca &amp; Bookmark</b></summary>';
    if (hist.length) {
      isi += '<p class="dim" style="font-size:11.5px;margin:10px 0 6px">LANJUT BACA</p><div style="display:grid;gap:6px">' +
        hist.slice(0, 8).map((h, i) => '<button class="btn" data-rh="' + i + '" style="text-align:left;font-size:12.5px"><b>' + T.esc(h.judul) + '</b> <span class="dim">· ' + T.esc(h.label || ('bagian ' + ((h.ch || 0) + 1))) + ' · ' + (h.progress || 0) + '%</span></button>').join('') + '</div>';
    }
    if (bm.length) {
      isi += '<p class="dim" style="font-size:11.5px;margin:10px 0 6px">BOOKMARK</p><div style="display:grid;gap:6px">' +
        bm.slice(0, 10).map((b, i) => '<button class="btn" data-rb="' + i + '" style="text-align:left;font-size:12.5px"><b>' + T.esc(b.judul) + '</b> <span class="dim">· ' + T.esc(b.label || ('bagian ' + ((b.ch || 0) + 1))) + '</span></button>').join('') + '</div>';
    }
    isi += '</details>';
    T.show(rakBox, isi);
    rakBox.querySelectorAll('[data-rh]').forEach((b) => {
      b.onclick = () => {
        const h = getHist()[+b.getAttribute('data-rh')];
        if (!h) return;
        lang = h.lang; srcSel.value = lang;
        bukaKarya(h.judul).then(() => bukaBab(h.ch || 0, h.y || 0));
      };
    });
    rakBox.querySelectorAll('[data-rb]').forEach((b) => {
      b.onclick = () => {
        const x = getBm()[+b.getAttribute('data-rb')];
        if (!x) return;
        lang = x.lang; srcSel.value = lang;
        bukaKarya(x.judul).then(() => bukaBab(x.ch || 0));
      };
    });
  };

  // kontrol baca
  const viewSel = T.select([['orig', 'Teks Asli'], ['id', 'Indonesia'], ['bi', 'Bilingual']], 'orig');
  const modeSel = T.select([['literal', 'Literal'], ['natural', 'Natural'], ['novel', 'Novel']], 'natural');
  const tbBtn = T.btn('Terjemahkan bab', terjemahBab, true);
  const fsRange = document.createElement('input');
  fsRange.type = 'range'; fsRange.min = '16'; fsRange.max = '28'; fsRange.value = '20';
  fsRange.style.width = '140px';
  viewSel.onchange = () => { view = viewSel.value; T.hide(statusBox); if (judul) muatBab(); };
  modeSel.onchange = () => { mode = modeSel.value; T.hide(statusBox); };
  fsRange.oninput = () => { fontSize = +fsRange.value; const a = bacaBox.querySelector('article'); if (a) a.style.fontSize = fontSize + 'px'; };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Perpustakaan sastra klasik Tiongkok, Jepang, dan Korea — teks <b>public domain</b> langsung dari Wikisource (bukan bajakan). Cari karya, baca per bab, terjemahkan ke Indonesia, tandai bacaanmu.</p>'));
  root.appendChild(T.el('<div style="display:grid;grid-template-columns:1fr 2fr;gap:8px"></div>'));
  const fr = root.lastChild;
  fr.appendChild(T.field('Sumber', srcSel));
  fr.appendChild(T.field('Judul karya', qInp));
  root.appendChild(T.row(T.btn('Cari Karya', cari, true)));
  root.appendChild(hasilBox);
  root.appendChild(rakBox);
  root.appendChild(babBox);
  root.appendChild(T.el('<div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin-top:10px"></div>'));
  const cr = root.lastChild;
  cr.appendChild(T.field('Tampilan', viewSel));
  cr.appendChild(T.field('Mode terjemahan', modeSel));
  const fsWrap = T.el('<div><label style="font-size:12px" class="dim">Ukuran huruf</label><br></div>');
  fsWrap.appendChild(fsRange);
  cr.appendChild(fsWrap);
  root.appendChild(T.row(tbBtn));
  root.appendChild(statusBox);
  root.appendChild(bacaBox);
  root.appendChild(progBox);
  root.appendChild(navBox);
  tampilRak();
}
