import { h as T, kv, money } from '../../core.js';

// Kalkulator waris Islam (faraidh) — SIMULASI SEDERHANA, BUKAN fatwa.
// Aturan yang dipakai (Kompilasi Hukum Islam, Inpres 1/1991, Buku II;
// diverifikasi 20 Nov 2026 dari teks KHI dan panduan faraidh):
// - Pasangan: suami 1/2 (tanpa anak) / 1/4 (ada anak); istri 1/4 / 1/8.
// - Anak: laki-laki 2x perempuan atas sisa (Pasal 176); bila hanya anak
//   perempuan, aturan baku 1/2 (seorang) / 2/3 (dua atau lebih) BELUM
//   diterapkan di sini — tool ini masih memberi mereka seluruh sisa
//   (penyederhanaan lama, dicatat sebagai utang; lihat laporan U5).
// - Ayah: 1/6 bila ada anak; bila tidak ada anak, 1/6 + sisa (asabah).
//   CATATAN KEJUJURAN (Q5 v6.21.0, verifikasi teks KHI 20 Nov 2026):
//   Pasal 177 KHI harfiah berbunyi "Ayah mendapat sepertiga bagian bila
//   pewaris tidak meninggalkan anak" — tool ini memakai doktrin klasik
//   jumhur (ayah = asabah bila tanpa anak, sesuai QS An-Nisa 11), BUKAN
//   1/3 harfiah KHI. Perbedaan ini sudah dibahas di literatur (mis.
//   skripsi UIN Walisongo 2016: hakim PA Kendal cenderung mengikuti KHI
//   177 sebagai pedoman, sementara jumhur memakai asabah). Keputusan
//   mana yang dipakai tool adalah keputusan koordinator/owner — JANGAN
//   ubah angka ini sepihak; bila diputuskan mengikuti KHI 177 harfiah,
//   radd (Pasal 193) harus ikut diterapkan agar totalnya konsisten.
// - Kakek/nenek: KHI hanya mencantumkan keduanya sebagai kelompok ahli
//   waris (Pasal 174) tanpa menetapkan besar bagiannya — angka 1/6 di
//   sini dari doktrin klasik (kakek menggantikan ayah; nenek 1/6 bila
//   ibu tiada, HR Abu Dawud/Tirmidzi), bukan dari pasal KHI.
// - Ibu: 1/6 bila ada anak ATAU dua saudara atau lebih; bila tidak,
//   1/3 (Pasal 178 ayat 1). Pengecualian "1/3 dari sisa" bila bersama
//   ayah + pasangan (Pasal 178 ayat 2) BELUM diterapkan (utang).
// - Kakek: menggantikan ayah bila ayah sudah tiada (1/6 bila ada anak,
//   1/6 + sisa bila tidak). Bila kakek bersama saudara kandung/seayah,
//   pembagiannya diperselisihkan ulama (KHI tidak mengaturnya) — tool
//   ini TIDAK menghitung kombinasi itu dan menampilkan peringatan.
// - Nenek: 1/6 bila ibu sudah tiada; terhalang bila ibu masih hidup
//   (HR. Abu Dawud dan Tirmidzi).
// - Saudara (hanya bila pewaris tidak punya anak DAN ayah sudah tiada
//   = kalalah, Pasal 181-182): seibu 1/6 (seorang) / 1/3 bersama (dua
//   atau lebih); saudari kandung/seayah 1/2 (seorang) / 2/3 bersama
//   (dua atau lebih); bila ada saudara laki-laki kandung/seayah, mereka
//   berbagi sisa 2:1. Bila hanya ada anak perempuan, saudara bisa jadi
//   asabah menurut sebagian pendapat — kasus itu TIDAK dihitung di sini.
// - Wasiat: diambil SEBELUM pembagian, maksimal 1/3 harta (Pasal 195
//   ayat 2); di atas 1/3 hanya sah bila semua ahli waris setuju.
// - Bila total bagian tetap melebihi harta (kasus 'aul, Pasal 192),
//   tool ini TIDAK menghitung dan menampilkan peringatan.
// Urutan sebelum pembagian yang benar: harta gono-gini dipisah, lalu
// biaya pemakaman, lalu utang, lalu wasiat — tool ini hanya memodelkan
// wasiat; masukkan harta BERSIH (setelah utang dan biaya) di atas.
export function hitungWaris(o) {
  const harta = Math.max(0, Number(o && o.harta) || 0);
  const wasiat = Math.max(0, Math.min(harta, Number(o && o.wasiat) || 0));
  const wasiatLebih = harta > 0 && wasiat > harta / 3;
  const bersih = harta - wasiat;
  const nL = Math.max(0, Math.floor(Number(o && o.anakL) || 0));
  const nP = Math.max(0, Math.floor(Number(o && o.anakP) || 0));
  const adaAnak = (nL + nP) > 0;
  const adaAyah = !!(o && o.ayah);
  const adaIbu = !!(o && o.ibu);
  const adaKakek = !!(o && o.kakek) && !adaAyah;
  const adaNenek = !!(o && o.nenek) && !adaIbu;
  const sL = Math.max(0, Math.floor(Number(o && o.saudaraL) || 0));
  const sP = Math.max(0, Math.floor(Number(o && o.saudaraP) || 0));
  const sIbu = Math.max(0, Math.floor(Number(o && o.saudaraSeibu) || 0));
  const jmlSaudara = sL + sP + sIbu;
  const kalalah = !adaAnak && !adaAyah;
  const pas = (o && o.pasangan) || 'none';

  const catatan = [];
  if (o && o.kakek && adaAyah) catatan.push('Kakek terhalang karena ayah pewaris masih hidup.');
  if (o && o.nenek && adaIbu) catatan.push('Nenek terhalang karena ibu pewaris masih hidup.');
  if (jmlSaudara > 0 && !kalalah) catatan.push('Saudara tidak mendapat bagian karena pewaris meninggalkan anak atau ayah masih hidup (terhalang).');
  if (nP > 0 && nL === 0 && (sL + sP) > 0) catatan.push('Bila hanya ada anak perempuan, saudara bisa mendapat sisa menurut sebagian pendapat — kasus itu tidak dihitung di sini, tanyakan ke Pengadilan Agama.');

  // Kakek + saudara kandung/seayah: diperselisihkan, jangan dihitung.
  if (adaKakek && (sL + sP) > 0) {
    return { harta, wasiat, wasiatLebih, bersih, rows: [], catatan, blok: 'kakek-saudara' };
  }

  const rows = [];
  let tetap = 0;
  const tambah = (label, fr, frac, extra) => {
    rows.push(Object.assign({ label, fr, frac }, extra || {}));
    tetap += frac;
  };
  if (pas === 'suami') tambah('Suami', adaAnak ? '1/4' : '1/2', adaAnak ? 1 / 4 : 1 / 2);
  if (pas === 'istri') tambah('Istri', adaAnak ? '1/8' : '1/4', adaAnak ? 1 / 8 : 1 / 4);
  if (adaIbu) {
    const f = (adaAnak || jmlSaudara >= 2) ? 1 / 6 : 1 / 3;
    tambah('Ibu', (adaAnak || jmlSaudara >= 2) ? '1/6' : '1/3', f);
  }
  if (adaAyah) tambah('Ayah', adaAnak ? '1/6' : '1/6 + sisa', 1 / 6);
  if (adaKakek) tambah('Kakek (menggantikan ayah)', adaAnak ? '1/6' : '1/6 + sisa', 1 / 6);
  if (adaNenek) tambah('Nenek', '1/6', 1 / 6);

  if (kalalah) {
    if (sIbu === 1) tambah('Saudara seibu × 1', '1/6', 1 / 6);
    else if (sIbu >= 2) tambah('Saudara seibu × ' + sIbu, '1/3 bersama', 1 / 3, { per: (1 / 3) / sIbu, n: sIbu });
    if (sL === 0 && sP === 1) tambah('Saudara perempuan kandung/seayah', '1/2', 1 / 2);
    else if (sL === 0 && sP >= 2) tambah('Saudara perempuan kandung/seayah × ' + sP, '2/3 bersama', 2 / 3, { per: (2 / 3) / sP, n: sP });
  }

  // Total bagian tetap melebihi harta = kasus 'aul (KHI Pasal 192):
  // butuh penyesuaian proporsional oleh ahli — jangan karang angkanya.
  if (tetap > 1 + 0.0000001) {
    return { harta, wasiat, wasiatLebih, bersih, rows, catatan, blok: 'aul' };
  }

  const sisa = Math.max(0, 1 - tetap);
  if (adaAnak) {
    const unit = sisa / (2 * nL + nP);
    if (nL > 0) rows.push({ label: 'Anak laki-laki × ' + nL, fr: 'sisa ÷ 2:1', frac: 2 * nL * unit, per: 2 * unit, n: nL });
    if (nP > 0) rows.push({ label: 'Anak perempuan × ' + nP, fr: 'sisa ÷ 2:1', frac: nP * unit, per: unit, n: nP });
  } else if ((adaAyah || adaKakek) && sisa > 0) {
    // Ayah/kakek juga sebagai asabah: ambil sisa.
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].label === 'Ayah' || rows[i].label.indexOf('Kakek') === 0) { rows[i].frac += sisa; break; }
    }
  } else if (kalalah && sL > 0 && sisa > 0) {
    // Saudara kandung/seayah sebagai asabah, laki-laki 2x perempuan.
    const unit = sisa / (2 * sL + sP);
    rows.push({ label: 'Saudara laki-laki kandung/seayah × ' + sL, fr: 'sisa ÷ 2:1', frac: 2 * sL * unit, per: 2 * unit, n: sL });
    if (sP > 0) rows.push({ label: 'Saudara perempuan kandung/seayah × ' + sP, fr: 'sisa ÷ 2:1', frac: sP * unit, per: unit, n: sP });
  } else if (sisa > 0.0000001 && rows.length > 0) {
    rows.push({ label: 'Residu', fr: 'perlu penetapan', frac: sisa, residu: true });
  }

  return { harta, wasiat, wasiatLebih, bersih, rows, catatan, blok: null };
}

