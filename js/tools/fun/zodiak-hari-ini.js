import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "zodiak-hari-ini", "name": "Zodiak Hari Ini", "cat": "fun", "icon": "♈", "desc": "Cek zodiakmu + ramalan receh hari ini. Cuma hiburan!", "keywords": "zodiak,ramalan,horoskop,bintang,lahir"};

const SIGNS = [
  { id: 'capricorn', icon: '♑', name: 'Capricorn', dates: '22 Des – 19 Jan', from: [12, 22], to: [1, 19], trait: 'Ambisius, disiplin, mukanya serius padahal hatinya receh.' },
  { id: 'aquarius', icon: '♒', name: 'Aquarius', dates: '20 Jan – 18 Feb', from: [1, 20], to: [2, 18], trait: 'Unik, mandiri, idenya out of the box sampai box-nya hilang.' },
  { id: 'pisces', icon: '♓', name: 'Pisces', dates: '19 Feb – 20 Mar', from: [2, 19], to: [3, 20], trait: 'Perasa, imajinatif, gampang baper tapi gampang juga maafin.' },
  { id: 'aries', icon: '♈', name: 'Aries', dates: '21 Mar – 19 Apr', from: [3, 21], to: [4, 19], trait: 'Berani, spontan, gaspol dulu mikir belakangan.' },
  { id: 'taurus', icon: '♉', name: 'Taurus', dates: '20 Apr – 20 Mei', from: [4, 20], to: [5, 20], trait: 'Sabar, setia, dan paling nggak bisa nolak makanan enak.' },
  { id: 'gemini', icon: '♊', name: 'Gemini', dates: '21 Mei – 20 Jun', from: [5, 21], to: [6, 20], trait: 'Seru, adaptif, mood-nya ada dua dan dua-duanya rame.' },
  { id: 'cancer', icon: '♋', name: 'Cancer', dates: '21 Jun – 22 Jul', from: [6, 21], to: [7, 22], trait: 'Penyayang, protektif, ingatannya tajam soal hal sepele.' },
  { id: 'leo', icon: '♌', name: 'Leo', dates: '23 Jul – 22 Agu', from: [7, 23], to: [8, 22], trait: 'Pede, karismatik, lahir buat jadi pusat perhatian.' },
  { id: 'virgo', icon: '♍', name: 'Virgo', dates: '23 Agu – 22 Sep', from: [8, 23], to: [9, 22], trait: 'Perfeksionis, teliti, rapi sampai level ganggu.' },
  { id: 'libra', icon: '♎', name: 'Libra', dates: '23 Sep – 22 Okt', from: [9, 23], to: [10, 22], trait: 'Adil, charming, paling susah milih menu makanan.' },
  { id: 'scorpio', icon: '♏', name: 'Scorpio', dates: '23 Okt – 21 Nov', from: [10, 23], to: [11, 21], trait: 'Intens, misterius, sekali sayang ya sayang beneran.' },
  { id: 'sagitarius', icon: '♐', name: 'Sagitarius', dates: '22 Nov – 21 Des', from: [11, 22], to: [12, 21], trait: 'Petualang, jujur, omongannya ceplas-ceplos tapi ngangenin.' },
];

export function signOf(month, day) {
  for (const s of SIGNS) {
    const fm = s.from[0], fd = s.from[1], tm = s.to[0], td = s.to[1];
    if ((month === fm && day >= fd) || (month === tm && day <= td)) return s;
  }
  return null;
}

