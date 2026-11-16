import { h as T, kv } from '../../core.js?v=6.13.0';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM.
   Mengembalikan null bila jarak stop-loss tidak valid, atau
   { overflow: true } bila hasilnya meluber di luar jangkauan angka (RT2-07). */
export function hitungPosisi(modal, risikoPersen, hargaBeli, stopLoss, ukuranLot) {
  // Kalikan persennya DULU (<=1) supaya modal 1e308 tidak meluber di tengah
  // jalan: modal * 100 / 100 = Infinity, modal * (100/100) = modal.
  const risikoRp = modal * (risikoPersen / 100);
  const jarak = Math.abs(hargaBeli - stopLoss);
  if (!(jarak > 0)) return null;
  const saham = Math.floor(risikoRp / jarak);
  const lot = ukuranLot > 0 ? Math.floor(saham / ukuranLot) : 0;
  const sahamBulatkan = lot * ukuranLot;
  const nilaiPosisi = sahamBulatkan * hargaBeli;
  const risikoNyata = sahamBulatkan * jarak;
  const persenModal = modal > 0 ? sahamBulatkan * hargaBeli / modal * 100 : 0;
  if (![risikoRp, saham, lot, sahamBulatkan, nilaiPosisi, risikoNyata, persenModal].every(Number.isFinite)) {
    return { overflow: true };
  }
  return {
    risikoRp,
    jarak,
    saham,
    lot,
    sahamBulatkan,
    nilaiPosisi,
    risikoNyata,
    persenModal,
  };
}

export const meta = {"id": "kalkulator-ukuran-posisi", "name": "Ukuran Posisi Trading", "cat": "bisnis", "icon": "🎯", "desc": "Berapa lot yang aman dibeli dari modal + risiko per trade + jarak stop-loss.", "keywords": "trading,position sizing,lot,saham,stop loss,risiko,forex,modal", "since": "6.13.0"};
export function render(root) {

    const modalI = T.input('text', 'cth: 10000000', '');
    modalI.inputMode = 'decimal';
    const risikoI = T.input('text', 'cth: 2', '2');
    risikoI.inputMode = 'decimal';
    const beliI = T.input('text', 'cth: 5000', '');
    beliI.inputMode = 'decimal';
    const slI = T.input('text', 'cth: 4800', '');
    slI.inputMode = 'decimal';
    const lotI = T.input('text', 'cth: 100', '100');
    lotI.inputMode = 'numeric';
    const box = T.out();

    const hitung = () => {
      const modal = T.num(modalI.value);
      const risiko = T.num(risikoI.value);
      const beli = T.num(beliI.value);
      const sl = T.num(slI.value);
      const lotSize = T.num(lotI.value);
      if (!isFinite(modal) || modal <= 0) { T.toast('Isi modal dengan angka lebih dari 0'); return; }
      if (!isFinite(risiko) || risiko <= 0 || risiko > 100) { T.toast('Risiko per trade diisi 0–100%'); return; }
      if (!isFinite(beli) || beli <= 0 || !isFinite(sl) || sl <= 0) { T.toast('Isi harga beli dan stop-loss dengan angka lebih dari 0'); return; }
      if (beli === sl) { T.toast('Harga beli dan stop-loss tidak boleh sama'); return; }
      if (!Number.isInteger(lotSize) || lotSize <= 0) { T.toast('Ukuran lot diisi bilangan bulat lebih dari 0'); return; }
      const h = hitungPosisi(modal, risiko, beli, sl, lotSize);
      if (!h) { T.toast('Jarak stop-loss tidak valid'); return; }
      if (h.overflow) { T.toast('Angkanya terlalu besar untuk dihitung — coba pakai modal atau harga yang lebih kecil.'); return; }

      const cukup = h.sahamBulatkan > 0;
      const peringatan = !cukup
        ? '<p class="err">Risiko yang kamu izinkan terlalu kecil untuk 1 lot di harga ini — naikkan risiko per trade, perbesar modal, atau cari saham yang harganya lebih murah.</p>'
        : h.nilaiPosisi > modal
          ? '<p class="warn">Nilai posisi ini (' + T.rp(h.nilaiPosisi) + ') lebih besar dari modalmu (' + T.rp(modal) + ') — tidak bisa dibeli penuh tanpa dana tambahan.</p>'
          : '';
      T.show(box,
        '<div class="big center">' + h.lot + ' <span class="mut" style="font-size:15px">lot</span></div>' +
        '<p class="center">itu ukuran posisi yang sesuai dengan risiko ' + String(risiko).replace('.', ',') + '% per trade.</p>' +
        kv('Risiko yang diizinkan', T.rp(h.risikoRp) + ' (' + String(risiko).replace('.', ',') + '% dari modal)') +
        kv('Jarak stop-loss', T.rp(h.jarak) + ' per lembar') +
        kv('Jumlah saham', h.sahamBulatkan.toLocaleString('id-ID') + ' lembar' + (h.saham !== h.sahamBulatkan ? ' (dari hitungan mentah ' + h.saham.toLocaleString('id-ID') + ' lembar, dibulatkan ke bawah ke kelipatan lot)' : '')) +
        kv('Nilai posisi', T.rp(h.nilaiPosisi) + ' (' + h.persenModal.toFixed(1).replace('.', ',') + '% dari modal)') +
        kv('Kerugian bila kena stop-loss', T.rp(h.risikoNyata)) +
        peringatan +
        '<p class="hint">Rumusnya: risiko rupiah = modal × risiko%. Jumlah saham = risiko rupiah ÷ jarak stop-loss, lalu dibulatkan ke bawah ke kelipatan lot. ' +
        'Stop-loss yang lebih jauh = posisi lebih kecil, begitu sebaliknya. Aturan umumnya trader ritel membatasi risiko 1–2% per trade — angka itu bisa kamu ubah di atas.</p>' +
        '<p class="warn">⚠️ Ini alat hitung, bukan saran investasi. Keputusan beli/jual tetap tanggung jawabmu — pahami risikonya, jangan pakai uang kebutuhan pokok, dan jangan trading pakai pinjaman.</p>');
    };

    root.appendChild(T.el('<p class="note">Posisi yang kebesaran adalah penyebab rugi paling umum. Atur dulu berapa persen modal yang rela hilang kalau salah arah — baru hitung berapa lot yang boleh dibeli.</p>'));
    root.appendChild(T.field('Total modal (Rp)', modalI, 'Seluruh dana trading yang kamu punya.'));
    root.appendChild(T.field('Risiko per trade (%)', risikoI, 'Berapa persen modal yang rela hilang dalam satu trade ini. Umumnya 1–2%.'));
    root.appendChild(T.grid2(
      T.field('Harga beli per lembar (Rp)', beliI, 'Harga saat kamu berencana masuk.'),
      T.field('Harga stop-loss (Rp)', slI, 'Harga saat kamu keluar kalau salah arah.')
    ));
    root.appendChild(T.field('Ukuran 1 lot (lembar)', lotI, 'Saham Indonesia: 1 lot = 100 lembar. Ubah kalau instrumenmu beda.'));
    root.appendChild(T.row(T.btn('Hitung Ukuran Posisi', hitung, true)));
    root.appendChild(box);

}
