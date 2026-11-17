import { h as T, utils, kv } from '../../core.js';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export const meta = {"id": "pajak-umkm", "name": "Pajak UMKM 0,5%", "cat": "indonesia", "icon": "🏛️", "desc": "Hitung PPh final 0,5% dari omzet bulanan, lengkap dengan jatah bebas pajak.", "keywords": "pajak,umkm,pph final,0,5 persen,omzet,pp 55"};
export function render(root) {

    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const omzetI = T.input('text', 'cth: 50.000.000', '');
    const wpI = T.select([['op','Orang Pribadi (perorangan)'],['badan','Badan usaha (PT / CV / koperasi / firma)']], 'op');
    const kumulI = T.input('text', 'cth: 200.000.000 (isi 0 bila baru mulai)', '0');
    const bulanI = T.input('month', '', ym);
    const tarifI = T.input('text', 'cth: 0,5', '0,5');
    const bebasI = T.input('text', 'cth: 500.000.000', '500.000.000');
    const batasI = T.input('text', 'cth: 4.800.000.000', '4.800.000.000');
    const box = T.out();

    const calc = () => {
      const omzet = parseRp(omzetI.value);
      const kumul = parseRp(kumulI.value);
      const tarif = parseRp(tarifI.value);
      const bebas = parseRp(bebasI.value);
      const batas = parseRp(batasI.value);
      if (!isFinite(omzet) || omzet < 0 || !isFinite(kumul) || kumul < 0 || !isFinite(tarif) || tarif < 0 || tarif >= 100 || !isFinite(bebas) || bebas < 0 || !isFinite(batas) || batas <= 0) {
        T.toast('Isi semua kolom dengan angka yang benar ya.'); return;
      }
      const isOP = wpI.value === 'op';
      const omzetTahun = kumul + omzet;
      const sisaBebas = isOP ? Math.max(0, bebas - kumul) : 0;
      const dasar = isOP ? Math.max(0, omzet - sisaBebas) : omzet;
      const pph = dasar * tarif / 100;
      const sisaBebasSesudah = isOP ? Math.max(0, bebas - omzetTahun) : 0;

      let jatuhTempo = '-';
      const m = /^(\d{4})-(\d{2})$/.exec(bulanI.value || '');
      if (m) {
        const y = +m[1]; const mo = +m[2];
        const nm = mo === 12 ? 1 : mo + 1;
        const ny = mo === 12 ? y + 1 : y;
        jatuhTempo = '15 ' + BULAN[nm - 1] + ' ' + ny;
      }

      let warn = '';
      if (omzetTahun > batas) {
        warn = '<p class="warn">⚠️ Omzet tahun berjalan sudah lewat ' + T.rp(batas) + ' — skema PPh final ' + tarif + '% tidak berlaku lagi. Pajak dihitung dengan tarif umum (Pasal 17). Angka di bawah ini hanya perkiraan skema final, bukan yang harus dibayar.</p>';
      } else if (omzetTahun > batas * 0.8) {
        warn = '<p class="warn">⚠️ Omzet tahun berjalan sudah ' + Math.round(omzetTahun / batas * 100) + '% dari batas ' + T.rp(batas) + '. Kalau lewat, skema 0,5% tidak berlaku lagi.</p>';
      }

      T.show(box,
        '<div class="big center">' + T.rp(pph) + '</div>' +
        '<p class="center">PPh final yang harus dibayar bulan ini</p>' +
        warn +
        kv('Omzet bulan ini', T.rp(omzet)) +
        (isOP ? kv('Sisa jatah bebas pajak', T.rp(sisaBebas)) : '') +
        kv('Omzet yang kena pajak', T.rp(dasar)) +
        kv('Tarif PPh final', tarif + '%') +
        kv('Omzet kumulatif tahun berjalan', T.rp(omzetTahun)) +
        (isOP ? kv('Sisa jatah bebas setelah bulan ini', T.rp(sisaBebasSesudah)) : '') +
        kv('Jatuh tempo bayar', jatuhTempo) +
        '<p class="hint">Jatah bebas pajak ' + T.rp(bebas) + '/tahun hanya untuk WP Orang Pribadi. Skema 0,5% hanya untuk omzet s.d. ' + T.rp(batas) + '/tahun. Aturan per 12 Nov 2026 (PP 55/2022, PP 20/2026) — semua angka di atas bisa diubah bila aturan berubah.</p>');
    };

    root.appendChild(T.el('<p class="note">Pajak UMKM dihitung dari <b>omzet</b>, bukan dari untung. Masukkan omzet bulan ini, nanti ketahuan berapa yang harus dibayar.</p>'));
    root.appendChild(T.field('Omzet bulan ini (Rp)', omzetI, 'Total penjualan bulan ini, sebelum dipotong biaya apa pun.'));
    root.appendChild(T.field('Jenis wajib pajak', wpI, 'Jatah bebas pajak hanya berlaku untuk Orang Pribadi.'));
    root.appendChild(T.field('Omzet kumulatif tahun ini sebelum bulan ini (Rp)', kumulI, 'Total omzet dari Januari sampai bulan lalu. Isi 0 bila usaha baru mulai tahun ini.'));
    root.appendChild(T.field('Bulan omzet', bulanI, 'Dipakai untuk menghitung tanggal jatuh tempo bayar.'));
    root.appendChild(T.grid2(
      T.field('Tarif PPh final (%)', tarifI),
      T.field('Jatah bebas OP (Rp/tahun)', bebasI),
      T.field('Batas omzet skema (Rp/tahun)', batasI)
    ));
    root.appendChild(T.row(T.btn('Hitung Pajak', calc, true)));
    root.appendChild(box);

}
