import { h as T, utils, beep, actx, onLeave, kvRows, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "konversi-kecepatan-internet", "name": "Kecepatan Internet", "cat": "converter", "icon": "🌐", "desc": "Konversi Mbps ↔ MB/s dan satuan kecepatan internet.", "keywords": "internet,kecepatan,mbps,mb/s,bandwidth,download,konversi"};

export function render(root) {
    // Faktor ke bps. K=1000 (standar telekomunikasi), 1 byte = 8 bit.
    const UNITS = [
      ['bps', 'bit/detik (bps)', 1],
      ['kbps', 'Kilobit/detik (Kbps)', 1000],
      ['mbps', 'Megabit/detik (Mbps)', 1000 * 1000],
      ['gbps', 'Gigabit/detik (Gbps)', 1000 * 1000 * 1000],
      ['kbs', 'Kilobyte/detik (KB/s)', 8 * 1000],
      ['mbs', 'Megabyte/detik (MB/s)', 8 * 1000 * 1000],
      ['gbj', 'Gigabyte/jam (GB/jam)', 8 * 1000 * 1000 * 1000 / 3600],
    ];
    const valInp = T.input('number', 'Nilai, misal: 100', 100);
    const unitSel = T.select(UNITS.map((u) => [u[0], u[1]]), 'mbps');
    const out = T.out();

    const fmtV = (v) => {
      if (!Number.isFinite(v)) return '—';
      let s;
      if (v >= 1000) s = v.toFixed(2);
      else if (v >= 1) s = v.toFixed(4);
      else s = v.toPrecision(4);
      s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      const p = s.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return p.join(',');
    };

    const hitung = () => {
      const v = T.num(valInp.value);
      if (!Number.isFinite(v) || v < 0) { T.hide(out); return; }
      const unit = UNITS.find((u) => u[0] === unitSel.value);
      const bps = v * unit[2];
      const rows = UNITS.map((u) => [u[1], fmtV(bps / u[2])]);
      T.show(out,
        kvRows(rows) +
        '<div class="hint" style="margin-top:8px">Paket internet dijual dalam <b>bit</b> (Mbps), file diunduh dalam <b>byte</b> (MB/s) — bagi 8. K = 1000 (standar telekomunikasi/SI). GB di sini = 10⁹ byte.</div>');
    };

    valInp.addEventListener('input', hitung);
    unitSel.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Nilai', valInp),
      T.field('Satuan asal', unitSel)
    ));
    root.appendChild(out);
    hitung();
}
