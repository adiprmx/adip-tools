import { h as T, utils, kv } from '../../core.js?v=6.5.0';

export const meta = {"id":"tabel-periodik","name":"Tabel Periodik","cat":"pelajar","icon":"⚛️","desc":"118 unsur kimia: ketuk buat lihat detailnya.","keywords":"tabel periodik,unsur,kimia,atom,simbol,massa"};

// [nomor, simbol, nama, massa atom, kategori]
const UNSUR = [
[1,"H","Hidrogen","1,008","Nonlogam"],[2,"He","Helium","4,003","Gas mulia"],
[3,"Li","Litium","6,94","Logam alkali"],[4,"Be","Berilium","9,012","Alkali tanah"],
[5,"B","Boron","10,81","Metaloid"],[6,"C","Karbon","12,011","Nonlogam"],
[7,"N","Nitrogen","14,007","Nonlogam"],[8,"O","Oksigen","15,999","Nonlogam"],
[9,"F","Fluorin","18,998","Halogen"],[10,"Ne","Neon","20,180","Gas mulia"],
[11,"Na","Natrium","22,990","Logam alkali"],[12,"Mg","Magnesium","24,305","Alkali tanah"],
[13,"Al","Aluminium","26,982","Logam miskin"],[14,"Si","Silikon","28,085","Metaloid"],
[15,"P","Fosfor","30,974","Nonlogam"],[16,"S","Belerang","32,06","Nonlogam"],
[17,"Cl","Klor","35,45","Halogen"],[18,"Ar","Argon","39,948","Gas mulia"],
[19,"K","Kalium","39,098","Logam alkali"],[20,"Ca","Kalsium","40,078","Alkali tanah"],
[21,"Sc","Skandium","44,956","Logam transisi"],[22,"Ti","Titanium","47,867","Logam transisi"],
[23,"V","Vanadium","50,942","Logam transisi"],[24,"Cr","Kromium","51,996","Logam transisi"],
[25,"Mn","Mangan","54,938","Logam transisi"],[26,"Fe","Besi","55,845","Logam transisi"],
[27,"Co","Kobalt","58,933","Logam transisi"],[28,"Ni","Nikel","58,693","Logam transisi"],
[29,"Cu","Tembaga","63,546","Logam transisi"],[30,"Zn","Seng","65,38","Logam transisi"],
[31,"Ga","Galium","69,723","Logam miskin"],[32,"Ge","Germanium","72,63","Metaloid"],
[33,"As","Arsen","74,922","Metaloid"],[34,"Se","Selenium","78,971","Nonlogam"],
[35,"Br","Brom","79,904","Halogen"],[36,"Kr","Kripton","83,798","Gas mulia"],
[37,"Rb","Rubidium","85,468","Logam alkali"],[38,"Sr","Stronsium","87,62","Alkali tanah"],
[39,"Y","Itrium","88,906","Logam transisi"],[40,"Zr","Zirkonium","91,224","Logam transisi"],
[41,"Nb","Niobium","92,906","Logam transisi"],[42,"Mo","Molibdenum","95,95","Logam transisi"],
[43,"Tc","Teknesium","[98]","Logam transisi"],[44,"Ru","Rutenium","101,07","Logam transisi"],
[45,"Rh","Rodium","102,91","Logam transisi"],[46,"Pd","Paladium","106,42","Logam transisi"],
[47,"Ag","Perak","107,87","Logam transisi"],[48,"Cd","Kadmium","112,41","Logam transisi"],
[49,"In","Indium","114,82","Logam miskin"],[50,"Sn","Timah","118,71","Logam miskin"],
[51,"Sb","Antimon","121,76","Metaloid"],[52,"Te","Telurium","127,60","Metaloid"],
[53,"I","Yodium","126,90","Halogen"],[54,"Xe","Xenon","131,29","Gas mulia"],
[55,"Cs","Sesium","132,91","Logam alkali"],[56,"Ba","Barium","137,33","Alkali tanah"],
[57,"La","Lantanum","138,91","Lantanida"],[58,"Ce","Serium","140,12","Lantanida"],
[59,"Pr","Praseodimium","140,91","Lantanida"],[60,"Nd","Neodimium","144,24","Lantanida"],
[61,"Pm","Prometium","[145]","Lantanida"],[62,"Sm","Samarium","150,36","Lantanida"],
[63,"Eu","Europium","151,96","Lantanida"],[64,"Gd","Gadolinium","157,25","Lantanida"],
[65,"Tb","Terbium","158,93","Lantanida"],[66,"Dy","Disprosium","162,50","Lantanida"],
[67,"Ho","Holmium","164,93","Lantanida"],[68,"Er","Erbium","167,26","Lantanida"],
[69,"Tm","Tulium","168,93","Lantanida"],[70,"Yb","Iterbium","173,05","Lantanida"],
[71,"Lu","Lutesium","174,97","Lantanida"],[72,"Hf","Hafnium","178,49","Logam transisi"],
[73,"Ta","Tantalum","180,95","Logam transisi"],[74,"W","Wolfram","183,84","Logam transisi"],
[75,"Re","Renium","186,21","Logam transisi"],[76,"Os","Osmium","190,23","Logam transisi"],
[77,"Ir","Iridium","192,22","Logam transisi"],[78,"Pt","Platina","195,08","Logam transisi"],
[79,"Au","Emas","196,97","Logam transisi"],[80,"Hg","Raksa","200,59","Logam transisi"],
[81,"Tl","Talium","204,38","Logam miskin"],[82,"Pb","Timbal","207,2","Logam miskin"],
[83,"Bi","Bismut","208,98","Logam miskin"],[84,"Po","Polonium","[209]","Metaloid"],
[85,"At","Astatin","[210]","Halogen"],[86,"Rn","Radon","[222]","Gas mulia"],
[87,"Fr","Fransium","[223]","Logam alkali"],[88,"Ra","Radium","[226]","Alkali tanah"],
[89,"Ac","Aktinium","[227]","Aktinida"],[90,"Th","Torium","232,04","Aktinida"],
[91,"Pa","Protaktinium","231,04","Aktinida"],[92,"U","Uranium","238,03","Aktinida"],
[93,"Np","Neptunium","[237]","Aktinida"],[94,"Pu","Plutonium","[244]","Aktinida"],
[95,"Am","Amerisium","[243]","Aktinida"],[96,"Cm","Kurium","[247]","Aktinida"],
[97,"Bk","Berkelium","[247]","Aktinida"],[98,"Cf","Kalifornium","[251]","Aktinida"],
[99,"Es","Einsteinium","[252]","Aktinida"],[100,"Fm","Fermium","[257]","Aktinida"],
[101,"Md","Mendelevium","[258]","Aktinida"],[102,"No","Nobelium","[259]","Aktinida"],
[103,"Lr","Lawrensium","[266]","Aktinida"],[104,"Rf","Ruterfordium","[267]","Logam transisi"],
[105,"Db","Dubnium","[268]","Logam transisi"],[106,"Sg","Seaborgium","[269]","Logam transisi"],
[107,"Bh","Bohrium","[270]","Logam transisi"],[108,"Hs","Hasium","[277]","Logam transisi"],
[109,"Mt","Meitnerium","[278]","Belum diketahui"],[110,"Ds","Darmstadtium","[281]","Belum diketahui"],
[111,"Rg","Roentgenium","[282]","Belum diketahui"],[112,"Cn","Kopernisium","[285]","Logam transisi"],
[113,"Nh","Nihonium","[286]","Belum diketahui"],[114,"Fl","Flerovium","[289]","Belum diketahui"],
[115,"Mc","Moskovium","[290]","Belum diketahui"],[116,"Lv","Livermorium","[293]","Belum diketahui"],
[117,"Ts","Tenesin","[294]","Halogen"],[118,"Og","Oganeson","[294]","Gas mulia"],
];

