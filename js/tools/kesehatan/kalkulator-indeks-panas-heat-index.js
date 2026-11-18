import { h as T, esc } from '../../core.js';

// Indeks panas ("terasa seperti") dari suhu dan kelembapan, rumus
// Rothfusz yang dipakai NOAA / National Weather Service (AS).
// Rumus memakai Fahrenheit; penyesuaian untuk kelembapan rendah
// (<13%) dan tinggi (>85%) ikut dipakai. Bila hasilnya di bawah 80 F,
// dipakai rumus sederhana Steadman. Level bahaya mengikuti NWS.
function heatIndexF(tF, rh) {
  let hi = -42.379 + 2.04901523 * tF + 10.14333127 * rh
    - 0.22475541 * tF * rh - 0.00683783 * tF * tF - 0.05481717 * rh * rh
    + 0.00122874 * tF * tF * rh + 0.00085282 * tF * rh * rh
    - 0.00000199 * tF * tF * rh * rh;
  if (rh < 13 && tF >= 80 && tF <= 112) {
    hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tF - 95)) / 17);
  } else if (rh > 85 && tF >= 80 && tF <= 87) {
    hi += ((rh - 85) / 10) * ((87 - tF) / 5);
  }
  if (hi < 80) {
    hi = 0.5 * (tF + 61.0 + ((tF - 68.0) * 1.2) + (rh * 0.094));
  }
  return hi;
}

function level(hiF) {
  if (hiF < 80) return ['Aman', 'Suhu terasa masih wajar.', 'ok'];
  if (hiF < 91) return ['Hati-hati', 'Lelah karena panas mungkin terjadi bila lama beraktivitas di luar.', 'warn'];
  if (hiF < 104) return ['Sangat hati-hati', 'Kram dan kelelahan karena panas mungkin terjadi. Banyak minum dan cari tempat teduh.', 'warn'];
  if (hiF < 126) return ['Bahaya', 'Kram dan kelelahan karena panas besar kemungkinan terjadi. Heatstroke mungkin terjadi.', 'err'];
  return ['Bahaya ekstrem', 'Heatstroke sangat mungkin terjadi. Hindari aktivitas di luar.', 'err'];
}

export const meta = {"id": "kalkulator-indeks-panas-heat-index", "name": "Kalkulator Indeks Panas (Heat Index)", "cat": "kesehatan", "icon": "🌡️", "desc": "Seberapa panas suhu yang kamu rasakan, dari suhu udara dan kelembapan, lengkap dengan level bahayanya.", "keywords": "heat index,indeks panas,terasa seperti,suhu,kelembapan,cuaca panas,noaa", "since": "6.17.0"};
export function render(root) {
  const suhu = T.input('number', 'Suhu udara (°C)', '32');
  const lembap = T.input('number', 'Kelembapan udara (%)', '70');
  const box = T.out();

  const hitung = () => {
    const c = T.num(suhu.value);
    const rh = T.num(lembap.value);
    if (!(c >= -10 && c <= 55)) {
      T.show(box, '<span class="err">Isi suhu antara -10 sampai 55 °C.</span>');
      return;
    }
    if (!(rh >= 0 && rh <= 100)) {
      T.show(box, '<span class="err">Isi kelembapan antara 0 sampai 100%.</span>');
      return;
    }
    const tF = c * 9 / 5 + 32;
    const hiF = heatIndexF(tF, rh);
    const hiC = (hiF - 32) * 5 / 9;
    const lv = level(hiF);
    const selisih = hiC - c;
    T.show(box,
      '<div class="center"><div class="dim">Terasa seperti</div>' +
      '<div class="big">' + hiC.toFixed(1) + ' °C</div>' +
      '<div class="dim">Suhu asli ' + c.toFixed(1) + ' °C' + (selisih >= 0.5 ? ', terasa ' + selisih.toFixed(1) + ' °C lebih panas' : '') + '</div>' +
      '<div class="' + lv[2] + '" style="margin-top:6px"><b>' + esc(lv[0]) + '</b><br>' + esc(lv[1]) + '</div></div>' +
      '<div class="dim" style="margin-top:12px">Level bahaya (National Weather Service)</div>' +
      '<div class="kv"><span class="k">Di bawah 27 °C</span><span class="v">Aman' + (hiF < 80 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">27 - 32 °C</span><span class="v">Hati-hati' + (hiF >= 80 && hiF < 91 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">32 - 41 °C</span><span class="v">Sangat hati-hati' + (hiF >= 91 && hiF < 104 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">41 - 54 °C</span><span class="v">Bahaya' + (hiF >= 104 && hiF < 126 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">54 °C ke atas</span><span class="v">Bahaya ekstrem' + (hiF >= 126 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Dihitung dengan rumus Rothfusz yang dipakai NOAA (AS). Rumus ini paling akurat untuk cuaca panas (suhu 27 °C ke atas, kelembapan 40% ke atas) dan menganggap kamu berada di tempat teduh dengan angin sepoi. ' +
      'Di bawah sinar matahari langsung, rasanya bisa 6-8 °C lebih panas lagi. Ini perkiraan buat jaga-jaga, bukan diagnosis. Buat keputusan medis, konsultasikan ke tenaga kesehatan. ' +
      'Bila pusing, mual, atau kulit memerah setelah kepanasan, segera cari pertolongan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Suhu udara (°C)', suhu),
    T.field('Kelembapan udara (%)', lembap, 'Cek di aplikasi cuaca di HP-mu.'),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
