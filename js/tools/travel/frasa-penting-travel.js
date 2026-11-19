import { h as T, utils } from '../../core.js';

// Frasa penting buat jalan-jalan ke luar negeri: 8 bahasa, 12 frasa tiap
// bahasa, lengkap dengan cara bacanya. Ketuk frasa untuk menyalin.
// [bahasa Indonesia, bahasa tujuan, cara baca, kategori]
export const KATEGORI = [
  ['semua', 'Semua frasa'],
  ['sapa', 'Sapa dan sopan'],
  ['arah', 'Arah dan transport'],
  ['makan', 'Makan'],
  ['belanja', 'Belanja'],
  ['darurat', 'Darurat dan bantuan'],
];
export const BAHASA = [
  { kode: 'en', nama: 'Inggris', frasa: [
    ['Halo / Selamat pagi', 'Hello / Good morning', 'Helo / Gud morning', 'sapa'],
    ['Terima kasih', 'Thank you', 'Tengkyu', 'sapa'],
    ['Tolong', 'Please', 'Plis', 'sapa'],
    ['Permisi / Maaf', 'Excuse me / Sorry', 'Ekskyus mi / Sori', 'sapa'],
    ['Berapa harganya?', 'How much is this?', 'Hau mac is dis?', 'belanja'],
    ['Di mana toilet?', 'Where is the toilet?', 'Wer is de toilet?', 'arah'],
    ['Saya mau ke bandara', 'I want to go to the airport', 'Ai wont tu go tu di airport', 'arah'],
    ['Saya tidak mengerti', "I don't understand", 'Ai don understend', 'darurat'],
    ['Bisa bicara bahasa Inggris?', 'Can you speak English?', 'Ken yu spik Inglish?', 'darurat'],
    ['Tolong, saya butuh bantuan', 'Please, I need help', 'Plis, ai nid help', 'darurat'],
    ['Saya tidak makan daging babi', "I don't eat pork", 'Ai don it pork', 'makan'],
    ['Di mana stasiun terdekat?', 'Where is the nearest station?', 'Wer is de nirest stesyen?', 'arah'],
  ] },
  { kode: 'ms', nama: 'Melayu', frasa: [
    ['Halo / Selamat pagi', 'Hello / Selamat pagi', 'Helo / Selamat pagi', 'sapa'],
    ['Terima kasih', 'Terima kasih', 'Terima kasih', 'sapa'],
    ['Tolong', 'Tolong', 'Tolong', 'sapa'],
    ['Permisi / Maaf', 'Maaf / Tumpang lalu', 'Maaf / Tumpang lalu', 'sapa'],
    ['Berapa harganya?', 'Berapa harga ini?', 'Berapa harga ini?', 'belanja'],
    ['Di mana toilet?', 'Di mana tandas?', 'Di mana tandas?', 'arah'],
    ['Saya mau ke bandara', 'Saya mahu ke lapangan terbang', 'Saya mau ke lapangan terbang', 'arah'],
    ['Saya tidak mengerti', 'Saya tidak faham', 'Saya tidak faham', 'darurat'],
    ['Bisa bicara bahasa Inggris?', 'Boleh cakap Bahasa Inggeris?', 'Boleh cakap Bahasa Inggeris?', 'darurat'],
    ['Tolong, saya butuh bantuan', 'Tolong, saya perlukan bantuan', 'Tolong, saya perlukan bantuan', 'darurat'],
    ['Saya tidak makan daging babi', 'Saya tidak makan babi', 'Saya tidak makan babi', 'makan'],
    ['Di mana stasiun terdekat?', 'Di mana stesen terdekat?', 'Di mana stesen terdekat?', 'arah'],
  ] },
  { kode: 'zh', nama: 'Mandarin', frasa: [
    ['Halo / Selamat pagi', '你好 / 早上好', 'Ni hao / Zaoshang hao', 'sapa'],
    ['Terima kasih', '谢谢', 'Xiexie', 'sapa'],
    ['Tolong', '请', 'Qing', 'sapa'],
    ['Permisi / Maaf', '对不起 / 借过', 'Duibuqi / Jieguo', 'sapa'],
    ['Berapa harganya?', '这个多少钱？', 'Zhege duoshao qian?', 'belanja'],
    ['Di mana toilet?', '洗手间在哪儿？', 'Xishoujian zai nar?', 'arah'],
    ['Saya mau ke bandara', '我想去机场', 'Wo xiang qu jichang', 'arah'],
    ['Saya tidak mengerti', '我听不懂', 'Wo ting bu dong', 'darurat'],
    ['Bisa bicara bahasa Inggris?', '你会说英语吗？', 'Ni hui shuo Yingyu ma?', 'darurat'],
    ['Tolong, saya butuh bantuan', '请帮帮我', 'Qing bangbang wo', 'darurat'],
    ['Saya tidak makan daging babi', '我不吃猪肉', 'Wo bu chi zhurou', 'makan'],
    ['Di mana stasiun terdekat?', '最近的地铁站在哪儿？', 'Zuijin de ditie zhan zai nar?', 'arah'],
  ] },
  { kode: 'ja', nama: 'Jepang', frasa: [
    ['Halo / Selamat pagi', 'こんにちは / おはようございます', 'Konnichiwa / Ohayou gozaimasu', 'sapa'],
    ['Terima kasih', 'ありがとうございます', 'Arigatou gozaimasu', 'sapa'],
    ['Tolong', 'お願いします', 'Onegaishimasu', 'sapa'],
    ['Permisi / Maaf', 'すみません', 'Sumimasen', 'sapa'],
    ['Berapa harganya?', 'これはいくらですか？', 'Kore wa ikura desu ka?', 'belanja'],
    ['Di mana toilet?', 'トイレはどこですか？', 'Toire wa doko desu ka?', 'arah'],
    ['Saya mau ke bandara', '空港に行きたいです', 'Kuukou ni ikitai desu', 'arah'],
    ['Saya tidak mengerti', 'わかりません', 'Wakarimasen', 'darurat'],
    ['Bisa bicara bahasa Inggris?', '英語を話せますか？', 'Eigo wo hanasemasu ka?', 'darurat'],
    ['Tolong, saya butuh bantuan', '助けてください', 'Tasukete kudasai', 'darurat'],
    ['Saya tidak makan daging babi', '豚肉は食べません', 'Butaniku wa tabemasen', 'makan'],
    ['Di mana stasiun terdekat?', '一番近い駅はどこですか？', 'Ichiban chikai eki wa doko desu ka?', 'arah'],
  ] },
  { kode: 'ko', nama: 'Korea', frasa: [
    ['Halo / Selamat pagi', '안녕하세요', 'Annyeonghaseyo', 'sapa'],
    ['Terima kasih', '감사합니다', 'Gamsahamnida', 'sapa'],
    ['Tolong', '부탁합니다', 'Butakhamnida', 'sapa'],
    ['Permisi / Maaf', '죄송합니다 / 실례합니다', 'Joesonghamnida / Sillyehamnida', 'sapa'],
    ['Berapa harganya?', '이거 얼마예요?', 'Igeo eolmayeyo?', 'belanja'],
    ['Di mana toilet?', '화장실이 어디예요?', 'Hwjangshiri eodiyeyo?', 'arah'],
    ['Saya mau ke bandara', '공항에 가고 싶어요', 'Gonghange gago shipeoyo', 'arah'],
    ['Saya tidak mengerti', '이해가 안 돼요', 'Ihaega an dwaeyo', 'darurat'],
    ['Bisa bicara bahasa Inggris?', '영어를 할 수 있어요?', 'Yeongeoreul hal su isseoyo?', 'darurat'],
    ['Tolong, saya butuh bantuan', '도와주세요', 'Dowajuseyo', 'darurat'],
    ['Saya tidak makan daging babi', '돼지고기를 안 먹어요', 'Dwaejigogireul an meogeoyo', 'makan'],
    ['Di mana stasiun terdekat?', '가장 가까운 역이 어디예요?', 'Gajang gakkaun yeogi eodiyeyo?', 'arah'],
  ] },
  { kode: 'th', nama: 'Thailand', frasa: [
    ['Halo / Selamat pagi', 'สวัสดีครับ/ค่ะ', 'Sawatdi khrap/kha', 'sapa'],
    ['Terima kasih', 'ขอบคุณครับ/ค่ะ', 'Khop khun khrap/kha', 'sapa'],
    ['Tolong', 'กรุณา', 'Karuna', 'sapa'],
    ['Permisi / Maaf', 'ขอโทษครับ/ค่ะ', 'Kho thot khrap/kha', 'sapa'],
    ['Berapa harganya?', 'อันนี้เท่าไหร่ครับ?', 'An ni thao rai khrap?', 'belanja'],
    ['Di mana toilet?', 'ห้องน้ำอยู่ที่ไหนครับ?', 'Hong nam yu thi nai khrap?', 'arah'],
    ['Saya mau ke bandara', 'ผมอยากไปสนามบิน', 'Phom yak pai sanam bin', 'arah'],
    ['Saya tidak mengerti', 'ผมไม่เข้าใจ', 'Phom mai khao jai', 'darurat'],
    ['Bisa bicara bahasa Inggris?', 'คุณพูดภาษาอังกฤษได้ไหม?', 'Khun phut phasa Angkrit dai mai?', 'darurat'],
    ['Tolong, saya butuh bantuan', 'ช่วยผมด้วย', 'Chuai phom duai', 'darurat'],
    ['Saya tidak makan daging babi', 'ผมไม่กินเนื้อหมู', 'Phom mai kin nuea mu', 'makan'],
    ['Di mana stasiun terdekat?', 'สถานีที่ใกล้ที่สุดอยู่ที่ไหน?', 'Sathani thi klai thisut yu thi nai?', 'arah'],
  ] },
  { kode: 'ar', nama: 'Arab', frasa: [
    ['Halo / Selamat pagi', 'مرحبا / صباح الخير', 'Marhaban / Sabah al-khair', 'sapa'],
    ['Terima kasih', 'شكرا', 'Shukran', 'sapa'],
    ['Tolong', 'من فضلك', 'Min fadlik', 'sapa'],
    ['Permisi / Maaf', 'عفوا / آسف', 'Afwan / Asif', 'sapa'],
    ['Berapa harganya?', 'كم سعر هذا؟', "Kam si'ru hadha?", 'belanja'],
    ['Di mana toilet?', 'أين الحمام؟', 'Ayna al-hammam?', 'arah'],
    ['Saya mau ke bandara', 'أريد الذهاب إلى المطار', 'Uridu adh-dhahab ila al-matar', 'arah'],
    ['Saya tidak mengerti', 'لا أفهم', 'La afham', 'darurat'],
    ['Bisa bicara bahasa Inggris?', 'هل تتحدث الإنجليزية؟', 'Hal tatahaddath al-Injliziyya?', 'darurat'],
    ['Tolong, saya butuh bantuan', 'ساعدني من فضلك', "Sa'idni min fadlik", 'darurat'],
    ['Saya tidak makan daging babi', 'أنا لا آكل لحم الخنزير', 'Ana la akulu lahma al-khinzir', 'makan'],
    ['Di mana stasiun terdekat?', 'أين أقرب محطة؟', 'Ayna aqrab mahatta?', 'arah'],
  ] },
  { kode: 'es', nama: 'Spanyol', frasa: [
    ['Halo / Selamat pagi', 'Hola / Buenos días', 'Ola / Buenos dias', 'sapa'],
    ['Terima kasih', 'Gracias', 'Grasias', 'sapa'],
    ['Tolong', 'Por favor', 'Por fabor', 'sapa'],
    ['Permisi / Maaf', 'Disculpe / Perdón', 'Diskulpe / Perdon', 'sapa'],
    ['Berapa harganya?', '¿Cuánto cuesta esto?', 'Kwanto kwesta esto?', 'belanja'],
    ['Di mana toilet?', '¿Dónde está el baño?', 'Donde esta el banyo?', 'arah'],
    ['Saya mau ke bandara', 'Quiero ir al aeropuerto', 'Kiero ir al aeropwerto', 'arah'],
    ['Saya tidak mengerti', 'No entiendo', 'No entiendo', 'darurat'],
    ['Bisa bicara bahasa Inggris?', '¿Habla inglés?', 'Abla ingles?', 'darurat'],
    ['Tolong, saya butuh bantuan', 'Ayúdeme, por favor', 'Ayudeme, por fabor', 'darurat'],
    ['Saya tidak makan daging babi', 'No como cerdo', 'No komo serdo', 'makan'],
    ['Di mana stasiun terdekat?', '¿Dónde está la estación más cercana?', 'Donde esta la estasion mas serkana?', 'arah'],
  ] },
];
export function cariFrasa(bahasaKode, kategori, kataKunci) {
  const b = BAHASA.find((x) => x.kode === bahasaKode) || BAHASA[0];
  const q = String(kataKunci || '').trim().toLowerCase();
  return b.frasa.filter((f) => {
    if (kategori && kategori !== 'semua' && f[3] !== kategori) return false;
    if (!q) return true;
    return (f[0] + ' ' + f[1] + ' ' + f[2]).toLowerCase().includes(q);
  });
}
utils.frasaTravel = { BAHASA, KATEGORI, cariFrasa };

