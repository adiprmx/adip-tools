import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id": "mau-makan-apa", "name": "Mau Makan Apa?", "cat": "fun", "icon": "🍜", "desc": "Bingung mau makan apa? Biar acak yang mutusin.", "keywords": "makan,kuliner,acak,makanan,indonesia,laper"};
export function render(root) {

    // [nama, kategori]: berat | ringan | kuah | cepat
    const BANK = [
      ['Nasi Goreng', 'berat'], ['Rendang', 'berat'], ['Mie Ayam', 'berat'], ['Sate Ayam', 'berat'],
      ['Ayam Geprek', 'berat'], ['Nasi Padang', 'berat'], ['Gado-gado', 'berat'], ['Pecel Lele', 'berat'],
      ['Ayam Penyet', 'berat'], ['Mie Goreng', 'berat'], ['Kwetiau Goreng', 'berat'], ['Bihun Goreng', 'berat'],
      ['Nasi Kuning', 'berat'], ['Nasi Uduk', 'berat'], ['Gudeg', 'berat'], ['Nasi Liwet', 'berat'],
      ['Ayam Bakar', 'berat'], ['Ikan Bakar', 'berat'], ['Nasi Campur', 'berat'], ['Ayam Goreng Lalapan', 'berat'],
      ['Soto Ayam', 'kuah'], ['Bakso', 'kuah'], ['Rawon', 'kuah'], ['Sop Buntut', 'kuah'],
      ['Lontong Sayur', 'kuah'], ['Bubur Ayam', 'kuah'], ['Soto Betawi', 'kuah'], ['Soto Lamongan', 'kuah'],
      ['Soto Mie', 'kuah'], ['Mie Aceh', 'kuah'], ['Laksa', 'kuah'], ['Sup Ayam', 'kuah'],
      ['Sayur Asem', 'kuah'], ['Tom Yum', 'kuah'], ['Ramen', 'kuah'], ['Bakmi Jawa', 'kuah'],
      ['Soto Kudus', 'kuah'], ['Empal Gentong', 'kuah'], ['Coto Makassar', 'kuah'], ['Seblak', 'kuah'],
      ['Mie Celor', 'kuah'], ['Sop Iga', 'kuah'],
      ['Pempek', 'ringan'], ['Ketoprak', 'ringan'], ['Siomay', 'ringan'], ['Batagor', 'ringan'],
      ['Cilok', 'ringan'], ['Cireng', 'ringan'], ['Tahu Gejrot', 'ringan'], ['Rujak Buah', 'ringan'],
      ['Asinan', 'ringan'], ['Martabak Manis', 'ringan'], ['Pisang Goreng', 'ringan'], ['Singkong Goreng', 'ringan'],
      ['Tempe Mendoan', 'ringan'], ['Bakwan', 'ringan'], ['Risoles', 'ringan'], ['Lemper', 'ringan'],
      ['Arem-arem', 'ringan'], ['Tahu Isi', 'ringan'], ['Perkedel', 'ringan'], ['Combro', 'ringan'],
      ['Burger', 'cepat'], ['Fried Chicken', 'cepat'], ['Pizza', 'cepat'], ['Kentang Goreng', 'cepat'],
      ['Kebab', 'cepat'], ['Sandwich', 'cepat'], ['Spaghetti', 'cepat'], ['Chicken Katsu', 'cepat'],
      ['Rice Bowl Ayam', 'cepat'], ['Hot Dog', 'cepat'], ['Chicken Wings', 'cepat'], ['Nugget', 'cepat'],
    ];
    const FILTERS = [['semua', '🍽️ Semua'], ['berat', '🍚 Makanan Berat'], ['ringan', '🥟 Ringan'], ['kuah', '🍲 Berkuah'], ['cepat', '🍔 Cepat Saji']];
    const LABEL = { berat: 'Makanan Berat', ringan: 'Ringan', kuah: 'Berkuah', cepat: 'Cepat Saji' };

    let filter = 'semua';
    try { filter = localStorage.getItem('mauMakanApa.filter') || 'semua'; } catch (e) { /* abaikan */ }
    if (!LABEL[filter] && filter !== 'semua') filter = 'semua';

    const sel = T.select(FILTERS, filter);
    sel.addEventListener('change', () => {
      filter = sel.value;
      try { localStorage.setItem('mauMakanApa.filter', filter); } catch (e) { /* abaikan */ }
    });

    const layar = T.el('<div class="big center" style="font-size:26px;min-height:64px;line-height:1.4">🤔</div>');
    const box = T.out();
    let timer = null, jalan = false;
    T.onLeave(() => { if (timer) clearTimeout(timer); });

    const daftar = () => (filter === 'semua' ? BANK : BANK.filter(([, k]) => k === filter));

    const acak = () => {
      const arr = daftar();
      if (!arr.length) { T.toast('Nggak ada makanan di kategori ini'); return; }
      if (jalan) return;
      jalan = true;
      T.hide(box);
      let tick = 0;
      const putaran = 14;
      const langkah = () => {
        const [nama] = arr[Math.floor(Math.random() * arr.length)];
        layar.textContent = nama;
        T.beep(400 + tick * 30, 0.04, 'square');
        tick++;
        if (tick < putaran) {
          timer = setTimeout(langkah, 45 + tick * 32); // makin lama makin pelan
        } else {
          const [namaAkhir, kat] = arr[Math.floor(Math.random() * arr.length)];
          layar.textContent = '🍜 ' + namaAkhir;
          T.beep(660, 0.12); T.beep(880, 0.2, 'sine', 0.12);
          T.show(box, '<p class="center mut">Keputusan final: <b>' + T.esc(LABEL[kat]) + '</b></p>' +
            '<p class="center hint">Nggak cocok? Pencet acak lagi, gratis kok.</p>');
          box.appendChild(T.row(T.copyBtn(() => namaAkhir, '📋 Salin')));
          jalan = false;
        }
      };
      langkah();
    };

    root.appendChild(T.field('Lagi pengen yang…', sel));
    root.appendChild(layar);
    root.appendChild(T.btn('🎲 Acak Makanan!', acak, true));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">' + BANK.length + ' makanan Indonesia di bank data. Kalau hasilnya nggak sreg di hati, itu tandanya kamu sebenarnya udah tau mau makan apa 😉</p>'));

}
