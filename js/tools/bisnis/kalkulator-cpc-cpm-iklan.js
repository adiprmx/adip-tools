import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cpc-cpm-iklan", "name": "Kalkulator CPC & CPM Iklan", "cat": "bisnis", "icon": "📣", "desc": "Biaya per klik dan biaya per 1.000 tayang dari iklan digitalmu.", "keywords": "cpc,cpm,iklan,biaya per klik,biaya per tayang,ads,iklan digital", "since": "6.17.0"};

// CPC = biaya / klik. CPM = biaya / tayang x 1000. CTR = klik / tayang x 100%.
export function hitungCpcCpm(biaya, klik, tayang) {
  const b = Number(biaya), k = Number(klik), t = Number(tayang);
  if (![b, k, t].every(isFinite) || b < 0 || k < 0 || t <= 0 || k > t) return null;
  const cpc = k > 0 ? b / k : null;
  const cpm = (b / t) * 1000;
  const ctr = (k / t) * 100;
  if (![cpm, ctr].every(isFinite) || (cpc != null && !isFinite(cpc))) return null;
  return { cpc, cpm, ctr };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const bI = T.input('text', 'cth: 2000000', '');
  const kI = T.input('text', 'cth: 500', '');
  const tI = T.input('text', 'cth: 50000', '');
  const box = T.out();

  const hitung = () => {
    const b = T.num(bI.value);
    const k = T.num(kI.value);
    const t = T.num(tI.value);
    if (!isFinite(b) || b < 0) { T.show(box, '<div class="err">Total biaya iklan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(k) || k < 0) { T.show(box, '<div class="err">Jumlah klik harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(t) || t <= 0) { T.show(box, '<div class="err">Jumlah tayang harus diisi angka lebih dari 0.</div>'); return; }
    if (k > t) { T.show(box, '<div class="err">Klik tidak bisa lebih banyak dari tayang.</div>'); return; }
    const hasil = hitungCpcCpm(b, k, t);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + (hasil.cpc == null ? 'Rp0' : T.rp(hasil.cpc)) + '</div>' +
      '<p class="center">biaya per klik (CPC)' + (hasil.cpc == null ? ' — belum ada klik' : '') + '</p>' +
      kv('Biaya per 1.000 tayang (CPM)', T.rp(hasil.cpm)) +
      kv('Rasio klik (CTR)', fmtPersen(hasil.ctr)) +
      kv('Total biaya', T.rp(b)) +
      kv('Total klik', T.fmt(k)) +
      kv('Total tayang', T.fmt(t)) +
      '<p class="hint">CPC dipakai kalau tujuanmu mendatangkan klik, CPM kalau tujuanmu menjangkau banyak orang. Bandingkan antar iklan dengan periode yang sama supaya adil.</p>');
  };

  root.appendChild(T.el('<p class="note">CPC itu harga satu klik iklanmu, CPM itu harga 1.000 kali iklanmu tampil. Dua angka ini menentukan mahal tidaknya iklanmu.</p>'));
  root.appendChild(T.field('Total biaya iklan (Rp)', bI, 'Semua uang yang keluar untuk iklan ini.'));
  root.appendChild(T.field('Jumlah klik', kI, 'Berapa kali iklan diklik.'));
  root.appendChild(T.field('Jumlah tayang', tI, 'Berapa kali iklan tampil di layar orang.'));
  root.appendChild(T.row(T.btn('Hitung CPC & CPM', hitung, true)));
  root.appendChild(box);
}