const RAMAL = {
  cinta: [
    'Hari ini auramu manis, tapi gebetanmu masih mikirin mantan. Sabar.',
    'Ada yang diam-diam stalking kamu. Sayangnya cuma stalking, nggak nge-chat.',
    'Jodohmu lagi di jalan... macet. Tungguin aja.',
    'Jangan terlalu berharap sama chat "pagi" doang. Itu template.',
    'Hari yang bagus buat bilang sayang ke... diri sendiri dulu.',
    'Gebetanmu hari ini mood-nya kayak cuaca: berubah tiap lima menit.',
    'Kalau dia balesnya lama, bukan sibuk — lagi mikir jawaban yang aman.',
    'Cinta sejati itu kayak sinyal: kadang full bar, kadang hilang sendiri.',
    'Hari ini cocok buat move on. Atau move... ya gitu-gitu aja.',
    'Ada potensi PDKT hari ini. Potensi doang, belum tentu kejadian.',
    'Jangan kirim chat panjang jam 2 pagi. Percaya deh.',
    'Gebetanmu ngetik... ngetik... terus offline. Sabar ya.',
    'Cinta itu buta, tapi kamu jangan ikut-ikutan buta.',
    'Hari ini hatimu aman. Dompetmu yang belum tentu.',
    'Yang kemarin ghosting bakal muncul lagi. Jangan dibales, biarin penasaran.',
    'Pasanganmu hari ini lagi manis. Nikmatin, jangan dicurigai.',
    'Single? Tenang, mie instan juga nggak pernah ninggalin kamu.',
    'Ada yang mau kenalan lewat teman. Jangan langsung nanya "kerja di mana".',
    'Ramalan bilang: senyummu hari ini bikin orang salah paham. Lanjutin.',
    'Cinta lama bersemi kembali... di mimpi doang.',
    'Jangan suka sama yang cuma baik pas butuh. Kamu bukan ojek.',
    'Hari ini cocok buat ngomong jujur. Kecuali soal umur, itu rahasia.',
  ],
  karier: [
    'Bosmu hari ini lagi baik. Manfaatkan sebelum mood-nya berubah.',
    'Ada tugas dadakan sore ini. Siapin kopi dari sekarang.',
    'Ide gilamu minggu lalu ternyata masuk akal juga. Angkat lagi.',
    'Jangan males-malesan, CCTV kantor bisa zoom.',
    'Hari ini cocok buat minta naik gaji. Eh, bercanda. Jangan.',
    'Rekan kerjamu butuh bantuan. Bantuin, nanti gantian ditraktir.',
    'Deadline makin dekat, tapi kamu malah buka tool ini. Prioritas, bro.',
    'Ada peluang proyek baru. Ambil, lumayan buat jajan.',
    'Jangan gosip di pantry, dinding kantor punya telinga.',
    'Email penting bakal masuk hari ini. Jangan diarsipin tanpa dibaca.',
    'Fokusmu buyar gara-gara notif. Matiin dulu bentar.',
    'Kerjaan numpuk? Kerjain satu-satu, jangan dipelototin doang.',
    'Hari yang bagus buat belajar skill baru. YouTube gratis.',
    'Jangan bandingin gajimu sama gaji orang di LinkedIn. Beda server.',
    'Meeting hari ini bakal molor. Bawa cemilan.',
    'Atasanmu lagi cari orang buat proyek. Tunjuk tangan duluan.',
    'Jangan resign dulu hari ini. Tunggu besok... bercanda, jangan resign.',
    'Lembur? Pastikan dibayar, jangan dibayar pakai "terima kasih".',
    'Klienmu hari ini gampang diajak kompromi. Gas.',
    'Ada kabar baik soal karier minggu ini. Sabar, antre.',
    'Jangan lupa backup kerjaan. Laptop bisa khianat kapan aja.',
    'Produktivitasmu naik 200% hari ini. Sisanya 800% masih rebahan.',
  ],
  kesehatan: [
    'Minum air putih dulu sana, jangan kopi mulu.',
    'Matamu lelah liatin layar. Istirahat 20 detik, lihat yang jauh.',
    'Hari ini cocok buat jalan kaki. Ke warung juga jalan, jangan motor.',
    'Tidur jangan jam 3 pagi terus. Kamu bukan kalong.',
    'Punggungmu protes tuh, duduk yang bener.',
    'Makan sayur hari ini. Mie instan doang nggak dihitung.',
    'Olahraga ringan 10 menit. Naik turun tangga juga olahraga.',
    'Jangan skip sarapan. Perut keroncongan pas meeting itu malu-maluin.',
    'Kurangi gula hari ini. Teh manisnya setengah aja.',
    'Stretching bentar, badanmu kaku kayak kanebo kering.',
    'Hari ini energimu oke. Jangan dihabisin buat overthinking.',
    'Cuaca lagi nggak jelas, bawa jaket. Flu itu mahal.',
    'Jangan begadang nonton drakor. Besok mata panda.',
    'Makan buah, bukan cuma difoto buat story.',
    'Napas dalam-dalam. Stresmu turun 0,5 persen.',
    'Jangan duduk kelamaan, berdiri tiap sejam.',
    'Sakit kepala? Mungkin kurang minum, bukan kurang piknik. Ya piknik juga sih.',
    'Jaga pola makan, jangan jaga mantan.',
    'Hari ini mood bagus buat olahraga. Besok belum tentu, gas sekarang.',
    'Kurangin rebahan, kasurmu udah bosen.',
    'Vitamin D gratis dari matahari pagi. Manfaatkan.',
    'Sehat itu investasi. Begadangmu yang bikin bangkrut.',
  ],
};

