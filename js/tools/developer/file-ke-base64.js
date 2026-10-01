import { h as T, utils } from '../../core.js?v=6.8.0';

const BATAS = 2 * 1024 * 1024; // 2 MB

/* Dipakai node test: batasi ukuran file. */
export function cekBatas(size) {
  if (size == null) return { ok: false, pesan: 'Ukuran file tidak terbaca.' };
  if (size > BATAS) return { ok: false, pesan: 'File ' + fmtSize(size) + ' kegedean — batasnya 2 MB. Kompres dulu atau pilih file lain.' };
  return { ok: true };
}
export function fmtSize(n) {
  if (!n && n !== 0) return '-';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

export const meta = {"id": "file-ke-base64", "name": "File ke Base64", "cat": "developer", "icon": "📦", "desc": "File apa pun jadi string Base64 + data URI.", "keywords": "base64,file,data uri,encode,konversi"};

export function render(root) {

    const fileInp = T.el('<input type="file" class="inp">');
    const out = T.out();
    let base64 = '', dataUri = '';

    fileInp.addEventListener('change', () => {
      const f = fileInp.files && fileInp.files[0];
      if (!f) return;
      const cek = cekBatas(f.size);
      if (!cek.ok) { T.show(out, '<span class="err">⛔ ' + T.esc(cek.pesan) + '</span>'); return; }
      T.show(out, '<span class="dim">⏳ Membaca file…</span>');
      const rd = new FileReader();
      rd.onload = () => {
        dataUri = String(rd.result);
        base64 = dataUri.split(',')[1] || '';
        const b64len = base64.length;
        const b64size = Math.ceil(b64len * 3 / 4);
        const tampil = b64len > 600;
        const ta = T.ta(6);
        ta.readOnly = true;
        ta.value = tampil ? base64.slice(0, 600) + '…' : base64;
        T.show(out, '');
        out.appendChild(T.el(
          '<div class="kv"><span class="k">Nama file</span><span class="v">' + T.esc(f.name) + '</span></div>' +
          '<div class="kv"><span class="k">Tipe</span><span class="v">' + T.esc(f.type || 'tidak diketahui') + '</span></div>' +
          '<div class="kv"><span class="k">Ukuran file</span><span class="v">' + fmtSize(f.size) + '</span></div>' +
          '<div class="kv"><span class="k">Ukuran Base64</span><span class="v">' + fmtSize(b64size) + ' (' + T.fmt(b64len) + ' karakter)</span></div>' +
          '<div class="kv"><span class="k">Bengkak</span><span class="v">+' + Math.round(b64size / Math.max(f.size, 1) * 100 - 100) + '% — wajar, Base64 memang ~33% lebih gemuk</span></div>'
        ));
        out.appendChild(T.el('<div class="fld" style="margin-top:10px"><label>String Base64' + (tampil ? ' (dipotong, klik di bawah buat lihat penuh)' : '') + '</label></div>'));
        out.appendChild(ta);
        if (tampil) {
          const tgl = T.btn('👁️ Tampilkan penuh', null, false);
          let penuh = false;
          tgl.addEventListener('click', () => {
            penuh = !penuh;
            ta.value = penuh ? base64 : base64.slice(0, 600) + '…';
            tgl.textContent = penuh ? '🙈 Sembunyikan' : '👁️ Tampilkan penuh';
          });
          out.appendChild(T.row(tgl));
        }
        out.appendChild(T.el('<div class="fld" style="margin-top:10px"><label>Data URI lengkap</label></div>'));
        const uriBox = T.el('<pre class="dim" style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:10px;font-size:11.5px;line-height:1.5;max-height:120px;overflow:auto">' + T.esc(dataUri.slice(0, 300)) + (dataUri.length > 300 ? '…' : '') + '</pre>');
        out.appendChild(uriBox);
        out.appendChild(T.row(
          T.copyBtn(() => base64, '📋 Salin Base64', true),
          T.copyBtn(() => dataUri, 'Salin Data URI')
        ));
        out.appendChild(T.el('<div class="hint" style="margin-top:8px">Siap ditempel ke kode: <span style="font-family:ui-monospace,monospace">src="data:…"</span>. ' + T.esc(fmtSize(f.size)) + ' file jadi ' + T.esc(fmtSize(b64size)) + ' teks — makanya jangan buat file gede ya.</div>'));
      };
      rd.onerror = () => T.show(out, '<span class="err">Gagal membaca file.</span>');
      rd.readAsDataURL(f);
    });

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih file apa pun — dokumen, font, audio — langsung jadi string Base64 siap tempel di kode. Maksimal <b>2 MB</b>; semua diproses lokal, file tidak di-upload ke mana pun.</p>'));
    root.appendChild(T.field('Pilih file', fileInp, 'Batas 2 MB. File lebih besar otomatis ditolak.'));
    root.appendChild(out);
}
