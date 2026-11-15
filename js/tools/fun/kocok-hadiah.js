import { h as T, utils } from '../../core.js?v=6.11.5';

// Logika murni (bisa di-test di Node): kocok Secret Santa (derangement),
// tidak ada yang mendapat dirinya sendiri.
utils.kocokHadiah = function (nama, acak) {
  const daftar = nama.map((n) => n.trim()).filter(Boolean);
  if (daftar.length < 3) return null;
  const rnd = acak || Math.random;
  for (let coba = 0; coba < 200; coba++) {
    const penerima = [...daftar];
    for (let i = penerima.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [penerima[i], penerima[j]] = [penerima[j], penerima[i]];
    }
    let sendiri = false;
    for (let i = 0; i < daftar.length; i++) {
      if (penerima[i] === daftar[i]) { sendiri = true; break; }
    }
    if (!sendiri) return daftar.map((dari, i) => ({ dari, ke: penerima[i] }));
  }
  // Cadangan deterministik: geser satu posisi (dijamin bukan diri sendiri).
  return daftar.map((dari, i) => ({ dari, ke: daftar[(i + 1) % daftar.length] }));
};

export const meta = {"id": "kocok-hadiah", "name": "Kocok Hadiah Rahasia", "cat": "fun", "icon": "🎁", "desc": "Kocok Secret Santa, siapa memberi hadiah untuk siapa.", "keywords": "secret santa,kocok hadiah,hadiah,natal,arisan,tukar kado", "since": "6.11.0"};

export function render(root) {
  const peserta = T.ta(5, 'Tulis nama peserta, satu per baris. Minimal 3 orang.', '');
  const box = T.out();
  const wadah = T.el('<div></div>');
  let hasil = null;

  function tampil() {
    wadah.innerHTML = '';
    if (!hasil) { wadah.appendChild(T.el('<div class="hint">Belum dikocok. Isi nama peserta lalu tekan Kocok.</div>')); return; }
    hasil.forEach((pasangan) => {
      const kartu = T.el('<div style="border:1px solid #2a2a2a;border-radius:10px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:8px"></div>');
      const kiri = T.el(`<span style="font-size:15px"><b>${pasangan.dari}</b> memberi hadiah untuk <span data-target style="color:#a1a1aa">??? (ketuk untuk lihat)</span></span>`);
      kartu.appendChild(kiri);
      const kanan = T.el('<span style="display:flex;gap:6px;flex-shrink:0"></span>');
      kanan.appendChild(T.btn('Lihat', () => {
        const target = kiri.querySelector('[data-target]');
        target.textContent = pasangan.ke;
        target.style.color = '#fff';
        target.style.fontWeight = '700';
      }));
      kanan.appendChild(T.btn('Salin pesan', () => {
        T.copy('Halo ' + pasangan.dari + ', kamu memberi hadiah untuk: ' + pasangan.ke + '. Rahasia ya, jangan kasih tahu siapa-siapa.');
        T.toast('Pesan untuk ' + pasangan.dari + ' disalin, siap ditempel ke chat');
      }));
      kartu.appendChild(kanan);
      wadah.appendChild(kartu);
    });
    T.show(box, '<div class="hint">Hasil kocokan hanya ada di HP ini, tidak dikirim ke mana-mana. Salin pesan tiap orang lalu kirim secara pribadi supaya tetap rahasia.</div>');
  }

  root.appendChild(T.el('<p class="note">Masukkan nama semua peserta, kocok, dan tiap orang mendapat satu orang lain untuk diberi hadiah. Tidak ada yang mendapat dirinya sendiri.</p>'));
  root.appendChild(T.field('Nama peserta', peserta));
  root.appendChild(T.row(
    T.btn('Kocok', () => {
      const daftar = peserta.value.split(/\r?\n/);
      const kocok = utils.kocokHadiah(daftar);
      if (!kocok) { T.toast('Isi minimal 3 nama peserta'); return; }
      hasil = kocok;
      tampil();
    }, true),
    T.btn('Kocok ulang', () => {
      if (!hasil) { T.toast('Kocok dulu'); return; }
      hasil = utils.kocokHadiah(peserta.value.split(/\r?\n/));
      tampil();
    })
  ));
  root.appendChild(box);
  root.appendChild(wadah);
  tampil();
}