const WARNA = {
  'Logam alkali': '#ef4444', 'Alkali tanah': '#f59e0b', 'Logam transisi': '#60a5fa',
  'Logam miskin': '#34d399', 'Metaloid': '#2dd4bf', 'Nonlogam': '#a3e635',
  'Halogen': '#eab308', 'Gas mulia': '#a78bfa', 'Lantanida': '#f472b6',
  'Aktinida': '#fb7185', 'Belum diketahui': '#6b7280',
};

export function render(root) {
  const detail = T.out();
  const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:6px"></div>');

  const showDetail = (u) => {
    const w = WARNA[u[4]] || '#888';
    T.show(detail,
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
      '<div style="width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;background:' + w + '22;border:1px solid ' + w + ';color:#fff">' + T.esc(u[1]) + '</div>' +
      '<div><div class="big" style="margin:0">' + T.esc(u[2]) + '</div>' +
      '<div class="mut" style="font-size:12px">Unsur no. ' + u[0] + ' · ' + T.esc(u[4]) + '</div></div></div>' +
      kv('Simbol', T.esc(u[1])) +
      kv('Massa atom', T.esc(u[3]) + ' <span class="mut">u</span>') +
      kv('Kategori', T.esc(u[4])));
    detail.scrollIntoView && detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const draw = (filter) => {
    grid.innerHTML = '';
    const q = (filter || '').trim().toLowerCase();
    const shown = UNSUR.filter((u) => !q || u[2].toLowerCase().includes(q) || u[1].toLowerCase() === q);
    if (!shown.length) {
      grid.appendChild(T.el('<p class="mut" style="grid-column:1/-1">Nggak ada unsur yang cocok.</p>'));
      return;
    }
    shown.forEach((u) => {
      const w = WARNA[u[4]] || '#888';
      const cell = T.el(
        '<button type="button" style="border:1px solid ' + w + '66;background:' + w + '1a;border-radius:8px;padding:6px 2px;color:#fff;cursor:pointer">' +
        '<div style="font-size:9px;opacity:.6">' + u[0] + '</div>' +
        '<div style="font-weight:800;font-size:15px">' + T.esc(u[1]) + '</div>' +
        '<div style="font-size:8.5px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(u[2]) + '</div>' +
        '</button>');
      cell.addEventListener('click', () => showDetail(u));
      grid.appendChild(cell);
    });
  };

  const legend = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"></div>');
  Object.keys(WARNA).forEach((k) => {
    legend.appendChild(T.el('<span style="font-size:10.5px;padding:3px 8px;border-radius:20px;border:1px solid ' + WARNA[k] + '66;background:' + WARNA[k] + '1a">' + T.esc(k) + '</span>'));
  });

  const search = T.input('text', '🔍 Cari nama atau simbol, mis. "emas" / "Au"');
  search.addEventListener('input', () => { draw(search.value); });

  root.appendChild(T.el('<p class="hint">118 unsur, urut nomor atom. Ketuk salah satu buat lihat detailnya.</p>'));
  root.appendChild(T.field('Cari unsur', search));
  root.appendChild(detail);
  root.appendChild(grid);
  root.appendChild(T.el('<p class="hint">Legenda kategori:</p>'));
  root.appendChild(legend);
  draw('');
  showDetail(UNSUR[7]); // Oksigen sebagai contoh awal
}
