import { h as T, utils } from '../../core.js';

export const meta = {"id": "rms", "name": "RMS (Root Mean Square)", "cat": "pelajar", "icon": "〰️", "desc": "Hitung nilai RMS (akar rata-rata kuadrat) dari deret angka. Dipakai buat sinyal dan listrik AC.", "keywords": "rms,root mean square,akar rata-rata kuadrat,efektif,sinyal,listrik ac,statistik", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// parseDeret memakai utils.parseDeret (kanonis, G4 C1G4-R).
export const parseDeret = utils.parseDeret;

// RMS = akar dari rata-rata kuadrat. Null bila data kosong.
export function hitungRms(data) {
  if (!data.length) return null;
  const jumKuadrat = data.reduce((s, v) => s + v * v, 0);
  return { rms: n0(Math.sqrt(jumKuadrat / data.length)), jumKuadrat: n0(jumKuadrat), rataKuadrat: n0(jumKuadrat / data.length), n: data.length };
}

const fmt = (v) => (v == null ? '-' : T.fmt(n0(Number(utils.r4(v)))));

export function render(root) {
  const ta = T.ta(4, 'mis.\n3, 4\natau pisahkan dengan spasi / enter', '3 4');
  const box = T.out();

  const hitung = () => {
    const data = parseDeret(ta.value);
    if (!data.length) {
      T.show(box, '<p class="dim">Isi deret angkanya dulu. Pisahkan dengan spasi, koma, atau enter.</p>');
      return;
    }
    const r = hitungRms(data);
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    let h = '<div class="big">' + fmt(r.rms) + '</div>';
    h += '<p class="dim">Nilai RMS dari ' + r.n + ' angka.</p>';
    h += '<p style="margin-top:10px"><b>Langkah</b></p>';
    h += '<div class="kv"><span class="k">Kuadrat tiap angka</span><span class="v">' + data.map((v) => T.fmt(v) + '² = ' + fmt(v * v)).join(', ') + '</span></div>';
    h += '<div class="kv"><span class="k">Jumlah kuadrat</span><span class="v">' + fmt(r.jumKuadrat) + '</span></div>';
    h += '<div class="kv"><span class="k">Rata-rata kuadrat</span><span class="v">' + fmt(r.jumKuadrat) + ' ÷ ' + r.n + ' = ' + fmt(r.rataKuadrat) + '</span></div>';
    h += '<div class="kv"><span class="k">Akarnya (RMS)</span><span class="v">√' + fmt(r.rataKuadrat) + ' = <b>' + fmt(r.rms) + '</b></span></div>';
    h += '<div class="kv"><span class="k">Rata-rata biasa (pembanding)</span><span class="v">' + fmt(mean) + '</span></div>';
    h += '<p class="hint">RMS itu "nilai efektif"-nya: sinyal AC 220 V di rumahmu sebenarnya berosilasi sampai ±311 V, tapi RMS-nya 220 V. Setara dengan tegangan DC 220 V untuk urusan daya. Angka negatif tidak masalah, karena dikuadratkan dulu.</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Hitung', hitung, true);
  ta.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">RMS = akar dari rata-rata kuadrat. Dipakai buat mengukur besar sinyal yang naik-turun, seperti listrik AC dan suara.</p>'));
  root.appendChild(T.field('Deret angka', ta));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
