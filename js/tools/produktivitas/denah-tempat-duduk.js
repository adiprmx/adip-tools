import { h as T, utils, LOCAL_NOTE } from '../../core.js';

// Pembuat Denah Tempat Duduk: atur tamu atau murid ke kursi di meja
// bundar, meja panjang, atau meja kelas. Bisa acak dengan aturan pisah
// (dua nama yang tidak boleh semeja), lalu geser nama antar kursi dengan
// cara ketuk atau seret. Denah tersimpan di browser ini saja.
export const meta = {"id": "denah-tempat-duduk", "name": "Denah Tempat Duduk", "cat": "produktivitas", "icon": "🪑", "desc": "Atur tamu atau murid ke kursi meja dengan acak atau geser manual.", "keywords": "denah tempat duduk,seating chart,atur kursi,tamu,meja bundar", "since": "6.19.0"};

const LS_KUNCI = 'adipTools_denah-tempat-duduk';

export const JENIS_MEJA = [
  ['bundar', 'Meja bundar (8 kursi)'],
  ['panjang', 'Meja panjang (10 kursi)'],
  ['kelas', 'Meja kelas (6 kursi, 2 baris)'],
];

export const KURSI_PER_MEJA = { bundar: 8, panjang: 10, kelas: 6 };

// PRNG deterministik mulberry32. Murni, bisa diuji di Node.
// Memakai utils.mulberry32 (kanonis, G4 C1G4-R).
export const prngBenih = utils.mulberry32;

