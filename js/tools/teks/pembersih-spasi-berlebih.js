import { h as T, kv, errBox } from '../../core.js';

export const meta = {"id": "pembersih-spasi-berlebih", "name": "Pembersih Spasi Berlebih", "cat": "teks", "icon": "🧹", "desc": "Rapikan teks: spasi ganda jadi satu, baris kosong berlebih dipangkas.", "keywords": "spasi,bersihkan,rapikan,teks,baris kosong,spasi ganda", "since": "6.19.0"};

// Rapikan spasi: spasi/tab beruntun di dalam baris jadi satu spasi, spasi di
// ujung baris dibuang, baris kosong beruntun dipangkas sampai maksBarisKosong
// (0 berarti semua baris kosong dibuang). Fungsi murni, diuji di Node.
export function bersihkanSpasi(teks, opts) {
  const o = opts || {};
  const maksKosong = (o.maksBarisKosong == null) ? 1 : Math.max(0, Math.floor(o.maksBarisKosong));
  const sebelum = String(teks == null ? '' : teks);
  const spasiAwal = (sebelum.match(/[ \t]/g) || []).length;
  const barisAwal = sebelum ? sebelum.split('\n').length : 0;
  const lines = sebelum.split('\n').map((b) => b.replace(/[ \t]+/g, ' ').replace(/^ | $/g, ''));
  const out = [];
  let kosongBeruntun = 0;
  for (const b of lines) {
    if (b === '') {
      kosongBeruntun += 1;
      if (kosongBeruntun <= maksKosong) out.push(b);
    } else {
      kosongBeruntun = 0;
      out.push(b);
    }
  }
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  const teksBersih = out.join('\n');
  const spasiAkhir = (teksBersih.match(/ /g) || []).length;
  return {
    text: teksBersih,
    karakterAwal: sebelum.length,
    karakterAkhir: teksBersih.length,
    spasiDibuang: Math.max(0, spasiAwal - spasiAkhir),
    barisAwal,
    barisAkhir: teksBersih ? teksBersih.split('\n').length : 0,
  };
}

export function render(root) {
  const taIn = T.ta(8, 'Tempel teks yang spasinya berantakan di sini…');
  const kosongSel = T.select([
    ['1', 'Sisakan 1 baris kosong'],
    ['0', 'Buang semua baris kosong'],
    ['2', 'Sisakan sampai 2 baris kosong'],
  ], '1');
  const statBox = T.out();
  const outBox = T.out();
  let hasil = '';

  const proses = () => {
    const src = taIn.value;
    if (!src.trim()) {
      hasil = '';
      T.hide(statBox);
      T.show(outBox, errBox('Tempel dulu teksnya.'));
      return;
    }
    const r = bersihkanSpasi(src, { maksBarisKosong: Number(kosongSel.value) });
    hasil = r.text;
    T.show(statBox,
      kv('Karakter', r.karakterAwal + ' jadi ' + r.karakterAkhir) +
      kv('Spasi dibuang', r.spasiDibuang + ' spasi') +
      kv('Baris', r.barisAwal + ' jadi ' + r.barisAkhir));
    T.show(outBox, '<pre class="pre" style="white-space:pre-wrap;word-break:break-word"></pre>');
    outBox.querySelector('pre').textContent = hasil;
    outBox.appendChild(T.row(
      T.copyBtn(() => hasil, 'Salin hasil'),
      T.dlBtn('teks-bersih.txt', () => hasil, 'text/plain;charset=utf-8', 'Unduh .txt'),
    ));
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Spasi ganda di tengah kalimat jadi satu, spasi di ujung baris hilang, dan baris kosong yang menumpuk dipangkas. Isi teksnya tetap sama, cuma lebih rapi.</p>'));
  root.appendChild(T.field('Teks yang mau dirapikan', taIn));
  root.appendChild(T.field('Baris kosong beruntun', kosongSel));
  root.appendChild(T.row(T.btn('Rapikan teks', proses, true)));
  root.appendChild(statBox);
  root.appendChild(outBox);
}
