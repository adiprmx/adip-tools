import { h as T, utils, beep, actx, onLeave, kvRows } from '../../core.js?v=6.8.0';

export const meta = {"id": "tabel-perkalian", "name": "Tabel Perkalian", "cat": "pelajar", "icon": "✖️", "desc": "Tabel perkalian 1–20 plus mode kuis 10 soal.", "keywords": "perkalian,tabel,matematika,kuis,latihan"};

/** Kembalikan array [i, n*i] untuk i=1..10. */
export function barisTabel(n) {
  const rows = [];
  for (let i = 1; i <= 10; i++) rows.push([i, n * i]);
  return rows;
}

/** Satu soal kuis acak: a,b dalam 1..10. */
export function soalAcak() {
  const a = 1 + Math.floor(Math.random() * 10);
  const b = 1 + Math.floor(Math.random() * 10);
  return { a, b, jawab: a * b };
}

/** Cek jawaban: benar/salah. */
export function cekJawaban(a, b, tebakan) {
  return T.num(tebakan) === a * b;
}

export function render(root) {
  const mode = T.select([['tabel', '📋 Tabel Perkalian'], ['kuis', '🎯 Mode Kuis']], 'tabel');
  const pilihAngka = T.select(Array.from({ length: 20 }, (_, i) => [String(i + 1), 'Perkalian ' + (i + 1)]), '5');
  const box = T.out();

  const tampilTabel = () => {
    const n = T.num(pilihAngka.value);
    const rows = barisTabel(n).map(([i, hasil]) => [n + ' × ' + i, String(hasil)]);
    T.show(box, '<h3 style="margin:6px 0 10px;font-size:15px">✖️ Tabel Perkalian ' + T.esc(String(n)) + '</h3>' + kvRows(rows));
  };

  // ---- Mode kuis ----
  let soal = null, nomor = 0, skor = 0, jalan = false;
  const inJawab = T.input('number', 'Jawaban kamu', '');
  const paintSoal = () => {
    T.show(box,
      '<div class="center"><div class="dim">Soal ' + nomor + ' dari 10 &nbsp;•&nbsp; Skor: ' + skor + '</div>' +
      '<div style="font-size:34px;font-weight:700;margin:14px 0">' + soal.a + ' × ' + soal.b + ' = ?</div>' +
      '<div id="kuis-feedback" class="dim" style="min-height:22px"></div></div>');
    inJawab.value = '';
    const wrap = T.el('<div style="max-width:220px;margin:0 auto"></div>');
    wrap.appendChild(inJawab);
    box.appendChild(wrap);
    const t = T.el('<div class="center" style="margin-top:10px"></div>');
    t.appendChild(T.btn('Jawab ✔', jawabSoal, true));
    box.appendChild(t);
    inJawab.focus();
    inJawab.onkeydown = (e) => { if (e.key === 'Enter') jawabSoal(); };
  };

  const jawabSoal = () => {
    if (!jalan || !soal) return;
    if (inJawab.value.trim() === '' || isNaN(T.num(inJawab.value))) {
      const f = box.querySelector('#kuis-feedback');
      if (f) f.textContent = 'Isi dulu jawabannya.';
      return;
    }
    const benar = cekJawaban(soal.a, soal.b, inJawab.value);
    if (benar) { skor++; beep(880, 0.15, 'sine'); } else { beep(220, 0.25, 'sawtooth'); }
    const f = box.querySelector('#kuis-feedback');
    if (f) f.innerHTML = benar ? '✅ <b>Benar!</b>' : '❌ Kurang tepat. ' + soal.a + ' × ' + soal.b + ' = <b>' + soal.jawab + '</b>';
    jalan = false;
    setTimeout(() => { if (nomor >= 10) selesaiKuis(); else { soal = soalAcak(); jalan = true; paintSoal(); } }, 900);
  };
  onLeave(() => { jalan = false; });

  const selesaiKuis = () => {
    const pesan = skor === 10 ? '🏆 Sempurna! Kamu master perkalian!' : skor >= 7 ? '🎉 Bagus! Sedikit lagi sempurna.' : skor >= 4 ? '💪 Lumayan, terus latihan ya.' : '📚 Yuk latihan lagi biar makin hafal.';
    T.show(box,
      '<div class="center"><div class="dim">Kuis selesai!</div>' +
      '<div class="big">' + skor + ' / 10</div>' +
      '<div style="margin:10px 0">' + pesan + '</div></div>');
    const t = T.el('<div class="center"></div>');
    t.appendChild(T.btn('🔄 Ulangi Kuis', mulaiKuis, true));
    box.appendChild(t);
    beep(660, 0.2, 'sine'); beep(880, 0.3, 'sine', 0.2);
  };

  const mulaiKuis = () => {
    nomor = 1; skor = 0; soal = soalAcak(); jalan = true; paintSoal();
  };

  const paintMode = () => {
    jalan = false;
    if (mode.value === 'tabel') {
      const wrap = T.el('<div></div>');
      wrap.appendChild(T.field('Pilih angka', pilihAngka));
      root.querySelector('#tp-extra').innerHTML = '';
      root.querySelector('#tp-extra').appendChild(wrap);
      pilihAngka.onchange = tampilTabel;
      tampilTabel();
    } else {
      root.querySelector('#tp-extra').innerHTML = '';
      T.show(box, '<div class="center"><div class="dim">10 soal acak perkalian 1–10.<br>Jawab secepat dan setepat mungkin!</div></div>');
      const t = T.el('<div class="center" style="margin-top:12px"></div>');
      t.appendChild(T.btn('▶ Mulai Kuis', mulaiKuis, true));
      box.appendChild(t);
    }
  };

  mode.addEventListener('change', paintMode);
  root.appendChild(T.field('Mode', mode));
  root.appendChild(T.el('<div id="tp-extra"></div>'));
  root.appendChild(box);
  paintMode();
}
