import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "generator-komplimen", "name": "Generator Komplimen", "cat": "fun", "icon": "💛", "desc": "Komplimen hangat acak buat cerahkan harimu.", "keywords": "komplimen,pujian,acak,semangat,motivasi"};

export const KOMPLIMEN = [
  'Kamu itu definisi tenang yang menenangkan — orang di sekitarmu beruntung.',
  'Cara kamu bertahan sampai sejauh ini sudah bukti kamu kuat banget.',
  'Kamu selalu tahu cara bikin obrolan biasa jadi seru.',
  'Kerja kerasmu mungkin nggak selalu kelihatan, tapi hasilnya pasti terasa.',
  'Kamu punya selera yang bagus — itu kelihatan dari pilihan-pilihanmu.',
  'Terima kasih sudah jadi orang yang bisa diandalkan.',
  'Kamu dengerin orang lain dengan tulus, itu langka banget.',
  'Semangatmu nular, lho. Serius.',
  'Kamu itu tipe orang yang bikin tim jadi lebih hidup.',
  'Cara kamu menyelesaikan masalah itu rapi dan elegan.',
  'Kamu berhak bangga sama progresmu, sekecil apa pun itu.',
  'Kamu selalu datang tepat waktu — hal kecil yang menunjukkan kamu menghargai orang lain.',
  'Senyummu bisa memperbaiki mood satu ruangan.',
  'Kamu berani mencoba hal baru, itu bukan hal kecil.',
  'Kamu itu pendengar yang baik sekaligus pemberi saran yang jujur.',
  'Konsistensimu patut diacungi jempol.',
  'Kamu punya cara berpikir yang jernih — enak diajak diskusi.',
  'Kamu nggak gampang menyerah, dan itu terlihat jelas.',
  'Keberadaanmu bikin perbedaan, walau kamu nggak sadar.',
  'Kamu selalu berusaha adil ke semua orang — itu sikap yang mahal.',
  'Kreativitasmu sering bikin orang lain terinspirasi.',
  'Kamu itu orang yang kalau janji, ditepati.',
  'Kamu bisa tetap santai di situasi yang bikin orang lain panik.',
  'Kamu memperlakukan orang dengan hormat, tanpa pilih-pilih.',
  'Kamu punya keberanian buat mengakui kesalahan — itu tanda dewasa.',
  'Caramu menghargai hal-hal kecil itu bikin hidup terasa lebih bermakna.',
  'Kamu itu bukti kalau jadi baik itu nggak harus ribet.',
  'Kamu selalu siap membantu tanpa diminta — orang kayak kamu jarang.',
  'Kamu punya energi positif yang bikin orang betah di dekatmu.',
  'Kamu itu versi terbaik dari dirimu yang terus berkembang.',
  'Kamu nggak perlu jadi sempurna buat jadi berharga.',
  'Dedikasimu pada hal yang kamu suka itu menginspirasi.',
  'Kamu itu orang yang bikin orang lain merasa didengar.',
  'Kamu punya keteguhan yang diam-diam menguatkan orang di sekitarmu.',
  'Hari ini kamu sudah melakukan yang terbaik — dan itu cukup.',
];

/** Ambil 1 komplimen acak, hindari pengulangan beruntun. */
export function acakKomplimen(terakhir) {
  let i = Math.floor(Math.random() * KOMPLIMEN.length);
  if (KOMPLIMEN.length > 1 && i === terakhir) i = (i + 1) % KOMPLIMEN.length;
  return { teks: KOMPLIMEN[i], idx: i };
}

export function render(root) {
  const box = T.out();
  let terakhir = -1, teksAktif = '';

  const kasih = () => {
    const r = acakKomplimen(terakhir);
    terakhir = r.idx; teksAktif = r.teks;
    T.show(box,
      '<div class="center"><div style="font-size:40px">💛</div>' +
      '<div style="font-size:17px;line-height:1.6;margin:14px 0;max-width:420px">“' + T.esc(r.teks) + '”</div></div>');
    const t = T.el('<div class="center"></div>');
    t.appendChild(T.copyBtn(() => teksAktif, '📋 Salin'));
    box.appendChild(t);
    beep(740, 0.15, 'sine'); beep(988, 0.2, 'sine', 0.14);
  };

  root.appendChild(T.el('<div class="center dim" style="margin-bottom:12px">Lagi butuh kata-kata baik? Klik aja.</div>'));
  root.appendChild(T.btn('💛 Kasih aku komplimen', kasih, true));
  root.appendChild(box);
}
