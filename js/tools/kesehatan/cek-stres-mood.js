import { h as T, kv, errBox } from '../../core.js';

// Skrining stres dan mood dengan dua kuesioner yang umum dipakai di layanan
// kesehatan: PHQ-9 (9 pertanyaan soal mood, Kroenke, Spitzer dan Williams,
// Journal of General Internal Medicine 2001) dan GAD-7 (7 pertanyaan soal
// cemas, Spitzer dkk., Archives of Internal Medicine 2006). Pertanyaan di
// bawah ini ditulis ulang dengan bahasa sehari-hari dari isi aslinya, bukan
// terjemahan resmi. Tiap jawaban 0-3. Batas skor mengikuti publikasi aslinya:
// PHQ-9 5/10/15/20, GAD-7 5/10/15.
export const PHQ9 = [
  'Kurang semangat atau kurang tertarik melakukan sesuatu',
  'Merasa sedih, murung, atau putus asa',
  'Sulit tidur, atau malah tidur terlalu banyak',
  'Merasa lelah atau kurang bertenaga',
  'Nafsu makan berkurang, atau malah makan berlebihan',
  'Merasa buruk tentang diri sendiri, merasa gagal atau mengecewakan orang lain',
  'Sulit fokus, misalnya saat membaca atau menonton',
  'Gerak atau bicara jadi jauh lebih lambat, atau malah gelisah dan tidak bisa diam',
  'Terpikir ingin menyakiti diri sendiri, atau merasa lebih baik mati saja',
];
export const GAD7 = [
  'Merasa gugup, cemas, atau tegang',
  'Tidak bisa berhenti atau mengendalikan rasa khawatir',
  'Terlalu mengkhawatirkan banyak hal',
  'Sulit untuk santai',
  'Gelisah sampai sulit duduk diam',
  'Mudah kesal atau mudah marah',
  'Merasa takut seolah sesuatu yang buruk akan terjadi',
];
export const PILIHAN = ['Tidak sama sekali', 'Beberapa hari', 'Lebih dari separuh hari', 'Hampir setiap hari'];

export function skorKuesioner(jawaban) {
  if (!Array.isArray(jawaban)) return null;
  let total = 0;
  for (const j of jawaban) {
    if (j == null || j < 0 || j > 3) return null;
    total += j;
  }
  return total;
}

export function tingkatPhq9(skor) {
  if (skor <= 4) return { label: 'Gejala minimal', arti: 'Keluhan soal mood-mu saat ini ringan. Tetap jaga tidur, gerak, dan waktu istirahat.' };
  if (skor <= 9) return { label: 'Ringan', arti: 'Ada keluhan mood yang ringan. Coba perhatikan apa pemicunya, dan cerita ke orang yang kamu percaya.' };
  if (skor <= 14) return { label: 'Sedang', arti: 'Keluhan mood-mu cukup terasa. Ada baiknya cerita ke tenaga kesehatan, misalnya dokter di puskesmas.' };
  if (skor <= 19) return { label: 'Cukup berat', arti: 'Keluhan mood-mu sudah mengganggu. Sebaiknya segera konsultasi ke psikolog atau psikiater.' };
  return { label: 'Berat', arti: 'Keluhan mood-mu berat. Segera konsultasi ke psikolog atau psikiater, jangan ditunda.' };
}

export function tingkatGad7(skor) {
  if (skor <= 4) return { label: 'Gejala minimal', arti: 'Rasa cemasmu saat ini ringan.' };
  if (skor <= 9) return { label: 'Ringan', arti: 'Ada rasa cemas yang ringan. Coba latihan napas dan kurangi pemicu yang bisa dihindari.' };
  if (skor <= 14) return { label: 'Sedang', arti: 'Rasa cemasmu cukup terasa. Ada baiknya cerita ke tenaga kesehatan.' };
  return { label: 'Berat', arti: 'Rasa cemasmu berat. Sebaiknya segera konsultasi ke psikolog atau psikiater.' };
}

export const meta = { "id": "cek-stres-mood", "name": "Cek Stres & Mood", "cat": "kesehatan", "icon": "🧠", "desc": "Skrining awal stres dan mood dengan kuesioner PHQ-9 dan GAD-7. Bukan diagnosis.", "keywords": "stres,mood,cek stres,phq-9,gad-7,kecemasan,depresi,skrining,mental", "since": "6.18.0" };

