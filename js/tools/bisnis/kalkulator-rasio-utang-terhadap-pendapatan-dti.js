import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-rasio-utang-terhadap-pendapatan-dti", "name": "Kalkulator Rasio Utang terhadap Pendapatan (DTI)", "cat": "bisnis", "icon": "⚖️", "desc": "Berapa persen penghasilanmu habis untuk cicilan tiap bulan.", "keywords": "dti,rasio utang,cicilan,penghasilan,kelayakan kredit,debt to income", "since": "6.17.0"};

// DTI = total cicilan bulanan / penghasilan bulanan x 100%.
export function hitungDTI(penghasilan, cicilan) {
  const p = Number(penghasilan), c = Number(cicilan);
  if (![p, c].every(isFinite) || p <= 0 || c < 0) return null;
  const dti = (c / p) * 100;
  return Number.isFinite(dti) ? dti : null;
}

const fmtPersen = (x) => x.toFixed(1).replace('.', ',') + '%';

export function render(root) {
  const pI = T.input('text', 'cth: 8000000', '');
  const cI = T.input('text', 'cth: 2500000', '');
  const box = T.out();

  const hitung = () => {
    const p = T.num(pI.value);
    const c = T.num(cI.value);
    if (!isFinite(p) || p <= 0) { T.show(box, '<div class="err">Penghasilan bulanan harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(c) || c < 0) { T.show(box, '<div class="err">Total cicilan bulanan harus diisi angka 0 atau lebih.</div>'); return; }
    const dti = hitungDTI(p, c);
    if (dti === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    const sisa = p - c;
    let pesan, kelas;
    if (dti <= 36) { pesan = 'Cicilanmu masih dalam batas wajar. Sebagai patokan umum, bank biasanya menilai DTI di bawah 36% sebagai beban ringan.'; kelas = 'info'; }
    else if (dti <= 43) { pesan = 'Cicilanmu mulai berat. Sebagai patokan umum, DTI 36% sampai 43% sudah masuk zona hati-hati dan pengajuan kredit baru bisa sulit.'; kelas = 'warn'; }
    else { pesan = 'Cicilanmu berat: lebih dari 43% penghasilan habis untuk utang. Sebagai patokan umum, pengajuan kredit baru sangat sulit di angka ini.'; kelas = 'err'; }
    T.show(box,
      '<div class="big center">' + fmtPersen(dti) + '</div>' +
      '<p class="center">penghasilan yang habis untuk cicilan</p>' +
      kv('Penghasilan bulanan', T.rp(p)) +
      kv('Total cicilan bulanan', T.rp(c)) +
      kv('Sisa setelah cicilan', T.rp(sisa)) +
      '<p class="' + kelas + '">' + pesan + '</p>' +
      '<p class="hint">Hitung semua cicilan: KPR, kredit kendaraan, kartu kredit, dan pinjaman lain. Penghasilan yang dipakai sebaiknya penghasilan bersih setelah pajak.</p>');
  };

  root.appendChild(T.el('<p class="note">DTI itu persentase penghasilan yang habis untuk membayar utang tiap bulan. Bank memakai angka ini untuk menilai apakah kamu sanggup mengambil cicilan baru.</p>'));
  root.appendChild(T.field('Penghasilan bersih per bulan (Rp)', pI, 'Gaji atau penghasilan yang diterima tiap bulan setelah pajak.'));
  root.appendChild(T.field('Total cicilan per bulan (Rp)', cI, 'Semua cicilan digabung: KPR, kendaraan, kartu kredit, dan pinjaman lain.'));
  root.appendChild(T.row(T.btn('Hitung DTI', hitung, true)));
  root.appendChild(box);
}
