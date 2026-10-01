import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node)
utils.paceBaca = function (o) {
  const target = Math.max(0, Number(o.target) || 0);
  const current = Math.max(0, Number(o.current) || 0);
  const paceNow = Math.max(0, Number(o.paceNow) || 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(o.deadline);
  dl.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((dl.getTime() - today.getTime()) / 86400000);
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? Math.min(100, current / target * 100) : 0;
  const need = daysLeft > 0 ? remaining / daysLeft : (remaining > 0 ? Infinity : 0);
  let status;
  if (remaining <= 0) status = 'done';
  else if (daysLeft <= 0) status = 'late';
  else if (paceNow > 0) status = paceNow >= need ? 'ontrack' : 'behind';
  else status = 'unknown';
  const etaDays = paceNow > 0 && remaining > 0 ? Math.ceil(remaining / paceNow) : null;
  return { target, current, remaining, pct, daysLeft, need, paceNow, status, etaDays };
};

export const meta = {"id": "target-baca", "name": "Target Baca", "cat": "sehari", "icon": "📚", "desc": "Pantau pace baca buku & halaman", "keywords": "baca,buku,halaman,target,pace,reading,literasi"};

export function render(root) {
  const mode = T.select([['buku', '📕 Jumlah buku'], ['halaman', '📄 Jumlah halaman']], 'buku');
  const target = T.input('text', 'Contoh: 12', '12'); target.inputMode = 'decimal';
  const current = T.input('text', 'Contoh: 3', '3'); current.inputMode = 'decimal';
  const paceNow = T.input('text', 'Contoh: 0.2 (opsional)', ''); paceNow.inputMode = 'decimal';
  const deadline = T.input('date', '', '');
  const box = T.out();

  // default deadline: 90 hari dari sekarang
  const dflt = new Date(Date.now() + 90 * 86400000);
  deadline.value = dflt.getFullYear() + '-' + String(dflt.getMonth() + 1).padStart(2, '0') + '-' + String(dflt.getDate()).padStart(2, '0');

  function unit() { return mode.value === 'buku' ? 'buku' : 'halaman'; }

  function calc() {
    const r = utils.paceBaca({
      target: T.num(target.value),
      current: T.num(current.value),
      paceNow: T.num(paceNow.value),
      deadline: deadline.value
    });
    if (!deadline.value) { T.show(box, '<div class="hint">⚠️ Pilih tanggal target selesai dulu.</div>'); return; }
    if (r.target <= 0) { T.show(box, '<div class="hint">⚠️ Isi target yang valid dulu.</div>'); return; }

    const u = unit();
    const needTxt = isFinite(r.need) ? r.need.toFixed(2) + ' ' + u + '/hari' : '—';
    let statusHtml;
    if (r.status === 'done') statusHtml = '<b style="color:#4ade80">🎉 Target tercapai!</b>';
    else if (r.status === 'late') statusHtml = '<b style="color:#f87171">⏰ Tanggal target sudah lewat & sisa ' + T.fmt(r.remaining) + ' ' + u + '.</b>';
    else if (r.status === 'ontrack') statusHtml = '<b style="color:#4ade80">✅ On track — pace kamu cukup.</b>';
    else if (r.status === 'behind') statusHtml = '<b style="color:#fbbf24">⚠️ Tertinggal — naikkan pace ke minimal ' + r.need.toFixed(2) + ' ' + u + '/hari.</b>';
    else statusHtml = '<b style="color:#fbbf24">ℹ️ Isi pace harianmu saat ini untuk tahu status on track / tertinggal.</b>';

    let etaHtml = '';
    if (r.etaDays !== null && r.status !== 'done') {
      const eta = new Date(Date.now() + r.etaDays * 86400000);
      etaHtml = `<div class="kv"><span>Estimasi selesai (pace saat ini)</span><b>${eta.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></div>`;
    }

    T.show(box,
      `<div style="background:#1a1a1a;border:1px solid #2e2e2e;border-radius:8px;height:14px;overflow:hidden;margin-bottom:8px">` +
      `<div style="height:100%;width:${r.pct.toFixed(1)}%;background:#fff;border-radius:8px"></div></div>` +
      `<div class="kv"><span>Progres</span><b>${T.fmt(r.current)} / ${T.fmt(r.target)} ${u} (${r.pct.toFixed(1)}%)</b></div>` +
      `<div class="kv"><span>Sisa</span><b>${T.fmt(r.remaining)} ${u}</b></div>` +
      `<div class="kv"><span>Hari tersisa</span><b>${r.daysLeft > 0 ? r.daysLeft + ' hari' : '—'}</b></div>` +
      `<div class="kv"><span><b>Pace dibutuhkan</b></span><b style="color:#fff">${needTxt}</b></div>` +
      etaHtml +
      `<div style="margin-top:8px">${statusHtml}</div>`
    );
  }

  root.appendChild(T.field('Jenis target', mode));
  const fldT = T.field('Target', target);
  const fldC = T.field('Sudah tercapai', current);
  const fldP = T.field('Pace harianmu saat ini (opsional)', paceNow, 'Dipakai untuk menilai on track / tertinggal');
  mode.addEventListener('change', () => {
    const u = unit();
    fldT.querySelector('label').textContent = 'Target (' + u + ')';
    fldC.querySelector('label').textContent = 'Sudah tercapai (' + u + ')';
    fldP.querySelector('label').textContent = 'Pace harianmu saat ini (' + u + '/hari, opsional)';
  });
  root.appendChild(T.grid2(fldT, fldC));
  root.appendChild(T.field('Tanggal target selesai', deadline));
  root.appendChild(fldP);
  root.appendChild(T.btn('Hitung pace', calc, true));
  root.appendChild(box);
}
