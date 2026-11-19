import { h as T, fileInput } from '../../core.js';

export const meta = {"id": "whatsapp-wrapped", "name": "WhatsApp Wrapped", "cat": "fun", "icon": "💬", "desc": "Rangkuman setahun WhatsApp-mu: pesan, kontak teratas, kata dan emoji teratas, dari file ekspor chat atau isi manual.", "keywords": "whatsapp,wrapped,statistik,chat,pesan,kontak,emoji,ekspor,tahunan", "since": "6.19.0"};

export const STOPWORDS = ['yang', 'dan', 'di', 'ke', 'dari', 'itu', 'ini', 'aku', 'kamu', 'gue', 'lu', 'gw', 'aja', 'sih', 'kan', 'ya', 'nggak', 'gak', 'udah', 'lagi', 'the', 'and', 'you', 'that', 'for', 'with', 'this', 'are', 'not', 'but', 'have', 'has', 'was', 'were', 'will', 'just', 'like', 'get', 'got', 'lol', 'wkwk', 'wkwkwk', 'haha', 'hehe', 'omitted', 'media', 'tidak', 'disertakan'];

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { hitungEmoji, topDariMap, parseDaftarTeks, barisBatang } from '../../wrapped.js';
export { hitungEmoji, topDariMap, parseDaftarTeks } from '../../wrapped.js';


/* Parser file ekspor chat WhatsApp (_chat.txt, dari Export chat).
   Mendukung bentuk Android "12/01/2025, 14:32 - Nama: pesan" dan bentuk
   iOS "[12/01/2025, 14:32] Nama: pesan". Baris lanjutan (pesan
   multi-baris) ditempel ke pesan sebelumnya. Pesan sistem (tanpa nama
   pengirim) dilewati. */
export function parseChatWa(teks) {
  const perPengirim = {}, kata = {}, emoji = {}, perJam = {}, perHari = {};
  let total = 0, media = 0, tautan = 0;
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const polaAndroid = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}) - (.*?): (.*)$/;
  const polaIos = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})\] (.*?): (.*)$/;
  let pesanTerakhir = null;

  const prosesTeks = (isi) => {
    if (/<Media omitted>|media tidak disertakan|image omitted|video omitted/i.test(isi)) media++;
    if (/https?:\/\/\S+/.test(isi)) tautan++;
    const em = hitungEmoji(isi);
    for (const [e, c] of Object.entries(em)) emoji[e] = (emoji[e] || 0) + c;
    const bersih = isi.toLowerCase().replace(/https?:\/\/\S+/g, ' ').replace(/<[^>]+>/g, ' ');
    for (const w of bersih.split(/[^a-z0-9\u00c0-\u024f]+/u)) {
      if (w.length < 3 || STOPWORDS.includes(w)) continue;
      kata[w] = (kata[w] || 0) + 1;
    }
  };

  const prosesPesan = (pengirim, isi, jam, tanggal) => {
    total++;
    perPengirim[pengirim] = (perPengirim[pengirim] || 0) + 1;
    if (jam !== null) perJam[jam] = (perJam[jam] || 0) + 1;
    if (tanggal) {
      const hari = namaHari[tanggal.getDay()];
      perHari[hari] = (perHari[hari] || 0) + 1;
    }
    prosesTeks(isi);
  };

  for (const baris of String(teks || '').split('\n')) {
    const s = baris.replace(/\r$/, '');
    const m = s.match(polaAndroid) || s.match(polaIos);
    if (m) {
      const d1 = Number(m[1]), d2 = Number(m[2]);
      const tahun = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
      const jam = Number(m[4]);
      const pengirim = m[6].trim();
      const isi = m[7];
      if (!pengirim || pengirim === 'null') { pesanTerakhir = null; continue; }
      let tanggal = null;
      const tgl = new Date(tahun, d2 - 1, d1);
      if (!Number.isNaN(tgl.getTime()) && tgl.getMonth() === d2 - 1) tanggal = tgl;
      else {
        const tgl2 = new Date(tahun, d1 - 1, d2);
        if (!Number.isNaN(tgl2.getTime()) && tgl2.getMonth() === d1 - 1) tanggal = tgl2;
      }
      pesanTerakhir = { pengirim, isi, jam, tanggal };
      prosesPesan(pengirim, isi, jam, tanggal);
    } else if (pesanTerakhir && s.trim() !== '') {
      pesanTerakhir.isi += '\n' + s;
      prosesTeks(s);
    }
  }
  if (total === 0) return null;
  let jamSibuk = null, jamMaks = 0;
  for (const [j, c] of Object.entries(perJam)) if (c > jamMaks) { jamMaks = c; jamSibuk = Number(j); }
  let hariSibuk = null, hariMaks = 0;
  for (const [h, c] of Object.entries(perHari)) if (c > hariMaks) { hariMaks = c; hariSibuk = h; }
  return {
    totalPesan: total,
    media,
    tautan,
    topPengirim: topDariMap(perPengirim, 5),
    topKata: topDariMap(kata, 5),
    topEmoji: topDariMap(emoji, 5),
    jamSibuk,
    jamSibukJumlah: jamMaks,
    hariSibuk,
    hariSibukJumlah: hariMaks,
  };
}



