import { h as T, utils } from '../../core.js';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

export const meta = {"id": "tabungan-haji-umroh", "name": "Rencana Tabungan Haji & Umroh", "cat": "indonesia", "icon": "🕋", "desc": "Hitung berapa lama nabung untuk haji reguler, haji plus, atau umroh dari setoran bulananmu.", "keywords": "haji,umroh,tabungan,bipih,embarkasi,menabung,ibadah"};
export function render(root) {
  const EMBARKASI = [
    ['54193806', 'Rata-rata nasional — Rp54.193.806'],
    ['45109422', 'Aceh — Rp45.109.422'],
    ['60645422', 'Surabaya — Rp60.645.422'],
    ['custom', 'Embarkasi lain — isi sendiri'],
  ];
  const jenisI = T.select([
    ['reguler', 'Haji reguler'],
    ['plus', 'Haji plus'],
    ['umroh', 'Umroh'],
  ], 'reguler');
  const embarkasiI = T.select(EMBARKASI, '54193806');
  const embarkasiWrap = T.el('<div></div>');
  embarkasiWrap.appendChild(T.field('Embarkasi', embarkasiI, 'Biaya Bipih 2026 per embarkasi'));
  const targetI = T.input('text', 'cth: 54193806', '54193806'); targetI.inputMode = 'decimal';
  const awalI = T.input('text', 'cth: 0', '0'); awalI.inputMode = 'decimal';
  const setoranI = T.input('text', 'cth: 1000000', '1000000'); setoranI.inputMode = 'decimal';
  const hasilI = T.input('number', 'cth: 3', '3');
  const box = T.out();

  const aturTarget = () => {
    const jenis = jenisI.value;
    if (jenis === 'reguler') {
      embarkasiWrap.style.display = '';
      if (embarkasiI.value !== 'custom') targetI.value = embarkasiI.value;
    } else {
      embarkasiWrap.style.display = 'none';
      if (jenis === 'plus') targetI.value = '300000000';
      else targetI.value = '30000000';
    }
    hitung();
  };

  const hitung = () => {
    const jenis = jenisI.value;
    const target = parseRp(targetI.value) || 0;
    const awal = parseRp(awalI.value) || 0;
    const setoran = parseRp(setoranI.value) || 0;
    const hasil = (T.num(hasilI.value) || 0) / 100;
    if (!(target > 0)) { T.show(box, '<p class="warn">Isi dulu target biayanya ya.</p>'); return; }
    const kurang = Math.max(0, target - awal);
    if (awal >= target) {
      T.show(box,
        '<div class="big ok">Target sudah tercapai 🎉</div>' +
        '<p class="hint">Tabunganmu ' + T.rp(awal) + ' sudah menutupi target ' + T.rp(target) + '.</p>');
      return;
    }
    if (!(setoran > 0) && !(hasil > 0)) { T.show(box, '<p class="warn">Isi setoran per bulan (atau asumsi imbal hasil) dulu ya, kalau tidak target tidak akan tercapai.</p>'); return; }
    const iBulanan = hasil / 12;
    let saldo = awal;
    let bulan = 0;
    while (saldo < target && bulan < 1200) {
      saldo = saldo * (1 + iBulanan) + setoran;
      bulan++;
    }
    if (bulan >= 1200) {
      T.show(box, '<p class="warn">Dengan setoran ini, target baru tercapai lebih dari 100 tahun. Coba naikkan setoran bulanannya.</p>');
      return;
    }
    const tahun = Math.floor(bulan / 12);
    const sisaBulan = bulan % 12;
    const lama = tahun > 0 ? tahun + ' tahun' + (sisaBulan > 0 ? ' ' + sisaBulan + ' bulan' : '') : bulan + ' bulan';
    const totalSetoran = awal + setoran * bulan;
    const hasilKembang = Math.max(0, saldo - totalSetoran);
    const namaJenis = jenis === 'reguler' ? 'haji reguler' : jenis === 'plus' ? 'haji plus' : 'umroh';
    T.show(box,
      '<div class="big">' + T.esc(lama) + '</div>' +
      '<p class="center hint">sampai target ' + T.rp(target) + ' untuk ' + namaJenis + ' terkumpul</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px">' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Target biaya</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(target) + '</td></tr>' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Tabungan awal</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(awal) + '</td></tr>' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Kekurangan sekarang</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(kurang) + '</td></tr>' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Total setoranmu (' + bulan + ' bulan)</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(totalSetoran) + '</td></tr>' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Imbal hasil terkumpul (' + T.esc(hasilI.value) + '%/tahun)</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(hasilKembang) + '</td></tr>' +
      '<tr><td style="padding:7px 4px;color:#a8a29e">Total terkumpul</td><td style="padding:7px 4px;text-align:right;font-weight:600">' + T.rp(saldo) + '</td></tr>' +
      '</table>' +
      (jenis === 'reguler'
        ? '<p class="hint">Biaya Bipih haji reguler 2026 resmi (Keppres 34/2025): rata-rata ' + T.rp(54193806) + ', Aceh ' + T.rp(45109422) + ' s.d. Surabaya ' + T.rp(60645422) + '. Setoran awal pendaftaran Rp25.000.000, dan masa tunggu haji reguler sekitar 26 tahun — jadi makin cepat mulai nabung, makin baik. Bipih ditetapkan ulang tiap tahun.</p>'
        : jenis === 'plus'
        ? '<p class="hint">Angka ' + T.rp(target) + ' adalah perkiraan tengah dari kisaran pasar haji plus 2026 (Rp274–325 juta) — BUKAN tarif resmi. Biaya sebenarnya tergantung travel dan paketnya; ubah targetnya sesuai penawaran travel yang kamu pilih.</p>'
        : '<p class="hint">Angka ' + T.rp(target) + ' adalah perkiraan tengah dari kisaran pasar umroh 2026 (Rp26–35 juta) — BUKAN tarif resmi. Biaya sebenarnya tergantung travel dan paketnya; ubah targetnya sesuai penawaran travel yang kamu pilih.</p>'));
  };

  jenisI.addEventListener('change', aturTarget);
  embarkasiI.addEventListener('change', () => {
    if (embarkasiI.value !== 'custom') targetI.value = embarkasiI.value;
    hitung();
  });
  [targetI, awalI, setoranI, hasilI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Biaya haji dan umroh terasa besar sampai dipecah jadi setoran bulanan. Pilih jenisnya, isi tabungan dan setoranmu — ketahuan berapa lama sampai terkumpul.</p>'));
  root.appendChild(T.grid2(
    T.field('Jenis perjalanan', jenisI),
    T.field('Target biaya (Rp)', targetI, 'Terisi otomatis, bisa diubah')
  ));
  root.appendChild(embarkasiWrap);
  root.appendChild(T.grid2(
    T.field('Tabungan awal (Rp)', awalI, 'Yang sudah terkumpul sekarang'),
    T.field('Setoran per bulan (Rp)', setoranI),
    T.field('Asumsi imbal hasil (%/tahun)', hasilI, 'Perkiraan saja, bisa diubah — isi 0 kalau nabung tanpa bagi hasil')
  ));
  root.appendChild(T.row(T.btn('Hitung rencana', hitung, true)));
  root.appendChild(box);
  hitung();
}
