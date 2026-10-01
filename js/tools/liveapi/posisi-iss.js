import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "posisi-iss", "name": "Posisi ISS", "cat": "liveapi", "icon": "🛰️", "desc": "Lacak posisi Stasiun Luar Angkasa Internasional secara live.", "keywords": "iss,satelit,posisi,stasiun luar angkasa,nasa,live"};
export function render(root) {

    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;margin-top:10px';
    const W = 640, H = 320;
    canvas.width = W; canvas.height = H;

    const trail = []; // jejak posisi terakhir [lat, lng]

    const x = (lng) => (lng + 180) / 360 * W;
    const y = (lat) => (90 - lat) / 180 * H;

    const gambarPeta = (lat, lng) => {
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, W, H);
      // laut
      c.fillStyle = '#0d1520';
      c.fillRect(0, 0, W, H);
      // grid tiap 30 derajat
      c.strokeStyle = 'rgba(255,255,255,0.10)';
      c.lineWidth = 1;
      for (let g = -150; g <= 150; g += 30) {
        c.beginPath(); c.moveTo(x(g), 0); c.lineTo(x(g), H); c.stroke();
      }
      for (let g = -60; g <= 60; g += 30) {
        c.beginPath(); c.moveTo(0, y(g)); c.lineTo(W, y(g)); c.stroke();
      }
      // ekuator agak terang
      c.strokeStyle = 'rgba(255,255,255,0.25)';
      c.beginPath(); c.moveTo(0, y(0)); c.lineTo(W, y(0)); c.stroke();
      // jejak orbit
      if (trail.length > 1) {
        c.strokeStyle = 'rgba(96,165,250,0.7)';
        c.lineWidth = 2;
        c.beginPath();
        trail.forEach(([tlat, tlng], i) => { if (i === 0) c.moveTo(x(tlng), y(tlat)); else c.lineTo(x(tlng), y(tlat)); });
        c.stroke();
      }
      // penanda ISS
      const px = x(lng), py = y(lat);
      c.strokeStyle = '#f87171';
      c.lineWidth = 2;
      c.beginPath(); c.arc(px, py, 14, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#ef4444';
      c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(248,113,113,0.5)';
      c.beginPath(); c.moveTo(px - 22, py); c.lineTo(px + 22, py); c.stroke();
      c.beginPath(); c.moveTo(px, py - 22); c.lineTo(px, py + 22); c.stroke();
    };

    const fmtKoord = (lat, lng) => {
      const la = Math.abs(lat).toFixed(2) + '° ' + (lat >= 0 ? 'LU' : 'LS');
      const lo = Math.abs(lng).toFixed(2) + '° ' + (lng >= 0 ? 'BT' : 'BB');
      return la + ', ' + lo;
    };

    let memuat = false;
    const muat = async () => {
      if (memuat) return;
      memuat = true;
      T.show(box, '<p class="center mut">Menghubungi ISS…</p>');
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        if (typeof d.latitude !== 'number' || typeof d.longitude !== 'number') throw new Error('data tidak valid');
        trail.push([d.latitude, d.longitude]);
        if (trail.length > 40) trail.shift();
        gambarPeta(d.latitude, d.longitude);
        const jam = new Date((d.timestamp || Date.now() / 1000) * 1000)
          .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const vis = d.visibility === 'daylight' ? '☀️ Siang' : d.visibility === 'eclipsed' ? '🌙 Malam' : '-';
        T.show(box,
          '<div class="center"><div class="mut">Koordinat ISS saat ini</div>' +
          '<div class="big" style="font-size:22px">' + T.esc(fmtKoord(d.latitude, d.longitude)) + '</div>' +
          '<div class="hint">Diperbarui pukul ' + T.esc(jam) + ' WIB</div></div>' +
          '<div class="kv"><span class="k">Ketinggian</span><span class="v">' + T.fmt(Math.round(d.altitude || 0)) + ' km</span></div>' +
          '<div class="kv"><span class="k">Kecepatan</span><span class="v">' + T.fmt(Math.round(d.velocity || 0)) + ' km/jam</span></div>' +
          '<div class="kv"><span class="k">Kondisi</span><span class="v">' + T.esc(vis) + '</span></div>'
        );
      } catch (e) {
        T.show(box,
          '<p class="center">🛰️ <b>Waduh, ISS-nya lagi nggak bisa dihubungi.</b></p>' +
          '<p class="center mut">Kemungkinan internet kamu lagi bermasalah atau server pelacaknya lagi istirahat. Coba lagi bentar ya.</p>' +
          '<p class="center hint">(' + T.esc(e.message || e) + ')</p>');
        const wr = T.el('<div class="center" style="margin-top:8px"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', muat, true));
        box.appendChild(wr);
      } finally {
        memuat = false;
      }
    };

    // auto-refresh tiap 10 detik (opsional)
    let timer = null;
    const autoBox = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#c9bda9;margin-top:10px;cursor:pointer"></label>');
    const autoCb = document.createElement('input');
    autoCb.type = 'checkbox';
    autoBox.appendChild(autoCb);
    autoBox.appendChild(document.createTextNode('Auto-refresh tiap 10 detik'));
    autoCb.addEventListener('change', () => {
      if (autoCb.checked) { muat(); timer = setInterval(muat, 10000); }
      else if (timer) { clearInterval(timer); timer = null; }
    });
    T.onLeave(() => { if (timer) clearInterval(timer); });

    root.appendChild(T.el('<p class="mut" style="margin-top:0">Posisi live Stasiun Luar Angkasa Internasional — muterin bumi tiap ~90 menit dengan kecepatan 27.000+ km/jam.</p>'));
    root.appendChild(T.row(T.btn('🔄 Refresh posisi', muat, true)));
    root.appendChild(autoBox);
    root.appendChild(box);
    root.appendChild(canvas);
    gambarPeta(0, 0);
    muat();

}
