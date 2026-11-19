import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-sharpe-ratio", "name": "Kalkulator Sharpe Ratio", "cat": "bisnis", "icon": "🎯", "desc": "Seberapa bagus hasil portofolio dibanding risikonya, dengan bunga acuan yang bisa kamu ubah.", "keywords": "sharpe ratio,portofolio,risiko,imbal hasil,standar deviasi,investasi,saham,reksa dana", "since": "6.19.0"};

/* Sharpe = (hasil portofolio - bunga acuan) / simpangan baku hasil.
   Semua dalam persen. Null bila input tidak valid. */
export function hitungSharpe(hasilPersen, rfPersen, simpanganPersen) {
  const rp = Number(hasilPersen), rf = Number(rfPersen), sd = Number(simpanganPersen);
  if (![rp, rf, sd].every(isFinite) || sd <= 0) return null;
  const s = (rp - rf) / sd;
  return Number.isFinite(s) ? s : null;
}

/* Rata-rata dan simpangan baku sampel (pembagi n-1) dari daftar hasil.
   Null bila kurang dari 2 data. */
export function rataSimpangan(data) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const v = data.map(Number);
  if (!v.every(isFinite)) return null;
  const rata = v.reduce((a, b) => a + b, 0) / v.length;
  const varians = v.reduce((a, b) => a + (b - rata) * (b - rata), 0) / (v.length - 1);
  const sd = Math.sqrt(varians);
  if (![rata, sd].every(isFinite)) return null;
  return { rata, sd };
}
utils.sharpeRatio = hitungSharpe;

const fmtD = (x, d) => {
  const r = Number(x.toFixed(d == null ? 2 : d));
  return String(r === 0 ? 0 : r).replace('.', ',');
};
const fmtP = (x, d) => fmtD(x, d) + '%';

export function render(root) {
  const hasilI = T.input('text', 'cth: 15', '');
  const rfI = T.input('text', 'cth: 6', '6');
  const sdI = T.input('text', 'cth: 12', '');
  const daftarI = T.ta(4, 'Opsional: daftar hasil per periode (%), satu per baris\ncth:\n10\n12\n8\n14\n6');
  const box = T.out();

  const hitung = () => {
    const rf = T.num(rfI.value);
    if (!isFinite(rf)) { T.show(box, '<div class="err">Isi bunga acuan (risk-free) dengan angka, misal bunga deposito.</div>'); return; }
    let hasil = T.num(hasilI.value);
    let sd = T.num(sdI.value);
    let dariDaftar = '';
    const teksDaftar = daftarI.value.trim();
    if (teksDaftar !== '') {
      const token = [];
      const baris = teksDaftar.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      for (const b of baris) {
        for (const pot of b.split(/[\t;]+|,(?=\s|\d[\d.]*\.)/)) {
          for (const sub of pot.split(/\s+/)) {
            const t = sub.trim();
            if (t) token.push(t);
          }
        }
      }
      const data = [];
      for (const t of token) {
        const v = T.num(t);
        if (!isFinite(v)) { T.show(box, '<div class="err">"' + T.esc(t.slice(0, 20)) + '" di daftar hasil bukan angka. Perbaiki dulu.</div>'); return; }
        data.push(v);
      }
      const rs = rataSimpangan(data);
      if (rs === null) { T.show(box, '<div class="err">Daftar hasil butuh minimal 2 angka untuk menghitung rata-rata dan simpangan baku.</div>'); return; }
      hasil = rs.rata;
      sd = rs.sd;
      dariDaftar = ' (dari ' + data.length + ' angka di daftar)';
    }
    if (!isFinite(hasil)) { T.show(box, '<div class="err">Isi hasil portofolio dengan angka, atau isi daftar hasil per periodenya.</div>'); return; }
    if (!isFinite(sd) || sd <= 0) { T.show(box, '<div class="err">Isi simpangan baku hasil dengan angka lebih dari 0, atau isi daftar hasil supaya simpangan bakunya dihitung.</div>'); return; }
    const sharpe = hitungSharpe(hasil, rf, sd);
    if (sharpe === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const vonis = sharpe >= 2
      ? 'Sharpe di atas 2 tergolong sangat bagus: hasil jauh di atas bunga acuan untuk risiko yang diambil.'
      : sharpe >= 1
        ? 'Sharpe di atas 1 tergolong bagus: hasil sebanding dengan risikonya.'
        : sharpe >= 0
          ? 'Sharpe di bawah 1: hasilnya masih di atas bunga acuan, tapi belum sebanding dengan risikonya.'
          : 'Sharpe negatif: hasilnya di bawah bunga acuan. Menaruh uang di deposito saja lebih menguntungkan tanpa risiko ini.';
    T.show(box,
      '<div class="big center">' + fmtD(sharpe) + '</div>' +
      '<p class="center">Sharpe ratio</p>' +
      kv('Hasil portofolio', fmtP(hasil) + dariDaftar) +
      kv('Bunga acuan (risk-free)', fmtP(rf)) +
      kv('Simpangan baku hasil', fmtP(sd) + dariDaftar) +
      kv('Hasil di atas bunga acuan', fmtP(hasil - rf)) +
      '<p class="' + (sharpe >= 1 ? 'info' : sharpe >= 0 ? 'warn' : 'err') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: (hasil portofolio - bunga acuan) dibagi simpangan baku hasil. Simpangan baku mengukur seberapa naik-turun hasilnya: makin besar, makin berisiko. Angka ini hanya membandingkan hasil dengan risiko di masa lalu, bukan jaminan masa depan.</p>');
  };

  root.appendChild(T.el('<p class="note">Sharpe ratio menjawab: apakah hasil investasimu sepadan dengan naik-turunnya? Hasil tinggi yang sangat bergejolak bisa kalah bagus dari hasil sedang yang stabil. Bunga acuan bisa diubah sesuai kondisi saat ini.</p>'));
  root.appendChild(T.field('Hasil portofolio (% per tahun)', hasilI, 'Kosongkan bila memakai daftar hasil di bawah.'));
  root.appendChild(T.field('Bunga acuan (% per tahun)', rfI, 'Hasil investasi tanpa risiko, misal bunga deposito atau obligasi negara. Default 6%.'));
  root.appendChild(T.field('Simpangan baku hasil (%)', sdI, 'Seberapa naik-turun hasil portofolio. Kosongkan bila memakai daftar hasil di bawah.'));
  root.appendChild(T.field('Daftar hasil per periode (%, opsional)', daftarI, 'Satu angka per baris, misal hasil tiap bulan atau tiap tahun. Rata-rata dan simpangan bakunya dihitung otomatis dan menggantikan dua kolom di atas.'));
  root.appendChild(T.row(T.btn('Hitung Sharpe Ratio', hitung, true)));
  root.appendChild(box);
}
