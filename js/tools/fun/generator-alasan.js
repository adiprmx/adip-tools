import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id": "generator-alasan", "name": "Generator Alasan", "cat": "fun", "icon": "🫣", "desc": "Stok alasan mangkir yang anti mainstream.", "keywords": "alasan,mangkir,izin,lucu,kerja,sekolah,kondangan,bacot"};
export function render(root) {

    const BANK = {
      kerja: [
        'Maaf Pak, motor saya mogok di tengah jalan. Yang mogok sih bukan mesinnya — niat saya yang berangkat.',
        'Izin telat Pak, tadi niat berangkat jam 7… tapi kasur saya nggak ngelepasin.',
        'Maaf Pak, hari ini saya sakit. Sakitnya sih bukan di badan, tapi sakit hati lihat tumpukan kerjaan.',
        'Izin WFH hari ini Pak, soalnya jarak kantor ke kasur saya kejauhan.',
        'Maaf Pak, alarm saya bunyi kok tadi. Yang nggak bunyi itu kesadaran saya.',
        'Izin Pak, dompet saya kosong dan itu sangat mempengaruhi mental kerja saya.',
        'Maaf Pak, saya lagi ada rapat penting… dengan diri sendiri, bahas masa depan.',
        'Pak, laptop saya update Windows dari jam 8 pagi. Sampai sekarang masih muter-muter, kayak hubungan kita.',
        'Izin Pak, wifi kosan mati dan hotspot HP saya ikut-ikutan demo.',
        'Maaf telat Pak, tadi di jalan ada kucing nyebrang. Saya tungguin dia mikir dulu mau ke mana.',
        'Pak, saya izin hari ini. Badan sih sehat, tapi semangat yang sakit.',
        'Maaf Pak, kunci motor ketinggalan di dalam rumah… dan rumahnya kekunci dari dalam.',
        'Izin Pak, menurut ramalan bintang saya hari ini jadwalnya rebahan.',
        'Maaf Pak, saya nggak bisa masuk. Semalam mimpi kerja lembur, jadi paginya berasa udah capek beneran.',
      ],
      sekolah: [
        'Bu, PR saya dimakan kucing. Beneran Bu, kucingnya sekarang lagi diet kertas.',
        'Pak, saya telat karena tadi nolongin nenek-nenek nyebrang… tiga kali. Dia nyebrangnya bolak-balik.',
        'Bu, saya nggak bawa buku. Tas saya kemarin kebawa mimpi.',
        'Pak, kemarin saya sakit. Sakitnya sih udah sembuh, tapi trauma sekolahnya belum.',
        'Bu, saya nggak bisa ulangan hari ini. Otak saya masih loading, sabar ya Bu.',
        'Pak, sepatu saya hilang sebelah. Yang sebelahnya lagi demo di rumah, nggak mau berangkat.',
        'Bu, saya izin ke toilet dari jam 9. Toiletnya sih deket, tapi perjalanan spiritualnya jauh.',
        'Pak, seragam saya belum kering. Jemurannya kalah telak sama mendung.',
        'Bu, saya lupa bawa tugas soalnya tadi pagi bangun kesiangan… dari mimpi yang bagus banget.',
        'Pak, saya nggak ikut upacara. Hormat saya udah habis dipakai buat orang tua di rumah.',
        'Bu, nilai saya jelek bukan karena nggak belajar. Soalnya… ya soalnya susah.',
        'Pak, saya telat 30 menit karena jam dinding rumah macet di jam 6 pagi. Dia juga mager.',
        'Bu, saya nggak bisa presentasi hari ini. Suara saya lagi cuti.',
        'Pak, saya izin pulang cepat. Kata ibu, ayam di rumah kangen.',
      ],
      kondangan: [
        'Maaf ya nggak bisa dateng, amplop saya masih kosong dan saya malu.',
        'Duh pengen banget dateng, tapi motor dipinjem adek. Buat apa? Nggak tau, pokoknya dipinjem.',
        'Maaf banget, jadwalnya pas tabrakan sama jadwal rebahan saya.',
        'Aduh, saya lagi di luar kota. Luar kotanya sih deket, tapi macetnya jauh.',
        'Maaf ya, anak saya rewel. Anaknya sih belum ada, tapi rewelnya udah kebayang.',
        'Duh, saya udah siap-siap, tapi hujan. Hujannya sih rintik, tapi magernya deres.',
        'Maaf nggak bisa hadir, lagi jaga warung. Warungnya tutup sih, tapi tetep harus dijagain.',
        'Aduh, pas banget saya lagi diet. Diet ketemu orang rame.',
        'Maaf ya, saya kena macet. Macetnya di kasur, susah bangun.',
        'Duh, pengen dateng tapi baju kondangan saya lagi dicuci… dari minggu lalu.',
        'Maaf banget, saya lagi ada acara keluarga. Keluarganya saya sendiri, acaranya tidur.',
        'Aduh, saya udah di jalan… jalan pikiran buat nyari alasan.',
        'Maaf ya nggak bisa, dompet saya lagi puasa.',
        'Duh, saya takut dateng terus ditanya "kapan nyusul?" sama tante-tante. Mental saya belum siap.',
      ],
    };
    const CATS = [['semua', '🎲 Semua'], ['kerja', '💼 Kerja'], ['sekolah', '🎒 Sekolah'], ['kondangan', '💒 Kondangan']];

    let cat = 'semua';
    try { cat = localStorage.getItem('genAlasan.cat') || 'semua'; } catch (e) { /* abaikan */ }
    if (!BANK[cat] && cat !== 'semua') cat = 'semua';

    const sel = T.select(CATS, cat);
    sel.addEventListener('change', () => {
      cat = sel.value;
      try { localStorage.setItem('genAlasan.cat', cat); } catch (e) { /* abaikan */ }
    });

    const box = T.out();
    let terakhir = -1, terakhirCat = '';
    const pool = () => (cat === 'semua' ? CATS.slice(1).flatMap(([v]) => BANK[v]) : BANK[cat]);

    const acak = () => {
      const arr = pool();
      let i;
      do { i = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && i === terakhir && cat === terakhirCat);
      terakhir = i; terakhirCat = cat;
      T.beep(520, 0.08, 'triangle');
      T.show(box, '<p class="big center" style="font-size:19px;line-height:1.6">“' + T.esc(arr[i]) + '”</p>');
    };

    root.appendChild(T.field('Kategori', sel));
    root.appendChild(T.btn('🫣 Acak Alasan', acak, true));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => {
      const p = box.querySelector('p');
      return p ? p.textContent : '';
    }, '📋 Salin Alasan')));
    root.appendChild(T.el('<p class="hint">Dipakai buat becandaan aja ya. Kalau beneran dipake dan ketahuan, itu risiko kamu sendiri 😌</p>'));

}
