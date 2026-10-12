import { h as T, utils, errBox, kv } from '../../core.js?v=6.9.20';

export const meta = {"id": "carifakta", "name": "CariFakta", "cat": "pelajar", "icon": "🕵️", "desc": "Bedah pola teks forward-an: cek indikasi hoaks & panduan verifikasi.", "keywords": "hoaks,fakta,cek fakta,forward,whatsapp,berita,verifikasi"};

const HIST_KEY = 'at-carifakta-history-v1';

// [pola, bobot, label] — bobot negatif = sinyal hoaks
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

function analisisTeks(s) {
  const temuan = [], baik = [];
  let skor = 50;
  for (const [re, b, label] of SINYAL) {
    if (re.test(s)) { skor += b; temuan.push({ label, b }); }
  }
  for (const [re, b, label] of SINYAL_BAIK) {
    if (re.test(s)) { skor += b; baik.push({ label, b }); }
  }
  // rasio huruf kapital
  const huruf = (s.match(/[A-Za-z]/g) || []).length;
  const kapital = (s.match(/[A-Z]/g) || []).length;
  if (huruf > 40 && kapital / huruf > 0.45) { skor -= 10; temuan.push({ label: 'Huruf KAPITAL dominan (' + Math.round(kapital / huruf * 100) + '%)', b: -10 }); }
  skor = Math.max(0, Math.min(100, skor));
  const verdict = skor <= 34 ? ['🚨 INDIKASI HOAKS TINGGI', '#f87171']
    : skor <= 54 ? ['⚠️ MERAGUKAN — WAJIB VERIFIKASI', '#fbbf24']
    : skor <= 74 ? ['🔍 CENDERUNG WAJAR — TETAP CEK', '#8ab8ff']
    : ['✅ TERLIHAT SEPERTI INFO VALID', '#7ccf8f'];
  return { skor, verdict, temuan, baik };
}

const getHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } };

export function render(root) {
  const ta = T.ta(7, 'Tempel teks dari WhatsApp, forward-an berita, atau status media sosial di sini...', '');
  ta.maxLength = 2000;
  const out = T.out();
  const histBox = T.out();

  const tampilHist = () => {
    const l = getHist();
    if (!l.length) { T.hide(histBox); return; }
    T.show(histBox, '<div style="margin-top:16px;border-top:1px dashed #ffffff20;padding-top:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">🕘 Riwayat cek</b>' +
      '<button class="btn" data-h="clear" style="font-size:12px">Hapus riwayat</button></div>' +
      '<div style="display:grid;gap:6px;margin-top:8px">' + l.map((h, i) =>
        '<button class="btn" data-h="' + i + '" style="text-align:left;font-size:12.5px">' +
        '<span style="color:' + h.warna + '"><b>' + T.esc(h.verdict) + '</b></span> <span class="dim">· skor ' + h.skor + '</span><br>' +
        '<span class="dim">' + T.esc(h.cuplik) + '</span></button>').join('') + '</div></div>');
    histBox.querySelector('[data-h=clear]').onclick = () => { try { localStorage.removeItem(HIST_KEY); } catch (e) {} tampilHist(); };
    histBox.querySelectorAll('[data-h]').forEach((b) => {
      if (b.getAttribute('data-h') === 'clear') return;
      b.onclick = () => { const h = getHist()[+b.getAttribute('data-h')]; if (h) { ta.value = h.teks; cek(); } };
    });
  };

  const cek = () => {
    const s = ta.value.trim();
    if (!s) { T.show(out, errBox('Tempel dulu teks yang mau dicek.')); return; }
    if (s.length < 20) { T.show(out, errBox('Teks terlalu pendek untuk dianalisis (min. 20 karakter).')); return; }
    const { skor, verdict, temuan, baik } = analisisTeks(s);
    const [vlabel, warna] = verdict;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#161311">' +
      '<div class="dim" style="font-size:12px">Skor kewajaran: <b style="color:' + warna + ';font-size:16px">' + skor + '/100</b></div>' +
      '<div style="font-size:17px;margin:6px 0;color:' + warna + '"><b>' + vlabel + '</b></div>' +
      (temuan.length ? '<p style="font-size:13px;margin:10px 0 4px"><b>🚩 Pola mencurigakan (' + temuan.length + '):</b></p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7">' +
        temuan.map((t) => '<li>' + T.esc(t.label) + ' <span class="dim">(' + t.b + ')</span></li>').join('') + '</ul>' : '') +
      (baik.length ? '<p style="font-size:13px;margin:10px 0 4px"><b>✅ Sinyal positif (' + baik.length + '):</b></p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.7">' +
        baik.map((t) => '<li>' + T.esc(t.label) + ' <span class="dim">(+' + t.b + ')</span></li>').join('') + '</ul>' : '') +
      '<div style="margin-top:14px;border-top:1px dashed #ffffff20;padding-top:10px"><b style="font-size:13px">🔎 Cara verifikasi mandiri:</b>' +
      '<ol style="margin:6px 0 0;padding-left:20px;font-size:13px;line-height:1.7">' +
      '<li>Cari judul/isi beritanya di situs resmi (mis. bmkg.go.id, kemenkes.go.id) atau media besar.</li>' +
      '<li>Cek situs cek fakta: <b>turnbackhoax.id</b> dan <b>cekfakta.com</b> — cari kata kuncinya di sana.</li>' +
      '<li>Kalau ada foto/video, lakukan reverse image search sebelum percaya.</li>' +
      '<li>Tanya: siapa sumber aslinya? Kapan kejadiannya? Kalau tidak jelas, jangan forward.</li></ol></div>' +
      '<p class="dim" style="font-size:12px;margin-top:10px">⚠️ Ini <b>bukan vonis AI</b> — melainkan bedah pola teks (heuristik). Pola hoaks bisa lolos, dan teks valid bisa kena skor rendah. Kebenaran hanya dipastikan lewat verifikasi ke sumber primer di atas.</p></div>');
    const l = [{ teks: s, cuplik: s.slice(0, 80).replace(/\s+/g, ' '), skor, verdict: vlabel, warna, t: Date.now() }, ...getHist()].slice(0, 20);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(l)); } catch (e) {}
    tampilHist();
  };

  const reset = () => { ta.value = ''; T.hide(out); };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Dapat forward-an mencurigakan? Tempel teksnya — tool ini membedah <b>pola-pola umum hoaks</b> (ajakan viral, klaim instan, konspirasi, iming-iming hadiah) dan memberi skor + panduan verifikasi mandiri.</p>'));
  root.appendChild(T.field('Teks yang mau dicek (maks 2000 karakter)', ta));
  root.appendChild(T.row(T.btn('🔍 Cek Fakta', cek, true), T.btn('↺ Reset', reset)));
  root.appendChild(out);
  root.appendChild(histBox);
  tampilHist();
}
