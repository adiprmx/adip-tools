import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

// Logika murni (bisa di-test di Node)
utils.gajiFreelance = function (o) {
  const rate = Math.max(0, Number(o.rate) || 0);
  const platform = Math.min(100, Math.max(0, Number(o.platform) || 0));
  const tax = Math.min(100, Math.max(0, Number(o.tax) || 0));
  let gross, hours;
  if (o.mode === 'proyek') {
    const projects = Math.max(0, Number(o.projects) || 0);
    const hpp = Math.max(0, Number(o.hoursPerProject) || 0);
    gross = rate * projects;
    hours = projects * hpp;
  } else {
    hours = Math.max(0, Number(o.hours) || 0);
    gross = rate * hours;
  }
  const potPlatform = gross * platform / 100;
  const potPajak = (gross - potPlatform) * tax / 100;
  const net = gross - potPlatform - potPajak;
  const effective = hours > 0 ? net / hours : 0;
  return { gross, potPlatform, potPajak, net, hours, effective };
};

export const meta = {"id": "kalkulator-gaji-freelance", "name": "Kalkulator Gaji Freelance", "cat": "bisnis", "icon": "💼", "desc": "Hitung gaji bersih freelance per bulan", "keywords": "gaji,freelance,rate,honor,potongan,platform,pajak"};

export function render(root) {
  const mode = T.select([['jam', 'Rate per jam'], ['proyek', 'Rate per proyek']], 'jam');
  const rate = T.input('text', 'Contoh: 50000', '50000'); rate.inputMode = 'decimal';
  const hours = T.input('text', 'Contoh: 80', '80'); hours.inputMode = 'decimal';
  const projects = T.input('text', 'Contoh: 4', '4'); projects.inputMode = 'decimal';
  const hoursPerProject = T.input('text', 'Contoh: 10', '10'); hoursPerProject.inputMode = 'decimal';
  const platform = T.input('text', 'Contoh: 10', '10'); platform.inputMode = 'decimal';
  const tax = T.input('text', 'Contoh: 5', '5'); tax.inputMode = 'decimal';
  const box = T.out();

  const fldHours = T.field('Estimasi jam kerja / bulan', hours);
  const fldProjects = T.field('Jumlah proyek / bulan', projects);
  const fldHpp = T.field('Estimasi jam kerja per proyek', hoursPerProject);
  T.hide(fldProjects); T.hide(fldHpp);

  mode.addEventListener('change', () => {
    const proyek = mode.value === 'proyek';
    T.hide(fldHours); T.hide(fldProjects); T.hide(fldHpp);
    if (proyek) { fldProjects.hidden = false; fldHpp.hidden = false; }
    else { fldHours.hidden = false; }
    fldRate.querySelector('label').textContent = proyek ? 'Rate per proyek (Rp)' : 'Rate per jam (Rp)';
  });

  function calc() {
    const r = utils.gajiFreelance({
      mode: mode.value,
      rate: T.num(rate.value),
      hours: T.num(hours.value),
      projects: T.num(projects.value),
      hoursPerProject: T.num(hoursPerProject.value),
      platform: T.num(platform.value),
      tax: T.num(tax.value)
    });
    if (r.gross <= 0) { T.show(box, '<div class="hint">⚠️ Isi rate dan jumlah jam/proyek yang valid dulu.</div>'); return; }
    T.show(box,
      `<div class="kv"><span>Gaji kotor</span><b>${T.rp(r.gross)}</b></div>` +
      `<div class="kv"><span>Potongan platform</span><b>− ${T.rp(r.potPlatform)}</b></div>` +
      `<div class="kv"><span>Potongan pajak</span><b>− ${T.rp(r.potPajak)}</b></div>` +
      `<div class="kv"><span><b>Gaji bersih / bulan</b></span><b style="color:#fff">${T.rp(r.net)}</b></div>` +
      `<div class="kv"><span>Total jam kerja</span><b>${T.fmt(r.hours)} jam</b></div>` +
      `<div class="kv"><span>Tarif efektif per jam</span><b>${T.rp(r.effective)}</b></div>`
    );
  }

  root.appendChild(T.field('Mode perhitungan', mode));
  const fldRate = T.field('Rate per jam (Rp)', rate);
  root.appendChild(fldRate);
  root.appendChild(fldHours);
  root.appendChild(fldProjects);
  root.appendChild(fldHpp);
  root.appendChild(T.grid2(
    T.field('Potongan platform (%)', platform),
    T.field('Pajak (%)', tax)
  ));
  root.appendChild(T.btn('Hitung gaji', calc, true));
  root.appendChild(box);
}
