import { h as T, utils } from '../../core.js?v=6.13.0';

// Logika murni (bisa di-test di Node).
// RPM = penghasilan per 1.000 penonton. Tidak ada angka resmi dari platform,
// jadi semua angka default di bawah adalah perkiraan awal yang WAJIB bisa diubah.
utils.estimasiKreator = function (o) {
  const viewsYt = Math.max(0, Number(o.viewsYt) || 0);
  const rpm = Math.max(0, Number(o.rpm) || 0);
  const viewsTk = Math.max(0, Number(o.viewsTk) || 0);
  const perSeribu = Math.max(0, Number(o.perSeribu) || 0);
  const jualAff = Math.max(0, Number(o.jualAff) || 0);
  const komisiAff = Math.max(0, Number(o.komisiAff) || 0);
  const yt = (viewsYt / 1000) * rpm;
  const tiktok = (viewsTk / 1000) * perSeribu;
  const aff = jualAff * komisiAff;
  return { yt, tiktok, aff, total: yt + tiktok + aff };
};

export const meta = {"id": "estimasi-penghasilan-kreator", "name": "Estimasi Penghasilan Kreator", "cat": "bisnis", "icon": "🎬", "desc": "Perkiraan penghasilan YouTube dan TikTok dari jumlah penonton.", "keywords": "kreator,youtube,tiktok,rpm,penghasilan,adsense,affiliate,content creator", "since": "6.11.0"};

export function render(root) {
  const viewsYt = T.input('text', 'Contoh: 100000', '100000'); viewsYt.inputMode = 'decimal';
  const rpm = T.input('text', 'Contoh: 10000', '10000'); rpm.inputMode = 'decimal';
  const viewsTk = T.input('text', 'Contoh: 500000', '500000'); viewsTk.inputMode = 'decimal';
  const perSeribu = T.input('text', 'Contoh: 1000', '1000'); perSeribu.inputMode = 'decimal';
  const jualAff = T.input('text', 'Contoh: 20', ''); jualAff.inputMode = 'decimal';
  const komisiAff = T.input('text', 'Contoh: 5000', ''); komisiAff.inputMode = 'decimal';
  const box = T.out();

  function calc() {
    const r = utils.estimasiKreator({
      viewsYt: T.num(viewsYt.value), rpm: T.num(rpm.value),
      viewsTk: T.num(viewsTk.value), perSeribu: T.num(perSeribu.value),
      jualAff: T.num(jualAff.value), komisiAff: T.num(komisiAff.value)
    });
    if (r.total <= 0) { T.show(box, '<div class="hint">Isi dulu jumlah penonton per bulan di salah satu platform.</div>'); return; }
    T.show(box,
      `<div class="kv"><span>YouTube (perkiraan)</span><b>${T.rp(r.yt)}</b></div>` +
      `<div class="kv"><span>TikTok (perkiraan)</span><b>${T.rp(r.tiktok)}</b></div>` +
      (r.aff > 0 ? `<div class="kv"><span>Komisi affiliate</span><b>${T.rp(r.aff)}</b></div>` : '') +
      `<div class="kv"><span>Total perkiraan per bulan</span><b style="color:#fff">${T.rp(r.total)}</b></div>` +
      `<div class="hint">Ini perkiraan kasar, bukan janji. RPM YouTube untuk penonton Indonesia sangat bervariasi menurut topik video, usia penonton, dan musim iklan. Angka yang benar hanya terlihat di dasbor YouTube Studio dan TikTok Studio masing-masing. Ubah angka RPM di atas sesuai data dasbormu supaya hasilnya mendekati kenyataan.</div>`
    );
  }

  root.appendChild(T.el('<p class="note">Perkirakan penghasilan dari jumlah penonton. Angka RPM di bawah adalah nilai awal yang bisa diubah, karena tiap kanal beda.</p>'));
  root.appendChild(T.el('<h3>YouTube</h3>'));
  root.appendChild(T.grid2(
    T.field('Penonton per bulan', viewsYt),
    T.field('RPM: penghasilan per 1.000 penonton (Rp)', rpm, 'Cek di YouTube Studio, menu Analitik.')
  ));
  root.appendChild(T.el('<h3>TikTok</h3>'));
  root.appendChild(T.grid2(
    T.field('Penonton per bulan', viewsTk),
    T.field('Penghasilan per 1.000 penonton (Rp)', perSeribu, 'Dari program reward kreator, bila akunmu memenuhi syarat.')
  ));
  root.appendChild(T.el('<h3>Affiliate (opsional)</h3>'));
  root.appendChild(T.grid2(
    T.field('Produk terjual per bulan', jualAff),
    T.field('Komisi rata-rata per produk (Rp)', komisiAff)
  ));
  root.appendChild(T.btn('Hitung', calc, true));
  root.appendChild(box);
}
