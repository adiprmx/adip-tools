import { h as T, utils, fileInput } from '../../core.js';

export const meta = {"id": "discord-wrapped", "name": "Discord Wrapped", "cat": "fun", "icon": "💬", "desc": "Rangkuman setahun Discord-mu: pesan, server, emoji dan kata teratas, dari data ekspor atau isi manual.", "keywords": "discord,wrapped,statistik,pesan,server,emoji,kata,ekspor", "since": "6.19.0"};

/* Kata yang diabaikan saat menghitung kata teratas (kata sambung umum). */
export const STOPWORDS = ['yang', 'dan', 'di', 'ke', 'dari', 'itu', 'ini', 'aku', 'kamu', 'gue', 'lu', 'gw', 'aja', 'sih', 'kan', 'ya', 'nggak', 'gak', 'udah', 'lagi', 'the', 'and', 'you', 'that', 'for', 'with', 'this', 'are', 'not', 'but', 'have', 'has', 'was', 'were', 'will', 'just', 'like', 'get', 'got', 'lol', 'wkwk', 'wkwkwk', 'haha', 'hehe'];

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { hitungEmoji, topDariMap, parseDaftarTeks, barisBatang } from '../../wrapped.js';
export { hitungEmoji, topDariMap, parseDaftarTeks } from '../../wrapped.js';


/* Parser satu file messages.json dari paket data Discord
   (Settings > Privacy & Safety > Request Data, folder messages/).
   Tiap pesan: { content, timestamp }. */
export function parseDiscordJson(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  const kata = {}, emoji = {}, perJam = {};
  let total = 0;
  for (const m of arr) {
    if (!m || typeof m.content !== 'string') continue;
    total++;
    const isi = m.content;
    const em = hitungEmoji(isi);
    for (const [e, c] of Object.entries(em)) emoji[e] = (emoji[e] || 0) + c;
    const bersih = isi.toLowerCase().replace(/https?:\/\/\S+/g, ' ').replace(/<[^>]+>/g, ' ');
    for (const w of bersih.split(/[^a-z0-9\u00c0-\u024f]+/u)) {
      if (w.length < 3 || STOPWORDS.includes(w)) continue;
      kata[w] = (kata[w] || 0) + 1;
    }
    if (m.timestamp) {
      const d = new Date(m.timestamp);
      if (!Number.isNaN(d.getTime())) {
        const j = d.getHours();
        perJam[j] = (perJam[j] || 0) + 1;
      }
    }
  }
  if (!total) return null;
  let jamSibuk = null, jamMaks = 0;
  for (const [j, c] of Object.entries(perJam)) if (c > jamMaks) { jamMaks = c; jamSibuk = Number(j); }
  return {
    totalPesan: total,
    topKata: topDariMap(kata, 5),
    topEmoji: topDariMap(emoji, 5),
    jamSibuk,
    jamSibukJumlah: jamMaks,
  };
}



