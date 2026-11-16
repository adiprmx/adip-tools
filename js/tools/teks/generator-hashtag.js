import { h as T, kv, utils } from '../../core.js?v=6.12.2';

/* Dibuat agar bisa diuji langsung dari node (tanpa DOM). */
export function topikKeTag(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/\s/g, '');
}

export function buatHashtag(input, jumlah) {
  const topik = topikKeTag(input);
  if (!topik) return [];
  const maks = Math.max(5, Math.min(30, Math.round(Number(jumlah) || 15)));
  const pola = [
    (t) => t,
    (t) => t + 'indonesia',
    (t) => 'info' + t,
    (t) => 'tips' + t,
    (t) => t + 'viral',
    (t) => 'seputar' + t,
    (t) => t + 'hits',
    (t) => t + 'reels',
    (t) => t + 'daily',
    (t) => 'daily' + t,
    (t) => t + 'lover',
    (t) => 'pecinta' + t,
    (t) => t + 'terbaik',
    (t) => t + 'murah',
    (t) => 'jualan' + t,
    (t) => t + 'online',
    (t) => 'belajar' + t,
    (t) => t + 'pemula',
    (t) => 'tutorial' + t,
    (t) => t + 'kekinian',
    (t) => 'inspirasi' + t,
    (t) => t + 'id',
    (t) => 'explore' + t,
  ];
  const list = [];
  pola.forEach((p) => { const h = '#' + p(topik); if (list.indexOf(h) === -1) list.push(h); });
  ['fyp', 'fypindonesia', 'beranda', 'viral', 'trending', 'reelsindonesia', 'tiktokindonesia',
    'explorepage', 'foryoupage', 'reels', 'tiktokviral', 'viralindonesia', 'indonesiaku']
    .forEach((g) => { const h = '#' + g; if (list.indexOf(h) === -1) list.push(h); });
  return list.slice(0, maks);
}

// Campuran seimbang: 3 luas + 5 niche + 2 lokal (disesuaikan bila kurang).
export function campuranHashtag(tier) {
  const out = [];
  const ambil = (arr, n) => { for (const h of arr.slice(0, n)) if (out.indexOf(h) === -1) out.push(h); };
  ambil(tier.luas || [], 3);
  ambil(tier.niche || [], 5);
  ambil(tier.lokal || [], 2);
  return out;
}

export const HASHTAG_LUAS = ['#fyp', '#fypindonesia', '#beranda', '#viral', '#trending'];

export function tierHashtag(h) {
  const t = String(h).toLowerCase();
  if (HASHTAG_LUAS.indexOf(t) > -1) return 'luas';
  if (t.indexOf('indonesia') > -1) return 'lokal';
  return 'niche';
}

export function buatHashtagTier(input, jumlah) {
  const semua = buatHashtag(input, jumlah);
  const out = { luas: [], niche: [], lokal: [] };
  semua.forEach((h) => { out[tierHashtag(h)].push(h); });
  return out;
}

