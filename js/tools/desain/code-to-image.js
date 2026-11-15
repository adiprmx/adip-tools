import { h as T, kv, canvasToBlob, fmtBytes, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"code-to-image","name":"Kode ke Gambar","cat":"desain","icon":"🖥️","desc":"Ubah potongan kode jadi gambar PNG dengan warna sintaks.","keywords":"kode,code,snippet,gambar,png,screenshot","since":"6.11.0"};

/* Kode ke gambar: tokenisasi sederhana berbasis regex (komentar, string,
   kata kunci, angka), lalu digambar ke canvas. Warna dipakai untuk
   membedakan jenis token, itu fungsinya. */
const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'class', 'import', 'from', 'export', 'default', 'new', 'true', 'false', 'null', 'undefined', 'this', 'async', 'await', 'try', 'catch', 'finally', 'switch', 'case', 'break', 'continue', 'typeof', 'of', 'in', 'extends', 'static', 'get', 'set', 'void', 'delete']);
const THEMES = {
  gelap: { bg: '#171717', plain: '#e4e4e7', keyword: '#93c5fd', string: '#86efac', comment: '#71717a', number: '#fda4af', line: '#52525b' },
  terang: { bg: '#ffffff', plain: '#18181b', keyword: '#1d4ed8', string: '#15803d', comment: '#a1a1aa', number: '#be123c', line: '#d4d4d8' },
};
const MAX_LINES = 120, MAX_W = 2400;

/* Tokenisasi satu baris -> [{t:'plain'|'keyword'|'string'|'comment'|'number', s}]. */
export function tokenize(line) {
  const out = [];
  const re = /(\/\/.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b([A-Za-z_$][\w$]*)\b|\b(\d+(?:\.\d+)?)\b/g;
  let last = 0, m;
  const push = (t, s) => { if (s) out.push({ t, s }); };
  while ((m = re.exec(line))) {
    if (m.index > last) push('plain', line.slice(last, m.index));
    if (m[1] != null) push('comment', m[1]);
    else if (m[2] != null) push('string', m[2]);
    else if (m[3] != null) push(KEYWORDS.has(m[3]) ? 'keyword' : 'plain', m[3]);
    else if (m[4] != null) push('number', m[4]);
    last = m.index + m[0].length;
  }
  if (last < line.length) push('plain', line.slice(last));
  return out;
}

export function render(root) {
  const ta = T.ta(10, 'function sapa(nama) {\n  // cetak sapaan ke layar\n  const pesan = "Halo, " + nama;\n  console.log(pesan);\n  return pesan;\n}\n\nsapa("Dunia");');
  const temaSel = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const fontSel = T.select([['13', '13 px'], ['15', '15 px'], ['18', '18 px'], ['21', '21 px']], '15');
  const nomorChk = T.el('<input type="checkbox" checked style="width:18px;height:18px;accent-color:#fafafa">');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
  const box = T.out();
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');
  prevWrap.appendChild(canvas);
  let pngBlob = null;

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = 'function hitungTotal(harga, jumlah) {\n  const pajak = 0.11; // PPN 11%\n  const subtotal = harga * jumlah;\n  return subtotal + subtotal * pajak;\n}\n\nconst total = hitungTotal(50000, 3);\nconsole.log("Total: Rp" + total);';
  });

  const gambar = () => {
    const code = ta.value.replace(/\t/g, '  ');
    let lines = code.split('\n');
    if (!code.trim()) {
      T.show(box, errBox('Tempel kodenya dulu.'));
      prevWrap.hidden = true;
      return;
    }
    let clipped = false;
    if (lines.length > MAX_LINES) { lines = lines.slice(0, MAX_LINES); clipped = true; }
    const th = THEMES[temaSel.value] || THEMES.gelap;
    const fs = +fontSel.value || 15;
    const lh = Math.round(fs * 1.6);
    const pad = 28;
    const showNum = nomorChk.checked;
    const gutter = showNum ? String(lines.length).length * fs * 0.62 + 20 : 0;
    const font = fs + 'px ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = font;
    let maxW = 0;
    const tokenLines = lines.map((ln) => {
      const toks = tokenize(ln);
      const w = toks.reduce((a, t) => a + meas.measureText(t.s).width, 0);
      if (w > maxW) maxW = w;
      return toks;
    });
    let w = Math.ceil(pad * 2 + gutter + maxW);
    if (w > MAX_W) { w = MAX_W; clipped = true; }
    const h = pad * 2 + lines.length * lh;
    canvas.width = w; canvas.height = h;
    const x = canvas.getContext('2d');
    if (!x) { T.show(box, errBox('Browser ini tidak mendukung canvas.')); return; }
    x.fillStyle = th.bg;
    x.fillRect(0, 0, w, h);
    x.font = font;
    x.textBaseline = 'top';
    lines.forEach((ln, i) => {
      const y = pad + i * lh;
      let cx = pad + gutter;
      if (showNum) {
        x.fillStyle = th.line;
        x.textAlign = 'right';
        x.fillText(String(i + 1), pad + gutter - 12, y);
        x.textAlign = 'left';
      }
      tokenLines[i].forEach((tok) => {
        x.fillStyle = th[tok.t] || th.plain;
        x.fillText(tok.s, cx, y);
        cx += x.measureText(tok.s).width;
      });
    });
    prevWrap.hidden = false;
    T.show(box,
      kv('Ukuran', w + ' × ' + h + ' px') +
      kv('Baris', lines.length + ' baris') +
      (clipped ? '<p class="hint">Gambar dibatasi (maksimal ' + MAX_LINES + ' baris dan lebar ' + MAX_W + ' px) supaya tidak terlalu besar.</p>' : ''));
    box.appendChild(T.row(T.btn('Unduh PNG', async () => {
      pngBlob = await canvasToBlob(canvas, 'image/png');
      if (pngBlob) { T.dl('kode.png', pngBlob, 'image/png'); T.toast('PNG diunduh (' + fmtBytes(pngBlob.size) + ')'); }
      else T.toast('Gagal membuat PNG');
    }, true)));
    T.scrollToPreview(prevWrap);
  };

  const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
  chkRow.appendChild(nomorChk);
  chkRow.appendChild(T.el('<span>Tampilkan nomor baris</span>'));

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tempel kode, pilih tema dan ukuran font, lalu unduh sebagai gambar. Cocok untuk dibagikan ke chat atau media sosial. Pewarnaan sintaksnya sederhana (komentar, string, kata kunci, angka).</p>'));
  root.appendChild(T.field('Kode', ta));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.grid2(T.field('Tema', temaSel), T.field('Ukuran font', fontSel)));
  root.appendChild(chkRow);
  root.appendChild(T.row(T.btn('Buat gambar', gambar, true)));
  root.appendChild(box);
  root.appendChild(prevWrap);
}
