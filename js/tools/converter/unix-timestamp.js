import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "unix-timestamp", "name": "Unix Timestamp", "cat": "converter", "icon": "🕰️", "desc": "Unix timestamp ↔ tanggal (WIB).", "keywords": "unix,timestamp,waktu,epoch"};
export function render(root) {

    const tsInp = T.input('number', 'Timestamp, misal: 1759257200');
    const out1 = T.out();
    const dtInp = T.el('<input type="datetime-local" class="inp">');
    const out2 = T.out();
    const fWib = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long' });
    const fUtc = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'full', timeStyle: 'long' });

    const keTanggal = () => {
      let v = Number(tsInp.value);
      if (!Number.isFinite(v)) { T.show(out1, '<span class="err">Masukkan timestamp yang valid.</span>'); return; }
      if (Math.abs(v) > 1e12) v = v / 1000; // milidetik -> detik
      else if (Math.abs(v) > 1e10) v = v / 1000;
      const d = new Date(v * 1000);
      if (Number.isNaN(d.getTime())) { T.show(out1, '<span class="err">Timestamp tidak valid.</span>'); return; }
      T.show(out1,
        '<div class="kv"><span class="k">WIB (UTC+7)</span><span class="v">' + T.esc(fWib.format(d)) + '</span></div>' +
        '<div class="kv"><span class="k">UTC</span><span class="v">' + T.esc(fUtc.format(d)) + '</span></div>' +
        '<div class="kv"><span class="k">ISO 8601</span><span class="v" class="monoall" style="font-size:12px">' + d.toISOString() + '</span></div>');
    };
    const keTs = () => {
      if (!dtInp.value) { T.show(out2, '<span class="err">Pilih tanggal & jam dulu.</span>'); return; }
      const d = new Date(dtInp.value);
      const s = Math.floor(d.getTime() / 1000);
      T.show(out2,
        '<div class="kv"><span class="k">Detik</span><span class="v big" class="monoall">' + s + '</span></div>' +
        '<div class="kv"><span class="k">Milidetik</span><span class="v" class="monoall">' + d.getTime() + '</span></div>');
      out2.appendChild(T.row(T.btn('Salin Detik', () => T.copy(String(s)))));
    };
    const sekarang = () => {
      const s = Math.floor(Date.now() / 1000);
      tsInp.value = s;
      keTanggal();
    };
    root.appendChild(T.el('<h3 class="h3">Timestamp → Tanggal</h3>'));
    root.appendChild(T.field('Unix timestamp', tsInp, 'Otomatis dikenali detik / milidetik.'));
    root.appendChild(T.row(T.btn('Ke Tanggal', keTanggal, true), T.btn('⏱️ Sekarang', sekarang)));
    root.appendChild(out1);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">Tanggal → Timestamp</h3>'));
    root.appendChild(T.field('Tanggal & jam (zona HP kamu)', dtInp));
    root.appendChild(T.row(T.btn('Ke Timestamp', keTs, true)));
    root.appendChild(out2);
  
}
