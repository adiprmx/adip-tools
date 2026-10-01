import { h as T, utils, kv } from '../../core.js?v=6.7.0';

export const meta = {"id": "anggaran-lebaran", "name": "Anggaran Lebaran", "cat": "indonesia", "icon": "🕌", "desc": "Rencana biaya mudik: transport, THR, parcel, zakat — plus tips hemat.", "keywords": "lebaran,idul fitri,mudik,thr,zakat fitrah,parcel,anggaran"};

const LS_KEY = 'anggaran-lebaran-v1';

const TIPS = [
  'Beli tiket pulang SECEPATNYA — harga kereta & pesawat melesat tiap minggu mendekati hari H.',
  'Kereta api biasanya paling masuk akal buat keluarga: nyaman, anti macet, harga relatif stabil.',
  'THR kasih ke yang wajib dulu (orang tua, adik), sisanya boleh secukupnya — jangan gengsi.',
  'Parcel mending bikin sendiri daripada beli jadi — isi sama, harga bisa beda jauh.',
  'Zakat fitrah bayar lebih awal lewat amil biar tercatat rapi, nggak ribet pas malam takbiran.',
  'Sisakan dana darurat 10–15% dari total — perjalanan mudik selalu ada biaya tak terduga.',
  'Kalau naik mobil pribadi, servis + ganti oli H-7 biar nggak kena biaya bengkel darurat di tol.'
];

export function render(root) {

    const modeSel = T.select([
      ['bus', '🚌 Bus'], ['kereta', '🚂 Kereta Api'], ['pesawat', '✈️ Pesawat'],
      ['kapal', '⛴️ Kapal Laut'], ['mobil', '🚗 Mobil Pribadi']
    ], 'kereta');
    const transportI = T.input('text', 'Estimasi biaya transport (Rp)', '');
    const thrI = T.input('text', 'Anggaran THR (Rp)', '');
    const parcelI = T.input('text', 'Anggaran parcel/hampers (Rp)', '');
    const zakatI = T.input('text', 'Zakat fitrah (Rp)', '');
    const box = T.out();
    const tipsBox = T.out();

    const vals = () => ({
      moda: modeSel.value,
      transport: T.num(transportI.value) || 0,
      thr: T.num(thrI.value) || 0,
      parcel: T.num(parcelI.value) || 0,
      zakat: T.num(zakatI.value) || 0
    });
    const save = () => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(vals())); } catch (e) { /* abaikan */ }
    };
    const load = () => {
      try {
        const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
        if (!s) return;
        modeSel.value = s.moda || 'kereta';
        transportI.value = s.transport || '';
        thrI.value = s.thr || '';
        parcelI.value = s.parcel || '';
        zakatI.value = s.zakat || '';
      } catch (e) { /* abaikan */ }
    };

    const hitung = () => {
      const v = vals();
      const total = v.transport + v.thr + v.parcel + v.zakat;
      const pick = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
      const picked = pick(TIPS, 4);
      T.show(box,
        kv('Moda mudik', T.esc(modeSel.options[modeSel.selectedIndex].text)) +
        kv('Transport', T.rp(v.transport)) +
        kv('THR', T.rp(v.thr)) +
        kv('Parcel', T.rp(v.parcel)) +
        kv('Zakat fitrah', T.rp(v.zakat)) +
        '<div class="kv total"><span class="k"><b>Total anggaran</b></span><span class="v"><b>' + T.rp(total) + '</b></span></div>');
      T.show(tipsBox,
        '<p class="note"><b>💡 Tips hemat ala lebaran:</b></p>' +
        '<ul style="padding-left:18px;line-height:1.7">' +
        picked.map((t) => '<li>' + T.esc(t) + '</li>').join('') +
        '</ul>');
      save();
    };

    [modeSel].forEach((el) => el.addEventListener('change', hitung));
    [transportI, thrI, parcelI, zakatI].forEach((el) => el.addEventListener('input', hitung));

    load();

    root.appendChild(T.el('<p class="note">Lebaran tinggal berapa hari lagi — ayo dihitung dari sekarang biar dompet nggak kaget pas mudik. Data tersimpan otomatis di HP kamu.</p>'));
    root.appendChild(T.field('Moda transport mudik', modeSel));
    root.appendChild(T.field('Estimasi biaya transport (Rp)', transportI));
    root.appendChild(T.field('Anggaran THR (Rp)', thrI));
    root.appendChild(T.field('Anggaran parcel/hampers (Rp)', parcelI));
    root.appendChild(T.field('Zakat fitrah (Rp)', zakatI));
    root.appendChild(T.row(T.btn('Hitung anggaran', hitung, true)));
    root.appendChild(box);
    root.appendChild(tipsBox);
    hitung();

}
