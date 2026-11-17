import { h as T, utils } from '../../core.js';

// Logika murni (bisa di-test di Node).
utils.buatBagan = function (peserta) {
  const daftar = peserta.map((p) => p.trim()).filter(Boolean);
  if (daftar.length < 2) return null;
  let ukuran = 2;
  while (ukuran < daftar.length) ukuran *= 2;
  const bye = ukuran - daftar.length;
  // Pemain yang bertanding di babak awal = total minus yang dapat bye.
  // Yang dapat bye masuk sebagai entri yang sudah lolos, jadi tidak pernah
  // ada laga kosong (dua-duanya null) yang membuat bagan macet.
  const main = daftar.slice(0, daftar.length - bye);
  const lolos = daftar.slice(daftar.length - bye);
  const ronde0 = [];
  for (let i = 0; i < main.length; i += 2) {
    ronde0.push({ a: main[i], b: main[i + 1], skorA: '', skorB: '', pemenang: null });
  }
  lolos.forEach((p) => ronde0.push({ a: p, b: null, skorA: '', skorB: '', pemenang: p }));
  return { peserta: daftar, ronde: [ronde0] };
};
utils.pemenangRonde = function (ronde) {
  return ronde.map((m) => m.pemenang);
};
utils.juaraBagan = function (state) {
  const terakhir = state.ronde[state.ronde.length - 1];
  if (terakhir.length === 1 && terakhir[0].pemenang) return terakhir[0].pemenang;
  return null;
};
// Bangun ulang ronde-ronde berikutnya dari pemenang yang sudah ada.
utils.lanjutBagan = function (state) {
  let r = 0;
  while (true) {
    const rondeIni = state.ronde[r];
    if (!rondeIni || rondeIni.length <= 1) break;
    const pemenang = utils.pemenangRonde(rondeIni);
    if (pemenang.some((p) => !p)) {
      state.ronde = state.ronde.slice(0, r + 1);
      break;
    }
    const berikut = [];
    const lama = state.ronde[r + 1] || [];
    for (let i = 0; i < pemenang.length; i += 2) {
      const a = pemenang[i], b = pemenang[i + 1] || null;
      // Pertahankan laga lama bila pesertanya sama, supaya skor dan pemenang
      // yang sudah disimpan (mis. final) tidak terhapus saat membangun ulang.
      const cocok = lama.find((mm) => mm.a === a && mm.b === b);
      if (cocok) berikut.push(cocok);
      else berikut.push({ a, b, skorA: '', skorB: '', pemenang: b ? null : a });
    }
    state.ronde[r + 1] = berikut;
    r++;
  }
  return state;
};

export const meta = {"id": "bagan-turnamen", "name": "Bagan Turnamen", "cat": "fun", "icon": "🏆", "desc": "Buat bagan turnamen gugur dan catat skornya.", "keywords": "turnamen,bagan,bracket,pertandingan,olahraga,futsal,badminton,game", "since": "6.11.0"};

