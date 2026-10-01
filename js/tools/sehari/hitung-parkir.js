import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node)
utils.biayaParkir = function (o) {
  const jam = Math.max(0, Number(o.hours) || 0);
  if (o.inap) {
    const flat = Math.max(0, Number(o.flat) || 0);
    const blocks = Math.ceil(jam / 24);
    return { total: blocks * flat, blocks, inap: true };
  }
  const first = Math.max(0, Number(o.first) || 0);
  const next = Math.max(0, Number(o.next) || 0);
  const total = jam <= 1 ? (jam > 0 ? first : 0) : first + Math.ceil(jam - 1) * next;
  return { total, inap: false };
};

export const meta = {"id": "hitung-parkir", "name": "Hitung Parkir", "cat": "sehari", "icon": "🅿️", "desc": "Estimasi biaya parkir motor & mobil", "keywords": "parkir,motor,mobil,tarif,biaya,inap"};

export function render(root) {
  const DEFAULTS = {
    motor: { first: 2000, next: 1000, flat: 15000 },
    mobil: { first: 5000, next: 3000, flat: 30000 }
  };
  const kendaraan = T.select([['motor', '🛵 Motor'], ['mobil', '🚗 Mobil']], 'motor');
  const hours = T.input('text', 'Contoh: 3', '3'); hours.inputMode = 'decimal';
  const first = T.input('text', 'Rp', String(DEFAULTS.motor.first)); first.inputMode = 'decimal';
  const next = T.input('text', 'Rp', String(DEFAULTS.motor.next)); next.inputMode = 'decimal';
  const flat = T.input('text', 'Rp', String(DEFAULTS.motor.flat)); flat.inputMode = 'decimal';
  const inap = document.createElement('input');
  inap.type = 'checkbox';
  const box = T.out();

  const fldFlat = T.field('Tarif flat per 24 jam (Rp)', flat);
  T.hide(fldFlat);
  const fldNext = T.field('Tarif per jam berikutnya (Rp)', next);

  kendaraan.addEventListener('change', () => {
    const d = DEFAULTS[kendaraan.value] || DEFAULTS.motor;
    first.value = String(d.first);
    next.value = String(d.next);
    flat.value = String(d.flat);
  });
  inap.addEventListener('change', () => {
    if (inap.checked) { T.hide(fldNext); fldFlat.hidden = false; }
    else { fldNext.hidden = false; T.hide(fldFlat); }
  });

  function calc() {
    const r = utils.biayaParkir({
      hours: T.num(hours.value),
      first: T.num(first.value),
      next: T.num(next.value),
      flat: T.num(flat.value),
      inap: inap.checked
    });
    if (T.num(hours.value) <= 0) { T.show(box, '<div class="hint">⚠️ Isi durasi parkir dulu.</div>'); return; }
    let rincian;
    if (r.inap) {
      rincian = `<div class="kv"><span>Blok 24 jam</span><b>${r.blocks} × ${T.rp(T.num(flat.value))}</b></div>`;
    } else {
      const h = T.num(hours.value);
      rincian = h <= 1
        ? `<div class="kv"><span>Jam pertama</span><b>${T.rp(T.num(first.value))}</b></div>`
        : `<div class="kv"><span>Jam pertama</span><b>${T.rp(T.num(first.value))}</b></div>` +
          `<div class="kv"><span>${Math.ceil(h - 1)} jam berikutnya</span><b>${T.rp(T.num(next.value))} × ${Math.ceil(h - 1)}</b></div>`;
    }
    T.show(box,
      rincian +
      `<div class="kv"><span><b>Total biaya parkir</b></span><b style="color:#fff">${T.rp(r.total)}</b></div>` +
      `<div class="hint">${inap.checked ? 'Mode inap: tiap kelipatan 24 jam dihitung 1 tarif flat.' : 'Jam berikutnya dibulatkan ke atas per jam penuh.'}</div>`
    );
  }

  const inapRow = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin:8px 0"></label>');
  inap.style.cssText = 'width:18px;height:18px;accent-color:#fff';
  inapRow.appendChild(inap);
  inapRow.appendChild(T.el('<span>Parkir inap (tarif flat per 24 jam)</span>'));

  root.appendChild(T.field('Jenis kendaraan', kendaraan));
  root.appendChild(T.field('Durasi parkir (jam)', hours));
  root.appendChild(inapRow);
  root.appendChild(T.field('Tarif jam pertama (Rp)', first));
  root.appendChild(fldNext);
  root.appendChild(fldFlat);
  root.appendChild(T.btn('Hitung biaya', calc, true));
  root.appendChild(box);
}
