import { h as T, kv, utils } from '../../core.js';

/* Dibuat agar bisa diuji langsung dari node (tanpa DOM). */
export function topikKeTag(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/\s/g, '');
}

const POLA = [
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

export const GENERIK = ['fyp', 'fypindonesia', 'beranda', 'viral', 'trending', 'reelsindonesia', 'tiktokindonesia',
  'explorepage', 'foryoupage', 'reels', 'tiktokviral', 'viralindonesia', 'indonesiaku'];

export function polaDariTopik(topik) {
  const t = topikKeTag(topik);
  if (!t) return [];
  const out = [];
  POLA.forEach((p) => { const h = '#' + p(t); if (out.indexOf(h) === -1) out.push(h); });
  return out;
}

export function buatHashtag(input, jumlah) {
  const topik = topikKeTag(input);
  if (!topik) return [];
  const maks = Math.max(5, Math.min(30, Math.round(Number(jumlah) || 15)));
  const list = polaDariTopik(topik);
  GENERIK.forEach((g) => { const h = '#' + g; if (list.indexOf(h) === -1) list.push(h); });
  return list.slice(0, maks);
}

/* Bank hashtag kurasi per niche — tagar yang memang ramai dipakai di Indonesia
   (20 per niche, tanpa tanda #). Dipilih dari pola pemakaian umum di Instagram
   & TikTok Indonesia; bukan hasil tebakan mesin. */
export const BANK_NICHE = {
  kuliner: ['kulinerindonesia', 'kulinerjakarta', 'makanenak', 'jajanankekinian', 'kulinerviral', 'makanmakan', 'foodieindonesia', 'kulineran', 'resepmasakan', 'makananhits', 'kulinerbandung', 'jajananpasar', 'foodbloggerindonesia', 'kulinermalang', 'streetfoodindonesia', 'makanmurah', 'kulinersurabaya', 'dessertindonesia', 'kopinusantara', 'wisatakuliner'],
  fashion: ['ootdindonesia', 'fashionindonesia', 'outfitkekinian', 'hijabfashion', 'ootdhijab', 'fashionstyle', 'bajukekinian', 'thriftindonesia', 'localbrandindonesia', 'fashionwanita', 'ootdkece', 'gayakekinian', 'fashionpria', 'sepatukekinian', 'mixandmatch', 'fashiondaily', 'bajumurah', 'ootdinspiration', 'streetstyleindonesia', 'fashionmuslimah'],
  gaming: ['gamingindonesia', 'mobilelegends', 'freefireindonesia', 'pubgmobile', 'gamerindonesia', 'valorantindonesia', 'genshinimpactindonesia', 'gameonline', 'esportsindonesia', 'gameplayindonesia', 'mabar', 'gamingcommunity', 'mobilegaming', 'gamertiktok', 'gameviral', 'dota2indonesia', 'robloxindonesia', 'minecraftindonesia', 'gamingsetup', 'proplayer'],
  edukasi: ['belajaronline', 'edukasiindonesia', 'tipsbelajar', 'belajarbareng', 'infopendidikan', 'belajarbahasainggris', 'studytips', 'anaksekolah', 'belajardirumah', 'pendidikanindonesia', 'lesprivat', 'belajarmatematika', 'tipsutbk', 'beasiswaindonesia', 'studygramindonesia', 'belajarcoding', 'literasiindonesia', 'guruindonesia', 'belajarsains', 'belajaranak'],
  travel: ['travelingindonesia', 'wisatabandung', 'exploreindonesia', 'jalanjalan', 'liburanmurah', 'wisatabali', 'travelgramindonesia', 'pendakiindonesia', 'pantaiindonesia', 'liburanseru', 'triphemat', 'explorebali', 'travelingmurah', 'indonesiatravel', 'wisatajogja', 'backpackerindonesia', 'liburanbali', 'jelajahindonesia', 'wisataalam', 'pesonaindonesia'],
  kecantikan: ['skincareindonesia', 'beautyindonesia', 'makeupnatural', 'skincareroutine', 'kecantikanalami', 'makeuptutorial', 'beautytips', 'skincareviral', 'perawatankulit', 'makeupindonesia', 'beautybloggerindonesia', 'skincarelokal', 'wajahglowing', 'makeupwisuda', 'perawatandiri', 'kecantikanwanita', 'serumwajah', 'skincarebpom', 'glowingskincare', 'makeupseharihari'],
  otomotif: ['otomotifindonesia', 'modifikasimobil', 'modifikasimotor', 'mobilbekas', 'motorindonesia', 'pecintamotor', 'balapmotor', 'mobilkekinian', 'otomotifviral', 'aksesorismobil', 'variasimotor', 'mobillistrik', 'motorlistrik', 'touringindonesia', 'komunitasmotor', 'reviewmobil', 'reviewmotor', 'jualbelimobil', 'sparepartmotor', 'otomotifzone'],
  parenting: ['parentingindonesia', 'ibudananak', 'tumbuhkembanganak', 'mpasi', 'ibuhebat', 'parentingtips', 'keluargabahagia', 'anaksehat', 'mendidikanak', 'tipsibu', 'kehamilansehat', 'bundahebat', 'anakpintar', 'mainananak', 'asiekslusif', 'ibubaru', 'bayisehat', 'keluargaindonesia', 'parentingislami', 'toddlerindonesia'],
  musik: ['musikindonesia', 'coverlagu', 'musisiindonesia', 'lagubaru', 'indieindonesia', 'dangdutkoplo', 'musikviral', 'bandindonesia', 'penyanyiindonesia', 'lagugalau', 'musiklive', 'konserindonesia', 'gitarcover', 'pianocover', 'rapindonesia', 'musiktradisional', 'laguanak', 'djindonesia', 'laguterbaru', 'musikhits'],
  olahraga: ['olahragaindonesia', 'laripagi', 'gymindonesia', 'sehatindonesia', 'fitnessindonesia', 'sepakbolaindonesia', 'bulutangkis', 'workoutroutine', 'hidupsehat', 'lariindonesia', 'sepedaan', 'renangindonesia', 'yogaindonesia', 'badmintonindonesia', 'vollyindonesia', 'sehatbugar', 'olahragadirumah', 'dietsehat', 'polahidupsehat', 'futsalindonesia'],
};

export const NICHE_LABEL = {
  kuliner: 'Kuliner & Jajanan', fashion: 'Fashion & OOTD', gaming: 'Gaming',
  edukasi: 'Edukasi & Belajar', travel: 'Travel & Wisata', kecantikan: 'Kecantikan & Skincare',
  otomotif: 'Otomotif', parenting: 'Parenting & Keluarga', musik: 'Musik',
  olahraga: 'Olahraga & Sehat',
};

/* Hashtag yang DILAPORKAN dibatasi Instagram — hanya yang muncul di DUA daftar
   publik 2026 sekaligus (Ayrshare, diperbarui 15 Jul 2026, dan Midas Tools,
   awal 2026). Instagram tidak menerbitkan daftar resmi, jadi daftar ini
   bersifat peringatan, bukan vonis mutlak — UI wajib menulis cara mengeceknya. */
export const HASHTAG_DIBATASI = [
  '#adulting', '#alone', '#attractive', '#beautyblogger', '#bikinibody',
  '#brain', '#costumes', '#curvygirls', '#dating', '#desk', '#dm',
  '#dogsofinstagram', '#edm', '#eggplant', '#elevator', '#hardworkpaysoff',
  '#humpday', '#hustler',
];

export function cariDibatasi(daftar) {
  const set = new Set(HASHTAG_DIBATASI);
  return (daftar || []).filter((h) => set.has(String(h).toLowerCase()));
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

export const HASHTAG_LUAS = ['#fyp', '#fypindonesia', '#beranda', '#viral', '#trending',
  '#explorepage', '#foryoupage', '#reels', '#reelsindonesia', '#tiktokindonesia',
  '#tiktokviral', '#viralindonesia', '#indonesiaku', '#explore', '#viralvideo',
  '#trendingnow', '#indonesia', '#reelsviral', '#foryou', '#fypage'];

export const LOKAL_KATA = ['indonesia', 'jakarta', 'bandung', 'surabaya', 'bali',
  'jogja', 'yogya', 'medan', 'malang', 'semarang', 'bogor', 'bekasi', 'depok',
  'tangerang', 'makassar', 'palembang', 'balikpapan', 'lombok', 'nusantara'];

export function tierHashtag(h) {
  const t = String(h).toLowerCase();
  if (HASHTAG_LUAS.indexOf(t) > -1) return 'luas';
  const inti = t.replace(/^#/, '');
  if (LOKAL_KATA.some((k) => inti.indexOf(k) > -1)) return 'lokal';
  return 'niche';
}

export function buatHashtagTier(input, jumlah) {
  const semua = buatHashtag(input, jumlah);
  const out = { luas: [], niche: [], lokal: [] };
  semua.forEach((h) => { out[tierHashtag(h)].push(h); });
  return out;
}

// Multi-topik (maks 3, pisah koma) + niche: campur pola topik, bank niche,
// dan generik secara bergiliran supaya tidak ada satu sumber yang mendominasi.
export function buatHashtagMulti(topikList, jumlah, niche) {
  const topiks = (Array.isArray(topikList) ? topikList : [topikList])
    .map(topikKeTag).filter(Boolean).slice(0, 3);
  if (!topiks.length) return [];
  const maks = Math.max(5, Math.min(30, Math.round(Number(jumlah) || 15)));
  // Pola antar-topik digilir (bukan ditumpuk) supaya semua topik terwakili.
  const polaPerTopik = topiks.map((t) => polaDariTopik(t));
  const pola = [];
  let idx = 0, ada = true;
  while (ada) {
    ada = false;
    for (const arr of polaPerTopik) {
      if (idx < arr.length) {
        ada = true;
        const h = arr[idx];
        if (pola.indexOf(h) === -1) pola.push(h);
      }
    }
    idx++;
  }
  const bank = (niche && BANK_NICHE[niche] ? BANK_NICHE[niche] : []).map((h) => '#' + h);
  const generik = GENERIK.map((h) => '#' + h);
  const sumber = {
    pola: { arr: pola, i: 0 },
    bank: { arr: bank, i: 0 },
    generik: { arr: generik, i: 0 },
  };
  const urutan = bank.length ? ['pola', 'bank', 'pola', 'bank', 'generik'] : ['pola', 'pola', 'generik'];
  const list = [];
  const ambilDari = (kunci) => {
    const s = sumber[kunci];
    while (s.i < s.arr.length) {
      const h = s.arr[s.i++];
      if (list.indexOf(h) === -1) { list.push(h); return true; }
    }
    return false;
  };
  let giliran = 0, mandek = 0;
  while (list.length < maks && mandek < urutan.length * 2) {
    const kunci = urutan[giliran % urutan.length];
    giliran++;
    if (ambilDari(kunci)) mandek = 0;
    else mandek++;
  }
  // Bila masih kurang (semua sumber habis), isi dari sumber mana pun yang tersisa.
  for (const kunci of ['pola', 'bank', 'generik']) {
    while (list.length < maks && ambilDari(kunci)) { /* isi */ }
  }
  return list.slice(0, maks);
}

export function buatHashtagTierMulti(topikList, jumlah, niche) {
  const semua = buatHashtagMulti(topikList, jumlah, niche);
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

export const BATAS_CAPTION_IG = 2200;

export const meta = {"id": "generator-hashtag", "name": "Generator Hashtag", "cat": "teks", "icon": "#️⃣", "desc": "Bikin sampai 30 hashtag siap pakai dari satu topik, per tier luas/niche/lokal.", "keywords": "hashtag,tagar,instagram,tiktok,reels,caption"};

export function render(root) {

    const FAV_KEY = 'at-hashtag-favorit-v1';
    const RIW_KEY = 'at-hashtag-riwayat-v1';
    const bacaLs = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []; } catch (e) { return []; } };
    const tulisLs = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

    const inp = T.input('text', 'Contoh: kopi susu, skincare, jualan baju… (pisah koma, maks 3 topik)');
    const nicheSel = T.select([['', 'Umum (tanpa niche)']].concat(Object.keys(BANK_NICHE).map((k) => [k, NICHE_LABEL[k]])), '');
    const jumlahSel = T.select([['15', '15 hashtag'], ['20', '20 hashtag'], ['30', '30 hashtag (maksimal Instagram)']], '15');
    const fPakai = T.ta(2, 'Tempel hashtag yang sudah pernah dipakai, misal: #kopi #fyp (opsional)');
    const fCaption = T.ta(3, 'Tempel caption-mu di sini (opsional) untuk cek total panjangnya…');
    const out = T.out();
    const favBox = T.out();
    let daftar = [];
    let dipakai = new Set();
    let topikAktif = [];

    function chip(h, duplikat, dibatasi) {
      const warna = dibatasi ? 'border-color:var(--err);color:var(--err)' : duplikat ? 'border-color:var(--warn);color:var(--warn)' : '';
      const label = dibatasi ? ' · dibatasi?' : duplikat ? ' · dipakai' : '';
      const c = T.el('<button type="button" class="btn small" style="border-radius:999px' + (warna ? ';' + warna : '') + '">' + T.esc(h) + label + '</button>');
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
      const tier = { luas: [], niche: [], lokal: [] };
      daftar.forEach((h) => { tier[tierHashtag(h)].push(h); });
      const dup = cariDuplikat(daftar, dipakai);
      const dibatasi = cariDibatasi(daftar);
      const campur = campuranHashtag(tier);
      const box = T.el('<div></div>');
      box.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin-bottom:8px">' + daftar.length + ' hashtag · ' + tier.luas.length + ' luas · ' + tier.niche.length + ' niche · ' + tier.lokal.length + ' lokal' + (dup.length ? ' · <span style="color:var(--warn)">' + dup.length + ' sudah pernah dipakai</span>' : '') + (dibatasi.length ? ' · <span style="color:var(--err)">' + dibatasi.length + ' dilaporkan dibatasi</span>' : '') + '</div>'));
      if (dibatasi.length) {
        box.appendChild(T.el('<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.4);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;margin-bottom:12px"><b style="color:#fca5a5">Hati-hati: ' + dibatasi.map(T.esc).join(', ') + ' dilaporkan dibatasi di Instagram.</b><br>Postingan yang memakai tagar dibatasi bisa tidak muncul di pencarian tagar. Daftar ini dari daftar publik Juli 2026 (Ayrshare & Midas Tools) — Instagram tidak menerbitkan daftar resmi, jadi cek sendiri: cari tagarnya di Instagram, bila muncul pesan “postingan terbaru disembunyikan”, tagar itu memang dibatasi.</div>'));
      }
      [['luas', 'Luas (jangkauan besar)'], ['niche', 'Niche (sesuai topik)'], ['lokal', 'Lokal (Indonesia)']].forEach(([k, label]) => {
        if (!tier[k].length) return;
        const sec = T.el('<div style="margin-bottom:12px"></div>');
        sec.appendChild(T.el('<div class="hint" style="margin-bottom:6px">' + label + ' (' + tier[k].length + ')</div>'));
        const chips = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px"></div>');
        tier[k].forEach((h) => chips.appendChild(chip(h, dipakai.has(h.toLowerCase()), dibatasi.indexOf(h.toLowerCase()) > -1)));
        sec.appendChild(chips);
        box.appendChild(sec);
      });
      // Hitung panjang caption + hashtag
      const blokTag = daftar.join(' ');
      const cap = fCaption.value.trim();
      const total = cap ? cap.length + 1 + blokTag.length : blokTag.length;
      const muat = total <= BATAS_CAPTION_IG;
      box.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:12px 0 4px">Panjang caption</div>'));
      box.appendChild(T.el('<div class="kv"><span>Hashtag saja</span><b>' + blokTag.length + ' karakter</b></div>'));
      if (cap) box.appendChild(T.el('<div class="kv"><span>Caption + hashtag</span><b style="color:' + (muat ? 'var(--ok)' : 'var(--err)') + '">' + total + ' / ' + BATAS_CAPTION_IG + ' karakter ' + (muat ? '· muat' : '· kelebihan ' + (total - BATAS_CAPTION_IG) + ' karakter') + '</b></div>'));
      else box.appendChild(T.el('<p class="hint">Tempel caption-mu di kolom bawah untuk cek totalnya (batas Instagram ' + BATAS_CAPTION_IG + ' karakter).</p>'));
      box.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:12px 0 4px">Batas tiap platform</div>'));
      BATAS_HASHTAG.forEach(([nama, batas, ket]) => {
        const ok = batas == null || daftar.length <= batas;
        const row = T.el('<div class="kv"><span>' + T.esc(nama) + ' (' + T.esc(ket) + ')</span><b style="color:' + (ok ? 'var(--ok)' : 'var(--err)') + '">' + (batas == null ? 'Aman' : daftar.length + ' / ' + batas + (ok ? '' : ' · kelebihan')) + '</b></div>');
        box.appendChild(row);
      });
      T.show(out, '');
      out.appendChild(box);
      out.appendChild(T.row(
        T.copyBtn(() => daftar.join(' '), 'Salin Semua'),
        T.copyBtn(() => daftar.join('\n'), 'Per Baris')
      ));
      const tierRow = T.row(
        T.copyBtn(() => tier.luas.join(' '), 'Salin Luas'),
        T.copyBtn(() => tier.niche.join(' '), 'Salin Niche'),
        T.copyBtn(() => tier.lokal.join(' '), 'Salin Lokal'),
        T.copyBtn(() => campur.join(' '), 'Campuran')
      );
      tierRow.style.marginTop = '8px';
      out.appendChild(tierRow);
      out.appendChild(T.el('<p class="hint">Campuran = 3 luas + 5 niche + 2 lokal, porsi yang paling sering disarankan buat satu postingan.</p>'));
      out.appendChild(T.row(
        T.btn('⭐ Simpan set ini ke favorit', () => {
          const fav = bacaLs(FAV_KEY);
          const nama = (topikAktif.join(' + ') || 'tanpa topik') + (nicheSel.value ? ' · ' + NICHE_LABEL[nicheSel.value] : '');
          fav.unshift({ nama, daftar: daftar.slice(), t: Date.now() });
          tulisLs(FAV_KEY, fav.slice(0, 20));
          T.toast('Set disimpan ke favorit');
          gambarFav();
        })
      ));
    }

    function gambarFav() {
      const fav = bacaLs(FAV_KEY);
      const riw = bacaLs(RIW_KEY);
      if (!fav.length && !riw.length) { T.hide(favBox); return; }
      T.show(favBox, '');
      if (fav.length) {
        favBox.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:16px 0 6px">⭐ Set favorit (' + fav.length + ')</div>'));
        fav.forEach((f, i) => {
          const row = T.el('<div style="display:flex;gap:8px;align-items:center;border:1px solid #ffffff14;border-radius:8px;padding:8px 10px;margin-bottom:6px"></div>');
          row.appendChild(T.el('<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.nama) + '</div><div class="dim" style="font-size:12px">' + (f.daftar || []).length + ' hashtag · ' + new Date(f.t).toLocaleDateString('id-ID') + '</div></div>'));
          const bMuat = T.btn('Pakai', () => {
            daftar = (f.daftar || []).slice();
            topikAktif = [];
            gambar();
            T.toast('Set favorit dimuat');
          });
          const bHapus = T.btn('✕', () => {
            const semua = bacaLs(FAV_KEY);
            semua.splice(i, 1);
            tulisLs(FAV_KEY, semua);
            gambarFav();
          });
          row.appendChild(bMuat);
          row.appendChild(bHapus);
          favBox.appendChild(row);
        });
      }
      if (riw.length) {
        favBox.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:12px 0 6px">Terakhir dibuat</div>'));
        riw.slice(0, 5).forEach((r) => {
          const row = T.el('<div style="display:flex;gap:8px;align-items:center;border:1px solid #ffffff14;border-radius:8px;padding:8px 10px;margin-bottom:6px"></div>');
          row.appendChild(T.el('<div style="flex:1;min-width:0"><div style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(r.nama) + '</div><div class="dim" style="font-size:12px">' + (r.daftar || []).length + ' hashtag</div></div>'));
          row.appendChild(T.btn('Pakai', () => { daftar = (r.daftar || []).slice(); gambar(); }));
          favBox.appendChild(row);
        });
      }
    }

    const proses = () => {
      const topiks = inp.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
      topikAktif = topiks;
      daftar = buatHashtagMulti(topiks, jumlahSel.value, nicheSel.value);
      dipakai = parseHashtagPakai(fPakai.value);
      if (!daftar.length) {
        T.show(out, '<span class="err">Tulis topiknya dulu, misal "kopi susu" atau "skincare". Bisa sampai 3 topik, pisah dengan koma.</span>');
        return;
      }
      const riw = bacaLs(RIW_KEY);
      riw.unshift({ nama: topiks.join(' + ') + (nicheSel.value ? ' · ' + NICHE_LABEL[nicheSel.value] : ''), daftar: daftar.slice(), t: Date.now() });
      tulisLs(RIW_KEY, riw.slice(0, 5));
      gambar();
      gambarFav();
    };

    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') proses(); });
    jumlahSel.addEventListener('change', () => { if (daftar.length) proses(); });
    nicheSel.addEventListener('change', () => { if (daftar.length) proses(); });
    fPakai.addEventListener('input', () => { dipakai = parseHashtagPakai(fPakai.value); if (daftar.length) gambar(); });
    fCaption.addEventListener('input', () => { if (daftar.length) gambar(); });
    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ketik sampai 3 topik, pilih niche-mu, langsung dapat hashtag siap pakai: turunan topikmu + hashtag pilihan per niche + hashtag generik yang lagi ramai di Indonesia. Ketuk satu chip buat salin satuan, atau salin semuanya sekaligus.</p>'));
    root.appendChild(T.field('Topik / kata kunci', inp, 'Pisah dengan koma untuk gabung beberapa topik, misal: kopi susu, jualan, anak kos.'));
    root.appendChild(T.field('Niche (bidang)', nicheSel, 'Bank hashtag pilihan per bidang — hasilnya lebih nyambung daripada pola tempel biasa.'));
    root.appendChild(T.field('Jumlah hashtag', jumlahSel, 'Instagram maksimal 30 per postingan. TikTok & X lebih baik sedikit saja.'));
    root.appendChild(T.field('Hashtag yang sudah pernah dipakai (opsional)', fPakai, 'Hashtag yang sama dengan daftar ini ditandai supaya tidak dipakai berulang-ulang.'));
    root.appendChild(T.field('Caption-mu (opsional)', fCaption, 'Untuk cek total panjang caption + hashtag terhadap batas Instagram 2.200 karakter.'));
    root.appendChild(T.row(T.btn('Buat Hashtag', proses, true)));
    root.appendChild(out);
    root.appendChild(favBox);
    gambarFav();
}
