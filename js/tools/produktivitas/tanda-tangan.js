import { h as T, utils } from '../../core.js?v=6.10.0';

export const meta = {"id": "tanda-tangan", "name": "Tanda Tangan Digital", "cat": "produktivitas", "icon": "✍️", "desc": "Tanda tangan di layar pakai jari atau stylus, unduh sebagai gambar transparan untuk ditempel di dokumen.", "keywords": "tanda tangan,signature,ttd,canvas,transparan,dokumen"};

export function render(root) {

    const W = 640, H = 260;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.cssText = 'width:100%;max-width:640px;height:auto;touch-action:none;border:1px dashed rgba(255,255,255,.25);border-radius:12px;background:rgba(255,255,255,.06);cursor:crosshair;display:block';
    const ctx = canvas.getContext('2d');

    const tebalI = T.select([['2', 'Tipis'], ['3', 'Sedang'], ['5', 'Tebal'], ['7', 'Sangat tebal']], '3');
    const warnaI = T.select([['#111111', 'Hitam'], ['#1a3fd6', 'Biru']], '#111111');
    const box = T.out();

    let goresan = []; // [{titik:[[x,y]...], tebal, warna}]
    let aktif = null;

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    };

    const gambarUlang = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      goresan.forEach((g) => {
        if (g.titik.length < 2) return;
        ctx.strokeStyle = g.warna;
        ctx.lineWidth = g.tebal;
        ctx.beginPath();
        ctx.moveTo(g.titik[0][0], g.titik[0][1]);
        for (let i = 1; i < g.titik.length; i++) ctx.lineTo(g.titik[i][0], g.titik[i][1]);
        ctx.stroke();
      });
      const kosong = goresan.length === 0;
      T.show(box, kosong
        ? '<p class="dim center">Tanda tangan di kotak di atas dengan jari atau stylus.</p>'
        : '<p class="dim center">Sudah ada ' + goresan.length + ' goresan. Unduh bila sudah pas.</p>');
    };

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      aktif = { titik: [pos(e)], tebal: Number(tebalI.value), warna: warnaI.value };
      goresan.push(aktif);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!aktif) return;
      e.preventDefault();
      aktif.titik.push(pos(e));
      gambarUlang();
    });
    const selesai = (e) => { aktif = null; };
    canvas.addEventListener('pointerup', selesai);
    canvas.addEventListener('pointercancel', selesai);

    const undo = () => { goresan.pop(); gambarUlang(); };
    const hapus = () => { goresan = []; gambarUlang(); };

    const unduh = () => {
      if (goresan.length === 0) { T.toast('Belum ada tanda tangan'); return; }
      // Potong area kosong di sekeliling tanda tangan
      let minX = W, minY = H, maxX = 0, maxY = 0;
      goresan.forEach((g) => g.titik.forEach((p) => {
        minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
      }));
      const pad = 12;
      minX = Math.max(0, Math.floor(minX - pad)); minY = Math.max(0, Math.floor(minY - pad));
      const cw = Math.min(W - minX, Math.ceil(maxX - minX + pad * 2));
      const ch = Math.min(H - minY, Math.ceil(maxY - minY + pad * 2));
      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
      const a = document.createElement('a');
      a.href = out.toDataURL('image/png');
      a.download = 'tanda-tangan.png';
      a.click();
      T.toast('Gambar tanda tangan terunduh');
    };

    root.appendChild(T.el('<p class="note">Tanda tangan langsung di layar — hasilnya gambar PNG latar transparan, siap ditempel ke surat lamaran, formulir, atau dokumen lain. Semua dikerjakan di HP ini, tanpa dikirim ke server.</p>'));
    root.appendChild(canvas);
    root.appendChild(T.grid2(T.field('Ketebalan pena', tebalI), T.field('Warna tinta', warnaI)));
    root.appendChild(T.row(
      T.btn('⬇️ Unduh PNG', unduh, true),
      T.btn('↩️ Urungkan', undo),
      T.btn('🗑️ Hapus semua', hapus)
    ));
    root.appendChild(box);
    gambarUlang();

}
