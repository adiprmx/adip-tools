import { h as T, utils, errBox, kv } from '../../core.js?v=6.7.0';

export const meta = {"id": "jadwal-sholat", "name": "Jadwal Sholat", "cat": "liveapi", "icon": "🕌", "desc": "Jadwal sholat harian per kota + countdown ke waktu berikutnya.", "keywords": "jadwal,sholat,shalat,waktu,subuh,dzuhur,ashar,maghrib,isya,kota,adzan"};
export function render(root) {

    const KOTA = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Yogyakarta', 'Malang', 'Denpasar', 'Balikpapan', 'Banjarmasin', 'Manado', 'Padang', 'Pekanbaru', 'Bandar Lampung', 'Pontianak', 'Samarinda', 'Batam', 'Solo', 'Cirebon'];
    const inKota = T.input('text', 'Ketik nama kota…', 'Jakarta');
    inKota.setAttribute('list', 'dl-kota-sholat');
    inKota.setAttribute('autocomplete', 'off');
    const dl = document.createElement('datalist');
    dl.id = 'dl-kota-sholat';
    KOTA.forEach((k) => { const o = document.createElement('option'); o.value = k; dl.appendChild(o); });
    const box = T.out();
    let timer = null;
    const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
    T.onLeave(stopTimer);

    const tampil = (d, kota) => {
      const t = d.timings;
      const jam = (s) => String(s || '').slice(0, 5);
      const sholat = [
        ['Subuh', jam(t.Fajr)],
        ['Dzuhur', jam(t.Dhuhr)],
        ['Ashar', jam(t.Asr)],
        ['Maghrib', jam(t.Maghrib)],
        ['Isya', jam(t.Isha)],
      ];
      // cari waktu sholat berikutnya
      const kini = new Date();
      const keDate = (hhmm, besok) => {
        const parts = String(hhmm).split(':');
        const dt = new Date(kini);
        dt.setHours(+parts[0] || 0, +parts[1] || 0, 0, 0);
        if (besok) dt.setDate(dt.getDate() + 1);
        return dt;
      };
      let next = null;
      for (const s of sholat) {
        const dt = keDate(s[1], false);
        if (dt > kini) { next = { nama: s[0], dt }; break; }
      }
      if (!next) next = { nama: 'Subuh', dt: keDate(sholat[0][1], true) };
      const idxNext = sholat.findIndex((s) => s[0] === next.nama);
      const rows = sholat.map((s, i) =>
        '<div class="kv"' + (i === idxNext ? ' style="border:1px solid #ffffff30;border-radius:8px;padding:2px 8px"' : '') + '>' +
        '<span class="k">' + T.esc(s[0]) + (i === idxNext ? ' <span class="mut">● berikutnya</span>' : '') + '</span>' +
        '<span class="v"><b>' + T.esc(s[1]) + '</b></span></div>'
      ).join('');
      const hj = d.date && d.date.hijri;
      const hijriTxt = hj ? hj.day + ' ' + (hj.month && hj.month.en ? hj.month.en : '') + ' ' + hj.year + ' H' : '';
      const masehi = kini.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      T.show(box,
        '<p class="center"><b>' + T.esc(kota) + '</b></p>' +
        '<p class="center mut" style="margin-top:-8px">' + T.esc(masehi) + (hijriTxt ? ' · ' + T.esc(hijriTxt) : '') + '</p>' +
        rows +
        '<p class="center hint" style="margin-top:10px">Waktu sholat berikutnya</p>');
      const cd = T.el('<div class="big center"></div>');
      box.appendChild(cd);
      const tick = () => {
        const sisa = next.dt - new Date();
        if (sisa <= 0) { stopTimer(); ambil(); return; }
        const s = Math.floor(sisa / 1000);
        const p2 = (n) => String(n).padStart(2, '0');
        cd.textContent = next.nama + ' ' + p2(Math.floor(s / 3600)) + ':' + p2(Math.floor((s % 3600) / 60)) + ':' + p2(s % 60) + ' lagi';
      };
      tick();
      timer = setInterval(tick, 1000);
      box.appendChild(T.el('<p class="hint">Metode perhitungan: Kemenag RI. Data: Aladhan API.</p>'));
    };

    const ambil = async () => {
      const kota = inKota.value.trim();
      if (!kota) { T.show(box, errBox('Isi dulu nama kotanya ya.')); return; }
      stopTimer();
      T.show(box, '<p class="mut">Mengambil jadwal sholat ' + T.esc(kota) + '…</p>');
      try {
        const r = await fetch('https://api.aladhan.com/v1/timingsByCity?city=' + encodeURIComponent(kota) + '&country=Indonesia&method=20');
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        const d = j && j.data;
        if (!d || !d.timings || !d.timings.Fajr) throw new Error('bad-data');
        tampil(d, kota);
      } catch (e) {
        T.show(box, errBox('Gagal ambil jadwal, cek koneksi internet atau coba kota lain.'));
      }
    };

    inKota.addEventListener('keydown', (e) => { if (e.key === 'Enter') ambil(); });
    root.appendChild(T.field('Kota', inKota, 'Pilih dari daftar atau ketik kota lain di Indonesia.'));
    root.appendChild(dl);
    root.appendChild(T.row(T.btn('Lihat jadwal', ambil, true)));
    root.appendChild(box);

}
