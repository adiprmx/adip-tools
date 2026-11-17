import { h as T, utils, kvRows } from '../../core.js';

// Logika murni (bisa di-test di Node): ubah data mentah jadi baris tampilan.
// Nilai yang tidak ada ditulis apa adanya: browser tidak selalu mengizinkan dibaca.
utils.infoPerangkatBaris = function (d) {
  const NA = 'tidak bisa dibaca browser ini';
  const ada = (x) => (x === null || x === undefined || x === '' ? NA : x);
  return [
    ['Ukuran layar', d.lebarLayar && d.tinggiLayar ? d.lebarLayar + ' x ' + d.tinggiLayar + ' piksel' : NA],
    ['Ukuran jendela browser', d.lebarJendela && d.tinggiJendela ? d.lebarJendela + ' x ' + d.tinggiJendela + ' piksel' : NA],
    ['Kerapatan piksel', ada(d.kerapatan)],
    ['Jumlah core CPU', ada(d.core)],
    ['Perkiraan RAM', d.ram ? 'sekitar ' + d.ram + ' GB' : NA],
    ['Kartu grafis (GPU)', ada(d.gpu)],
    ['Baterai', d.bateraiLevel !== null && d.bateraiLevel !== undefined ? Math.round(d.bateraiLevel * 100) + '% (lagi ' + (d.bateraiIsi ? 'diisi' : 'dipakai') + ')' : NA],
    ['Jenis koneksi', ada(d.koneksi)],
    ['Perkiraan kecepatan koneksi', d.kecepatan ? 'sekitar ' + d.kecepatan + ' Mbps' : NA],
    ['Status internet', d.online === true ? 'tersambung' : (d.online === false ? 'tidak tersambung' : NA)],
    ['Sistem operasi / platform', ada(d.platform)],
    ['Bahasa browser', ada(d.bahasa)],
    ['Zona waktu', ada(d.zonaWaktu)],
    ['Layar sentuh', d.sentuh === true ? 'ya' : (d.sentuh === false ? 'tidak' : NA)],
    ['Cookie diizinkan', d.cookie === true ? 'ya' : (d.cookie === false ? 'tidak' : NA)],
    ['User agent', ada(d.ua)]
  ];
};

export const meta = {"id": "info-perangkat", "name": "Info Perangkat", "cat": "developer", "icon": "📱", "desc": "Spesifikasi HP atau laptopmu, dibaca langsung dari browser.", "keywords": "perangkat,device,spesifikasi,ram,cpu,gpu,baterai,user agent", "since": "6.11.0"};

export function render(root) {
  const box = T.out();
  root.appendChild(T.el('<p class="note">Semua angka di bawah dibaca dari browsermu saat ini. Tidak ada yang dikirim ke mana-mana.</p>'));
  root.appendChild(T.btn('Tampilkan info perangkat', mulai, true));
  root.appendChild(box);

  function gpuDariWebGL() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return null;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return 'terdeteksi, tapi namanya disembunyikan browser';
      return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null;
    } catch (e) { return null; }
  }

  async function mulai() {
    T.show(box, '<span class="dim">Membaca info perangkat…</span>');
    const nav = navigator;
    let bateraiLevel = null, bateraiIsi = null;
    if (nav.getBattery) {
      try {
        const b = await Promise.race([
          nav.getBattery(),
          new Promise((res) => setTimeout(() => res(null), 3000))
        ]);
        if (b) { bateraiLevel = b.level; bateraiIsi = b.charging; }
      } catch (e) { /* baterai tidak bisa dibaca */ }
    }
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const d = {
      lebarLayar: window.screen ? window.screen.width : null,
      tinggiLayar: window.screen ? window.screen.height : null,
      lebarJendela: window.innerWidth || null,
      tinggiJendela: window.innerHeight || null,
      kerapatan: window.devicePixelRatio || null,
      core: nav.hardwareConcurrency || null,
      ram: nav.deviceMemory || null,
      gpu: gpuDariWebGL(),
      bateraiLevel, bateraiIsi,
      koneksi: conn ? (conn.effectiveType || conn.type || null) : null,
      kecepatan: conn && conn.downlink ? conn.downlink : null,
      online: typeof nav.onLine === 'boolean' ? nav.onLine : null,
      platform: nav.platform || null,
      bahasa: nav.language || null,
      zonaWaktu: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return null; } })(),
      sentuh: ('ontouchstart' in window) || (nav.maxTouchPoints > 0),
      cookie: nav.cookieEnabled,
      ua: nav.userAgent || null
    };
    const baris = utils.infoPerangkatBaris(d);
    T.show(box, kvRows(baris));
    const teks = baris.map((b) => b[0] + ': ' + b[1]).join('\n');
    box.appendChild(T.copyBtn(() => teks, 'Salin semua info'));
  }
}
