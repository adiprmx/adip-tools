import { h as T, utils, kv } from '../../core.js?v=6.5.0';

export const meta = {"id": "kalkulator-kurban", "name": "Kalkulator Kurban", "cat": "indonesia", "icon": "🐄", "desc": "Patungan sapi (maks 7 orang) atau kambing — iuran per orang otomatis.", "keywords": "kurban,qurban,sapi,kambing,idul adha,patungan,iuran"};

export function render(root) {

    const hewanSel = T.select([
      ['sapi', '🐄 Sapi — patungan maksimal 7 orang'],
      ['kambing', '🐐 Kambing — 1 orang (tidak patungan)']
    ], 'sapi');
    const hargaI = T.input('text', 'Harga hewan (Rp)', '');
    const box = T.out();
    const namesBox = T.out();
    let names = [''];

    const maxOrang = () => hewanSel.value === 'sapi' ? 7 : 1;

    const renderNames = () => {
      const max = maxOrang();
      if (names.length > max) names = names.slice(0, max);
      while (names.length === 0) names.push('');
      T.show(namesBox,
        '<p class="note"><b>Nama peserta (' + names.length + '/' + max + '):</b></p>' +
        names.map((n, i) =>
          '<div style="display:flex;gap:8px;margin-bottom:8px">' +
          '<div style="flex:1">' + T.input('text', 'Nama peserta ' + (i + 1), n).outerHTML + '</div>' +
          (names.length > 1 ? '<button class="btn" data-del="' + i + '" style="flex-shrink:0">✕</button>' : '') +
          '</div>').join('') +
        (names.length < max
          ? '<button class="btn" data-add="1">＋ Tambah peserta</button>'
          : '<p class="hint">Sudah maksimal ' + max + ' orang.</p>'));
      namesBox.querySelectorAll('input').forEach((el, i) => {
        el.addEventListener('input', () => { names[i] = el.value; hitung(); });
      });
      const addB = namesBox.querySelector('[data-add]');
      if (addB) addB.addEventListener('click', () => { names.push(''); renderNames(); hitung(); });
      namesBox.querySelectorAll('[data-del]').forEach((b) => {
        b.addEventListener('click', () => { names.splice(Number(b.dataset.del), 1); renderNames(); hitung(); });
      });
    };

    const hitung = () => {
      const harga = T.num(hargaI.value) || 0;
      const max = maxOrang();
      if (!harga || harga <= 0) { T.show(box, '<p class="warn">Isi harga hewannya dulu.</p>'); return; }
      const peserta = names.filter((n) => String(n).trim());
      const n = peserta.length;
      if (!n) { T.show(box, '<p class="warn">Isi minimal 1 nama peserta dulu.</p>'); return; }
      const perOrang = harga / n;
      const isPatungan = n > 1;
      const daftar = peserta.map((n, i) => {
        const nama = n.trim() || 'Peserta ' + (i + 1);
        return kv(nama, T.rp(perOrang));
      }).join('');
      T.show(box,
        kv('Jenis hewan', hewanSel.value === 'sapi' ? 'Sapi (patungan)' : 'Kambing') +
        kv('Harga hewan', T.rp(harga)) +
        kv('Jumlah peserta', n + ' orang') +
        '<div class="kv total"><span class="k"><b>Iuran per orang</b></span><span class="v"><b>' + T.rp(perOrang) + '</b></span></div>' +
        '<p class="note"><b>Ringkasan per peserta:</b></p>' + daftar +
        (isPatungan
          ? '<p class="hint">Sapi maksimal 7 orang per hewan. Kalau pesertanya lebih, kurbannya jadi 2 sapi ya.</p>'
          : ''));
    };

    hewanSel.addEventListener('change', () => {
      if (hewanSel.value === 'kambing') names = names.slice(0, 1);
      else if (!names.length) names = [''];
      renderNames();
      hitung();
    });
    hargaI.addEventListener('input', hitung);

    root.appendChild(T.el('<p class="note">Mau patungan kurban tapi bingung iurannya berapa per orang? Isi harga hewannya, tulis nama pesertanya, langsung kehitung.</p>'));
    root.appendChild(T.field('Jenis hewan', hewanSel));
    root.appendChild(T.field('Harga hewan (Rp)', hargaI));
    root.appendChild(namesBox);
    root.appendChild(T.row(T.btn('Hitung iuran', hitung, true)));
    root.appendChild(box);
    renderNames();

}
