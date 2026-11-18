import { h as T, esc, errBox } from '../../core.js';

// Data Formula 1 lewat OpenF1 (tanpa key).
// Terverifikasi 18 Nov 2026: api.openf1.org/v1/meetings 200, CORS *.
const API = 'https://api.openf1.org/v1';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const meta = {"id": "data-f1-live", "name": "Data F1 Live", "cat": "liveapi", "icon": "🏎️", "desc": "Jadwal balapan Formula 1 per musim, sesi tiap seri, dan daftar pembalapnya.", "keywords": "f1,formula 1,balapan,pembalap,grand prix,jadwal f1,openf1", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const detailBox = T.out();
  const thn = new Date().getFullYear();
  const tahunS = T.select([[String(thn), String(thn)], [String(thn - 1), String(thn - 1)], [String(thn - 2), String(thn - 2)], ['2023', '2023']], String(thn));

  const gagal = (pesan, ulang) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', ulang || muat));
    box.appendChild(w);
  };

  const muatSesi = async (meetingKey, nama) => {
    T.show(detailBox, '<p class="mut">Mengambil sesi ' + esc(nama) + '…</p>');
    try {
      const sesi = await getJSON(API + '/sessions?meeting_key=' + encodeURIComponent(meetingKey));
      if (!Array.isArray(sesi) || !sesi.length) {
        T.show(detailBox, '<p class="center dim">Tidak ada sesi yang tercatat untuk seri ini.</p>');
        return;
      }
      T.show(detailBox, '<p style="margin-top:6px"><b>Sesi ' + esc(nama) + '</b></p>' +
        sesi.map((s) => '<div class="kv"><span class="k">' + esc(String(s.session_name || 'Sesi')) + '</span><span class="v">' + esc(tglCantik(s.date_start)) + '</span></div>').join('') +
        '<p style="margin-top:10px"><button class="btn" id="f1-drivers">Lihat pembalap seri ini</button></p>');
      const b = detailBox.querySelector('#f1-drivers');
      if (b) b.addEventListener('click', () => muatPembalap(meetingKey, sesi[sesi.length - 1].session_key, nama));
    } catch (e) {
      T.show(detailBox, errBox('Sesi gagal diambil. Cek koneksi internet, lalu coba lagi.'));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', () => muatSesi(meetingKey, nama)));
      detailBox.appendChild(w);
    }
  };

  const muatPembalap = async (meetingKey, sessionKey, nama) => {
    T.show(detailBox, '<p class="mut">Mengambil daftar pembalap ' + esc(nama) + '…</p>');
    try {
      const list = await getJSON(API + '/drivers?meeting_key=' + encodeURIComponent(meetingKey) + '&session_key=' + encodeURIComponent(sessionKey));
      if (!Array.isArray(list) || !list.length) {
        T.show(detailBox, '<p class="center dim">Tidak ada pembalap yang tercatat untuk seri ini.</p>');
        return;
      }
      const unik = [];
      const sudah = new Set();
      list.forEach((d) => { if (d.driver_number != null && !sudah.has(d.driver_number)) { sudah.add(d.driver_number); unik.push(d); } });
      unik.sort((a, b) => Number(a.driver_number) - Number(b.driver_number));
      T.show(detailBox, '<p style="margin-top:6px"><b>Pembalap ' + esc(nama) + '</b> (' + unik.length + ' orang)</p>' +
        unik.map((d) => '<div class="kv"><span class="k"><b>#' + esc(String(d.driver_number)) + ' ' + esc(String(d.full_name || d.broadcast_name || 'Tanpa nama')) + '</b>' +
          '<br><span class="hint">' + esc(String(d.team_name || '')) + '</span></span>' +
          '<span class="v">' + esc(String(d.country_code || '')) + '</span></div>').join(''));
    } catch (e) {
      T.show(detailBox, errBox('Daftar pembalap gagal diambil. Cek koneksi internet, lalu coba lagi.'));
      const w = T.el('<div style="margin-top:8px"></div>');
      w.appendChild(T.btn('Coba lagi', () => muatPembalap(meetingKey, sessionKey, nama)));
      detailBox.appendChild(w);
    }
  };

  const muat = async () => {
    const tahun = tahunS.value;
    T.hide(detailBox);
    T.show(box, '<p class="mut">Mengambil jadwal F1 musim ' + esc(tahun) + '…</p>');
    try {
      const j = await getJSON(API + '/meetings?year=' + encodeURIComponent(tahun));
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada jadwal balapan untuk musim ' + esc(tahun) + ' di data ini. Coba tahun lain.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + j.length + ' seri di musim ' + esc(tahun) + '. Ketuk satu seri untuk melihat sesi dan pembalapnya.</p>' +
        j.map((m) => '<div class="kv" data-meeting="' + (Number(m.meeting_key) || 0) + '" data-nama="' + esc(String(m.meeting_name || '')) + '" style="cursor:pointer" role="button" tabindex="0">' +
          '<span class="k"><b>' + esc(String(m.meeting_name || 'Tanpa nama')) + '</b><br><span class="hint">' + esc(String(m.location || '')) + (m.country_name ? ', ' + esc(String(m.country_name)) : '') + '</span></span>' +
          '<span class="v">' + esc(tglCantik(m.date_start)) + '</span></div>').join('') +
        '<p class="hint">Sumber: OpenF1 (data resmi Formula 1).</p>');
      box.querySelectorAll('[data-meeting]').forEach((el) => {
        const buka = () => muatSesi(el.getAttribute('data-meeting'), el.getAttribute('data-nama') || '');
        el.addEventListener('click', buka);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buka(); } });
      });
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server OpenF1 tidak merespons dalam 15 detik.'
        : 'Jadwal F1 gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Jadwal seri Formula 1 per musim. Ketuk satu seri untuk melihat sesi latihannya, kualifikasi, balapan, dan siapa saja pembalapnya.</p>'));
  root.appendChild(T.field('Musim', tahunS));
  root.appendChild(T.row(T.btn('Lihat jadwal', muat, true)));
  root.appendChild(box);
  root.appendChild(detailBox);
  muat();
}
