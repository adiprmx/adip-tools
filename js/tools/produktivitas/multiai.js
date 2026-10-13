import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"multiai","name":"Multi-AI","cat":"produktivitas","icon":"🤖","desc":"Tanya banyak AI sekaligus + generate gambar & suara via Puter.","keywords":"ai,chat,multi,gpt,claude,puter,tts,gambar"};

const MAX_CEK = 5;
const MAX_PROMPT_CHAT = 8000;

function chatText(res) {
  if (!res) return '';
  if (typeof res === 'string') return res;
  const cands = [
    res.text, res.content,
    res.message && (res.message.content || res.message.text),
    res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content,
  ];
  for (const c of cands) if (typeof c === 'string' && c) return c;
  try { return JSON.stringify(res).slice(0, 4000); } catch (e) { return String(res); }
}
function errPesan(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  const raw = String(n.code || r.code || n.message || r.message || e || '').toLowerCase();
  if (/abort/.test(raw)) return 'Dihentikan.';
  if (/popup|blocked/.test(raw)) return 'Jendela login diblokir browser. Izinkan pop-up lalu coba lagi.';
  if (d401(raw)) return 'Hubungkan akun Puter terlebih dahulu.';
  if (/allowance|credit|quota|insufficient|payment|402/.test(raw)) return 'Allowance Puter habis / tidak cukup.';
  if (/rate|too many|429/.test(raw)) return 'Terlalu banyak permintaan. Coba lagi sebentar.';
  if (/safety|moderation|policy|filtered/.test(raw)) return 'Ditolak aturan keamanan AI.';
  if (/model not found|unknown model|model.*unavailable|unsupported model|no provider/.test(raw)) return 'Model tidak tersedia.';
  if (/network|failed to fetch|offline/.test(raw)) return 'Koneksi ke Puter terputus.';
  return String((r.message || e || 'Gagal')).slice(0, 200);
}
function d401(raw) { return /401|403|unauthor|auth|sign.?in|login|cancel|closed|denied/.test(raw); }

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true;
  const aborts = new Set();
  T.onLeave(() => { alive = false; aborts.forEach((c) => { try { c.abort(); } catch (e) {} }); aborts.clear(); });

  const tabs = [['chat', 'Chat'], ['gambar', 'Gambar'], ['suara', 'Suara']];
  const tabBtns = tabs.map(([v, l]) => T.btn(l, () => setTab(v)));
  const pages = {};
  tabs.forEach(([v]) => { pages[v] = T.el('<div style="display:none"></div>'); });
  const setTab = (v) => {
    tabBtns.forEach((b, i) => b.classList.toggle('primary', tabs[i][0] === v));
    tabs.forEach(([k]) => { pages[k].style.display = k === v ? '' : 'none'; });
  };
  root.appendChild(T.row(...tabBtns));

  /* ================= TAB CHAT ================= */
  const cp = pages.chat;
  const cPrompt = T.ta(4, 'Tulis pertanyaanmu di sini… (Enter = kirim, Shift+Enter = baris baru)');
  cPrompt.maxLength = MAX_PROMPT_CHAT;
  const cHitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_PROMPT_CHAT + '</div>');
  cPrompt.addEventListener('input', () => { cHitung.textContent = cPrompt.value.length + ' / ' + MAX_PROMPT_CHAT; });
  cPrompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tanya(); }
  });
  const modelBox = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;max-height:180px;overflow:auto;border:1px solid #ffffff14;border-radius:8px;padding:8px"></div>');
  const paintOtomatis = () => {
    modelBox.innerHTML = '';
    const lb = document.createElement('label');
    lb.style.cssText = 'font-size:12.5px;display:flex;gap:6px;align-items:center;cursor:pointer';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.value = '';
    lb.appendChild(cb); lb.appendChild(document.createTextNode('Otomatis (1 model)'));
    modelBox.appendChild(lb);
  };
  paintOtomatis();
  const muatBtn = T.btn('Muat daftar model', async () => {
    await puter.need(async () => {
      modelBox.innerHTML = '<span class="dim" style="font-size:12px">Memuat…</span>';
      const ms = await utils.puter.chatModels();
      modelBox.innerHTML = '';
      if (!ms.length) { paintOtomatis(); T.toast('Gagal memuat daftar model — pakai mode Otomatis'); return; }
      ms.slice(0, 60).forEach((m) => {
        const lb = document.createElement('label');
        lb.style.cssText = 'font-size:12px;display:flex;gap:6px;align-items:center;cursor:pointer;border:1px solid #ffffff14;border-radius:6px;padding:4px 8px';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = m;
        cb.addEventListener('change', () => {
          const n = modelBox.querySelectorAll('input:checked').length;
          if (n > MAX_CEK) { cb.checked = false; T.toast('Maksimal ' + MAX_CEK + ' model sekaligus (hemat kuota)'); }
        });
        lb.appendChild(cb); lb.appendChild(document.createTextNode(m));
        modelBox.appendChild(lb);
      });
      if (ms.length > 60) modelBox.appendChild(T.el('<span class="dim" style="font-size:11.5px;width:100%">…dan ' + (ms.length - 60) + ' lainnya tidak ditampilkan.</span>'));
    });
  });
  const cOut = T.out();
  let cBusy = false;
  const tanyaBtn = T.btn('Tanya AI', () => tanya(), true);
  const stopBtn = T.btn('Hentikan', () => {
    aborts.forEach((c) => { try { c.abort(); } catch (e) {} });
    aborts.clear();
  });
  stopBtn.disabled = true;
  const salinSemuaBtn = T.btn('Salin semua jawaban', async () => {
    const teks = hasilChat
      .filter((c) => c.jawaban)
      .map((c) => '=== ' + (c.m || 'Otomatis') + ' ===\n' + c.jawaban)
      .join('\n\n');
    if (!teks) { T.toast('Belum ada jawaban untuk disalin'); return; }
    try { await navigator.clipboard.writeText(teks); T.toast('Semua jawaban disalin'); }
    catch (e) { T.toast('Gagal menyalin'); }
  });
  const clearBtn = T.btn('Bersihkan', () => { hasilChat = []; cOut.innerHTML = ''; cOut.hidden = true; });
  let hasilChat = [];

  function modelTerpilih() {
    const cbs = [...modelBox.querySelectorAll('input:checked')].map((c) => c.value);
    return cbs.length ? cbs : null;
  }

  async function tanyaSatu(c, p) {
    const ctl = new AbortController();
    aborts.add(ctl);
    c.setStatus('Menghubungi…', 'dim');
    const t0 = performance.now();
    try {
      const opts = {};
      if (c.m) opts.model = c.m;
      // puter.ai.chat tidak selalu mendukung AbortSignal; tetap siapkan untuk stop manual
      const res = await window.puter.ai.chat(p, opts);
      if (ctl.signal.aborted) throw new Error('abort');
      const txt = chatText(res) || '(respons kosong)';
      c.jawaban = txt;
      c.card.querySelector('.jw').textContent = txt;
      const ms = Math.round(performance.now() - t0);
      c.setStatus('Selesai · ' + (ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + ' dtk'), 'ok');
      c.tampilAksi();
    } catch (e) {
      c.jawaban = '';
      c.setStatus('Gagal: ' + T.esc(errPesan(e)), 'err');
      c.tampilUlangi(p);
    } finally { aborts.delete(ctl); }
  }

  async function tanya() {
    if (cBusy) return;
    const p = cPrompt.value.trim();
    if (!p) { T.show(cOut, '<span class="warn">Tulis dulu pertanyaannya.</span>'); return; }
    const models = modelTerpilih();
    if (!models) { T.show(cOut, '<span class="warn">Pilih minimal 1 model.</span>'); return; }
    await puter.need(async () => {
      cBusy = true; tanyaBtn.disabled = true; stopBtn.disabled = false;
      T.show(cOut, '');
      hasilChat = models.map((m) => {
        const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px;margin-bottom:10px"></div>');
        card.innerHTML = '<div style="font-weight:700;font-size:13px;margin-bottom:6px">' + T.esc(m || 'Otomatis') + '</div>' +
          '<div class="dim st" style="font-size:12.5px">Mengantre…</div>' +
          '<div class="jw" style="font-size:13px;line-height:1.65;margin-top:6px;white-space:pre-wrap;word-break:break-word"></div>' +
          '<div class="rw" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"></div>';
        cOut.appendChild(card);
        const c = {
          m, card, jawaban: '',
          setStatus(t, cls) { const s = card.querySelector('.st'); s.className = 'st ' + (cls || 'dim'); s.style.fontSize = '12.5px'; s.innerHTML = t; },
          tampilAksi() {
            const rw = card.querySelector('.rw'); rw.innerHTML = '';
            rw.appendChild(T.copyBtn(() => c.jawaban, 'Salin jawaban'));
          },
          tampilUlangi(pp) {
            const rw = card.querySelector('.rw'); rw.innerHTML = '';
            rw.appendChild(T.btn('Coba lagi', () => tanyaSatu(c, pp)));
          },
        };
        return c;
      });
      await Promise.all(hasilChat.map((c) => tanyaSatu(c, p)));
      cOut.appendChild(T.el(utils.puter.poweredBy()));
      if (!alive) return;
      cBusy = false; tanyaBtn.disabled = false; stopBtn.disabled = true;
    });
  }

  cp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Satu pertanyaan dikirim <b>paralel</b> ke beberapa model AI sekaligus via akun Putermu. Tiap kartu jalan sendiri — yang gagal tidak menggagalkan yang lain.</p>'));
  cp.appendChild(T.field('Pertanyaan', cPrompt));
  cp.appendChild(cHitung);
  cp.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin:8px 0 4px">Model <span class="dim" style="font-weight:400">(maks ' + MAX_CEK + ')</span></div>'));
  cp.appendChild(modelBox);
  cp.appendChild(T.row(muatBtn));
  cp.appendChild(T.el('<div style="height:8px"></div>'));
  cp.appendChild(T.row(tanyaBtn, stopBtn, salinSemuaBtn, clearBtn));
  cp.appendChild(cOut);

  /* ================= TAB GAMBAR ================= */
  const gp = pages.gambar;
  const gPrompt = T.ta(3, 'Deskripsikan gambarnya…');
  const gOut = T.out();
  let gBusy = false;
  const gBtn = T.btn('Generate gambar', async () => {
    if (gBusy) return;
    const p = gPrompt.value.trim();
    if (!p) { T.show(gOut, '<span class="warn">Isi dulu deskripsinya.</span>'); return; }
    await puter.need(async () => {
      gBusy = true; gBtn.disabled = true;
      T.show(gOut, '<div class="dim center">Menggambar… (bisa 1-2 menit)</div>');
      try {
        const res = await window.puter.ai.txt2img(p, {});
        const src = utils.puter.srcOf(res);
        if (!src) throw new Error('Puter tidak mengembalikan gambar.');
        T.show(gOut, '');
        const img = document.createElement('img');
        img.src = src; img.alt = 'Hasil AI';
        img.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;cursor:zoom-in';
        img.addEventListener('click', () => window.open(src, '_blank', 'noopener'));
        gOut.appendChild(img);
        const rw = T.el('<div style="display:flex;gap:8px;margin-top:10px;justify-content:center;flex-wrap:wrap"></div>');
        rw.appendChild(T.btn('Unduh', () => utils.dlUrl(src, 'multiai-' + Date.now() + '.png'), true));
        rw.appendChild(T.btn('Buka ukuran penuh', () => window.open(src, '_blank', 'noopener')));
        gOut.appendChild(rw);
        gOut.appendChild(T.el(utils.puter.poweredBy()));
      } catch (e) {
        T.show(gOut, '<span class="err">Gagal: ' + T.esc(errPesan(e)) + '</span>');
      } finally { gBusy = false; gBtn.disabled = false; }
    });
  }, true);
  gp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Generate gambar cepat via akun Putermu. Untuk kontrol model & rasio, pakai tool <b>AI Image</b>.</p>'));
  gp.appendChild(T.field('Deskripsi gambar', gPrompt));
  gp.appendChild(T.row(gBtn));
  gp.appendChild(gOut);

  /* ================= TAB SUARA ================= */
  const sp = pages.suara;
  const sText = T.ta(4, 'Teks yang mau dibacakan AI…');
  const sVoice = T.input('text', 'Suara (opsional, mis. Joanna — kosongkan untuk default)');
  const sOut = T.out();
  let sBusy = false;
  const sBtn = T.btn('Bacakan', async () => {
    if (sBusy) return;
    const t = sText.value.trim();
    if (!t) { T.show(sOut, '<span class="warn">Isi dulu teksnya.</span>'); return; }
    await puter.need(async () => {
      sBusy = true; sBtn.disabled = true;
      T.show(sOut, '<div class="dim center">Mensintesis suara…</div>');
      try {
        const opts = {};
        if (sVoice.value.trim()) opts.voice = sVoice.value.trim();
        const audio = await window.puter.ai.txt2speech(t, opts);
        T.show(sOut, '');
        if (audio && audio.play) {
          audio.controls = true;
          audio.style.cssText = 'width:100%';
          sOut.appendChild(audio);
          audio.play().catch(() => {});
        } else {
          T.show(sOut, '<span class="warn">Audio tidak dikenali dari Puter.</span>');
        }
        sOut.appendChild(T.el(utils.puter.poweredBy()));
        sOut.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">Catatan: suara AI memotong kuota akun Putermu.</div>'));
      } catch (e) {
        T.show(sOut, '<span class="err">Gagal: ' + T.esc(errPesan(e)) + '</span>');
      } finally { sBusy = false; sBtn.disabled = false; }
    });
  }, true);
  sp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Text-to-speech cepat via akun Putermu. Untuk suara ElevenLabs & pengaturan lanjutan, pakai tool <b>ElevenLabs Studio</b>.</p>'));
  sp.appendChild(T.field('Teks', sText));
  sp.appendChild(T.field('Suara (opsional)', sVoice, 'Nama suara/voice ID. Kosongkan untuk suara default.'));
  sp.appendChild(T.row(sBtn));
  sp.appendChild(sOut);

  tabs.forEach(([v]) => root.appendChild(pages[v]));
  setTab('chat');
}
