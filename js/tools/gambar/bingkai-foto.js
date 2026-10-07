import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.9.5';

export const meta = {"id": "bingkai-foto", "name": "Bingkai Foto", "cat": "gambar", "icon": "🖼️", "desc": "Tambah bingkai warna ke foto, atur tebal & sudutnya.", "keywords": "bingkai,frame,border,foto,warna,tebal,sudut,png"};
export function render(root) {

    const fileI = fileInput('image/*');
    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto';
    const off = document.createElement('canvas'); // foto asli (downscale)
    let hasImg = false;

    const colI = T.input('color'); colI.value = '#ffffff';
    const swRow = T.el('<div class="row" style="flex-wrap:wrap"></div>');
    const presets = [
        ['#ffffff', 'Putih'], ['#000000', 'Hitam'], ['#ef4444', 'Merah'],
        ['#22c55e', 'Hijau'], ['#3b82f6', 'Biru'], ['#f59e0b', 'Kuning'],
        ['#ec4899', 'Pink'], ['#8b5cf6', 'Ungu'],
    ];
    presets.forEach(([hex, nama]) => {
        const b = T.el('<button type="button" aria-label="' + T.esc(nama) + '" title="' + T.esc(nama) + '" style="width:30px;height:30px;border-radius:8px;border:1px solid #ffffff30;background:' + hex + ';cursor:pointer;padding:0"></button>');
        b.addEventListener('click', () => { colI.value = hex; render2(); });
        swRow.appendChild(b);
    });

    const thickR = T.input('range'); thickR.min = '4'; thickR.max = '120'; thickR.value = '36';
    const thickV = T.el('<b>36px</b>');
    const radR = T.input('range'); radR.min = '0'; radR.max = '30'; radR.value = '6';
    const radV = T.el('<b>6%</b>');

    colI.addEventListener('input', render2);
    thickR.addEventListener('input', () => { thickV.textContent = thickR.value + 'px'; render2(); });
    radR.addEventListener('input', () => { radV.textContent = radR.value + '%'; render2(); });

    function ctx2d(c) {
        try { return c.getContext('2d'); } catch (e) { return null; }
    }
    function roundRectPath(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    // Komposisi: kanvas = foto + bingkai di luar; sudut luar bisa membulat.
    // baseW = lebar foto pada resolusi target; thick di-scale proporsional.
    function drawFramed(ctx, baseW, baseH) {
        const color = colI.value || '#ffffff';
        const t = Math.max(1, Math.round(parseInt(thickR.value, 10) * (baseW / off.width)));
        const W = baseW + t * 2, H = baseH + t * 2;
        const rad = Math.min(W, H) * (parseInt(radR.value, 10) || 0) / 100;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = color;
        ctx.beginPath();
        roundRectPath(ctx, 0.5, 0.5, W - 1, H - 1, rad);
        ctx.fill();
        ctx.drawImage(off, 0, 0, off.width, off.height, t, t, baseW, baseH);
        return { W, H };
    }
    function render2() {
        if (!hasImg) return;
        const ctx = ctx2d(canvas);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        try {
            const s = Math.min(1, 900 / Math.max(off.width, off.height));
            const bw = Math.max(1, Math.round(off.width * s)), bh = Math.max(1, Math.round(off.height * s));
            canvas.width = bw + Math.round(parseInt(thickR.value, 10) * s) * 2;
            canvas.height = bh + Math.round(parseInt(thickR.value, 10) * s) * 2;
            drawFramed(ctx, bw, bh);
        } catch (e) { T.toast('Gagal menggambar: ' + (e && e.message ? e.message : e)); }
    }

    async function onFile() {
        if (!fileI.files[0]) return;
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const ctx = ctx2d(off);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        try {
            const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
            off.width = Math.max(1, Math.round(img.naturalWidth * s));
            off.height = Math.max(1, Math.round(img.naturalHeight * s));
            ctx.drawImage(img, 0, 0, off.width, off.height);
            hasImg = true;
            render2();
            T.show(box, '');
            box.appendChild(canvas);
        } catch (e) { T.toast('Gagal memuat gambar: ' + (e && e.message ? e.message : e)); }
    }
    fileI.addEventListener('change', onFile);

    const dlB = T.btn('Unduh PNG', async () => {
        if (!hasImg) { T.toast('Pilih foto dulu'); return; }
        try {
            const c = document.createElement('canvas');
            const t = Math.max(1, parseInt(thickR.value, 10) || 0);
            c.width = off.width + t * 2;
            c.height = off.height + t * 2;
            const ctx = ctx2d(c);
            if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
            drawFramed(ctx, off.width, off.height); // resolusi penuh
            const blob = await canvasToBlob(c, 'image/png');
            if (!blob) { T.toast('Gagal membuat gambar'); return; }
            T.dl('foto-bingkai.png', blob, 'image/png');
            T.toast('Berhasil diunduh');
        } catch (e) { T.toast('Gagal: ' + (e && e.message ? e.message : e)); }
    }, true);

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    const cRow = T.el('<div class="row"></div>');
    cRow.appendChild(colI);
    root.appendChild(T.field('Warna bingkai', cRow));
    root.appendChild(T.field('Warna cepat', swRow));
    const tRow = T.el('<div class="row"></div>');
    tRow.appendChild(thickR); tRow.appendChild(thickV);
    root.appendChild(T.field('Ketebalan bingkai', tRow));
    const rRow = T.el('<div class="row"></div>');
    rRow.appendChild(radR); rRow.appendChild(radV);
    root.appendChild(T.field('Kebulatan sudut bingkai', rRow));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Bingkai ditambahkan di luar foto (ukuran foto tidak berubah). Preview tampil langsung setiap pengaturan diganti.</p>'));
    T.onLeave(() => { hasImg = false; });

}
