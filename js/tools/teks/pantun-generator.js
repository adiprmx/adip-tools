import { h as T, utils } from '../../core.js?v=6.9.5';

const TEMA = {
  cinta: [
    ["Bunga mawar bunga melati", "Mekar indah di pagi hari", "Kasih sayang takkan berganti", "Cinta ini suci abadi"],
    ["Burung dara terbang tinggi", "Hinggap di dahan pohon jati", "Jika rindu tak tertahan lagi", "Ku kirim salam lewat mimpi"],
    ["Pergi berlayar ke laut lepas", "Ombak tenang tiada henti", "Cintaku padamu tak pernah lepas", "Kan menemanimu sampai mati"],
    ["Air beriak tanda tak dalam", "Air tenang menghanyutkan", "Sayangku ini sungguh dalam", "Hanya untukmu seorang"],
    ["Kue lapis manis rasanya", "Dibeli ibu di pasar pagi", "Kasih sayang tulus adanya", "Hanya untukmu kasih sejati"]
  ],
  nasehat: [
    ["Kalau ada sumur di ladang", "Boleh kita menumpang mandi", "Kalau ada umur panjang", "Boleh kita berjumpa lagi"],
    ["Pohon kelapa di tepi pantai", "Daunnya melambai kena angin", "Rajin belajar pangkal pandai", "Bukan harta yang paling penting"],
    ["Naik perahu ke tengah laut", "Dayung diayun sampai ke tepian", "Ilmu dicari janganlah takut", "Nanti menyesal di kemudian"],
    ["Bunga kenanga harum baunya", "Tumbuh subur di halaman", "Jangan suka menunda-nunda", "Waktu berjalan tak kenal kawan"],
    ["Kuda berlari di padang rumput", "Kencang larinya tiada tanding", "Janganlah engkau mudah terhasut", "Pilihlah kawan yang membimbing"]
  ],
  lucu: [
    ["Ada anak namanya Udin", "Pergi ke pasar membeli ikan", "Uang jajan habis dibeliin", "Pulang-pulang cuma bawa kenangan"],
    ["Kucing oren duduk di pagar", "Ekor bergoyang kanan kiri", "Lihat dompet langsung tegar", "Tanggal tua janganlah iri"],
    ["Makan bakso di pinggir jalan", "Kuahnya panas mengepul", "Dompet kosong tetap jalan", "Minta traktir kawan sekumpul"],
    ["Ayam berkokok pagi-pagi", "Membangunkan si pemalas", "Alarm bunyi tetap tak pergi", "Akhirnya telat ketinggalan kelas"],
    ["Beli es teh di pinggir jalan", "Manis dingin di siang hari", "Lihat mantan lewat di jalan", "Pura-pura sibuk, eh malah lari"]
  ],
  perpisahan: [
    ["Burung camar terbang melayang", "Hinggap sebentar di dahan cemara", "Walau berat hati berpisah sayang", "Semoga sukses di perantauan"],
    ["Perahu kecil berlayar ke utara", "Ombak memecah di haluan", "Jangan lupa kawan lama", "Walau jarak kini berjauhan"],
    ["Mentari tenggelam di ufuk barat", "Langit berubah jadi jingga", "Waktunya tiba kita berpisah", "Semoga kita jumpa di lain masa"],
    ["Kereta api melaju kencang", "Meninggalkan stasiun tua", "Air mata tak tertahan", "Sampai jumpa di lain suasana"],
    ["Pergi merantau ke negeri orang", "Meninggalkan kampung halaman", "Jaga diri baik-baik sayang", "Kami di sini selalu menantimu pulang"]
  ]
};

export const meta = {"id": "pantun-generator", "name": "Pantun Generator", "cat": "teks", "icon": "📜", "desc": "Pantun ABAB siap pakai: cinta, nasehat, lucu, perpisahan.", "keywords": "pantun,sampiran,isi,puisi,indonesia"};
export function render(root) {

      const tema = T.select([
        ['cinta', '❤️ Cinta'],
        ['nasehat', '🧭 Nasehat'],
        ['lucu', '😂 Lucu'],
        ['perpisahan', '👋 Perpisahan']
      ], 'cinta');
      const box = T.out();
      let last = '';
      let lastIdx = -1;

      function acak() {
        const list = TEMA[tema.value] || TEMA.cinta;
        let idx = Math.floor(Math.random() * list.length);
        if (list.length > 1 && idx === lastIdx) idx = (idx + 1) % list.length;
        lastIdx = idx;
        const p = list[idx];
        last = p.join('\n');
        const sampiran = p.slice(0, 2).map((l) => T.esc(l)).join('<br>');
        const isi = p.slice(2).map((l) => T.esc(l)).join('<br>');
        T.show(box, `<div class="pantun-out">${sampiran}<br><br>${isi}</div>`);
      }

      tema.addEventListener('change', acak);
      const acakBtn = T.btn('🎲 Acak Pantun', acak, true);
      T.onLeave(() => { tema.removeEventListener('change', acak); });

      const row = T.el('<div class="row"></div>');
      row.appendChild(acakBtn);
      row.appendChild(T.copyBtn(() => last, 'Salin Pantun'));
      root.appendChild(T.field('Tema pantun', tema));
      root.appendChild(row);
      root.appendChild(box);
      acak();

}
