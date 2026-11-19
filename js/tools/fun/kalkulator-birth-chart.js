import { h as T, utils } from '../../core.js';

// Kalkulator Birth Chart (hiburan astrologi, BUKAN sains): posisi
// Matahari, Bulan, 7 planet, rising sign, house (whole-sign), dan aspek.
// Posisi dihitung dengan metode presisi rendah Paul Schlyter (elemen
// orbit + penyelesaian Kepler + koreksi Bulan). Akurasi sekitar
// 0,1-0,3 derajat untuk planet, cukup untuk menentukan zodiak kecuali
// planetnya pas di perbatasan dua zodiak (diberi catatan di UI).
// CATATAN EPOCH: tabel elemen Schlyter memakai hitungan hari d=0 pada
// 30 Des 1999 (1,5 hari sebelum J2000.0). Dicek silang: selisih 1,5 hari
// menjelaskan persis perbedaan M Merkurius (6,14 deg), Venus (2,4 deg),
// Mars (0,79 deg), Bumi (1,48 deg), dan Bulan (19,6 deg) terhadap nilai
// standar J2000. Jadi d_schlyter = d_J2000 + 1,5. Rumus D/F/Ms/Mm untuk
// koreksi Bulan memakai d_J2000 langsung (nilai J2000 standar).
export const meta = {"id": "kalkulator-birth-chart", "name": "Kalkulator Birth Chart", "cat": "fun", "icon": "🌌", "desc": "Peta kelahiranmu: Sun, Moon, rising sign, planet di tiap house, dan aspeknya. Hiburan astrologi, bukan ramalan ilmiah.", "keywords": "birth chart,peta kelahiran,zodiak,astrologi,sun sign,moon sign,rising,horoskop", "since": "6.19.0"};

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;

// [N, dN, i, di, w, dw, a, da, e, de, M, dM] per hari (Schlyter).
const PLANET = {
  merkurius: [48.3313, 3.24587e-5, 7.0047, 5.0e-8, 29.1241, 1.01444e-5, 0.387098, 0, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
  venus: [76.6799, 2.46590e-5, 3.3946, 2.75e-8, 54.8910, 1.38374e-5, 0.723330, 0, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
  bumi: [0, 0, 0, 0, 282.9404, 4.70935e-5, 1.0, 0, 0.016709, -1.151e-9, 356.0470, 0.9856002585],
  mars: [49.5574, 2.11081e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
  jupiter: [100.4542, 2.76854e-5, 1.3030, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0, 0.048498, 4.469e-9, 19.8950, 0.0830853001],
  saturnus: [113.6634, 2.38980e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0, 0.055546, -9.499e-9, 316.9670, 0.0334442282],
  uranus: [74.0005, 1.3978e-5, 0.7733, 1.9e-8, 96.6612, 3.0565e-5, 19.18171, -1.55e-8, 0.047318, 7.45e-9, 142.5905, 0.011725806],
  neptunus: [131.7806, 3.0173e-5, 1.7700, 2.55e-7, 273.1870, -6.1223e-6, 30.05826, 3.313e-8, 0.008606, 2.15e-9, 259.9180, 0.005995147],
};
const BULAN_EL = [125.1228, -0.0529538083, 5.1454, 0, 318.0634, 0.1643573223, 60.2666, 0, 0.054900, 0, 115.3654, 13.0649929509];

export const ZODIAK = [
  { nama: 'Aries', ikon: '♈' }, { nama: 'Taurus', ikon: '♉' },
  { nama: 'Gemini', ikon: '♊' }, { nama: 'Cancer', ikon: '♋' },
  { nama: 'Leo', ikon: '♌' }, { nama: 'Virgo', ikon: '♍' },
  { nama: 'Libra', ikon: '♎' }, { nama: 'Scorpio', ikon: '♏' },
  { nama: 'Sagitarius', ikon: '♐' }, { nama: 'Capricorn', ikon: '♑' },
  { nama: 'Aquarius', ikon: '♒' }, { nama: 'Pisces', ikon: '♓' },
];

export const KOTA = [
  ['Jakarta', -6.2, 106.85], ['Surabaya', -7.25, 112.75],
  ['Bandung', -6.9, 107.6], ['Medan', 3.6, 98.67],
  ['Makassar', -5.15, 119.4], ['Denpasar', -8.65, 115.22],
  ['Yogyakarta', -7.8, 110.37], ['Semarang', -7.0, 110.42],
  ['Palembang', -2.99, 104.76], ['Balikpapan', -1.24, 116.83],
  ['Padang', -0.95, 100.35], ['Pekanbaru', 0.51, 101.44],
  ['Bandar Lampung', -5.43, 105.27], ['Malang', -7.98, 112.63],
  ['Pontianak', -0.03, 109.34], ['Banjarmasin', -3.32, 114.59],
  ['Manado', 1.49, 124.84], ['Jayapura', -2.53, 140.72],
];

// Zodiak dari bujur ekliptika (0-360). Murni.
export function zodiakDariBujur(lon) {
  const l = norm360(lon);
  return { idx: Math.floor(l / 30), derajat: l % 30 };
}
export function namaZodiak(lon) {
  return ZODIAK[zodiakDariBujur(lon).idx].nama;
}

// Hari sejak J2000.0 (1 Jan 2000 12:00 UTC) dari milidetik UTC.
export function hariJ2000(msUtc) {
  return (msUtc - Date.UTC(2000, 0, 1, 12)) / 86400000;
}

// Posisi heliosentris (x, y, z) dari elemen orbit + d Schlyter.
function posisiOrbit(el, d) {
  const N = (el[0] + el[1] * d) * D2R;
  const i = (el[2] + el[3] * d) * D2R;
  const w = (el[4] + el[5] * d) * D2R;
  const a = el[6] + el[7] * d;
  const e = el[8] + el[9] * d;
  const M = norm360(el[10] + el[11] * d) * D2R;
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 6; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  return {
    x: r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i)),
    y: r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i)),
    z: r * (Math.sin(v + w) * Math.sin(i)),
  };
}

