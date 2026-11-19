import { h as T, errBox } from '../../core.js';

// Waktu relatif bahasa Indonesia untuk format :R Discord.
export function relativeId(diffDetik) {
  const d = Math.round(diffDetik);
  const depan = d > 0;
  const a = Math.abs(d);
  const kata = (n, satuan) => (depan ? 'dalam ' : '') + n + ' ' + satuan + (depan ? '' : ' yang lalu');
  if (a < 45) return 'baru saja';
  if (a < 90) return depan ? 'dalam 1 menit' : '1 menit yang lalu';
  if (a < 3600) return kata(Math.round(a / 60), 'menit');
  if (a < 5400) return depan ? 'dalam 1 jam' : '1 jam yang lalu';
  if (a < 86400) return kata(Math.round(a / 3600), 'jam');
  if (a < 129600) return depan ? 'dalam 1 hari' : '1 hari yang lalu';
  if (a < 2592000) return kata(Math.round(a / 86400), 'hari');
  if (a < 3888000) return depan ? 'dalam 1 bulan' : '1 bulan yang lalu';
  if (a < 31536000) return kata(Math.round(a / 2592000), 'bulan');
  return kata(Math.round(a / 31536000), 'tahun');
}

// 8 kode timestamp Discord (7 gaya + bentuk default yang sama dengan :f).
// preview dihitung di zona waktu perangkat ini, hanya contoh tampilan.
export function discordTimestamps(unix, nowMs) {
  const dt = new Date(unix * 1000);
  const now = nowMs != null ? nowMs : Date.now();
  const fmt = (opts) => new Intl.DateTimeFormat('id-ID', opts).format(dt);
  const jam = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
  const jamDetik = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tgl = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' });
  const tglPanjang = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
  return [
    { style: '', code: '<t:' + unix + '>', label: 'Tanggal + jam', preview: tglPanjang + ' ' + jam },
    { style: 't', code: '<t:' + unix + ':t>', label: 'Jam saja', preview: jam },
    { style: 'T', code: '<t:' + unix + ':T>', label: 'Jam + detik', preview: jamDetik },
    { style: 'd', code: '<t:' + unix + ':d>', label: 'Tanggal saja', preview: tgl },
    { style: 'D', code: '<t:' + unix + ':D>', label: 'Tanggal panjang', preview: tglPanjang },
    { style: 'f', code: '<t:' + unix + ':f>', label: 'Tanggal + jam', preview: tglPanjang + ' ' + jam },
    { style: 'F', code: '<t:' + unix + ':F>', label: 'Tanggal panjang + jam + detik', preview: tglPanjang + ' ' + jamDetik },
    { style: 'R', code: '<t:' + unix + ':R>', label: 'Waktu relatif', preview: relativeId(unix - now / 1000) },
  ];
}

export const meta = {"id": "generator-timestamp-discord", "name": "Generator Timestamp Discord", "cat": "developer", "icon": "🕐", "desc": "Buat kode waktu Discord yang tampil sesuai zona waktu tiap pembaca.", "keywords": "discord,timestamp,waktu,tanggal,kode,unix,epoch", "since": "6.18.0"};
export function render(root) {

    const dtInp = T.input('datetime-local', '');
    const box = T.out();

    const isiSekarang = () => {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      dtInp.value = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    };

    const buat = () => {
      if (!dtInp.value) { T.show(box, errBox('Pilih dulu tanggal dan jamnya, atau tekan Sekarang.')); return; }
      const ms = new Date(dtInp.value).getTime();
      if (!Number.isFinite(ms)) { T.show(box, errBox('Tanggal dan jamnya tidak bisa dibaca.')); return; }
      const unix = Math.floor(ms / 1000);
      const list = discordTimestamps(unix);
      let html = '<div class="kv"><span class="k">Detik Unix</span><span class="v" style="font-family:ui-monospace,monospace">' + unix + '</span></div>';
      html += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">' + list.map((it) =>
        '<div style="border:1px solid #ffffff15;border-radius:10px;padding:10px 12px">' +
        '<div style="font-size:13px"><b>' + T.esc(it.label) + '</b> <span class="dim">· contoh tampilan: ' + T.esc(it.preview) + '</span></div>' +
        '<div style="font-family:ui-monospace,monospace;font-size:13px;margin-top:4px;word-break:break-all">' + T.esc(it.code) + '</div>' +
        '<div style="margin-top:6px"><button type="button" class="btn" data-copy="' + T.esc(it.code) + '">Salin</button></div>' +
        '</div>'
      ).join('') + '</div>';
      T.show(box, html);
      box.querySelectorAll('button[data-copy]').forEach((b) => {
        b.addEventListener('click', () => {
          const kode = b.getAttribute('data-copy');
          T.copy(kode);
          b.textContent = '✓ Tersalin';
          setTimeout(() => { b.textContent = 'Salin'; }, 1600);
        });
      });
    };

    isiSekarang();
    root.appendChild(T.field('Tanggal dan jam', dtInp));
    root.appendChild(T.row(T.btn('Sekarang', isiSekarang), T.btn('Buat kode', buat, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Tempel kodenya ke pesan Discord, dan tiap pembaca melihat waktu itu dalam zona waktunya sendiri. Contoh tampilan di atas memakai zona waktu perangkat ini.</div>'));

}
