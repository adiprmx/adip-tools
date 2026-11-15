import { h as T, utils, esc, fileInput } from '../../core.js?v=6.12.1';

// Logika murni (bisa di-test di Node): susun satu file HTML halaman tautan.
utils.buatBioLinkHTML = function (d) {
  const nama = esc(d.nama || 'Nama Saya');
  const bio = esc(d.bio || '');
  const tema = d.tema === 'terang' ? 'terang' : 'gelap';
  const latar = tema === 'terang' ? '#f4f4f5' : '#0a0a0a';
  const teks = tema === 'terang' ? '#18181b' : '#f4f4f5';
  const redup = tema === 'terang' ? '#52525b' : '#a1a1aa';
  const tombol = tema === 'terang' ? '#18181b' : '#f4f4f5';
  const tombolTeks = tema === 'terang' ? '#ffffff' : '#18181b';
  const foto = d.foto
    ? `<img src="${esc(d.foto)}" alt="" style="width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 16px">`
    : `<div style="width:96px;height:96px;border-radius:50%;background:${tombol};color:${tombolTeks};display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;margin:0 auto 16px">${esc((d.nama || 'N').trim().charAt(0).toUpperCase())}</div>`;
  /* hanya skema aman yang jadi tautan (T04 S3): javascript: dibuang href-nya */
  const okUrl = (u) => /^(https?:|mailto:|tel:)/i.test(String(u || '').trim());
  const gayaTombol = `display:block;text-align:center;padding:14px 16px;margin:0 0 12px;border-radius:12px;background:${tombol};color:${tombolTeks};text-decoration:none;font-size:15px;font-weight:600`;
  const tautan = (d.tautan || []).filter((t) => t.label && t.url).map((t) =>
    okUrl(t.url)
      ? `<a href="${esc(t.url)}" target="_blank" rel="noopener" style="${gayaTombol}">${esc(t.label)}</a>`
      : `<span style="${gayaTombol}">${esc(t.label)}</span>`
  ).join('\n    ');
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + nama + '</title>\n' +
    '<style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:' + latar + ';color:' + teks + '}.wrap{max-width:480px;margin:0 auto;padding:48px 20px 64px}h1{text-align:center;font-size:24px;margin:0 0 8px}p{text-align:center;color:' + redup + ';font-size:15px;line-height:1.6;margin:0 0 28px}</style>\n</head>\n<body>\n<div class="wrap">\n' +
    foto + '\n<h1>' + nama + '</h1>\n' + (bio ? '<p>' + bio + '</p>\n' : '') + tautan + '\n</div>\n</body>\n</html>\n';
};

export const meta = {"id": "bio-link", "name": "Bio Link", "cat": "produktivitas", "icon": "🔗", "desc": "Susun halaman tautanmu sendiri, unduh sebagai file HTML.", "keywords": "bio link,linktree,tautan,bio instagram,halaman tautan,link bio", "since": "6.11.0"};

export function render(root) {
  const nama = T.input('text', 'Contoh: Nadhif Aslam', '');
  const bio = T.ta(2, 'Satu dua kalimat tentangmu. Contoh: Jual akun premium dan jasa desain.', '');
  const fotoInput = fileInput('image/*');
  const tema = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const box = T.out();
  let fotoDataUrl = '';
  const daftarTautan = [];

  const wadahTautan = document.createElement('div');
  const pratinjau = document.createElement('iframe');
  pratinjau.style.cssText = 'width:100%;height:420px;border:1px solid #2a2a2a;border-radius:12px;background:#0a0a0a;margin-top:12px';
  pratinjau.title = 'Pratinjau halaman tautan';
  pratinjau.setAttribute('sandbox', 'allow-popups');

  function barisTautan(label, url) {
    const l = T.input('text', 'Label, contoh: Instagram', label || '');
    const u = T.input('text', 'Alamat, contoh: https://instagram.com/nama', url || '');
    const hapus = T.btn('Hapus', () => {
      const i = daftarTautan.findIndex((t) => t.row === row);
      if (i >= 0) daftarTautan.splice(i, 1);
      row.remove();
      perbaruiPratinjau();
    });
    const row = T.el('<div style="margin-bottom:10px"></div>');
    row.appendChild(T.grid2(T.field('Label tautan', l), T.field('Alamat tautan', u)));
    row.appendChild(hapus);
    daftarTautan.push({ row, l, u });
    return row;
  }

  function kumpulkan() {
    return {
      nama: nama.value.trim(),
      bio: bio.value.trim(),
      foto: fotoDataUrl,
      tema: tema.value,
      tautan: daftarTautan.map((t) => ({ label: t.l.value.trim(), url: t.u.value.trim() }))
    };
  }

  function perbaruiPratinjau() {
    pratinjau.srcdoc = utils.buatBioLinkHTML(kumpulkan());
  }

  fotoInput.addEventListener('change', () => {
    const f = fotoInput.files && fotoInput.files[0];
    if (!f) { fotoDataUrl = ''; perbaruiPratinjau(); return; }
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sisi = 192;
        const c = document.createElement('canvas');
        c.width = sisi; c.height = sisi;
        const ctx = c.getContext('2d');
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, sisi, sisi);
        fotoDataUrl = c.toDataURL('image/jpeg', 0.85);
        perbaruiPratinjau();
      };
      img.onerror = () => { T.toast('Foto tidak bisa dibaca'); };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });

  [nama, bio, tema].forEach((el) => el.addEventListener('input', perbaruiPratinjau));
  wadahTautan.appendChild(barisTautan('Instagram', ''));
  wadahTautan.appendChild(barisTautan('WhatsApp', ''));

  root.appendChild(T.el('<p class="note">Adip Tools tidak meng-host halamanmu. File HTML yang kamu unduh adalah milikmu sendiri, unggah ke hosting mana saja atau kirim langsung ke orang lain.</p>'));
  root.appendChild(T.field('Nama yang tampil', nama));
  root.appendChild(T.field('Bio singkat', bio));
  root.appendChild(T.field('Foto profil (opsional)', fotoInput));
  root.appendChild(T.field('Tema halaman', tema));
  root.appendChild(T.el('<h3 style="margin-top:20px">Daftar tautan</h3>'));
  root.appendChild(wadahTautan);
  root.appendChild(T.row(
    T.btn('Tambah tautan', () => { wadahTautan.appendChild(barisTautan('', '')); perbaruiPratinjau(); }),
    T.btn('Unduh file HTML', () => {
      const d = kumpulkan();
      if (!d.nama) { T.toast('Isi dulu namanya'); return; }
      if (!d.tautan.some((t) => t.label && t.url)) { T.toast('Isi minimal satu tautan'); return; }
      T.dl('bio-link.html', utils.buatBioLinkHTML(d), 'text/html;charset=utf-8');
      T.toast('File HTML berhasil diunduh');
    }, true)
  ));
  root.appendChild(T.el('<h3 style="margin-top:20px">Pratinjau langsung</h3>'));
  root.appendChild(pratinjau);
  root.appendChild(box);
  perbaruiPratinjau();
}
