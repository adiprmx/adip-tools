import { h as T, utils } from '../../core.js';

export const meta = {"id": "persen-error", "name": "Persen Error", "cat": "pelajar", "icon": "🎯", "desc": "Hitung seberapa jauh hasil ukurmu dari nilai yang benar, dalam persen.", "keywords": "persen error,galat,error,akurasi,pengukuran,percobaan,fisika,kimia", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// persen error = |ukur - teori| / |teori| x 100%. Null bila teori 0.
export function hitungPersenError(ukur, teori) {
  if (!Number.isFinite(ukur) || !Number.isFinite(teori) || teori === 0) return null;
  const selisih = ukur - teori;
  const mutlak = Math.abs(selisih);
  const persen = n0((mutlak / Math.abs(teori)) * 100);
  const arah = selisih > 0 ? 'lebih besar' : selisih < 0 ? 'lebih kecil' : 'tepat sama';
  return { selisih: n0(selisih), mutlak: n0(mutlak), persen, relatif: n0(mutlak / Math.abs(teori)), arah };
}

export function render(root) {
  const uI = T.input('text', 'Hasil ukur / percobaan, mis. 9,8', '9,8');
  const tI = T.input('text', 'Nilai yang benar (teori), mis. 10', '10');
  const box = T.out();

  const hitung = () => {
    const u = T.num(uI.value);
    const t = T.num(tI.value);
    if (!Number.isFinite(u) || !Number.isFinite(t)) {
      T.show(box, '<p class="dim">Isi kedua nilainya dulu.</p>');
      return;
    }
    if (t === 0) {
      T.show(box, '<p class="err">Nilai yang benar tidak boleh 0. Persen error tidak bisa dihitung kalau pembaginya 0.</p>');
      return;
    }
    const r = hitungPersenError(u, t);
    const nilai = (v) => T.fmt(n0(Number(utils.r4(v))));
    let h = '<div class="big">' + nilai(r.persen) + '%</div>';
    h += '<p class="dim">Hasil ukurmu ' + r.arah + ' dari nilai yang benar.</p>';
    h += '<div class="kv"><span class="k">Selisih (error mutlak)</span><span class="v">' + nilai(r.mutlak) + '</span></div>';
    h += '<div class="kv"><span class="k">Error relatif (desimal)</span><span class="v">' + nilai(r.relatif) + '</span></div>';
    h += '<div class="kv"><span class="k">Hasil ukur</span><span class="v">' + nilai(u) + '</span></div>';
    h += '<div class="kv"><span class="k">Nilai yang benar</span><span class="v">' + nilai(t) + '</span></div>';
    h += '<p class="hint">Rumusnya: |hasil ukur − nilai benar| ÷ |nilai benar| × 100%. Makin kecil persennya, makin dekat hasil ukurmu dengan nilai yang benar. Di bawah 5% biasanya sudah dianggap cukup akurat untuk tugas sekolah.</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Hitung', hitung, true);
  [uI, tI].forEach((el) => el.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Buat laporan percobaan: masukkan hasil yang kamu ukur dan nilai yang seharusnya, persen error-nya langsung keluar.</p>'));
  root.appendChild(T.grid2(T.field('Hasil ukur / percobaan', uI), T.field('Nilai yang benar (teori)', tI)));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
