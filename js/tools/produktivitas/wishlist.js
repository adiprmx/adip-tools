import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"wishlist","name":"Wishlist","cat":"produktivitas","icon":"🎁","desc":"Daftar barang impian + progress nabung.","keywords":"wishlist,impian,nabung,target,belanja"};

const KEY = 'adip-tools:wishlist';
const load = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(d) ? d : [];
  } catch (e) { return []; }
};
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };

export function render(root) {
  let items = load();

  const namaInp = T.input('text', 'Nama barang impian', '');
  const hargaInp = T.input('number', 'Harga (Rp)', '');
  const linkInp = T.input('text', 'Link toko (opsional)', '');

  const ringkas = T.out();
  const daftar = T.out();

  const paintRingkasan = () => {
    const aktif = items.filter((i) => !i.kebeli);
    const totalHarga = aktif.reduce((s, i) => s + (Number(i.harga) || 0), 0);
    const totalNabung = aktif.reduce((s, i) => s + Math.min(Number(i.nabung) || 0, Number(i.harga) || 0), 0);
    const sisa = Math.max(0, totalHarga - totalNabung);
    const kebeli = items.length - aktif.length;
    T.show(ringkas,
      '<div class="kv"><span class="k">🎯 Total target</span><span class="v"><b>' + T.rp(totalHarga) + '</b></span></div>' +
      '<div class="kv"><span class="k">💰 Sudah terkumpul</span><span class="v">' + T.rp(totalNabung) + '</span></div>' +
      '<div class="kv"><span class="k">📉 Sisa nabung</span><span class="v">' + T.rp(sisa) + '</span></div>' +
      '<div class="dim" style="font-size:12px;margin-top:4px">' + aktif.length + ' barang diincar' + (kebeli ? ' &bull; ' + kebeli + ' sudah kebeli ✅' : '') + '</div>'
    );
  };

  const paintDaftar = () => {
    if (!items.length) {
      T.show(daftar, '<p class="hint center" style="margin:16px 0">Belum ada barang impian. Tambah satu di atas, biar nabungnya ada tujuan! 🎁</p>');
      return;
    }
    daftar.innerHTML = '';
    // yang belum kebeli dulu, yang sudah kebeli di bawah
    const urut = items.slice().sort((a, b) => (a.kebeli ? 1 : 0) - (b.kebeli ? 1 : 0));
    urut.forEach((it) => {
      const harga = Number(it.harga) || 0;
      const nabung = Math.min(Number(it.nabung) || 0, harga);
      const pct = harga > 0 ? Math.min(100, Math.round((nabung / harga) * 100)) : 0;
      const sisa = Math.max(0, harga - nabung);
      const kartu = T.el('<div style="background:#141416;border:1px solid #ffffff14;border-radius:12px;padding:12px;margin-bottom:10px' + (it.kebeli ? ';opacity:0.65' : '') + '"></div>');
      const namaHtml = it.link
        ? '<a href="' + T.esc(it.link) + '" target="_blank" rel="noopener" style="color:#fff;font-weight:700">🔗 ' + T.esc(it.nama) + '</a>'
        : '<b>' + T.esc(it.nama) + '</b>';
      kartu.innerHTML =
        '<div style="' + (it.kebeli ? 'text-decoration:line-through;' : '') + '">' + namaHtml + '</div>' +
        '<div class="big" style="font-size:20px;margin:4px 0">' + T.rp(harga) + '</div>' +
        '<div style="background:#1c1c1e;border-radius:8px;height:14px;overflow:hidden;margin:8px 0">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#34d399,#10b981);transition:width .3s"></div></div>' +
        '<div class="dim" style="font-size:12px">' + pct + '% &bull; terkumpul ' + T.rp(nabung) + (it.kebeli ? '' : ' &bull; sisa ' + T.rp(sisa)) + '</div>';
      const baris = T.el('<div class="row" style="margin-top:8px;flex-wrap:wrap"></div>');
      const nabungInp = T.input('number', 'Sudah terkumpul (Rp)', String(it.nabung || ''));
      nabungInp.style.maxWidth = '150px';
      nabungInp.addEventListener('change', () => {
        const v = Math.max(0, Math.round(T.num(nabungInp.value) || 0));
        it.nabung = v;
        save(items);
        paintSemua();
        if (v >= harga && harga > 0) T.toast('🎉 Target tercapai! Tinggal beli!');
      });
      baris.appendChild(nabungInp);
      const tglKebeli = T.btn(it.kebeli ? '↩️ Batal' : '✅ Kebeli', () => {
        it.kebeli = !it.kebeli;
        save(items);
        paintSemua();
        T.toast(it.kebeli ? 'Selamat! Barang impian kebeli 🎉' : 'Dikembalikan ke daftar incaran');
      });
      const hapus = T.btn('🗑️', () => {
        items = items.filter((x) => x.id !== it.id);
        save(items);
        paintSemua();
        T.toast('Barang dihapus dari wishlist');
      });
      baris.appendChild(tglKebeli);
      baris.appendChild(hapus);
      kartu.appendChild(baris);
      daftar.appendChild(kartu);
    });
  };

  const paintSemua = () => { paintRingkasan(); paintDaftar(); };

  const tambah = () => {
    const nama = namaInp.value.trim();
    const harga = Math.round(T.num(hargaInp.value) || 0);
    if (!nama) { T.toast('Isi nama barangnya dulu'); return; }
    if (!(harga > 0)) { T.toast('Isi harganya dengan angka yang valid'); return; }
    items.unshift({
      id: Date.now() + '' + Math.floor(Math.random() * 1e6),
      nama,
      harga,
      link: linkInp.value.trim(),
      nabung: 0,
      kebeli: false,
    });
    save(items);
    namaInp.value = ''; hargaInp.value = ''; linkInp.value = '';
    paintSemua();
    T.toast('Masuk wishlist! Semangat nabungnya 🎁');
  };

  root.appendChild(T.el('<p class="hint">Catat barang impianmu, pantau progress nabungnya, dan coret satu-satu begitu kebeli. Semangat! 🎁</p>'));
  root.appendChild(T.field('Nama barang', namaInp));
  root.appendChild(T.grid2(T.field('Harga (Rp)', hargaInp), T.field('Link toko (opsional)', linkInp)));
  root.appendChild(T.row(T.btn('＋ Tambah ke wishlist', tambah, true)));
  root.appendChild(T.el('<div class="dim" style="margin:14px 0 6px"><b>📊 Ringkasan</b></div>'));
  root.appendChild(ringkas);
  root.appendChild(T.el('<div class="dim" style="margin:14px 0 6px"><b>🎁 Barang impian</b></div>'));
  root.appendChild(daftar);
  paintSemua();
  namaInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambah(); });
}
