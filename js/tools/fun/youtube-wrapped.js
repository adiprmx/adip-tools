import { h as T, fileInput } from '../../core.js';

export const meta = {"id": "youtube-wrapped", "name": "YouTube Wrapped", "cat": "fun", "icon": "▶️", "desc": "Rangkuman setahun YouTube-mu: video ditonton, channel dan kata teratas, dari file ekspor Google Takeout atau isi manual.", "keywords": "youtube,wrapped,statistik,video,channel,tonton,ekspor,takeout,tahunan", "since": "6.19.0"};

export const STOPWORDS = ['yang', 'dan', 'di', 'ke', 'dari', 'itu', 'ini', 'aku', 'kamu', 'gue', 'lu', 'gw', 'aja', 'sih', 'kan', 'ya', 'nggak', 'gak', 'udah', 'lagi', 'the', 'and', 'you', 'that', 'for', 'with', 'this', 'are', 'not', 'but', 'have', 'has', 'was', 'were', 'will', 'just', 'like', 'get', 'got', 'official', 'video', 'music', 'live', 'full', 'part', 'episode'];

// Helper wrapped tinggal di modul bersama js/wrapped.js (kanonis,
// G4 C1G4-R; dikonsolidasi dari 9 tool fun/*-wrapped.js).
import { topDariMap, parseDaftarTeks, barisBatang } from '../../wrapped.js';
export { topDariMap, parseDaftarTeks } from '../../wrapped.js';

/* Parser watch-history.json dari Google Takeout (YouTube and YouTube Music
   > history > watch-history.json). Tiap entri: {title, titleUrl, time,
   subtitles: [{name, url}]}. Entri tanpa titleUrl (video dihapus) tetap
   dihitung sebagai tontonan. */
export function parseYoutubeJson(teks) {
  let data;
  try { data = JSON.parse(teks); } catch (e) { return null; }
  if (!Array.isArray(data) || !data.length) return null;
  const channel = {}, kata = {}, perJam = {};
  const hariAktif = new Set();
  let total = 0, pertama = null, terakhir = null;
  for (const r of data) {
    if (!r || typeof r !== 'object' || typeof r.title !== 'string') continue;
    total++;
    const nama = (r.subtitles && r.subtitles[0] && r.subtitles[0].name) || 'Channel tidak diketahui';
    channel[nama] = (channel[nama] || 0) + 1;
    const bersih = r.title.toLowerCase().replace(/https?:\/\/\S+/g, ' ');
    for (const w of bersih.split(/[^a-z0-9\u00c0-\u024f]+/u)) {
      if (w.length < 3 || STOPWORDS.includes(w)) continue;
      kata[w] = (kata[w] || 0) + 1;
    }
    if (r.time) {
      const d = new Date(r.time);
      if (!Number.isNaN(d.getTime())) {
        const j = d.getHours();
        perJam[j] = (perJam[j] || 0) + 1;
        hariAktif.add(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate());
        if (!pertama || d < pertama) pertama = d;
        if (!terakhir || d > terakhir) terakhir = d;
      }
    }
  }
  if (total === 0) return null;
  let jamSibuk = null, jamMaks = 0;
  for (const [j, c] of Object.entries(perJam)) if (c > jamMaks) { jamMaks = c; jamSibuk = Number(j); }
  return {
    totalTonton: total,
    totalChannel: Object.keys(channel).length,
    hariAktif: hariAktif.size,
    topChannel: topDariMap(channel, 5),
    topKata: topDariMap(kata, 5),
    jamSibuk,
    jamSibukJumlah: jamMaks,
    pertama: pertama ? pertama.toISOString().slice(0, 10) : null,
    terakhir: terakhir ? terakhir.toISOString().slice(0, 10) : null,
  };
}



