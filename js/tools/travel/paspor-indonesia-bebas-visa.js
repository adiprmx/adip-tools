import { h as T } from '../../core.js';

// Data: Wikipedia "Visa requirements for Indonesian citizens" (merujuk
// Henley Passport Index & Timatic), diambil & diparse 18 Nov 2026.
// Format: [nama, status, lama tinggal, catatan]
// status: bebas = bebas visa, voa = visa on arrival,
//         evisa = eVisa/izin online, visa = butuh visa.
const NEGARA = [
  ['Angola', 'bebas', '30 hari'], ['Antigua and Barbuda', 'bebas', '30 hari'],
  ['Barbados', 'bebas', '90 hari'], ['Belarus', 'bebas', '30 hari', 'eVisa juga tersedia'],
  ['Brazil', 'bebas', '30 hari'], ['Brunei', 'bebas', '14 hari'],
  ['Cambodia', 'bebas', '30 hari'], ['Chile', 'bebas', '60 hari'],
  ['Colombia', 'bebas', '90 hari'], ['Dominica', 'bebas', '21 hari'],
  ['Ecuador', 'bebas', '90 hari'], ['Fiji', 'bebas', '120 hari'],
  ['Haiti', 'bebas', '90 hari'], ['Iran', 'bebas', '15 hari'],
  ['Japan', 'bebas', '15 hari', 'Hanya untuk e-paspor yang sudah didaftarkan'],
  ['Kazakhstan', 'bebas', '30 hari'], ['Kiribati', 'bebas', '90 hari'],
  ['Laos', 'bebas', '30 hari'], ['Malaysia', 'bebas', '30 hari'],
  ['Mali', 'bebas', '30 hari'], ['Micronesia', 'bebas', '30 hari'],
  ['Morocco', 'bebas', '90 hari'], ['Myanmar', 'bebas', '14 hari'],
  ['Namibia', 'bebas', '90 hari'], ['Oman', 'bebas', '14 hari / 30 hari', '30 hari bila pakai eVisa'],
  ['Peru', 'bebas', '90 hari'], ['Philippines', 'bebas', '30 hari'],
  ['Qatar', 'bebas', '30 hari'], ['Rwanda', 'bebas', '90 hari'],
  ['Saint Vincent and the Grenadines', 'bebas', '3 bulan'],
  ['Serbia', 'bebas', '30 hari'], ['Singapore', 'bebas', '30 hari'],
  ['Suriname', 'bebas', '90 hari'], ['Tajikistan', 'bebas', '30 hari / 60 hari', '60 hari bila pakai eVisa'],
  ['Thailand', 'bebas', '60 hari'], ['Timor-Leste', 'bebas', '30 hari'],
  ['Tunisia', 'bebas', '30 hari'], ['Turkey', 'bebas', '30 hari'],
  ['Uzbekistan', 'bebas', '30 hari'], ['Venezuela', 'bebas', '90 hari'],
  ['Vietnam', 'bebas', '14 hari'],
  ['Armenia', 'voa', '120 hari', 'eVisa juga tersedia'],
  ['Azerbaijan', 'voa', '30 hari', 'eVisa juga tersedia'],
  ['Bahrain', 'voa', '14 hari', 'eVisa juga tersedia'],
  ['Bangladesh', 'voa', '30 hari'], ['Burundi', 'voa', '1 bulan', 'eVisa juga tersedia'],
  ['Comoros', 'voa', '45 hari'], ['Ethiopia', 'voa', '90 hari', 'eVisa juga tersedia'],
  ['Guinea-Bissau', 'voa', '90 hari'], ['Jordan', 'voa', '30 hari', 'eVisa juga tersedia'],
  ['Kyrgyzstan', 'voa', '60 hari', 'eVisa juga tersedia'],
  ['Madagascar', 'voa', '90 hari', 'eVisa juga tersedia'],
  ['Malawi', 'voa', '90 hari', 'eVisa juga tersedia'],
  ['Maldives', 'voa', '30 hari', 'eVisa juga tersedia'],
  ['Marshall Islands', 'voa', '90 hari'], ['Mauritius', 'voa', '60 hari'],
  ['Nepal', 'voa', '90 hari', 'eVisa juga tersedia'],
  ['Palau', 'voa', '30 hari', 'eVisa juga tersedia'],
  ['Papua New Guinea', 'voa', '60 hari'], ['Paraguay', 'voa', '30 hari'],
  ['Samoa', 'voa', '90 hari', 'Izin masuk saat tiba'],
  ['Sierra Leone', 'voa', '3 bulan / 30 hari', '30 hari bila pakai eVisa'],
  ['Sri Lanka', 'voa', '30 hari', 'eVisa juga tersedia'],
  ['Tanzania', 'voa', '90 hari', 'eVisa juga tersedia'],
  ['Tuvalu', 'voa', '1 bulan'], ['Zimbabwe', 'voa', '1 bulan', 'eVisa juga tersedia'],
  ['Afghanistan', 'evisa', '30 hari', 'Bersyarat'], ['Albania', 'evisa', '90 hari'],
  ['Bahamas', 'evisa', '3 bulan'], ['Benin', 'evisa', '30 hari'],
  ['Bhutan', 'evisa', '90 hari'], ['Botswana', 'evisa', '3 bulan'],
  ['Burkina Faso', 'evisa', ''], ['Cameroon', 'evisa', ''], ['Chad', 'evisa', ''],
  ["Côte d'Ivoire", 'evisa', '3 bulan'], ['Cuba', 'evisa', '90 hari'],
  ['Democratic Republic of the Congo', 'evisa', '7 hari'],
  ['Djibouti', 'evisa', '90 hari'], ['Equatorial Guinea', 'evisa', ''],
  ['Gabon', 'evisa', '90 hari'], ['Georgia', 'evisa', '30 hari'],
  ['Guinea', 'evisa', '90 hari'], ['Guyana', 'evisa', ''],
  ['India', 'evisa', '90 hari', 'eVisa gratis'], ['Iraq', 'evisa', '30 hari'],
  ['Kenya', 'evisa', '90 hari', 'eTA (izin perjalanan elektronik)'],
  ['Liberia', 'evisa', '3 bulan', 'e-VOA'], ['Libya', 'evisa', ''],
  ['Mauritania', 'evisa', '30 hari'], ['Mongolia', 'evisa', '30 hari'],
  ['Mozambique', 'evisa', '30 hari'], ['Nigeria', 'evisa', '30 hari'],
  ['Pakistan', 'evisa', '3 bulan'], ['Russia', 'evisa', '30 hari'],
  ['Saint Kitts and Nevis', 'evisa', '90 hari', 'Izin perjalanan elektronik'],
  ['São Tomé and Príncipe', 'evisa', ''],
  ['Seychelles', 'evisa', '3 bulan', 'Electronic Border System'],
  ['Somalia', 'evisa', '30 hari'],
  ['South Africa', 'evisa', '90 hari', 'Izin perjalanan elektronik'],
  ['South Sudan', 'evisa', ''], ['Syria', 'evisa', ''], ['Togo', 'evisa', '15 hari'],
  ['Trinidad and Tobago', 'evisa', ''], ['Uganda', 'evisa', '3 bulan'],
  ['Ukraine', 'evisa', '30 hari'], ['Vanuatu', 'evisa', '120 hari'],
  ['Zambia', 'evisa', '90 hari'],
  ['Algeria', 'visa', ''], ['Andorra', 'visa', ''], ['Argentina', 'visa', ''],
  ['Australia', 'visa', ''], ['Austria', 'visa', ''], ['Belgium', 'visa', ''],
  ['Belize', 'visa', ''], ['Bolivia', 'visa', ''], ['Bosnia and Herzegovina', 'visa', ''],
  ['Bulgaria', 'visa', ''], ['Canada', 'visa', ''], ['Cape Verde', 'visa', ''],
  ['Central African Republic', 'visa', ''],
  ['China', 'visa', '', 'Transit 240 jam (10 hari) bebas visa ke negara ketiga lewat 64 pelabuhan resmi'],
  ['Costa Rica', 'visa', ''], ['Croatia', 'visa', ''], ['Cyprus', 'visa', ''],
  ['Czech Republic', 'visa', ''], ['Denmark', 'visa', ''], ['Dominican Republic', 'visa', ''],
  ['Egypt', 'visa', ''], ['El Salvador', 'visa', ''], ['Eritrea', 'visa', ''],
  ['Estonia', 'visa', ''], ['Eswatini', 'visa', ''], ['Finland', 'visa', ''],
  ['France', 'visa', ''], ['Gambia', 'visa', ''], ['Germany', 'visa', ''],
  ['Ghana', 'visa', ''], ['Greece', 'visa', ''], ['Grenada', 'visa', ''],
  ['Guatemala', 'visa', ''], ['Honduras', 'visa', ''], ['Hungary', 'visa', ''],
  ['Iceland', 'visa', ''], ['Ireland', 'visa', ''], ['Israel', 'visa', ''],
  ['Italy', 'visa', ''], ['Jamaica', 'visa', ''], ['Kuwait', 'visa', ''],
  ['Latvia', 'visa', ''], ['Lebanon', 'visa', ''], ['Lesotho', 'visa', ''],
  ['Liechtenstein', 'visa', ''], ['Lithuania', 'visa', ''], ['Luxembourg', 'visa', ''],
  ['Malta', 'visa', ''], ['Mexico', 'visa', ''], ['Moldova', 'visa', ''],
  ['Monaco', 'visa', ''], ['Montenegro', 'visa', ''], ['Nauru', 'visa', ''],
  ['Netherlands', 'visa', ''], ['New Zealand', 'visa', ''], ['Nicaragua', 'visa', ''],
  ['Niger', 'visa', ''], ['North Korea', 'visa', ''], ['North Macedonia', 'visa', ''],
  ['Norway', 'visa', ''], ['Panama', 'visa', ''], ['Poland', 'visa', ''],
  ['Portugal', 'visa', ''], ['Republic of the Congo', 'visa', ''], ['Romania', 'visa', ''],
  ['Saint Lucia', 'visa', ''], ['San Marino', 'visa', ''], ['Saudi Arabia', 'visa', ''],
  ['Senegal', 'visa', ''], ['Slovakia', 'visa', ''], ['Slovenia', 'visa', ''],
  ['Solomon Islands', 'visa', ''], ['South Korea', 'visa', ''], ['Spain', 'visa', ''],
  ['Sudan', 'visa', ''], ['Sweden', 'visa', ''], ['Switzerland', 'visa', ''],
  ['Tonga', 'visa', ''], ['Turkmenistan', 'visa', ''], ['United Arab Emirates', 'visa', ''],
  ['United Kingdom', 'visa', ''], ['United States', 'visa', ''], ['Uruguay', 'visa', ''],
  ['Vatican City', 'visa', ''], ['Yemen', 'visa', ''],
];
const WILAYAH = [
  ['Pitcairn Islands', 'bebas'], ['Hong Kong', 'bebas'], ['Macau', 'bebas'],
  ['Cook Islands', 'bebas'], ['Niue', 'bebas'],
  ['Anguilla', 'evisa'], ['Ascension Island', 'evisa'], ['Montserrat', 'evisa'],
  ['Saint Helena', 'evisa'],
  ['Bermuda', 'visa'], ['British Virgin Islands', 'visa'],
  ['British Indian Ocean Territory', 'visa'], ['Cayman Islands', 'visa'],
  ['Falkland Islands', 'visa'], ['Gibraltar', 'visa'], ['Guernsey', 'visa'],
  ['Isle of Man', 'visa'], ['Jersey', 'visa'],
  ['Tristan da Cunha', 'visa', '', 'Butuh izin dari Dewan pulau'],
  ['Turks and Caicos', 'visa'], ['Faroe Islands', 'visa'], ['Greenland', 'visa'],
  ['Aruba', 'visa'], ['Curaçao', 'visa'], ['Sint Maarten', 'visa'],
  ['French Guiana', 'visa'], ['French Polynesia', 'visa'], ['Mayotte', 'visa'],
  ['New Caledonia', 'visa'], ['Réunion', 'visa'], ['Saint Pierre and Miquelon', 'visa'],
  ['Wallis and Futuna', 'visa'], ['Tokelau', 'visa'], ['American Samoa', 'visa'],
  ['Guam', 'visa'], ['Northern Mariana Islands', 'visa'], ['U.S. Virgin Islands', 'visa'],
  ['Puerto Rico', 'visa'],
];
const TAKDIAKUI = [
  ['Northern Cyprus', 'bebas'], ['Palestine', 'bebas'],
  ['Abkhazia', 'visa'], ['Kosovo', 'visa'], ['South Ossetia', 'visa'],
  ['Taiwan', 'visa', '', 'Ada izin online (TAC) bagi pemegang visa negara tertentu'],
];
// Alias pencarian bahasa Indonesia.
const ALIAS = {
  'United States': 'amerika serikat amerika usa', 'United Kingdom': 'inggris britania raya uk',
  'Netherlands': 'belanda', 'Germany': 'jerman', 'France': 'prancis perancis',
  'Japan': 'jepang', 'South Korea': 'korea selatan korsel', 'North Korea': 'korea utara korut',
  'China': 'tiongkok cina', 'Saudi Arabia': 'arab saudi',
  'United Arab Emirates': 'uni emirat arab emirat uea', 'New Zealand': 'selandia baru',
  'Russia': 'rusia', 'Turkey': 'turki turkiye', 'Singapore': 'singapura',
  'Philippines': 'filipina', 'Egypt': 'mesir', 'Canada': 'kanada', 'Mexico': 'meksiko',
  'Brazil': 'brasil', 'Italy': 'italia', 'Spain': 'spanyol', 'Greece': 'yunani',
  'Switzerland': 'swiss', 'Sweden': 'swedia', 'Norway': 'norwegia',
  'Finland': 'finlandia', 'Poland': 'polandia', 'Belgium': 'belgia',
  'Ireland': 'irlandia', 'Iceland': 'islandia', 'Ukraine': 'ukraina',
  'Hong Kong': 'hongkong', 'South Africa': 'afrika selatan',
  'Czech Republic': 'cek ceko', 'Vatican City': 'vatikan',
};
const STATUS = {
  bebas: ['Bebas visa', '#4ade80'],
  voa: ['Visa on arrival', '#60a5fa'],
  evisa: ['eVisa / izin online', '#c084fc'],
  visa: ['Butuh visa', '#ef4444'],
};

