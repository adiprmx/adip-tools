import { h as T, kv, rp, num, todayISO } from '../../core.js?v=6.7.0';

export const meta = {"id": "simulasi-franchise", "name": "Simulasi Franchise", "cat": "bisnis", "icon": "🏪", "desc": "Hitung BEP franchise: biaya awal, royalti, omzet → balik modal berapa bulan?", "keywords": "franchise,waralaba,bep,balik modal,royalti,omzet,bisnis"};

export function render(root) {

    const K = 'adip.franchise.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
    const saved = load();

    const modalI = T.input('text', 'cth: 150000000', saved.modal || '');
    const royaltiI = T.input('text', 'cth: 5', saved.royalti || '');
    const omzetI = T.input('text', 'cth: 60000000', saved.omzet || '');
    const opI = T.input('text', 'cth: 25000000', saved.op || '');
    const box = T.out();

    const bulanID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const calc = () => {
      const modal = num(modalI.value), roy = num(royaltiI.value), omzet = num(omzetI.value), op = num(opI.value);
      if (![modal, roy, omzet, op].every(isFinite) || modal < 0 || roy < 0 || roy >= 100 || omzet <= 0 || op < 0) {
        T.toast('Isi semua kolom dengan angka yang masuk akal dulu'); return;
      }
      try { localStorage.setItem(K, JSON.stringify({ modal: modalI.value, royalti: royaltiI.value, omzet: omzetI.value, op: opI.value })); } catch (e) {}
      const bayarRoyalti = omzet * roy / 100;
      const laba = omzet - bayarRoyalti - op;
      const margin = omzet > 0 ? (laba / omzet * 100) : 0;
      let out = '<div class="big center">' + (laba > 0 ? Math.ceil(modal / laba) + ' <span class="mut" style="font-size:15px">bulan</span>' : '—') + '</div>';
      if (laba > 0) {
        const d = new Date();
        const target = new Date(d.getFullYear(), d.getMonth() + Math.ceil(modal / laba), 1);
        out += '<p class="center">estimasi balik modal — ' + bulanID[target.getMonth()] + ' ' + target.getFullYear() + '</p>';
      } else {
        out += '<p class="center">⚠️ laba bulanannya minus — dengan angka ini modalnya nggak bakal balik</p>';
      }
      T.show(box, out +
        kv('Biaya awal franchise', rp(modal)) +
        kv('Omzet per bulan', rp(omzet)) +
        kv('Royalti ' + roy + '% / bulan', rp(bayarRoyalti)) +
        kv('Biaya operasional / bulan', rp(op)) +
        kv('Laba bersih / bulan', rp(laba) + (laba < 0 ? ' (rugi)' : '')) +
        kv('Margin laba', margin.toFixed(1) + '%') +
        '<p class="hint">Asumsi: omzet stabil setiap bulan, royalti dihitung ' + roy + '% dari omzet, biaya operasional sudah mencakup sewa, gaji, listrik, dan bahan. Belum termasuk pajak & kenaikan biaya. Ini simulasi kasar buat gambaran, bukan ramalan.</p>' +
        (laba > 0 && modal / laba > 60 ? '<p class="hint">💡 BEP lebih dari 5 tahun — coba nego biaya awal yang lebih rendah atau pastikan estimasi omzetnya realistis.</p>' : ''));
    };

    root.appendChild(T.el('<p class="note">Lagi kepikiran buka franchise? Jangan cuma dengar brosur "balik modal 1 tahun" — <b>hitung sendiri</b> dari angka yang kamu perkirakan.</p>'));
    root.appendChild(T.field('Biaya awal franchise (Rp)', modalI, 'Franchise fee + renovasi + peralatan, total di awal.'));
    root.appendChild(T.field('Royalti per bulan (%)', royaltiI, 'Potongan dari omzet yang dibayar ke pusat.'));
    root.appendChild(T.field('Estimasi omzet per bulan (Rp)', omzetI, 'Perkiraan penjualan bulanan. Jujur aja, jangan terlalu optimis.'));
    root.appendChild(T.field('Biaya operasional per bulan (Rp)', opI, 'Sewa, gaji, listrik, bahan — di luar royalti.'));
    root.appendChild(T.row(T.btn('Simulasikan', calc, true)));
    root.appendChild(box);
}