export function render(root) {
  const box = T.out();
  const totalI = T.input('number', 'cth: 18400');
  const serverI = T.ta(5, 'Server Teman Nongkrong: 6200\nServer Game: 4100\n...', '');
  const emojiI = T.ta(4, '😂: 320\n🔥: 210\n...', '');
  const kataI = T.ta(4, 'gas: 480\nbesok: 260\n...', '');
  const fi = fileInput('.json');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah satu file messages.json dari paket data Discord.<br><br>Cara dapat file-nya: Discord Settings, Privacy and Safety, Request Data. Setelah paket siap, buka folder messages, pilih satu file messages.json dari channel yang paling ramai. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    let html = '<div class="big center">' + T.fmt(data.totalPesan) + '<span class="mut" style="font-size:15px"> pesan</span></div>';
    if (data.jamSibuk !== null && data.jamSibuk !== undefined) {
      html += '<p class="center hint">Jam paling sibuk: pukul ' + data.jamSibuk + ':00 (' + T.fmt(data.jamSibukJumlah) + ' pesan).</p>';
    }
    if (data.topServer && data.topServer.length) {
      const maks = data.topServer[0].jumlah;
      html += '<h3 style="margin-top:14px">Server teratas</h3>' + data.topServer.map((s) => barisBatang(s.nama, s.jumlah, maks, 'pesan')).join('');
    }
    if (data.topEmoji && data.topEmoji.length) {
      const maks = data.topEmoji[0].jumlah;
      html += '<h3 style="margin-top:14px">Emoji teratas</h3>' + data.topEmoji.map((s) => barisBatang(s.nama, s.jumlah, maks, 'x')).join('');
    }
    if (data.topKata && data.topKata.length) {
      const maks = data.topKata[0].jumlah;
      html += '<h3 style="margin-top:14px">Kata teratas</h3>' + data.topKata.map((s) => barisBatang(s.nama, s.jumlah, maks, 'x')).join('');
    }
    T.show(box, html);
    const dl = T.btn('⬇️ Unduh kartu PNG', () => unduhKartu(), true);
    dl.style.marginTop = '14px';
    box.appendChild(dl);
  };

  const unduhKartu = () => {
    if (!data) return;
    const c = document.createElement('canvas');
    c.width = 900; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = '#171923'; x.fillRect(0, 0, 900, 1200);
    x.textAlign = 'left';
    x.fillStyle = '#fff'; x.font = '700 34px system-ui, sans-serif';
    x.fillText('Discord Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman setahunmu', 48, 118);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(data.totalPesan), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('pesan terkirim', 48, 285);
    let y = 380;
    const tulisDaftar = (judul, list, satuan) => {
      if (!list || !list.length) return;
      x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
      x.fillText(judul, 48, y); y += 48;
      x.font = '400 26px system-ui, sans-serif';
      list.forEach((s, i) => {
        x.fillStyle = '#fff'; x.fillText((i + 1) + '. ' + String(s.nama).slice(0, 30), 48, y);
        x.fillStyle = '#a1a1aa'; x.fillText(T.fmt(s.jumlah) + ' ' + satuan, 700, y); y += 44;
      });
      y += 30;
    };
    tulisDaftar('Server teratas', data.topServer, 'pesan');
    tulisDaftar('Emoji teratas', data.topEmoji, 'x');
    tulisDaftar('Kata teratas', data.topKata, 'x');
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('discord-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const total = T.num(totalI.value);
    const topServer = parseDaftarTeks(serverI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const topEmoji = parseDaftarTeks(emojiI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const topKata = parseDaftarTeks(kataI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    if (!total && !topServer.length && !topEmoji.length && !topKata.length) {
      T.toast('Isi dulu total pesan atau salah satu daftarnya');
      return;
    }
    const totalDariServer = topServer.reduce((s, a) => s + a.jumlah, 0);
    data = { totalPesan: total || totalDariServer, topServer, topEmoji, topKata, jamSibuk: null, jamSibukJumlah: 0 };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let hasil = null;
      try { hasil = parseDiscordJson(JSON.parse(String(rd.result || ''))); } catch (e) { hasil = null; }
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini file messages.json dari paket data Discord'); return; }
      data = { totalPesan: hasil.totalPesan, topServer: [], topEmoji: hasil.topEmoji, topKata: hasil.topKata, jamSibuk: hasil.jamSibuk, jamSibukJumlah: hasil.jamSibukJumlah };
      T.toast('Data dimuat: ' + T.fmt(hasil.totalPesan) + ' pesan');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah satu file messages.json dari paket data Discord supaya kata dan emoji dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Total pesan setahun', totalI));
  root.appendChild(T.field('Server teratas (satu per baris)', serverI, 'Format: Nama server: jumlah pesan'));
  root.appendChild(T.field('Emoji teratas (satu per baris)', emojiI, 'Format: emoji: jumlah. Contoh: 😂: 320'));
  root.appendChild(T.field('Kata teratas (satu per baris)', kataI, 'Format: kata: jumlah. Contoh: gas: 480'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah messages.json', () => fi.click())));
  root.appendChild(box);
  gambar();
}
