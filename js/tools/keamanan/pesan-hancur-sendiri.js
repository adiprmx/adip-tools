import { h as T } from '../../core.js';

// Pesan terenkripsi di dalam tautan (AES-GCM, WebCrypto). Kunci simpan di
// fragment URL (#...) sehingga tidak pernah terkirim ke server mana pun —
// tidak ada server yang menyimpan atau menghapus apa pun. Karena tidak ada
// server, "hancur setelah dibaca" TIDAK BISA ditegakkan: siapa pun yang
// pegang tautan bisa membukanya, dan penerima bisa menyalin/memotret isinya.
// UI di bawah menjelaskan ini dengan jujur.
const b64u = (buf) => {
  const b = String.fromCharCode(...new Uint8Array(buf));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const dariB64u = (s) => {
  const b64 = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export const meta = {"id": "pesan-hancur-sendiri", "name": "Pesan Hancur Sendiri", "cat": "keamanan", "icon": "💣", "desc": "Kirim pesan rahasia lewat tautan terenkripsi. Tanpa server, tanpa akun.", "keywords": "pesan rahasia,enkripsi,aes,tautan,aman,privasi,self destruct", "since": "6.16.0"};
export function render(root) {
  const params = new URLSearchParams((location.hash.split('?').slice(1).join('?')) || '');
  const mParam = params.get('m');
  const kParam = params.get('k');

  // ---------- Mode baca: tautan berisi pesan ----------
  if (mParam && kParam) {
    const box = T.out();
    const bukaBtn = T.btn('Buka pesan', async () => {
      try {
        const raw = dariB64u(mParam);
        const iv = raw.slice(0, 12);
        const ct = raw.slice(12);
        const key = await crypto.subtle.importKey('raw', dariB64u(kParam), { name: 'AES-GCM' }, false, ['decrypt']);
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        const pesan = new TextDecoder().decode(pt);
        T.show(box, '<p style="line-height:1.7;white-space:pre-wrap">' + T.esc(pesan) + '</p>');
        const hapus = T.btn('Hapus dari layar', () => { T.hide(box); T.toast('Pesan dihapus dari layar. Tautan ini masih bisa dibuka lagi.'); });
        box.appendChild(hapus);
        bukaBtn.disabled = true;
      } catch (e) {
        T.show(box, '<p class="warn">Tautan tidak bisa dibuka — mungkin rusak atau tidak lengkap.</p>');
      }
    });
    root.appendChild(T.el('<p class="note">Seseorang mengirimmu pesan terenkripsi. Pesan ini diacak di dalam tautan — kuncinya ada di tautan itu sendiri dan tidak pernah lewat server mana pun.</p>'));
    root.appendChild(T.el('<div style="margin:4px 0 12px"></div>'));
    root.lastChild.appendChild(bukaBtn);
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Jujur saja: tombol "Hapus dari layar" hanya menghapus pesan dari layar ini. Tautan yang sama masih bisa dibuka lagi oleh siapa pun yang menyimpannya — tanpa server, tidak ada yang bisa memaksa pesan benar-benar hancur setelah dibaca.</p>'));
    return;
  }

  // ---------- Mode buat ----------
  const ta = T.ta(5, 'Tulis pesan rahasiamu di sini…');
  const box = T.out();
  const linkBox = T.el('<div></div>');

  const buat = async () => {
    const pesan = ta.value.trim();
    if (!pesan) { T.toast('Tulis dulu pesanmu'); return; }
    if (pesan.length > 2000) { T.show(box, '<p class="warn">Pesan terlalu panjang (maksimal 2000 karakter) — tautan bisa rusak kalau kepanjangan.</p>'); return; }
    try {
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(pesan));
      const gabung = new Uint8Array(12 + ct.byteLength);
      gabung.set(iv, 0); gabung.set(new Uint8Array(ct), 12);
      const rawKey = await crypto.subtle.exportKey('raw', key);
      const tautan = location.origin + location.pathname + '#/t/pesan-hancur-sendiri?m=' + b64u(gabung) + '&k=' + b64u(rawKey);
      linkBox.dataset.tautan = tautan;
      T.show(box,
        '<p class="mut">Tautanmu sudah jadi. Kirim tautan ini ke penerima — hanya yang pegang tautan yang bisa membaca pesanmu.</p>' +
        '<p style="word-break:break-all;font-size:12.5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px">' + T.esc(tautan) + '</p>' +
        '<p class="hint">Tautan berisi pesan teracak + kuncinya, semua di bagian tautan setelah tanda # — bagian itu tidak pernah dikirim ke server mana pun, termasuk server situs ini.</p>');
      box.appendChild(T.copyBtn(() => linkBox.dataset.tautan || '', 'Salin tautan'));
    } catch (e) {
      T.show(box, '<p class="warn">Enkripsi gagal — browser ini mungkin tidak mendukung fitur keamanan yang dibutuhkan.</p>');
    }
  };

  root.appendChild(T.el('<p class="note">Tulis pesan, dapatkan tautan terenkripsi, kirim ke siapa saja. Pesan diacak dengan kunci yang hanya ada di dalam tautan — tidak ada server yang menyimpan pesanmu.</p>'));
  root.appendChild(T.field('Pesan rahasia', ta, 'Maksimal 2000 karakter'));
  const btn = T.btn('Buat tautan terenkripsi', buat);
  root.appendChild(T.el('<div style="margin:4px 0 12px"></div>'));
  root.lastChild.appendChild(btn);
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Yang perlu kamu tahu: tanpa server, tidak ada yang bisa memaksa pesan hancur setelah dibaca. Siapa pun yang menyimpan tautan bisa membukanya lagi, dan penerima bisa menyalin atau memotret isinya. Tool ini melindungi pesan saat dikirim — bukan mengendalikan apa yang dilakukan penerima.</p>'));
}
