import { h as T, utils, fileInput } from '../../core.js';

export const meta = {"id": "instagram-wrapped", "name": "Instagram Wrapped", "cat": "fun", "icon": "📸", "desc": "Rangkuman setahun DM Instagram-mu: siapa paling banyak chat, emoji teratas dan streak, dari data ekspor atau isi manual.", "keywords": "instagram,wrapped,statistik,dm,chat,emoji,streak,ekspor", "since": "6.19.0"};

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
// hitungStreak file ini TETAP LOKAL: variannya berbeda dari kanon
// (tanpa .filter(Boolean) dan tanpa pelindung tanggal invalid).
import { hitungEmoji, topDariMap, parseDaftarTeks, barisBatang } from '../../wrapped.js';
export { hitungEmoji, topDariMap, parseDaftarTeks } from '../../wrapped.js';


/* Streak terpanjang (hari berurutan) dari daftar tanggal ISO 'YYYY-MM-DD'. */
export function hitungStreak(tanggalList) {
  const set = new Set(tanggalList);
  if (!set.size) return 0;
  let terbaik = 0;
  for (const t of set) {
    const d = new Date(t + 'T00:00:00Z');
    const kemarin = new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
    if (set.has(kemarin)) continue;
    let run = 1, cur = d.getTime();
    while (set.has(new Date(cur + 86400000).toISOString().slice(0, 10))) { run++; cur += 86400000; }
    if (run > terbaik) terbaik = run;
  }
  return terbaik;
}

/* Parser satu file message_1.json dari ekspor Instagram
   (Accounts Centre > Your information and permissions > Download your
   information, format JSON). Bentuk: { messages: [{ sender_name,
   timestamp_ms, content, reactions }] }. */
export function parseIgJson(data) {
  const arr = data && Array.isArray(data.messages) ? data.messages : null;
  if (!arr || !arr.length) return null;
  const pengirim = {}, emoji = {};
  const tanggal = [];
  let total = 0, totalReaksi = 0;
  for (const m of arr) {
    if (!m) continue;
    total++;
    const nama = m.sender_name || 'Tidak diketahui';
    pengirim[nama] = (pengirim[nama] || 0) + 1;
    if (typeof m.content === 'string') {
      const em = hitungEmoji(m.content);
      for (const [e, c] of Object.entries(em)) emoji[e] = (emoji[e] || 0) + c;
    }
    if (Array.isArray(m.reactions)) totalReaksi += m.reactions.length;
    if (m.timestamp_ms) {
      const d = new Date(m.timestamp_ms);
      if (!Number.isNaN(d.getTime())) tanggal.push(d.toISOString().slice(0, 10));
    }
  }
  if (!total) return null;
  return {
    totalPesan: total,
    topKontak: topDariMap(pengirim, 5),
    topEmoji: topDariMap(emoji, 5),
    streak: hitungStreak(tanggal),
    totalReaksi,
  };
}



export function render(root) {
  const box = T.out();
  const totalI = T.input('number', 'cth: 9800');
  const kontakI = T.ta(5, 'Nama teman: 2400\nNama teman lain: 1800\n...', '');
  const emojiI = T.ta(4, '❤️: 410\n😂: 260\n...', '');
  const streakI = T.input('number', 'cth: 45');
  const fi = fileInput('.json');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah satu file message_1.json dari ekspor Instagram.<br><br>Cara dapat file-nya: Accounts Centre, Your information and permissions, Download your information, pilih format JSON. Setelah paket siap, buka folder messages, pilih satu file message_1.json dari obrolan yang paling ramai. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    let html = '<div class="big center">' + T.fmt(data.totalPesan) + '<span class="mut" style="font-size:15px"> pesan DM</span></div>';
    const info = [];
    if (data.streak) info.push('Streak terpanjang ' + T.fmt(data.streak) + ' hari berturut-turut');
    if (data.totalReaksi) info.push(T.fmt(data.totalReaksi) + ' reaksi dikirim');
    if (info.length) html += '<p class="center hint">' + info.join(' · ') + '</p>';
    if (data.topKontak && data.topKontak.length) {
      const maks = data.topKontak[0].jumlah;
      html += '<h3 style="margin-top:14px">Paling banyak chat dengan</h3>' + data.topKontak.map((s) => barisBatang(s.nama, s.jumlah, maks, 'pesan')).join('');
    }
    if (data.topEmoji && data.topEmoji.length) {
      const maks = data.topEmoji[0].jumlah;
      html += '<h3 style="margin-top:14px">Emoji teratas</h3>' + data.topEmoji.map((s) => barisBatang(s.nama, s.jumlah, maks, 'x')).join('');
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
    x.fillText('Instagram Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman DM setahunmu', 48, 118);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(data.totalPesan), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('pesan DM', 48, 285);
    let y = 380;
    if (data.streak) {
      x.fillStyle = '#fff'; x.font = '700 30px system-ui, sans-serif';
      x.fillText('Streak terpanjang: ' + T.fmt(data.streak) + ' hari', 48, y); y += 70;
    }
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
    tulisDaftar('Paling banyak chat dengan', data.topKontak, 'pesan');
    tulisDaftar('Emoji teratas', data.topEmoji, 'x');
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('instagram-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const total = T.num(totalI.value);
    const topKontak = parseDaftarTeks(kontakI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const topEmoji = parseDaftarTeks(emojiI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const streak = T.num(streakI.value);
    if (!total && !topKontak.length && !topEmoji.length && !streak) {
      T.toast('Isi dulu total pesan atau salah satu daftarnya');
      return;
    }
    const totalDariKontak = topKontak.reduce((s, a) => s + a.jumlah, 0);
    data = { totalPesan: total || totalDariKontak, topKontak, topEmoji, streak: streak || 0, totalReaksi: 0 };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let hasil = null;
      try { hasil = parseIgJson(JSON.parse(String(rd.result || ''))); } catch (e) { hasil = null; }
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini file message_1.json dari ekspor Instagram'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.totalPesan) + ' pesan');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah satu file message_1.json dari ekspor Instagram supaya pengirim, emoji dan streak dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Total pesan DM setahun', totalI));
  root.appendChild(T.field('Paling banyak chat dengan (satu per baris)', kontakI, 'Format: Nama: jumlah pesan'));
  root.appendChild(T.field('Emoji teratas (satu per baris)', emojiI, 'Format: emoji: jumlah. Contoh: ❤️: 410'));
  root.appendChild(T.field('Streak terpanjang (hari)', streakI, 'Berapa hari berturut-turut paling lama kamu dan dia saling balas DM.'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah message_1.json', () => fi.click())));
  root.appendChild(box);
  gambar();
}