export const meta = {"id": "hitung-waris", "name": "Kalkulator Waris Islam", "cat": "indonesia", "icon": "🕌", "desc": "Simulasi pembagian waris (faraidh) sederhana.", "keywords": "waris,islam,faraidh,harta,ahli waris"};
export function render(root) {
  const harta = T.input('number', 'cth: 1000000000', '');
  const wasiatI = money(null, 'cth: 0', '0');
  const pasSel = T.select([['none', 'Tidak ada'], ['suami', 'Suami'], ['istri', 'Istri']], 'none');
  const anakL = T.input('number', '0', '0');
  const anakP = T.input('number', '0', '0');
  const ayahChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Ayah (masih hidup)</label>');
  const ibuChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Ibu (masih hidup)</label>');
  const kakekChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Kakek dari ayah (masih hidup)</label>');
  const nenekChk = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox"> Nenek (masih hidup)</label>');
  const saudaraL = T.input('number', '0', '0');
  const saudaraP = T.input('number', '0', '0');
  const saudaraSeibu = T.input('number', '0', '0');
  const box = T.out();

  const pct = (v) => String(v.toFixed(1)).replace('.', ',') + '%';

  const hitung = () => {
    const total = T.num(harta.value);
    if (!(total > 0)) { T.hide(box); return; }
    const r = hitungWaris({
      harta: total,
      wasiat: T.num(wasiatI.value),
      pasangan: pasSel.value,
      anakL: T.num(anakL.value), anakP: T.num(anakP.value),
      ayah: ayahChk.querySelector('input').checked,
      ibu: ibuChk.querySelector('input').checked,
      kakek: kakekChk.querySelector('input').checked,
      nenek: nenekChk.querySelector('input').checked,
      saudaraL: T.num(saudaraL.value), saudaraP: T.num(saudaraP.value),
      saudaraSeibu: T.num(saudaraSeibu.value),
    });

    if (r.blok === 'kakek-saudara') {
      T.show(box, '<div class="warn">Kakek yang bersama saudara kandung/seayah pembagiannya diperselisihkan ulama dan tidak diatur KHI — alat ini tidak menghitung kombinasi itu. Tanyakan ke ulama atau Pengadilan Agama.</div>');
      return;
    }
    if (r.blok === 'aul') {
      T.show(box, '<div class="warn">Total bagian tetap ahli waris ini melebihi harta (kasus \'aul). Bagiannya harus disesuaikan proporsional oleh ahli — alat ini tidak menghitungnya. Tanyakan ke Pengadilan Agama.</div>');
      return;
    }
    if (r.rows.length === 0) {
      T.show(box, '<p class="warn">Pilih dulu ahli warisnya (pasangan / anak / orang tua / kakek-nenek / saudara).</p>');
      return;
    }

    const rows = r.rows;
    // normalisasi persen agar total = 100%
    const raw = rows.map((x) => x.frac * 100);
    const rounded = raw.map((v) => Math.round(v * 10) / 10);
    let diff = Math.round((100 - rounded.reduce((a, b) => a + b, 0)) * 10) / 10;
    let bigIdx = 0;
    rows.forEach((x, i) => { if (raw[i] > raw[bigIdx]) bigIdx = i; });
    rounded[bigIdx] = Math.round((rounded[bigIdx] + diff) * 10) / 10;

    let html = '';
    if (r.wasiat > 0) {
      html += kv('Wasiat (diambil dulu, sebelum dibagi)', T.rp(r.wasiat)) +
        (r.wasiatLebih
          ? '<p class="warn">Wasiat ini lebih dari 1/3 harta (' + T.rp(Math.floor(r.harta / 3)) + '). Menurut KHI Pasal 195, wasiat di atas 1/3 hanya sah bila semua ahli waris menyetujui.</p>'
          : '');
    }
    html += '<table class="tbl"><tr><th>Ahli waris</th><th>Bagian</th><th style="text-align:right">%</th><th style="text-align:right">Nominal</th></tr>';
    rows.forEach((x, i) => {
      const nominal = x.frac * r.bersih;
      const per = x.per ? '<div class="mut" style="font-size:12px">' + T.rp(x.per * r.bersih) + '/orang</div>' : '';
      html += '<tr' + (x.residu ? ' class="warn"' : '') + '><td>' + T.esc(x.label) + '<div class="mut" style="font-size:12px">' + T.esc(x.fr) + '</div></td>' +
        '<td style="text-align:right">' + pct(rounded[i]) + '</td>' +
        '<td style="text-align:right"><b>' + T.rp(nominal) + '</b>' + per + '</td></tr>';
    });
    html += '</table>';
    html += kv('Total harta', '<b>' + T.rp(r.harta) + '</b>') +
      (r.wasiat > 0 ? kv('Harta yang dibagi (setelah wasiat)', '<b>' + T.rp(r.bersih) + '</b>') : '') +
      kv('Total bagian', '<span class="ok"><b>100,0%</b></span>');
    if (r.catatan.length) {
      html += '<p class="hint">' + r.catatan.map(T.esc).join(' ') + '</p>';
    }
    html += '<p class="hint">Estimasi/penyederhanaan, bukan ketentuan resmi. <b>Ini BUKAN fatwa</b> — waris punya banyak kondisi khusus (hamil, utang, harta bersama, ahli waris pengganti, dsb.). Masukkan harta bersih setelah utang dan biaya pemakaman. Aturan di sini mengikuti Kompilasi Hukum Islam Buku II (Pasal 176–178, 181–182, 195). Untuk kasus nyata, konsultasikan ke ulama atau Pengadilan Agama.</p>';
    T.show(box, html);
  };

  [pasSel, anakL, anakP, saudaraL, saudaraP, saudaraSeibu, wasiatI].forEach((elm) => elm.addEventListener('input', hitung));
  [ayahChk, ibuChk, kakekChk, nenekChk].forEach((c) => c.querySelector('input').addEventListener('change', hitung));

  root.appendChild(T.field('Total harta (Rp)', harta, 'Harta bersih pewaris — setelah utang dan biaya pemakaman'));
  root.appendChild(T.field('Wasiat (Rp, bila ada)', wasiatI, 'Maksimal 1/3 harta (KHI Pasal 195). Diambil sebelum pembagian.'));
  root.appendChild(T.field('Pasangan pewaris', pasSel));
  root.appendChild(T.grid2(
    T.field('Anak laki-laki', anakL),
    T.field('Anak perempuan', anakP)
  ));
  root.appendChild(ayahChk);
  root.appendChild(ibuChk);
  root.appendChild(kakekChk);
  root.appendChild(nenekChk);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Saudara pewaris</p>'));
  root.appendChild(T.el('<p class="hint" style="margin-top:0">Saudara hanya mendapat bagian bila pewaris tidak punya anak dan ayah sudah tiada (kalalah, KHI Pasal 181–182).</p>'));
  root.appendChild(T.grid2(
    T.field('Saudara kandung/seayah laki-laki', saudaraL),
    T.field('Saudara kandung/seayah perempuan', saudaraP)
  ));
  root.appendChild(T.field('Saudara seibu (satu ibu, beda ayah)', saudaraSeibu));
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
}
