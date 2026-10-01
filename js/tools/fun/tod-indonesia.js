import { h as T } from '../../core.js?v=6.5.0';

export const meta = {"id": "tod-indonesia", "name": "Truth or Dare Indonesia", "cat": "fun", "icon": "😈", "desc": "Main truth or dare bareng, 110 soal anti basi.", "keywords": "truth or dare,tod,jujur,tantangan,game,main bareng,nongkrong"};

const TRUTH = [
  "Siapa orang yang terakhir kamu stalk di media sosial?",
  "Apa chat paling memalukan yang pernah kamu kirim?",
  "Pernah nggak pura-pura sakit biar nggak masuk sekolah atau kerja?",
  "Lagu apa yang paling sering kamu putar diam-diam?",
  "Siapa cinta pertamamu?",
  "Apa kebiasaan anehmu yang nggak diketahui orang lain?",
  "Film apa yang pernah bikin kamu nangis?",
  "Makanan apa yang kamu benci padahal semua orang suka?",
  "Apa kebohongan kecil yang pernah kamu bilang ke orang tuamu?",
  "Kalau bisa tukaran hidup sehari, mau jadi siapa?",
  "Hal paling receh apa yang pernah bikin kamu ngakak?",
  "Pernah nggak salah kirim chat ke orang yang salah?",
  "Apa nama panggilanmu waktu kecil?",
  "Hal apa yang paling kamu sesali minggu ini?",
  "Kalau tiba-tiba dapat 1 miliar, hal pertama yang kamu lakuin apa?",
  "Apa ketakutan terbesarmu?",
  "Siapa yang paling sering kamu chat setiap hari?",
  "Pernah nggak ketiduran di kelas atau pas rapat?",
  "Apa bakat terpendammu?",
  "Film atau series apa yang kamu tonton berkali-kali nggak bosen?",
  "Hal paling berani apa yang pernah kamu lakukan?",
  "Pernah nggak ngomongin orang terus ketahuan?",
  "Apa cita-citamu waktu kecil dulu?",
  "Siapa orang yang paling kamu kagumi, dan kenapa?",
  "Hal kecil apa yang bisa langsung merusak mood kamu?",
  "Pernah nggak jatuh cinta pada pandangan pertama?",
  "Makanan favoritmu yang bikin orang heran apa?",
  "Kalau bisa menghapus satu kenangan, kenangan yang mana?",
  "Barang paling mahal apa yang pernah kamu beli secara impulsif?",
  "Pernah nggak pura-pura ngerti padahal aslinya blank total?",
  "Jujur, siapa yang paling ngeselin di tongkrongan ini?",
  "Chat siapa yang paling lama belum kamu balas?",
  "Pernah nggak nangis gara-gara dengerin lagu?",
  "Hal apa yang pengin banget kamu coba tapi belum berani?",
  "Kalau jadi hantu, siapa orang pertama yang mau kamu hantui?",
  "Apa ritualmu sebelum tidur?",
  "Pernah nggak ngiler pas tidur?",
  "Mantan siapa yang masih diam-diam kamu kepoin?",
  "Postingan paling cringe apa yang pernah kamu upload?",
  "Game apa yang paling sering kamu mainin sekarang?",
  "Pernah nggak ketahuan bohong? Ceritain.",
  "Hal apa yang bikin kamu langsung bad mood?",
  "Kalau bisa balik ke masa lalu, apa yang mau kamu ubah?",
  "Apa rahasia yang bikin masakanmu enak?",
  "Siapa yang paling kamu kangenin saat ini?",
  "Pernah nggak salah panggil nama orang? Ke siapa?",
  "Hal paling absurd apa yang pernah kamu percaya waktu kecil?",
  "Kalau punya satu kekuatan super, mau yang apa?",
  "Barang apa yang selalu ada di tas atau kantongmu?",
  "Pernah nggak ngomong sendiri kayak orang gila?",
  "Hal paling romantis apa yang pernah dilakukan seseorang ke kamu?",
  "Kalau dapat kabar baik, siapa orang pertama yang kamu hubungi?",
  "Satu hal apa yang paling kamu benci dari dirimu sendiri?",
  "Lagu apa yang liriknya kamu hafal di luar kepala?",
  "Kalau liburan gratis ke mana aja, mau ke mana?",
];