// Bujur geosentris Matahari (derajat) pada ms UTC. Murni.
// Elemen "bumi" Schlyter menggambarkan orbit SEMU Matahari (w = bujur
// perihelion semu 282,94), jadi hasilnya langsung bujur Matahari,
// TANPA tambah 180. Vektornya = vektor Bumi-ke-Matahari; vektor
// heliosentris Bumi adalah kebalikannya.
export function bujurMatahari(msUtc) {
  const d = hariJ2000(msUtc) + 1.5;
  const b = posisiOrbit(PLANET.bumi, d);
  return norm360(Math.atan2(b.y, b.x) * R2D);
}

// Bujur geosentris Bulan (derajat) + koreksi periodik Schlyter.
export function bujurBulan(msUtc) {
  const dJ = hariJ2000(msUtc);
  const d = dJ + 1.5;
  const b = posisiOrbit(BULAN_EL, d);
  let lon = norm360(Math.atan2(b.y, b.x) * R2D);
  const Ms = norm360(357.529 + 0.9856002585 * dJ) * D2R;
  const Mm = norm360(134.9634 + 13.0649929509 * dJ) * D2R;
  const D = norm360(297.85036 + 12.19074912 * dJ) * D2R;
  const F = norm360(93.2720950 + 13.22935032 * dJ) * D2R;
  lon += -1.274 * Math.sin(Mm - 2 * D) + 0.658 * Math.sin(2 * D)
    - 0.186 * Math.sin(Ms) - 0.059 * Math.sin(2 * Mm - 2 * D)
    - 0.057 * Math.sin(Mm - 2 * D + Ms) + 0.053 * Math.sin(Mm + 2 * D)
    + 0.046 * Math.sin(2 * D - Ms) + 0.041 * Math.sin(Mm - Ms)
    - 0.035 * Math.sin(D) - 0.031 * Math.sin(Mm + Ms)
    - 0.015 * Math.sin(2 * F - 2 * D) + 0.011 * Math.sin(Mm - 4 * D);
  return norm360(lon);
}