export function render(root) {
  const peserta = T.ta(5, 'Tulis nama peserta, satu per baris. Jumlah bebas, yang ganjil otomatis dapat bye.', '');
  const box = T.out();
  const wadah = T.el('<div style="overflow-x:auto;margin-top:16px"></div>');
  const KUNCI = 'at-bagan-turnamen';
  let state = null;
  try {
    const simpan = JSON.parse(localStorage.getItem(KUNCI) || 'null');
    if (simpan && simpan.ronde) state = simpan;
  } catch (e) { state = null; }

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  }

  function namaRonde(i, total) {
    if (i === total - 1 && state.ronde[i].length === 1) return 'Final';
    if (state.ronde[i].length === 2) return 'Semifinal';
    if (state.ronde[i].length === 4) return 'Perempat final';
    return 'Babak ' + (i + 1);
  }

  function tampil() {
    wadah.innerHTML = '';
    if (!state) { wadah.appendChild(T.el('<div class="hint">Belum ada bagan. Isi daftar peserta di atas lalu tekan Buat bagan.</div>')); return; }
    const juara = utils.juaraBagan(state);
    const flex = T.el('<div style="display:flex;gap:16px;min-width:max-content"></div>');
    state.ronde.forEach((ronde, ri) => {
      const kolom = T.el('<div style="min-width:220px"></div>');
      kolom.appendChild(T.el(`<h3 style="text-align:center">${namaRonde(ri, state.ronde.length)}</h3>`));
      ronde.forEach((m, mi) => {
        const kartu = T.el('<div style="border:1px solid #2a2a2a;border-radius:10px;padding:10px;margin-bottom:12px;background:#111"></div>');
        const barisNama = (nama, skor, sisi) => {
          const s = T.el('<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px;padding:4px 0"></div>');
          const namaEl = T.el(`<span>${nama || '<span style="color:#666">Bye</span>'}</span>`);
          if (m.pemenang && m.pemenang === nama) namaEl.innerHTML = '<b>' + nama + ' ✓</b>';
          s.appendChild(namaEl);
          if (nama) {
            const inp = T.input('text', '', skor);
            inp.inputMode = 'decimal';
            inp.style.cssText = 'width:48px;text-align:center';
            inp.addEventListener('change', () => { m[sisi] = inp.value; });
            s.appendChild(inp);
          }
          return s;
        };
        kartu.appendChild(barisNama(m.a, m.skorA, 'skorA'));
        kartu.appendChild(barisNama(m.b, m.skorB, 'skorB'));
        if (m.a && m.b && !m.pemenang) {
          kartu.appendChild(T.btn('Simpan skor', () => {
            const sa = T.num(m.skorA), sb = T.num(m.skorB);
            if (sa === sb) { T.toast('Skor seri, isi skor yang berbeda untuk menentukan pemenang'); return; }
            m.pemenang = sa > sb ? m.a : m.b;
            utils.lanjutBagan(state);
            simpan();
            tampil();
          }));
        } else if (m.pemenang && m.a && m.b) {
          const ubah = T.btn('Ubah', () => {
            m.pemenang = null; m.skorA = ''; m.skorB = '';
            state.ronde = state.ronde.slice(0, ri + 1);
            utils.lanjutBagan(state);
            simpan();
            tampil();
          });
          kartu.appendChild(ubah);
        } else if (m.pemenang) {
          kartu.appendChild(T.el('<div style="font-size:12px;color:#a1a1aa">Lolos otomatis (bye)</div>'));
        }
        kolom.appendChild(kartu);
      });
      flex.appendChild(kolom);
    });
    wadah.appendChild(flex);
    T.show(box, juara
      ? `<div class="note">🏆 Juara turnamen: <b>${juara}</b></div>`
      : `<div class="hint">Isi skor tiap pertandingan lalu tekan Simpan skor. Pemenang otomatis maju ke babak berikutnya. Bagan tersimpan di HP ini.</div>`);
  }

  root.appendChild(T.el('<p class="note">Turnamen sistem gugur: yang kalah langsung tersingkir. Jumlah peserta bebas, yang kebagian bye lolos otomatis.</p>'));
  root.appendChild(T.field('Daftar peserta', peserta));
  root.appendChild(T.row(
    T.btn('Buat bagan', () => {
      const daftar = peserta.value.split(/\r?\n/);
      const hasil = utils.buatBagan(daftar);
      if (!hasil) { T.toast('Isi minimal 2 peserta'); return; }
      state = utils.lanjutBagan(hasil);
      simpan();
      tampil();
    }, true),
    T.btn('Hapus bagan', () => {
      state = null;
      try { localStorage.removeItem(KUNCI); } catch (e) { /* abaikan */ }
      tampil();
    })
  ));
  root.appendChild(box);
  root.appendChild(wadah);
  tampil();
}
