import { h as T, esc, errBox } from '../../core.js';

// Status server Minecraft lewat minetools, tanpa key.
// Terverifikasi 17 Nov 2026: /ping/mc.hypixel.net/25565 -> 200, CORS *.
// Deskripsi server mengandung kode warna Minecraft (§a, §f, dst) yang
// dibersihkan dulu sebelum tampil.
export const meta = {"id":"status-server-minecraft","name":"Status Server Minecraft","cat":"liveapi","icon":"⛏️","desc":"Cek apakah server Minecraft sedang online, berapa pemainnya, dan versi apa yang dipakai.","keywords":"minecraft,server minecraft,status server,ping,mc,hypixel,pemain","since":"6.17.0", "online": true};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Kode warna Minecraft (§ + satu karakter) dihapus, baris baru dirapikan.
const bersih = (s) => String(s || '').replace(/§[0-9a-fk-or]/gi, '').replace(/\s+/g, ' ').trim();

// Validasi host (RED-G2-03): hanya hostname publik ber-domain atau alamat
// IPv4 publik. Ditolak: URL lengkap, spasi, '@', ':', localhost, nama
// jaringan lokal (.local/.lan/.internal/.home), dan IP privat/loopback/
// link-local — supaya tool ini tidak dipakai menyuruh minetools memindai
// host sembarangan. Murni, bisa diuji di Node.
export function hostValid(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h || h.length > 253) return false;
  if (/[\s/@:?#[\]\\]/.test(h)) return false;
  if (h === 'localhost' || h.startsWith('localhost.') || h.endsWith('.localhost')) return false;
  if (/\.(local|lan|internal|home|intranet|localdomain)$/.test(h)) return false;
  // Notasi IP non-desimal (0x.. heksa / 0.. oktal): resolver gaya inet_aton
  // membacanya sebagai IP walau terlihat seperti hostname (RED-G2-16).
  if (h.split('.').some((p) => /^0x[0-9a-f]+$/i.test(p) || /^0\d+$/.test(p))) return false;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const o = ipv4.slice(1).map(Number);
    if (o.some((v) => v > 255)) return false;
    // 0/8, 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16.
    if (o[0] === 0 || o[0] === 10 || o[0] === 127) return false;
    if (o[0] === 169 && o[1] === 254) return false;
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return false;
    if (o[0] === 192 && o[1] === 168) return false;
    return true;
  }
  // Hostname publik: label huruf/angka/tanda hubung, minimal satu titik.
  if (h.indexOf('.') === -1) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(h);
}

export function render(root) {
  const box = T.out();
  const hostI = T.input('text', 'Contoh: mc.hypixel.net', 'mc.hypixel.net');
  hostI.setAttribute('autocomplete', 'off');
  hostI.setAttribute('autocapitalize', 'off');
  const portI = T.input('number', 'Port, biasanya 25565', '25565');
  portI.setAttribute('min', '1');
  portI.setAttribute('max', '65535');

  const cek = async () => {
    const host = String(hostI.value || '').trim();
    const port = Number(portI.value);
    if (!host) { T.show(box, errBox('Tulis alamat server dulu.')); return; }
    if (!hostValid(host)) {
      T.show(box, errBox('Alamat server tidak valid. Tulis nama domain publik (contoh: mc.hypixel.net) atau alamat IP publik — tanpa awalan http://, tanpa spasi, dan bukan alamat jaringan lokal.'));
      return;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      T.show(box, errBox('Port harus angka 1 sampai 65535. Port standar Minecraft adalah 25565.'));
      return;
    }
    T.show(box, '<p class="mut">Mengecek server ' + esc(host) + '…</p>');
    try {
      const j = await getJSON('https://api.minetools.eu/ping/' + encodeURIComponent(host) + '/' + port);
      if (!j || j.error) {
        T.show(box,
          '<div class="center"><div style="font-weight:800;font-size:18px">Server offline</div>' +
          '<div class="dim" style="font-size:13px;margin-top:4px">' + esc(host) + ':' + esc(String(port)) + ' tidak bisa dihubungi. Server mungkin sedang mati atau alamatnya salah.</div></div>');
        return;
      }
      const pemain = j.players || {};
      const versi = (j.version && j.version.name) || '';
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px">Server online</div>' +
        '<div class="dim" style="font-size:13px;margin-top:2px">' + esc(host) + ':' + esc(String(port)) + '</div></div>' +
        (j.description ? '<p class="hint center" style="margin-top:8px">' + esc(bersih(j.description).slice(0, 200)) + '</p>' : '') +
        '<div style="margin-top:12px">' +
        (typeof pemain.online === 'number' ? '<div class="kv"><span class="k">Pemain online</span><span class="v">' + T.fmt(pemain.online) + (typeof pemain.max === 'number' ? ' dari ' + T.fmt(pemain.max) : '') + '</span></div>' : '') +
        (versi ? '<div class="kv"><span class="k">Versi</span><span class="v">' + esc(versi) + '</span></div>' : '') +
        (typeof j.latency === 'number' ? '<div class="kv"><span class="k">Waktu respons</span><span class="v">' + esc(String(Math.round(j.latency))) + ' ms</span></div>' : '') +
        '</div>' +
        '<p class="hint">Sumber: minetools. Waktu respons diukur dari server minetools, bukan dari perangkatmu.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server minetools tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengecek server. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cek));
      box.appendChild(wr);
    }
  };

  hostI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cek(); });
  root.appendChild(T.el('<p class="note">Tulis alamat server Minecraft untuk melihat apakah sedang online, berapa pemainnya, dan versi apa yang dipakai. Alamat yang kamu tulis dikirim ke minetools untuk di-ping dari server mereka.</p>'));
  root.appendChild(T.grid2(T.field('Alamat server', hostI, 'Contoh: mc.hypixel.net'), T.field('Port', portI, 'Standar: 25565')));
  root.appendChild(T.row(T.btn('⛏️ Cek server', cek, true)));
  root.appendChild(box);
}
