import { h as T } from '../../core.js';

export const meta = { id: 'kode-telepon-internasional', name: 'Kode Telepon Internasional', cat: 'sehari', icon: '📞', desc: 'Kode telepon semua negara untuk menelepon ke luar negeri, lengkap dengan pembentuk nomor internasional dari nomor lokal.', keywords: 'kode telepon,kode negara,calling code,telepon luar negeri,internasional,ITU', since: '6.18.0' };

// Kode telepon negara (ITU-T E.164), diambil dari dataset country-codes
// (datasets/country-codes, kolom Dial) dan dicek silang dengan daftar
// kode panggil negara. [nama Indonesia, nama Inggris, ISO, kode tanpa +]
// Catatan: Republik Dominika juga memakai +1829 dan +1849; Puerto Riko
// juga memakai +1939 (semua di rencana penomoran Amerika Utara).
export const NEGARA = [
  ['Afganistan', 'Afghanistan', 'AF', '93'],
  ['Albania', 'Albania', 'AL', '355'],
  ['Aljazair', 'Algeria', 'DZ', '213'],
  ['Amerika Serikat', 'United States', 'US', '1'],
  ['Andorra', 'Andorra', 'AD', '376'],
  ['Angola', 'Angola', 'AO', '244'],
  ['Anguilla', 'Anguilla', 'AI', '1264'],
  ['Antigua dan Barbuda', 'Antigua and Barbuda', 'AG', '1268'],
  ['Antartika', 'Antarctica', 'AQ', '672'],
  ['Arab Saudi', 'Saudi Arabia', 'SA', '966'],
  ['Argentina', 'Argentina', 'AR', '54'],
  ['Armenia', 'Armenia', 'AM', '374'],
  ['Aruba', 'Aruba', 'AW', '297'],
  ['Australia', 'Australia', 'AU', '61'],
  ['Austria', 'Austria', 'AT', '43'],
  ['Azerbaijan', 'Azerbaijan', 'AZ', '994'],
  ['Bahama', 'Bahamas', 'BS', '1242'],
  ['Bahrain', 'Bahrain', 'BH', '973'],
  ['Bangladesh', 'Bangladesh', 'BD', '880'],
  ['Barbados', 'Barbados', 'BB', '1246'],
  ['Belanda', 'Netherlands', 'NL', '31'],
  ['Belarusia', 'Belarus', 'BY', '375'],
  ['Belgia', 'Belgium', 'BE', '32'],
  ['Belize', 'Belize', 'BZ', '501'],
  ['Benin', 'Benin', 'BJ', '229'],
  ['Bermuda', 'Bermuda', 'BM', '1441'],
  ['Bhutan', 'Bhutan', 'BT', '975'],
  ['Bolivia', 'Bolivia', 'BO', '591'],
  ['Bosnia dan Herzegovina', 'Bosnia and Herzegovina', 'BA', '387'],
  ['Botswana', 'Botswana', 'BW', '267'],
  ['Brasil', 'Brazil', 'BR', '55'],
  ['Britania Raya', 'United Kingdom', 'GB', '44'],
  ['Brunei', 'Brunei', 'BN', '673'],
  ['Bulgaria', 'Bulgaria', 'BG', '359'],
  ['Burkina Faso', 'Burkina Faso', 'BF', '226'],
  ['Burundi', 'Burundi', 'BI', '257'],
  ['Ceko', 'Czech Republic', 'CZ', '420'],
  ['Chad', 'Chad', 'TD', '235'],
  ['Chili', 'Chile', 'CL', '56'],
  ['China', 'China', 'CN', '86'],
  ['Curaçao', 'Curacao', 'CW', '599'],
  ['Denmark', 'Denmark', 'DK', '45'],
  ['Djibouti', 'Djibouti', 'DJ', '253'],
  ['Dominika', 'Dominica', 'DM', '1767'],
  ['Ekuador', 'Ecuador', 'EC', '593'],
  ['El Salvador', 'El Salvador', 'SV', '503'],
  ['Eritrea', 'Eritrea', 'ER', '291'],
  ['Estonia', 'Estonia', 'EE', '372'],
  ['Eswatini', 'Eswatini (Swaziland)', 'SZ', '268'],
  ['Etiopia', 'Ethiopia', 'ET', '251'],
  ['Fiji', 'Fiji', 'FJ', '679'],
  ['Filipina', 'Philippines', 'PH', '63'],
  ['Finlandia', 'Finland', 'FI', '358'],
  ['Gabon', 'Gabon', 'GA', '241'],
  ['Gambia', 'Gambia', 'GM', '220'],
  ['Georgia', 'Georgia', 'GE', '995'],
  ['Ghana', 'Ghana', 'GH', '233'],
  ['Gibraltar', 'Gibraltar', 'GI', '350'],
  ['Grenada', 'Grenada', 'GD', '1473'],
  ['Greenland', 'Greenland', 'GL', '299'],
  ['Guadeloupe', 'Guadeloupe', 'GP', '590'],
  ['Guam', 'Guam', 'GU', '1671'],
  ['Guatemala', 'Guatemala', 'GT', '502'],
  ['Guernsey', 'Guernsey', 'GG', '44'],
  ['Guinea', 'Guinea', 'GN', '224'],
  ['Guinea-Bissau', 'Guinea-Bissau', 'GW', '245'],
  ['Guinea Khatulistiwa', 'Equatorial Guinea', 'GQ', '240'],
  ['Guyana', 'Guyana', 'GY', '592'],
  ['Guyana Prancis', 'French Guiana', 'GF', '594'],
  ['Haiti', 'Haiti', 'HT', '509'],
  ['Honduras', 'Honduras', 'HN', '504'],
  ['Hong Kong', 'Hong Kong', 'HK', '852'],
  ['Hungaria', 'Hungary', 'HU', '36'],
  ['India', 'India', 'IN', '91'],
  ['Indonesia', 'Indonesia', 'ID', '62'],
  ['Irak', 'Iraq', 'IQ', '964'],
  ['Iran', 'Iran', 'IR', '98'],
  ['Irlandia', 'Ireland', 'IE', '353'],
  ['Islandia', 'Iceland', 'IS', '354'],
  ['Israel', 'Israel', 'IL', '972'],
  ['Italia', 'Italy', 'IT', '39'],
  ['Jamaika', 'Jamaica', 'JM', '1876'],
  ['Jepang', 'Japan', 'JP', '81'],
  ['Jerman', 'Germany', 'DE', '49'],
  ['Jersey', 'Jersey', 'JE', '44'],
  ['Kaledonia Baru', 'New Caledonia', 'NC', '687'],
  ['Kamboja', 'Cambodia', 'KH', '855'],
  ['Kamerun', 'Cameroon', 'CM', '237'],
  ['Kanada', 'Canada', 'CA', '1'],
  ['Kazakhstan', 'Kazakhstan', 'KZ', '7'],
  ['Kenya', 'Kenya', 'KE', '254'],
  ['Kepulauan Åland', 'Aland Islands', 'AX', '358'],
  ['Kepulauan Cayman', 'Cayman Islands', 'KY', '1345'],
  ['Kepulauan Cocos', 'Cocos (Keeling) Islands', 'CC', '61'],
  ['Kepulauan Cook', 'Cook Islands', 'CK', '682'],
  ['Kepulauan Falkland', 'Falkland Islands', 'FK', '500'],
  ['Kepulauan Faroe', 'Faroe Islands', 'FO', '298'],
  ['Kepulauan Marshall', 'Marshall Islands', 'MH', '692'],
  ['Kepulauan Solomon', 'Solomon Islands', 'SB', '677'],
  ['Kepulauan Turks dan Caicos', 'Turks and Caicos Islands', 'TC', '1649'],
  ['Kepulauan Virgin Amerika Serikat', 'Virgin Islands, U.S.', 'VI', '1340'],
  ['Kepulauan Virgin Britania', 'Virgin Islands, British', 'VG', '1284'],
  ['Kirgizstan', 'Kyrgyzstan', 'KG', '996'],
  ['Kiribati', 'Kiribati', 'KI', '686'],
  ['Kolombia', 'Colombia', 'CO', '57'],
  ['Komoro', 'Comoros', 'KM', '269'],
  ['Kongo', 'Congo', 'CG', '242'],
  ['Korea Selatan', 'South Korea', 'KR', '82'],
  ['Korea Utara', 'North Korea', 'KP', '850'],
  ['Kosovo', 'Kosovo', 'XK', '383'],
  ['Kosta Rika', 'Costa Rica', 'CR', '506'],
  ['Kroasia', 'Croatia', 'HR', '385'],
  ['Kuba', 'Cuba', 'CU', '53'],
  ['Kuwait', 'Kuwait', 'KW', '965'],
  ['Laos', 'Laos', 'LA', '856'],
  ['Latvia', 'Latvia', 'LV', '371'],
  ['Lebanon', 'Lebanon', 'LB', '961'],
  ['Lesotho', 'Lesotho', 'LS', '266'],
  ['Liberia', 'Liberia', 'LR', '231'],
  ['Libya', 'Libya', 'LY', '218'],
  ['Liechtenstein', 'Liechtenstein', 'LI', '423'],
  ['Lituania', 'Lithuania', 'LT', '370'],
  ['Luksemburg', 'Luxembourg', 'LU', '352'],
  ['Madagaskar', 'Madagascar', 'MG', '261'],
  ['Makau', 'Macao', 'MO', '853'],
  ['Makedonia Utara', 'North Macedonia', 'MK', '389'],
  ['Malawi', 'Malawi', 'MW', '265'],
  ['Malaysia', 'Malaysia', 'MY', '60'],
  ['Maladewa', 'Maldives', 'MV', '960'],
  ['Mali', 'Mali', 'ML', '223'],
  ['Malta', 'Malta', 'MT', '356'],
  ['Maroko', 'Morocco', 'MA', '212'],
  ['Martinique', 'Martinique', 'MQ', '596'],
  ['Mauritania', 'Mauritania', 'MR', '222'],
  ['Mauritius', 'Mauritius', 'MU', '230'],
  ['Mayotte', 'Mayotte', 'YT', '262'],
  ['Meksiko', 'Mexico', 'MX', '52'],
  ['Mesir', 'Egypt', 'EG', '20'],
  ['Mikronesia', 'Micronesia', 'FM', '691'],
  ['Moldova', 'Moldova', 'MD', '373'],
  ['Monako', 'Monaco', 'MC', '377'],
  ['Mongolia', 'Mongolia', 'MN', '976'],
  ['Montenegro', 'Montenegro', 'ME', '382'],
  ['Montserrat', 'Montserrat', 'MS', '1664'],
  ['Mozambik', 'Mozambique', 'MZ', '258'],
  ['Myanmar', 'Myanmar', 'MM', '95'],
  ['Namibia', 'Namibia', 'NA', '264'],
  ['Nauru', 'Nauru', 'NR', '674'],
  ['Nepal', 'Nepal', 'NP', '977'],
  ['Nikaragua', 'Nicaragua', 'NI', '505'],
  ['Niger', 'Niger', 'NE', '227'],
  ['Nigeria', 'Nigeria', 'NG', '234'],
  ['Niue', 'Niue', 'NU', '683'],
  ['Norwegia', 'Norway', 'NO', '47'],
  ['Oman', 'Oman', 'OM', '968'],
  ['Pakistan', 'Pakistan', 'PK', '92'],
  ['Palau', 'Palau', 'PW', '680'],
  ['Palestina', 'Palestine', 'PS', '970'],
  ['Panama', 'Panama', 'PA', '507'],
  ['Pantai Gading', "Cote d'Ivoire", 'CI', '225'],
  ['Papua Nugini', 'Papua New Guinea', 'PG', '675'],
  ['Paraguay', 'Paraguay', 'PY', '595'],
  ['Peru', 'Peru', 'PE', '51'],
  ['Polandia', 'Poland', 'PL', '48'],
  ['Polinesia Prancis', 'French Polynesia', 'PF', '689'],
  ['Portugal', 'Portugal', 'PT', '351'],
  ['Prancis', 'France', 'FR', '33'],
  ['Puerto Riko', 'Puerto Rico', 'PR', '1787'],
  ['Pulau Bouvet', 'Bouvet Island', 'BV', '47'],
  ['Pulau Man', 'Isle of Man', 'IM', '44'],
  ['Pulau Natal', 'Christmas Island', 'CX', '61'],
  ['Pulau Norfolk', 'Norfolk Island', 'NF', '672'],
  ['Pulau Pitcairn', 'Pitcairn', 'PN', '64'],
  ['Qatar', 'Qatar', 'QA', '974'],
  ['Republik Afrika Tengah', 'Central African Republic', 'CF', '236'],
  ['Republik Demokratik Kongo', 'Congo, Democratic Republic', 'CD', '243'],
  ['Republik Dominika', 'Dominican Republic', 'DO', '1809'],
  ['Réunion', 'Reunion', 'RE', '262'],
  ['Rumania', 'Romania', 'RO', '40'],
  ['Rusia', 'Russia', 'RU', '7'],
  ['Rwanda', 'Rwanda', 'RW', '250'],
  ['Saint-Barthélemy', 'Saint Barthelemy', 'BL', '590'],
  ['Saint Helena', 'Saint Helena', 'SH', '290'],
  ['Saint Kitts dan Nevis', 'Saint Kitts and Nevis', 'KN', '1869'],
  ['Saint Lucia', 'Saint Lucia', 'LC', '1758'],
  ['Saint Martin', 'Saint Martin', 'MF', '590'],
  ['Saint Pierre dan Miquelon', 'Saint Pierre and Miquelon', 'PM', '508'],
  ['Saint Vincent dan Grenadines', 'Saint Vincent and the Grenadines', 'VC', '1784'],
  ['Samoa', 'Samoa', 'WS', '685'],
  ['Samoa Amerika', 'American Samoa', 'AS', '1684'],
  ['San Marino', 'San Marino', 'SM', '378'],
  ['Sao Tome dan Principe', 'Sao Tome and Principe', 'ST', '239'],
  ['Selandia Baru', 'New Zealand', 'NZ', '64'],
  ['Senegal', 'Senegal', 'SN', '221'],
  ['Serbia', 'Serbia', 'RS', '381'],
  ['Seychelles', 'Seychelles', 'SC', '248'],
  ['Sierra Leone', 'Sierra Leone', 'SL', '232'],
  ['Singapura', 'Singapore', 'SG', '65'],
  ['Sint Maarten', 'Sint Maarten', 'SX', '1721'],
  ['Siprus', 'Cyprus', 'CY', '357'],
  ['Slovakia', 'Slovakia', 'SK', '421'],
  ['Slovenia', 'Slovenia', 'SI', '386'],
  ['Somalia', 'Somalia', 'SO', '252'],
  ['Spanyol', 'Spain', 'ES', '34'],
  ['Sri Lanka', 'Sri Lanka', 'LK', '94'],
  ['Sudan', 'Sudan', 'SD', '249'],
  ['Sudan Selatan', 'South Sudan', 'SS', '211'],
  ['Suriah', 'Syria', 'SY', '963'],
  ['Suriname', 'Suriname', 'SR', '597'],
  ['Svalbard dan Jan Mayen', 'Svalbard and Jan Mayen', 'SJ', '47'],
  ['Swedia', 'Sweden', 'SE', '46'],
  ['Swiss', 'Switzerland', 'CH', '41'],
  ['Taiwan', 'Taiwan', 'TW', '886'],
  ['Tajikistan', 'Tajikistan', 'TJ', '992'],
  ['Tanjung Verde', 'Cape Verde', 'CV', '238'],
  ['Tanzania', 'Tanzania', 'TZ', '255'],
  ['Thailand', 'Thailand', 'TH', '66'],
  ['Timor Leste', 'Timor-Leste', 'TL', '670'],
  ['Togo', 'Togo', 'TG', '228'],
  ['Tokelau', 'Tokelau', 'TK', '690'],
  ['Tonga', 'Tonga', 'TO', '676'],
  ['Trinidad dan Tobago', 'Trinidad and Tobago', 'TT', '1868'],
  ['Tunisia', 'Tunisia', 'TN', '216'],
  ['Turki', 'Turkiye (Turkey)', 'TR', '90'],
  ['Turkmenistan', 'Turkmenistan', 'TM', '993'],
  ['Tuvalu', 'Tuvalu', 'TV', '688'],
  ['Uganda', 'Uganda', 'UG', '256'],
  ['Ukraina', 'Ukraine', 'UA', '380'],
  ['Uni Emirat Arab', 'United Arab Emirates', 'AE', '971'],
  ['Uruguay', 'Uruguay', 'UY', '598'],
  ['Uzbekistan', 'Uzbekistan', 'UZ', '998'],
  ['Vanuatu', 'Vanuatu', 'VU', '678'],
  ['Vatikan', 'Vatican City', 'VA', '379'],
  ['Venezuela', 'Venezuela', 'VE', '58'],
  ['Vietnam', 'Vietnam', 'VN', '84'],
  ['Wallis dan Futuna', 'Wallis and Futuna', 'WF', '681'],
  ['Wilayah Samudra Hindia Britania', 'British Indian Ocean Territory', 'IO', '246'],
  ['Yaman', 'Yemen', 'YE', '967'],
  ['Yordania', 'Jordan', 'JO', '962'],
  ['Yunani', 'Greece', 'GR', '30'],
  ['Zambia', 'Zambia', 'ZM', '260'],
  ['Zimbabwe', 'Zimbabwe', 'ZW', '263'],
];