function seededRand(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const CATS = [
  ['cinta', '💘', 'Cinta'],
  ['karier', '💼', 'Karier'],
  ['kesehatan', '🌿', 'Kesehatan'],
];

export function render(root) {
  const disclaim = T.el('<div style="border:1px solid var(--warn);border-radius:12px;padding:10px 12px;font-size:12.5px;line-height:1.6;margin-bottom:12px;background:rgba(251,191,36,0.07)">' +
    '<b>⚠️ Disclaimer dulu:</b> ini cuma hiburan, jangan dibawa serius. Masa depanmu ditentukan usahamu, bukan posisi bintang.</div>');

  const dateInp = T.input('date', '', '');
  const box = T.out();

  const cek = () => {
    T.hide(box);
    const v = dateInp.value;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) { T.show(box, '<p style="color:var(--err);font-size:13px">Isi dulu tanggal lahirmu biar bisa dicek.</p>'); return; }
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
      T.show(box, '<p style="color:var(--err);font-size:13px">Tanggalnya nggak valid nih, cek lagi.</p>');
      return;
    }
    const s = signOf(mo, d);
    if (!s) { T.show(box, '<p style="color:var(--err);font-size:13px">Hmm, zodiaknya nggak ketemu. Coba lagi.</p>'); return; }
    const today = new Date();
    const seedBase = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '|' + s.id;
    const tglStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let cards = '';
    CATS.forEach(([key, emoji, label]) => {
      const rnd = seededRand(seedBase + '|' + key);
      const bank = RAMAL[key];
      const msg = bank[Math.floor(rnd() * bank.length)];
      const stars = 1 + Math.floor(rnd() * 5);
      cards += '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;background:var(--surface)">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:6px">' + emoji + ' ' + label + ' ' +
        '<span style="color:var(--acc);letter-spacing:2px">' + '★'.repeat(stars) + '<span style="opacity:0.3">' + '★'.repeat(5 - stars) + '</span></span></div>' +
        '<p style="font-size:13px;line-height:1.6;margin:0;color:var(--mut)">' + T.esc(msg) + '</p></div>';
    });

    T.show(box,
      '<div class="center" style="padding:8px 0">' +
      '<div style="font-size:44px">' + s.icon + '</div>' +
      '<div style="font-size:18px;font-weight:700">' + T.esc(s.name) + '</div>' +
      '<div class="hint">' + T.esc(s.dates) + '</div>' +
      '<p style="font-size:13px;color:var(--mut);margin:8px 0 0">' + T.esc(s.trait) + '</p>' +
      '<p class="hint" style="margin-top:10px">Ramalan ' + T.esc(tglStr) + ' — berlaku sehari, besok ganti lagi.</p>' +
      '</div>' + cards);
  };

  root.appendChild(disclaim);
  root.appendChild(T.field('Tanggal lahir', dateInp, 'Buat nentuin zodiakmu'));
  root.appendChild(T.row(T.btn('Cek Zodiakku', cek, true)));
  root.appendChild(box);
}
