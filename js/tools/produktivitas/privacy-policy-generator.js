import { h as T, kv, esc, errBox, preHtml, tabs } from '../../core.js?v=6.12.2';

export const DATA_JENIS = [
  ['nama', 'Nama lengkap'],
  ['email', 'Alamat email'],
  ['telepon', 'Nomor telepon'],
  ['alamat', 'Alamat'],
  ['penggunaan', 'Data penggunaan layanan (halaman yang dibuka, fitur yang dipakai)'],
  ['cookie', 'Cookie dan data perangkat'],
];

/* Fungsi murni (bisa diuji dari node tanpa DOM). */
export function buildPrivacy(d) {
  const dataList = (d.data || []).map((k) => {
    const f = DATA_JENIS.find((x) => x[0] === k);
    return f ? f[1] : k;
  });
  const pihak = (d.pihak || []).filter((s) => s.trim());
  const L = [];
  L.push('KEBIJAKAN PRIVASI ' + d.layanan.toUpperCase());
  L.push('');
  L.push('Terakhir diperbarui: ' + (d.tanggal || '(tanggal belum diisi)'));
  L.push('');
  L.push('1. Tentang layanan ini');
  L.push(d.layanan + ' dikelola oleh ' + d.pemilik + '. Dokumen ini menjelaskan data apa yang kami kumpulkan, kenapa kami kumpulkannya, dan apa hakmu atas datamu.');
  L.push('');
  L.push('2. Data yang kami kumpulkan');
  if (dataList.length) {
    dataList.forEach((x) => L.push('- ' + x));
  } else {
    L.push('Layanan ini tidak mengumpulkan data pribadi.');
  }
  L.push('');
  L.push('3. Kenapa data itu dikumpulkan');
  L.push('Data di atas dipakai untuk menjalankan layanan, memperbaiki kualitasnya, dan menghubungimu bila perlu. Data tidak dijual ke pihak lain.');
  L.push('');
  if (pihak.length) {
    L.push('4. Layanan pihak ketiga');
    L.push('Layanan ini memakai layanan pihak ketiga berikut, yang punya kebijakan privasi masing-masing:');
    pihak.forEach((x) => L.push('- ' + x));
    L.push('');
  }
  L.push((pihak.length ? '5' : '4') + '. Hakmu atas datamu');
  L.push('Kamu bisa meminta salinan datamu, meminta perbaikan, atau meminta penghapusan dengan menghubungi kami di ' + d.email + '.');
  L.push('');
  L.push((pihak.length ? '6' : '5') + '. Perubahan dokumen ini');
  L.push('Bila dokumen ini berubah, tanggal di atas ikut diperbarui. Perubahan besar akan kami kabari lewat layanan.');
  L.push('');
  L.push((pihak.length ? '7' : '6') + '. Hubungi kami');
  L.push('Pertanyaan soal dokumen ini bisa dikirim ke ' + d.email + (d.alamat ? ' atau ke alamat ' + d.alamat + '.' : '.'));
  return L.join('\n');
}

export function buildTerms(d) {
  const L = [];
  L.push('SYARAT DAN KETENTUAN ' + d.layanan.toUpperCase());
  L.push('');
  L.push('Terakhir diperbarui: ' + (d.tanggal || '(tanggal belum diisi)'));
  L.push('');
  L.push('1. Penerimaan');
  L.push('Dengan memakai ' + d.layanan + ' (' + d.pemilik + '), kamu setuju dengan syarat dan ketentuan di dokumen ini.');
  L.push('');
  L.push('2. Penggunaan layanan');
  L.push('Pakai layanan ini dengan wajar dan sesuai hukum yang berlaku. Dilarang memakai layanan untuk merugikan orang lain, menyebarkan konten yang melanggar hukum, atau mengganggu jalannya layanan.');
  L.push('');
  L.push('3. Akun');
  L.push('Bila layanan memakai akun, kamu bertanggung jawab menjaga kerahasiaan akunmu dan semua aktivitas yang terjadi lewat akun itu.');
  L.push('');
  L.push('4. Konten pengguna');
  L.push('Konten yang kamu kirim tetap milikmu. Dengan mengirimnya, kamu memberi kami izin untuk menampilkan dan memproses konten itu sebatas untuk menjalankan layanan.');
  L.push('');
  L.push('5. Batasan tanggung jawab');
  L.push('Layanan disediakan sebagaimana adanya. Kami berusaha menjaga layanan tetap berjalan, tapi tidak menjamin layanan bebas gangguan setiap saat.');
  L.push('');
  L.push('6. Perubahan syarat');
  L.push('Syarat ini bisa berubah sewaktu-waktu. Tanggal di atas menunjukkan versi terakhir. Terus memakai layanan setelah perubahan berarti kamu setuju dengan versi terbaru.');
  L.push('');
  L.push('7. Hubungi kami');
  L.push('Pertanyaan soal dokumen ini bisa dikirim ke ' + d.email + '.');
  return L.join('\n');
}

