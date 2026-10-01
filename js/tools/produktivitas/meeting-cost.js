import { h as T, kv } from '../../core.js?v=6.7.0';

export const meta = {"id":"meeting-cost","name":"Biaya Meeting","cat":"produktivitas","icon":"💸","desc":"Hitung berapa rupiah yang 'terbakar' tiap detik meeting berjalan.","keywords":"meeting,biaya meeting,rapat,gaji,timer live,efisiensi,biaya rapat"};
export function render(root) {

    const pesertaI = T.input('number', 'cth: 5', '5');
    const gajiI = T.input('text', 'cth: 50000', '50000');
    gajiI.inputMode = 'decimal';
    const durasiI = T.input('number', 'cth: 60', '60');
    const box = T.out();
    const liveBox = T.out();

    let iv = null, startTs = 0, rate = 0;

    const fmtDur = (s) => {
      s = Math.max(0, Math.floor(s));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), d = s % 60;
      if (h > 0) return h + 'j ' + m + 'mnt ' + d + 'dtk';
      if (m > 0) return m + 'mnt ' + d + 'dtk';
      return d + 'dtk';
    };

    const ratePerDetik = () => {
      const p = T.num(pesertaI.value), g = T.num(gajiI.value);
      if (!(p > 0) || !(g >= 0) || !isFinite(p) || !isFinite(g)) return null;
      return p * g / 3600;
    };

    const estimasi = () => {
      const r = ratePerDetik();
      const d = T.num(durasiI.value);
      if (r == null || !(d > 0)) {
        T.show(box, '<p class="hint center">Isi jumlah peserta, gaji per jam & durasi rencana dulu.</p>');
        return;
      }
      T.show(box,
        '<div class="big center">' + T.rp(r * d * 60) + '</div>' +
        '<p class="center">estimasi biaya meeting ' + T.esc(String(Math.round(d))) + ' menit ini.</p>' +
        kv('Biaya per menit', T.rp(r * 60)) +
        kv('Biaya per detik', T.rp(r)) +
        '<p class="hint">Asumsi gaji per jam = total kompensasi per jam kerja tiap peserta.</p>');
    };

    const tick = () => {
      const jalan = (Date.now() - startTs) / 1000;
      const terbakar = rate * jalan;
      T.show(liveBox,
        '<div class="big center" style="font-variant-numeric:tabular-nums">' + T.rp(terbakar) + '</div>' +
        '<p class="center">sudah terbakar dalam ' + T.esc(fmtDur(jalan)) + '</p>' +
        kv('Durasi berjalan', T.esc(fmtDur(jalan))) +
        kv('Laju bakar', T.rp(rate) + ' / detik') +
        '<p class="hint">Angkanya jalan terus — makin cepat selesai, makin hemat.</p>');
    };

    const bStart = T.btn('▶ Mulai meeting', null, true);
    const bStop = T.btn('⏹ Selesai', null);
    bStop.disabled = true;

    const mulai = () => {
      const r = ratePerDetik();
      if (r == null) { T.toast('Isi peserta & gaji per jam yang valid dulu'); return; }
      rate = r;
      startTs = Date.now();
      [pesertaI, gajiI, durasiI].forEach((i) => { i.disabled = true; });
      bStart.disabled = true;
      bStop.disabled = false;
      tick();
      iv = setInterval(tick, 1000);
      T.toast('Meeting jalan — argo mulai muter');
    };
    const selesai = () => {
      if (iv) { clearInterval(iv); iv = null; }
      const jalan = (Date.now() - startTs) / 1000;
      const terbakar = rate * jalan;
      [pesertaI, gajiI, durasiI].forEach((i) => { i.disabled = false; });
      bStart.disabled = false;
      bStop.disabled = true;
      T.show(liveBox,
        '<div class="big center">' + T.rp(terbakar) + '</div>' +
        '<p class="center">total terbakar dalam ' + T.esc(fmtDur(jalan)) + '. Lumayan, kan?</p>' +
        kv('Durasi meeting', T.esc(fmtDur(jalan))) +
        kv('Total biaya', T.rp(terbakar)));
      T.toast('Meeting selesai');
    };
    bStart.addEventListener('click', mulai);
    bStop.addEventListener('click', selesai);
    T.onLeave(() => { if (iv) clearInterval(iv); });

    [pesertaI, gajiI, durasiI].forEach((i) => i.addEventListener('input', estimasi));

    root.appendChild(T.el('<p class="note">Meeting itu mahal — tiap detik ada gaji yang jalan. Hitung estimasinya, atau nyalakan mode live pas meeting beneran mulai.</p>'));
    root.appendChild(T.field('Jumlah peserta', pesertaI));
    root.appendChild(T.field('Rata-rata gaji per jam (Rp)', gajiI, 'Per orang, per jam.'));
    root.appendChild(T.field('Durasi rencana (menit)', durasiI));
    root.appendChild(box);
    root.appendChild(T.el('<div style="font-weight:600;margin:14px 0 8px">🔴 Mode live</div>'));
    root.appendChild(T.row(bStart, bStop));
    root.appendChild(liveBox);
    estimasi();

}
