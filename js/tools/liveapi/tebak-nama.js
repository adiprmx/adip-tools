import { h as T, esc } from '../../core.js?v=6.12.2';

export const meta = {"id":"tebak-nama","name":"Tebak Profil Nama","cat":"liveapi","icon":"🔮","desc":"Tebak dulu umur & gender sebuah nama, lalu cek tebakanmu ke data nama dunia.","keywords":"nama,tebak,umur,usia,gender,jenis kelamin,negara,asal,kuis"};

// Emoji bendera dari kode negara ISO 2 huruf (ID -> 🇮🇩)
const flagOf = (cc) => {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
};

// Rentang umur tebakan: [label, min, max]
const RENTANG_UMUR = [
  ['skip', 'Lewati — tidak menebak umur'],
  ['remaja', 'Remaja (di bawah 20)'],
  ['20an', '20-an (20–29)'],
  ['30an', '30-an (30–39)'],
  ['40an', '40-an (40–49)'],
  ['50plus', '50 ke atas'],
];
const BATAS_UMUR = {
  remaja: [0, 19], '20an': [20, 29], '30an': [30, 39], '40an': [40, 49], '50plus': [50, 200],
};

export function render(root) {
  const inp = T.input('text', 'Contoh: budi, siti, andi', '');
  const tebakGender = T.select([['skip', 'Lewati — tidak menebak'], ['male', 'Laki-laki'], ['female', 'Perempuan']], 'skip');
  const tebakUmur = T.select(RENTANG_UMUR, 'skip');
  const box = T.out();
  const skorBox = T.out();

  // Tiap API punya AbortController + timeout sendiri-sendiri (paralel).
  const getJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const tebak = async () => {
    const nama = inp.value.trim();
    if (!nama) { T.show(box, '<span class="err">Isi nama dulu ya.</span>'); return; }
    T.hide(skorBox);
    T.show(box, '<div class="dim center">Menerawang nama "' + esc(nama) + '"…</div>');
    const enc = encodeURIComponent(nama);
    const [rUmur, rGender, rNegara] = await Promise.all([
      getJson('https://api.agify.io?name=' + enc).then((d) => ({ ok: true, d }), (e) => ({ ok: false, e })),
      getJson('https://api.genderize.io?name=' + enc).then((d) => ({ ok: true, d }), (e) => ({ ok: false, e })),
      getJson('https://api.nationalize.io?name=' + enc).then((d) => ({ ok: true, d }), (e) => ({ ok: false, e })),
    ]);

    const errMsg = (r) => {
      const e = r.e;
      if (e && e.name === 'AbortError') return 'timeout (server tidak merespons dalam 15 detik)';
      if (e && e.status === 429) return 'kuota harian habis (429) — coba lagi besok';
      if (e && e.status) return 'HTTP ' + e.status;
      return 'gagal memuat';
    };

    let html = '<div class="center" style="margin-bottom:10px"><div class="dim">Hasil tebakan untuk</div>' +
      '<div class="big">' + esc(nama) + '</div></div>';

    // --- Umur (agify) ---
    html += '<div class="kv"><span class="k">🎂 Perkiraan umur</span><span class="v">';
    if (rUmur.ok && rUmur.d.age != null) {
      html += esc(String(rUmur.d.age)) + ' tahun';
    } else {
      html += '<span class="dim">' + esc(rUmur.ok ? 'data tidak cukup' : errMsg(rUmur)) + '</span>';
    }
    html += '</span></div>';
    if (rUmur.ok && rUmur.d.count) {
      html += '<div class="hint">Berdasarkan ' + T.fmt(rUmur.d.count) + ' sampel nama "' + esc(rUmur.d.name || nama) + '" di database publik.</div>';
    }

    // --- Gender (genderize) ---
    let genderTxt;
    if (!rGender.ok) {
      genderTxt = '<span class="dim">' + esc(errMsg(rGender)) + '</span>';
    } else if (rGender.d.gender === 'female') {
      genderTxt = '👩 Perempuan (' + Math.round((rGender.d.probability || 0) * 100) + '%)';
    } else if (rGender.d.gender === 'male') {
      genderTxt = '👨 Laki-laki (' + Math.round((rGender.d.probability || 0) * 100) + '%)';
    } else {
      genderTxt = '<span class="dim">data tidak cukup</span>';
    }
    html += '<div class="kv"><span class="k">⚧️ Gender</span><span class="v">' + genderTxt + '</span></div>';

    // --- Negara (nationalize, 3 teratas) ---
    html += '<div class="kv"><span class="k">🌍 Asal negara</span><span class="v">';
    if (!rNegara.ok) {
      html += '<span class="dim">' + esc(errMsg(rNegara)) + '</span>';
    } else {
      const list = (rNegara.d.country || []).slice(0, 3);
      html += list.length
        ? list.map((c) => esc(flagOf(c.country_id) + ' ' + (c.country_id || '')) + ' <span class="dim">' + Math.round((c.probability || 0) * 100) + '%</span>').join('<br>')
        : '<span class="dim">data tidak cukup</span>';
    }
    html += '</span></div>';

    html += '<div class="hint">Tebakan kasar dari statistik nama publik — bukan hasil pasti. API gratis ~100 cek/hari.</div>';
    T.show(box, html);

    // --- Lapisan kuis: nilai tebakan user (tidak mengubah logika API di atas) ---
    const g = tebakGender.value, u = tebakUmur.value;
    if (g !== 'skip' || u !== 'skip') {
      let total = 0, dapat = 0;
      const rincian = [];
      if (g !== 'skip') {
        total++;
        const cocok = rGender.ok && rGender.d.gender === g;
        if (cocok) dapat++;
        rincian.push('gender: ' + (rGender.ok && rGender.d.gender ? (cocok ? '✅ benar' : '❌ kurang tepat') : '⚪ data tidak cukup'));
      }
      if (u !== 'skip') {
        total++;
        const [mn, mx] = BATAS_UMUR[u];
        const cocok = rUmur.ok && rUmur.d.age != null && rUmur.d.age >= mn && rUmur.d.age <= mx;
        if (cocok) dapat++;
        rincian.push('umur: ' + (rUmur.ok && rUmur.d.age != null ? (cocok ? '✅ benar' : '❌ kurang tepat') : '⚪ data tidak cukup'));
      }
      const teks = '🔮 Tebak Profil Nama: tebakanku untuk nama "' + nama + '" benar ' + dapat + ' dari ' + total + '! Coba kalahin aku di Adip Tools.';
      T.show(skorBox, '<div class="center" style="margin-top:12px;border:1px solid var(--line);border-radius:12px;padding:12px">' +
        '<div style="font-size:16px;font-weight:700">Tebakanmu: ' + dapat + '/' + total + ' benar</div>' +
        '<p class="hint" style="margin:4px 0 0">' + rincian.join(' · ') + '</p></div>');
      const w = T.el('<div class="row center" style="margin-top:10px"></div>');
      w.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
      if (typeof navigator !== 'undefined' && navigator.share) {
        w.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
      }
      skorBox.appendChild(w);
    }
  };

  root.appendChild(T.field('Nama depan', inp, 'Satu kata saja, mis. budi'));
  root.appendChild(T.el('<p class="hint" style="margin:6px 0 2px">🎲 Mau main tebak-tebakan? Isi tebakanmu dulu (boleh dilewati), lalu lihat benar atau tidak setelah hasilnya keluar:</p>'));
  root.appendChild(T.field('Tebak gendernya', tebakGender));
  root.appendChild(T.field('Tebak rentang umurnya', tebakUmur));
  root.appendChild(T.row(T.btn('🔮 Tebak', tebak, true)));
  root.appendChild(box);
  root.appendChild(skorBox);
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') tebak(); });
}