export const meta = {"id": "frasa-penting-travel", "name": "Frasa Penting Travel", "cat": "travel", "icon": "💬", "desc": "Frasa penting buat jalan-jalan: 8 bahasa, lengkap dengan cara bacanya, tinggal ketuk untuk menyalin.", "keywords": "frasa travel,phrasebook,bahasa travel,frasa penting,liburan luar negeri,bahasa asing", "since": "6.19.0"};
export function render(root) {
  const bahasaSel = T.select(BAHASA.map((b) => [b.kode, b.nama]), 'en');
  const katSel = T.select(KATEGORI, 'semua');
  const cariI = T.input('text', 'Cari frasa, cth: toilet', '');
  const daftarBox = T.el('<div></div>');

  const tampil = () => {
    const hasil = cariFrasa(bahasaSel.value, katSel.value, cariI.value);
    if (!hasil.length) {
      daftarBox.innerHTML = '<p class="mut" style="font-size:13px">Tidak ada frasa yang cocok. Coba kata kunci lain atau ganti kategori.</p>';
      return;
    }
    daftarBox.innerHTML = '';
    hasil.forEach((f) => {
      const kartu = T.el('<div style="border:1px solid rgba(127,127,127,.3);border-radius:12px;padding:12px;margin-bottom:8px"></div>');
      kartu.innerHTML = '<div style="font-size:15px;font-weight:600">' + T.esc(f[1]) + '</div>' +
        '<div class="mut" style="font-size:13px;margin-top:2px">Cara baca: ' + T.esc(f[2]) + '</div>' +
        '<div style="font-size:13px;margin-top:4px">' + T.esc(f[0]) + '</div>';
      const salin = T.copyBtn(() => f[1] + ' (' + f[2] + ')', 'Salin');
      salin.style.marginTop = '8px';
      kartu.appendChild(salin);
      daftarBox.appendChild(kartu);
    });
  };
  [bahasaSel, katSel, cariI].forEach((i) => i.addEventListener('input', tampil));
  [bahasaSel, katSel].forEach((i) => i.addEventListener('change', tampil));

  root.appendChild(T.el('<p class="note">Frasa yang paling sering dipakai saat jalan-jalan. Pilih bahasa tujuan, lalu ketuk "Salin" untuk memakai frasanya.</p>'));
  root.appendChild(T.grid2(T.field('Bahasa tujuan', bahasaSel), T.field('Kategori', katSel)));
  root.appendChild(T.field('Cari', cariI));
  root.appendChild(daftarBox);
  root.appendChild(T.el('<p class="hint">Untuk bahasa Thailand dan Arab, kata ganti "saya" di frasa memakai bentuk laki-laki (khrap / phom). Perempuan Thailand memakai "kha" dan "chan" sebagai gantinya.</p>'));
  tampil();
}
