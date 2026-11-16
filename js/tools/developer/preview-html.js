import { h as T, errBox } from '../../core.js?v=6.13.0';

export const meta = {"id":"preview-html","name":"Pratinjau HTML","cat":"developer","icon":"👁️","desc":"Tulis HTML dan lihat hasilnya langsung di bawah.","keywords":"html,preview,editor,kode,pratinjau,web","since":"6.11.0"};

/* Pratinjau HTML: textarea + iframe srcdoc dengan sandbox (allow-scripts
   saja, tanpa allow-same-origin) sehingga kode pratinjau tidak bisa
   mengakses halaman ini. Update otomatis saat mengetik (jeda 400 ms). */
const CONTOH = '<!DOCTYPE html>\n<html>\n<head>\n<style>\n  body { font-family: sans-serif; padding: 20px; background: #f5f5f4; color: #18181b; }\n  h1 { font-size: 24px; }\n  button { padding: 10px 18px; border: none; border-radius: 8px; background: #18181b; color: #fff; cursor: pointer; }\n</style>\n</head>\n<body>\n  <h1>Halo, ini pratinjau HTML</h1>\n  <p>Edit kode di atas, hasilnya langsung berubah di sini.</p>\n  <button onclick="document.getElementById(\'pesan\').textContent = \'Tombol ditekan!\'">Tekan saya</button>\n  <p id="pesan"></p>\n</body>\n</html>';

export function render(root) {
  const ta = T.ta(12, '<h1>Judul</h1>\n<p>Tulis HTML di sini…</p>');
  ta.value = CONTOH;
  ta.style.fontFamily = 'ui-monospace,Menlo,Consolas,monospace';
  ta.style.fontSize = '13px';
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.cssText = 'width:100%;height:380px;border:1px solid #ffffff20;border-radius:10px;background:#fff';
  const stat = T.el('<div class="hint"></div>');
  const box = T.out();
  let timer = 0;

  const update = () => {
    const html = ta.value;
    frame.srcdoc = html;
    const chars = html.length;
    stat.textContent = chars ? chars.toLocaleString('id-ID') + ' karakter · pratinjau diperbarui' : 'Pratinjau kosong, tulis HTML dulu';
  };
  ta.addEventListener('input', () => {
    clearTimeout(timer);
    stat.textContent = 'Mengetik…';
    timer = setTimeout(update, 400);
  });

  const bContoh = T.btn('Muat contoh', () => { ta.value = CONTOH; update(); });
  const bTab = T.btn('Buka di tab baru', () => {
    const html = ta.value.trim();
    if (!html) { T.show(box, errBox('Tulis HTML dulu.')); return; }
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  const bUnduh = T.btn('Unduh .html', () => {
    const html = ta.value;
    if (!html.trim()) { T.show(box, errBox('Tulis HTML dulu.')); return; }
    T.dl('halaman.html', html, 'text/html;charset=utf-8');
  });
  const bBersih = T.btn('Kosongkan', () => { ta.value = ''; update(); });

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tulis kode HTML di atas, hasilnya langsung terlihat di bawah tanpa perlu menekan apa-apa. Pratinjau berjalan terpisah di kotak aman, jadi kode di dalamnya tidak bisa mengakses halaman ini.</p>'));
  root.appendChild(T.field('Kode HTML', ta));
  root.appendChild(T.row(bContoh, bBersih));
  root.appendChild(T.el('<div class="hint" style="margin:12px 0 6px">Hasil:</div>'));
  root.appendChild(frame);
  root.appendChild(stat);
  root.appendChild(T.row(bTab, bUnduh));
  root.appendChild(box);
  update();
}
