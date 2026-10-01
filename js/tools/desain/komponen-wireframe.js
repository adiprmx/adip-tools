import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "komponen-wireframe", "name": "Komponen Wireframe", "cat": "desain", "icon": "🧩", "desc": "Wireframe grayscale siap pakai: tombol, kartu, navbar, dll.", "keywords": "wireframe,komponen,desain,html,ui,mockup"};

const G = '#27272a', L = '#3f3f46', B = '#18181b', FG = '#a1a1aa';

export const KOMPONEN = {
  tombol: { label: 'Tombol', html:
`<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
  <button style="background:#fff;color:#000;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600">Tombol Utama</button>
  <button style="background:transparent;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:10px 22px;font-size:14px">Tombol Sekunder</button>
  <button style="background:#27272a;color:#a1a1aa;border:none;border-radius:8px;padding:10px 22px;font-size:14px;opacity:.6">Nonaktif</button>
</div>` },
  kartu: { label: 'Kartu', html:
`<div style="max-width:320px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden">
  <div style="height:150px;background:#27272a"></div>
  <div style="padding:16px">
    <div style="height:14px;width:70%;background:#3f3f46;border-radius:4px;margin-bottom:10px"></div>
    <div style="height:10px;width:100%;background:#27272a;border-radius:4px;margin-bottom:6px"></div>
    <div style="height:10px;width:85%;background:#27272a;border-radius:4px;margin-bottom:14px"></div>
    <button style="background:#fff;color:#000;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600">Aksi</button>
  </div>
</div>` },
  navbar: { label: 'Navbar', html:
`<nav style="display:flex;align-items:center;justify-content:space-between;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:12px 18px">
  <div style="width:90px;height:22px;background:#fff;border-radius:6px"></div>
  <div style="display:flex;gap:16px">
    <div style="width:52px;height:12px;background:#3f3f46;border-radius:4px"></div>
    <div style="width:52px;height:12px;background:#3f3f46;border-radius:4px"></div>
    <div style="width:52px;height:12px;background:#3f3f46;border-radius:4px"></div>
  </div>
  <button style="background:#fff;color:#000;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600">Masuk</button>
</nav>` },
  login: { label: 'Form Login', html:
`<form style="max-width:320px;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px">
  <div style="height:16px;width:50%;background:#3f3f46;border-radius:4px;margin:0 auto 20px"></div>
  <input placeholder="Email" style="width:100%;box-sizing:border-box;background:#000;border:1px solid #3f3f46;border-radius:8px;padding:10px 12px;color:#fff;margin-bottom:10px">
  <input placeholder="Kata sandi" type="password" style="width:100%;box-sizing:border-box;background:#000;border:1px solid #3f3f46;border-radius:8px;padding:10px 12px;color:#fff;margin-bottom:16px">
  <button style="width:100%;background:#fff;color:#000;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:600">Masuk</button>
</form>` },
  pricing: { label: 'Pricing', html:
`<div style="display:flex;gap:12px;flex-wrap:wrap">
  <div style="flex:1;min-width:160px;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;text-align:center">
    <div style="height:12px;width:60%;background:#3f3f46;border-radius:4px;margin:0 auto 12px"></div>
    <div style="height:26px;width:50%;background:#fff;border-radius:6px;margin:0 auto 14px"></div>
    <div style="height:10px;width:80%;background:#27272a;border-radius:4px;margin:0 auto 6px"></div>
    <div style="height:10px;width:70%;background:#27272a;border-radius:4px;margin:0 auto 16px"></div>
    <button style="background:transparent;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:8px 18px;font-size:13px">Pilih</button>
  </div>
  <div style="flex:1;min-width:160px;background:#27272a;border:2px solid #fff;border-radius:12px;padding:20px;text-align:center">
    <div style="height:12px;width:60%;background:#52525b;border-radius:4px;margin:0 auto 12px"></div>
    <div style="height:26px;width:50%;background:#fff;border-radius:6px;margin:0 auto 14px"></div>
    <div style="height:10px;width:80%;background:#3f3f46;border-radius:4px;margin:0 auto 6px"></div>
    <div style="height:10px;width:70%;background:#3f3f46;border-radius:4px;margin:0 auto 16px"></div>
    <button style="background:#fff;color:#000;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600">Pilih</button>
  </div>
</div>` },
  testimoni: { label: 'Testimoni', html:
`<div style="max-width:360px;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px">
  <div style="color:#52525b;font-size:28px;line-height:1;margin-bottom:8px">&ldquo;</div>
  <div style="height:10px;width:100%;background:#27272a;border-radius:4px;margin-bottom:6px"></div>
  <div style="height:10px;width:92%;background:#27272a;border-radius:4px;margin-bottom:16px"></div>
  <div style="display:flex;align-items:center;gap:10px">
    <div style="width:38px;height:38px;border-radius:50%;background:#3f3f46"></div>
    <div>
      <div style="height:11px;width:90px;background:#3f3f46;border-radius:4px;margin-bottom:5px"></div>
      <div style="height:9px;width:60px;background:#27272a;border-radius:4px"></div>
    </div>
  </div>
</div>` },
};

export function render(root) {
  const KEYS = Object.keys(KOMPONEN);
  const sel = T.select(KEYS.map((k) => [k, KOMPONEN[k].label]), 'tombol');
  const prevBox = T.el('<div style="margin:12px 0"></div>');
  const kodeBox = T.el('<div style="margin:12px 0"></div>');
  const salinBtn = T.copyBtn(() => KOMPONEN[sel.value].html, 'Salin kode HTML');

  function gambar() {
    const k = KOMPONEN[sel.value];
    prevBox.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:8px">Pratinjau:</div>' + k.html;
    kodeBox.innerHTML = '<div class="dim" style="font-size:12px;margin-bottom:8px">Kode HTML:</div>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12px;line-height:1.5;overflow-x:auto;max-height:260px;overflow-y:auto">' +
      T.esc(k.html) + '</pre>';
  }

  sel.addEventListener('change', gambar);
  root.append(
    T.el('<p class="dim" style="font-size:13px">Pilih komponen, lihat pratinjaunya, lalu salin kode HTML-nya. Semua grayscale, tinggal ganti warna sesuai brand kamu.</p>'),
    T.field('Pilih komponen', sel),
    prevBox, kodeBox, salinBtn
  );
  gambar();
}
