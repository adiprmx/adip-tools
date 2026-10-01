import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"arah-kiblat","name":"Arah Kiblat","cat":"liveapi","icon":"🧭","desc":"Cari arah kiblat dari lokasimu.","keywords":"kiblat,kabah,ka'bah,kompas,arah,sholat"};

const KAA = { lat: 21.4225, lon: 39.8262 }; // Ka'bah, Mekkah
const DIRS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const idNum = (n, dec) => Number(n).toFixed(dec).replace('.', ',');
const idInt = (n) => Math.round(n).toLocaleString('id-ID');

function bearing(lat1, lon1) {
  const dLon = toRad(KAA.lon - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(KAA.lat));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(KAA.lat)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(KAA.lat)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceKm(lat1, lon1) {
  const R = 6371;
  const dLat = toRad(KAA.lat - lat1), dLon = toRad(KAA.lon - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(KAA.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function render(root) {
  const statusBox = T.out();
  const resBox = T.out();
  const manualWrap = T.el('<div hidden></div>');
  const latI = T.input('text', 'cth: -6,2088', ''); latI.inputMode = 'decimal';
  const lonI = T.input('text', 'cth: 106,8456', ''); lonI.inputMode = 'decimal';

  const compass = (deg) => {
    const c = T.el(
      '<div style="position:relative;width:230px;height:230px;border-radius:50%;border:2px solid #3f3f46;margin:18px auto;background:radial-gradient(circle at 50% 50%,#1c1c1f 0%,#121214 70%)">' +
      '<span style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-weight:700;font-size:15px">U</span>' +
      '<span style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:13px;color:#8e8e96">S</span>' +
      '<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:13px;color:#8e8e96">T</span>' +
      '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:#8e8e96">B</span>' +
      '<div class="needle" style="position:absolute;left:50%;top:50%;width:5px;height:96px;border-radius:3px;background:linear-gradient(to top,#3f3f46 0 46%,#fb7185 54% 100%);transform:translate(-50%,-100%) rotate(' + deg + 'deg);transform-origin:50% 100%"></div>' +
      '<div style="position:absolute;left:50%;top:50%;width:14px;height:14px;border-radius:50%;background:#fafafa;border:3px solid #27272a;transform:translate(-50%,-50%)"></div>' +
      '</div>'
    );
    return c;
  };

  function show(lat, lon, label) {
    const deg = bearing(lat, lon);
    const km = distanceKm(lat, lon);
    const arah = DIRS[Math.round(deg / 45) % 8];
    T.show(resBox, '');
    const big = T.el(
      '<div class="center" style="margin:6px 0 2px"><div class="big" style="font-size:42px;font-weight:800">' + idNum(deg, 1) + '°</div>' +
      '<div class="mut" style="font-size:14px">dari utara, ke arah <b>' + arah + '</b></div>' +
      '<div class="hint" style="margin-top:4px">' + label + ' · jarak ±' + idInt(km) + ' km ke Ka\u2019bah</div></div>'
    );
    resBox.appendChild(big);
    resBox.appendChild(compass(deg.toFixed(1)));
    resBox.appendChild(T.el('<p class="hint center" style="max-width:340px;margin:0 auto;font-size:12.5px;line-height:1.6">Jarum merah muda nunjuk arah kiblat <b>relatif ke utara geografis</b>. Kalau HP kamu nggak punya sensor kompas, cocokkan dulu arah utaranya pakai kompas beneran ya.</p>'));
  }

  function errMsg(code) {
    if (code === 1) return 'Akses lokasi ditolak — santai, isi koordinat manual di bawah aja.';
    if (code === 2) return 'Lokasi nggak kebaca nih. Coba lagi atau isi manual di bawah.';
    if (code === 3) return 'Kelamaan nunggu lokasi. Coba lagi atau isi manual di bawah.';
    return 'Lokasinya nggak dapet. Isi manual di bawah ya.';
  }

  function locate() {
    T.hide(resBox);
    if (!navigator.geolocation) {
      T.show(statusBox, '<div class="hint">HP/browser ini nggak dukung geolocation. Isi manual aja di bawah.</div>');
      manualWrap.hidden = false;
      return;
    }
    T.show(statusBox, '<div class="hint">Lagi nyari posisimu…</div>');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        T.hide(statusBox);
        show(pos.coords.latitude, pos.coords.longitude,
          idNum(pos.coords.latitude, 4) + ', ' + idNum(pos.coords.longitude, 4));
      },
      (err) => {
        T.show(statusBox, '<div class="hint">' + errMsg(err && err.code) + '</div>');
        manualWrap.hidden = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  const parseCoord = (v) => {
    const s = String(v == null ? '' : v).trim().replace(/\s/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const hitungManual = () => {
    const la = parseCoord(latI.value), lo = parseCoord(lonI.value);
    if (!Number.isFinite(la) || la < -90 || la > 90) { T.toast('Latitude-nya belum bener (rentang -90 s/d 90)'); return; }
    if (!Number.isFinite(lo) || lo < -180 || lo > 180) { T.toast('Longitude-nya belum bener (rentang -180 s/d 180)'); return; }
    T.hide(statusBox);
    show(la, lo, idNum(la, 4) + ', ' + idNum(lo, 4));
  };

  manualWrap.appendChild(T.el('<div class="fld"><label>Atau isi koordinat manual</label></div>'));
  manualWrap.appendChild(T.grid2(T.field('Latitude', latI), T.field('Longitude', lonI)));
  manualWrap.appendChild(T.row(T.btn('Hitung Arah Kiblat', hitungManual, true)));
  manualWrap.appendChild(T.el('<p class="hint" style="font-size:12.5px;line-height:1.6">Nggak tahu koordinatmu? Buka Google Maps, tahan titik lokasimu, angka lat/lon-nya muncul di bawah (pakai koma desimal ala Indonesia juga bisa, mis. -6,2088).</p>'));

  const manualLink = T.el('<button type="button" class="btn" style="background:none;border:none;color:#a1a1aa;text-decoration:underline;padding:4px 0">isi koordinat manual</button>');
  manualLink.addEventListener('click', () => { manualWrap.hidden = false; manualLink.style.display = 'none'; });

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pencet tombolnya, izinkan akses lokasi, langsung ketahuan kiblat ngadep ke mana dari tempatmu berdiri.</p>'));
  root.appendChild(T.row(T.btn('📍 Gunakan Lokasi Saya', locate, true)));
  root.appendChild(T.el('<div class="center"></div>').appendChild(manualLink).parentNode);
  root.appendChild(statusBox);
  root.appendChild(manualWrap);
  root.appendChild(resBox);
}
