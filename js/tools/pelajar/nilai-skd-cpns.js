import { h as T, utils } from '../../core.js?v=6.12.1';

export const meta = {"id": "nilai-skd-cpns", "name": "Cek Nilai SKD CPNS", "cat": "pelajar", "icon": "🎯", "desc": "Masukkan soal benar TWK/TIU dan skor TKP, langsung ketahuan lolos passing grade atau tidak per subtes.", "keywords": "cpns,skd,passing grade,twk,tiu,tkp,sekolah kedinasan,seleksi"};

const MODE = {
  cpns: {
    label: 'CPNS (KepmenPANRB 321/2024)',
    pg: { twk: 65, tiu: 80, tkp: 166 },
    sumber: 'KepmenPANRB Nomor 321 Tahun 2024'
  },
  kedinasan: {
    label: 'Sekolah Kedinasan (KepmenPANRB 208/2025)',
    pg: { twk: 65, tiu: 85, tkp: 160 },
    sumber: 'KepmenPANRB Nomor 208 Tahun 2025'
  }
};

const MAKS = { twk: { soal: 30, nilai: 150 }, tiu: { soal: 35, nilai: 175 }, tkp: { nilai: 225 } };

export function render(root) {

    const modeI = T.select([['cpns', MODE.cpns.label], ['kedinasan', MODE.kedinasan.label]], 'cpns');
    const twkI = T.input('number', 'Soal benar TWK (0-30)', '');
    const tiuI = T.input('number', 'Soal benar TIU (0-35)', '');
    const tkpI = T.input('number', 'Skor TKP (0-225)', '');
    const skbI = T.input('number', 'Nilai SKB skala 100 (boleh kosong)', '');
    const pgTwk = T.input('number', 'Passing grade TWK', '65');
    const pgTiu = T.input('number', 'Passing grade TIU', '80');
    const pgTkp = T.input('number', 'Passing grade TKP', '166');
    const box = T.out();

    const fmt = (n) => {
      const r = Math.round(n * 100) / 100;
      return String(r).replace('.', ',');
    };

    const isiPg = () => {
      const pg = MODE[modeI.value].pg;
      pgTwk.value = pg.twk; pgTiu.value = pg.tiu; pgTkp.value = pg.tkp;
    };
    modeI.addEventListener('change', () => { isiPg(); hitung(); });

    const hitung = () => {
      const twkBenar = Math.max(0, Math.min(MAKS.twk.soal, T.num(twkI.value) || 0));
      const tiuBenar = Math.max(0, Math.min(MAKS.tiu.soal, T.num(tiuI.value) || 0));
      const tkpSkor = Math.max(0, Math.min(MAKS.tkp.nilai, T.num(tkpI.value) || 0));
      const twk = twkBenar * 5;
      const tiu = tiuBenar * 5;
      const pg = { twk: T.num(pgTwk.value) || 0, tiu: T.num(pgTiu.value) || 0, tkp: T.num(pgTkp.value) || 0 };
      const total = twk + tiu + tkpSkor;
      const skala100 = total / 550 * 100;
      const lolos = { twk: twk >= pg.twk, tiu: tiu >= pg.tiu, tkp: tkpSkor >= pg.tkp };
      const semuaLolos = lolos.twk && lolos.tiu && lolos.tkp;
      const adaInput = twkI.value !== '' || tiuI.value !== '' || tkpI.value !== '';

      const barisSub = (nama, nilai, maks, pgN, ok, ket) =>
        '<div style="display:flex;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:15px">' +
        '<span><b>' + nama + '</b><br/><span class="dim" style="font-size:13px">' + ket + ' · passing grade ' + pgN + '</span></span>' +
        '<span style="text-align:right;white-space:nowrap"><b>' + nilai + ' / ' + maks + '</b><br/>' +
        '<span style="color:' + (ok ? '#4ade80' : '#f87171') + ';font-weight:700">' + (ok ? '✓ LOLOS' : '✗ GAGAL') + '</span></span></div>';

      let h = '';
      if (!adaInput) {
        h = '<p class="dim">Isi jumlah soal benar dan skor TKP di atas untuk melihat hasilnya.</p>';
      } else {
        h += barisSub('TWK', twk, MAKS.twk.nilai, pg.twk, lolos.twk, twkBenar + ' soal benar × 5');
        h += barisSub('TIU', tiu, MAKS.tiu.nilai, pg.tiu, lolos.tiu, tiuBenar + ' soal benar × 5');
        h += barisSub('TKP', tkpSkor, MAKS.tkp.nilai, pg.tkp, lolos.tkp, 'skor langsung (tiap soal 1–5)');
        h += '<div style="display:flex;justify-content:space-between;gap:8px;padding:12px 0;font-size:16px">' +
          '<span><b>Total SKD</b><br/><span class="dim" style="font-size:13px">Skala 100: <b>' + fmt(skala100) + '</b></span></span>' +
          '<span style="text-align:right"><b>' + total + ' / 550</b></span></div>';
        h += '<div style="padding:12px;border-radius:10px;margin-top:4px;background:' + (semuaLolos ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.12)') + ';border:1px solid ' + (semuaLolos ? 'rgba(74,222,128,.4)' : 'rgba(248,113,113,.4)') + '">' +
          '<b style="font-size:16px">' + (semuaLolos ? '✅ Lolos SKD' : '❌ Tidak lolos SKD') + '</b><br/>' +
          '<span class="dim">' + (semuaLolos
            ? 'Ketiga subtes melewati passing grade. Lanjutkan ke tahap berikutnya.'
            : 'Gagal SATU subtes saja sudah berarti gagal total, walau total nilaimu tinggi.') + '</span></div>';
        const skb = T.num(skbI.value);
        if (skbI.value !== '' && skb >= 0 && skb <= 100) {
          const akhir = skala100 * 0.4 + skb * 0.6;
          h += '<p style="margin-top:12px">Nilai akhir (SKD 40% + SKB 60%): <b>' + fmt(akhir) + '</b> dari 100.</p>';
        }
      }
      h += '<p class="hint" style="margin-top:12px">Acuan: ' + MODE[modeI.value].sumber + '. ' +
        'Ambang batas bisa berubah tiap periode seleksi — cek pengumuman resmi dan ubah angka passing grade di bawah bila perlu.</p>';
      T.show(box, h);
    };

    [twkI, tiuI, tkpI, skbI, pgTwk, pgTiu, pgTkp].forEach((el) => el.addEventListener('input', hitung));

    root.appendChild(T.el('<p class="note">Hitung nilai Seleksi Kompetensi Dasar (SKD): TWK dan TIU dihitung dari soal benar (tiap soal benar = 5 poin), TKP dari skor langsung. <b>Perhatian: gagal satu subtes = gagal total.</b></p>'));
    root.appendChild(T.field('Mode seleksi', modeI));
    root.appendChild(T.grid2(T.field('Soal benar TWK', twkI, '30 soal, maks 150'), T.field('Soal benar TIU', tiuI, '35 soal, maks 175')));
    root.appendChild(T.field('Skor TKP', tkpI, '45 soal, tiap soal 1–5 poin, maks 225'));
    root.appendChild(T.field('Nilai SKB skala 100 (boleh kosong)', skbI, 'Diisi bila sudah ada nilai SKB, untuk hitung nilai akhir'));
    root.appendChild(box);
    root.appendChild(T.el('<details style="margin-top:14px"><summary style="cursor:pointer">Ubah passing grade manual</summary><div style="margin-top:10px"></div></details>'));
    const det = root.querySelector('details div');
    det.appendChild(T.grid2(T.field('Passing grade TWK', pgTwk), T.field('Passing grade TIU', pgTiu), T.field('Passing grade TKP', pgTkp)));
    hitung();

}