// Acak Fisher-Yates dengan PRNG yang diberikan. Murni.
export function acakArray(arr, acak) {
  const a = (arr || []).slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Urai aturan pisah: tiap baris "Nama A | Nama B" berarti keduanya tidak
// boleh semeja. Murni, bisa diuji di Node.
export function uraiAturanPisah(teks) {
  const aturan = [];
  String(teks || '').split('\n').forEach((baris) => {
    const potong = baris.split('|').map((s) => s.trim()).filter(Boolean);
    if (potong.length >= 2) aturan.push([potong[0], potong[1]]);
  });
  return aturan;
}

// Bagi tamu ke meja-meja dengan acak, berusaha memisahkan pasangan
// aturan pisah ke meja berbeda (tukar posisi sampai 50 percobaan).
// Mengembalikan {meja: [[nama|null]], sisa: [nama]}. Murni.
export function acakDenah(tamu, jumlahMeja, kursiPerMeja, aturan, benih) {
  const acak = prngBenih(benih == null ? 1 : benih);
  const daftar = acakArray(tamu.filter((t) => String(t || '').trim()), acak);
  const totalKursi = Math.max(1, jumlahMeja) * Math.max(1, kursiPerMeja);
  const meja = [];
  for (let m = 0; m < jumlahMeja; m++) meja.push(new Array(kursiPerMeja).fill(null));
  // Bagi rata ke semua meja (satu per meja bergiliran), bukan menumpuk
  // di meja pertama.
  let idx = 0;
  for (let k = 0; k < kursiPerMeja; k++) {
    for (let m = 0; m < jumlahMeja; m++) {
      if (idx < daftar.length && idx < totalKursi) meja[m][k] = daftar[idx++];
    }
  }
  const sisa = daftar.slice(totalKursi);
  const cariMeja = (nama) => {
    for (let m = 0; m < meja.length; m++) if (meja[m].includes(nama)) return m;
    return -1;
  };
  // Perbaiki pelanggaran aturan pisah dengan menukar kursi.
  for (let coba = 0; coba < 50; coba++) {
    let langgar = null;
    for (const [a, b] of aturan || []) {
      const ma = cariMeja(a), mb = cariMeja(b);
      if (ma >= 0 && ma === mb) { langgar = [a, b, ma]; break; }
    }
    if (!langgar) break;
    const [, namaB, mejaLanggar] = langgar;
    let ditukar = false;
    for (let m = 0; m < meja.length && !ditukar; m++) {
      if (m === mejaLanggar) continue;
      for (let k = 0; k < meja[m].length; k++) {
        const calon = meja[m][k];
        if (!calon) continue;
        const iB = meja[mejaLanggar].indexOf(namaB);
        meja[mejaLanggar][iB] = calon;
        meja[m][k] = namaB;
        ditukar = true;
        break;
      }
    }
    if (!ditukar) break;
  }
  return { meja, sisa };
}

// Hitung posisi kursi di sekeliling meja bundar (untuk gambar).
// Murni, bisa diuji di Node.
export function posisiKursiBundar(jumlah, cx, cy, radius) {
  const pos = [];
  for (let i = 0; i < jumlah; i++) {
    const sudut = (i / jumlah) * Math.PI * 2 - Math.PI / 2;
    pos.push({ x: cx + Math.cos(sudut) * radius, y: cy + Math.sin(sudut) * radius });
  }
  return pos;
}

export function render(root) {
  const tamuI = T.ta(6, 'Tulis satu nama per baris.\nContoh:\nAndi\nBudi\nCitra');
  const jenisSel = T.select(JENIS_MEJA, 'bundar');
  const jumlahMejaI = T.input('number', 'Jumlah meja, misal 4');
  jumlahMejaI.value = '4';
  jumlahMejaI.inputMode = 'numeric';
  jumlahMejaI.min = '1';
  jumlahMejaI.max = '20';
  const pisahI = T.ta(3, 'Aturan pisah, satu pasang per baris.\nContoh:\nAndi | Budi');
  const denahBox = T.out();
  const statusBox = T.out();

  let denah = null; // {meja: [[nama|null]], sisa: [], jenis}
  let terpilih = null; // {meja, kursi} atau {pool, idx}

  try {
    const simpan = JSON.parse(localStorage.getItem(LS_KUNCI) || 'null');
    if (simpan && Array.isArray(simpan.meja)) denah = simpan;
  } catch (e) {}

  function simpan() {
    try { localStorage.setItem(LS_KUNCI, JSON.stringify(denah)); } catch (e) {}
  }

  function catat() {
    if (!denah) {
      T.show(denahBox, '<p class="dim">Belum ada denah. Tulis daftar nama, lalu tekan "Acak Denah".</p>');
      return;
    }
    T.show(denahBox, '');
    const petunjuk = T.el('<p class="dim" style="font-size:12px;margin-bottom:8px">Ketuk nama lalu ketuk kursi lain untuk memindahkan, atau seret namanya ke kursi lain.</p>');
    denahBox.appendChild(petunjuk);
    denah.meja.forEach((kursi, mi) => {
      const kartu = T.el('<div class="card" style="margin-bottom:12px"></div>');
      kartu.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">Meja ' + (mi + 1) + ' <span class="dim" style="font-weight:400">(' + kursi.filter(Boolean).length + '/' + kursi.length + ' terisi)</span></div>'));
      const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px"></div>');
      kursi.forEach((nama, ki) => {
        const sel = document.createElement('button');
        sel.type = 'button';
        sel.className = 'btn';
        sel.style.cssText = 'min-height:44px;font-size:12px;white-space:normal;word-break:break-word;' + (terpilih && terpilih.meja === mi && terpilih.kursi === ki ? 'outline:2px solid #fff;' : '');
        sel.textContent = nama || 'Kursi ' + (ki + 1);
        sel.style.opacity = nama ? '1' : '0.45';
        sel.dataset.meja = String(mi);
        sel.dataset.kursi = String(ki);
        sel.addEventListener('click', () => klikKursi(mi, ki));
        sel.addEventListener('pointerdown', (ev) => mulaiSeret(ev, mi, ki));
        grid.appendChild(sel);
      });
      kartu.appendChild(grid);
      denahBox.appendChild(kartu);
    });
    if (denah.sisa && denah.sisa.length) {
      const kartu = T.el('<div class="card" style="margin-bottom:12px"></div>');
      kartu.appendChild(T.el('<div style="font-weight:700;margin-bottom:8px">Belum dapat kursi (' + denah.sisa.length + ')</div>'));
      const grid = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px"></div>');
      denah.sisa.forEach((nama, si) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'btn';
        chip.style.cssText = 'min-height:44px;font-size:12px;' + (terpilih && terpilih.pool === si ? 'outline:2px solid #fff;' : '');
        chip.textContent = nama;
        chip.addEventListener('click', () => {
          terpilih = { pool: si };
          catat();
        });
        grid.appendChild(chip);
      });
      kartu.appendChild(grid);
      denahBox.appendChild(kartu);
    }
    const baris = T.el('<div class="row" style="flex-wrap:wrap"></div>');
    baris.appendChild(T.btn('Unduh daftar (.txt)', () => {
      const teks = denah.meja.map((k, mi) => 'Meja ' + (mi + 1) + ':\n' + k.map((n, ki) => '  ' + (ki + 1) + '. ' + (n || '-')).join('\n')).join('\n\n')
        + (denah.sisa.length ? '\n\nBelum dapat kursi:\n' + denah.sisa.map((n) => '  - ' + n).join('\n') : '');
      T.dl('denah-tempat-duduk.txt', teks, 'text/plain;charset=utf-8');
      T.toast('Berhasil diunduh');
    }));
    baris.appendChild(T.btn('Unduh gambar (PNG)', () => {
      const kanvas = document.createElement('canvas');
      const perBaris = 2;
      const lebarKotak = 300, tinggiKotak = 190;
      const jumlahBaris = Math.ceil(denah.meja.length / perBaris);
      kanvas.width = perBaris * lebarKotak + 40;
      kanvas.height = jumlahBaris * tinggiKotak + 40;
      const ctx = kanvas.getContext('2d');
      ctx.fillStyle = '#171412';
      ctx.fillRect(0, 0, kanvas.width, kanvas.height);
      denah.meja.forEach((kursi, mi) => {
        const x0 = 20 + (mi % perBaris) * lebarKotak;
        const y0 = 20 + Math.floor(mi / perBaris) * tinggiKotak;
        ctx.fillStyle = '#221e1b';
        ctx.strokeStyle = '#ffffff22';
        ctx.beginPath();
        ctx.roundRect(x0, y0, lebarKotak - 16, tinggiKotak - 16, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('Meja ' + (mi + 1), x0 + 14, y0 + 26);
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = '#d8d2cc';
        kursi.forEach((nama, ki) => {
          ctx.fillText((ki + 1) + '. ' + (nama || '-'), x0 + 14, y0 + 48 + ki * 17);
        });
      });
      kanvas.toBlob((blob) => {
        if (!blob) { T.toast('Gambar gagal dibuat'); return; }
        T.dl('denah-tempat-duduk.png', blob, 'image/png');
        T.toast('Berhasil diunduh');
      }, 'image/png');
    }));
    baris.appendChild(T.btn('Hapus denah', () => {
      denah = null;
      terpilih = null;
      try { localStorage.removeItem(LS_KUNCI); } catch (e) {}
      catat();
      T.toast('Denah dihapus');
    }));
    denahBox.appendChild(baris);
  }

  function pindahKe(mejaTujuan, kursiTujuan) {
    if (!terpilih) return;
    let nama = null;
    if (terpilih.meja != null) {
      nama = denah.meja[terpilih.meja][terpilih.kursi];
      denah.meja[terpilih.meja][terpilih.kursi] = null;
    } else if (terpilih.pool != null) {
      nama = denah.sisa[terpilih.pool];
      denah.sisa.splice(terpilih.pool, 1);
    }
    if (nama == null) { terpilih = null; return; }
    const lama = denah.meja[mejaTujuan][kursiTujuan];
    denah.meja[mejaTujuan][kursiTujuan] = nama;
    if (lama) denah.sisa.push(lama);
    terpilih = null;
    simpan();
    catat();
  }

  function klikKursi(mi, ki) {
    if (terpilih && terpilih.meja === mi && terpilih.kursi === ki) { terpilih = null; catat(); return; }
    if (terpilih) { pindahKe(mi, ki); return; }
    if (denah.meja[mi][ki]) { terpilih = { meja: mi, kursi: ki }; catat(); }
  }

  let seret = null;
  function mulaiSeret(ev, mi, ki) {
    if (!denah.meja[mi][ki]) return;
    seret = { meja: mi, kursi: ki, x0: ev.clientX, y0: ev.clientY, aktif: false, el: null };
    const gerak = (e2) => {
      if (!seret) return;
      if (!seret.aktif && Math.hypot(e2.clientX - seret.x0, e2.clientY - seret.y0) > 8) {
        seret.aktif = true;
        const chip = document.createElement('div');
        chip.textContent = denah.meja[mi][ki];
        chip.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;background:#fff;color:#171412;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:700;box-shadow:0 4px 16px #0008';
        document.body.appendChild(chip);
        seret.el = chip;
      }
      if (seret.aktif && seret.el) {
        seret.el.style.left = (e2.clientX + 8) + 'px';
        seret.el.style.top = (e2.clientY + 8) + 'px';
      }
    };
    const lepas = (e2) => {
      window.removeEventListener('pointermove', gerak);
      window.removeEventListener('pointerup', lepas);
      if (!seret) return;
      if (seret.el) seret.el.remove();
      if (seret.aktif) {
        const target = document.elementFromPoint(e2.clientX, e2.clientY);
        const tombol = target && target.closest ? target.closest('button[data-meja]') : null;
        if (tombol) {
          terpilih = { meja: seret.meja, kursi: seret.kursi };
          pindahKe(parseInt(tombol.dataset.meja, 10), parseInt(tombol.dataset.kursi, 10));
        } else {
          terpilih = null;
          catat();
        }
      }
      seret = null;
    };
    window.addEventListener('pointermove', gerak);
    window.addEventListener('pointerup', lepas);
  }

  function acak() {
    const tamu = tamuI.value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!tamu.length) { T.toast('Tulis dulu daftar namanya'); tamuI.focus(); return; }
    const jenis = jenisSel.value;
    const jumlahMeja = Math.min(20, Math.max(1, parseInt(jumlahMejaI.value, 10) || 1));
    const kursi = KURSI_PER_MEJA[jenis] || 8;
    const aturan = uraiAturanPisah(pisahI.value);
    const hasil = acakDenah(tamu, jumlahMeja, kursi, aturan, Date.now() % 2147483647);
    denah = { meja: hasil.meja, sisa: hasil.sisa, jenis };
    terpilih = null;
    simpan();
    catat();
    T.show(statusBox, '<p class="note">' + tamu.length + ' nama dibagi ke ' + jumlahMeja + ' meja' + (hasil.sisa.length ? '; ' + hasil.sisa.length + ' nama belum dapat kursi karena kursinya penuh.' : '.') + '</p>');
    T.scrollToPreview(denahBox);
  }

  const acakB = T.btn('Acak Denah', acak, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Aturan pisah dipakai sebisa mungkin; bila kursinya terlalu sedikit, ada pasangan yang tetap semeja dan bisa dipindah manual.</p>'));
  root.appendChild(T.field('Daftar nama', tamuI, 'Satu nama per baris.'));
  root.appendChild(T.grid2(
    T.field('Jenis meja', jenisSel),
    T.field('Jumlah meja', jumlahMejaI),
  ));
  root.appendChild(T.field('Aturan pisah (boleh kosong)', pisahI, 'Satu pasang per baris, pisahkan dengan tanda |. Contoh: Andi | Budi.'));
  root.appendChild(acakB);
  root.appendChild(statusBox);
  root.appendChild(denahBox);
  catat();
}
