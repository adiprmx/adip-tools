import { h as T, esc } from '../../core.js';

// Konversi HbA1c ke perkiraan gula darah rata-rata (eAG) dan sebaliknya,
// rumus studi ADAG (Nathan dkk., Diabetes Care 2008):
// eAG (mg/dL) = 28,7 x HbA1c(%) - 46,7.
// mmol/L = mg/dL dibagi 18.
// Kategori HbA1c (American Diabetes Association): normal di bawah 5,7%,
// pradiabetes 5,7 - 6,4%, diabetes 6,5% ke atas.
function eagDariA1c(a1c) { return 28.7 * a1c - 46.7; }
function a1cDariEag(eag) { return (eag + 46.7) / 28.7; }

function kategori(a1c) {
  if (a1c < 5.7) return ['Normal', 'ok'];
  if (a1c < 6.5) return ['Pradiabetes', 'warn'];
  return ['Diabetes', 'err'];
}

export const meta = {"id": "kalkulator-hba1c-ke-gula-darah-rata-rata-eag", "name": "Kalkulator HbA1c ke Gula Darah Rata-rata (eAG)", "cat": "kesehatan", "icon": "💧", "desc": "Ubah angka HbA1c dari hasil lab jadi perkiraan gula darah rata-rata, atau sebaliknya.", "keywords": "hba1c,eag,gula darah,diabetes,rata-rata,adag,a1c", "since": "6.17.0"};
export function render(root) {
  const arah = T.select([
    ['a1c-ke-eag', 'HbA1c (%) jadi gula darah rata-rata'],
    ['eag-ke-a1c', 'Gula darah rata-rata (mg/dL) jadi HbA1c'],
  ], 'a1c-ke-eag');
  const nilai = T.input('number', 'Angka HbA1c (%)', '7,0');
  const box = T.out();

  const aturLabel = () => {
    nilai.placeholder = arah.value === 'a1c-ke-eag' ? 'Angka HbA1c (%)' : 'Gula darah rata-rata (mg/dL)';
  };
  arah.addEventListener('change', aturLabel);

  const hitung = () => {
    const v = T.num(nilai.value);
    let a1c, eag;
    if (arah.value === 'a1c-ke-eag') {
      if (!(v >= 3 && v <= 20)) {
        T.show(box, '<span class="err">Isi HbA1c antara 3 sampai 20%.</span>');
        return;
      }
      a1c = v; eag = eagDariA1c(v);
    } else {
      if (!(v >= 40 && v <= 600)) {
        T.show(box, '<span class="err">Isi gula darah rata-rata antara 40 sampai 600 mg/dL.</span>');
        return;
      }
      eag = v; a1c = a1cDariEag(v);
    }
    const k = kategori(a1c);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan gula darah rata-rata (eAG)</div>' +
      '<div class="big">' + eag.toFixed(0) + ' mg/dL</div>' +
      '<div class="dim">= ' + (eag / 18).toFixed(1) + ' mmol/L</div>' +
      '<div class="' + k[1] + '" style="margin-top:6px"><b>HbA1c ' + a1c.toFixed(1) + '%: ' + esc(k[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">HbA1c</span><span class="v">' + a1c.toFixed(1) + '%</span></div>' +
      '<div class="kv"><span class="k">Gula darah rata-rata</span><span class="v">' + eag.toFixed(0) + ' mg/dL (' + (eag / 18).toFixed(1) + ' mmol/L)</span></div>' +
      '<div class="dim" style="margin-top:12px">Kategori HbA1c</div>' +
      '<div class="kv"><span class="k">Normal</span><span class="v">di bawah 5,7%' + (a1c < 5.7 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Pradiabetes</span><span class="v">5,7 - 6,4%' + (a1c >= 5.7 && a1c < 6.5 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Diabetes</span><span class="v">6,5% ke atas' + (a1c >= 6.5 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Rumus eAG dari studi ADAG (2008): gula darah rata-rata = 28,7 x HbA1c - 46,7. HbA1c menggambarkan rata-rata gula darah sekitar 2-3 bulan terakhir. ' +
      'Angka ini perkiraan, bukan diagnosis. Anemia, penyakit ginjal, atau transfusi darah bisa membuat HbA1c tidak akurat. Buat keputusan soal diabetes, tanya dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.field('Arah konversi', arah));
  root.appendChild(T.field('Angka dari hasil lab', nilai));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