function blokPertanyaan(judul, items, jawaban) {
  const wrap = T.el('<div style="margin-bottom:16px"></div>');
  wrap.appendChild(T.el('<p style="font-weight:700;margin:0 0 4px">' + T.esc(judul) + '</p>'));
  wrap.appendChild(T.el('<p class="hint" style="margin:0 0 10px">Dalam 2 minggu terakhir, seberapa sering kamu merasa seperti ini?</p>'));
  items.forEach((teks, i) => {
    const q = T.el('<div style="margin-bottom:12px"></div>');
    q.appendChild(T.el('<div style="font-size:14px;margin-bottom:6px">' + (i + 1) + '. ' + T.esc(teks) + '</div>'));
    const opts = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px"></div>');
    PILIHAN.forEach((label, v) => {
      const lab = document.createElement('label');
      lab.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-size:13px;padding:6px 10px;border:1px solid var(--line);border-radius:99px;cursor:pointer';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = judul + '-' + i;
      radio.value = String(v);
      radio.addEventListener('change', () => { jawaban[i] = v; });
      lab.appendChild(radio);
      lab.appendChild(document.createTextNode(label));
      opts.appendChild(lab);
    });
    q.appendChild(opts);
    wrap.appendChild(q);
  });
  return wrap;
}

export function render(root) {
  const jawabPhq = new Array(9).fill(null);
  const jawabGad = new Array(7).fill(null);
  const box = T.out();

  root.appendChild(T.el(
    '<div class="card" style="margin-bottom:14px"><p style="font-weight:700;margin:0 0 6px">Ini bukan diagnosis</p>' +
    '<p class="hint" style="margin:0">Hasil di sini hanya gambaran awal, bukan vonis. Hanya tenaga kesehatan yang bisa menilai kondisimu setelah bertemu langsung. ' +
    'Jawabanmu tidak dikirim ke mana-mana, semuanya dihitung di perangkatmu.</p></div>'
  ));
  root.appendChild(blokPertanyaan('Bagian 1: Mood (PHQ-9)', PHQ9, jawabPhq));
  root.appendChild(blokPertanyaan('Bagian 2: Cemas (GAD-7)', GAD7, jawabGad));

  const hitung = () => {
    const belumPhq = jawabPhq.filter((j) => j == null).length;
    const belumGad = jawabGad.filter((j) => j == null).length;
    if (belumPhq + belumGad > 0) {
      T.show(box, errBox('Masih ada ' + (belumPhq + belumGad) + ' pertanyaan yang belum dijawab. Jawab semuanya dulu ya.'));
      return;
    }
    const sPhq = skorKuesioner(jawabPhq);
    const sGad = skorKuesioner(jawabGad);
    const tPhq = tingkatPhq9(sPhq);
    const tGad = tingkatGad7(sGad);
    let krisis = '';
    if (jawabPhq[8] > 0) {
      krisis = '<div class="card" style="margin:12px 0;border-color:var(--err)"><p style="font-weight:700;margin:0 0 6px">Kamu tidak sendiri</p>' +
        '<p class="hint" style="margin:0">Kamu menjawab pernah terpikir menyakiti diri sendiri. Bila pikiran itu terasa kuat atau kamu merasa tidak aman sekarang, ' +
        'segera hubungi layanan Sejiwa Kemenkes di <b>119 ext 8</b> (gratis, 24 jam), atau pergi ke IGD terdekat dan minta ditemani orang yang kamu percaya.</p></div>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Skor mood (PHQ-9)</div>' +
      '<div class="big">' + sPhq + ' dari 27</div>' +
      '<div class="dim">' + T.esc(tPhq.label) + '</div></div>' +
      kv('Mood', tPhq.label + ' (' + sPhq + '/27)') +
      kv('Cemas', tGad.label + ' (' + sGad + '/21)') +
      '<p class="hint">' + T.esc(tPhq.arti) + '</p>' +
      '<p class="hint">' + T.esc(tGad.arti) + '</p>' +
      krisis +
      '<p class="hint">Sumber skala: PHQ-9 (Kroenke, Spitzer dan Williams, 2001) dan GAD-7 (Spitzer dkk., 2006). ' +
      'Pertanyaan di atas ditulis ulang dengan bahasa sehari-hari. Skor 10 ke atas pada salah satu skala biasanya dipakai sebagai batas untuk pemeriksaan lanjutan oleh tenaga kesehatan. ' +
      'Hasil ini bukan diagnosis dan tidak menggantikan konsultasi langsung.</p>');
  };

  root.appendChild(T.btn('Lihat hasil', hitung, true));
  root.appendChild(box);
}
