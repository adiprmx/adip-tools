import { h as T, utils, esc } from '../../core.js?v=5.2.0';

export const meta = {"id": "baby-name", "name": "Nama Bayi", "cat": "fun", "icon": "👶", "desc": "Nama bayi Indonesia + arti.", "keywords": "bayi,nama,arti,anak"};
export function render(root) {

    const L = [
      ['Aditya', 'matahari'], ['Arjuna', 'pahlawan yang bersih hatinya'], ['Bagas', 'tegap dan kuat'],
      ['Bayu', 'angin yang memberi kehidupan'], ['Bima', 'kuat dan berani'], ['Damar', 'cahaya penerang'],
      ['Dimas', 'adik tercinta'], ['Eka', 'yang pertama dan utama'], ['Fajar', 'cahaya pagi hari'],
      ['Galang', 'menegakkan kebenaran'], ['Gilang', 'bercahaya'], ['Hadi', 'pemberi petunjuk'],
      ['Hendra', 'kuat dan perkasa'], ['Indra', 'pemimpin yang agung'], ['Jatmiko', 'terhormat dan mulia'],
      ['Langit', 'setinggi langit cita-citanya'], ['Mahesa', 'kuat bagai banteng'], ['Nara', 'pemimpin umat'],
      ['Pandu', 'bijaksana'], ['Raditya', 'matahari pagi'], ['Rangga', 'tampan bagai bunga'],
      ['Sakti', 'berkuasa dan sakti'], ['Satria', 'ksatria pemberani'], ['Surya', 'matahari'],
      ['Taufik', 'mendapat petunjuk Tuhan'],
    ];
    const P = [
      ['Anisa', 'ramah dan bersahabat'], ['Ayu', 'cantik'], ['Bunga', 'indah bagai bunga'],
      ['Cahya', 'cahaya'], ['Dewi', 'bidadari'], ['Dinda', 'adik kesayangan'],
      ['Fitri', 'suci dan bersih'], ['Intan', 'permata yang berharga'], ['Kartika', 'bintang'],
      ['Kirana', 'cahaya yang indah'], ['Laras', 'selaras dan harmonis'], ['Lestari', 'abadi'],
      ['Lintang', 'bintang di langit'], ['Maya', 'cahaya yang mempesona'], ['Melati', 'suci bagai bunga melati'],
      ['Nabila', 'mulia'], ['Nadia', 'penuh harapan'], ['Putri', 'putri raja'],
      ['Ratna', 'permata'], ['Ratri', 'malam yang tenang'], ['Sari', 'inti yang terbaik'],
      ['Sekar', 'bunga'], ['Wulan', 'bulan purnama'], ['Zahra', 'bersinar terang'],
      ['Cinta', 'penuh kasih sayang'],
    ];
    const gender = T.select([['semua', 'Semua'], ['l', 'Laki-laki'], ['p', 'Perempuan']], 'semua');
    const gabung = document.createElement('input');
    gabung.type = 'checkbox';
    const box = T.out();
    let current = '';
    const acak = () => {
      let pool = [];
      if (gender.value === 'l') pool = L;
      else if (gender.value === 'p') pool = P;
      else pool = L.concat(P);
      const pick = () => pool[Math.floor(Math.random() * pool.length)];
      let nama, arti;
      if (gabung.checked && pool.length > 1) {
        const a = pick(); let b = pick(), guard = 0;
        while (b[0] === a[0] && guard++ < 20) b = pick();
        nama = a[0] + ' ' + b[0];
        arti = a[1] + '; ' + b[1];
      } else {
        const p = pick();
        nama = p[0]; arti = p[1];
      }
      current = nama;
      T.show(box,
        '<div class="center"><div class="dim">Nama untuk si kecil</div>' +
        '<div class="big">' + esc(nama) + '</div>' +
        '<div class="info">Artinya: ' + esc(arti) + '</div></div>');
    };
    const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lbl.appendChild(gabung);
    lbl.appendChild(document.createTextNode('Gabung 2 nama (nama depan + belakang)'));
    root.appendChild(T.field('Jenis kelamin', gender));
    root.appendChild(lbl);
    root.appendChild(T.row(T.btn('👶 Acak nama', acak, true), T.copyBtn(() => current || 'Acak dulu namanya', 'Salin')));
    root.appendChild(box);
    acak();
    gender.addEventListener('change', acak);
  
}
