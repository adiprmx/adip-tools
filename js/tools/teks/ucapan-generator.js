import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "ucapan-generator", "name": "Generator Ucapan", "cat": "teks", "icon": "💌", "desc": "Bikin ucapan Lebaran, nikah, ultah, dan lainnya.", "keywords": "ucapan,lebaran,nikah,ultah,kartu,selamat", "file": "tools/teks/ucapan-generator.js"};
export function render(root) {
  // {nama} = penerima (atau "sahabat" bila kosong), {dari} = pengirim
  const TPL = {
    'idul-fitri': {
      label: 'Idul Fitri',
      formal: [
        'Selamat Hari Raya Idul Fitri, {nama}. Taqabbalallahu minna wa minkum. Kami sekeluarga mohon maaf lahir dan batin atas segala kekhilafan. — {dari}',
        'Taqabbalallahu minna wa minkum, shiyamana wa shiyamakum. Selamat Idul Fitri untuk {nama} dan keluarga. Semoga kita kembali ke fitrah dan senantiasa dalam keberkahan. Mohon maaf lahir dan batin. — {dari}',
        'Di hari yang suci ini, kami mengucapkan Selamat Hari Raya Idul Fitri kepada {nama}. Minal aidin wal faizin, mohon maaf lahir dan batin. — {dari}'
      ],
      hangat: [
        'Selamat Lebaran, {nama}! Mohon maaf lahir batin ya, kalau selama ini ada salah kata atau sikap yang nggak disengaja. Semoga lebaranmu hangat bareng keluarga! — {dari}',
        'Minal aidin wal faizin, {nama}! THR-nya mungkin nggak seberapa, tapi doanya tulus: semoga sehat selalu dan rezeki makin lancar. Maaf lahir batin! — {dari}',
        'Lebaran tiba, {nama}! Saatnya maaf-maafan dan makan ketupat sampai kenyang. Mohon maaf lahir dan batin dari kami sekeluarga. — {dari}'
      ],
      lucu: [
        'Dosa setahun numpuk kayak cucian kotor — yuk dicuci bersih pas Lebaran! Mohon maaf lahir batin, {nama}. Jangan lupa THR buat yang di bawah umur. — {dari}',
        'Kalau chat gue pernah bikin kesel, anggap aja itu latihan kesabaran. Selamat Lebaran, {nama}! Maaf lahir batin, sampai jumpa di meja opor! — {dari}',
        'Resolusi puasa: kurus. Realita: nambah 3 kilo. Selamat Idul Fitri, {nama}, mohon maaf lahir dan batin! — {dari}'
      ]
    },
    'pernikahan': {
      label: 'Pernikahan',
      formal: [
        'Selamat menempuh hidup baru, {nama}. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah, dan dikaruniai keturunan yang saleh dan salehah. — {dari}',
        'Barakallahu laka wa baraka alaika wa jamaa bainakuma fii khair. Selamat menikah, {nama}. Semoga pernikahan ini penuh berkah dan kebahagiaan. — {dari}',
        'Turut berbahagia atas pernikahan {nama}. Semoga langgeng hingga ke Jannah-Nya, saling menguatkan dalam suka dan duka. — {dari}'
      ],
      hangat: [
        'Akhirnya SAH! Selamat menikah, {nama}! Semoga rumah tangganya selalu hangat, rezekinya lancar, dan cepat dapat momongan. — {dari}',
        'Selamat buat pengantin baru, {nama}! Semoga cintanya makin mekar tiap hari dan nggak pernah kehabisan topik obrolan sampai tua. — {dari}',
        'Happy wedding, {nama}! Dari jomblo bareng sampai nikah duluan — gue bangga! Semoga samawa ya. — {dari}'
      ],
      lucu: [
        'Selamat, {nama}! Status resmi berubah dari "tersedia" jadi "sold out". Semoga awet kayak sandal jepit legend! — {dari}',
        'Pernikahan itu kayak WiFi, {nama} — awalnya kencang, lama-lama... semoga kamu dapat yang unlimited! Happy wedding! — {dari}',
        'Akhirnya ada yang mau nampung kebiasaan anehmu, {nama}. Selamat menikah, semoga langgeng dan bahagia selalu! — {dari}'
      ]
    },
    'ultah': {
      label: 'Ulang Tahun',
      formal: [
        'Selamat ulang tahun, {nama}. Semoga panjang umur, sehat selalu, dan segala cita-cita tercapai. — {dari}',
        'Barakallahu fii umrik, {nama}. Selamat ulang tahun. Semoga di usia yang baru ini semakin dewasa, bijaksana, dan diberkahi. — {dari}',
        'Turut merayakan hari istimewa {nama}. Selamat ulang tahun, semoga sukses dalam karier dan kehidupan. — {dari}'
      ],
      hangat: [
        'Selamat ulang tahun, {nama}! Semoga tahun ini penuh kejutan manis, rezeki berlimpah, dan semua mimpimu satu per satu terwujud. Tiup lilinnya, buat doa yang banyak! — {dari}',
        'Happy birthday, {nama}! Makin tua makin kece ya. Semoga sehat terus, bahagia terus, dan traktirannya makin sering. — {dari}',
        'Yeay, nambah umur! Selamat ulang tahun, {nama}. Semoga yang disemogakan tersemogakan tahun ini! — {dari}'
      ],
      lucu: [
        'Selamat ulang tahun, {nama}! Umur boleh nambah, tapi tolong kelakuan jangan ikut nambah anehnya. — {dari}',
        'Katanya umur cuma angka... tapi angka kamu makin gede aja nih. Happy birthday, {nama}! Traktirannya ditunggu! — {dari}',
        'Selamat, {nama}! Kamu resmi naik level. Sayangnya nggak ada cheat code buat awet muda. — {dari}'
      ]
    },
    'kelahiran': {
      label: 'Kelahiran Anak',
      formal: [
        'Selamat atas kelahiran buah hati tercinta, {nama}. Semoga menjadi anak yang saleh dan salehah, sehat, dan membawa keberkahan bagi keluarga. — {dari}',
        'Turut bersukacita atas anugerah terindah ini, {nama}. Barakallahu laka fil mauhub. Semoga si kecil tumbuh sehat dan cerdas. — {dari}',
        'Selamat menjadi orang tua, {nama}. Semoga amanah baru ini membawa kebahagiaan yang tak terhingga. — {dari}'
      ],
      hangat: [
        'Yeay, selamat jadi ayah/ibu, {nama}! Semoga dedek bayinya sehat, lucu, dan tidurnya nyenyak (biar orang tuanya juga bisa tidur). — {dari}',
        'Selamat datang di dunia, si kecil! Dan selamat buat {nama} yang resmi jadi tim begadang. Semoga sehat selalu sekeluarga! — {dari}',
        'Akhirnya ketemu juga! Selamat atas kelahiran buah hatinya, {nama}. Semoga tumbuh jadi anak hebat yang membanggakan. — {dari}'
      ],
      lucu: [
        'Selamat, {nama}! Populasi manusia nambah satu, tim begadang nambah dua. Semoga dedeknya gampang diurus ya! — {dari}',
        'Wah, {nama} resmi upgrade jadi supir pribadi 24 jam tanpa gaji! Selamat atas kelahiran si kecil, semoga sehat selalu! — {dari}',
        'Denger-denger ada anggota baru nih! Selamat, {nama}. Siap-siap dompet makin tipis, hati makin penuh. — {dari}'
      ]
    },
    'wisuda': {
      label: 'Wisuda',
      formal: [
        'Selamat atas kelulusan {nama}. Semoga ilmu yang diraih bermanfaat dan menjadi langkah awal menuju kesuksesan. — {dari}',
        'Turut bangga atas pencapaian {nama}. Semoga sukses selalu dalam karier dan kehidupan. — {dari}',
        'Selamat wisuda, {nama}. Perjuangan belum selesai — semoga gelar ini membuka pintu masa depan yang cerah. — {dari}'
      ],
      hangat: [
        'Akhirnya lulus juga! Selamat wisuda, {nama}! Bangga banget sama perjuanganmu. Semoga ilmunya berkah dan cepat dapat kerja impian! — {dari}',
        'Toga-nya keren, {nama}! Selamat atas kelulusannya. Semoga ini awal dari hal-hal hebat dalam hidupmu. — {dari}',
        'Happy graduation, {nama}! Dari begadang ngerjain skripsi sampai akhirnya wisuda — salut! Sukses terus ya! — {dari}'
      ],
      lucu: [
        'Selamat wisuda, {nama}! Resmi jadi pengangguran bergelar. Semoga cepat dapat kerja biar gelarnya nggak cuma pajangan! — {dari}',
        'Skripsi selesai, toga dipakai, foto wisuda di-upload. Selamat, {nama}! Sekarang saatnya menghadapi bos yang sesungguhnya: dunia kerja. — {dari}',
        'Wisuda = bebas dari dosen killer, tapi masuk ke jebakan yang lebih besar: cicilan. Sukses selalu, {nama}! — {dari}'
      ]
    },
    'duka': {
      label: 'Duka Cita',
      formal: [
        'Innalillahi wa inna ilaihi rajiun. Turut berduka cita yang sedalam-dalamnya, {nama}. Semoga almarhum/almarhumah husnul khatimah dan keluarga yang ditinggalkan diberi ketabahan. — {dari}',
        'Kami turut berbelasungkawa atas kabar duka ini, {nama}. Semoga amal ibadahnya diterima dan keluarga diberi kekuatan. — {dari}',
        'Duka cita mendalam untuk {nama} dan keluarga. Semoga yang telah pergi mendapat tempat terbaik di sisi-Nya. — {dari}'
      ],
      hangat: [
        'Turut berduka ya, {nama}. Gue tahu ini berat banget. Kalau butuh apa-apa atau sekadar teman cerita, gue ada. Semoga kamu dan keluarga dikuatkan. — {dari}',
        'Innalillahi... yang sabar ya, {nama}. Kehilangan itu nggak mudah, tapi kamu nggak sendirian. Peluk jauh dari gue. — {dari}',
        '{nama}, turut berduka cita. Semoga kenangan indah bersamanya jadi penguat di hari-hari ke depan. Take your time, gue di sini. — {dari}'
      ],
      lucu: [
        'Turut berduka cita, {nama}. Nggak ada kata-kata yang cukup, jadi gue bawain doa aja — plus siap jadi ojek kapan pun kamu butuh. — {dari}',
        '{nama}, duka cita sedalam-dalamnya. Kalau sedih jangan dipendam sendirian — nangis bareng gue juga boleh, gratis kok. — {dari}',
        'Innalillahi wa inna ilaihi rajiun. Yang tabah ya, {nama}. Gue doain yang terbaik, dan kalau butuh teman makan bakso tengah malam, telepon gue. — {dari}'
      ]
    },
    'sembuh': {
      label: 'Lekas Sembuh',
      formal: [
        'Semoga lekas sembuh, {nama}. Kami mendoakan kesehatanmu segera pulih seperti sedia kala. — {dari}',
        'Syafakallah/syafakillah, {nama}. Semoga Allah mengangkat penyakitmu dan menggantinya dengan kesehatan. — {dari}',
        'Turut prihatin atas sakitnya {nama}. Semoga lekas pulih dan bisa beraktivitas kembali. — {dari}'
      ],
      hangat: [
        'Get well soon, {nama}! Istirahat yang cukup ya, jangan bandel. Semoga cepat sembuh biar bisa nongkrong lagi! — {dari}',
        'Cepat sembuh ya, {nama}! Kasurnya pasti udah bosen nemenin kamu. Semoga besok udah bisa jalan-jalan lagi. — {dari}',
        'Syafakillah/syafakallah, {nama}. Sakit itu penghapus dosa, tapi jangan kelamaan ya — kami kangen! — {dari}'
      ],
      lucu: [
        'Katanya sakit biar kurus... tapi kamu jangan keterusan ya, {nama}! Cepat sembuh, biar bisa makan enak lagi! — {dari}',
        'RS-nya nyaman? Jangan betah-betah, {nama}! Lekas sembuh, kasur rumah lebih kangen. — {dari}',
        'Obat paling manjur = traktir bakso. Cepat sembuh ya, {nama}, biar bisa bayar utang traktiran! — {dari}'
      ]
    }
  };

  const momen = T.select(Object.keys(TPL).map((k) => [k, TPL[k].label]), 'idul-fitri');
  const pengirim = T.input('text', 'cth: Budi', '');
  const penerima = T.input('text', 'cth: Ibu Sari (opsional)', '');
  const gaya = T.select([['formal', 'Formal'], ['hangat', 'Hangat'], ['lucu', 'Lucu']], 'hangat');
  const box = T.out();

  const buat = () => {
    const dari = pengirim.value.trim();
    if (!dari) { T.toast('Isi dulu nama pengirimnya ya'); pengirim.focus(); return; }
    const nama = penerima.value.trim() || 'sahabat';
    const varian = TPL[momen.value][gaya.value].slice();
    // acak urutan biar tiap generate terasa segar
    for (let i = varian.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [varian[i], varian[j]] = [varian[j], varian[i]];
    }
    T.show(box, '');
    varian.forEach((t, i) => {
      const teks = t.replaceAll('{nama}', nama).replaceAll('{dari}', dari);
      const card = T.el('<div class="out" style="margin-bottom:10px"><p class="mut" style="font-size:12px;margin:0 0 6px">Varian ' + (i + 1) + '</p><p style="font-size:14px;line-height:1.65;margin:0 0 10px"></p></div>');
      card.querySelector('p:nth-child(2)').textContent = teks;
      card.appendChild(T.copyBtn(() => teks, 'Salin'));
      box.appendChild(card);
    });
  };

  root.appendChild(T.field('Momen', momen));
  root.appendChild(T.field('Nama pengirim', pengirim));
  root.appendChild(T.field('Nama penerima (opsional)', penerima));
  root.appendChild(T.field('Gaya bahasa', gaya));
  root.appendChild(T.row(T.btn('Buat Ucapan', buat, true)));
  root.appendChild(box);
}