export function render(root) {
  const box = T.out();
  const totalI = T.input('number', 'cth: 2400');
  const channelI = T.ta(5, 'Nama channel: 320\nNama channel lain: 210\n...', '');
  const kataI = T.ta(4, 'musik: 180\nmasak: 120\n...', '');
  const fi = fileInput('.json');
  let data = null;

  const gambar = () => {
    if (!data) {
      T.show(box, '<p class="hint center" style="line-height:1.7">Belum ada data. Isi angka di atas lalu tekan "Lihat rangkumanku", atau unggah file watch-history.json dari Google Takeout.<br><br>Cara dapat file-nya: buka takeout.google.com, pilih hanya YouTube dan YouTube Music, ekspor, lalu cari file watch-history.json di dalam folder history. File diproses di HP ini saja, tidak dikirim ke mana-mana.</p>');
      return;
    }
    const maksC = data.topChannel.length ? data.topChannel[0].jumlah : 0;
    const maksK = data.topKata.length ? data.topKata[0].jumlah : 0;
    let html = '<div class="big center">' + T.fmt(data.totalTonton) + '<span class="mut" style="font-size:15px"> video ditonton</span></div>';
    if (data.totalChannel) html += '<p class="center hint">Dari ' + T.fmt(data.totalChannel) + ' channel' + (data.hariAktif ? ', aktif di ' + T.fmt(data.hariAktif) + ' hari.' : '.') + '</p>';
    if (data.pertama && data.terakhir) html += '<p class="center hint">Rentang data: ' + T.esc(data.pertama) + ' sampai ' + T.esc(data.terakhir) + '.</p>';
    if (data.jamSibuk !== null && data.jamSibuk !== undefined) html += '<p class="center hint">Jam paling sering menonton: pukul ' + String(data.jamSibuk).padStart(2, '0') + '.00 (' + T.fmt(data.jamSibukJumlah) + ' video).</p>';
    if (data.topChannel.length) html += '<h3 style="margin-top:14px">Channel teratas</h3>' + data.topChannel.map((c) => barisBatang(c.nama, c.jumlah, maksC, 'video')).join('');
    if (data.topKata.length) html += '<h3 style="margin-top:14px">Kata teratas di judul video</h3>' + data.topKata.map((k) => barisBatang(k.nama, k.jumlah, maksK, 'x')).join('');
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
    x.fillText('YouTube Wrapped', 48, 80);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('Rangkuman setahunmu', 48, 118);
    x.fillStyle = '#fff'; x.font = '800 96px system-ui, sans-serif';
    x.fillText(T.fmt(data.totalTonton), 48, 240);
    x.font = '400 26px system-ui, sans-serif'; x.fillStyle = '#a1a1aa';
    x.fillText('video ditonton', 48, 285);
    let y = 380;
    if (data.totalChannel) {
      x.fillStyle = '#fff'; x.font = '400 26px system-ui, sans-serif';
      x.fillText('Dari ' + T.fmt(data.totalChannel) + ' channel' + (data.hariAktif ? ', aktif di ' + T.fmt(data.hariAktif) + ' hari' : ''), 48, y); y += 44;
      y += 16;
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
    tulisDaftar('Channel teratas', data.topChannel, 'video');
    tulisDaftar('Kata teratas', data.topKata, 'x');
    x.fillStyle = '#52525b'; x.font = '400 20px system-ui, sans-serif';
    x.fillText('Dibuat di Adip Tools', 48, 1140);
    c.toBlob((b) => { if (b) T.dl('youtube-wrapped.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  const dariManual = () => {
    const total = T.num(totalI.value) || 0;
    const channel = parseDaftarTeks(channelI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    const kata = parseDaftarTeks(kataI.value).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
    if (!total && !channel.length && !kata.length) {
      T.toast('Isi dulu total video atau salah satu daftarnya');
      return;
    }
    const totalDariChannel = channel.reduce((s, c) => s + c.jumlah, 0);
    data = {
      totalTonton: total || totalDariChannel,
      totalChannel: channel.length,
      hariAktif: 0,
      topChannel: channel, topKata: kata,
      jamSibuk: null, jamSibukJumlah: 0, pertama: null, terakhir: null,
    };
    gambar();
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const hasil = parseYoutubeJson(String(rd.result || ''));
      if (!hasil) { T.toast('File tidak dikenali. Pastikan ini watch-history.json dari Google Takeout'); return; }
      data = hasil;
      T.toast('Data dimuat: ' + T.fmt(hasil.totalTonton) + ' video');
      gambar();
    };
    rd.onerror = () => T.toast('File gagal dibaca');
    rd.readAsText(f);
  };

  root.appendChild(T.el('<p class="hint">Rangkuman dari datamu sendiri. Isi manual, atau unggah file watch-history.json dari Google Takeout supaya angka dihitung otomatis. Tanpa data, tidak ada angka yang ditampilkan.</p>'));
  root.appendChild(T.field('Total video ditonton setahun', totalI));
  root.appendChild(T.field('Channel teratas (satu per baris)', channelI, 'Format: Nama channel: jumlah video. Contoh: Nama channel: 320'));
  root.appendChild(T.field('Kata teratas di judul (satu per baris)', kataI, 'Format: Kata: jumlah. Contoh: musik: 180'));
  root.appendChild(T.row(T.btn('Lihat rangkumanku', dariManual, true), T.btn('📄 Unggah JSON ekspor', () => fi.click())));
  root.appendChild(box);
  gambar();
}
