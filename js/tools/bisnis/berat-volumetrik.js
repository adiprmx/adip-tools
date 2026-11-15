import { h as T, utils, kv } from '../../core.js?v=6.12.1';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

const LAYANAN = {
  'reguler': { label: 'Reguler darat (JNE REG, J&T, SiCepat, AnterAja, SPX)', bagi: 6000 },
  'trucking': { label: 'JNE Trucking', bagi: 5000 },
  'kargo': { label: 'Kargo', bagi: 4000 },
};

export const meta = {"id": "berat-volumetrik", "name": "Berat Volumetrik Paket", "cat": "bisnis", "icon": "📦", "desc": "Hitung berat volumetrik paket dan bandingkan dengan berat timbangan — yang lebih besar itulah yang ditagih kurir.", "keywords": "berat volumetrik,paket,ongkir,ekspedisi,jne,j&t,kargo,dimensi"};
export function render(root) {

    const pI = T.input('number', 'cth: 40', '');
    const lI = T.input('number', 'cth: 30', '');
    const tI = T.input('number', 'cth: 20', '');
    const beratI = T.input('text', 'cth: 1,5', '');
    const layI = T.select(Object.keys(LAYANAN).map((k) => [k, LAYANAN[k].label]), 'reguler');
    const bagiI = T.input('number', 'cth: 6000', '6000');
    const tarifI = T.input('text', 'cth: 10.000 (kosongkan bila tidak perlu)', '');
    const box = T.out();

    const isiBagi = () => { bagiI.value = String(LAYANAN[layI.value].bagi); };
    layI.addEventListener('change', isiBagi);

    // Pembulatan kurir: pecahan 0,30 ke bawah dibulatkan ke bawah, di atas itu ke atas.
    const bulatkan = (kg) => {
      const b = Math.floor(kg);
      const pecah = kg - b;
      return Math.max(1, pecah <= 0.30 + 1e-9 ? b : b + 1);
    };

    const calc = () => {
      const p = parseRp(pI.value), l = parseRp(lI.value), t = parseRp(tI.value);
      const aktual = parseRp(beratI.value);
      const bagi = parseRp(bagiI.value);
      const tarif = tarifI.value.trim() === '' ? NaN : parseRp(tarifI.value);
      if (![p, l, t].every((v) => isFinite(v) && v > 0) || !isFinite(aktual) || aktual <= 0 || !isFinite(bagi) || bagi <= 0 || (tarifI.value.trim() !== '' && (!isFinite(tarif) || tarif < 0))) {
        T.toast('Isi panjang, lebar, tinggi, dan berat dengan angka yang benar ya.'); return;
      }
      const volumetrik = (p * l * t) / bagi;
      const tagihMentah = Math.max(volumetrik, aktual);
      const tagih = bulatkan(tagihMentah);
      const yangDitagih = volumetrik >= aktual ? 'berat volumetrik' : 'berat timbangan';

      let ongkir = '';
      if (isFinite(tarif)) {
        ongkir = kv('Estimasi ongkir (' + T.rp(tarif) + '/kg × ' + tagih + ' kg)', T.rp(tagih * tarif));
      }

      T.show(box,
        '<div class="big center">' + tagih + ' kg</div>' +
        '<p class="center">berat yang ditagih kurir (' + yangDitagih + ')</p>' +
        kv('Berat volumetrik (P×L×T ÷ ' + T.fmt(bagi) + ')', volumetrik.toFixed(2).replace('.', ',') + ' kg') +
        kv('Berat timbangan', aktual.toString().replace('.', ',') + ' kg') +
        kv('Berat sebelum dibulatkan', tagihMentah.toFixed(2).replace('.', ',') + ' kg') +
        ongkir +
        '<p class="hint">Pembulatan: 1,30 kg jadi 1 kg, 1,31 kg jadi 2 kg. Paket ringan tapi besar ditagih volumetrik — itulah penyebab seller sering nombok ongkir. Pembagi di atas bisa diubah bila ekspedisimu memakai angka lain.</p>');
    };

    root.appendChild(T.el('<p class="note">Kurir menagih yang <b>lebih besar</b> antara berat timbangan dan berat volumetrik. Ukur dulu paketmu sebelum kirim, biar tidak nombok ongkir.</p>'));
    root.appendChild(T.grid2(
      T.field('Panjang (cm)', pI),
      T.field('Lebar (cm)', lI),
      T.field('Tinggi (cm)', tI)
    ));
    root.appendChild(T.field('Berat timbangan (kg)', beratI, 'Berat asli paket di timbangan. Boleh pakai koma, cth: 1,5.'));
    root.appendChild(T.field('Layanan ekspedisi', layI));
    root.appendChild(T.grid2(
      T.field('Pembagi volumetrik', bagiI, 'Otomatis sesuai layanan, bisa diubah.'),
      T.field('Tarif ongkir per kg (Rp, opsional)', tarifI, 'Isi bila mau estimasi ongkir.')
    ));
    root.appendChild(T.row(T.btn('Hitung Berat Tagih', calc, true)));
    root.appendChild(box);

}
