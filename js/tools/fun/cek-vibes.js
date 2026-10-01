import { h as T } from '../../core.js?v=6.6.0';

export const meta = {"id":"cek-vibes","name":"Cek Vibes","cat":"fun","icon":"✨","desc":"Kuis 6 pertanyaan buat nentuin vibes kamu hari ini. 100% nggak ilmiah.","keywords":"vibes,kuis,kepribadian,fun,hiburan,zodiak"};

const VIBES = [
  { key: 'senja', nama: 'Vibes Anak Senja Hujan-hujanan', emoji: '🌧️',
    desc: 'Langit mendung dikit, playlist galau langsung on. Kamu nggak sedih kok, cuma… puitis aja.' },
  { key: 'ceo', nama: 'Vibes CEO Startup Jam 3 Pagi', emoji: '💼',
    desc: 'Ide bisnis muncul jam 3 pagi, tidur jam 5. Investor belum ada, tapi mentalnya udah unicorn.' },
  { key: 'mager', nama: 'Vibes Mager Level Dewa', emoji: '🛋️',
    desc: 'Rencana hari ini: rebahan. Besok: rebahan juga. Produktif itu opsional, kasur itu prioritas.' },
  { key: 'jajan', nama: 'Vibes Tukang Jajan Sejati', emoji: '🍜',
    desc: 'Mood apa pun, solusinya makan. Budget jajan lebih gede dari tabungan, dan itu keputusan sadar.' },
  { key: 'introvert', nama: 'Vibes Introvert Akut', emoji: '🔋',
    desc: 'Baterai sosial tinggal 2%. Nongkrong rame-rame itu misi, bukan hiburan.' },
  { key: 'gas', nama: 'Vibes Petualang Spontan', emoji: '🛵',
    desc: 'Diajak dadakan? Gas. Bikin rencana matang? Nanti dulu. Hidup itu buat dijalani, bukan di-spreadsheet.' },
];

const SOAL = [
  { t: 'Cuaca favoritmu?',
    opsi: [
      { t: 'Hujan rintik-rintik', s: { senja: 2, introvert: 1 } },
      { t: 'Cerah terik', s: { gas: 2, jajan: 1 } },
      { t: 'Mendung adem', s: { mager: 2, senja: 1 } },
      { t: 'Berangin sepoi-sepoi', s: { ceo: 1, gas: 1 } },
    ] },
  { t: 'Lagu yang lagi nempel di kepala?',
    opsi: [
      { t: 'Lagu galau', s: { senja: 2, introvert: 1 } },
      { t: 'Dangdut koplo', s: { jajan: 2, gas: 1 } },
      { t: 'Lo-fi buat begadang', s: { ceo: 2, mager: 1 } },
      { t: 'Pop yang upbeat', s: { gas: 2, jajan: 1 } },
    ] },
  { t: 'Weekend ideal versi kamu?',
    opsi: [
      { t: 'Rebahan total', s: { mager: 2, introvert: 1 } },
      { t: 'Nongkrong + jajan', s: { jajan: 2, gas: 1 } },
      { t: 'Lembur ngerjain sesuatu', s: { ceo: 2, introvert: 1 } },
      { t: 'Jalan-jalan nggak jelas', s: { gas: 2, senja: 1 } },
    ] },
  { t: 'Minuman andalan?',
    opsi: [
      { t: 'Kopi susu', s: { ceo: 2, senja: 1 } },
      { t: 'Es teh manis', s: { jajan: 2, mager: 1 } },
      { t: 'Air putih', s: { introvert: 2, mager: 1 } },
      { t: 'Matcha', s: { senja: 1, ceo: 1 } },
    ] },
  { t: 'Jam paling produktif?',
    opsi: [
      { t: 'Pagi-pagi', s: { gas: 1, jajan: 1 } },
      { t: 'Siang bolong', s: { mager: 2, jajan: 1 } },
      { t: 'Sore menjelang magrib', s: { senja: 2, gas: 1 } },
      { t: 'Tengah malam', s: { ceo: 2, introvert: 1 } },
    ] },
  { t: 'Dapat uang jajan lebih, buat apa?',
    opsi: [
      { t: 'Ditabung', s: { mager: 2, ceo: 1 } },
      { t: 'Langsung jajan', s: { jajan: 2, gas: 1 } },
      { t: 'Beli buku / album', s: { senja: 2, introvert: 1 } },
      { t: 'Traktir teman', s: { gas: 2, jajan: 1 } },
    ] },
];

export function render(root) {
  const box = T.out();
  let idx = 0;
  let skor = {};

  const ulang = () => {
    idx = 0;
    skor = {};
    VIBES.forEach((v) => { skor[v.key] = 0; });
    tampilSoal();
  };

  const tampilSoal = () => {
    const q = SOAL[idx];
    T.show(box, '<p class="hint">Pertanyaan ' + (idx + 1) + ' dari ' + SOAL.length + '</p>' +
      '<p style="font-size:16px;line-height:1.6;margin:0 0 10px"><b>' + T.esc(q.t) + '</b></p>');
    q.opsi.forEach((o) => {
      const wrap = T.el('<div style="margin-bottom:8px"></div>');
      wrap.appendChild(T.btn(o.t, () => {
        Object.keys(o.s).forEach((k) => { skor[k] = (skor[k] || 0) + o.s[k]; });
        idx++;
        if (idx < SOAL.length) tampilSoal(); else tampilHasil();
      }));
      box.appendChild(wrap);
    });
  };

  const tampilHasil = () => {
    let menang = VIBES[0];
    VIBES.forEach((v) => { if ((skor[v.key] || 0) > (skor[menang.key] || 0)) menang = v; });
    T.show(box,
      '<div class="center">' +
      '<div class="dim">Hasil cek vibes kamu:</div>' +
      '<div style="font-size:44px;margin:8px 0">' + menang.emoji + '</div>' +
      '<div class="big" style="font-size:22px;line-height:1.4">' + T.esc(menang.nama) + '</div>' +
      '<p style="font-size:14px;line-height:1.65;max-width:420px;margin:10px auto">' + T.esc(menang.desc) + '</p>' +
      '<p class="hint">⚠️ Disclaimer: ini cuma hiburan, jangan dibawa serius. Vibes bisa berubah tiap jam. 😄</p>' +
      '</div>');
    box.appendChild(T.row(T.btn('Cek lagi', ulang, true)));
  };

  root.appendChild(T.el('<p class="hint">Jawab 6 pertanyaan receh, nanti ketahuan vibes kamu lagi kayak apa. Siap-siap ketawa sendiri.</p>'));
  root.appendChild(box);
  ulang();
}