// Bujur geosentris planet (derajat). Murni.
// Geosentris = heliosentris planet - heliosentris Bumi, dan
// heliosentris Bumi = -(vektor Bumi-ke-Matahari), jadi jumlahkan.
export function bujurPlanet(nama, msUtc) {
  const d = hariJ2000(msUtc) + 1.5;
  const p = posisiOrbit(PLANET[nama], d);
  const b = posisiOrbit(PLANET.bumi, d);
  return norm360(Math.atan2(p.y + b.y, p.x + b.x) * R2D);
}

// Waktu sideris Greenwich (derajat) dari JD.
export function gmstDerajat(msUtc) {
  const jd = msUtc / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000);
}

// Rising sign (derajat bujur ascendant). theta = LST derajat,
// phi = lintang derajat. Murni.
export function ascendant(lstDerajat, lintangDerajat) {
  const th = lstDerajat * D2R;
  const ph = lintangDerajat * D2R;
  const eps = 23.44 * D2R;
  const asc = Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(eps) + Math.tan(ph) * Math.sin(eps)));
  return norm360(asc * R2D);
}

// House whole-sign (1-12) dari bujur planet + bujur ascendant.
export function houseDari(bujurPlanetDeg, bujurAsc) {
  return ((zodiakDariBujur(bujurPlanetDeg).idx - zodiakDariBujur(bujurAsc).idx + 12) % 12) + 1;
}

const ASPEK = [
  { nama: 'Konjungsi', sudut: 0, orb: 8, arti: 'Dua energi menyatu, saling menguatkan.' },
  { nama: 'Sextile', sudut: 60, orb: 6, arti: 'Dua energi gampang kerja sama.' },
  { nama: 'Square', sudut: 90, orb: 8, arti: 'Dua energi saling tarik, bikin gesekan yang memacu tumbuh.' },
  { nama: 'Trine', sudut: 120, orb: 8, arti: 'Dua energi mengalir mulus, bakat alami.' },
  { nama: 'Oposisi', sudut: 180, orb: 8, arti: 'Dua energi berhadapan, perlu keseimbangan.' },
];

// Aspek antar titik {nama, lon}. Murni.
export function cariAspek(titik) {
  const out = [];
  for (let a = 0; a < titik.length; a++) {
    for (let b = a + 1; b < titik.length; b++) {
      let sel = Math.abs(norm360(titik[a].lon - titik[b].lon));
      if (sel > 180) sel = 360 - sel;
      for (const asp of ASPEK) {
        const orb = Math.abs(sel - asp.sudut);
        if (orb <= asp.orb) {
          out.push({ a: titik[a].nama, b: titik[b].nama, nama: asp.nama, orb, arti: asp.arti });
          break;
        }
      }
    }
  }
  return out;
}