export function render(root) {
  const box = T.out();
  const totalI = T.input('number', 'cth: 42000');
  const kontakI = T.ta(5, 'Mama: 12000\nBudi: 8500\n...', '');
  const kataI = T.ta(4, 'besok: 320\nmakan: 210\n...', '');
  const fi = fileInput('.txt');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah file _chat.txt dari ekspor chat WhatsApp.<br><br>Cara dapat file-nya: buka chat di WhatsApp, ketuk titik tiga lalu "Lainnya" dan "Ekspor chat", pilih tanpa media, lalu simpan file _chat.txt-nya. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const maksP = data.topPengirim.length ? data.topPengirim[0].jumlah : 0;
    const maksK = data.topKata.length ? data.topKata[0].jumlah : 0;
    const maksE = data.topEmoji.length ? data.topEmoji[0].jumlah : 0;
    let html = '<div class="big center">' + T.fmt(data.totalPesan) + '<span class="mut" style="font-size:15px"> pesan</span></div>';
    if (data.media || data.tautan) html += '<p class="center hint">' + T.fmt(data.media) + ' media · ' + T.fmt(data.tautan) + ' tautan dibagikan.</p>';
    if (data.jamSibuk !== null && data.jamSibuk !== undefined) html += '<p class="center hint">Jam paling sibuk: pukul ' + String(data.jamSibuk).padStart(2, '0') + '.00 (' + T.fmt(data.jamSibukJumlah) + ' pesan).</p>';
    if (data.hariSibuk) html += '<p class="center hint">Hari paling sibuk: ' + T.esc(data.hariSibuk) + ' (' + T.fmt(data.hariSibukJumlah) + ' pesan).</p>';
    if (data.topPengirim.length) html += '<h3 style="margin-top:14px">Pengirim teratas</h3>' + data.topPengirim.map((p) => barisBatang(p.nama, p.jumlah, maksP, 'pesan')).join('');
    if (data.topKata.length) html += '<h3 style="margin-top:14px">Kata teratas</h3>' + data.topKata.map((k) => barisBatang(k.nama, k.jumlah, maksK, 'x')).join('');
    if (data.topEmoji.length) html += '<h3 style="margin-top:14px">Emoji teratas</h3>' + data.topEmoji.map((e) => barisBatang(e.nama, e.jumlah, maksE, 'x')).join('');
    T.show(box, html);
  };

  const dariManual = () => {
    const total = T.num(totalI.value) || 0;
    const kontak = parseDaftarTeks(kontakI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const kata = parseDaftarTeks(kataI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    if (!total && !kontak.length && !kata.length) {
      T.toast('Isi dulu total pesan atau salah satu daftarnya');
      return;
    }
    const totalDariKontak = kontak.reduce((s, k) => s + k.jumlah, 0);
    data = {
      totalPesan: total || totalDariKontak,
      media: 0, tautan: 0,
      topPengirim: kontak, topKata: kata, topEmoji: [],
      jamSibuk: null, jamSibukJumlah: 0, hariSibuk: null, hariSibukJumlah: 0,
    };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseChatWa(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini file _chat.txt dari ekspor chat WhatsApp'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.totalPesan) + ' pesan');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah file _chat.txt dari ekspor chat WhatsApp supaya angka dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Total pesan setahun', totalI));
  root.appendChild(T.field('Kontak teratas (satu per baris)', kontakI, 'Format: Nama: jumlah pesan. Contoh: Mama: 12000'));
  root.appendChild(T.field('Kata teratas (satu per baris)', kataI, 'Format: Kata: jumlah. Contoh: besok: 320'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah file chat', () => fi.click())));
  root.appendChild(box);
  gambar();
}
