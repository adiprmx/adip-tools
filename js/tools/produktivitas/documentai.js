import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"documentai","name":"Document AI","cat":"produktivitas","icon":"📄","desc":"Analisis dokumen dengan LLM milikmu (OpenAI-compatible).","keywords":"ai,dokumen,llm,ringkasan,analisis,openai,pdf,gambar,vision,tabel"};

const MODES = [
  ['ringkas', '📝 Ringkasan Cerdas'],
  ['dalam', '🔬 Analisis Mendalam'],
  ['belajar', '🎓 Catatan Belajar'],
  ['tabel', '📊 Ekstrak Tabel'],
];

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_PDF_MB = 3;    // dokumen teks/PDF
const MAKS_FOTO_MB = 12;  // foto sebelum optimasi (hasil akhir tetap ≤3 MB)
const MAKS_HALAMAN_PDF = 10;

const INSTRUKSI = {
  ringkas: 'Buat RINGKASAN CERDAS dalam Bahasa Indonesia: "summary" = 1 paragraf inti lalu poin-poinnya; "keyPoints" = maks 8 fakta penting; "actions" = tindakan yang disarankan bila ada.',
  dalam: 'Buat ANALISIS MENDALAM dalam Bahasa Indonesia: "summary" memakai struktur pendahuluan/isi/kesimpulan — argumen utama, data & angka penting, kelemahan/celah logika, lalu kesimpulan; "keyPoints" = argumen utama; "actions" = rekomendasi.',
  belajar: 'Buat CATATAN BELAJAR dalam Bahasa Indonesia: "studyNotes" = konsep kunci + penjelasan sederhana + istilah penting + definisinya; "keyPoints" = konsep kuncinya saja; "summary" = ringkasan 1 paragraf.',
  tabel: 'EKSTRAK SEMUA tabel/data terstruktur dari dokumen: isi "tables" selengkap mungkin ("headers" = baris header bila ada; "rows" = baris data sebagai array sel string). Bila tidak ada tabel: "tables" = [] dan "summary" = "TIDAK ADA TABEL". Jangan tambah penjelasan di luar JSON.',
};

const SKEMA = 'Jawab HANYA dengan satu objek JSON valid (tanpa markdown fence, tanpa teks lain) memakai skema persis ini:\n' +
  '{"title":"judul singkat dokumen","summary":"...","keyPoints":["..."],"actions":["..."],"studyNotes":["..."],' +
  '"tables":[{"title":"...","headers":["..."],"rows":[["..."]]}],"extractedText":"...","documentType":"...","language":"..."}\n' +
  '- "summary": hasil utama mode ini, Bahasa Indonesia (multi-paragraf boleh, pisahkan dengan \\n\\n).\n' +
  '- "keyPoints"/"actions"/"studyNotes": array string, [] bila tidak relevan untuk mode ini.\n' +
  '- "tables": [] bila tidak ada tabel.\n' +
  '- "extractedText": untuk dokumen teks = 4000 karakter pertama dokumen; untuk gambar = deskripsi isi visual 2-3 kalimat.\n' +
  '- "documentType"/"language": tebak singkat, mis. "Laporan"/"Indonesia".';

