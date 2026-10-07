import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.9.5';

export const meta = {"id": "bentuk-foto", "name": "Crop Bentuk Foto", "cat": "gambar", "icon": "⭐", "desc": "Crop foto jadi lingkaran, hati, bintang, atau sudut bulat.", "keywords": "crop,bentuk,lingkaran,hati,bintang,rounded,foto profil,png"};
export function render(root) {

    const fileI = fileInput('image/*');
    const shapeSel = T.select([
        ['lingkaran', '⭕ Lingkaran'],
        ['rounded', '▢ Kotak sudut bulat'],
        ['hati', '❤️ Hati'],
        ['bintang', '⭐ Bintang'],
    ], 'lingkaran');
    const radR = T.input('range'); radR.min = '0'; radR.max = '50'; radR.value = '20';
    const radV = T.el('<b>20%</b>');
    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:0 auto';
    let hasImg = false, imgW = 0, imgH = 0;
    let imgObj = null;

    shapeSel.addEventListener('change', render2);
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
    }
    function heartPath(ctx, S) {
        const x = S / 2, y = S / 2, s = S / 2;
        ctx.moveTo(x, y + s * 0.78);
        ctx.bezierCurveTo(x - s * 1.3, y - s * 0.02, x - s * 0.62, y - s * 0.95, x, y - s * 0.32);
        ctx.bezierCurveTo(x + s * 0.62, y - s * 0.95, x + s * 1.3, y - s * 0.02, x, y + s * 0.78);
    }
    function starPath(ctx, S) {
        const cx = S / 2, cy = S / 2, R = S / 2, r = R * 0.42;
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5;
            const rad = i % 2 === 0 ? R : r;
            const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
    }
    // Gambar ke canvas target: foto (center-square crop) di-clip bentuk, latar transparan.
    function drawShaped(ctx, S) {
        const kind = shapeSel.value;
        ctx.clearRect(0, 0, S, S);
        ctx.save();
        ctx.beginPath();
        if (kind === 'lingkaran') { ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); }
        else if (kind === 'rounded') { roundRectPath(ctx, 0, 0, S, S, S * (parseInt(radR.value, 10) || 0) / 100); }
        else if (kind === 'hati') { heartPath(ctx, S); }
        else if (kind === 'bintang') { starPath(ctx, S); }
        ctx.closePath();
        ctx.clip();
        const s0 = Math.min(imgW, imgH); // crop persegi tengah dari foto asli
        const sx = (imgW - s0) / 2, sy = (imgH - s0) / 2;
        ctx.drawImage(imgObj, sx, sy, s0, s0, 0, 0, S, S);
        ctx.restore();
    }
    function render2() {
        if (!hasImg || !imgObj) return;
        const S = Math.min(1000, Math.max(320, Math.min(imgW, imgH)));
        canvas.width = S; canvas.height = S;
        const ctx = ctx2d(canvas);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        try { drawShaped(ctx, S); }
        catch (e) { T.toast('Gagal menggambar: ' + (e && e.message ? e.message : e)); }
    }

    async function onFile() {
        if (!fileI.files[0]) return;
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const ctx = ctx2d(canvas);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        imgObj = img; imgW = img.naturalWidth; imgH = img.naturalHeight;
        hasImg = true;
        render2();
        T.show(box, '');
        box.appendChild(canvas);
    }
    fileI.addEventListener('change', onFile);

    const dlB = T.btn('Unduh PNG', async () => {
        if (!hasImg || !imgObj) { T.toast('Pilih foto dulu'); return; }
        try {
            const S = Math.min(1600, Math.min(imgW, imgH));
            const c = document.createElement('canvas');
            c.width = S; c.height = S;
            const ctx = ctx2d(c);
            if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
            drawShaped(ctx, S);
            const blob = await canvasToBlob(c, 'image/png');
            if (!blob) { T.toast('Gagal membuat gambar'); return; }
            T.dl('foto-' + shapeSel.value + '.png', blob, 'image/png');
            T.toast('Berhasil diunduh');
        } catch (e) { T.toast('Gagal: ' + (e && e.message ? e.message : e)); }
    }, true);

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    root.appendChild(T.field('Bentuk', shapeSel));
    const rRow = T.el('<div class="row"></div>');
    rRow.appendChild(radR); rRow.appendChild(radV);
    root.appendChild(T.field('Kebulatan sudut (khusus kotak)', rRow));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Foto diambil dari area persegi di tengah, lalu dipotong mengikuti bentuk pilihan. Hasil PNG berlatar transparan — cocok untuk foto profil atau hiasan.</p>'));
    T.onLeave(() => { hasImg = false; imgObj = null; });

}
