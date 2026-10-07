import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.9.5';

export const meta = {"id": "stiker-wa", "name": "Stiker WA Maker", "cat": "gambar", "icon": "💬", "desc": "Ubah foto jadi stiker WhatsApp 512×512 siap pakai.", "keywords": "stiker,whatsapp,wa,sticker,stiker wa,png,512"};
export function render(root) {

    const fileI = fileInput('image/*');
    const box = T.out();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'max-width:100%;border-radius:12px;display:block;margin:0 auto;touch-action:none;cursor:move';
    const off = document.createElement('canvas'); // gambar asli (downscale)
    let hasImg = false, drag = null;
    let crop = { x: 0, y: 0, s: 0 }; // dalam koordinat canvas preview

    const sizeR = T.input('range'); sizeR.min = '20'; sizeR.max = '100'; sizeR.value = '100';
    const sizeV = T.el('<b>100%</b>');
    const padR = T.input('range'); padR.min = '0'; padR.max = '64'; padR.value = '16';
    const padV = T.el('<b>16px</b>');
    sizeR.addEventListener('input', () => { sizeV.textContent = sizeR.value + '%'; clampCrop(); render2(); });
    padR.addEventListener('input', () => { padV.textContent = padR.value + 'px'; });

    function ctx2d(c) {
        try { return c.getContext('2d'); } catch (e) { return null; }
    }
    function clampCrop() {
        if (!hasImg) return;
        const pct = parseInt(sizeR.value, 10) / 100;
        const s = Math.max(24, Math.min(canvas.width, canvas.height) * pct);
        crop.s = s;
        crop.x = Math.min(Math.max(crop.x, 0), canvas.width - s);
        crop.y = Math.min(Math.max(crop.y, 0), canvas.height - s);
    }
    function render2() {
        if (!hasImg) return;
        const ctx = ctx2d(canvas);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
            // gelapkan area di luar crop
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, canvas.width, crop.y);
            ctx.fillRect(0, crop.y + crop.s, canvas.width, canvas.height - crop.y - crop.s);
            ctx.fillRect(0, crop.y, crop.x, crop.s);
            ctx.fillRect(crop.x + crop.s, crop.y, canvas.width - crop.x - crop.s, crop.s);
            // garis kotak crop
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.setLineDash([10, 8]);
            ctx.strokeRect(crop.x, crop.y, crop.s, crop.s);
            ctx.setLineDash([]);
        } catch (e) { T.toast('Gagal menggambar: ' + (e && e.message ? e.message : e)); }
    }
    function evPos(e) {
        const r = canvas.getBoundingClientRect();
        const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
        return {
            x: (t.clientX - r.left) * (canvas.width / r.width),
            y: (t.clientY - r.top) * (canvas.height / r.height),
        };
    }
    canvas.addEventListener('pointerdown', (e) => {
        if (!hasImg) return;
        e.preventDefault();
        const p = evPos(e);
        drag = { dx: p.x - crop.x, dy: p.y - crop.y };
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const p = evPos(e);
        crop.x = p.x - drag.dx;
        crop.y = p.y - drag.dy;
        clampCrop();
        render2();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('pointercancel', () => { drag = null; });

    async function onFile() {
        if (!fileI.files[0]) return;
        let img;
        try { img = await loadImage(fileI.files[0]); }
        catch (e) { T.toast('File bukan gambar yang valid'); return; }
        const ctx = ctx2d(off);
        if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
        try {
            const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
            off.width = Math.round(img.naturalWidth * s);
            off.height = Math.round(img.naturalHeight * s);
            ctx.drawImage(img, 0, 0, off.width, off.height);
            canvas.width = off.width; canvas.height = off.height;
            const m = Math.min(canvas.width, canvas.height);
            crop = { x: (canvas.width - m) / 2, y: (canvas.height - m) / 2, s: m };
            sizeR.value = '100'; sizeV.textContent = '100%';
            hasImg = true;
            render2();
            T.show(box, '');
            box.appendChild(canvas);
            T.toast('Geser kotak untuk memilih area stiker');
        } catch (e) { T.toast('Gagal memuat gambar: ' + (e && e.message ? e.message : e)); }
    }
    fileI.addEventListener('change', onFile);

    const dlB = T.btn('Unduh stiker PNG 512×512', async () => {
        if (!hasImg) { T.toast('Pilih foto dulu'); return; }
        try {
            const S = 512;
            const pad = Math.min(64, Math.max(0, parseInt(padR.value, 10) || 0));
            const c = document.createElement('canvas');
            c.width = S; c.height = S;
            const ctx = ctx2d(c);
            if (!ctx) { T.toast('Canvas tidak tersedia di perangkat ini'); return; }
            const scale = off.width / canvas.width; // rasio gambar asli vs preview
            const sx = crop.x * scale, sy = crop.y * scale, ss = Math.max(1, crop.s * scale);
            const inner = Math.max(1, S - pad * 2);
            ctx.clearRect(0, 0, S, S); // latar transparan (syarat stiker WA)
            ctx.drawImage(off, sx, sy, ss, ss, pad, pad, inner, inner);
            const blob = await canvasToBlob(c, 'image/png');
            if (!blob) { T.toast('Gagal membuat gambar'); return; }
            T.dl('stiker-wa.png', blob, 'image/png');
            T.toast('Stiker siap! Tambahkan via aplikasi pembuat stiker WA');
        } catch (e) { T.toast('Gagal: ' + (e && e.message ? e.message : e)); }
    }, true);

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
    root.appendChild(T.field('Pilih foto', fileI));
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(sizeR); sRow.appendChild(sizeV);
    root.appendChild(T.field('Ukuran area stiker', sRow));
    const pRow = T.el('<div class="row"></div>');
    pRow.appendChild(padR); pRow.appendChild(padV);
    root.appendChild(T.field('Jarak tepi (padding)', pRow));
    root.appendChild(T.row(dlB));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Geser kotak putih di foto untuk memilih area yang jadi stiker. Hasilnya PNG 512×512 berlatar transparan, sesuai syarat stiker WhatsApp — tinggal diimport lewat aplikasi pembuat stiker (mis. Sticker Maker).</p>'));
    T.onLeave(() => { hasImg = false; drag = null; });

}
