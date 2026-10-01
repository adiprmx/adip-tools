import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

const KEY = 'pengingat-obat:v1';
const TAKEN_KEY = 'pengingat-obat-taken:v1';

// ---- util murni (bisa di-test di Node) ----
function pad2(n) { return String(n).padStart(2, '0'); }
function todayKey(d) { const x = d || new Date(); return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate()); }

utils.parseJamObat = function (str) {
  const out = [];
  String(str || '').split(',').forEach(p => {
    const t = p.trim();
    const m = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/.exec(t);
    if (m) {
      const hhmm = pad2(Number(m[1])) + ':' + m[2];
      if (out.indexOf(hhmm) === -1) out.push(hhmm);
    }
  });
  return out.sort();
};

utils.nextDose = function (meds, nowMs) {
  const now = new Date(nowMs);
  let best = null;
  (meds || []).forEach(med => {
    (med.times || []).forEach(tm => {
      const parts = tm.split(':');
      const cand = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(parts[0]), Number(parts[1]), 0);
      if (cand.getTime() <= nowMs) cand.setDate(cand.getDate() + 1);
      if (!best || cand.getTime() < best.at.getTime()) best = { med, time: tm, at: cand };
    });
  });
  return best;
};

utils.fmtCountdown = function (ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return pad2(Math.floor(s / 3600)) + ':' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60);
};

export const meta = {"id": "pengingat-obat", "name": "Pengingat Obat", "cat": "sehari", "icon": "💊", "desc": "Alarm minum obat + checklist harian", "keywords": "obat,pengingat,alarm,jadwal,minum,checklist,kesehatan"};