const DARE = [
  "Kirim chat \"aku kangen\" ke kontak ke-5 di HP-mu, tunjukin buktinya.",
  "Nyanyikan reff lagu favoritmu sekarang juga.",
  "Tirukan gaya jalan salah satu pemain di sini.",
  "Tunjukkan foto paling jelek di galerimu ke semua orang.",
  "Telepon ibumu dan bilang \"makasih ya, Ma/Bu\".",
  "Ngomong pakai logat daerah selama 3 ronde ke depan.",
  "Lakukan 10 squat sekarang juga.",
  "Ceritakan mimpi teraneh yang pernah kamu alami.",
  "Tunjukkan chat terakhirmu dengan gebetan atau doi.",
  "Makan sesuatu dengan mata tertutup, lalu tebak itu apa.",
  "Buatkan puisi dadakan 2 baris tentang orang di sebelahmu.",
  "Berpose seperti foto KTP selama 1 menit penuh.",
  "Kirim voice note nyanyi ke grup chat.",
  "Tirukan suara hewan pilihan pemain lain.",
  "Jalan mundur mengelilingi ruangan sekali putaran.",
  "Buka riwayat pencarian terakhirmu, bacakan 3 teratas.",
  "Beri pujian yang tulus untuk setiap pemain di sini.",
  "Selama 2 ronde ke depan, ngomongnya cuma boleh berbisik.",
  "Tirukan ekspresi kaget yang paling lebay versimu.",
  "Sebutkan 10 nama kota dalam 15 detik.",
  "Lakukan dance paling gampang yang kamu tahu selama 15 detik.",
  "Baca chat terakhir dari ibumu dengan suara lantang.",
  "Kirim emoji 👋 ke 3 orang acak di kontakmu.",
  "Ceritakan momen paling memalukanmu versi singkat.",
  "Tahan tawa selama 1 menit sementara yang lain berusaha membuatmu ketawa.",
  "Bilang \"aku sayang kamu\" ke orang di sebelah kananmu.",
  "Ganti foto profilmu jadi foto paling jelek selama 10 menit.",
  "Tirukan gaya bicara salah satu pemain di sini.",
  "Lompat 5 kali sambil teriak nama makanan favoritmu.",
  "Sebutkan 5 hal yang kamu syukuri hari ini.",
  "Telepon seorang teman dan ngobrol pakai bahasa alien selama 30 detik.",
  "Tunjukkan foto masa kecilmu yang paling lucu.",
  "Minum segelas air putih sampai habis sekaligus.",
  "Lakukan plank selama 30 detik.",
  "Nyanyikan lagu anak-anak dengan gaya opera yang dramatis.",
  "Bacakan pesan terakhir di grup WA dengan intonasi sinetron.",
  "Kasih tebak-tebakan ke semua pemain — yang nggak bisa jawab, gantian kena dare.",
  "Tirukan pose selebriti favoritmu.",
  "Ceritakan cita-citamu dengan gaya presentasi yang super serius.",
  "Lakukan 5 push-up sekarang.",
  "Kirim pesan \"kamu hebat hari ini\" ke salah satu temanmu.",
  "Berdiri dengan satu kaki selama 1 menit.",
  "Tirukan bunyi notifikasi HP yang paling ikonik.",
  "Sebutkan alfabet dari Z ke A tanpa salah.",
  "Buatkan pantun dadakan 4 baris.",
  "Tunjukkan aplikasi yang paling sering kamu buka (cek screen time).",
  "Buka galeri, tunjukkan foto ke-10 dari atas.",
  "Minta maaf via chat ke seseorang yang pernah kamu sakiti.",
  "Sebutkan 3 hal yang kamu suka dari pemain di sebelah kirimu.",
  "Joget bebas 15 detik mengikuti lagu pilihan pemain lain.",
  "Nyanyikan jingle iklan yang paling kamu ingat.",
  "Lakukan gaya reporter berita melaporkan kejadian di ruangan ini.",
  "Sebutkan 5 benda di ruangan ini dalam bahasa Inggris.",
  "Tutup mata, tunjuk satu pemain, lalu kasih dia pujian.",
  "Bikin suara tepuk tangan pakai satu tangan. Coba aja!",
];

export function render(root) {
  let mode = 'all';
  let deck = [];
  const card = T.out();

  const shuffle = (a) => {
    const x = a.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  };
  const buildDeck = () => {
    const pool = mode === 'truth' ? TRUTH.map((t) => ['truth', t])
      : mode === 'dare' ? DARE.map((t) => ['dare', t])
      : TRUTH.map((t) => ['truth', t]).concat(DARE.map((t) => ['dare', t]));
    deck = shuffle(pool);
  };
  const draw = () => {
    if (!deck.length) buildDeck();
    const [type, text] = deck.pop();
    const isT = type === 'truth';
    T.show(card,
      '<p class="center mut" style="letter-spacing:3px;font-size:12px">' + (isT ? 'TRUTH 💬' : 'DARE 🔥') + '</p>' +
      '<p class="center" style="font-size:18px;line-height:1.65;margin:10px 0">' + T.esc(text) + '</p>' +
      '<p class="hint center">Sisa ' + deck.length + ' kartu di deck ini</p>');
    if (!deck.length) T.toast('Deck habis — dikocok ulang otomatis');
  };

  const bAll = T.btn('Semua', null, true);
  const bT = T.btn('Truth', null);
  const bD = T.btn('Dare', null);
  const setMode = (m) => {
    mode = m;
    [bAll, bT, bD].forEach((b) => b.classList.remove('primary'));
    ({ all: bAll, truth: bT, dare: bD })[m].classList.add('primary');
    buildDeck();
  };
  bAll.addEventListener('click', () => setMode('all'));
  bT.addEventListener('click', () => setMode('truth'));
  bD.addEventListener('click', () => setMode('dare'));

  const acak = T.btn('🎲 Acak', draw, true);
  acak.style.fontSize = '17px';
  acak.style.padding = '14px 28px';

  root.appendChild(T.row(bAll, bT, bD));
  const wrapAcak = T.el('<div class="center" style="margin:14px 0"></div>');
  wrapAcak.appendChild(acak);
  root.appendChild(wrapAcak);
  root.appendChild(card);
  root.appendChild(T.el('<p class="hint center">Kartu dikocok acak dan nggak akan keluar dua kali sampai deck habis. Mainnya jujur ya.</p>'));
  buildDeck();
  T.show(card, '<p class="center mut">Pilih filter, lalu tekan Acak buat mulai main.</p>');
}
