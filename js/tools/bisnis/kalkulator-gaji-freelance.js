import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.12.2';

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

// Mode target: tarif per jam yang dibutuhkan supaya bersihnya mencapai target,
// setelah dipotong platform dan pajak. rate = target / ((1-p)(1-t) x jam).
utils.gajiFreelanceTarget = function (o) {
  const target = Math.max(0, Number(o.target) || 0);
  const jam = Math.max(0, Number(o.jam) || 0);
  const platform = Math.min(100, Math.max(0, Number(o.platform) || 0));
  const tax = Math.min(100, Math.max(0, Number(o.tax) || 0));
  const faktor = (1 - platform / 100) * (1 - tax / 100);
  if (jam <= 0 || faktor <= 0) return { rate: 0, gross: 0, potPlatform: 0, potPajak: 0, net: 0 };
  const rate = target / (faktor * jam);
  const gross = rate * jam;
  const potPlatform = gross * platform / 100;
  const potPajak = (gross - potPlatform) * tax / 100;
  return { rate, gross, potPlatform, potPajak, net: gross - potPlatform - potPajak };
};

// Mode prorata: gaji sebulan dibagi 21 (5 hari kerja) atau 25 (6 hari kerja)
// dikali hari kerja yang dijalani (PP 36/2021 Pasal 17).
utils.gajiFreelanceProrata = function (o) {
  const gaji = Math.max(0, Number(o.gaji) || 0);
  const sistem = Number(o.sistem) === 6 ? 6 : 5;
  const pembagi = sistem === 6 ? 25 : 21;
  const hari = Math.max(0, Math.floor(Number(o.hari) || 0));
  const perHari = gaji / pembagi;
  return { pembagi, perHari, total: perHari * hari, hari };
};

export const meta = {"id": "kalkulator-gaji-freelance", "name": "Kalkulator Gaji Freelance", "cat": "bisnis", "icon": "💼", "desc": "Hitung gaji bersih freelance per bulan, tarif dari target, atau prorata harian", "keywords": "gaji,freelance,rate,honor,potongan,platform,pajak,target,prorata"};

