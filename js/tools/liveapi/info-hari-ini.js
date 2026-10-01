import { h as T, utils, beep, actx, onLeave, kvRows, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "info-hari-ini", "name": "Info Hari Ini", "cat": "liveapi", "icon": "📅", "desc": "Info tanggal hari ini — 100% dihitung lokal di HP-mu.", "keywords": "tanggal,hari ini,kalender,hari ke,lokal,offline,pekan"};

export function render(root) {
    // Semua dihitung dari jam perangkat — tidak ada API, tidak ada klaim data luar.
    const now = new Date();
    const y = now.getFullYear();
    const awal = new Date(y, 0, 1);
    const akhir = new Date(y, 11, 31);
    const hari = 24 * 60 * 60 * 1000;
    const hariKe = Math.round((now - awal) / hari) + 1;
    const totalHari = Math.round((akhir - awal) / hari) + 1;
    const sisa = totalHari - hariKe;
    const kabisat = totalHari === 366;

    // Pekan ISO 8601 (Senin = hari pertama)
    const isoWeek = (dt) => {
      const d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day + 3);
      const th = new Date(d.getFullYear(), 0, 4);
      const tday = (th.getDay() + 6) % 7;
      th.setDate(th.getDate() - tday + 3);
      return 1 + Math.round((d - th) / (7 * hari));
    };

    const dow = now.getDay();
    const akhirPekan = dow === 0 || dow === 6;
    const tglLengkap = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    const namaHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(now);

    const out = T.out();
    T.show(out,
      kvRows([
        ['Tanggal lengkap', tglLengkap],
        ['Nama hari', namaHari],
        ['Hari ke', hariKe + ' dari ' + totalHari + (kabisat ? ' (tahun kabisat)' : '')],
        ['Sisa menuju akhir tahun', sisa + ' hari'],
        ['Pekan ke (ISO 8601)', String(isoWeek(now))],
        ['Status', akhirPekan ? '🎉 Akhir pekan' : '💼 Hari kerja'],
      ]) +
      '<div class="hint" style="margin-top:8px">Semua angka dihitung lokal dari jam HP-mu saat halaman dibuka — tanpa internet, tanpa server.</div>');
    root.appendChild(out);
}
