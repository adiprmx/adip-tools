import { h as T, kv, rp, num, fmt } from '../../core.js?v=6.7.0';

export const meta = {"id": "biaya-bbm", "name": "Biaya BBM", "cat": "sehari", "icon": "⛽", "desc": "Estimasi biaya bensin untuk jarak tempuhmu.", "keywords": "bbm,bensin,biaya perjalanan,pertalite,pertamax,harga bensin,konsumsi"};

export function render(root) {

    const K = 'adip.bbm.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
    const saved = load();

    const PRESET = [['10000', 'Pertalite — Rp10.000'], ['12400', 'Pertamax — Rp12.400'], ['14400', 'Pertamax Turbo — Rp14.400'], ['14550', 'Dexlite — Rp14.550'], ['custom', 'Custom — ketik sendiri']];
    const jarakI = T.input('text', 'cth: 120', saved.jarak || '');
    const konI = T.input('text', 'cth: 45 (km/liter)', saved.kon || '');
    const sel = T.select(PRESET, saved.preset || '10000');
    const hargaI = T.input('text', 'Rp / liter', saved.harga || '10000');
    const box = T.out();

    const syncHarga = () => {
      if (sel.value !== 'custom') hargaI.value = sel.value;
    };
    sel.addEventListener('change', syncHarga);
    syncHarga();

    const calc = () => {
      const jarak = num(jarakI.value), kon = num(konI.value), harga = num(hargaI.value);
      if (![jarak, kon, harga].every(isFinite) || jarak <= 0 || kon <= 0 || harga <= 0) {
        T.toast('Isi jarak, konsumsi, dan harga/liter dengan angka yang bener'); return;
      }
      try { localStorage.setItem(K, JSON.stringify({ jarak: jarakI.value, kon: konI.value, harga: hargaI.value, preset: sel.value })); } catch (e) {}
      const liter = jarak / kon;
      const biaya = liter * harga;
      const pp = biaya * 2;
      T.show(box,
        '<div class="big center">' + rp(biaya) + '</div>' +
        '<p class="center">biaya bensin untuk ' + fmt(Math.round(jarak * 100) / 100) + ' km</p>' +
        kv('Estimasi bensin terpakai', fmt(Math.round(liter * 100) / 100) + ' liter') +
        kv('Harga per liter', rp(harga)) +
        kv('Konsumsi kendaraan', fmt(Math.round(kon * 10) / 10) + ' km/liter') +
        kv('Pulang-pergi (2× jarak)', rp(pp)) +
        '<p class="hint">Harga kira-kira per Oktober 2026 — bisa berubah, sesuaikan sama harga di SPBU yang kamu datengin ya.</p>');
    };

    root.appendChild(T.el('<p class="note">Mau jalan jauh? <b>Hitung dulu bensinnya</b> biar dompet nggak kaget di tengah jalan.</p>'));
    root.appendChild(T.field('Jarak tempuh (km)', jarakI, 'Satu arah. Cek Google Maps buat angka pastinya.'));
    root.appendChild(T.field('Konsumsi kendaraan (km/liter)', konI, 'cth: motor bebek ~45, matic ~40, mobil ~12.'));
    root.appendChild(T.field('Jenis BBM', sel, 'Pilih preset atau "Custom" buat isi sendiri.'));
    root.appendChild(T.field('Harga per liter (Rp)', hargaI));
    root.appendChild(T.row(T.btn('Hitung Biaya', calc, true)));
    root.appendChild(box);
}
