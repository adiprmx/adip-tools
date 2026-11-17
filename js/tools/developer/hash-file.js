import { h as T, fileInput, fmtBytes, errBox, esc } from '../../core.js';

// Checksum file: SHA-256/384/512 via WebCrypto, MD5 via crypto-js
// (dimuat dari CDN hanya bila MD5 dicentang). File dibaca utuh ke
// memori, jadi file sangat besar bisa lambat di HP kentang.
const CJ_CORE = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/core.js';
const CJ_MD5 = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/md5.js';

let md5Ready = null;
async function ensureMd5() {
  if (md5Ready !== null) return md5Ready;
  const okCore = await T.loadScript(CJ_CORE);
  const okMd5 = okCore && await T.loadScript(CJ_MD5);
  md5Ready = !!(okMd5 && window.CryptoJS && window.CryptoJS.MD5 && window.CryptoJS.lib);
  return md5Ready;
}

// crypto-js WordArray.create menganggap array sebagai word 32-bit,
// bukan byte. Konversi manual: byte -> word big-endian + sigBytes.
function bytesToWordArray(bytes) {
  const C = window.CryptoJS;
  const words = [];
  for (let i = 0; i < bytes.length; i++) words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  return C.lib.WordArray.create(words, bytes.length);
}

async function shaHex(alg, bytes) {
  const buf = await crypto.subtle.digest(alg, bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const meta = {"id": "hash-file", "name": "Hash File", "cat": "developer", "icon": "📄", "desc": "Hitung checksum file & cocokkan dengan hash.", "keywords": "hash,checksum,file,sha,md5,verifikasi", "since": "6.11.0"};
export function render(root) {

    const fInp = fileInput('');
    const fLabel = T.el('<div class="hint">Belum ada file dipilih.</div>');
    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const cMd5 = mkChk('MD5', false), cSha256 = mkChk('SHA-256', true), cSha384 = mkChk('SHA-384', false), cSha512 = mkChk('SHA-512', false);
    const expectInp = T.input('text', 'Tempel hash yang diharapkan (opsional)…');
    const out = T.out();
    let file = null;
    let results = [];

    fInp.addEventListener('change', () => {
      file = fInp.files && fInp.files[0] ? fInp.files[0] : null;
      results = [];
      T.hide(out);
      fLabel.textContent = file ? file.name + ' (' + fmtBytes(file.size) + ')' : 'Belum ada file dipilih.';
    });

    const go = async () => {
      if (!file) { T.show(out, errBox('Pilih dulu filenya.')); return; }
      const wantMd5 = cMd5.box.checked, want256 = cSha256.box.checked, want384 = cSha384.box.checked, want512 = cSha512.box.checked;
      if (!wantMd5 && !want256 && !want384 && !want512) { T.show(out, errBox('Pilih minimal satu jenis hash.')); return; }
      T.show(out, '<span class="dim">Membaca file &amp; menghitung…</span>');
      let bytes;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch (e) {
        T.show(out, errBox('File tidak bisa dibaca. Pastikan filenya tidak rusak lalu coba lagi.'));
        return;
      }
      results = [];
      const jobs = [];
      if (want256) jobs.push(shaHex('SHA-256', bytes).then((h) => ['SHA-256', h]));
      if (want384) jobs.push(shaHex('SHA-384', bytes).then((h) => ['SHA-384', h]));
      if (want512) jobs.push(shaHex('SHA-512', bytes).then((h) => ['SHA-512', h]));
      if (wantMd5) {
        jobs.push((async () => {
          const ok = await ensureMd5();
          if (!ok) return ['MD5', null];
          return ['MD5', window.CryptoJS.MD5(bytesToWordArray(bytes)).toString()];
        })());
      }
      const settled = await Promise.all(jobs);
      results = settled.filter(([, h]) => h);
      const md5Fail = wantMd5 && !results.find(([n]) => n === 'MD5');
      let html = results.map(([n, h]) =>
        '<div class="kv"><span class="k">' + n + '</span><span class="v" style="font-family:ui-monospace,monospace;font-size:12px;word-break:break-all;text-align:left">' + esc(h) + '</span></div>'
      ).join('');
      html += '<div style="margin-top:10px">' + results.map(([, h], i) =>
        '<button type="button" class="btn small" data-h="' + i + '" style="margin:0 6px 6px 0">Salin ' + results[i][0] + '</button>').join('') + '</div>';
      if (md5Fail) html += '<div class="hint" style="margin-top:8px">MD5 tidak bisa dihitung: alat MD5 tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.</div>';
      const expect = expectInp.value.trim().toLowerCase();
      if (expect) {
        const hit = results.find(([, h]) => h.toLowerCase() === expect);
        const known = results.length ? ' Hash yang dihitung: ' + results.map(([n]) => n).join(', ') + '.' : '';
        html += hit
          ? '<div style="margin-top:10px"><span class="ok">✓ Cocok dengan ' + esc(hit[0]) + '.</span> <span class="dim">File ini sama dengan yang diharapkan.</span></div>'
          : '<div style="margin-top:10px"><span class="err">✗ Tidak cocok dengan hash mana pun.</span> <span class="dim">File mungkin berbeda atau hash yang ditempel keliru.' + esc(known) + '</span></div>';
      }
      T.show(out, html);
      out.querySelectorAll('button[data-h]').forEach((b) => b.addEventListener('click', () => T.copy(results[+b.dataset.h][1])));
    };

    root.appendChild(T.field('File', fInp));
    root.appendChild(fLabel);
    root.appendChild(T.grid2(cMd5.el, cSha256.el, cSha384.el, cSha512.el));
    root.appendChild(T.field('Cocokkan dengan hash (opsional)', expectInp, 'Tempel hash dari sumber file, misalnya dari halaman unduhan, untuk memastikan file tidak berubah.'));
    root.appendChild(T.row(T.btn('Hitung Hash', go, true)));
    root.appendChild(out);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">File hanya dibaca di perangkat ini, tidak diunggah ke mana-mana. MD5 butuh koneksi internet sekali untuk memuat pustakanya; SHA dihitung langsung oleh browser.</div>'));
  
}
