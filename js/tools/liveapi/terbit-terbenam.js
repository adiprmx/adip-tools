import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "terbit-terbenam", "name": "Terbit & Terbenam", "cat": "liveapi", "icon": "🌅", "desc": "Jadwal matahari terbit & terbenam + hitung mundur.", "keywords": "matahari,terbit,terbenam,sunrise,sunset,jadwal,shubuh,maghrib"};
export function render(root) {

    const KOTA = [
      ['Jakarta', -6.2088, 106.8456],
      ['Surabaya', -7.2575, 112.7521],
      ['Bandung', -6.9175, 107.6191],
      ['Medan', 3.5952, 98.6722],
      ['Semarang', -6.9667, 110.4167],
      ['Makassar', -5.1477, 119.4327],
      ['Palembang', -2.9761, 104.7754],
      ['Denpasar', -8.6705, 115.2126],
      ['Yogyakarta', -7.7956, 110.3695],
      ['Balikpapan', -1.2654, 116.8312],
    ];

    let lastCity = 'Jakarta';
    try { lastCity = localStorage.getItem('sunset-city') || 'Jakarta'; } catch (e) {}

    const kotaSel = T.select(KOTA.map((k) => [k[0], k[0]]), lastCity);
    const box = T.out();
    const cdBox = T.out();
    let timer = null, nextEvent = null;
    T.onLeave(() => { if (timer) clearInterval(timer); });

    const jamWIB = (iso) => new Date(iso).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
    });
    const p2 = (n) => String(n).padStart(2, '0');

    const stopCountdown = () => { if (timer) { clearInterval(timer); timer = null; } nextEvent = null; };

    const mulaiCountdown = (targetMs, label) => {
      stopCountdown();
      nextEvent = { targetMs, label };
      const tick = () => {
        const sisa = nextEvent.targetMs - Date.now();
        if (sisa <= 0) { T.show(cdBox, '<p class="center">☀️ <b>' + T.esc(label) + ' sudah tiba!</b></p>'); stopCountdown(); return; }
        const j = Math.floor(sisa / 3600000), m = Math.floor(sisa % 3600000 / 60000), s = Math.floor(sisa % 60000 / 1000);
        T.show(cdBox,
          '<div class="center"><div class="mut">' + T.esc(label) + ' dalam</div>' +
          '<div class="big" style="font-variant-numeric:tabular-nums">' + p2(j) + ':' + p2(m) + ':' + p2(s) + '</div>' +
          '<div class="hint">jam : menit : detik</div></div>');
      };
      tick();
      timer = setInterval(tick, 1000);
    };

    const muat = async (lat, lng, namaLokasi, tanggal) => {
      stopCountdown();
      T.hide(cdBox);
      T.show(box, '<p class="center mut">Menghitung jadwal matahari buat ' + T.esc(namaLokasi) + '…</p>');
      try {
        let url = 'https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lng + '&formatted=0';
        if (tanggal) url += '&date=' + tanggal;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        if (d.status !== 'OK' || !d.results || !d.results.sunrise) throw new Error('data tidak valid');
        const r = d.results;
        const terbit = new Date(r.sunrise).getTime();
        const terbenam = new Date(r.sunset).getTime();
        const dur = terbenam - terbit;
        const dj = Math.floor(dur / 3600000), dm = Math.floor(dur % 3600000 / 60000);
        const tglLabel = tanggal
          ? new Date(tanggal + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
          : 'hari ini';
        T.show(box,
          '<div class="center"><div class="mut">' + T.esc(namaLokasi) + ' · ' + T.esc(tglLabel) + '</div></div>' +
          '<div class="grid2" style="margin-top:8px">' +
          '<div class="center"><div style="font-size:34px">🌅</div><div class="mut">Terbit</div><div class="big" style="font-size:24px">' + T.esc(jamWIB(r.sunrise)) + '</div></div>' +
          '<div class="center"><div style="font-size:34px">🌇</div><div class="mut">Terbenam</div><div class="big" style="font-size:24px">' + T.esc(jamWIB(r.sunset)) + '</div></div></div>' +
          '<div class="kv"><span class="k">Durasi siang</span><span class="v">' + dj + ' jam ' + dm + ' menit</span></div>' +
          '<p class="hint">Waktu dalam WIB.</p>'
        );
        const now = Date.now();
        if (!tanggal) {
          if (now < terbit) mulaiCountdown(terbit, 'Matahari terbit');
          else if (now < terbenam) mulaiCountdown(terbenam, 'Matahari terbenam');
          else {
            T.show(cdBox, '<p class="center mut">Matahari hari ini sudah terbenam. Mau intip jadwal besok?</p>');
            const wr = T.el('<div class="center" style="margin-top:8px"></div>');
            const besok = new Date(now + 86400000).toISOString().slice(0, 10);
            wr.appendChild(T.btn('Lihat jadwal besok', () => muat(lat, lng, namaLokasi, besok)));
            cdBox.appendChild(wr);
          }
        }
      } catch (e) {
        T.show(box,
          '<p class="center">🌤️ <b>Waduh, jadwal mataharinya gagal dimuat.</b></p>' +
          '<p class="center mut">Cek koneksi internet kamu, terus coba lagi ya.</p>' +
          '<p class="center hint">(' + T.esc(e.message || e) + ')</p>');
        const wr = T.el('<div class="center" style="margin-top:8px"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', () => pakaiKota(), true));
        box.appendChild(wr);
      }
    };

    const pakaiKota = () => {
      const nama = kotaSel.value;
      try { localStorage.setItem('sunset-city', nama); } catch (e) {}
      const k = KOTA.find((x) => x[0] === nama) || KOTA[0];
      muat(k[1], k[2], k[0]);
    };

    const pakaiGPS = () => {
      if (!navigator.geolocation) {
        T.show(box, '<p class="center mut">Browser kamu nggak dukung geolocation — pilih kota dari daftar aja ya.</p>');
        return;
      }
      T.show(box, '<p class="center mut">Minta izin lokasi…</p>');
      navigator.geolocation.getCurrentPosition(
        (pos) => muat(pos.coords.latitude, pos.coords.longitude, 'Lokasimu'),
        (err) => {
          const msg = err && err.code === 1
            ? 'Izin lokasi ditolak — gapapa, pilih aja kotamu dari daftar di atas.'
            : 'Gagal baca lokasi (' + (err && err.message ? err.message : 'unknown') + ') — pilih kota dari daftar aja.';
          T.show(box, '<p class="center mut">📍 ' + T.esc(msg) + '</p>');
        },
        { timeout: 10000 }
      );
    };

    kotaSel.addEventListener('change', pakaiKota);

    root.appendChild(T.el('<p class="mut" style="margin-top:0">Pilih kotamu, atau pakai GPS biar pas sama lokasimu sekarang.</p>'));
    root.appendChild(T.field('Kota', kotaSel));
    root.appendChild(T.row(
      T.btn('Tampilkan jadwal', pakaiKota, true),
      T.btn('📍 Pakai lokasiku', pakaiGPS)
    ));
    root.appendChild(box);
    root.appendChild(cdBox);
    pakaiKota();

}
