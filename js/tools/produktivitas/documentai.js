import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"documentai","name":"Document AI","cat":"produktivitas","icon":"📄","desc":"Analisis dokumen dengan LLM milikmu (OpenAI-compatible).","keywords":"ai,dokumen,llm,ringkasan,analisis,openai,pdf"};

const MODES = [
  ['ringkas', '📝 Ringkasan Cerdas'],
  ['dalam', '🔬 Analisis Mendalam'],
  ['belajar', '🎓 Catatan Belajar'],
  ['tabel', '📊 Ekstrak Tabel'],
];
const SYS = {
  ringkas: 'Kamu asisten analisis dokumen. Buat RINGKASAN dalam Bahasa Indonesia: 1 paragraf inti, lalu daftar "Poin penting" (maks 8), lalu "Tindakan yang disarankan" bila ada. Ringkas tapi lengkap.',
  dalam: 'Kamu analis dokumen senior. Buat ANALISIS MENDALAM dalam Bahasa Indonesia: struktur (pendahuluan/isi/kesimpulan), argumen utama, data & angka penting, kelemahan/celah logika, dan kesimpulan. Format dengan heading jelas.',
  belajar: 'Kamu tutor. Buat CATATAN BELAJAR dalam Bahasa Indonesia dari dokumen: konsep kunci dengan penjelasan sederhana, istilah penting + definisi, lalu 5 pertanyaan latihan beserta jawabannya.',
  tabel: 'Kamu ekstraktor data. Cari SEMUA tabel/data terstruktur dalam dokumen dan keluarkan sebagai CSV murni (baris pertama = header, pisahkan koma, teks berisi koma dibungkus tanda kutip). Bila tidak ada tabel, tulis persis: TIDAK ADA TABEL. Jangan tambah penjelasan di luar CSV.',
};

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

function csvKeTabel(csv) {
  const rows = [];
  let cur = [''], q = false;
  const s = String(csv).trim();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') q = false;
      else cur[cur.length - 1] += c;
    } else if (c === '"') q = true;
    else if (c === ',') cur.push('');
    else if (c === '\n') { rows.push(cur); cur = ['']; }
    else if (c !== '\r') cur[cur.length - 1] += c;
  }
  rows.push(cur);
  const bersih = rows.filter((r) => r.some((x) => x.trim()));
  if (!bersih.length) return '';
  const [head, ...body] = bersih;
  let h = '<div style="overflow-x:auto;margin-top:8px"><table style="border-collapse:collapse;font-size:12.5px;min-width:100%">';
  h += '<tr>' + head.map((x) => '<th style="border:1px solid #ffffff20;padding:6px 8px;text-align:left;background:#ffffff0a">' + T.esc(x) + '</th>').join('') + '</tr>';
  body.slice(0, 200).forEach((r) => {
    h += '<tr>' + r.map((x) => '<td style="border:1px solid #ffffff14;padding:6px 8px">' + T.esc(x) + '</td>').join('') + '</tr>';
  });
  return h + '</table></div>';
}

