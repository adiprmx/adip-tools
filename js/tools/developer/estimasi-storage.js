import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "estimasi-storage", "name": "Estimasi Storage", "cat": "developer", "icon": "💽", "desc": "Hitung kebutuhan penyimpanan file.", "keywords": "storage,gb,mb,penyimpanan,ukuran"};
export function render(root) {

    const PRESETS = [
      ['foto', '📷 Foto 12MP', 4, 'per foto'],
      ['vid1080', '🎬 Video 1080p', 130, 'per menit'],
      ['vid4k', '🎥 Video 4K', 400, 'per menit'],
      ['mp3', '🎵 Lagu MP3', 1, 'per menit'],
      ['pdf', '📄 Dokumen PDF', 2, 'per file'],
    ];
    const KAPASITAS = [['16', '16 GB'], ['32', '32 GB'], ['64', '64 GB'], ['128', '128 GB'], ['256', '256 GB'], ['512', '512 GB'], ['1024', '1 TB']];

    const sel = T.select(PRESETS.map((p) => [p[0], p[1]]), 'foto');
    const satuan = { foto: 'per foto', vid1080: 'per menit', vid4k: 'per menit', mp3: 'per menit', pdf: 'per file' };
    const jmlInp = T.input('number', 'Contoh: 500', '500');
    const mbInp = T.input('number', 'MB per unit', '4');
    mbInp.step = '0.1';
    mbInp.min = '0';
    const capSel = T.select(KAPASITAS, '64');
    const msg = T.out();
    const listBox = T.out();
    const totalBox = T.out();
    const items = [];

    const fmtGB = (mb) => mb >= 1024
      ? (mb / 1024).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' GB'
      : mb.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' MB';

    sel.addEventListener('change', () => {
      const p = PRESETS.find((x) => x[0] === sel.value);
      if (p) mbInp.value = p[2];
    });

    function gambarUlang() {
      if (!items.length) { T.hide(listBox); T.hide(totalBox); return; }
      let html = '<div style="display:grid;gap:8px">';
      items.forEach((it, i) => {
        html += '<div class="row" style="justify-content:space-between;align-items:center;border:1px solid #ffffff20;border-radius:10px;padding:10px 12px">' +
          '<div><b>' + T.esc(it.label) + '</b><div class="dim" style="font-size:12px">' +
          T.fmt(it.jumlah) + ' ' + T.esc(it.per) + ' × ' + T.esc(String(it.mb).replace('.', ',')) + ' MB</div></div>' +
          '<div style="text-align:right"><b>' + T.fmt(it.totalMB) + ' MB</b><br>' +
          '<button type="button" class="btn small" data-hapus="' + i + '">Hapus</button></div></div>';
      });
      html += '</div>';
      T.show(listBox, html);
      listBox.querySelectorAll('[data-hapus]').forEach((b) => {
        b.addEventListener('click', () => { items.splice(Number(b.dataset.hapus), 1); gambarUlang(); });
      });
      const totalMB = items.reduce((a, it) => a + it.totalMB, 0);
      const capGB = Number(capSel.value);
      const persen = Math.min(100, (totalMB / 1024 / capGB) * 100);
      const penuh = totalMB / 1024 > capGB;
      T.show(totalBox,
        '<div class="kv"><span class="k">Total kebutuhan</span><span class="v big">' + fmtGB(totalMB) + '</span></div>' +
        '<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden;margin:10px 0 6px"><div style="height:100%;width:' + persen.toFixed(1) + '%;border-radius:6px;background:' + (penuh ? '#ef4444' : '#22c55e') + '"></div></div>' +
        '<div class="dim" style="font-size:12px">' + (penuh
          ? '⚠️ Melebihi kapasitas ' + capGB + ' GB. Kurangi jumlahnya atau siap-siap beli memori baru.'
          : 'Kepakai ' + persen.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '% dari ' + capGB + ' GB. Masih aman.') + '</div>');
    }

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Lagi mikir "butuh berapa GB ya buat nyimpen ini semua?" — hitung dulu di sini biar HP atau hardisk nggak megap-megap di tengah jalan.</p>'));
    root.appendChild(T.field('Jenis file', sel));
    root.appendChild(T.field('Jumlah', jmlInp, 'Contoh: 500 foto, 120 menit video.'));
    root.appendChild(T.field('Ukuran per unit (MB)', mbInp, 'Angka default cuma perkiraan. Sesuaikan sama file kamu biar akurat.'));
    root.appendChild(T.row(
      T.btn('+ Tambah ke Daftar', () => {
        const p = PRESETS.find((x) => x[0] === sel.value);
        const jumlah = T.num(jmlInp.value);
        const mb = T.num(mbInp.value);
        if (!jumlah || jumlah <= 0) { T.show(msg, '<span class="err">Isi jumlahnya dulu, harus lebih dari 0.</span>'); return; }
        if (!(mb >= 0)) { T.show(msg, '<span class="err">Ukuran per unit-nya nggak valid.</span>'); return; }
        T.hide(msg);
        items.push({ label: p[1], per: satuan[sel.value] || 'per unit', jumlah, mb, totalMB: jumlah * mb });
        gambarUlang();
      }, true),
      T.copyBtn(() => items.length ? 'Estimasi storage: ' + items.map((it) => it.label + ' ' + T.fmt(it.jumlah) + ' ' + it.per + ' = ' + T.fmt(it.totalMB) + ' MB').join('; ') + '. Total ' + fmtGB(items.reduce((a, it) => a + it.totalMB, 0)) : '', 'Salin Ringkasan')
    ));
    root.appendChild(msg);
    root.appendChild(listBox);
    root.appendChild(T.field('Kapasitas pembanding', capSel, 'Mau dibandingkan sama memori HP atau hardisk ukuran berapa?'));
    root.appendChild(totalBox);
    capSel.addEventListener('change', gambarUlang);

}
