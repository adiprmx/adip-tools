import { h as T, kv, errBox, esc } from '../../core.js?v=6.12.2';

// ULID: 26 karakter base32 (alfabet Crockford, tanpa I, L, O, U).
// 10 karakter pertama = waktu (milidetik), 16 sisanya = acak.
// Karena waktunya di depan, ULID yang dibuat belakangan selalu
// terurut setelah ULID yang dibuat lebih dulu bila diurutkan abjad.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms) {
  let n = BigInt(ms);
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[Number(n & 31n)] + out;
    n >>= 5n;
  }
  return out;
}

function encodeRandom(bytes) {
  // 80 bit acak -> 16 karakter base32 (5 bit per karakter).
  // Mask akumulator tiap putaran: bitwise JS hanya 32 bit, tanpa mask
  // bit atas terbuang setelah byte ke-5 dan hasilnya salah.
  let out = '';
  let acc = 0, bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(acc >> bits) & 31];
    }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) out += CROCKFORD[(acc << (5 - bits)) & 31];
  return out;
}

function ulidAt(ms) {
  const rnd = new Uint8Array(10);
  crypto.getRandomValues(rnd);
  return encodeTime(ms) + encodeRandom(rnd);
}

function ulid() { return ulidAt(Date.now()); }

function inspectUlId(s) {
  const v = String(s || '').trim().toUpperCase();
  if (!v) return { error: 'Tempel dulu ULID-nya.' };
  if (v.length !== 26) return { error: 'ULID harus 26 karakter, yang ditempel ada ' + v.length + ' karakter.' };
  for (const ch of v) {
    if (!CROCKFORD.includes(ch)) return { error: 'Karakter "' + ch + '" bukan bagian dari ULID. ULID hanya memakai angka dan huruf (tanpa I, L, O, U).' };
  }
  if (v[0] > '7') return { error: 'Karakter pertama ULID tidak boleh lebih dari 7.' };
  let ms = 0n;
  for (let i = 0; i < 10; i++) ms = (ms << 5n) | BigInt(CROCKFORD.indexOf(v[i]));
  const date = new Date(Number(ms));
  return {
    ulid: v,
    ms: Number(ms),
    date,
    random: v.slice(10),
    valid: true,
  };
}

export const meta = {"id": "ulid-generator", "name": "ULID Generator", "cat": "developer", "icon": "🔢", "desc": "Buat ULID yang terurut waktu & baca waktu di dalamnya.", "keywords": "ulid,id,acak,sortable,timestamp", "since": "6.11.0"};
export function render(root) {

    const nInp = T.input('text', 'Jumlah (1-100)', '5');
    nInp.inputMode = 'numeric';
    const out = T.out();
    const inspInp = T.input('text', 'Tempel ULID di sini untuk dibaca…');
    const inspBox = T.out();
    let last = [];

    const gen = () => {
      const n = Math.max(1, Math.min(100, parseInt(nInp.value, 10) || 5));
      nInp.value = n;
      last = [];
      for (let i = 0; i < n; i++) last.push(ulid());
      T.show(out, '<div class="hint" style="margin-bottom:8px">Dibuat ' + new Date().toLocaleString('id-ID') + '. Urutan abjad sama dengan urutan waktu dibuat.</div>' +
        last.map((u) =>
          '<div class="kv"><span class="v" style="font-family:ui-monospace,monospace;font-size:13px;user-select:all;text-align:left">' + u + '</span></div>'
        ).join(''));
    };

    const inspect = () => {
      const r = inspectUlId(inspInp.value);
      if (r.error) { T.show(inspBox, errBox(r.error)); return; }
      const when = isNaN(r.date.getTime()) ? 'tidak bisa dibaca' : r.date.toLocaleString('id-ID');
      const age = Date.now() - r.ms;
      const ageTxt = age < 0 ? 'waktu di masa depan' : age < 1000 ? 'baru saja' : age < 60000 ? Math.floor(age / 1000) + ' detik lalu' : age < 3600000 ? Math.floor(age / 60000) + ' menit lalu' : Math.floor(age / 3600000) + ' jam lalu';
      T.show(inspBox,
        '<div style="margin-bottom:8px"><span class="ok">✓ ULID valid.</span></div>' +
        kv('Waktu dibuat', esc(when) + ' <span class="dim">(' + esc(ageTxt) + ')</span>') +
        kv('Milidetik', String(r.ms)) +
        kv('Bagian acak', '<span style="font-family:ui-monospace,monospace">' + esc(r.random) + '</span>'));
    };

    root.appendChild(T.field('Jumlah ULID', nInp));
    root.appendChild(T.row(T.btn('Buat ULID', gen, true), T.btn('Salin Semua', () => { if (last.length) T.copy(last.join('\n')); else T.toast('Buat dulu ULID-nya'); })));
    root.appendChild(out);
    root.appendChild(T.el('<div style="height:16px"></div>'));
    root.appendChild(T.field('Baca ULID', inspInp, 'ULID menyimpan waktu pembuatannya di 10 karakter pertama.'));
    root.appendChild(T.row(T.btn('Baca', inspect)));
    root.appendChild(inspBox);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">ULID itu ID acak 26 karakter yang bisa diurutkan berdasarkan waktu. Cocok untuk ID baris database yang ingin tetap terurut tanpa memakai angka berurutan.</div>'));
    gen();
  
}
