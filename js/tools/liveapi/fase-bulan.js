import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "fase-bulan", "name": "Fase Bulan", "cat": "liveapi", "icon": "🌕", "desc": "Fase bulan hari ini, dihitung lokal tanpa internet.", "keywords": "bulan,fase,purnama,bulan baru,moon,lunar"};
export function render(root) {

    const SYNODIC = 29.530588853; // rata-rata satu siklus bulan (hari)
    const REF = Date.UTC(2000, 0, 6, 18, 14); // new moon referensi (ms epoch UTC)

    const FASE = [
      { nama: 'Bulan Baru', emoji: '🌑', ket: 'Langit paling gelap — waktu terbaik buat lihat bintang.' },
      { nama: 'Sabit Muda', emoji: '🌒', ket: 'Bulan mulai nongol tipis di langit barat pas senja.' },
      { nama: 'Seperempat Awal', emoji: '🌓', ket: 'Setengah bulan kelihatan, makin malam makin tinggi.' },
      { nama: 'Cembung Awal', emoji: '🌔', ket: 'Bulan makin gendut, bentar lagi purnama.' },
      { nama: 'Purnama', emoji: '🌕', ket: 'Bulan bulat sempurna — terang banget semalaman.' },
      { nama: 'Cembung Akhir', emoji: '🌘', ket: 'Bulan mulai menyusut setelah purnama.' },
      { nama: 'Seperempat Akhir', emoji: '🌗', ket: 'Setengah bulan lagi, kelihatan jelas menjelang subuh.' },
      { nama: 'Sabit Tua', emoji: '🌖', ket: 'Tinggal sabit tipis, siklus mau mulai dari awal lagi.' },
    ];

    // info fase untuk sebuah tanggal (ms epoch)
    const infoBulan = (ms) => {
      const umur = (((ms - REF) / 86400000) % SYNODIC + SYNODIC) % SYNODIC;
      const idx = Math.floor(umur / SYNODIC * 8 + 0.5) % 8;
      let ilum = (1 - Math.cos(2 * Math.PI * umur / SYNODIC)) / 2 * 100;
      ilum = Math.min(100, Math.max(0, ilum)); // jaga-jaga floating point
      const kePurnama = (((SYNODIC / 2 - umur) % SYNODIC) + SYNODIC) % SYNODIC;
      return { umur, idx, ilum, kePurnama };
    };

    const fmtTgl = (ms) => new Date(ms).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const box = T.out();
    const tglInput = T.input('date', 'Tanggal');
    tglInput.value = new Date().toISOString().slice(0, 10);

    const tampilkan = () => {
      let ms = Date.parse(tglInput.value + 'T12:00:00');
      if (isNaN(ms)) { T.show(box, '<p class="center mut">Pilih tanggal yang valid dulu.</p>'); return; }
      const b = infoBulan(ms);
      const f = FASE[b.idx];
      const tglPurnama = new Date(ms + b.kePurnama * 86400000);
      const sisaHari = Math.round(b.kePurnama);
      const txtPurnama = sisaHari < 1
        ? 'Purnamanya hari ini! Keluar dan lihat langit malam ini.'
        : 'Purnama berikutnya: <b>' + T.esc(fmtTgl(tglPurnama.getTime())) + '</b> (' + sisaHari + ' hari lagi)';
      T.show(box,
        '<div class="center">' +
        '<div style="font-size:64px;line-height:1.2">' + f.emoji + '</div>' +
        '<div class="big">' + T.esc(f.nama) + '</div>' +
        '<p class="mut">' + T.esc(f.ket) + '</p></div>' +
        '<div class="kv"><span class="k">Tanggal</span><span class="v">' + T.esc(fmtTgl(ms)) + '</span></div>' +
        '<div class="kv"><span class="k">Umur bulan</span><span class="v">' + b.umur.toFixed(1) + ' hari</span></div>' +
        '<div class="kv"><span class="k">Iluminasi</span><span class="v">' + b.ilum.toFixed(1) + '%</span></div>' +
        '<p class="hint">' + txtPurnama + '</p>'
      );
    };

    tglInput.addEventListener('change', tampilkan);

    root.appendChild(T.el('<p class="mut" style="margin-top:0">Nggak butuh internet — dihitung langsung di HP kamu dari siklus bulan 29,53 hari.</p>'));
    root.appendChild(T.field('Lihat tanggal lain', tglInput));
    root.appendChild(T.row(T.btn('Hari ini', () => { tglInput.value = new Date().toISOString().slice(0, 10); tampilkan(); })));
    root.appendChild(box);
    tampilkan();

}
