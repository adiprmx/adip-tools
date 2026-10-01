import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"nama-panggung","name":"Nama Panggung","cat":"fun","icon":"🌟","desc":"Generator nama panggung dari namamu.","keywords":"nama,panggung,artis,musisi,brand"};

const SIFAT = [
  'Senja', 'Langit', 'Samudra', 'Angkasa', 'Mahardika', 'Bagaskara',
  'Cakra', 'Pradipta', 'Nararya', 'Wisanggeni', 'Wira', 'Aditya',
  'Surya', 'Bayu', 'Kirana', 'Bara', 'Guntur', 'Arjuna',
  'Bima', 'Raka', 'Petir', 'Cahaya', 'Jingga', 'Badai',
];

const AKHIRAN = [
  'RV', 'Official', 'ID', 'Music', 'Jr.', 'X',
  'Project', 'Records', '777', '99', 'Boys', 'Squad',
  'Star', 'Live',
];

const acak = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i]] = [x[j]], [x[j]] = [x[i]];
  }
  return x;
};

const rapi = (t) => t.split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');

const buatOpsi = (namaAsli) => {
  const kata = namaAsli.trim().split(/\s+/).filter(Boolean).map(rapi);
  if (!kata.length) return [];
  const depan = kata[0];
  const tengah = kata.length > 1 ? kata[1] : '';
  const pola = [
    () => acak(SIFAT) + ' ' + depan + ' ' + acak(AKHIRAN),
    () => acak(SIFAT) + ' ' + depan,
    () => depan + ' ' + acak(AKHIRAN),
    () => tengah ? acak(SIFAT) + ' ' + tengah + ' ' + acak(AKHIRAN) : acak(SIFAT) + ' ' + depan + ' ' + acak(AKHIRAN),
    () => tengah ? depan + ' ' + tengah + ' ' + acak(AKHIRAN) : depan + ' ' + acak(AKHIRAN),
    () => acak(SIFAT) + ' ' + depan + ' ' + acak(SIFAT),
  ];
  const hasil = [];
  shuffle(pola).forEach((p) => {
    const s = p();
    if (hasil.indexOf(s) === -1) hasil.push(s);
  });
  let guard = 0;
  while (hasil.length < 6 && guard++ < 80) {
    const s = acak(SIFAT) + ' ' + depan + (Math.random() < 0.7 ? ' ' + acak(AKHIRAN) : '');
    if (hasil.indexOf(s) === -1) hasil.push(s);
  }
  return hasil.slice(0, 6);
};

export function render(root) {
  const namaInp = T.input('text', 'Nama aslimu', '');
  const hasil = T.out();

  const tampilkan = () => {
    const nama = namaInp.value.trim();
    if (!nama) { T.show(hasil, '<span class="err">Isi nama aslimu dulu.</span>'); return; }
    const opsi = buatOpsi(nama);
    T.show(hasil,
      '<div class="dim" style="margin-bottom:8px">6 opsi nama panggung buat <b>' + T.esc(rapi(nama)) + '</b> — pilih yang paling kamu banget: 🌟</div>' +
      opsi.map((o, i) =>
        '<div class="kv" style="align-items:center"><span class="k" style="font-size:16px;font-weight:700">' + (i + 1) + '. ' + T.esc(o) + '</span>' +
        '<span class="v"><button type="button" class="btn salin">📋</button></span></div>'
      ).join('')
    );
    const btns = hasil.querySelectorAll('.salin');
    btns.forEach((b, i) => b.addEventListener('click', () => {
      T.copy(opsi[i]);
    }));
    const wrap = T.el('<div class="row center" style="margin-top:10px"></div>');
    wrap.appendChild(T.btn('🎲 Acak lagi', tampilkan, true));
    hasil.appendChild(wrap);
  };

  root.appendChild(T.el('<p class="hint">Mau tampil beda di panggung? Tulis nama aslimu, biar kami racik jadi nama panggung yang kece. 🎤</p>'));
  root.appendChild(T.field('Nama asli', namaInp));
  root.appendChild(T.row(T.btn('✨ Buatkan nama panggung', tampilkan, true)));
  root.appendChild(hasil);
  namaInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tampilkan(); });
}