export function render(root) {
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
    T.field('Model', modelInp, 'Contoh: gpt-4o-mini, gpt-4o.')
  ));

  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = '.txt,.md,.csv,text/plain,text/markdown,text/csv'; fileInp.className = 'inp';
  const fileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  let docText = '', docName = '';
  fileInp.addEventListener('change', () => {
    const f = fileInp.files[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { fileInfo.textContent = '❌ ' + f.name + ' melebihi 3 MB.'; docText = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      docText = String(r.result).slice(0, 120000);
      docName = f.name;
      fileInfo.textContent = '✅ ' + f.name + ' (' + docText.length + ' karakter). Atau tempel teks manual di bawah.';
      teksArea.value = docText;
    };
    r.readAsText(f);
  });
  const teksArea = T.ta(8, '…atau tempel isi dokumen di sini (maks ±120 ribu karakter)');

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
  let hasilTerakhir = '';
  const history = []; // chat follow-up

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

  const analisisBtn = T.btn('🔍 Analisis dokumen', async () => {
    if (busy) return;
    const doc = (teksArea.value || docText || '').trim();
    if (!doc) { T.show(out, '<span class="warn">Isi dulu dokumennya — via file atau tempel teks.</span>'); return; }
    if (!keyF.has()) { T.show(out, '<span class="warn">Isi & simpan API key dulu.</span>'); return; }
    busy = true; analisisBtn.disabled = true;
    history.length = 0;
    T.show(out, '<div class="dim center">🔍 Menganalisis… (bisa sampai ~85 detik untuk dokumen besar)</div>');
    try {
      const txt = await panggil([
        { role: 'system', content: SYS[mode] },
        { role: 'user', content: 'Dokumen (' + (docName || 'teks tempel') + '):\n\n' + doc.slice(0, 120000) },
      ]);
      hasilTerakhir = txt;
      history.push({ role: 'user', content: '[analisis mode ' + mode + ']' }, { role: 'assistant', content: txt });
      paintHasil();
    } catch (e) {
      const m = e.name === 'AbortError' ? 'Timeout — dokumen terlalu besar / koneksi lambat.' : (e.message === 'NO_KEY' ? 'Isi & simpan API key dulu.' : (e.message || e));
      T.show(out, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { busy = false; analisisBtn.disabled = false; }
  }, true);

  function paintHasil() {
    T.show(out, '');
    const label = (MODES.find(([v]) => v === mode) || [])[1] || 'Hasil';
    out.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin-bottom:8px">' + T.esc(label) + '</div>'));
    if (mode === 'tabel' && !/^TIDAK ADA TABEL/.test(hasilTerakhir.trim())) {
      const csv = hasilTerakhir.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      out.appendChild(T.el(csvKeTabel(csv) || md(hasilTerakhir)));
      const rw = T.el('<div style="margin-top:8px"></div>');
      rw.appendChild(T.dlBtn('tabel-' + Date.now() + '.csv', () => '\ufeff' + csv, 'text/csv;charset=utf-8', '⬇️ Unduh CSV'));
      out.appendChild(rw);
    } else {
      // md() menghasilkan multi-root → bungkus agar T.el tidak memotong
      out.appendChild(T.el('<div>' + md(hasilTerakhir) + '</div>'));
    }
    const rw2 = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>');
    rw2.appendChild(T.dlBtn('analisis-' + Date.now() + '.txt', () => hasilTerakhir, 'text/plain;charset=utf-8', '⬇️ Unduh TXT'));
    rw2.appendChild(T.copyBtn(() => hasilTerakhir, '📋 Salin hasil'));
    out.appendChild(rw2);
    // Tanya AI follow-up
    const tanyaWrap = T.el('<div style="margin-top:14px;border-top:1px solid #ffffff14;padding-top:10px"></div>');
    tanyaWrap.appendChild(T.el('<div style="font-weight:700;font-size:13px;margin-bottom:6px">💬 Tanya soal dokumen ini</div>'));
    const tInp = T.input('text', 'Contoh: apa total biayanya?');
    const tanyaBtn = T.btn('Tanya', async () => {
      const q = tInp.value.trim();
      if (!q) return;
      tanyaBtn.disabled = true;
      const log = tanyaWrap.querySelector('.tlog');
      log.innerHTML += '<div style="font-size:13px;margin:6px 0"><b>Kamu:</b> ' + T.esc(q) + '</div><div class="dim" style="font-size:12.5px">⏳ AI menjawab…</div>';
      tInp.value = '';
      try {
        const msgs = history.slice(-6);
        msgs.push({ role: 'user', content: q });
        const a = await panggil(msgs, 60000);
        history.push({ role: 'user', content: q }, { role: 'assistant', content: a });
        log.querySelectorAll('.dim')[log.querySelectorAll('.dim').length - 1].outerHTML =
          '<div style="font-size:13px;margin:6px 0;line-height:1.65"><b>AI:</b><br>' + md(a) + '</div>';
      } catch (e) {
        log.innerHTML += '<div class="err" style="font-size:12.5px">Gagal: ' + T.esc(String((e.message || e)).slice(0, 200)) + '</div>';
      }
      tanyaBtn.disabled = false;
    });
    const log = T.el('<div class="tlog"></div>');
    tanyaWrap.appendChild(tInp);
    tanyaWrap.appendChild(T.el('<div style="height:6px"></div>'));
    tanyaWrap.appendChild(tanyaBtn);
    tanyaWrap.appendChild(log);
    out.appendChild(tanyaWrap);
  }

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload/teks dokumen → AI meringkas, menganalisis, atau mengekstrak tabel. ' +
    'Pakai <b>API key LLM milikmu</b> (endpoint kompatibel OpenAI). Format didukung: TXT/MD/CSV, maks 3 MB.</p>'));
  const fw = T.field('File dokumen', fileInp, 'TXT/MD/CSV — maks 3 MB.');
  fw.appendChild(fileInfo);
  root.appendChild(fw);
  root.appendChild(T.field('Isi dokumen', teksArea));
  root.appendChild(T.el('<div style="font-size:13px;font-weight:700">Mode analisis</div>'));
  root.appendChild(modeRg);
  root.appendChild(T.row(analisisBtn));
  root.appendChild(out);
}
