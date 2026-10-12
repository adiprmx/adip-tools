import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"elevenlabs","name":"ElevenLabs Studio","cat":"musik","icon":"🎙️","desc":"Text-to-speech suara AI via API key ElevenLabs milikmu.","keywords":"elevenlabs,tts,suara,ai,voice,text to speech"};

const API = 'https://api.elevenlabs.io/v1';
const MODELS = [
  ['eleven_multilingual_v2', 'Multilingual v2 (disarankan, dukung Indonesia)'],
  ['eleven_turbo_v2_5', 'Turbo v2.5 (cepat & murah)'],
  ['eleven_flash_v2_5', 'Flash v2.5 (paling cepat)'],
];

function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done() { clearTimeout(t); } };
}

export function render(root) {
  const keyF = utils.byok.field({
    tool: 'elevenlabs',
    label: 'ElevenLabs API key',
    placeholder: 'Tempel API key ElevenLabs milikmu (diawali sk_…)',
    docUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docLabel: 'Dapatkan API key gratis di ElevenLabs',
    hint: 'Key gratis ElevenLabs punya kuota bulanan terbatas. Key hanya dipakai untuk request langsung ke api.elevenlabs.io.',
  });
  root.appendChild(keyF.box);

  const tabs = [['el', '🎙️ ElevenLabs'], ['lokal', '🆓 Lokal (gratis)']];
  const tabBtns = tabs.map(([v, l]) => T.btn(l, () => setTab(v)));
  const pages = { el: T.el('<div style="display:none"></div>'), lokal: T.el('<div style="display:none"></div>') };
  const setTab = (v) => {
    tabBtns.forEach((b, i) => b.classList.toggle('primary', tabs[i][0] === v));
    Object.keys(pages).forEach((k) => { pages[k].style.display = k === v ? '' : 'none'; });
  };
  root.appendChild(T.row(...tabBtns));

  /* ---------- TAB ELEVENLABS ---------- */
  const ep = pages.el;
  const teks = T.ta(5, 'Tulis teks yang mau diubah jadi suara…');
  const voiceSel = T.select([['', '— Muat daftar voice dulu —']], '');
  const voiceManual = T.input('text', '…atau tulis voice ID manual');
  const modelSel = T.select(MODELS, 'eleven_multilingual_v2');
  const out = T.out();
  let busy = false;

  const muatVoice = T.btn('🔄 Muat daftar voice', async () => {
    const key = keyF.get();
    if (!key) { T.show(out, '<span class="warn">Isi & simpan API key dulu.</span>'); return; }
    T.show(out, '<div class="dim center">Memuat daftar voice…</div>');
    const to = withTimeout(20000);
    try {
      const r = await fetch(API + '/voices', { headers: { 'xi-api-key': key }, signal: to.signal });
      to.done();
      if (r.status === 401) throw new Error('API key ditolak (401). Cek lagi key-nya.');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const vs = (d && d.voices) || [];
      if (!vs.length) throw new Error('Daftar voice kosong.');
      voiceSel.innerHTML = '';
      vs.forEach((v) => {
        const o = document.createElement('option');
        o.value = v.voice_id; o.textContent = v.name + (v.labels && v.labels.language ? ' (' + v.labels.language + ')' : '');
        voiceSel.appendChild(o);
      });
      T.show(out, '<div class="dim center">✅ ' + vs.length + ' voice dimuat.</div>');
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 20 detik.' : (e.message || e);
      T.show(out, '<span class="err">' + T.esc(String(m)) + '</span>');
    }
  });

  const genBtn = T.btn('🎙️ Generate suara', async () => {
    if (busy) return;
    const key = keyF.get();
    if (!key) { T.show(out, '<span class="warn">Isi & simpan API key ElevenLabs dulu.</span>'); return; }
    const t = teks.value.trim();
    if (!t) { T.show(out, '<span class="warn">Isi dulu teksnya.</span>'); return; }
    if (t.length > 5000) { T.show(out, '<span class="warn">Teks maksimal 5000 karakter per generate.</span>'); return; }
    const vid = voiceManual.value.trim() || voiceSel.value;
    if (!vid) { T.show(out, '<span class="warn">Pilih voice dulu (atau tulis voice ID manual).</span>'); return; }
    busy = true; genBtn.disabled = true;
    T.show(out, '<div class="dim center">🎙️ Mensintesis suara…</div>');
    const to = withTimeout(60000);
    try {
      const r = await fetch(API + '/text-to-speech/' + encodeURIComponent(vid), {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text: t, model_id: modelSel.value }),
        signal: to.signal,
      });
      to.done();
      if (r.status === 401) throw new Error('API key ditolak (401).');
      if (r.status === 429) throw new Error('Kuota habis / rate limit (429). Cek pemakaian di dashboard ElevenLabs.');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.show(out, '');
      const a = document.createElement('audio');
      a.src = url; a.controls = true; a.style.cssText = 'width:100%';
      out.appendChild(a);
      const rw = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>');
      rw.appendChild(T.btn('⬇️ Unduh MP3', () => {
        const l = document.createElement('a');
        l.href = url; l.download = 'elevenlabs-' + Date.now() + '.mp3';
        document.body.appendChild(l); l.click(); l.remove();
      }, true));
      out.appendChild(rw);
      out.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">Karakter terpakai memotong kuota ElevenLabs milikmu.</div>'));
    } catch (e) {
      to.done();
      const m = e.name === 'AbortError' ? 'Timeout 60 detik — coba teks lebih pendek.' : (e.message || e);
      T.show(out, '<span class="err">' + T.esc(String(m)) + '</span>');
    } finally { busy = false; genBtn.disabled = false; }
  }, true);

  ep.appendChild(T.field('Teks', teks));
  ep.appendChild(T.field('Voice', voiceSel));
  ep.appendChild(T.field('Voice ID manual (opsional)', voiceManual, 'Isi bila voice yang kamu mau tidak ada di daftar.'));
  ep.appendChild(T.row(muatVoice));
  ep.appendChild(T.field('Model', modelSel));
  ep.appendChild(T.row(genBtn));
  ep.appendChild(out);

  /* ---------- TAB LOKAL (Web Speech, gratis tanpa key) ---------- */
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
    T.show(lOut, '<p class="dim center">🔊 Membacakan…</p>');
  };
  const berhenti = () => { try { synth && synth.cancel(); } catch (e) {} T.hide(lOut); };
  T.onLeave(berhenti);
  lp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Mode <b>gratis tanpa API key</b> — memakai suara bawaan perangkatmu (Web Speech API). ' +
    'Catatan jujur: kualitasnya suara robot standar, <b>tidak bisa diunduh</b>, dan hanya bisa diputar. Untuk suara AI natural yang bisa diunduh, pakai tab ElevenLabs.</p>'));
  lp.appendChild(T.field('Teks', lTeks));
  lp.appendChild(T.field('Suara', lSuara, 'Suara Indonesia diprioritaskan bila tersedia.'));
  lp.appendChild(T.row(T.btn('🔊 Bacakan', bicara, true), T.btn('⏹️ Berhenti', berhenti)));
  lp.appendChild(lOut);

  root.appendChild(pages.el);
  root.appendChild(pages.lokal);
  setTab('el');
}
