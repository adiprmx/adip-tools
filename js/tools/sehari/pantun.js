import { h as T, utils, esc } from '../../core.js?v=4.2.0';

export const meta = {"id": "pantun", "name": "Pantun Pembuka", "cat": "sehari", "icon": "🎭", "desc": "Template pantun buat presentasi."};

export function render(root) {

    const PEMBUKA = [
      { t: 'formal', b: 'Pagi hari embun menetes,\nBurung berkicau di dahan jati.\nIzinkan saya membuka sesi,\nDengan salam hormat yang berarti.' },
      { t: 'formal', b: 'Jalan-jalan ke kota Medan,\nSinggah sebentar membeli duku.\nSelamat pagi hadirin sekalian,\nTerima kasih atas waktu dan perhatianmu.' },
      { t: 'formal', b: 'Ke pasar membeli kain batik,\nBatik indah buatan Solo.\nDengan rendah hati saya angkat topik,\nSemoga bermanfaat bagi kita semua.' },
      { t: 'formal', b: 'Burung garuda terbang tinggi,\nHinggap sebentar di pohon mangga.\nAssalamu\u2019alaikum saya sampaikan lagi,\nSemoga acara berjalan lancar jaya.' },
      { t: 'santai', b: 'Main ke pantai bawa kelapa,\nKelapa muda manis rasanya.\nSantai saja kita belajar bersama,\nYang penting pulang bawa ilmunya.' },
      { t: 'santai', b: 'Ke warung beli gorengan,\nGorengan hangat lima ribuan.\nJangan tegang dengarkan presentasi,\nKita diskusi bareng-bareng kawan.' },
      { t: 'santai', b: 'Naik kereta ke Bandung,\nBandung dingin udaranya.\nSambil ngopi kita sambung,\nMateri asyik, jangan ke mana-mana.' },
      { t: 'santai', b: 'Beli batagor di pinggir jalan,\nBatagor enak bumbunya kacang.\nDuduk santai dengarkan penjelasan,\nKalau bingung langsung tanya abang.' },
      { t: 'lucu', b: 'Ada kucing makan ikan,\nIkannya digoreng pakai mentega.\nJangan panik, jangan deg-degan,\nPresentasi ini anti bikin nganga.' },
      { t: 'lucu', b: 'Ke dapur masak mi instan,\nMi-nya enak, kuahnya seger.\nKalau ngantuk, tahan-tahan,\nSebentar lagi kita bubar, geser.' },
      { t: 'lucu', b: 'Beli es teh di pinggir jalan,\nEs teh manis campur jeruk nipis.\nWalaupun saya bukan pujangga,\nPantun ini khusus buat yang manis.' },
      { t: 'lucu', b: 'Kuda nil berendam di kali,\nAirnya keruh, lumpurnya tebal.\nSaya deg-degan setengah mati,\nTapi demi nilai, saya tetap nekat.' },
    ];
    const PENUTUP = [
      { t: 'semua', b: 'Burung nuri, burung cendrawasih,\nCukup sekian dan terima kasih.' },
      { t: 'semua', b: 'Jalan-jalan ke kota tua,\nPulang-pulang bawa oleh-oleh.\nMohon maaf bila ada salah kata,\nSampai jumpa di lain waktu, boleh?' },
      { t: 'semua', b: 'Pohon kelapa daunnya lebat,\nBuahnya manis, isinya segar.\nPresentasi saya sudah tamat,\nSemoga ilmu makin mekar.' },
      { t: 'semua', b: 'Naik delman ke Pasar Senen,\nPulangnya mampir beli sate.\nSekian dulu dari saya, kawan,\nKurang lebihnya mohon maaf, ya.' },
      { t: 'semua', b: 'Makan soto di warung pinggir,\nSoto panas, kuahnya kental.\nSelesai sudah materi yang tersaji,\nTerima kasih, sampai jumpa kembali.' },
      { t: 'semua', b: 'Ke toko membeli buku,\nBuku tulis sampulnya biru.\nSaya tutup dengan doa dan restu,\nSukses selalu untukmu.' },
      { t: 'formal', b: 'Bunga mawar, bunga melati,\nHarum semerbak di pagi hari.\nAkhir kata saya tutup presentasi,\nWassalamu\u2019alaikum, terima kasih sekali.' },
      { t: 'lucu', b: 'Ikan hiu makan tomat,\nI love you so much.\nSelesai sudah, jangan ngantuk berat,\nSemoga ilmunya nempel terus.' },
    ];
    const tema = T.select([['semua', 'Semua tema'], ['formal', 'Formal'], ['santai', 'Santai'], ['lucu', 'Lucu']], 'semua');
    const jenis = T.select([['pembuka', 'Pembuka'], ['penutup', 'Penutup']], 'pembuka');
    const box = T.out();
    let current = '';
    const acak = () => {
      const bank = jenis.value === 'pembuka' ? PEMBUKA : PENUTUP;
      const pool = bank.filter((p) => tema.value === 'semua' || p.t === 'semua' || p.t === tema.value);
      if (!pool.length) { T.show(box, '<span class="err">Tidak ada pantun untuk kombinasi ini.</span>'); return; }
      current = pool[Math.floor(Math.random() * pool.length)].b;
      T.show(box, '<pre>' + esc(current) + '</pre>');
    };
    root.appendChild(T.grid2(T.field('Tema', tema), T.field('Jenis', jenis)));
    root.appendChild(T.row(T.btn('Acak pantun', acak, true), T.copyBtn(() => current || 'Acak dulu pantunnya', 'Salin')));
    root.appendChild(box);
    acak();
    tema.addEventListener('change', acak);
    jenis.addEventListener('change', acak);
  
}