// Cari negara berdasarkan nama (Indonesia/Inggris), kode ISO, atau kode telepon.
export function cariNegara(q) {
  const s = String(q == null ? '' : q).trim().toLowerCase();
  if (!s) return NEGARA.slice();
  return NEGARA.filter(([id, en, iso, dial]) =>
    id.toLowerCase().includes(s) || en.toLowerCase().includes(s) ||
    iso.toLowerCase() === s || dial === s.replace(/^\+/, ''));
}

// Bentuk nomor internasional dari kode negara + nomor lokal.
// Nol di depan nomor lokal dibuang (aturan umum penomoran internasional).
export function formatInternasional(dial, nomor) {
  const digit = String(nomor == null ? '' : nomor).replace(/\D/g, '').replace(/^0+/, '');
  if (!digit) return null;
  return '+' + String(dial).replace(/^\+/, '') + digit;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Cari negaranya, lalu ketuk untuk memakai kodenya. Untuk menelepon ke luar negeri, ketik tanda + lalu kode negara lalu nomornya tanpa angka 0 di depan.</p>'));

  const cariI = T.input('text', 'cth: Jepang, Japan, JP, atau 81', '');
  const daftarBox = T.el('<div></div>');
  const negaraSel = T.select(NEGARA.map(([id, , iso, dial]) => [dial + '|' + id, id + ' (+' + dial + ')']), '62|Indonesia');
  const nomorI = T.input('text', 'cth: 08123456789', '08123456789');
  nomorI.inputMode = 'tel';
  const box = T.out();
  let terpilih = ['Indonesia', 'Indonesia', 'ID', '62'];

  function gambarDaftar(hasil) {
    if (hasil.length === 0) {
      daftarBox.innerHTML = '<p class="hint">Tidak ada negara yang cocok. Coba kata kunci lain, atau tulis kode ISO-nya (mis. JP).</p>';
      return;
    }
    const baris = hasil.slice(0, 200).map(([id, en, iso, dial]) =>
      '<tr data-dial="' + dial + '" data-nama="' + T.esc(id) + '" style="cursor:pointer"><td style="padding:6px 8px">' + T.esc(id) + ' <span class="hint">(' + T.esc(en) + ')</span></td><td style="padding:6px 8px">' + iso + '</td><td style="text-align:right;padding:6px 8px"><b>+' + dial + '</b></td></tr>').join('');
    daftarBox.innerHTML = '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Negara</th><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">ISO</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Kode</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      (hasil.length > 200 ? '<p class="hint">Menampilkan 200 dari ' + hasil.length + ' hasil. Persempit pencarianmu.</p>' : '<p class="hint">' + hasil.length + ' negara dari ' + NEGARA.length + ' entri.</p>');
    daftarBox.querySelectorAll('tr[data-dial]').forEach((tr) => {
      tr.addEventListener('click', () => {
        const dial = tr.getAttribute('data-dial');
        const nama = tr.getAttribute('data-nama');
        const entri = NEGARA.find((n) => n[3] === dial && n[0] === nama);
        if (!entri) return;
        terpilih = entri;
        negaraSel.value = dial + '|' + nama;
        T.show(box, '<p class="big">+' + dial + ' (' + T.esc(nama) + ')</p><p>Kode telepon ' + T.esc(nama) + ' adalah +' + dial + '. Isi nomor lokal di bawah untuk membentuk nomor internasionalnya.</p>');
        box.appendChild(T.copyBtn(() => '+' + dial, 'Salin kode +' + dial));
      });
    });
  }

  cariI.addEventListener('input', () => gambarDaftar(cariNegara(cariI.value)));
  gambarDaftar(NEGARA);

  function bentuk() {
    const [dial] = negaraSel.value.split('|');
    const hasil = formatInternasional(dial, nomorI.value);
    if (!hasil) { T.toast('Isi nomor lokalnya dulu'); return; }
    const nama = NEGARA.find((n) => n[3] === dial);
    T.show(box, '<p class="big">' + T.esc(hasil) + '</p><p>Nomor internasional untuk ' + (nama ? T.esc(nama[0]) : 'negara itu') + '. Angka 0 di depan nomor lokal sudah dibuang.</p>');
    box.appendChild(T.copyBtn(() => hasil, 'Salin nomor'));
  }

  root.append(
    T.field('Cari negara', cariI),
    daftarBox,
    T.el('<h3 style="margin:18px 0 10px;font-size:15px">Bentuk nomor internasional</h3>'),
    T.field('Negara tujuan', negaraSel),
    T.field('Nomor lokal', nomorI, 'Tulis seperti biasa, dengan atau tanpa 0 di depan.'),
    T.btn('Bentuk nomor', bentuk, true),
    box,
  );
}