export function render(root) {
  function load(k, fb) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fb;
    } catch (e) { return fb; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* abaikan */ }
  }

  let meds = load(KEY, []);
  let taken = load(TAKEN_KEY, {});
  const alarmed = {}; // kunci yg sudah dibunyikan sesi ini

  // ---- UI form tambah ----
  const fNama = T.input('text', 'Contoh: Paracetamol', '');
  const fDosis = T.input('text', 'Contoh: 1 tablet 500mg', '');
  const fJam = T.input('text', 'Contoh: 08:00, 12:00, 20:00', '08:00, 20:00');

  // ---- banner alarm (di dalam root, bukan document.body) ----
  const banner = T.el('<div hidden style="border:1px solid #ef4444;border-radius:10px;padding:14px;margin-bottom:12px;background:#1c0f0f"></div>');
  const bannerTxt = T.el('<div style="font-weight:700;margin-bottom:4px">⏰ Waktunya minum obat!</div>');
  const bannerSub = T.el('<div style="font-size:13px;color:#fca5a5;margin-bottom:10px"></div>');
  const btnTutup = T.btn('Tutup', stopAlarm);
  const btnMinum = T.btn('Sudah diminum ✓', () => {
    if (banner._key) {
      taken[banner._key] = true;
      save(TAKEN_KEY, taken);
      renderToday();
    }
    stopAlarm();
  }, true);
  banner.appendChild(bannerTxt);
  banner.appendChild(bannerSub);
  const bRow = T.row(btnMinum, btnTutup);
  banner.appendChild(bRow);

  // ---- countdown ----
  const cdBox = T.el('<div class="card" style="text-align:center;margin-bottom:12px"><div style="font-size:12px;color:#999">Jadwal minum berikutnya</div><div id="cd-big" style="font-size:34px;font-weight:800;letter-spacing:2px">--:--:--</div><div id="cd-sub" style="font-size:13px;color:#bbb">—</div></div>');
  const cdBig = cdBox.querySelector('#cd-big');
  const cdSub = cdBox.querySelector('#cd-sub');

  // ---- jadwal hari ini ----
  const todayWrap = T.el('<div></div>');
  // ---- daftar obat ----
  const medWrap = T.el('<div></div>');

  function doseKey(medId, tm) { return todayKey() + '|' + medId + '|' + tm; }

  function renderToday() {
    todayWrap.innerHTML = '';
    if (!meds.length) {
      todayWrap.appendChild(T.el('<div class="hint">Belum ada obat. Tambahkan lewat form di atas.</div>'));
      return;
    }
    const now = Date.now();
    const tgl = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    meds.forEach(med => {
      (med.times || []).forEach(tm => {
        const parts = tm.split(':');
        const at = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), Number(parts[0]), Number(parts[1]), 0).getTime();
        const k = doseKey(med.id, tm);
        const isTaken = !!taken[k];
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = isTaken;
        cb.style.cssText = 'width:20px;height:20px;accent-color:#fff';
        cb.addEventListener('change', () => {
          if (cb.checked) taken[k] = true; else delete taken[k];
          save(TAKEN_KEY, taken);
          if (cb.checked) stopAlarm();
          rowEl.style.opacity = cb.checked ? '0.55' : '1';
        });
        const lbl = T.el(`<div style="flex:1"><b>${T.esc(med.nama)}</b><div style="font-size:12px;color:#999">${T.esc(med.dosis || '')} · ${T.esc(tm)}</div></div>`);
        const rowEl = T.el('<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #222"></div>');
        if (at < now && !isTaken) lbl.style.color = '#f87171';
        if (isTaken) rowEl.style.opacity = '0.55';
        rowEl.appendChild(cb);
        rowEl.appendChild(lbl);
        rowEl.appendChild(T.el(`<span style="font-size:12px;color:${isTaken ? '#4ade80' : '#999'}">${isTaken ? '✓ diminum' : ''}</span>`));
        todayWrap.appendChild(rowEl);
      });
    });
  }

  function renderMeds() {
    medWrap.innerHTML = '';
    meds.forEach(med => {
      const row = T.el('<div class="card" style="padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:10px"></div>');
      const info = T.el(`<div style="flex:1"><b>${T.esc(med.nama)}</b><div style="font-size:12px;color:#999">${T.esc(med.dosis || '')}</div><div style="font-size:12px;color:#bbb">⏰ ${(med.times || []).map(T.esc).join(', ')}</div></div>`);
      const del = T.btn('Hapus', () => {
        meds = meds.filter(x => x.id !== med.id);
        save(KEY, meds);
        renderMeds(); renderToday();
      });
      row.appendChild(info);
      row.appendChild(del);
      medWrap.appendChild(row);
    });
  }

  function addMed() {
    const nama = fNama.value.trim();
    const times = utils.parseJamObat(fJam.value);
    if (!nama) { T.toast('Isi nama obat dulu'); return; }
    if (!times.length) { T.toast('Format jam salah. Contoh: 08:00, 20:00'); return; }
    meds.push({ id: 'm' + Date.now().toString(36) + Math.floor(Math.random() * 999), nama, dosis: fDosis.value.trim(), times });
    save(KEY, meds);
    fNama.value = ''; fDosis.value = '';
    renderMeds(); renderToday();
    T.toast('Obat ditambahkan ✓');
  }

  // ---- alarm ----
  let alarmIv = null;
  function stopAlarm() {
    if (alarmIv) { clearInterval(alarmIv); alarmIv = null; }
    banner.hidden = true;
    banner._key = null;
  }
  function triggerAlarm(med, tm, k) {
    alarmed[k] = true;
    bannerSub.textContent = `${med.nama}${med.dosis ? ' — ' + med.dosis : ''} · jam ${tm}`;
    banner._key = k;
    banner.hidden = false;
    stopAlarmIvOnly();
    alarmIv = setInterval(() => {
      beep(880, 0.25, 'sine', 0);
      beep(880, 0.25, 'sine', 0.35);
      beep(1175, 0.35, 'sine', 0.7);
    }, 3000);
    beep(880, 0.25, 'sine', 0);
    beep(880, 0.25, 'sine', 0.35);
    beep(1175, 0.35, 'sine', 0.7);
  }
  function stopAlarmIvOnly() { if (alarmIv) { clearInterval(alarmIv); alarmIv = null; } }

  // ---- tick tiap detik ----
  const tickIv = setInterval(() => {
    const now = Date.now();
    const nx = utils.nextDose(meds, now);
    if (!nx) {
      cdBig.textContent = '--:--:--';
      cdSub.textContent = 'Belum ada jadwal obat';
    } else {
      // kalau jadwal berikutnya sudah lewat hari ini (besok), tetap hitung mundur
      const k = doseKey(nx.med.id, nx.time);
      cdBig.textContent = utils.fmtCountdown(nx.at.getTime() - now);
      const besok = nx.at.getDate() !== new Date(now).getDate();
      cdSub.textContent = `${nx.med.nama} · ${nx.time}${besok ? ' (besok)' : ''}${taken[k] ? ' · ✓ sudah diminum' : ''}`;
    }
    // cek alarm: jadwal hari ini yang waktunya tiba & belum diminum
    const d = new Date(now);
    const tgl = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    meds.forEach(med => {
      (med.times || []).forEach(tm => {
        const parts = tm.split(':');
        const at = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate(), Number(parts[0]), Number(parts[1]), 0).getTime();
        const over = now - at;
        const k = doseKey(med.id, tm);
        if (over >= 0 && over <= 30 * 60000 && !taken[k] && !alarmed[k]) {
          triggerAlarm(med, tm, k);
        }
      });
    });
  }, 1000);

  onLeave(() => { clearInterval(tickIv); stopAlarmIvOnly(); });

  // ---- susun ----
  root.appendChild(banner);
  root.appendChild(cdBox);
  root.appendChild(T.el('<b>Jadwal hari ini</b>'));
  root.appendChild(todayWrap);
  root.appendChild(T.el('<b style="display:block;margin-top:14px">Tambah obat</b>'));
  root.appendChild(T.grid2(T.field('Nama obat', fNama), T.field('Dosis', fDosis)));
  root.appendChild(T.field('Jam minum (bisa beberapa, pisah koma)', fJam, 'Format 24 jam, contoh: 08:00, 20:00'));
  root.appendChild(T.btn('＋ Tambah obat', addMed, true));
  root.appendChild(T.el('<b style="display:block;margin-top:14px">Daftar obat</b>'));
  root.appendChild(medWrap);
  renderMeds();
  renderToday();
}
