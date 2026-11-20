import { h as T, utils, kv } from '../../core.js';

// Lem untuk dua bahan. Kunci pasangan diurutkan alfabetis ("kayu|logam").
// Rekomendasi mengikuti panduan perekat umum dan praktik pertukangan —
// sumber (dicek 20 Nov 2026):
// - The Glue Chart, cheatsheets.davidveksler.com/the-glue-chart.html
//   (matriks perekat per pasangan bahan; PE/PP butuh lem khusus
//   polyolefin atau primer + cyanoacrylate, epoxy biasa kurang nempel)
// - Complete Guide to Adhesive Selection by Substrate, jomebond.com
// - Adhesive Guide: Which Glue for Which Material, rothkoandfrost.com
// (PVA untuk kayu-kayu; epoxy untuk kayu-logam dan beda bahan; solvent
// cement untuk akrilik-akrilik; lem kontak untuk kain/kulit/karet).
// PVAc = lem kayu putih/kuning; cyanoacrylate = lem super (lem G/Korea);
// epoxy = lem dua komponen yang dicampur; lem kontak = lem kuning yang
// dioles dua sisi lalu ditekan (Aibon dsb.); solvent cement = lem yang
// melelehkan permukaan akrilik/plastik hingga menyatu. Aturan umum:
// permukaan harus bersih, kering, dan bebas minyak; lem berbahan solvent
// (thinner, lem pipa) melarutkan styrofoam, jadi jangan dipakai di sana.
const BAHAN = {
  akrilik: 'Akrilik', beton: 'Beton / bata', kain: 'Kain', kaca: 'Kaca',
  kertas: 'Kertas / karton', kayu: 'Kayu', keramik: 'Keramik', karet: 'Karet',
  kulit: 'Kulit', logam: 'Logam', plastik: 'Plastik', styrofoam: 'Styrofoam',
};
const LEM = {
  'akrilik|akrilik': ['Lem akrilik (solvent cement)', 'Melelehkan permukaan hingga menyatu, sambungan paling kuat dan bening. Alternatif: epoxy bening.'],
  'akrilik|beton': ['Epoxy', 'Amplas sedikit permukaan akrilik supaya lem menggigit. Alternatif: lem konstruksi.'],
  'akrilik|kain': ['Lem tembak', 'Oles tipis dan tekan cepat. Alternatif: epoxy bening untuk hasil permanen.'],
  'akrilik|kaca': ['Lem UV', 'Bening sempurna dan kuat, dikeringkan dengan sinar UV/matahari. Alternatif: epoxy bening.'],
  'akrilik|kertas': ['Lem PVAc (lem putih)', 'Oles tipis supaya kertas tidak mengerut. Alternatif: lem tembak.'],
  'akrilik|kayu': ['Epoxy bening', 'Amplas sedikit akriliknya dulu. Alternatif: lem konstruksi.'],
  'akrilik|keramik': ['Epoxy bening', 'Bersihkan keramik dari debu dan minyak sebelum dilem.'],
  'akrilik|karet': ['Lem kontak', 'Oles dua sisi, tunggu sampai lengket disentuh, baru tempel. Alternatif: epoxy.'],
  'akrilik|kulit': ['Lem kontak', 'Oles tipis dua sisi. Alternatif: epoxy untuk sambungan kaku.'],
  'akrilik|logam': ['Epoxy bening', 'Amplas halus permukaan logam supaya lem menggigit.'],
  'akrilik|plastik': ['Lem akrilik (solvent cement)', 'Bekerja baik bila plastiknya sejenis akrilik/ABS. Bila plastiknya PP/PE, pakai epoxy.'],
  'akrilik|styrofoam': ['Lem PVAc (lem putih)', 'Jangan pakai lem solvent, styrofoam akan meleleh.'],
  'beton|beton': ['Epoxy atau adukan semen', 'Epoxy untuk perbaikan kecil dan retak; adukan semen untuk menyambung bata/beton.'],
  'beton|kain': ['Lem konstruksi', 'Untuk hiasan dinding dan sejenisnya. Permukaan beton harus kering.'],
  'beton|kaca': ['Silikon kaca', 'Fleksibel dan tahan air. Alternatif: epoxy untuk beban berat.'],
  'beton|kertas': ['Lem konstruksi', 'Untuk tempel permanen. Lem PVAc hanya untuk sementara, kertas mudah lepas saat lembap.'],
  'beton|kayu': ['Lem konstruksi atau epoxy', 'Keduanya kuat untuk kayu ke dinding. Pastikan beton kering dan bersih.'],
  'beton|keramik': ['Epoxy atau lem konstruksi', 'Untuk menempel keramik lepas. Alternatif: semen perekat (tile adhesive).'],
  'beton|karet': ['Lem kontak atau epoxy', 'Lem kontak untuk lapisan tipis, epoxy untuk beban.'],
  'beton|kulit': ['Lem konstruksi', 'Oles merata, tekan sampai kering.'],
  'beton|logam': ['Epoxy', 'Untuk beban berat pakai angkur kimia (chemical anchor), bukan sekadar lem permukaan.'],
  'beton|plastik': ['Epoxy atau lem konstruksi', 'Amplas sedikit permukaan plastiknya supaya lem menggigit.'],
  'beton|styrofoam': ['Lem konstruksi tanpa solvent', 'Pastikan kemasannya menulis aman untuk styrofoam.'],
  'kain|kain': ['Lem kain', 'Fleksibel dan tidak kaku setelah kering. Alternatif: lem tembak untuk kerajinan.'],
  'kaca|kain': ['Lem tembak atau silikon', 'Lem tembak cepat untuk kerajinan; silikon untuk hasil tahan air.'],
  'kain|kertas': ['Lem PVAc (lem putih)', 'Oles tipis dan ratakan supaya tidak mengerut.'],
  'kain|kayu': ['Lem PVAc (lem kayu)', 'Oles merata, tekan sampai kering. Alternatif: lem kain.'],
  'kain|keramik': ['Lem tembak', 'Cepat dan cukup kuat untuk hiasan. Untuk permanen, pakai epoxy.'],
  'kain|karet': ['Lem kontak', 'Oles dua sisi, tunggu lengket, baru tempel.'],
  'kain|kulit': ['Lem kain atau lem kontak', 'Lem kain lebih fleksibel; lem kontak lebih kuat.'],
  'kain|logam': ['Lem kontak atau epoxy', 'Lem kontak untuk lapisan tipis, epoxy untuk sambungan kaku.'],
  'kain|plastik': ['Lem kain atau lem tembak', 'Lem tembak cepat untuk kerajinan; lem kain untuk hasil rapi.'],
  'kain|styrofoam': ['Lem PVAc atau lem tembak suhu rendah', 'Lem tembak panas bisa melelehkan styrofoam, pakai suhu rendah.'],
  'kaca|kaca': ['Lem UV', 'Paling bening dan kuat untuk kaca. Alternatif: silikon kaca.'],
  'kaca|kertas': ['Lem PVAc (lem putih)', 'Oles tipis. Untuk hasil tahan air, pakai silikon.'],
  'kaca|kayu': ['Epoxy bening atau lem UV', 'Epoxy bening paling praktis; lem UV paling bening.'],
  'kaca|keramik': ['Epoxy bening atau silikon', 'Epoxy untuk sambungan kaku, silikon untuk yang butuh fleksibel.'],
  'kaca|karet': ['Silikon atau lem kontak', 'Silikon tahan air; lem kontak cepat kering.'],
  'kaca|kulit': ['Lem kontak', 'Oles tipis dua sisi.'],
  'kaca|logam': ['Epoxy bening atau lem UV', 'Amplas halus permukaan logamnya dulu.'],
  'kaca|plastik': ['Epoxy bening atau lem UV', 'Untuk plastik PP/PE, epoxy lebih bisa diandalkan.'],
  'kaca|styrofoam': ['Silikon atau lem PVAc', 'Jangan pakai lem solvent.'],
  'kertas|kertas': ['Lem stik atau lem PVAc', 'Lem stik paling rapi untuk kertas; lem PVAc lebih kuat.'],
  'kayu|kertas': ['Lem PVAc (lem kayu)', 'Oles tipis supaya kertas tidak mengerut.'],
  'keramik|kertas': ['Lem PVAc (lem putih)', 'Untuk hiasan. Bila kena air, lapisi lagi dengan pernis.'],
  'karet|kertas': ['Lem kontak atau lem PVAc', 'Lem kontak lebih kuat, PVAc lebih rapi.'],
  'kertas|kulit': ['Lem PVAc (lem putih)', 'Oles tipis dan ratakan.'],
  'kertas|logam': ['Lem PVAc (lem putih)', 'Bersihkan logam dari minyak dulu.'],
  'kertas|plastik': ['Lem PVAc atau lem stik', 'Untuk plastik licin (PP/PE), pakai lem tembak.'],
  'kertas|styrofoam': ['Lem PVAc atau lem stik', 'Jangan pakai lem solvent.'],
  'kayu|kayu': ['Lem kayu PVAc (putih/kuning)', 'Kuat, murah, dan paling umum. Untuk luar ruang atau kena air, pakai epoxy.'],
  'kayu|keramik': ['Epoxy', 'Bersihkan keramik dari debu sebelum dilem.'],
  'karet|kayu': ['Lem kontak', 'Oles dua sisi, tunggu lengket, baru tempel.'],
  'kayu|kulit': ['Lem kontak', 'Oles tipis dua sisi.'],
  'kayu|logam': ['Epoxy', 'Amplas halus permukaan logamnya supaya lem menggigit.'],
  'kayu|plastik': ['Epoxy', 'Lem kayu tidak nempel di plastik. Amplas sedikit plastiknya dulu.'],
  'kayu|styrofoam': ['Lem PVAc (lem putih)', 'Jangan pakai lem solvent, styrofoam akan meleleh.'],
  'keramik|keramik': ['Epoxy keramik', 'Kuat dan tahan air, cocok untuk memperbaiki keramik pecah.'],
  'karet|keramik': ['Lem kontak atau silikon', 'Silikon tahan air, lem kontak cepat kering.'],
  'keramik|kulit': ['Lem kontak', 'Oles tipis dua sisi.'],
  'keramik|logam': ['Epoxy', 'Amplas halus permukaan logamnya dulu.'],
  'keramik|plastik': ['Epoxy', 'Amplas sedikit plastiknya supaya lem menggigit.'],
  'keramik|styrofoam': ['Lem PVAc (lem putih)', 'Jangan pakai lem solvent.'],
  'karet|karet': ['Lem kontak atau cyanoacrylate (lem super)', 'Lem kontak untuk bidang lebar, lem super untuk titik kecil.'],
  'karet|kulit': ['Lem kontak', 'Standar untuk sol sepatu dan sejenisnya.'],
  'karet|logam': ['Lem kontak atau epoxy', 'Lem kontak untuk lapisan, epoxy untuk sambungan kaku.'],
  'karet|plastik': ['Cyanoacrylate (lem super)', 'Cepat dan kuat untuk karet ke plastik keras.'],
  'karet|styrofoam': ['Lem kontak tipis atau lem PVAc', 'Oles tipis, jangan sampai menggenang.'],
  'kulit|kulit': ['Lem kulit atau lem kontak', 'Lem kulit khusus lebih fleksibel; lem kontak lebih mudah dicari.'],
  'kulit|logam': ['Lem kontak', 'Oles tipis dua sisi, tekan sampai kering.'],
  'kulit|plastik': ['Lem kontak', 'Amplas sedikit plastiknya supaya lem menggigit.'],
  'kulit|styrofoam': ['Lem kontak tipis', 'Oles tipis dan cepat, jangan sampai menggenang.'],
  'logam|logam': ['Epoxy logam', 'Untuk sambungan struktural, las jauh lebih kuat daripada lem apa pun.'],
  'logam|plastik': ['Epoxy', 'Amplas kedua permukaan supaya lem menggigit.'],
  'logam|styrofoam': ['Lem PVAc atau epoxy', 'Jangan pakai lem solvent.'],
  'plastik|plastik': ['Lem khusus plastik', 'Plastik PP/PE sulit dilem, butuh primer khusus + lem super atau lem khusus polyolefin — epoxy biasa kurang nempel di PP/PE. Plastik keras (ABS, PVC) bisa pakai cyanoacrylate atau solvent cement.'],
  'plastik|styrofoam': ['Lem PVAc atau lem khusus styrofoam', 'Jangan pakai lem solvent atau lem pipa PVC.'],
  'styrofoam|styrofoam': ['Lem PVAc atau lem khusus styrofoam', 'Jangan pakai lem solvent, thinner, atau lem tembak panas.'],
};
export function cariLem(a, b) {
  const kunci = [a, b].sort().join('|');
  return LEM[kunci] || null;
}
utils.cariLem = cariLem;