export const meta = {"id": "paspor-indonesia-bebas-visa", "name": "Paspor Indonesia Bebas Visa", "cat": "travel", "icon": "🛂", "desc": "Cek negara mana saja yang bisa dikunjungi pemegang paspor Indonesia tanpa visa.", "keywords": "paspor,visa,bebas visa,voa,evisa,travel,luar negeri,imigrasi", "since": "6.16.0"};
export function render(root) {
  const semua = [
    ...NEGARA.map((e) => ({ e, bagian: 'Negara' })),
    ...WILAYAH.map((e) => ({ e, bagian: 'Wilayah' })),
    ...TAKDIAKUI.map((e) => ({ e, bagian: 'Belum diakui penuh' })),
  ];
  const hitung = (st) => NEGARA.filter((e) => e[1] === st).length;
  const hitungSemua = (st) => semua.filter((x) => x.e[1] === st).length;

  const cariI = T.input('text', 'Cari negara — cth: Jepang, Thailand, Amerika…', '');
  let filter = 'semua';
  const daftar = T.el('<div></div>');

  const badge = (st) => {
    const [label, warna] = STATUS[st];
    return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:' + warna + '22;color:' + warna + ';border:1px solid ' + warna + '55;white-space:nowrap">' + label + '</span>';
  };
  const tampil = () => {
    const q = cariI.value.trim().toLowerCase();
    const cocok = semua.filter(({ e }) => {
      if (filter !== 'semua' && e[1] !== filter) return false;
      if (!q) return true;
      const nama = e[0].toLowerCase();
      const alias = (ALIAS[e[0]] || '').toLowerCase();
      return nama.includes(q) || alias.includes(q);
    });
    daftar.innerHTML = '';
    if (!cocok.length) {
      daftar.appendChild(T.el('<p class="note">Tidak ada yang cocok. Coba kata kunci lain — nama negara ditulis dalam bahasa Inggris, tapi kamu bisa mencari dengan nama Indonesianya (mis. "Jepang", "Amerika").</p>'));
      return;
    }
    daftar.appendChild(T.el('<p class="mut">Menampilkan ' + cocok.length + ' dari ' + semua.length + ' entri.</p>'));
    let bagianTerakhir = '';
    cocok.forEach(({ e, bagian }) => {
      if (bagian !== bagianTerakhir) {
        bagianTerakhir = bagian;
        daftar.appendChild(T.el('<div class="sechead" style="margin-top:16px"><h2>' + bagian + '</h2></div>'));
      }
      const [nama, st, lama, catatan] = e;
      const baris = T.el('<div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)"></div>');
      baris.innerHTML = '<div><b>' + T.esc(nama) + '</b>' +
        (lama ? '<span class="mut"> · ' + T.esc(lama) + '</span>' : '') +
        (catatan ? '<br><span class="mut" style="font-size:12.5px">' + T.esc(catatan) + '</span>' : '') +
        '</div>';
      const b = T.el('<div style="flex-shrink:0">' + badge(st) + '</div>');
      baris.appendChild(b);
      daftar.appendChild(baris);
    });
  };

  const chips = T.el('<div class="row" style="flex-wrap:wrap;gap:6px;margin:12px 0"></div>');
  [['semua', 'Semua (' + semua.length + ' entri)'], ['bebas', 'Bebas visa (' + hitungSemua('bebas') + ')'], ['voa', 'Visa on arrival (' + hitungSemua('voa') + ')'], ['evisa', 'eVisa (' + hitungSemua('evisa') + ')'], ['visa', 'Butuh visa (' + hitungSemua('visa') + ')']].forEach(([st, label]) => {
    const c = T.btn(label, () => {
      filter = st;
      chips.querySelectorAll('button').forEach((x) => { x.style.background = ''; x.style.color = ''; });
      c.style.background = '#ff6f61'; c.style.color = '#161311';
      tampil();
    });
    if (st === 'semua') { c.style.background = '#ff6f61'; c.style.color = '#161311'; }
    chips.appendChild(c);
  });

  cariI.addEventListener('input', tampil);

  root.appendChild(T.el('<p class="note">Pemegang paspor Indonesia bisa masuk <b>' + hitung('bebas') + ' negara tanpa visa</b>, <b>' + hitung('voa') + ' negara dengan visa on arrival</b>, dan <b>' + hitung('evisa') + ' negara dengan eVisa</b> — dari ' + NEGARA.length + ' negara yang didata. Menurut Henley Passport Index 2026, paspor Indonesia bisa masuk 70 destinasi tanpa visa atau visa on arrival (peringkat 63 dunia).</p>'));
  root.appendChild(T.field('Cari negara', cariI));
  root.appendChild(chips);
  root.appendChild(daftar);
  root.appendChild(T.el('<p class="hint">Data 18 November 2026 — sumber Wikipedia "Visa requirements for Indonesian citizens" (merujuk Henley Passport Index &amp; Timatic). Aturan visa bisa berubah sewaktu-waktu: periksa ke kedutaan sebelum berangkat. Nama negara ditulis dalam bahasa Inggris sesuai sumber; lama tinggal kosong berarti sumber tidak mencantumkannya.</p>'));
  tampil();
}
