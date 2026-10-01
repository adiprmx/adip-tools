import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id": "tes-kepribadian", "name": "Tes Kepribadian Receh", "cat": "fun", "icon": "🧠", "desc": "10 pertanyaan, 4 tipe hasil yang nggak disangka-sangka.", "keywords": "tes,kepribadian,kuis,receh,lucu,fun"};
export function render(root) {

    const TIPE = {
      rebahan:    { nama: 'Tim Rebahan Garis Keras', icon: '🛋️', desc: 'Filosofi hidupmu: kenapa berdiri kalau bisa duduk, kenapa duduk kalau bisa tiduran. Kasur adalah belahan jiwa dan kata "mager" adalah mantra harian. Temanmu sudah hafal: ngajak kamu keluar itu misi mustahil level dewa.' },
      deadline:   { nama: 'Ambisius Kaum Deadline', icon: '🔥', desc: 'Tidur itu opsional, target itu wajib. Kamu tipe yang bikin to-do list… lalu bikin to-do list buat nyelesaiin to-do list. Orang lain nunggu mood, kamu nunggu jam 2 pagi karena katanya ide terbaik datang pas mepet.' },
      ekstrovert:  { nama: 'Ekstrovert Tukang Nongkrong', icon: '🎉', desc: 'Baterai sosialmu nggak pernah lowbat. Di tongkrongan kamu yang paling rame, di grup chat kamu yang paling aktif, di kondangan kamu yang joget duluan. Kaum introvert di sekitarmu cuma bisa geleng-geleng sambil senyum.' },
      introvert:   { nama: 'Introvert Anak Kamar', icon: '🚪', desc: 'Surga versimu: kamar, pintu dikunci, nggak ada yang ngetok. Nongkrong sih oke, tapi baterai sosial cuma tahan 2 jam. Kamu bukan antisosial — kamu cuma selektif, dan seleksinya ketat banget.' },
    };
    // tiap opsi memetakan ke satu tipe
    const SOAL = [
      { q: 'Hari libur paling ideal menurutmu…', a: ['Kasur + HP + cemilan. Titik.', 'rebahan'], b: ['Nongkrong sama teman sampai lupa waktu.', 'ekstrovert'] },
      { q: 'Tugas deadline besok pagi, sekarang jam 11 malam…', a: ['Gas lembur, mepet itu seni.', 'deadline'], b: ['Tidur dulu, besok pagi kebut. (Nggak jadi.)', 'rebahan'] },
      { q: 'Teman ngajak nongkrong dadakan:', a: ['Gas! Kapan lagi.', 'ekstrovert'], b: ['"Nanti gue kabarin ya…" (tidak dikabarin)', 'introvert'] },
      { q: 'Alarm pagi bunyi…', a: ['Langsung bangun, hari baru semangat baru.', 'deadline'], b: ['Snooze. Snooze. Snooze. Bangun kesiangan.', 'rebahan'] },
      { q: 'Di acara rame yang isinya orang asing:', a: ['Kenalan sana-sini, nambah teman.', 'ekstrovert'], b: ['Duduk di pojok, HP jadi tameng.', 'introvert'] },
      { q: 'Target hidup 5 tahun ke depan:', a: ['Karier melejit, usaha jalan.', 'deadline'], b: ['Hidup tenang, nggak dikejar apa-apa.', 'introvert'] },
      { q: 'Dapat uang jajan lebih bulan ini:', a: ['Ditabung / diputar buat modal.', 'deadline'], b: ['Jajan enak + top up game.', 'rebahan'] },
      { q: 'Makan sendirian di tempat rame:', a: ['Santai, ini me time.', 'introvert'], b: ['Aneh, mending ajak teman.', 'ekstrovert'] },
      { q: 'Quote yang paling kamu banget:', a: ['"Kerja keras sekarang, santai kemudian."', 'deadline'], b: ['"Santai sekarang, santai kemudian."', 'rebahan'] },
      { q: 'Pilih satu superpower:', a: ['Teleport biar nggak pernah telat.', 'deadline'], b: ['Teleport biar nggak usah keluar rumah.', 'introvert'] },
    ];

    const box = T.out();
    let idx = 0;
    let skor = { rebahan: 0, deadline: 0, ekstrovert: 0, introvert: 0 };

    const tampilSoal = () => {
      const s = SOAL[idx];
      T.show(box,
        '<p class="center mut">Pertanyaan ' + (idx + 1) + ' / ' + SOAL.length + '</p>' +
        '<p class="big center" style="font-size:18px;line-height:1.6">' + T.esc(s.q) + '</p>' +
        '<div style="display:grid;gap:10px;margin-top:14px"></div>');
      const wadah = box.querySelector('div');
      const btnA = T.btn('A. ' + s.a[0], () => jawab(s.a[1]));
      const btnB = T.btn('B. ' + s.b[0], () => jawab(s.b[1]));
      btnA.style.textAlign = 'left'; btnB.style.textAlign = 'left';
      wadah.appendChild(btnA); wadah.appendChild(btnB);
    };

    const jawab = (tipe) => {
      skor[tipe]++;
      T.beep(600, 0.06, 'triangle');
      idx++;
      if (idx < SOAL.length) tampilSoal();
      else tampilHasil();
    };

    const tampilHasil = () => {
      let maks = -1, kandidat = [];
      Object.keys(skor).forEach((k) => {
        if (skor[k] > maks) { maks = skor[k]; kandidat = [k]; }
        else if (skor[k] === maks) kandidat.push(k);
      });
      const menang = kandidat[Math.floor(Math.random() * kandidat.length)];
      const t = TIPE[menang];
      try { localStorage.setItem('tesKepribadian.terakhir', menang); } catch (e) { /* abaikan */ }
      T.beep(660, 0.12); T.beep(880, 0.12, 'sine', 0.12); T.beep(1100, 0.25, 'sine', 0.24);
      T.show(box,
        '<p class="center mut">Hasil tes kamu…</p>' +
        '<div class="big center" style="font-size:44px">' + t.icon + '</div>' +
        '<p class="big center" style="font-size:21px">' + T.esc(t.nama) + '</p>' +
        '<p class="center" style="line-height:1.7">' + T.esc(t.desc) + '</p>' +
        '<p class="hint center">⚠️ Ini cuma hiburan receh, jangan baper. Kepribadian manusia nggak bisa diringkas 10 pertanyaan — tapi lumayan buat bahan becandaan di tongkrongan.</p>');
      const ulang = T.btn('🔁 Ulangi Tes', () => {
        idx = 0; skor = { rebahan: 0, deadline: 0, ekstrovert: 0, introvert: 0 };
        tampilSoal();
      });
      box.appendChild(T.row(ulang));
      box.appendChild(T.row(T.copyBtn(() => 'Hasil Tes Kepribadian Receh: ' + t.icon + ' ' + t.nama, '📋 Salin Hasil')));
    };

    root.appendChild(box);
    tampilSoal();

}