export const meta = {"id": "lem-untuk-bahan-ini", "name": "Lem untuk Bahan Ini", "cat": "rumah", "icon": "🧴", "desc": "Mau merekatkan dua bahan? Pilih bahannya, lihat lem yang cocok dan yang harus dihindari.", "keywords": "lem,perekat,epoxy,lem kayu,lem super,cyanoacrylate,silikon,bahan,menempel", "since": "6.19.0"};
export function render(root) {
  const kunci = Object.keys(BAHAN);
  const aSel = T.select(kunci.map((k) => [k, BAHAN[k]]), 'kayu');
  const bSel = T.select(kunci.map((k) => [k, BAHAN[k]]), 'logam');
  const box = T.out();

  const hitung = () => {
    const a = aSel.value; const b = bSel.value;
    const r = cariLem(a, b);
    if (!r) { T.hide(box); return; }
    T.show(box,
      '<div class="big">' + T.esc(r[0]) + '</div>' +
      '<p class="center mut">Untuk ' + T.esc(BAHAN[a].toLowerCase()) + ' + ' + T.esc(BAHAN[b].toLowerCase()) + '.</p>' +
      kv('Catatan', T.esc(r[1])) +
      '<p class="hint">Aturan umum semua lem: permukaan harus bersih, kering, dan bebas minyak. Amplas sedikit permukaan yang licin supaya lem menggigit. Selalu baca kemasan lemnya: beberapa lem butuh waktu kering berjam-jam sebelum kuat penuh, dan lem solvent melarutkan styrofoam.</p>' +
      '<p class="hint">Sumber rekomendasi: The Glue Chart (cheatsheets.davidveksler.com), panduan pemilihan perekat JOME (jomebond.com), dan Adhesive Guide Rothko &amp; Frost (rothkoandfrost.com) — dicek 20 November 2026. Rekomendasi di sini adalah panduan umum; untuk sambungan yang menahan beban berat atau keselamatan, ikuti petunjuk pabrik lemnya.</p>');
  };
  [aSel, bSel].forEach((i) => i.addEventListener('input', hitung));
  [aSel, bSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Salah lem bikin sambungan lepas lagi besok. Pilih dua bahan yang mau direkatkan.</p>'));
  root.appendChild(T.grid2(
    T.field('Bahan pertama', aSel),
    T.field('Bahan kedua', bSel)
  ));
  root.appendChild(box);
  hitung();
}