export const meta = {"id": "privacy-policy-generator", "name": "Generator Kebijakan Privasi", "cat": "produktivitas", "icon": "📜", "desc": "Susun Kebijakan Privasi dan Syarat & Ketentuan.", "keywords": "privasi,privacy policy,syarat,ketentuan,legal", "since": "6.11.0"};
export function render(root) {
  const fLayanan = T.input('text', 'Nama layanan atau situs', '');
  const fPemilik = T.input('text', 'Nama pemilik atau perusahaan', '');
  const fEmail = T.input('text', 'email@contoh.com', '');
  const fAlamat = T.input('text', 'Alamat (opsional)', '');
  const fTanggal = T.input('date', '', new Date().toISOString().slice(0, 10));
  const fPihak = T.ta(3, 'Satu layanan per baris. Contoh:\nGoogle Analytics\nFirebase');
  const checks = {};
  const checkBox = T.el('<div style="display:flex;flex-direction:column;gap:8px;margin:4px 0 12px"></div>');
  DATA_JENIS.forEach(([k, label]) => {
    const c = T.el('<input type="checkbox" style="width:18px;height:18px;accent-color:#fff">');
    checks[k] = c;
    const lb = T.el('<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;cursor:pointer;line-height:1.5"></label>');
    lb.appendChild(c);
    lb.appendChild(T.el('<span>' + esc(label) + '</span>'));
    checkBox.appendChild(lb);
  });

  const pagePrivacy = T.el('<div></div>');
  const pageTerms = T.el('<div></div>');
  const outPrivacy = T.out();
  const outTerms = T.out();
  pagePrivacy.appendChild(T.row(
    T.copyBtn(() => collect().ok ? buildPrivacy(collect().data) : '', 'Salin Kebijakan Privasi'),
    T.dlBtn('kebijakan-privasi.txt', () => collect().ok ? buildPrivacy(collect().data) : '', 'text/plain', 'Unduh .txt')
  ));
  pagePrivacy.appendChild(outPrivacy);
  pageTerms.appendChild(T.row(
    T.copyBtn(() => collect().ok ? buildTerms(collect().data) : '', 'Salin Syarat & Ketentuan'),
    T.dlBtn('syarat-ketentuan.txt', () => collect().ok ? buildTerms(collect().data) : '', 'text/plain', 'Unduh .txt')
  ));
  pageTerms.appendChild(outTerms);
  const tabBar = tabs([['Kebijakan Privasi', 0], ['Syarat & Ketentuan', 1]], [pagePrivacy, pageTerms]);
  const errBoxEl = T.out();

  const collect = () => {
    const data = {
      layanan: fLayanan.value.trim(),
      pemilik: fPemilik.value.trim(),
      email: fEmail.value.trim(),
      alamat: fAlamat.value.trim(),
      tanggal: fTanggal.value,
      data: DATA_JENIS.filter(([k]) => checks[k].checked).map(([k]) => k),
      pihak: fPihak.value.split(/\r?\n/),
    };
    const miss = [];
    if (!data.layanan) miss.push('Nama layanan');
    if (!data.pemilik) miss.push('Nama pemilik atau perusahaan');
    if (!data.email) miss.push('Email kontak');
    return { ok: !miss.length, miss, data };
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi formulirnya, lalu dapatkan dua dokumen siap tempel: Kebijakan Privasi dan Syarat & Ketentuan, dalam Bahasa Indonesia.</p>'));
  root.appendChild(T.grid2(T.field('Nama layanan', fLayanan), T.field('Nama pemilik / perusahaan', fPemilik)));
  root.appendChild(T.grid2(T.field('Email kontak', fEmail), T.field('Tanggal berlaku', fTanggal)));
  root.appendChild(T.field('Alamat (opsional)', fAlamat));
  root.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin:8px 0 4px">Data apa yang dikumpulkan layananmu?</div>'));
  root.appendChild(checkBox);
  root.appendChild(T.field('Layanan pihak ketiga yang dipakai (opsional)', fPihak, 'Misal alat analitik atau layanan login. Kosongkan bila tidak ada.'));
  root.appendChild(T.row(T.btn('Buat Dokumen', () => {
    const c = collect();
    if (!c.ok) { T.show(errBoxEl, errBox('Lengkapi dulu: ' + c.miss.join(', ') + '.')); return; }
    T.hide(errBoxEl);
    T.show(outPrivacy, preHtml(buildPrivacy(c.data)));
    T.show(outTerms, preHtml(buildTerms(c.data)));
  }, true)));
  root.appendChild(errBoxEl);
  root.appendChild(T.el('<div style="font-size:13px;line-height:1.6;background:#1c1a17;border:1px solid #3f3a33;border-radius:8px;padding:10px 12px;margin:12px 0;color:#fbbf24">Dokumen ini template umum untuk kebutuhan sehari-hari. Periksa lagi dengan penasihat hukum untuk kebutuhan resmi.</div>'));
  root.appendChild(tabBar);
  root.appendChild(pagePrivacy);
  root.appendChild(pageTerms);
}
