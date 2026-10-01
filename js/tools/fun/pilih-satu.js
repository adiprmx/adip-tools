import { h as T, utils, beep, actx, onLeave, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "pilih-satu", "name": "Pilih Satu", "cat": "fun", "icon": "🎯", "desc": "Bingung milih? Biar acak yang menentukan.", "keywords": "pilih,acak,random,keputusan,opsi"};

/** Parse textarea jadi daftar opsi bersih. */
export function parseOpsi(teks) {
  return String(teks || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

/** Pilih 1 opsi acak dari daftar. */
export function acakSatu(opsi) {
  return opsi[Math.floor(Math.random() * opsi.length)];
}

export function render(root) {
  const ta = T.ta(6, 'Tulis opsi, satu per baris\nmisal:\nMakan nasi goreng\nMakan mie ayam\nMakan soto');
  const box = T.out();
  let iv = null;
  const hentikan = () => { if (iv) { clearInterval(iv); iv = null; } };
  onLeave(hentikan);

  const pilih = () => {
    const opsi = parseOpsi(ta.value);
    if (opsi.length < 2) { T.show(box, errBox('Tulis minimal 2 opsi dulu, satu per baris.')); return; }
    hentikan();
    const final = acakSatu(opsi);
    let n = 0;
    const total = 22;
    beep(440, 0.1, 'square');
    iv = setInterval(() => {
      n++;
      const tampil = n >= total ? final : acakSatu(opsi);
      const uk = n >= total ? '30px' : (16 + n) + 'px';
      T.show(box,
        '<div class="center"><div class="dim">' + (n >= total ? '🎯 Pilihan jatuh ke:' : 'Mengacak…') + '</div>' +
        '<div style="font-size:' + uk + ';font-weight:700;margin:14px 0;line-height:1.3">' + T.esc(tampil) + '</div></div>');
      if (n >= total) {
        hentikan();
        beep(660, 0.2, 'sine'); beep(990, 0.35, 'sine', 0.18);
      }
    }, 90);
  };

  root.appendChild(T.field('Daftar opsi', ta, 'Satu opsi per baris, minimal 2.'));
  root.appendChild(T.btn('🎯 Pilih!', pilih, true));
  root.appendChild(box);
}