// Markdown mini secukupnya: heading, bold, list, code, paragraf
function md(s) {
  let h = T.esc(String(s || ''));
  const lines = h.split('\n');
  let out = '', inList = false;
  const inline = (t) => t
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code style="background:#ffffff14;padding:1px 5px;border-radius:4px">$1</code>');
  for (const ln of lines) {
    const t = ln.trim();
    if (/^#{1,4}\s/.test(t)) {
      if (inList) { out += '</ul>'; inList = false; }
      const lv = t.match(/^(#{1,4})/)[1].length;
      out += '<div style="font-weight:700;font-size:' + (17 - lv) + 'px;margin:10px 0 4px">' + inline(t.replace(/^#+\s*/, '')) + '</div>';
    } else if (/^([-*•]|\d+\.)\s/.test(t)) {
      if (!inList) { out += '<ul style="margin:6px 0;padding-left:20px;font-size:13px;line-height:1.65">'; inList = true; }
      out += '<li>' + inline(t.replace(/^([-*•]|\d+\.)\s*/, '')) + '</li>';
    } else if (!t) {
      if (inList) { out += '</ul>'; inList = false; }
    } else {
      if (inList) { out += '</ul>'; inList = false; }
      out += '<p style="font-size:13px;line-height:1.7;margin:6px 0">' + inline(t) + '</p>';
    }
  }
  if (inList) out += '</ul>';
  return out;
}

// Fungsi murni (diekspor agar bisa diuji di Node — tanpa DOM)
export function selCSV(v) {
  v = String(v ?? '');
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export function tabelKeTeksCSV(t) {
  const baris = [(t.headers || []), ...((t.rows || []))];
  return '﻿' + baris.map((r) => r.map(selCSV).join(',')).join('\r\n');
}

const namaAman = (v) => String(v || 'dokumen').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'dokumen';
const fmtMB = (b) => b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

// Ambil JSON dari respons model (toleran fence markdown & teks pengantar)
export function parseJSONLepas(s) {
  let t = String(s || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  const o = JSON.parse(t);
  if (!o || typeof o.summary !== 'string') throw new Error('skema tak valid');
  const arr = (x) => Array.isArray(x) ? x.map(String) : [];
  return {
    title: String(o.title || 'Hasil analisis'),
    summary: o.summary,
    keyPoints: arr(o.keyPoints),
    actions: arr(o.actions),
    studyNotes: arr(o.studyNotes),
    tables: Array.isArray(o.tables) ? o.tables.map((x) => ({
      title: String((x && x.title) || 'Tabel'),
      headers: arr(x && x.headers),
      rows: Array.isArray(x && x.rows) ? x.rows.map((r) => (Array.isArray(r) ? r.map(String) : [String(r)])) : [],
    })) : [],
    extractedText: String(o.extractedText || ''),
    documentType: String(o.documentType || ''),
    language: String(o.language || ''),
  };
}

export function render(root) {
  let pdfJsSiap = null;
  const pastPdfJs = () => {
    if (!pdfJsSiap) {
      pdfJsSiap = T.loadScript(PDFJS_CDN).then((ok) => {
        if (ok && window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return ok && !!window.pdfjsLib;
      });
    }
    return pdfJsSiap;
  };

  // PDF → teks (maks MAKS_HALAMAN_PDF halaman pertama)
  const pdfKeTeks = async (buffer) => {
    if (!(await pastPdfJs())) throw new Error('Pustaka PDF gagal dimuat dari CDN.');
    const doc = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const n = Math.min(doc.numPages, MAKS_HALAMAN_PDF);
    let teks = '';
    for (let i = 1; i <= n; i++) {
      const pg = await doc.getPage(i);
      const tc = await pg.getTextContent();
      teks += tc.items.map((it) => it.str).join(' ') + '\n\n';
    }
    try { await doc.destroy(); } catch (e) {}
    return { teks: teks.replace(/[ \t]+/g, ' ').trim(), halaman: doc.numPages };
  };

  // Foto → JPEG teroptimasi (sisi maks 1800px), siap kirim ke model vision
  const gambarKeDataUrl = (file) => new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const sk = Math.min(1, 1800 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sk));
        c.height = Math.max(1, Math.round(img.height * sk));
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => {
          if (!b) return rej(new Error('Gagal mengoptimasi gambar.'));
          const r = new FileReader();
          r.onload = () => res({ dataUrl: String(r.result), bytes: b.size, w: c.width, h: c.height });
          r.onerror = () => rej(new Error('Gagal membaca gambar.'));
          r.readAsDataURL(b);
        }, 'image/jpeg', 0.86);
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak bisa dibuka.')); };
    img.src = url;
  });

  const keyF = utils.byok.field({
    tool: 'documentai',
    label: 'LLM API key',
    placeholder: 'Tempel API key LLM milikmu',
    docUrl: 'https://platform.openai.com/api-keys',
    docLabel: 'Dapatkan key di OpenAI (atau provider kompatibel lain)',
    hint: 'Kompatibel OpenAI: OpenAI, dan provider lain yang menyediakan endpoint /v1/chat/completions. Key hanya dipakai untuk request langsung ke endpoint di bawah.',
  });
  root.appendChild(keyF.box);

  const baseInp = T.input('text', 'https://api.openai.com/v1', utils.byok.get('documentai_base') || 'https://api.openai.com/v1');
  const modelInp = T.input('text', 'gpt-4o-mini', utils.byok.get('documentai_model') || 'gpt-4o-mini');
  baseInp.addEventListener('change', () => utils.byok.set('documentai_base', baseInp.value.trim().replace(/\/+$/, '')));
  modelInp.addEventListener('change', () => utils.byok.set('documentai_model', modelInp.value.trim()));
  root.appendChild(T.grid2(
    T.field('Endpoint (OpenAI-compatible)', baseInp, 'Tanpa garis miring di akhir.'),
    T.field('Model', modelInp, 'Contoh: gpt-4o-mini, gpt-4o. Untuk gambar butuh model vision.')
  ));

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload dokumen (PDF, foto/scan, TXT/MD/CSV) → AI meringkas, menganalisis, atau mengekstrak tabel. ' +
    'Pakai <b>API key LLM milikmu</b> (endpoint kompatibel OpenAI). File hanya dikirim ke endpoint yang kamu konfigurasi — tidak lewat server mana pun.</p>'));

  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = '.pdf,.jpg,.jpeg,.png,.webp,.txt,.md,.csv,application/pdf,image/jpeg,image/png,image/webp,text/plain,text/markdown,text/csv';
  fileInp.className = 'inp';
  const fileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  const fileCard = T.el('<div id="dai-filecard" style="display:none;border:1px solid #ffffff20;border-radius:10px;padding:8px 10px;background:#161311;align-items:center;gap:10px;margin-top:8px">' +
    '<div style="flex:1;min-width:0"><div id="dai-fnama" style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>' +
    '<div id="dai-fmeta" class="dim" style="font-size:12px"></div></div>' +
    '<button type="button" class="btn" id="dai-fhapus" style="font-size:12px">Hapus</button></div>');
  let docFile = null; // {kind:'teks'|'gambar', name, text?, dataUrl?, meta}

  const tampilKartuFile = () => {
    if (!docFile) { fileCard.style.display = 'none'; fileInfo.textContent = ''; return; }
    fileCard.querySelector('#dai-fnama').textContent = docFile.name;
    fileCard.querySelector('#dai-fmeta').textContent = docFile.meta;
    fileCard.style.display = 'flex';
    fileInfo.textContent = '';
  };
  fileCard.querySelector('#dai-fhapus').onclick = () => {
    docFile = null; teksArea.value = '';
    tampilKartuFile(); segarkanTombol();
  };

  fileInp.addEventListener('change', async () => {
    const f = fileInp.files[0];
    fileInp.value = '';
    if (!f) return;
    const ext = (f.name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
    let mime = String(f.type || '').toLowerCase();
    if (!mime || mime === 'application/octet-stream') {
      mime = ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv' })[ext] || mime;
    }
    const boleh = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/markdown', 'text/csv'];
    if (!boleh.includes(mime)) { fileInfo.textContent = 'Format belum didukung. Pakai PDF, JPG, PNG, WEBP, TXT, MD, atau CSV.'; return; }
    const isImg = mime.startsWith('image/');
    const batas = isImg ? MAKS_FOTO_MB : MAKS_PDF_MB;
    if (f.size > batas * 1024 * 1024) { fileInfo.textContent = 'File melebihi ' + batas + ' MB.'; return; }
    fileInfo.textContent = 'Membaca ' + f.name + '…';
    try {
      if (isImg) {
        const g = await gambarKeDataUrl(f);
        if (g.bytes > MAKS_PDF_MB * 1024 * 1024) throw new Error('Gambar masih melebihi 3 MB setelah optimasi.');
        docFile = { kind: 'gambar', name: f.name, dataUrl: g.dataUrl, meta: fmtMB(f.size) + ' → ' + fmtMB(g.bytes) + ' · ' + g.w + '×' + g.h + ' px' };
      } else if (mime === 'application/pdf') {
        const r = await pdfKeTeks(await f.arrayBuffer());
        if (!r.teks) throw new Error('Tidak ada teks terbaca dari PDF ini (kemungkinan hasil scan berupa gambar — pakai sebagai gambar/foto).');
        const t = r.teks.slice(0, 120000);
        docFile = {
          kind: 'teks', name: f.name, text: t,
          meta: r.halaman + ' halaman' + (r.halaman > MAKS_HALAMAN_PDF ? ' (dianalisis ' + MAKS_HALAMAN_PDF + ' pertama)' : '') + ' · ' + t.length + ' karakter',
        };
        teksArea.value = t;
      } else {
        const t = (await f.text()).slice(0, 120000);
        docFile = { kind: 'teks', name: f.name, text: t, meta: fmtMB(f.size) + ' · ' + t.length + ' karakter' };
        teksArea.value = t;
      }
      tampilKartuFile();
    } catch (e) {
      docFile = null; tampilKartuFile();
      fileInfo.textContent = 'Gagal: ' + (e.message || e);
    }
    segarkanTombol();
  });

  const teksArea = T.ta(8, '…atau tempel isi dokumen di sini (maks ±120 ribu karakter)');
  teksArea.addEventListener('input', () => segarkanTombol());

  const modeRg = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0"></div>');
  let mode = 'ringkas';
  const modeBtns = MODES.map(([v, l]) => {
    const b = T.btn(l, () => { mode = v; modeBtns.forEach((x, i) => x.classList.toggle('primary', MODES[i][0] === v)); });
    modeRg.appendChild(b);
    return b;
  });
  modeBtns[0].classList.add('primary');

  const out = T.out();
  let busy = false;
  let hasilTerakhir = null;
  let docSumberTerakhir = null;
  const history = []; // chat follow-up

  const bangunSumber = () => {
    if (docFile && docFile.kind === 'gambar') return docFile;
    const t = (teksArea.value || '').trim();
    if (t) return { kind: 'teks', text: t, name: (docFile && docFile.name) || 'teks-tempel' };
    return null;
  };
  const segarkanTombol = () => { analisisBtn.disabled = busy || !bangunSumber(); };

  const TAHAP = ['Menyiapkan dokumen…', 'Mengirim ke model…', 'Menyusun hasil…', 'Memeriksa hasil…'];
  let tahapTimer = null;
  const mulaiTahap = () => {
    let i = 0;
    T.show(out, '<div class="dim center" id="dai-tahap" style="padding:18px">' + TAHAP[0] + '</div>');
    tahapTimer = setInterval(() => {
      i = Math.min(TAHAP.length - 1, i + 1);
      const elx = out.querySelector('#dai-tahap');
      if (elx) elx.textContent = TAHAP[i];
    }, 2200);
  };
  const stopTahap = () => { if (tahapTimer) clearInterval(tahapTimer); tahapTimer = null; };

  async function panggil(messages, timeoutMs) {
    const key = keyF.get();
    if (!key) throw new Error('NO_KEY');
    const base = (baseInp.value.trim().replace(/\/+$/, '') || 'https://api.openai.com/v1');
    const model = modelInp.value.trim() || 'gpt-4o-mini';
    utils.byok.set('documentai_base', base);
    utils.byok.set('documentai_model', model);
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs || 85000);
    try {
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model, messages, temperature: 0.3 }),
        signal: c.signal,
      });
      if (r.status === 401) throw new Error('API key ditolak (401). Cek key & endpoint.');
      if (r.status === 404) throw new Error('Endpoint/model tidak ditemukan (404). Cek base URL & nama model.');
      if (r.status === 429) throw new Error('Rate limit / kuota habis (429).');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const txt = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
      if (!txt) throw new Error('Respons LLM kosong.');
      return txt;
    } finally { clearTimeout(t); }
  }

  const bangunPesan = (sumber, md2) => {
    const sys = INSTRUKSI[md2] + '\n\n' + SKEMA;
    if (sumber.kind === 'gambar') {
      return [
        { role: 'system', content: sys },
        {
          role: 'user', content: [
            { type: 'text', text: 'Analisis gambar dokumen "' + sumber.name + '" berikut sesuai instruksi mode. Jawab hanya JSON sesuai skema.' },
            { type: 'image_url', image_url: { url: sumber.dataUrl } },
          ],
        },
      ];
    }
    return [
      { role: 'system', content: sys },
      { role: 'user', content: 'Dokumen (' + sumber.name + '):\n\n' + sumber.text.slice(0, 120000) },
    ];
  };

  const eksporTxt = (a) =>
    a.title + '\n\n' + a.summary +
    (a.keyPoints.length ? '\n\nPOIN PENTING\n' + a.keyPoints.map((x) => '- ' + x).join('\n') : '') +
    (a.actions.length ? '\n\nTINDAKAN\n' + a.actions.map((x) => '- ' + x).join('\n') : '') +
    (a.studyNotes.length ? '\n\nCATATAN BELAJAR\n' + a.studyNotes.map((x) => '- ' + x).join('\n') : '') +
    (a.extractedText ? '\n\nTEKS DOKUMEN\n' + a.extractedText : '');

  const eksporWord = (a) =>
    '<!doctype html><html><head><meta charset="utf-8"><title>' + T.esc(a.title) + '</title></head><body>' +
    '<h1>' + T.esc(a.title) + '</h1>' + md(a.summary) +
    (a.keyPoints.length ? '<h2>Poin penting</h2><ul>' + a.keyPoints.map((x) => '<li>' + T.esc(x) + '</li>').join('') + '</ul>' : '') +
    (a.actions.length ? '<h2>Tindakan</h2><ul>' + a.actions.map((x) => '<li>' + T.esc(x) + '</li>').join('') + '</ul>' : '') +
    (a.extractedText ? '<h2>Teks dokumen</h2><p>' + T.esc(a.extractedText).replace(/\n/g, '<br>') + '</p>' : '') +
    '</body></html>';

  function paintHasil() {
    const a = hasilTerakhir;
    stopTahap();
    T.show(out, '');
    out.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin-bottom:6px">' + T.esc(a.title) + '</div>'));
    const metaLine = [docSumberTerakhir.name, a.documentType, a.language].filter(Boolean);
    if (metaLine.length) out.appendChild(T.el('<div class="dim" style="font-size:12px;margin-bottom:8px">' + metaLine.map(T.esc).join(' · ') + '</div>'));

    const tabDefs = [
      ['ringkasan', 'Ringkasan'],
      ['poin', 'Poin'],
      ['teks', 'Teks'],
      ['tabel', 'Tabel' + (a.tables.length ? ' (' + a.tables.length + ')' : '')],
      ['tanya', 'Tanya AI'],
    ];
    const bar = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"></div>');
    const panel = T.el('<div></div>');
    const daftar = (judul, items) => (items && items.length)
      ? '<div style="font-weight:700;font-size:13px;margin:12px 0 6px">' + T.esc(judul) + '</div><ol style="margin:6px 0;padding-left:20px;font-size:13px;line-height:1.7">' +
        items.map((x) => '<li style="margin-bottom:4px">' + md(x) + '</li>').join('') + '</ol>' : '';
    const kartuTabel = (t, i) => {
      const nKol = Math.max(t.headers.length, ...t.rows.map((r) => r.length), 1);
      const hh = t.headers.length ? t.headers : Array.from({ length: nKol }, (_, k) => 'Kolom ' + (k + 1));
      return '<div style="border:1px solid #ffffff14;border-radius:10px;margin-bottom:10px;overflow:hidden">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;background:#ffffff08">' +
        '<b style="font-size:13px">Tabel ' + (i + 1) + (t.title ? ' — ' + T.esc(t.title) : '') + '</b>' +
        '<button type="button" class="btn" data-csv="' + i + '" style="font-size:12px">Unduh CSV</button></div>' +
        '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:12.5px;min-width:100%">' +
        '<tr>' + hh.map((h) => '<th style="border:1px solid #ffffff20;padding:6px 8px;text-align:left;background:#ffffff0a">' + T.esc(h) + '</th>').join('') + '</tr>' +
        t.rows.slice(0, 200).map((r) => '<tr>' + hh.map((_, k) => '<td style="border:1px solid #ffffff14;padding:6px 8px">' + T.esc(r[k] || '') + '</td>').join('') + '</tr>').join('') +
        '</table></div></div>';
    };

    // --- Tanya AI (dibangun sekali per hasil) ---
    const tanyaWrap = T.el('<div></div>');
    tanyaWrap.appendChild(T.el('<div style="font-weight:700;font-size:13px;margin-bottom:6px">Tanya soal dokumen ini</div>'));
    const tInp = T.input('text', 'Contoh: apa kesimpulan utama dokumen ini?');
    tInp.setAttribute('maxlength', '2000');
    const log = T.el('<div class="tlog"></div>');
    const tanyaBtn = T.btn('Tanya', async () => {
      const q = tInp.value.trim();
      if (!q) return;
      tanyaBtn.disabled = true;
      log.innerHTML += '<div style="font-size:13px;margin:6px 0"><b>Kamu:</b> ' + T.esc(q) + '</div><div class="dim" style="font-size:12.5px">AI menjawab…</div>';
      tInp.value = '';
      try {
        const msgs = history.slice(-6);
        msgs.push({ role: 'user', content: q });
        const an = await panggil(msgs, 60000);
        history.push({ role: 'user', content: q }, { role: 'assistant', content: an });
        const dims = log.querySelectorAll('.dim');
        dims[dims.length - 1].outerHTML = '<div style="font-size:13px;margin:6px 0;line-height:1.65"><b>AI:</b><br>' + md(an) + '</div>';
      } catch (e) {
        log.innerHTML += '<div class="err" style="font-size:12.5px">Gagal: ' + T.esc(String((e.message || e)).slice(0, 200)) + '</div>';
      }
      tanyaBtn.disabled = false;
    });

    const gambarPanel = (v) => {
      panel.innerHTML = '';
      if (v === 'ringkasan') {
        panel.appendChild(T.el('<div>' + md(a.summary || 'Tidak ada ringkasan.') + daftar('Tindakan disarankan', a.actions) + '</div>'));
      } else if (v === 'poin') {
        const isi = daftar('Poin penting', a.keyPoints) + daftar('Catatan belajar', a.studyNotes);
        panel.appendChild(T.el(isi ? '<div>' + isi + '</div>' : '<p class="dim">Tidak ada poin yang terdeteksi.</p>'));
      } else if (v === 'teks') {
        const pre = document.createElement('pre');
        pre.textContent = a.extractedText || 'Teks dokumen tidak tersedia.';
        pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.7;max-height:320px;overflow:auto;margin:0;background:#0d0b09;border:1px solid #ffffff14;border-radius:8px;padding:12px';
        panel.appendChild(pre);
      } else if (v === 'tabel') {
        if (!a.tables.length) {
          panel.appendChild(T.el('<p class="dim">Tidak ada tabel terstruktur yang terdeteksi.</p>'));
        } else {
          a.tables.forEach((t, i) => panel.appendChild(T.el(kartuTabel(t, i))));
          panel.querySelectorAll('[data-csv]').forEach((b) => {
            b.onclick = () => {
              const idx = Number(b.getAttribute('data-csv'));
              const t = a.tables[idx];
              T.dl(namaAman(docSumberTerakhir.name) + '-tabel-' + (idx + 1) + '.csv', tabelKeTeksCSV(t), 'text/csv;charset=utf-8');
            };
          });
        }
      } else if (v === 'tanya') {
        tanyaWrap.appendChild(tInp);
        tanyaWrap.appendChild(T.el('<div style="height:6px"></div>'));
        tanyaWrap.appendChild(tanyaBtn);
        tanyaWrap.appendChild(log);
        panel.appendChild(tanyaWrap);
      }
    };

    const btns = tabDefs.map(([v, l], i) => {
      const b = T.el('<button type="button" class="btn' + (i === 0 ? ' primary' : '') + '">' + T.esc(l) + '</button>');
      b.onclick = () => { btns.forEach((x) => x.classList.remove('primary')); b.classList.add('primary'); gambarPanel(v); };
      bar.appendChild(b);
      return b;
    });
    out.appendChild(bar);
    out.appendChild(panel);
    gambarPanel('ringkasan');

    const rw = T.el('<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"></div>');
    const nm = namaAman(docSumberTerakhir.name);
    rw.appendChild(T.dlBtn(nm + '-analisis.txt', () => eksporTxt(a), 'text/plain;charset=utf-8', 'Unduh TXT'));
    rw.appendChild(T.dlBtn(nm + '-analisis.json', () => JSON.stringify(a, null, 2), 'application/json;charset=utf-8', 'Unduh JSON'));
    rw.appendChild(T.dlBtn(nm + '-analisis.doc', () => eksporWord(a), 'application/msword;charset=utf-8', 'Unduh Word'));
    rw.appendChild(T.copyBtn(() => a.title + '\n\n' + a.summary, 'Salin hasil'));
    out.appendChild(rw);
    out.appendChild(T.el('<p class="dim" style="font-size:11.5px;margin-top:8px">File hanya dikirim ke endpoint LLM yang kamu konfigurasi di atas — tidak lewat server mana pun.</p>'));
  }

  const analisisBtn = T.btn('🔍 Analisis dokumen', async () => {
    if (busy) return;
    const sumber = bangunSumber();
    if (!sumber) { T.show(out, '<span class="warn">Isi dulu dokumennya — via file atau tempel teks.</span>'); return; }
    if (!keyF.has()) { T.show(out, '<span class="warn">Isi & simpan API key dulu.</span>'); return; }
    busy = true; segarkanTombol();
    history.length = 0;
    mulaiTahap();
    try {
      const txt = await panggil(bangunPesan(sumber, mode), 85000);
      let a;
      try {
        a = parseJSONLepas(txt);
      } catch (e) {
        // Model tidak mengembalikan JSON (mis. provider non-JSON-mode) → tampilkan mentah di tab Ringkasan
        a = {
          title: 'Hasil analisis', summary: txt, keyPoints: [], actions: [], studyNotes: [], tables: [],
          extractedText: '', documentType: '', language: '',
        };
      }
      if (!a.extractedText && sumber.kind === 'teks') a.extractedText = sumber.text.slice(0, 4000);
      hasilTerakhir = a;
      docSumberTerakhir = sumber;
      history.push({ role: 'user', content: '[analisis mode ' + mode + ' atas ' + sumber.name + ']' }, { role: 'assistant', content: a.summary });
      paintHasil();
    } catch (e) {
      stopTahap();
      const m = e.name === 'AbortError' ? 'Timeout — dokumen terlalu besar / koneksi lambat.' : (e.message === 'NO_KEY' ? 'Isi & simpan API key dulu.' : (e.message || e));
      T.show(out, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { busy = false; segarkanTombol(); }
  }, true);
  analisisBtn.disabled = true;

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Format didukung: PDF (maks ' + MAKS_PDF_MB + ' MB, ' + MAKS_HALAMAN_PDF + ' halaman pertama), foto/scan JPG/PNG/WEBP (maks ' + MAKS_FOTO_MB + ' MB sebelum optimasi), TXT/MD/CSV (maks ' + MAKS_PDF_MB + ' MB).</p>'));
  const fw = T.field('File dokumen', fileInp, 'PDF · JPG · PNG · WEBP · TXT · MD · CSV');
  fw.appendChild(fileInfo);
  fw.appendChild(fileCard);
  root.appendChild(fw);
  root.appendChild(T.field('Isi dokumen', teksArea));
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700">Mode analisis</div>'));
  root.appendChild(modeRg);
  root.appendChild(T.row(analisisBtn));
  root.appendChild(out);
  segarkanTombol();
}
