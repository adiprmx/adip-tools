import { h as T, utils, parseISO, todayISO } from '../../core.js?v=6.4.0';

export const meta = {"id": "hitung-1000-hari", "name": "Hitung 1000 Hari", "cat": "indonesia", "icon": "🕊️", "desc": "Tanggal selamatan 40, 100 & 1000 hari + pasaran Jawa.", "keywords": "1000 hari,selamatan,wafat,meninggal,pasaran,jawa,haul"};
export function render(root) {
  // Pasaran Jawa: patokan 17 Agustus 1945 = Jumat Legi (anchor dari tool Weton Jawa)
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const ANCHOR = Date.UTC(1945, 7, 17);
  const pasaranOf = (t) => PASARAN[(((Math.round((t - ANCHOR) / 86400000) % 5) + 5) % 5)];
  const fmtTgl = (t) => {
    const d = new Date(t);
    return HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  };
  const todayT = parseISO(todayISO()).getTime();

  const tgl = T.input('date');
  const box = T.out();
  const hitung = () => {
    if (!tgl.value) { T.show(box, '<p class="hint">Pilih tanggal wafatnya dulu ya.</p>'); return; }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tgl.value);
    if (!m) { T.show(box, '<p class="hint">Tanggalnya nggak kebaca, coba pilih ulang.</p>'); return; }
    const t0 = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const daftar = [
      ['40 harian', 39],
      ['100 harian', 99],
      ['1000 harian', 999],
    ];
    let html = '<p class="center mut">Turut berduka cita. Semoga almarhum/almarhumah husnul khotimah.</p>';
    html += daftar.map(([label, off]) => {
      const t = t0 + off * 86400000;
      const sisa = Math.round((t - todayT) / 86400000);
      const status = sisa > 0 ? ' <span class="mut">(' + sisa + ' hari lagi)</span>'
        : sisa === 0 ? ' <span class="mut">(hari ini)</span>'
        : ' <span class="mut">(sudah lewat)</span>';
      return '<p class="center" style="margin:14px 0 2px">' + T.esc(label) + '</p>' +
        '<div class="big center">' + T.esc(fmtTgl(t)) + '</div>' +
        '<p class="center hint">' + T.esc(HARI[new Date(t).getUTCDay()] + ' ' + pasaranOf(t)) + status + '</p>';
    }).join('');
    html += '<p class="hint">Konvensi hitungan: hari wafat dihitung sebagai hari ke-1, jadi 40 harian = wafat + 39 hari, 100 harian = +99 hari, 1000 harian = +999 hari. Pasaran Jawa dihitung dari patokan 17 Agustus 1945 = Jumat Legi.</p>';
    T.show(box, html);
  };
  tgl.addEventListener('change', hitung);
  root.appendChild(T.field('Tanggal wafat', tgl, 'Tanggal berpulangnya almarhum/almarhumah.'));
  root.appendChild(T.row(T.btn('Hitung tanggal selamatan', hitung, true)));
  root.appendChild(box);
}
