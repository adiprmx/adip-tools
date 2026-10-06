import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"tebak-nama","name":"Tebak Profil Nama","cat":"liveapi","icon":"🔮","desc":"Tebak perkiraan usia, gender, dan asal negara dari sebuah nama.","keywords":"nama,tebak,umur,usia,gender,jenis kelamin,negara,asal"};

// Emoji bendera dari kode negara ISO 2 huruf (ID -> 🇮🇩)
const flagOf = (cc) => {
  if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));
};

export function render(root) {
  const inp = T.input('text', 'Contoh: budi, siti, andi', '');
  const box = T.out();

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
  };

  root.appendChild(T.field('Nama depan', inp, 'Satu kata saja, mis. budi'));
  root.appendChild(T.row(T.btn('🔮 Tebak', tebak, true)));
  root.appendChild(box);
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') tebak(); });
}
