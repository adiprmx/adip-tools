import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-sensor", "name": "Tes Sensor Gerak", "cat": "sehari", "icon": "🧭", "desc": "Cek sensor gerak HP: kemiringan, putaran, dan getaran.", "keywords": "sensor,accelerometer,giroskop,kemiringan,gerak", "since": "6.11.0"};

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Miringkan atau gerakkan HP setelah tes dimulai. Angka berubah mengikuti gerakan. Sensor gerak umumnya hanya ada di HP dan tablet, bukan di laptop.</p>');
  const stateBox = T.out();

  const tiltWrap = T.el('<div hidden></div>');
  const tiltBox = T.el('<div style="position:relative;width:100%;height:160px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.03);overflow:hidden"></div>');
  const tiltDot = T.el('<div style="position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;left:50%;top:50%;transform:translate(-50%,-50%)"></div>');
  const tiltCross = T.el('<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.12)"></div>');
  const tiltCross2 = T.el('<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,.12)"></div>');
  tiltBox.appendChild(tiltCross);
  tiltBox.appendChild(tiltCross2);
  tiltBox.appendChild(tiltDot);
  tiltWrap.appendChild(tiltBox);
  tiltWrap.appendChild(T.el('<p class="mut center" style="font-size:12px">Titik putih mengikuti kemiringan HP</p>'));
  const dataBox = T.out();

  let gotData = false, noDataTimer = null;
  let lastMotion = null, lastOrient = null;

  const fmt = (v, unit) => (v == null || isNaN(v)) ? 'Tidak terbaca' : (Math.round(v * 10) / 10) + ' ' + unit;

  const paint = () => {
    let html = '';
    if (lastMotion) {
      const a = lastMotion.accelerationIncludingGravity || {};
      const r = lastMotion.rotationRate || {};
      html += kv('Percepatan X', fmt(a.x, 'm/detik²')) +
        kv('Percepatan Y', fmt(a.y, 'm/detik²')) +
        kv('Percepatan Z', fmt(a.z, 'm/detik²')) +
        kv('Putaran α', fmt(r.alpha, '°/detik')) +
        kv('Putaran β', fmt(r.beta, '°/detik')) +
        kv('Putaran γ', fmt(r.gamma, '°/detik'));
    }
    if (lastOrient) {
      html += kv('Arah kompas (α)', fmt(lastOrient.alpha, '°')) +
        kv('Miring depan-belakang (β)', fmt(lastOrient.beta, '°')) +
        kv('Miring kiri-kanan (γ)', fmt(lastOrient.gamma, '°'));
    }
    if (html) T.show(dataBox, html);
  };

  const onMotion = (e) => {
    gotData = true;
    lastMotion = e;
    paint();
  };

  const onOrient = (e) => {
    gotData = true;
    lastOrient = e;
    if (e.beta != null && e.gamma != null) {
      const x = Math.max(-50, Math.min(50, e.gamma));
      const y = Math.max(-50, Math.min(50, e.beta));
      tiltDot.style.left = (50 + x) + '%';
      tiltDot.style.top = (50 + y) + '%';
    }
    paint();
  };

  const stopAll = () => {
    if (noDataTimer) clearTimeout(noDataTimer);
    window.removeEventListener('devicemotion', onMotion);
    window.removeEventListener('deviceorientation', onOrient);
  };

  const start = async () => {
    const hasMotion = 'DeviceMotionEvent' in window;
    const hasOrient = 'DeviceOrientationEvent' in window;
    if (!hasMotion && !hasOrient) {
      T.show(stateBox, '<div class="big warn">Perangkat atau browser ini tidak menyediakan sensor gerak</div><p class="mut" style="font-size:13px">Coba di HP dengan browser terbaru. Laptop biasanya tidak punya sensor ini.</p>');
      return;
    }
    // iOS 13+ butuh izin eksplisit lewat tombol.
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          T.show(stateBox, '<div class="big warn">Izin sensor ditolak</div><p class="mut" style="font-size:13px">Izinkan akses sensor gerak, lalu coba lagi.</p>');
          return;
        }
      } catch (e) {
        T.show(stateBox, '<div class="big warn">Izin sensor tidak bisa diminta</div><p class="mut" style="font-size:13px">Browser menolak permintaan izin sensor di perangkat ini.</p>');
        return;
      }
    }
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try { await DeviceOrientationEvent.requestPermission(); } catch (e) {}
    }
    startBtn.disabled = true;
    T.show(stateBox, '<p class="mut" style="font-size:13px">Sensor aktif. Miringkan atau gerakkan HP.</p>');
    tiltWrap.hidden = false;
    window.addEventListener('devicemotion', onMotion);
    window.addEventListener('deviceorientation', onOrient);
    noDataTimer = setTimeout(() => {
      if (!gotData) {
        T.show(stateBox, '<div class="big warn">Sensor tidak mengirim data</div><p class="mut" style="font-size:13px">Browser menyediakan sensor, tapi perangkat tidak mengirim angka apa pun. Kemungkinan perangkat ini tidak punya sensor gerak, atau sensornya dimatikan.</p>');
      }
    }, 3000);
  };

  const startBtn = T.btn('🧭 Mulai tes sensor', start, true);
  const stopBtn = T.btn('Berhenti', () => {
    stopAll();
    startBtn.disabled = false;
    T.show(stateBox, '<p class="mut" style="font-size:13px">Tes sensor dihentikan.</p>');
  });

  T.onLeave(stopAll);

  root.appendChild(info);
  root.appendChild(T.row(startBtn, stopBtn));
  root.appendChild(stateBox);
  root.appendChild(tiltWrap);
  root.appendChild(dataBox);
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Satuan percepatan m/detik² dan putaran °/detik adalah angka mentah dari sensor. Diproses di browser.</p>'));
}