export function render(root) {
  const mode = T.select([
    ['jam', 'Rate per jam'],
    ['proyek', 'Rate per proyek'],
    ['target', 'Tarif dari target penghasilan'],
    ['prorata', 'Gaji prorata harian'],
  ], 'jam');
  const rate = T.input('text', 'Contoh: 50000', '50000'); rate.inputMode = 'decimal';
  const hours = T.input('text', 'Contoh: 80', '80'); hours.inputMode = 'decimal';
  const projects = T.input('text', 'Contoh: 4', '4'); projects.inputMode = 'decimal';
  const hoursPerProject = T.input('text', 'Contoh: 10', '10'); hoursPerProject.inputMode = 'decimal';
  const target = T.input('text', 'Contoh: 8000000', '8000000'); target.inputMode = 'decimal';
  const jamProduktif = T.input('text', 'Contoh: 100', '100'); jamProduktif.inputMode = 'decimal';
  const sistemSel = T.select([
    ['5', '5 hari kerja seminggu (dibagi 21)'],
    ['6', '6 hari kerja seminggu (dibagi 25)'],
  ], '5');
  const hariI = T.input('text', 'Contoh: 11', '11'); hariI.inputMode = 'decimal';
  const platform = T.input('text', 'Contoh: 10', '10'); platform.inputMode = 'decimal';
  const tax = T.input('text', 'Contoh: 5', '5'); tax.inputMode = 'decimal';
  const box = T.out();

  const fldRate = T.field('Rate per jam (Rp)', rate);
  const fldHours = T.field('Estimasi jam kerja / bulan', hours);
  const fldProjects = T.field('Jumlah proyek / bulan', projects);
  const fldHpp = T.field('Estimasi jam kerja per proyek', hoursPerProject);
  const fldTarget = T.field('Target penghasilan bersih / bulan (Rp)', target);
  const fldJamProduktif = T.field('Jam produktif / bulan', jamProduktif, 'Jam kerja yang benar-benar bisa ditagih ke klien');
  const fldSistem = T.field('Sistem kerja', sistemSel);
  const fldHari = T.field('Hari kerja yang dijalani', hariI);
  const fldPotongan = T.grid2(
    T.field('Potongan platform (%)', platform),
    T.field('Pajak (%)', tax, 'Freelancer UMKM omzet di bawah Rp4,8 M/tahun bisa pakai PPh final 0,5% (PP 23/2018).')
  );
  const presetPajak = T.btn('Pakai 0,5% (PPh final UMKM)', () => { tax.value = '0.5'; calc(); T.toast('Pajak disetel 0,5%'); });
  const presetRow = T.row(presetPajak);

  const aturTampil = () => {
    const m = mode.value;
    fldRate.hidden = true; fldHours.hidden = true; fldProjects.hidden = true; fldHpp.hidden = true;
    fldTarget.hidden = true; fldJamProduktif.hidden = true; fldSistem.hidden = true; fldHari.hidden = true;
    fldPotongan.hidden = true;
    presetRow.hidden = m === 'prorata';
    if (m === 'jam') {
      fldRate.hidden = false; fldHours.hidden = false; fldPotongan.hidden = false;
      fldRate.querySelector('label').textContent = 'Rate per jam (Rp)';
    } else if (m === 'proyek') {
      fldRate.hidden = false; fldProjects.hidden = false; fldHpp.hidden = false; fldPotongan.hidden = false;
      fldRate.querySelector('label').textContent = 'Rate per proyek (Rp)';
    } else if (m === 'target') {
      fldTarget.hidden = false; fldJamProduktif.hidden = false; fldPotongan.hidden = false;
    } else {
      fldRate.hidden = false; fldSistem.hidden = false; fldHari.hidden = false;
      fldRate.querySelector('label').textContent = 'Gaji sebulan (Rp)';
    }
    calc();
  };
  mode.addEventListener('change', aturTampil);

  function calc() {
    const m = mode.value;
    if (m === 'target') {
      const r = utils.gajiFreelanceTarget({
        target: T.num(target.value), jam: T.num(jamProduktif.value),
        platform: T.num(platform.value), tax: T.num(tax.value),
      });
      if (r.rate <= 0) { T.show(box, '<div class="hint">Isi target penghasilan dan jam produktif yang valid dulu.</div>'); return; }
      T.show(box,
        `<div class="big">${T.rp(Math.round(r.rate))}<span style="font-size:13px;font-weight:400"> / jam</span></div>` +
        `<p class="center mut">Tarif per jam yang perlu dipasang supaya bersihnya mencapai target</p>` +
        `<div class="kv"><span>Gaji kotor / bulan</span><b>${T.rp(r.gross)}</b></div>` +
        `<div class="kv"><span>Potongan platform</span><b>− ${T.rp(r.potPlatform)}</b></div>` +
        `<div class="kv"><span>Potongan pajak</span><b>− ${T.rp(r.potPajak)}</b></div>` +
        `<div class="kv"><span><b>Gaji bersih / bulan</b></span><b style="color:#fff">${T.rp(Math.round(r.net))}</b></div>` +
        `<div class="kv"><span>Gaji bersih / tahun</span><b>${T.rp(Math.round(r.net * 12))}</b></div>` +
        `<p class="hint">Hitungan balik: tarif = target dibagi jam produktif setelah memperhitungkan potongan platform dan pajak. Kalau tarifnya terasa kemahalan untuk pasar, tambah jam produktif atau turunkan targetnya.</p>`
      );
      return;
    }
    if (m === 'prorata') {
      const r = utils.gajiFreelanceProrata({
        gaji: T.num(rate.value), sistem: sistemSel.value, hari: T.num(hariI.value),
      });
      if (r.total <= 0) { T.show(box, '<div class="hint">Isi gaji sebulan dan jumlah hari kerja yang valid dulu.</div>'); return; }
      T.show(box,
        `<div class="big">${T.rp(Math.round(r.total))}</div>` +
        `<p class="center mut">Gaji prorata untuk ${T.fmt(r.hari)} hari kerja</p>` +
        `<div class="kv"><span>Gaji sebulan</span><b>${T.rp(T.num(rate.value))}</b></div>` +
        `<div class="kv"><span>Gaji per hari (dibagi ${r.pembagi})</span><b>${T.rp(Math.round(r.perHari))}</b></div>` +
        `<p class="hint">Patokan aturan: upah sehari = upah sebulan dibagi 21 (sistem 5 hari kerja) atau dibagi 25 (sistem 6 hari kerja), PP 36/2021 Pasal 17. Berguna saat proyek mulai atau berakhir di tengah bulan.</p>`
      );
      return;
    }
    const r = utils.gajiFreelance({
      mode: m,
      rate: T.num(rate.value),
      hours: T.num(hours.value),
      projects: T.num(projects.value),
      hoursPerProject: T.num(hoursPerProject.value),
      platform: T.num(platform.value),
      tax: T.num(tax.value)
    });
    if (r.gross <= 0) { T.show(box, '<div class="hint">Isi rate dan jumlah jam/proyek yang valid dulu.</div>'); return; }
    T.show(box,
      `<div class="kv"><span>Gaji kotor</span><b>${T.rp(r.gross)}</b></div>` +
      `<div class="kv"><span>Potongan platform</span><b>− ${T.rp(r.potPlatform)}</b></div>` +
      `<div class="kv"><span>Potongan pajak</span><b>− ${T.rp(r.potPajak)}</b></div>` +
      `<div class="kv"><span><b>Gaji bersih / bulan</b></span><b style="color:#fff">${T.rp(r.net)}</b></div>` +
      `<div class="kv"><span>Gaji bersih / tahun</span><b>${T.rp(Math.round(r.net * 12))}</b></div>` +
      `<div class="kv"><span>Total jam kerja</span><b>${T.fmt(r.hours)} jam</b></div>` +
      `<div class="kv"><span>Tarif efektif per jam</span><b>${T.rp(r.effective)}</b></div>`
    );
  }

  root.appendChild(T.field('Mode perhitungan', mode));
  root.appendChild(fldRate);
  root.appendChild(fldHours);
  root.appendChild(fldProjects);
  root.appendChild(fldHpp);
  root.appendChild(fldTarget);
  root.appendChild(fldJamProduktif);
  root.appendChild(fldSistem);
  root.appendChild(fldHari);
  root.appendChild(fldPotongan);
  root.appendChild(presetRow);
  root.appendChild(T.btn('Hitung gaji', calc, true));
  root.appendChild(box);
  aturTampil();
}