const SIFAT = {
  Aries: 'Berani, spontan, dan suka jadi yang pertama mencoba.',
  Taurus: 'Sabar, setia, dan paling bisa menikmati hal-hal enak.',
  Gemini: 'Penasaran, gampang ngobrol, idenya selalu banyak.',
  Cancer: 'Perasa, protektif, dan ingatannya kuat soal orang tersayang.',
  Leo: 'Pede, hangat, dan senang jadi pusat perhatian.',
  Virgo: 'Teliti, rapi, dan suka semua hal beres pada tempatnya.',
  Libra: 'Adil, charming, dan paling susah saat harus memilih.',
  Scorpio: 'Intens, misterius, dan kalau sayang ya sayang beneran.',
  Sagitarius: 'Petualang, jujur, dan omongannya ceplas-ceplos.',
  Capricorn: 'Ambisius, disiplin, dan sabar membangun sedikit demi sedikit.',
  Aquarius: 'Unik, mandiri, dan idenya sering di luar kebiasaan.',
  Pisces: 'Imajinatif, peka, dan gampang ikut merasakan perasaan orang lain.',
};
const RISING = {
  Aries: 'Kesan pertamamu: energik dan langsung to the point.',
  Taurus: 'Kesan pertamamu: tenang, bisa diandalkan, dan santai.',
  Gemini: 'Kesan pertamamu: ramah, cerewet, dan gampang diajak ngobrol.',
  Cancer: 'Kesan pertamamu: hangat, perhatian, dan sedikit pemalu.',
  Leo: 'Kesan pertamamu: percaya diri dan gampang dikenali di keramaian.',
  Virgo: 'Kesan pertamamu: rapi, sopan, dan terlihat bisa diandalkan.',
  Libra: 'Kesan pertamamu: manis, diplomatis, dan enak diajak kerja sama.',
  Scorpio: 'Kesan pertamamu: misterius, tatapannya tajam, susah ditebak.',
  Sagitarius: 'Kesan pertamamu: ceria, terbuka, dan penuh semangat.',
  Capricorn: 'Kesan pertamamu: serius, dewasa, dan terkesan sibuk.',
  Aquarius: 'Kesan pertamamu: unik, cuek, dan punya gayanya sendiri.',
  Pisces: 'Kesan pertamamu: lembut, melamun, dan gampang disukai.',
};
const PLANET_INFO = [
  ['merkurius', 'Merkurius', '☿', 'cara berpikir dan ngobrol'],
  ['venus', 'Venus', '♀', 'soal suka, sayang, dan selera'],
  ['mars', 'Mars', '♂', 'semangat dan cara bertindak'],
  ['jupiter', 'Jupiter', '♃', 'keberuntungan dan hal-hal besar'],
  ['saturnus', 'Saturnus', '♄', 'tanggung jawab dan pelajaran hidup'],
  ['uranus', 'Uranus', '♅', 'perubahan dan hal tak terduga'],
  ['neptunus', 'Neptunus', '♆', 'mimpi dan imajinasi'],
];

function fmtDerajat(v) {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
}

function fmtBujur(lon) {
  const z = zodiakDariBujur(lon);
  const s = ZODIAK[z.idx];
  return s.ikon + ' ' + s.nama + ' ' + fmtDerajat(z.derajat) + '°';
}

