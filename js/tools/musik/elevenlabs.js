import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"elevenlabs","name":"ElevenLabs Studio","cat":"musik","icon":"🎙️","desc":"Text-to-speech suara AI via API key ElevenLabs milikmu.","keywords":"elevenlabs,tts,suara,ai,voice,text to speech"};

const API = 'https://api.elevenlabs.io/v1';
const TTS_MODELS = [
  ['eleven_multilingual_v2', 'Multilingual v2 (disarankan, dukung Indonesia)'],
  ['eleven_turbo_v2_5', 'Turbo v2.5 (cepat & murah)'],
  ['eleven_flash_v2_5', 'Flash v2.5 (paling cepat)'],
];
const STS_MODELS = [
  ['eleven_multilingual_sts_v2', 'Multilingual STS v2 (disarankan)'],
  ['eleven_english_sts_v2', 'English STS v2'],
];
const MAX_TTS = 5000;
const MAX_FX = 1000;
const CONTOH_FX = [
  'Hujan deras menghantam atap kayu di malam hari',
  'Raungan naga raksasa di dalam gua',
  'Portal energi sci-fi terbuka dengan dengungan listrik',
];

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done() { clearTimeout(t); } };
}
function errHttp(r, konteks) {
  if (r.status === 401) throw new Error('API key ditolak (401). Cek lagi key-nya.');
  if (r.status === 402) throw new Error('Kuota/credit ElevenLabs habis (402). Cek pemakaian di dashboard ElevenLabs.');
  if (r.status === 429) throw new Error('Rate limit / kuota habis (429). Coba lagi nanti.');
  if (r.status === 400) throw new Error('Request tidak valid (400). ' + (konteks || ''));
  throw new Error('HTTP ' + r.status);
}
// Slider pengaturan suara -> voice_settings ElevenLabs.
function sliderPengaturan() {
  const box = T.el('<details style="margin:8px 0"><summary style="cursor:pointer;font-size:13px">Pengaturan suara</summary><div style="margin-top:8px;display:grid;gap:8px"></div></details>');
  const body = box.querySelector('div');
  const defs = [
    ['stability', 'Stability', 0.5, 0, 1, 0.05],
    ['similarity', 'Similarity', 0.75, 0, 1, 0.05],
    ['style', 'Style', 0, 0, 1, 0.05],
    ['speed', 'Speed', 1, 0.7, 1.2, 0.05],
  ];
  const refs = {};
  defs.forEach(([k, label, val, min, max, step]) => {
    const row = T.el('<label style="font-size:12.5px;display:block"></label>');
    const head = T.el('<div style="display:flex;justify-content:space-between"><span>' + label + '</span><b class="val">' + val.toFixed(2) + '</b></div>');
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    inp.className = 'inp'; inp.style.width = '100%';
    inp.addEventListener('input', () => { head.querySelector('.val').textContent = Number(inp.value).toFixed(2); });
    row.appendChild(head); row.appendChild(inp);
    body.appendChild(row);
    refs[k] = inp;
  });
  return {
    box,
    get() {
      return {
        stability: Number(refs.stability.value),
        similarity_boost: Number(refs.similarity.value),
        style: Number(refs.style.value),
        speed: Number(refs.speed.value),
      };
    },
  };
}
function kartuAudio(out, { judul, blob, namaFile, ulang, catatan }) {
  T.show(out, '');
  const url = URL.createObjectURL(blob);
  T.onLeave(() => URL.revokeObjectURL(url));
  const a = document.createElement('audio');
  a.src = url; a.controls = true; a.style.cssText = 'width:100%';
  out.appendChild(a);
  const rw = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>');
  const dl = document.createElement('a');
  dl.href = url; dl.download = namaFile; dl.textContent = 'Unduh MP3';
  dl.className = 'btn primary'; dl.style.cssText = 'text-decoration:none;display:inline-block';
  rw.appendChild(dl);
  if (ulang) rw.appendChild(T.btn('Buat Lagi', ulang));
  out.appendChild(rw);
  if (judul) out.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">' + judul + '</div>'));
  if (catatan) out.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:4px">' + catatan + '</div>'));
}
function fmtSrt(t) {
  const s = Math.max(0, Number(t) || 0);
  const p = (v, n) => String(v).padStart(n, '0');
  return p(Math.floor(s / 3600), 2) + ':' + p(Math.floor((s % 3600) / 60), 2) + ':' + p(Math.floor(s % 60), 2) + ',' + p(Math.floor((s % 1) * 1000), 3);
}
function unduhTeks(teks, nama, tipe) {
  const u = URL.createObjectURL(new Blob([teks], { type: tipe || 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = u; a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

export function render(root) {
  const keyF = utils.byok.field({
    tool: 'elevenlabs',
    label: 'ElevenLabs API key',
    placeholder: 'Tempel API key ElevenLabs milikmu (diawali sk_…)',
    docUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docLabel: 'Dapatkan API key gratis di ElevenLabs',
    hint: 'Key gratis ElevenLabs punya kuota bulanan terbatas. Key hanya dipakai untuk request langsung dari browser ke api.elevenlabs.io — tidak lewat server mana pun.',
  });
  root.appendChild(keyF.box);

  const tabs = [
    ['tts', 'Text to Speech'],
    ['ubah', 'Ubah Suara'],
    ['stt', 'Speech to Text'],
    ['fx', 'Sound FX'],
    ['lokal', 'Lokal (gratis)'],
  ];
  const tabBtns = tabs.map(([v, l]) => T.btn(l, () => setTab(v)));
  const pages = {};
  tabs.forEach(([v]) => { pages[v] = T.el('<div style="display:none"></div>'); });
  const setTab = (v) => {
    tabBtns.forEach((b, i) => b.classList.toggle('primary', tabs[i][0] === v));
    tabs.forEach(([k]) => { pages[k].style.display = k === v ? '' : 'none'; });
  };
  root.appendChild(T.row(...tabBtns));

  // Daftar voice dipakai bersama antar tab.
  let voices = [];
  async function muatVoice(keSelect, out) {
    const key = keyF.get();
    if (!key) { T.show(out, '<span class="warn">Isi & simpan API key dulu.</span>'); return false; }
    T.show(out, '<div class="dim center">Memuat daftar voice…</div>');
    const to = withTimeout(20000);
    try {
      const r = await fetch(API + '/voices', { headers: { 'xi-api-key': key }, signal: to.signal });
      to.done();
      if (!r.ok) errHttp(r);
      const d = await r.json();
      voices = (d && d.voices) || [];
      if (!voices.length) throw new Error('Daftar voice kosong.');
      keSelect.forEach((sel) => {
        sel.innerHTML = '';
        voices.forEach((v) => {
          const o = document.createElement('option');
          o.value = v.voice_id;
          o.textContent = v.name + (v.labels && v.labels.language ? ' (' + v.labels.language + ')' : '');
          sel.appendChild(o);
        });
      });
      T.show(out, '<div class="dim center">' + voices.length + ' voice dimuat.</div>');
      return true;
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 20 detik.' : (e.message || e);
      T.show(out, '<span class="err">' + T.esc(String(m)) + '</span>');
      return false;
    }
  }
  const opsiVoice = (sel) => {
    const manual = sel._manual;
    const vid = (manual && manual.value.trim()) || sel.value;
    return vid;
  };

  /* ================= TAB TTS ================= */
  const tp = pages.tts;
  const teks = T.ta(5, 'Tulis teks yang mau diubah jadi suara…');
  teks.maxLength = MAX_TTS;
  const tHitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TTS + '</div>');
  teks.addEventListener('input', () => { tHitung.textContent = teks.value.length + ' / ' + MAX_TTS; });
  const voiceSel = T.select([['', '— Muat daftar voice dulu —']], '');
  const voiceManual = T.input('text', '…atau tulis voice ID manual');
  voiceSel._manual = voiceManual;
  const modelSel = T.select(TTS_MODELS, 'eleven_multilingual_v2');
  const setelan = sliderPengaturan();
  const tOut = T.out();
  let tBusy = false;
  const muatBtn = T.btn('Muat daftar voice', () => muatVoice([voiceSel], tOut));
  async function generateTts() {
    if (tBusy) return;
    const key = keyF.get();
    if (!key) { T.show(tOut, '<span class="warn">Isi & simpan API key ElevenLabs dulu.</span>'); return; }
    const t = teks.value.trim();
    if (!t) { T.show(tOut, '<span class="warn">Isi dulu teksnya.</span>'); return; }
    if (t.length > MAX_TTS) { T.show(tOut, '<span class="warn">Teks maksimal ' + MAX_TTS + ' karakter per generate.</span>'); return; }
    const vid = opsiVoice(voiceSel);
    if (!vid) { T.show(tOut, '<span class="warn">Pilih voice dulu (atau tulis voice ID manual).</span>'); return; }
    tBusy = true;
    T.show(tOut, '<div class="dim center">Mensintesis suara…</div>');
    const to = withTimeout(60000);
    try {
      const r = await fetch(API + '/text-to-speech/' + encodeURIComponent(vid), {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text: t, model_id: modelSel.value, voice_settings: setelan.get() }),
        signal: to.signal,
      });
      to.done();
      if (!r.ok) errHttp(r, 'Coba voice/model lain.');
      const blob = await r.blob();
      kartuAudio(tOut, {
        blob, namaFile: 'elevenlabs-' + Date.now() + '.mp3',
        ulang: generateTts,
        catatan: 'Karakter terpakai memotong kuota ElevenLabs milikmu.',
      });
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 60 detik — coba teks lebih pendek.' : (e.message || e);
      T.show(tOut, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { tBusy = false; }
  }
  const genBtn = T.btn('Generate suara', generateTts, true);
  tp.appendChild(T.field('Teks', teks));
  tp.appendChild(tHitung);
  tp.appendChild(T.field('Voice', voiceSel));
  tp.appendChild(T.field('Voice ID manual (opsional)', voiceManual, 'Isi bila voice yang kamu mau tidak ada di daftar.'));
  tp.appendChild(T.row(muatBtn));
  tp.appendChild(T.field('Model', modelSel));
  tp.appendChild(setelan.box);
  tp.appendChild(T.row(genBtn));
  tp.appendChild(tOut);

  /* ================= TAB UBAH SUARA ================= */
  const up = pages.ubah;
  const uFile = document.createElement('input');
  uFile.type = 'file'; uFile.accept = 'audio/mpeg,audio/wav,audio/mp4,audio/webm,.mp3,.wav,.m4a,.webm'; uFile.className = 'inp';
  const uFileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  uFile.addEventListener('change', () => {
    const f = uFile.files[0];
    uFileInfo.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : '';
  });
  const uVoiceSel = T.select([['', '— Muat daftar voice dulu —']], '');
  const uVoiceManual = T.input('text', '…atau tulis voice ID manual');
  uVoiceSel._manual = uVoiceManual;
  const uModelSel = T.select(STS_MODELS, 'eleven_multilingual_sts_v2');
  const uSetelan = sliderPengaturan();
  const uOut = T.out();
  let uBusy = false;
  const uMuatBtn = T.btn('Muat daftar voice', () => muatVoice([uVoiceSel], uOut));
  async function convertSuara() {
    if (uBusy) return;
    const key = keyF.get();
    if (!key) { T.show(uOut, '<span class="warn">Isi & simpan API key ElevenLabs dulu.</span>'); return; }
    const f = uFile.files[0];
    if (!f) { T.show(uOut, '<span class="warn">Pilih file audio dulu.</span>'); return; }
    if (f.size > 25 * 1024 * 1024) { T.show(uOut, '<span class="warn">File maksimal 25 MB.</span>'); return; }
    const vid = opsiVoice(uVoiceSel);
    if (!vid) { T.show(uOut, '<span class="warn">Pilih voice tujuan dulu (atau tulis voice ID manual).</span>'); return; }
    uBusy = true;
    T.show(uOut, '<div class="dim center">Mengubah suara…</div>');
    const to = withTimeout(90000);
    try {
      const form = new FormData();
      form.append('audio', f, f.name || 'audio');
      form.append('model_id', uModelSel.value);
      form.append('voice_settings', JSON.stringify(uSetelan.get()));
      const r = await fetch(API + '/speech-to-speech/' + encodeURIComponent(vid), {
        method: 'POST', headers: { 'xi-api-key': key, 'Accept': 'audio/mpeg' },
        body: form, signal: to.signal,
      });
      to.done();
      if (!r.ok) errHttp(r, 'Coba file lain.');
      const blob = await r.blob();
      kartuAudio(uOut, {
        blob, namaFile: 'voice-changed-' + Date.now() + '.mp3',
        ulang: convertSuara,
        catatan: 'Delivery dipertahankan, karakter suara diubah. Durasi audio memotong kuota milikmu.',
      });
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 90 detik — coba file lebih pendek.' : (e.message || e);
      T.show(uOut, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { uBusy = false; }
  }
  up.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah karakter suara rekamanmu jadi voice AI lain — intonasi & tempo dipertahankan. File hanya dikirim saat proses.</p>'));
  up.appendChild(T.field('File audio', uFile, 'MP3/WAV/M4A/WebM, maks 25 MB.'));
  up.appendChild(uFileInfo);
  up.appendChild(T.field('Voice tujuan', uVoiceSel));
  up.appendChild(T.field('Voice ID manual (opsional)', uVoiceManual));
  up.appendChild(T.row(uMuatBtn));
  up.appendChild(T.field('Model', uModelSel));
  up.appendChild(uSetelan.box);
  up.appendChild(T.row(T.btn('Ubah suara', convertSuara, true)));
  up.appendChild(uOut);

  /* ================= TAB SPEECH TO TEXT ================= */
  const sp = pages.stt;
  const sFile = document.createElement('input');
  sFile.type = 'file'; sFile.accept = 'audio/mpeg,audio/wav,audio/mp4,audio/webm,video/mp4,video/webm,.mp3,.wav,.m4a,.webm,.mp4'; sFile.className = 'inp';
  const sFileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  sFile.addEventListener('change', () => {
    const f = sFile.files[0];
    sFileInfo.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : '';
  });
  const sLang = T.select([['', 'Otomatis'], ['id', 'Bahasa Indonesia'], ['en', 'English']], '');
  const sDiarize = T.el('<label style="font-size:13px;display:flex;gap:8px;align-items:center;cursor:pointer;margin:8px 0"><input type="checkbox" style="width:16px;height:16px"> Deteksi pembicara</label>');
  const sOut = T.out();
  let sBusy = false;
  function segmenDari(words) {
    const segs = [];
    let cur = null;
    (words || []).forEach((w) => {
      const spk = w.speaker_id || '';
      const teksW = (w.text || '').trim();
      if (!teksW) return;
      if (!cur || cur.speaker !== spk || cur.kata >= 12) {
        cur = { speaker: spk, kata: 0, start: Number(w.start) || 0, end: Number(w.end) || 0, teks: '' };
        segs.push(cur);
      }
      cur.teks += (cur.teks ? ' ' : '') + teksW;
      cur.kata++;
      cur.end = Number(w.end) || cur.end;
    });
    return segs;
  }
  async function transcribe() {
    if (sBusy) return;
    const key = keyF.get();
    if (!key) { T.show(sOut, '<span class="warn">Isi & simpan API key ElevenLabs dulu.</span>'); return; }
    const f = sFile.files[0];
    if (!f) { T.show(sOut, '<span class="warn">Pilih file audio/video dulu.</span>'); return; }
    if (f.size > 100 * 1024 * 1024) { T.show(sOut, '<span class="warn">File maksimal 100 MB.</span>'); return; }
    sBusy = true;
    T.show(sOut, '<div class="dim center">Mentranskripsi…</div>');
    const to = withTimeout(180000);
    try {
      const form = new FormData();
      form.append('file', f, f.name || 'audio');
      form.append('model_id', 'scribe_v1');
      if (sLang.value) form.append('language_code', sLang.value);
      form.append('diarize', sDiarize.querySelector('input').checked ? 'true' : 'false');
      form.append('tag_audio_events', 'false');
      const r = await fetch(API + '/speech-to-text', {
        method: 'POST', headers: { 'xi-api-key': key },
        body: form, signal: to.signal,
      });
      to.done();
      if (!r.ok) errHttp(r, 'Coba file lain.');
      const d = await r.json();
      const teksHasil = (d.text || '').trim();
      if (!teksHasil) throw new Error('Transkrip kosong.');
      const segs = segmenDari(d.words);
      const adaTs = segs.length > 0 && segs.some((s2) => s2.end > 0);
      T.show(sOut, '');
      const kartu = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px"></div>');
      kartu.appendChild(T.el('<div style="font-weight:700;font-size:13px;margin-bottom:6px">Transkrip' + (d.language_code ? ' · ' + T.esc(String(d.language_code).toUpperCase()) : '') + '</div>'));
      const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.65;max-height:300px;overflow:auto;margin:0 0 8px"></pre>');
      pre.textContent = adaTs
        ? segs.map((s2) => (s2.speaker ? '[' + s2.speaker.replace(/_/g, ' ') + ']\n' : '') + s2.teks).join('\n\n')
        : teksHasil;
      kartu.appendChild(pre);
      const rw = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
      rw.appendChild(T.copyBtn(() => pre.textContent, 'Salin'));
      rw.appendChild(T.btn('Unduh TXT', () => unduhTeks(pre.textContent, 'transkrip-' + Date.now() + '.txt'), false));
      if (adaTs) {
        rw.appendChild(T.btn('Unduh SRT', () => {
          const srt = segs.map((s2, i) => (i + 1) + '\n' + fmtSrt(s2.start) + ' --> ' + fmtSrt(s2.end) + '\n' + (s2.speaker ? '[' + s2.speaker.replace(/_/g, ' ') + '] ' : '') + s2.teks).join('\n\n');
          unduhTeks(srt, 'transkrip-' + Date.now() + '.srt', 'application/x-subrip');
        }, false));
      }
      kartu.appendChild(rw);
      sOut.appendChild(kartu);
      sOut.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">Durasi audio memotong kuota ElevenLabs milikmu.</div>'));
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 3 menit — coba file lebih pendek.' : (e.message || e);
      T.show(sOut, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { sBusy = false; }
  }
  sp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah audio/video jadi transkrip terstruktur (model Scribe). Timestamp dipakai untuk export SRT bila tersedia.</p>'));
  sp.appendChild(T.field('File audio / video', sFile, 'MP3/WAV/M4A/WebM/MP4, maks 100 MB.'));
  sp.appendChild(sFileInfo);
  sp.appendChild(T.field('Bahasa', sLang));
  sp.appendChild(sDiarize);
  sp.appendChild(T.row(T.btn('Transkripsi', transcribe, true)));
  sp.appendChild(sOut);

  /* ================= TAB SOUND FX ================= */
  const fp = pages.fx;
  const fxTeks = T.ta(4, 'Deskripsikan efek suara… (maks 1000 karakter)');
  fxTeks.maxLength = MAX_FX;
  const fxHitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_FX + '</div>');
  fxTeks.addEventListener('input', () => { fxHitung.textContent = fxTeks.value.length + ' / ' + MAX_FX; });
  const fxContoh = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0"></div>');
  CONTOH_FX.forEach((c) => {
    fxContoh.appendChild(T.btn(c, () => { fxTeks.value = c; fxHitung.textContent = c.length + ' / ' + MAX_FX; fxTeks.focus(); }));
  });
  const fxDur = T.select([['', 'Otomatis'], ['3', '3 detik'], ['5', '5 detik'], ['10', '10 detik'], ['15', '15 detik'], ['30', '30 detik']], '');
  const fxOut = T.out();
  let fxBusy = false;
  async function generateFx() {
    if (fxBusy) return;
    const key = keyF.get();
    if (!key) { T.show(fxOut, '<span class="warn">Isi & simpan API key ElevenLabs dulu.</span>'); return; }
    const t = fxTeks.value.trim();
    if (!t) { T.show(fxOut, '<span class="warn">Isi dulu deskripsi suaranya.</span>'); return; }
    fxBusy = true;
    T.show(fxOut, '<div class="dim center">Membuat sound effect…</div>');
    const to = withTimeout(60000);
    try {
      const body = { text: t, prompt_influence: 0.3 };
      if (fxDur.value) body.duration_seconds = Number(fxDur.value);
      const r = await fetch(API + '/sound-generation', {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify(body),
        signal: to.signal,
      });
      to.done();
      if (!r.ok) errHttp(r, 'Coba deskripsi lain.');
      const blob = await r.blob();
      kartuAudio(fxOut, {
        blob, namaFile: 'sound-fx-' + Date.now() + '.mp3',
        ulang: generateFx,
        catatan: 'Sound effect memotong kuota ElevenLabs milikmu.',
      });
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 60 detik.' : (e.message || e);
      T.show(fxOut, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { fxBusy = false; }
  }
  fp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Deskripsi singkat menjadi efek suara siap pakai.</p>'));
  fp.appendChild(T.field('Deskripsi suara', fxTeks));
  fp.appendChild(fxHitung);
  fp.appendChild(T.el('<div class="dim" style="font-size:12px;margin-bottom:2px">Contoh cepat:</div>'));
  fp.appendChild(fxContoh);
  fp.appendChild(T.field('Durasi', fxDur));
  fp.appendChild(T.row(T.btn('Buat sound effect', generateFx, true)));
  fp.appendChild(fxOut);

  /* ================= TAB LOKAL (Web Speech) ================= */
  const lp = pages.lokal;
  const lTeks = T.ta(4, 'Teks untuk dibacakan…');
  const lSuara = T.select([], '');
  const lOut = T.out();
  const synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
  const muatSuaraLokal = () => {
    if (!synth) return;
    const vs = [...synth.getVoices()].sort((a, b) => {
      const sk = (v) => /id[-_]ID/i.test(v.lang) ? 0 : /^id/i.test(v.lang) ? 1 : 2;
      return sk(a) - sk(b);
    });
    lSuara.innerHTML = '';
    vs.forEach((v) => {
      const o = document.createElement('option');
      o.value = v.name; o.textContent = v.name + ' (' + v.lang + ')';
      lSuara.appendChild(o);
    });
    if (!vs.length) {
      const o = document.createElement('option'); o.value = ''; o.textContent = 'Suara bawaan sistem';
      lSuara.appendChild(o);
    }
  };
  if (synth) { muatSuaraLokal(); if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = muatSuaraLokal; }
  const bicara = () => {
    if (!synth) { T.show(lOut, '<p class="err">Browser tidak mendukung text-to-speech.</p>'); return; }
    const t = lTeks.value.trim();
    if (!t) { T.show(lOut, '<p class="warn">Isi dulu teksnya.</p>'); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'id-ID';
    const v = synth.getVoices().find((x) => x.name === lSuara.value);
    if (v) u.voice = v;
    u.onend = () => T.hide(lOut);
    u.onerror = () => T.show(lOut, '<p class="err">Gagal membacakan.</p>');
    synth.speak(u);
    T.show(lOut, '<p class="dim center">Membacakan…</p>');
  };
  const berhenti = () => { try { synth && synth.cancel(); } catch (e) {} T.hide(lOut); };
  T.onLeave(berhenti);
  lp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Mode <b>gratis tanpa API key</b> — memakai suara bawaan perangkatmu (Web Speech API). ' +
    'Catatan jujur: kualitasnya suara robot standar, <b>tidak bisa diunduh</b>, dan hanya bisa diputar. Untuk suara AI natural yang bisa diunduh, pakai tab ElevenLabs.</p>'));
  lp.appendChild(T.field('Teks', lTeks));
  lp.appendChild(T.field('Suara', lSuara, 'Suara Indonesia diprioritaskan bila tersedia.'));
  lp.appendChild(T.row(T.btn('Bacakan', bicara, true), T.btn('Berhenti', berhenti)));
  lp.appendChild(lOut);

  tabs.forEach(([v]) => root.appendChild(pages[v]));
  setTab('tts');
}