export function parseHashtagPakai(s) {
  const set = new Set();
  (String(s == null ? '' : s).toLowerCase().match(/#[a-z0-9_]+/g) || []).forEach((h) => set.add(h));
  return set;
}

export function cariDuplikat(daftar, dipakai) {
  return daftar.filter((h) => dipakai.has(h.toLowerCase()));
}

export const BATAS_HASHTAG = [
  ['Instagram', 30, 'maksimal per postingan'],
  ['YouTube', 15, 'lebih dari itu diabaikan'],
  ['TikTok', null, 'tanpa batas jumlah, dibatasi panjang caption'],
  ['X', 2, 'disarankan, supaya tidak terlihat seperti spam'],
];

export const meta = {"id": "generator-hashtag", "name": "Generator Hashtag", "cat": "teks", "icon": "#️⃣", "desc": "Bikin sampai 30 hashtag siap pakai dari satu topik, per tier luas/niche/lokal.", "keywords": "hashtag,tagar,instagram,tiktok,reels,caption"};

export function render(root) {

    const inp = T.input('text', 'Contoh: kopi susu, skincare, jualan baju…');
    const jumlahSel = T.select([['15', '15 hashtag'], ['20', '20 hashtag'], ['30', '30 hashtag (maksimal Instagram)']], '15');
    const fPakai = T.ta(2, 'Tempel hashtag yang sudah pernah dipakai, misal: #kopi #fyp (opsional)');
    const out = T.out();
    let daftar = [];
    let dipakai = new Set();

    function chip(h, duplikat) {
      const c = T.el('<button type="button" class="btn small" style="border-radius:999px' + (duplikat ? ';border-color:#fbbf24;color:#fbbf24' : '') + '">' + T.esc(h) + (duplikat ? ' · dipakai' : '') + '</button>');
      c.addEventListener('click', () => {
        T.copy(h);
        const lama = c.textContent;
        c.textContent = '✓ ' + h;
        setTimeout(() => { c.textContent = lama; }, 1200);
      });
      return c;
    }

    function gambar() {
      if (!daftar.length) { T.hide(out); return; }
      const tier = buatHashtagTier(inp.value, jumlahSel.value);
      const dup = cariDuplikat(daftar, dipakai);
      const campur = campuranHashtag(tier);
      const box = T.el('<div></div>');
      box.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin-bottom:8px">' + daftar.length + ' hashtag · ' + tier.luas.length + ' luas · ' + tier.niche.length + ' niche · ' + tier.lokal.length + ' lokal' + (dup.length ? ' · <span style="color:#fbbf24">' + dup.length + ' sudah pernah dipakai</span>' : '') + '</div>'));
      [['luas', 'Luas (jangkauan besar)'], ['niche', 'Niche (sesuai topik)'], ['lokal', 'Lokal (Indonesia)']].forEach(([k, label]) => {
        if (!tier[k].length) return;
        const sec = T.el('<div style="margin-bottom:12px"></div>');
        sec.appendChild(T.el('<div class="hint" style="margin-bottom:6px">' + label + ' (' + tier[k].length + ')</div>'));
        const chips = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px"></div>');
        tier[k].forEach((h) => chips.appendChild(chip(h, dipakai.has(h.toLowerCase()))));
        sec.appendChild(chips);
        box.appendChild(sec);
      });
      box.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:12px 0 4px">Batas tiap platform</div>'));
      BATAS_HASHTAG.forEach(([nama, batas, ket]) => {
        const ok = batas == null || daftar.length <= batas;
        const row = T.el('<div class="kv"><span>' + T.esc(nama) + ' (' + T.esc(ket) + ')</span><b style="color:' + (ok ? '#4ade80' : '#f87171') + '">' + (batas == null ? 'Aman' : daftar.length + ' / ' + batas + (ok ? '' : ' · kelebihan')) + '</b></div>');
        box.appendChild(row);
      });
      T.show(out, '');
      out.appendChild(box);
      out.appendChild(T.row(
        T.copyBtn(() => daftar.join(' '), '📋 Salin Semua (' + daftar.length + ')'),
        T.copyBtn(() => daftar.join('\n'), 'Salin per Baris')
      ));
      const tierRow = T.row(
        T.copyBtn(() => tier.luas.join(' '), 'Salin Luas'),
        T.copyBtn(() => tier.niche.join(' '), 'Salin Niche'),
        T.copyBtn(() => tier.lokal.join(' '), 'Salin Lokal'),
        T.copyBtn(() => campur.join(' '), 'Salin Campuran (' + campur.length + ')')
      );
      tierRow.style.marginTop = '8px';
      out.appendChild(tierRow);
      out.appendChild(T.el('<p class="hint">Campuran = 3 luas + 5 niche + 2 lokal, porsi yang paling sering disarankan buat satu postingan.</p>'));
    }

    const proses = () => {
      daftar = buatHashtag(inp.value, jumlahSel.value);
      dipakai = parseHashtagPakai(fPakai.value);
      if (!daftar.length) {
        T.show(out, '<span class="err">Tulis topiknya dulu, misal "kopi susu" atau "skincare".</span>');
        return;
      }
      gambar();
    };

    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') proses(); });
    jumlahSel.addEventListener('change', () => { if (daftar.length) proses(); });
    fPakai.addEventListener('input', () => { dipakai = parseHashtagPakai(fPakai.value); if (daftar.length) gambar(); });
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketik satu topik, langsung dapat hashtag siap pakai: pola turunan topikmu + hashtag generik yang lagi ramai di Indonesia. Ketuk satu chip buat salin satuan, atau salin semuanya sekaligus.</p>'));
    root.appendChild(T.field('Topik / kata kunci', inp));
    root.appendChild(T.field('Jumlah hashtag', jumlahSel, 'Instagram maksimal 30 per postingan. TikTok & X lebih baik sedikit saja.'));
    root.appendChild(T.field('Hashtag yang sudah pernah dipakai (opsional)', fPakai, 'Hashtag yang sama dengan daftar ini ditandai supaya tidak dipakai berulang-ulang.'));
    root.appendChild(T.row(T.btn('Buat Hashtag', proses, true)));
    root.appendChild(out);
}
