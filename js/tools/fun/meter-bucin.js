import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "meter-bucin", "name": "Meter Bucin", "cat": "fun", "icon": "💘", "desc": "Ukur level kebucinanmu lewat 8 pertanyaan jujur.", "keywords": "bucin,cinta,kuis,lucu,fun"};

export function render(root) {

    // tiap opsi: [teks, skor 1-4] — urutan skor diacak biar nggak ketebak
    const SOAL = [
      { q: 'Chat gebetan/doimu nggak dibales 3 jam. Kamu…',
        o: [
          ['Santai, lagi sibuk kali. Nanti juga dibales.', 1],
          ['Chat "kamu di mana?" sekali, terus nungguin.', 2],
          ['Buka profilnya, cek last seen, cek story, cek following.', 3],
          ['Overthinking total: dia bosen ya? salahku apa ya? 😭', 4],
        ] },
      { q: 'Dia bilang "lagi pengen sendiri dulu ya". Responmu…',
        o: [
          ['Oke, kabarin aja kalau udah oke.', 1],
          ['Nanya "kenapa?" sekali, terus kasih ruang.', 2],
          ['Tetep chat tiap jam biar dia tau kamu peduli.', 3],
          ['Nangis sambil dengerin lagu galau di kamar.', 4],
        ] },
      { q: 'Lihat dia foto bareng orang lain di story…',
        o: [
          ['Biasa aja, itu temennya kan?', 1],
          ['Agak kepo dikit, tapi nggak nanya.', 2],
          ['Langsung chat: "itu siapa??"', 3],
          ['Stalking akun orang itu sampai 47 postingan ke bawah.', 4],
        ] },
      { q: 'Ulang tahun dia masih 5 bulan lagi. Kamu…',
        o: [
          ['Nanti aja mikirnya, masih lama.', 1],
          ['Udah kepikiran mau kasih apa.', 2],
          ['Udah mulai nabung dari sekarang.', 3],
          ['Udah nyiapin surprise + video kompilasi + surat 3 halaman.', 4],
        ] },
      { q: 'Lagi nongkrong sama temen, dia nelpon. Kamu…',
        o: [
          ['Angkat bentar, bilang lagi sama temen.', 1],
          ['Angkat, ngobrol 10 menit, balik nongkrong.', 2],
          ['Izin pulang duluan ke temen.', 3],
          ['Temen langsung dilupain, dunia cuma dia.', 4],
        ] },
      { q: 'Dia upload foto baru. Kamu…',
        o: [
          ['Like, udah.', 1],
          ['Like + komen "cakep 😄".', 2],
          ['Like, komen, share ke story, save fotonya.', 3],
          ['Jadiin wallpaper HP + foto profil WA seminggu.', 4],
        ] },
      { q: 'Kalau lagi berantem sama dia…',
        o: [
          ['Diemin dulu, ngomong pas udah adem.', 1],
          ['Chat duluan minta maaf walau nggak salah-salah amat.', 2],
          ['Minta maaf berkali-kali sampai dia bales.', 3],
          ['Dateng ke rumahnya bawa martabak sambil nangis.', 4],
        ] },
      { q: 'Bayangin hidup tanpa dia…',
        o: [
          ['Ya sedih, tapi hidup jalan terus.', 1],
          ['Nggak mau bayangin, serem.', 2],
          ['Kayak HP tanpa baterai: nggak guna.', 3],
          ['DUNIA KIAMAT. TITIK.', 4],
        ] },
    ];

    const box = T.out();
    let idx = 0, total = 0;

    const progress = () => T.el('<div style="height:8px;border-radius:99px;background:#27272a;overflow:hidden;margin-bottom:16px"><div style="height:100%;width:' + (idx / SOAL.length * 100) + '%;background:#fff;border-radius:99px;transition:width .3s"></div></div>');

    const tampilSoal = () => {
      const s = SOAL[idx];
      T.show(box, '');
      box.appendChild(progress());
      box.appendChild(T.el('<p class="center mut">Pertanyaan ' + (idx + 1) + ' / ' + SOAL.length + '</p>'));
      box.appendChild(T.el('<p class="big center" style="font-size:17px;line-height:1.6">' + T.esc(s.q) + '</p>'));
      const wadah = T.el('<div style="display:grid;gap:10px;margin-top:14px"></div>');
      box.appendChild(wadah);
      s.o.forEach(([teks, skor]) => {
        const b = T.btn(teks, () => {
          total += skor;
          T.beep(600, 0.06, 'triangle');
          idx++;
          if (idx < SOAL.length) tampilSoal();
          else tampilHasil();
        });
        b.style.textAlign = 'left';
        wadah.appendChild(b);
      });
    };

    const tampilHasil = () => {
      const persen = Math.round(total / (SOAL.length * 4) * 100);
      let icon, nama, desc;
      if (persen <= 25) {
        icon = '🧊'; nama = 'Hati Baja Anti Baper';
        desc = 'Salut! Hatimu sekeras baja Konoha. Chat nggak dibales? Ya udah. Kamu sayang, tapi nggak sampai kehilangan akal sehat. Pertahankan, ini langka banget.';
      } else if (persen <= 50) {
        icon = '🌱'; nama = 'Bucin Santai';
        desc = 'Masih dalam batas wajar. Kamu peduli dan perhatian, tapi masih punya hidup sendiri. Bucinnya sehat, kayak sayur — bergizi dan nggak bikin kolesterol naik.';
      } else if (persen <= 75) {
        icon = '🔥'; nama = 'Bucin Stadium 4';
        desc = 'Waduh, udah stadium lanjut nih. Dunia serasa berhenti kalau dia nggak bales chat. Saran: inget-inget lagi hobi lamamu, temen-temenmu, dan harga dirimu yang dulu gagah itu.';
      } else {
        icon = '👑'; nama = 'Ketua Umum Bucin Indonesia';
        desc = 'RESMI. Kamu bukan cuma bucin — kamu panutan kaum bucin se-Indonesia. Foto dia jadi wallpaper, lagu galau jadi anthem, overthinking jadi hobi. Yang sabar ya, semoga dia sadar betapa beruntungnya dia.';
      }
      T.beep(523, 0.12); T.beep(659, 0.12, 'sine', 0.12); T.beep(784, 0.12, 'sine', 0.24); T.beep(1047, 0.3, 'sine', 0.36);
      T.show(box, '');
      box.appendChild(T.el('<p class="center mut">Skor kebucinanmu…</p>'));
      box.appendChild(T.el('<p class="big center" style="font-size:52px;line-height:1;margin:8px 0">' + persen + '<span style="font-size:24px">%</span></p>'));
      box.appendChild(T.el('<div class="big center" style="font-size:44px">' + icon + '</div>'));
      box.appendChild(T.el('<p class="big center" style="font-size:21px">' + T.esc(nama) + '</p>'));
      box.appendChild(T.el('<p class="center" style="line-height:1.7;max-width:420px;margin:0 auto">' + T.esc(desc) + '</p>'));
      box.appendChild(T.el('<p class="hint center" style="margin-top:14px">💘 Ini cuma hiburan receh, jangan baper. Kalau hasilnya bikin kamu mikir… ya bagus, berarti tesnya lumayan akurat 😌</p>'));
      const bar = T.el('<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;justify-content:center"></div>');
      bar.appendChild(T.btn('🔁 Ulangi Tes', () => { idx = 0; total = 0; tampilSoal(); }));
      bar.appendChild(T.copyBtn(() => 'Skor kebucinanku: ' + persen + '% — ' + icon + ' ' + nama + ' (tes di ADIP Tools)', '📋 Salin Hasil'));
      box.appendChild(bar);
    };

    root.appendChild(box);
    tampilSoal();

}