export function render(root) {
  const box = T.out();
  const tglI = T.input('date', '');
  const jamI = T.input('time', '');
  const kotaS = T.select(KOTA.map((k) => [k[0], k[0]]).concat([['lain', 'Kota lain (isi lintang/bujur)']]), 'Jakarta');
  const latI = T.input('text', 'cth: -6,2');
  const lngI = T.input('text', 'cth: 106,85');
  const zonaS = T.select([['7', 'WIB (UTC+7)'], ['8', 'WITA (UTC+8)'], ['9', 'WIT (UTC+9)']], '7');
  const latRow = T.el('<div></div>');
  latRow.appendChild(T.field('Lintang kota lahirmu', latI, 'Angka negatif = selatan khatulistiwa.'));
  latRow.appendChild(T.field('Bujur kota lahirmu', lngI, 'Angka positif = timur Greenwich.'));
  latRow.style.display = 'none';

  kotaS.onchange = () => { latRow.style.display = kotaS.value === 'lain' ? '' : 'none'; };

  const hitung = () => {
    if (!tglI.value) { T.toast('Isi dulu tanggal lahirmu'); return; }
    const adaJam = !!jamI.value;
    const jam = adaJam ? jamI.value : '12:00';
    const [th, bl, tg] = tglI.value.split('-').map(Number);
    const [jj, mm] = jam.split(':').map(Number);
    const off = Number(zonaS.value);
    const msUtc = Date.UTC(th, bl - 1, tg, jj - off, mm);
    const sun = bujurMatahari(msUtc);
    const moon = bujurBulan(msUtc);
    const zSun = zodiakDariBujur(sun);
    const zMoon = zodiakDariBujur(moon);

    let asc = null, lat = null, lng = null;
    if (adaJam) {
      if (kotaS.value === 'lain') {
        lat = T.num(latI.value); lng = T.num(lngI.value);
        if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          T.toast('Lintang/bujur tidak valid (lintang -90 sampai 90, bujur -180 sampai 180)');
          return;
        }
      } else {
        const k = KOTA.find((x) => x[0] === kotaS.value);
        lat = k[1]; lng = k[2];
      }
      const lst = norm360(gmstDerajat(msUtc) + lng);
      asc = ascendant(lst, lat);
    }

    let html = '<h3 style="margin-top:6px">Tiga besar</h3>' +
      '<div class="kv"><span class="k">☀️ Sun (diri intimu)</span><span class="v">' + fmtBujur(sun) + '</span></div>' +
      '<p class="hint">' + SIFAT[ZODIAK[zSun.idx].nama] + '</p>' +
      '<div class="kv"><span class="k">🌙 Moon (perasaanmu)</span><span class="v">' + fmtBujur(moon) + '</span></div>' +
      '<p class="hint">' + SIFAT[ZODIAK[zMoon.idx].nama] + '</p>';
    if (asc !== null) {
      const zAsc = zodiakDariBujur(asc);
      html += '<div class="kv"><span class="k">⬆️ Rising (kesan pertamamu)</span><span class="v">' + fmtBujur(asc) + '</span></div>' +
        '<p class="hint">' + RISING[ZODIAK[zAsc.idx].nama] + '</p>';
    } else {
      html += '<p class="hint">Rising sign butuh jam lahir dan kota lahirmu. Isi jam lahir di atas untuk melihatnya.</p>';
    }

    html += '<h3 style="margin-top:14px">Planet-planet</h3>';
    const titik = [{ nama: 'Matahari', lon: sun }, { nama: 'Bulan', lon: moon }];
    for (const [key, nama, ikon, arti] of PLANET_INFO) {
      const lon = bujurPlanet(key, msUtc);
      titik.push({ nama, lon });
      const z = zodiakDariBujur(lon);
      const dekatBatas = z.derajat < 0.5 || z.derajat > 29.5;
      html += '<div class="kv"><span class="k">' + ikon + ' ' + nama + ' <span class="mut">(' + arti + ')</span></span><span class="v">' + fmtBujur(lon) +
        (asc !== null ? ' · House ' + houseDari(lon, asc) : '') + (dekatBatas ? ' <span class="mut">*</span>' : '') + '</span></div>';
    }
    html += '<p class="hint">Tanda * artinya planetnya dekat perbatasan dua zodiak, jadi zodiaknya bisa bergeser karena posisi ini perkiraan.</p>';

    const aspek = cariAspek(titik);
    html += '<h3 style="margin-top:14px">Aspek (' + aspek.length + ')</h3>';
    if (!aspek.length) html += '<p class="hint">Tidak ada aspek besar yang ketemu di antara planet-planetmu.</p>';
    else {
      for (const a of aspek) {
        html += '<div class="kv"><span class="k">' + T.esc(a.a) + ' ' + a.nama + ' ' + T.esc(a.b) + '</span><span class="v">orb ' + fmtDerajat(a.orb) + '°</span></div>' +
          '<p class="hint">' + a.arti + '</p>';
      }
    }
    html += '<p class="hint" style="margin-top:12px">Ini hiburan astrologi: posisi planet dihitung dengan rumus perkiraan (galat sekitar 0,1-0,3 derajat), dan astrologi bukan ilmu yang terbukti. Jangan jadikan patokan keputusan penting.</p>';
    T.show(box, html);
  };

  root.appendChild(T.el('<p class="hint">Isi tanggal lahirmu untuk melihat Sun, Moon, dan planet-planetmu. Tambah jam + kota lahir untuk melihat rising sign dan house. Semua dihitung di HP ini, tidak dikirim ke mana-mana.</p>'));
  root.appendChild(T.field('Tanggal lahir', tglI));
  root.appendChild(T.field('Jam lahir (opsional, untuk rising sign)', jamI, 'Kosongkan kalau tidak tahu jam lahirmu.'));
  root.appendChild(T.field('Kota lahir', kotaS));
  root.appendChild(latRow);
  root.appendChild(T.field('Zona waktu saat lahir', zonaS));
  root.appendChild(T.row(T.btn('Lihat birth chart-ku', hitung, true)));
  root.appendChild(box);
}
