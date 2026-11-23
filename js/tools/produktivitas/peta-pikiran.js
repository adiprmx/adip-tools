import { h as T } from '../../core.js';

// Peta pikiran: simpul (node) yang bisa digeser, ditambah, diubah, dan dihapus.
// Disimpan otomatis di browser ini (localStorage), bisa diunduh sebagai PNG.
const LS_KEY = 'adiptools:peta-pikiran';
const SVGNS = 'http://www.w3.org/2000/svg';
const W = 900, H = 560;

const bawaan = () => ([
  { id: 'n0', x: 450, y: 260, text: 'Ide utama', parent: null },
  { id: 'n1', x: 200, y: 120, text: 'Cabang 1', parent: 'n0' },
  { id: 'n2', x: 700, y: 120, text: 'Cabang 2', parent: 'n0' },
  { id: 'n3', x: 450, y: 430, text: 'Cabang 3', parent: 'n0' },
]);

function bungkusTeks(teks, maksKarakter) {
  const kata = String(teks || '').split(/\s+/).filter(Boolean);
  const baris = [];
  let cur = '';
  kata.forEach((w) => {
    if ((cur + ' ' + w).trim().length > maksKarakter && cur) { baris.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  });
  if (cur) baris.push(cur);
  return baris.slice(0, 3);
}

export const meta = {"id": "peta-pikiran", "name": "Peta Pikiran", "cat": "produktivitas", "icon": "🧠", "desc": "Petakan ide jadi cabang-cabang yang rapi. Geser, tambah, dan simpan otomatis.", "keywords": "mind map,peta pikiran,ide,brainstorm,cabang,diagram", "since": "6.16.0"};
export function render(root) {
  let nodes;
  // Simpul valid = objek dengan id string, x/y angka berhingga, text string.
  // Validasi bentuk ini mencegah localStorage korup ([null], [{"x":1}], ...)
  // mematikan tool di nodes[0].id (RED-04, v6.16.0): data tak valid apa pun
  // jatuh ke state bawaan yang valid, tool tetap tampil dan bisa dipakai.
  const simpulValid = (n) => n && typeof n === 'object' && typeof n.id === 'string' && Number.isFinite(n.x) && Number.isFinite(n.y) && typeof n.text === 'string';
  try {
    const raw = localStorage.getItem(LS_KEY);
    nodes = raw ? JSON.parse(raw) : bawaan();
    if (!Array.isArray(nodes) || !nodes.length || !nodes.every(simpulValid)) nodes = bawaan();
  } catch (e) { nodes = bawaan(); }
  let terpilih = nodes[0].id;
  let counter = nodes.length;

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.cssText = 'width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;touch-action:none';
  const gKonek = document.createElementNS(SVGNS, 'g');
  const gNode = document.createElementNS(SVGNS, 'g');
  svg.appendChild(gKonek); svg.appendChild(gNode);

  const teksI = T.input('text', 'Teks simpul yang dipilih', '');
  const simpan = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(nodes)); } catch (e) { /* abaikan */ } };

  const gambar = () => {
    gKonek.innerHTML = ''; gNode.innerHTML = '';
    const byId = {};
    nodes.forEach((n) => { byId[n.id] = n; });
    nodes.forEach((n) => {
      if (!n.parent || !byId[n.parent]) return;
      const p = byId[n.parent];
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', p.x); line.setAttribute('y1', p.y);
      line.setAttribute('x2', n.x); line.setAttribute('y2', n.y);
      line.setAttribute('stroke', '#ff6f61'); line.setAttribute('stroke-width', '2');
      line.setAttribute('opacity', '0.6');
      gKonek.appendChild(line);
    });
    nodes.forEach((n) => {
      const baris = bungkusTeks(n.text, 16);
      const lebar = Math.max(96, Math.min(200, Math.max(...baris.map((b) => b.length)) * 8 + 28));
      const tinggi = 28 + baris.length * 18;
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('transform', 'translate(' + (n.x - lebar / 2) + ',' + (n.y - tinggi / 2) + ')');
      g.style.cursor = 'grab';
      const rect = document.createElementNS(SVGNS, 'rect');
      rect.setAttribute('width', lebar); rect.setAttribute('height', tinggi);
      rect.setAttribute('rx', '10');
      rect.setAttribute('fill', n.id === terpilih ? '#ff6f61' : '#2a2420');
      rect.setAttribute('stroke', n.id === terpilih ? '#fff' : 'rgba(255,255,255,.25)');
      rect.setAttribute('stroke-width', n.id === terpilih ? '2' : '1');
      g.appendChild(rect);
      baris.forEach((b, i) => {
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', lebar / 2); t.setAttribute('y', 22 + i * 18);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', n.id === terpilih ? '#161311' : '#f4f4f5');
        t.setAttribute('font-size', '14');
        t.setAttribute('font-family', 'inherit');
        t.textContent = b;
        g.appendChild(t);
      });
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        terpilih = n.id;
        teksI.value = n.text;
        gambar();
        const r = svg.getBoundingClientRect();
        const gerak = (ev) => {
          n.x = Math.max(50, Math.min(W - 50, (ev.clientX - r.left) * W / r.width));
          n.y = Math.max(30, Math.min(H - 30, (ev.clientY - r.top) * H / r.height));
          gambar();
        };
        const lepas = () => {
          window.removeEventListener('pointermove', gerak);
          window.removeEventListener('pointerup', lepas);
          simpan();
        };
        window.addEventListener('pointermove', gerak);
        window.addEventListener('pointerup', lepas);
      });
      gNode.appendChild(g);
    });
  };

  teksI.addEventListener('input', () => {
    const n = nodes.find((x) => x.id === terpilih);
    if (n) { n.text = teksI.value; gambar(); simpan(); }
  });

  const tambahBtn = T.btn('＋ Tambah cabang', () => {
    const induk = nodes.find((x) => x.id === terpilih) || nodes[0];
    counter += 1;
    const anak = {
      id: 'n' + Date.now().toString(36) + counter,
      x: Math.max(60, Math.min(W - 60, induk.x + 160 * (nodes.length % 2 === 0 ? 1 : -1))),
      y: Math.max(40, Math.min(H - 40, induk.y + 110)),
      text: 'Cabang baru', parent: induk.id,
    };
    nodes.push(anak);
    terpilih = anak.id;
    teksI.value = anak.text;
    gambar(); simpan();
    teksI.focus(); teksI.select();
  });
  const hapusBtn = T.btn('🗑 Hapus simpul', () => {
    if (nodes.length <= 1) { T.toast('Simpul terakhir tidak bisa dihapus'); return; }
    const simpulHapus = nodes.find((n) => n.id === terpilih);
    if (!confirm('Hapus simpul "' + (simpulHapus ? simpulHapus.text : '') + '" beserta semua cabangnya? Data ini akan hilang dan tidak bisa dikembalikan.')) return;
    const hapus = new Set([terpilih]);
    let berubah = true;
    while (berubah) {
      berubah = false;
      nodes.forEach((n) => { if (n.parent && hapus.has(n.parent) && !hapus.has(n.id)) { hapus.add(n.id); berubah = true; } });
    }
    nodes = nodes.filter((n) => !hapus.has(n.id));
    terpilih = nodes[0].id;
    teksI.value = nodes[0].text;
    gambar(); simpan();
  });
  const unduhBtn = T.btn('⬇ Unduh PNG', () => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', SVGNS);
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const cx = c.getContext('2d');
      cx.fillStyle = '#161311'; cx.fillRect(0, 0, W, H);
      cx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'peta-pikiran.png';
      a.click();
    };
    img.onerror = () => { URL.revokeObjectURL(url); T.toast('Gambar gagal dibuat, coba lagi'); };
    img.src = url;
  });

  root.appendChild(T.el('<p class="note">Ketuk simpul untuk memilihnya, geser untuk memindah, lalu ubah tulisannya di bawah. Peta tersimpan otomatis di browser ini.</p>'));
  root.appendChild(svg);
  root.appendChild(T.field('Teks simpul yang dipilih', teksI, 'Ketik untuk mengubah isi simpul'));
  const tombol = T.el('<div class="row" style="flex-wrap:wrap;gap:8px"></div>');
  tombol.appendChild(tambahBtn); tombol.appendChild(hapusBtn); tombol.appendChild(unduhBtn);
  root.appendChild(tombol);

  teksI.value = nodes[0].text;
  gambar();
}
