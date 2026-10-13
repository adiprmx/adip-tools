import { h as T, utils, errBox, kv, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "carifakta", "name": "CariFakta", "cat": "pelajar", "icon": "🕵️", "desc": "Analisis klaim & forward-an dengan AI: verdict hoaks/valid, klaim, dan panduan verifikasi.", "keywords": "hoaks,fakta,cek fakta,forward,whatsapp,berita,verifikasi,ai"};

const STAT_KEY = 'at-carifakta-stats-v1';
const HIST_KEY = 'at-carifakta-history-v1';
const AI_URL = 'https://text.pollinations.ai/openai';
const AI_GET = 'https://text.pollinations.ai/';

const getStats = () => { try { return Object.assign({ total: 0, hoax: 0, valid: 0 }, JSON.parse(localStorage.getItem(STAT_KEY) || '{}')); } catch (e) { return { total: 0, hoax: 0, valid: 0 }; } };
const setStats = (s) => { try { localStorage.setItem(STAT_KEY, JSON.stringify(s)); } catch (e) {} };
const getHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } };
const setHist = (l) => { try { localStorage.setItem(HIST_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const tglIndo = (ts) => {
  const d = new Date(ts);
  return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ' · ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
const labelVerdict = (v) => v === 'hoax' ? 'Hoaks' : v === 'valid' ? 'Valid' : 'Belum Pasti';

// ---- AI ----
const SYS_PROMPT = [
  'Kamu adalah CariFakta, mesin verifikasi fakta berbahasa Indonesia yang independen, teliti, skeptis, dan JUJUR soal batas pengetahuanmu sendiri.',
  'INPUT bisa berupa: klaim/forward-an WhatsApp, potongan berita, status media sosial, ATAU pertanyaan langsung pengguna. Selalu beri jawaban substantif — jangan pernah menolak atau membalas kosong.',
  'Untuk input singkat (1-2 kalimat): AKTIF BERNALAR memakai pengetahuan umum. Kenali pola hoaks viral yang sudah dikenal luas (klaim kesehatan ekstrem, teori konspirasi, prediksi bencana, vaksin/5G/chip, giveaway palsu). Hanya pakai verdict "uncertain" beralasan "terlalu singkat" bila BENAR-BENAR tak ada entitas/pola yang dikenali.',
  'ATURAN ANTI-NGAWUR (WAJIB):',
  '1. Jangan mengarang angka statistik, tanggal persis, kutipan, nama pejabat, judul berita, atau nomor peraturan yang tidak kamu yakini. Kalau tidak yakin, tulis eksplisit bahwa detail itu tidak bisa dipastikan tanpa sumber.',
  '2. Bedakan: (a) yang kamu tahu yakin, (b) yang masuk akal tapi perlu verifikasi, (c) yang tidak kamu ketahui. Cerminkan di "confidence" — jangan >70 kecuali benar-benar yakin dari pengetahuan umum yang solid.',
  '3. Topik sangat baru/spesifik/lokal di luar pengetahuanmu: JUJUR di analysis, pakai verdict "uncertain".',
  '4. Jangan mengarang nama media, lembaga fact-checking, atau URL yang tidak yakin benar ada.',
  '5. Konsisten logis: verdict, confidence, dan analysis harus saling mendukung.',
  'Field "analysis" WAJIB 4-6 kalimat konkret: (1) entitas spesifik yang disebut dan apa yang benar-benar diketahui/tidak diketahui, (2) pola hoaks umum mana yang cocok, (3) bagian mana yang bisa/tidak bisa diverifikasi dan kenapa, (4) langkah verifikasi konkret (cek akun resmi instansi, cari kata kunci di mesin pencari, cek turnbackhoax.id / cekfakta.com).',
  'Balas HANYA JSON valid (tanpa markdown, tanpa teks lain):',
  '{"verdict":"hoax|valid|uncertain","confidence":0-100,"summary":"ringkasan satu kalimat yang menyebut entitas utama","analysis":"analisis detail 4-6 kalimat","misleading_elements":["elemen menyesatkan spesifik"],"claims":["klaim spesifik yang ditemukan"],"topics":["tag topik"],"context":"konteks latar / langkah verifikasi konkret"}',
].join('\n');

function ekstrakJSON(teks) {
  let t = String(teks || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('respons AI tidak mengandung JSON');
  return JSON.parse(m[0]);
}

async function analisisAI(teks, signal) {
  const body = { model: 'openai', temperature: 0.3, messages: [{ role: 'system', content: SYS_PROMPT }, { role: 'user', content: 'INPUT:\n' + teks }] };
  const to = AbortSignal.timeout(90000);
  const sig = signal ? AbortSignal.any([signal, to]) : to;
  let terakhir = null;
  try {
    const r = await fetch(AI_URL, { method: 'POST', signal: sig, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const isi = (((j.choices || [])[0] || {}).message || {}).content || '';
    return ekstrakJSON(isi);
  } catch (e) { terakhir = e; }
  // cadangan: GET sederhana
  try {
    const r = await fetch(AI_GET + encodeURIComponent(SYS_PROMPT + '\n\nINPUT:\n' + teks).slice(0, 6000), { signal: sig });
    if (!r.ok) throw new Error('http ' + r.status);
    return ekstrakJSON(await r.text());
  } catch (e) { terakhir = e; }
  throw terakhir || new Error('AI tidak merespons');
}

// ---- Heuristik cadangan (dipakai hanya bila AI gagal; diberi label jujur) ----
const SINYAL = [
  [/VIRAL|SEBARKAN|FORWARD(?!ED)|BANTU (SEBAR|SHARE)|JANGAN BERHENTI DI KAMU|VIRALKAN/i, -16, 'Ajakan menyebar massal ("viral", "sebarkan")'],
  [/(!{2,}|\?{3,})/, -10, 'Tanda seru/tanya berlebihan'],
  [/(sembuh(kan)?|obat(i|kan)?).{0,30}(dalam|hanya).{0,20}\d+\s*(hari|jam|menit)/i, -18, 'Klaim kesembuhan instan ("sembuh dalam X hari")'],
  [/(dokter|ilmuwan|peneliti).{0,25}(terkejut|kaget|takjub)/i, -12, 'Otoritas dibuat "terkejut" tanpa nama jelas'],
  [/(rahasia|disembunyikan|ditutup-tutupi).{0,30}(pemerintah|media|dokter|elit)/i, -14, 'Narasi konspirasi ("disembunyikan media")'],
  [/(media (tidak|tak|enggan)|tidak diliput|tidak diberitakan)/i, -12, 'Klaim "media tidak memberitakan"'],
  [/(gratis|hadiah|giveaway|dapatkan).{0,30}(rp|rupiah|juta|miliar|iphone|motor|mobil)/i, -14, 'Iming-iming hadiah/uang'],
  [/(klik|buka).{0,20}link/i, -10, 'Suruhan klik link'],
  [/(bit\.ly|tinyurl|s\.id|shorturl|gg\.gg|t\.ly)\//i, -10, 'Link shortener (tujuan disamarkan)'],
  [/(bahaya|awas|waspada|darurat).{0,20}!/i, -8, 'Nada menakut-nakuti'],
  [/(sebelum dihapus|segera|terakhir|kesempatan terakhir)/i, -8, 'Tekanan urgensi palsu'],
  [/(tanpa efek samping|100%\s*(alami|aman|manjur|terbukti))/i, -12, 'Jaminan mutlak ("100% manjur")'],
  [/(menurut (penelitian|studi|survey)).{0,40}(tanpa|tidak).{0,20}(nama|lembaga|disebut)/i, -8, '"Penelitian" tanpa sumber jelas'],
];
const SINYAL_BAIK = [
  [/(bmkg|kpk|kemenkes|kemendikbud|polri|kejagung|bnpb|bpom|ojk|bi\.go\.id|kominfo)/i, 10, 'Menyebut lembaga resmi'],
  [/(detik\.com|kompas\.com|tempo\.co|antaranews|tirto\.id|liputan6|cekfakta|turnbackhoax)/i, 10, 'Menyebut media/situs cek fakta'],
  [/(kata|ujar|tutur|menurut)\s+[A-Z][a-z]+/i, 6, 'Ada atribusi narasumber ("kata …")'],
  [/\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}/i, 6, 'Ada tanggal spesifik'],
  [/(https?:\/\/[\w.-]+\.(go\.id|ac\.id|or\.id))/i, 12, 'Tautan ke domain resmi (.go.id/.ac.id/.or.id)'],
];
function analisisHeuristik(s) {
  const temuan = [], baik = [];
  let skor = 50;
  for (const [re, b, label] of SINYAL) if (re.test(s)) { skor += b; temuan.push({ label, b }); }
  for (const [re, b, label] of SINYAL_BAIK) if (re.test(s)) { skor += b; baik.push({ label, b }); }
  const huruf = (s.match(/[A-Za-z]/g) || []).length;
  const kapital = (s.match(/[A-Z]/g) || []).length;
  if (huruf > 40 && kapital / huruf > 0.45) { skor -= 10; temuan.push({ label: 'Huruf KAPITAL dominan (' + Math.round(kapital / huruf * 100) + '%)', b: -10 }); }
  skor = Math.max(0, Math.min(100, skor));
  const verdict = skor <= 34 ? 'hoax' : skor <= 54 ? 'uncertain' : skor <= 74 ? 'uncertain' : 'valid';
  return { skor, verdict, temuan, baik };
}

const LANGKAH = ['Membaca konten', 'Mengekstrak klaim', 'Membandingkan pola hoaks', 'Menyusun verifikasi'];

export function render(root) {
  let ctl = null, timerLangkah = null;
  onLeave(() => { if (ctl) ctl.abort(); clearInterval(timerLangkah); });

  const ta = T.ta(5, 'Tempel teks dari WhatsApp, forward-an berita, atau status media sosial di sini...', '');
  ta.maxLength = 2000;
  const out = T.out();
  const loadBox = T.out();
  const resBox = T.out();
  const histBox = T.out();

  const statTotal = T.el('<b>0</b>');
  const statHoax = T.el('<b>0</b>');
  const statValid = T.el('<b>0</b>');
  const pillCount = T.el('<span>0</span>');

  let tampilStat = () => {
    const s = getStats();
    statTotal.textContent = s.total; statHoax.textContent = s.hoax; statValid.textContent = s.valid;
    pillCount.textContent = s.total;
  };

  const mulaiLoading = () => {
    clearInterval(timerLangkah);
    T.show(loadBox,
      '<div style="border:1px solid #ffffff20;border-radius:14px;padding:16px;background:#161311">' +
      '<div style="font-size:14px"><b>Menganalisis konten</b></div>' +
      '<div class="dim" data-l="sub" style="font-size:12px;margin:2px 0 12px">AI CariFakta sedang bekerja</div>' +
      '<div style="height:6px;border-radius:99px;background:#2a251f;overflow:hidden"><i data-l="fill" style="display:block;height:100%;width:0%;background:#f5f2ea;transition:width .3s"></i></div>' +
      '<div class="dim" style="font-size:11px;margin-top:6px;display:flex;justify-content:space-between"><span data-l="label">Tahap 1/4</span><span data-l="pct">0%</span></div></div>');
    T.hide(resBox);
    let i = 0;
    const sub = loadBox.querySelector('[data-l=sub]'), fill = loadBox.querySelector('[data-l=fill]'),
      label = loadBox.querySelector('[data-l=label]'), pct = loadBox.querySelector('[data-l=pct]');
    timerLangkah = setInterval(() => {
      i = (i + 1) % LANGKAH.length;
      const p = Math.round(((i + 1) / LANGKAH.length) * 90);
      fill.style.width = p + '%'; label.textContent = 'Tahap ' + (i + 1) + '/4'; pct.textContent = p + '%';
      sub.textContent = LANGKAH[i];
    }, 1400);
    loadBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const selesaiLoading = () => {
    clearInterval(timerLangkah);
    const fill = loadBox.querySelector('[data-l=fill]'), pct = loadBox.querySelector('[data-l=pct]');
    if (fill) { fill.style.width = '100%'; pct.textContent = '100%'; }
    setTimeout(() => T.hide(loadBox), 350);
  };

  const kartu = (judul, isi) =>
    '<div style="border:1px solid #ffffff20;border-radius:14px;background:#161311;padding:16px;margin-bottom:12px">' +
    '<h3 style="font-size:13.5px;margin:0 0 12px;color:#d8d2c4">' + T.esc(judul) + '</h3>' + isi + '</div>';

  const tampilHasilAI = (r, teks) => {
    const v = r.verdict === 'hoax' ? 'hoax' : r.verdict === 'valid' ? 'valid' : 'uncertain';
    const conf = Math.max(0, Math.min(100, Number(r.confidence) || 0));
    const warna = v === 'hoax' ? '#f87171' : v === 'valid' ? '#7ccf8f' : '#c9bda9';
    const judul = v === 'hoax' ? 'Hoaks Terdeteksi' : v === 'valid' ? 'Tampak Valid' : 'Belum Dapat Dipastikan';
    const klaim = Array.isArray(r.claims) ? r.claims.filter(Boolean) : [];
    const topik = Array.isArray(r.topics) ? r.topics.filter(Boolean) : [];
    const sesat = Array.isArray(r.misleading_elements) ? r.misleading_elements.filter(Boolean) : [];
    T.show(resBox,
      '<div style="border:1px solid #ffffff20;border-radius:14px;padding:18px;margin-bottom:12px;background:#161311;box-shadow:0 0 34px -14px ' + warna + '55">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">' +
      '<div style="font-size:16.5px;color:' + warna + '"><b>' + judul + '</b></div>' +
      '<div style="font-size:13px;border:1px solid #ffffff20;border-radius:99px;padding:5px 12px;white-space:nowrap">' + conf + '%</div></div>' +
      '<p style="font-size:13.5px;color:#d8d2c4;line-height:1.55;margin:0">' + T.esc(r.summary || '—') + '</p></div>' +
      kartu('Tingkat Keyakinan AI',
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span class="dim" style="font-size:11.5px">Keyakinan model</span><b style="font-size:19px">' + conf + '%</b></div>' +
        '<div style="height:7px;border-radius:99px;background:#2a251f;overflow:hidden;margin-bottom:6px"><i style="display:block;height:100%;width:' + conf + '%;background:#f5f2ea"></i></div>' +
        '<div class="dim" style="font-size:10px;display:flex;justify-content:space-between"><span>0%</span><span>50%</span><span>100%</span></div>') +
      kartu('Analisis Detail',
        '<p style="font-size:13.5px;line-height:1.68;color:#d8d2c4;margin:0 0 4px">' + T.esc(r.analysis || '—') + '</p>' +
        (sesat.length ? '<div style="border:1px solid #ffffff18;border-radius:11px;padding:12px 14px;background:#12100d;margin-top:12px">' +
          '<div style="font-size:11.5px;margin-bottom:8px"><b>Elemen Menyesatkan</b></div><ul style="margin:0;padding-left:16px;font-size:12.5px;color:#c9bda9;line-height:1.6">' +
          sesat.map((m) => '<li>' + T.esc(m) + '</li>').join('') + '</ul></div>' : '')) +
      kartu('Klaim yang Ditemukan',
        klaim.length ? klaim.map((c) => '<div style="font-size:13.5px;color:#d8d2c4;padding:9px 0;border-bottom:1px solid #ffffff14;display:flex;gap:10px"><span style="color:#8d8574">•</span><span>' + T.esc(c) + '</span></div>').join('')
          : '<div class="dim" style="font-size:13px">Tidak ada klaim spesifik terdeteksi.</div>') +
      (topik.length ? kartu('Topik Terkait', '<div style="display:flex;flex-wrap:wrap;gap:8px">' + topik.map((t) => '<span style="font-size:11.5px;padding:6px 12px;border-radius:99px;border:1px solid #ffffff18;color:#c9bda9">' + T.esc(t) + '</span>').join('') + '</div>') : '') +
      kartu('Konteks', '<p style="font-size:13px;color:#c9bda9;line-height:1.65;margin:0;border-left:2px solid #8d8574;padding-left:12px">' + T.esc(r.context || '—') + '</p>') +
      '<button class="btn" data-r="reset" style="display:block;margin:4px auto 0;font-size:12.5px">Cek klaim lain</button>');
    resBox.querySelector('[data-r=reset]').onclick = () => { ta.value = ''; hitung(); T.hide(resBox); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    resBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return v;
  };

  const tampilHasilHeuristik = (s, h) => {
    const warna = h.verdict === 'hoax' ? '#f87171' : h.verdict === 'valid' ? '#7ccf8f' : '#fbbf24';
    const judul = h.verdict === 'hoax' ? 'Indikasi Hoaks Tinggi' : h.verdict === 'valid' ? 'Terlihat Seperti Info Valid' : 'Meragukan — Wajib Verifikasi';
    T.show(resBox,
      '<p class="dim" style="font-size:12.5px;border:1px dashed #ffffff30;border-radius:10px;padding:10px 12px">Mode cadangan: <b>bedah pola teks (heuristik)</b> — AI tidak merespons. Hasil ini hanya membaca pola umum hoaks, bukan analisis AI.</p>' +
      '<div style="border:1px solid #ffffff20;border-radius:14px;padding:18px;margin-bottom:12px;background:#161311">' +
      '<div class="dim" style="font-size:12px">Skor kewajaran: <b style="color:' + warna + ';font-size:16px">' + h.skor + '/100</b></div>' +
      '<div style="font-size:17px;margin:6px 0;color:' + warna + '"><b>' + judul + '</b></div>' +
      (h.temuan.length ? '<p style="font-size:13px;margin:10px 0 4px"><b>Pola mencurigakan (' + h.temuan.length + '):</b></p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7">' +
        h.temuan.map((t) => '<li>' + T.esc(t.label) + ' <span class="dim">(' + t.b + ')</span></li>').join('') + '</ul>' : '') +
      (h.baik.length ? '<p style="font-size:13px;margin:10px 0 4px"><b>Sinyal positif (' + h.baik.length + '):</b></p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7">' +
        h.baik.map((t) => '<li>' + T.esc(t.label) + ' <span class="dim">(+' + t.b + ')</span></li>').join('') + '</ul>' : '') + '</div>' +
      kartu('Cara verifikasi mandiri',
        '<ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.7;color:#d8d2c4">' +
        '<li>Cari judul/isi beritanya di situs resmi (mis. bmkg.go.id, kemenkes.go.id) atau media besar.</li>' +
        '<li>Cek situs cek fakta: <b>turnbackhoax.id</b> dan <b>cekfakta.com</b> — cari kata kuncinya di sana.</li>' +
        '<li>Kalau ada foto/video, lakukan reverse image search sebelum percaya.</li>' +
        '<li>Tanya: siapa sumber aslinya? Kapan kejadiannya? Kalau tidak jelas, jangan forward.</li></ol>') +
      '<button class="btn" data-r="reset" style="display:block;margin:4px auto 0;font-size:12.5px">Cek klaim lain</button>');
    resBox.querySelector('[data-r=reset]').onclick = () => { ta.value = ''; hitung(); T.hide(resBox); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    resBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return h.verdict;
  };

  const catat = (teks, verdict, ringkas) => {
    const s = getStats();
    s.total += 1;
    if (verdict === 'hoax') s.hoax += 1;
    if (verdict === 'valid') s.valid += 1;
    setStats(s); tampilStat();
    setHist([{ ts: Date.now(), query: (ringkas || '').trim() || teks.slice(0, 140).replace(/\s+/g, ' '), verdict }, ...getHist()]);
    tampilHist();
  };

  const tampilHist = () => {
    const l = getHist();
    if (!l.length) { T.hide(histBox); return; }
    T.show(histBox, '<div style="margin-top:26px;border-top:1px solid #ffffff20;padding-top:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<b style="font-size:13.5px">Riwayat Pencarian</b>' +
      '<button class="btn" data-h="clear" style="font-size:11.5px;text-decoration:underline">Hapus semua</button></div>' +
      '<div style="display:grid;gap:8px">' + l.map((h, i) => {
        const w = h.verdict === 'hoax' ? '#f87171' : h.verdict === 'valid' ? '#7ccf8f' : '#c9bda9';
        return '<button class="btn" data-h="' + i + '" style="text-align:left;font-size:12.5px;display:flex;gap:10px;align-items:center">' +
          '<span style="color:' + w + ';font-size:16px;flex-shrink:0">' + (h.verdict === 'hoax' ? '!' : h.verdict === 'valid' ? '✓' : '?') + '</span>' +
          '<span style="flex:1;min-width:0"><span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(h.query) + '</span>' +
          '<span class="dim" style="font-size:10.5px">' + tglIndo(h.ts) + ' · <b style="color:' + w + '">' + labelVerdict(h.verdict) + '</b></span></span></button>';
      }).join('') + '</div></div>');
    histBox.querySelector('[data-h=clear]').onclick = () => { setHist([]); tampilHist(); };
    histBox.querySelectorAll('[data-h]').forEach((b) => {
      if (b.getAttribute('data-h') === 'clear') return;
      b.onclick = () => { const h = getHist()[+b.getAttribute('data-h')]; if (h) { ta.value = h.query; hitung(); cek(); } };
    });
  };

  const cek = async () => {
    const s = ta.value.trim();
    if (!s) { T.show(out, errBox('Tempel dulu teks yang mau dicek.')); return; }
    if (s.length < 10) { T.show(out, errBox('Teks terlalu pendek untuk dianalisis (min. 10 karakter).')); return; }
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const sig = ctl.signal;
    T.hide(out);
    mulaiLoading();
    const tunda = (ms) => new Promise((res) => setTimeout(res, ms));
    try {
      const [r] = await Promise.all([analisisAI(s.slice(0, 2000), sig), tunda(5200)]);
      if (sig.aborted) return;
      selesaiLoading();
      const v = tampilHasilAI(r, s);
      catat(s, v, r.summary);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      selesaiLoading();
      const h = analisisHeuristik(s);
      const v = tampilHasilHeuristik(s, h);
      catat(s, v, '');
      T.toast('AI tidak merespons — memakai mode cadangan');
    }
  };

  const hitung = () => { cnt.textContent = ta.value.length; };
  const cnt = T.el('<span>0</span>');
  ta.addEventListener('input', hitung);

  const contoh = (label, teks) => {
    const b = T.btn(label, () => { ta.value = teks; hitung(); ta.focus(); });
    b.style.fontSize = '12px';
    return b;
  };

  root.appendChild(T.el('<div style="display:flex;justify-content:flex-end;margin-bottom:6px"><span class="dim" style="font-size:11.5px;border:1px solid #ffffff20;border-radius:99px;padding:5px 12px"><span data-c="n">0</span> diverifikasi</span></div>'));
  const pillN = root.querySelector('[data-c=n]');
  const _tampilStat = tampilStat;
  tampilStat = () => { _tampilStat(); const s = getStats(); if (pillN) pillN.textContent = s.total; };

  root.appendChild(T.el('<p class="dim" style="font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 8px">Verifikasi berbasis AI</p>'));
  root.appendChild(T.el('<h2 style="font-size:clamp(26px,7vw,34px);line-height:1.1;margin:0 0 10px;letter-spacing:-.02em">Cari faktanya,<br>bukan asumsinya.</h2>'));
  root.appendChild(T.el('<p class="dim" style="font-size:14px;line-height:1.6;margin:0 0 18px">Tempel teks forward-an WhatsApp, status, atau berita yang meragukan — CariFakta membedah klaimnya sebelum kamu sempat membagikannya.</p>'));

  const statGrid = T.el('<div style="display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #ffffff20;border-radius:14px;overflow:hidden;margin-bottom:18px;background:#161311"></div>');
  [['Total Dicek', statTotal], ['Hoaks Diungkap', statHoax], ['Fakta Valid', statValid]].forEach(([l, el], i) => {
    const d = T.el('<div style="padding:14px 8px;text-align:center' + (i < 2 ? ';border-right:1px solid #ffffff20' : '') + '"></div>');
    el.style.cssText = 'display:block;font-size:21px';
    d.appendChild(el);
    const sp = T.el('<span class="dim" style="font-size:10.5px">' + l + '</span>');
    d.appendChild(sp);
    statGrid.appendChild(d);
  });
  root.appendChild(statGrid);

  root.appendChild(T.el('<div style="border:1px solid #ffffff20;border-radius:14px;background:#161311;padding:6px;margin-bottom:12px"><div style="padding:10px 12px 4px"><div class="dim" style="font-size:11.5px;margin-bottom:6px">Tempel teks yang ingin diverifikasi</div></div></div>'));
  const panelIn = root.lastChild;
  panelIn.appendChild(ta);
  ta.style.cssText = 'width:100%;min-height:96px;background:transparent;border:none;outline:none;color:inherit;font-size:14.5px;line-height:1.55;resize:vertical;padding:0 12px;font-family:inherit';
  const ccRow = T.el('<div style="text-align:right;font-size:10.5px;padding:2px 12px 8px" class="dim"></div>');
  ccRow.appendChild(cnt); ccRow.appendChild(document.createTextNode('/2000'));
  panelIn.appendChild(ccRow);

  root.appendChild(T.row(T.btn('Cek Sekarang', cek, true)));
  const exRow = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px;align-items:center"></div>');
  exRow.appendChild(T.el('<span class="dim" style="font-size:11px;width:100%">Coba contoh:</span>'));
  exRow.appendChild(contoh('Vaksin COVID mengandung chip 5G', 'Vaksin COVID mengandung microchip 5G untuk melacak manusia'));
  exRow.appendChild(contoh('Gempa besar akan terjadi', 'Gempa besar akan terjadi di Jakarta minggu depan, sudah diprediksi BMKG'));
  root.appendChild(exRow);

  root.appendChild(out);
  root.appendChild(loadBox);
  root.appendChild(resBox);
  root.appendChild(T.el('<p class="dim" style="font-size:11px;text-align:center;margin-top:20px;line-height:1.6">CariFakta memakai model AI publik untuk analisis awal berbasis pengetahuan model — bukan pengganti verifikasi dari sumber berita resmi. Selalu cek silang untuk klaim yang berdampak besar.</p>'));
  root.appendChild(histBox);
  tampilStat();
  tampilHist();
}
