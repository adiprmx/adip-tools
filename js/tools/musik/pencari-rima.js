import { h as T } from '../../core.js?v=6.7.0';

export const meta = {"id":"pencari-rima","name":"Pencari Rima","cat":"musik","icon":"🎤","desc":"Cari kata yang berima buat nulis lirik lagu.","keywords":"rima,sajak,lirik,lagu,puisi,kata,berima,rap"};

/* Bank kata Indonesia umum (~180 kata) — dari kosa kata sehari-hari,
   lirik lagu, dan ungkapan emosional yang sering dipakai nulis lirik. */
const BANK = [
'cinta','luka','bahagia','dara','hati','mati','sepi','pasti','lagi','hari','nanti','janji','sunyi',
'rasa','gelora','cahaya','asrama','senja','manja','bisa','tiba','kita','bercerita','suka','duka',
'biru','merdu','rindu','semu','pilu','kamu','tertarik','lalu','kembali','menari','hancur','jujur',
'lembur','kabur','undur','campur','menang','sayang','terbang','gelap','senang','pulang','datang',
'berenang','kenang','padang','diam','tenggelam','seram','salam','malam','tentram','suram','dalam',
'alam','kelam','gelap','angin','diam-diam','hujan','langit','bukit','putih','jernih','bersih','perih',
'gelisah','kalah','pasrah','basah','marah','salah','lelah','melangkah','tabah','indah','mudah','tambah',
'berkah','pasrah','rumah','berduka','berlalu','purnama','bersama','nama','utama','lama','sama',
'kenapa','siapa','suka','dunia','fana','gembira','cerita','menyala','berjaya','gelora','bunda',
'bunga','sempurna','guna','bercanda','lupa','berjumpa','buka','terbuka','suka-duka','semua','dua',
'tua','merdeka','bahagia','selamanya','bersama','cinta','tulus','putus','lembut','hebat','lewat',
'tepat','cepat','berat','dekat','selamat','hangat','kuat','sarat','terikat','terdengar','benar',
'lama','terdampar','membara','menyelisik','waktu','merah','jenuh','penuh','jauh','sungguh','tumbuh',
'ribu','seribu','abu-abu','rindu','ungu','teman','pemenang','genggam','menantang','serangan',
'peluang','berjuang','bintang','terang','hilang','melayang','sayang','dendang','pandang','gundah',
'resah','lelah','melangkah','meriah','cerah','merah','kawah','bertabah','sabar','tegar','segar',
'berlari','berdiri','sendiri','menanti','mimpi','sepi','hati','menari','kembali','mati','berarti',
'pagi','lari','berbagi','melody','pahit','pelangi','diam','dingin','angin','ingin','kedinginan',
'gelap','lelap','tetap','harap','lenyap','bersinar','bubar','kabar','sabarmu','deras','ikhlas',
'terasa','terluka','membara','selamanya','cahaya','raya','gaya','bahaya','setia','tua','bahagia',
'birama','gema','irama','rindu','syair','air','lancar','pudar','sebar','melebar','takut','laut',
'raut','aut','terpaut','baut','sambut','lembut','ribut','terburu-buru','dulu','baru','biru',
'menyeru','waktu','palsu','tertuju','merayu','menunggu','perjuangan','kenangan','angan','rangan',
'bayangan','hilang','terang','sayang','menang','datang','pulang','senang','menantang','berenang'
];

/* Normalisasi: huruf kecil, tanpa tanda baca, satukan kata rangkap jadi satu entri unik. */
const WORDS = [...new Set(BANK.map((w) => String(w).toLowerCase().replace(/[^a-zàáâäéèêëíìîïóòôöúùûüçñ -]/g, '').trim()).filter((w) => w.length >= 3))];

/* Ambil pola rima: cari suku kata terakhir.
   Pendekatan sederhana: cari awalan konsonan terakhir sebelum vokal akhir.
   Mis. "cinta" -> "-inta", "bahagia" -> "-agia", "luka" -> "-uka". */
