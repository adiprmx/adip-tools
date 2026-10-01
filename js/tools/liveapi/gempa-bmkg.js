import { h as T, utils, errBox, kv } from '../../core.js?v=6.6.0';

export const meta = {"id": "gempa-bmkg", "name": "Gempa BMKG Terkini", "cat": "liveapi", "icon": "🌊", "desc": "Info gempa bumi terbaru langsung dari BMKG.", "keywords": "gempa,bmkg,tsunami,lindu,magnitudo,gempa bumi,terkini"};
export function render(root) {

    const box = T.out();
    const muat = async () => {
      T.show(box, '<p class="mut">Mengambil data gempa terbaru dari BMKG…</p>');
      try {
        const r = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json();
        const g = j && j.Infogempa && j.Infogempa.gempa;
        if (!g || !g.Magnitude) throw new Error('bad-data');
        const potensi = String(g.Potensi || '');
        const tsunami = /berpotensi/i.test(potensi) && !/tidak/i.test(potensi);
        let html = '';
        if (tsunami) {
          html += '<div class="center" style="border:1px solid #ef4444;border-radius:10px;padding:10px;margin-bottom:10px;color:#ef4444"><b>⚠️ ' + T.esc(potensi) + '</b><br><span class="hint">Ikuti arahan resmi BMKG & BPBD setempat.</span></div>';
        }
        html += '<div class="big center">' + T.esc(g.Magnitude) + ' <span class="mut" style="font-size:15px">Magnitudo</span></div>' +
          '<p class="center"><b>' + T.esc(g.Wilayah || '-') + '</b></p>' +
          kv('Waktu', T.esc(((g.Tanggal || '') + ' ' + (g.Jam || '')).trim() || '-')) +
          kv('Kedalaman', T.esc(g.Kedalaman || '-')) +
          kv('Koordinat', T.esc(((g.Lintang || '') + ', ' + (g.Bujur || '')).replace(/^, |, $/g, '') || '-')) +
          kv('Potensi', tsunami ? '<b style="color:#ef4444">' + T.esc(potensi) + '</b>' : T.esc(potensi || '-'));
        if (g.Dirasakan) html += kv('Dirasakan', T.esc(g.Dirasakan));
        if (g.Shakemap) {
          html += '<div class="center" style="margin-top:10px"><img src="' + T.esc('https://data.bmkg.go.id/DataMKG/TEWS/' + g.Shakemap) + '" alt="Peta guncangan BMKG" loading="lazy" style="max-width:100%;border-radius:10px;border:1px solid #ffffff20"></div>';
        }
        html += '<p class="hint">Sumber: BMKG — data.bmkg.go.id</p>';
        T.show(box, html);
      } catch (e) {
        T.show(box, errBox('Gagal ambil data gempa. Cek koneksi internet, lalu coba lagi.'));
      }
    };
    root.appendChild(T.row(T.btn('Cek gempa terkini', muat, true)));
    root.appendChild(box);

}