function rimePattern(word) {
  const w = String(word).toLowerCase();
  const v = 'aiueo';
  // cari onset konsonan terakhir (huruf non-vokal sebelum run vokal akhir)
  const m = w.match(/([^aiueo]+)?([aiueo][^aiueo]*)$/);
  if (!m) return null;
  const onset = m[1] || '';
  let vow = m[2] || '';
  // buang diftong akhir berulang (cth: "pandai" tetap "ai")
  return { full: '-' + onset + vow, loose: '-' + vow };
}

export function render(root) {
  const inI = T.input('text', 'cth: cinta', '');
  inI.autocapitalize = 'off';
  const btn = T.btn('Cari Rima', null, true);
  const box = T.out();
  const hintBox = T.out();

  let lastQuery = '';

  function cari() {
    const q = inI.value.trim().toLowerCase();
    if (q.length < 3) { T.show(box, '<p class="center mut">Ketik minimal 3 huruf dulu ya — misal <b>cinta</b>, <b>luka</b>, <b>senja</b>.</p>'); T.hide(hintBox); return; }
    lastQuery = q;
    const pat = rimePattern(q);
    if (!pat) { T.show(box, '<p class="center mut">Hmm, kata itu susah dicari polanya. Coba kata lain.</p>'); T.hide(hintBox); return; }

    const grupKetat = [], grupLonggar = [];
    for (const w of WORDS) {
      if (w === q) continue;
      const p = rimePattern(w);
      if (!p) continue;
      if (p.full === pat.full) grupKetat.push(w);
      else if (p.loose === pat.loose && !grupKetat.includes(w)) grupLonggar.push(w);
    }
    grupKetat.sort(); grupLonggar.sort();

    let html = '<p class="center">Rima buat <b>“' + T.esc(q) + '”</b> — pola <span class="mono"><b>' + T.esc(pat.full) + '</b></span></p>';

    const renderGrup = (label, arr, em) => {
      if (!arr.length) return '';
      const chips = arr.map((w) => '<span class="chip" data-w="' + T.esc(w) + '" style="cursor:pointer">' + T.esc(w) + '</span>').join('');
      return '<p class="mut" style="margin:10px 0 6px"><b>' + em + ' ' + label + '</b> (' + arr.length + ')</p><div style="display:flex;flex-wrap:wrap;gap:6px">' + chips + '</div>';
    };

    html += renderGrup('Rima pas', grupKetat, '🎯');
    html += renderGrup('Rima mirip', grupLonggar, '✨');

    if (!grupKetat.length && !grupLonggar.length) {
      html += '<p class="center mut" style="margin-top:12px">Belum ketemu yang cocok di bank kata. Coba kata lain — misal <b>hati</b>, <b>senja</b>, atau <b>bahagia</b>.</p>';
    } else {
      html += '<p class="hint center" style="margin-top:10px">Ketuk kata mana aja buat nyalin — tinggal tempel ke lirikmu.</p>';
    }

    T.show(box, html);
    T.show(hintBox, '<div class="kv"><span class="k">Bank kata</span><span class="v">' + WORDS.length + ' kata</span></div>');

    box.querySelectorAll('.chip').forEach((c) => {
      c.addEventListener('click', () => T.copy(c.dataset.w));
    });
  }

  btn.addEventListener('click', cari);
  inI.addEventListener('input', () => { if (inI.value.trim()) cari(); });
  inI.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Lagi nulis lirik terus mentok di akhir baris? Ketik satu kata, biar dicariin pasangan rimanya. Dari kata emosional kayak <b>cinta</b> dan <b>luka</b> sampai kata harian — dikelompokin dari yang paling pas sampai yang masih nyambung.</p>'));
  root.appendChild(T.field('Kata kunci', inI, 'Satu kata Bahasa Indonesia, misal: cinta, senja, pulang.'));
  root.appendChild(T.row(btn, T.copyBtn(() => lastQuery, 'Salin Kata')));
  root.appendChild(box);
  root.appendChild(hintBox);
}
