import { h as T, utils, fileInput, fmtBytes, tabs, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "virusscan", "name": "Virus Scan", "cat": "keamanan", "icon": "🛡️", "desc": "Pindai URL, file, hash, domain & IP dengan heuristik lokal.", "keywords": "virus,scan,malware,phising,keamanan,hash,sha256"};

export function render(root) {

  const HIST_KEY = 'adip-virusscan-history';
  const readHist = () => { try { const l = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  const pushHist = (rec) => { try { localStorage.setItem(HIST_KEY, JSON.stringify([rec].concat(readHist()).slice(0, 10))); } catch (e) {} };

  const BRAND = {
    bca: 'bca.co.id', mandiri: 'bankmandiri.co.id', bri: 'bri.co.id', bni: 'bni.co.id',
    dana: 'dana.id', ovo: 'ovo.id', gopay: 'gopay.co.id', paypal: 'paypal.com',
    shopee: 'shopee.co.id', tokopedia: 'tokopedia.com', lazada: 'lazada.co.id',
    whatsapp: 'whatsapp.com', telegram: 'telegram.org', instagram: 'instagram.com',
    facebook: 'facebook.com', google: 'google.com', apple: 'apple.com', tiktok: 'tiktok.com',
  };
  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 's.id', 'gg.gg', 'is.gd', 'buff.ly', 'cutt.ly', 'shorturl.at', 'rebrand.ly', 'ow.ly', 'adf.ly', 'shope.ee', 'bitly.com', 'tiny.cc', 't.ly'];
  const TLD_CURIGA = ['tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'buzz', 'click', 'country', 'stream', 'download', 'zip', 'mov', 'review', 'lol', 'cam', 'rest', 'fit', 'cricket', 'date', 'party', 'racing', 'science', 'trade', 'webcam', 'win', 'link', 'space', 'men'];
  const KW_PHISH = ['login', 'signin', 'sign-in', 'verify', 'verification', 'account', 'update', 'secure', 'banking', 'confirm', 'password', 'otp', 'wallet', 'bonus', 'hadiah', 'gratis', 'menang', 'klaim', 'giveaway', 'airdrop'];

  const domainUtama = (host) => {
    const l = host.toLowerCase().split('.');
    const dua = l.slice(-2).join('.');
    if (/^(co|go|ac|or|sch|web|biz|my)\.id$/.test(dua)) return l.length >= 3 ? l.slice(-3).join('.') : host;
    return l.length >= 2 ? dua : host;
  };

  function skorLabel(skor) {
    if (skor >= 70) return ['TINGGI', 'err'];
    if (skor >= 30) return ['SEDANG', 'warn'];
    return ['RENDAH', 'ok'];
  }

  function hasilHTML(judul, skor, temuan, info) {
    const [lbl, cls] = skorLabel(skor);
    let h = '<div class="kv"><span class="k">' + T.esc(judul) + '</span><span class="v big ' + cls + '">' + lbl + ' <span class="dim" style="font-size:13px">(' + skor + '/100)</span></span></div>';
    if (info && info.length) {
      h += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px">' +
        info.map(([k, v]) => '<tr><td style="padding:6px 8px;color:#c9bda9;border-bottom:1px solid #251f18;white-space:nowrap;vertical-align:top">' + T.esc(k) + '</td><td style="padding:6px 8px;border-bottom:1px solid #251f18;font-family:monospace;word-break:break-all">' + T.esc(v) + '</td></tr>').join('') + '</table>';
    }
    if (temuan.length) {
      h += '<div style="margin-top:10px"><b>Temuan (' + temuan.length + '):</b></div><div style="display:grid;gap:8px;margin-top:6px">' +
        temuan.map((t) => '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px"><b class="' + (t.w >= 25 ? 'err' : 'warn') + '">' + T.esc(t.judul) + ' <span class="dim">+' + t.w + '</span></b><div style="font-size:12.5px;line-height:1.6;margin-top:4px">' + T.esc(t.jelas) + '</div></div>').join('') + '</div>';
    } else {
      h += '<div class="ok" style="margin-top:10px">Tidak ada pola mencurigakan yang dikenali.</div>';
    }
    h += '<p class="dim" style="font-size:12px;margin-top:12px">Ini analisis heuristik lokal, bukan antivirus. Skor RENDAH artinya tidak ada pola yang dikenali — bukan jaminan aman. File tidak diupload ke mana pun.</p>';
    return h;
  }

  function simpanLaporan(nama, isi) {
    const blob = new Blob([isi], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function laporanText(jenis, target, skor, temuan, info) {
    const [lbl] = skorLabel(skor);
    let t = 'ADIP TOOLS — LAPORAN VIRUS SCAN\nJenis: ' + jenis + '\nTarget: ' + target + '\nWaktu: ' + new Date().toLocaleString('id-ID') + '\nSkor risiko: ' + skor + '/100 (' + lbl + ')\n\n';
    (info || []).forEach(([k, v]) => { t += k + ': ' + v + '\n'; });
    t += '\nTEMUAN (' + temuan.length + '):\n';
    temuan.forEach((x, i) => { t += (i + 1) + '. [' + x.w + '] ' + x.judul + ' — ' + x.jelas + '\n'; });
    t += '\nCatatan: analisis heuristik lokal, bukan vonis antivirus. File tidak diupload.\n';
    return t;
  }

  /* ---------- TAB: URL ---------- */
  const pUrl = T.el('<div></div>');
  {
    const inp = T.input('text', 'https://contoh-mencurigakan.xyz/login', 'https://');
    inp.style.fontFamily = 'monospace';
    const box = T.out();
    let last = null;
    const cek = () => {
      let s = inp.value.trim();
      if (!s) { T.show(box, errBox('Tempel dulu link yang mau dipindai.')); return; }
      if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
      let u;
      try { u = new URL(s); } catch (e) { T.show(box, errBox('URL tidak valid.')); return; }
      const host = u.hostname.toLowerCase();
      const temuan = []; const info = [];
      info.push(['Protokol', u.protocol.replace(':', '')]);
      info.push(['Domain', host]);
      info.push(['Path', u.pathname === '/' ? '(kosong)' : u.pathname.slice(0, 120)]);
      if (u.protocol !== 'https:') temuan.push({ judul: 'Tidak pakai HTTPS', jelas: 'Data yang dikirim lewat http biasa bisa diintip. Situs serius umumnya sudah HTTPS.', w: 15 });
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[?[0-9a-f:]{2,}\]?$/.test(host) && host.includes(':')) temuan.push({ judul: 'Domain berupa IP mentah', jelas: 'Situs resmi memakai nama domain, bukan angka IP. Ini pola umum link jebakan.', w: 40 });
      if (u.username || /@/.test(u.host)) temuan.push({ judul: "Trik karakter '@'", jelas: "Browser hanya membuka bagian SETELAH '@'. 'bankasli.com@jahat.xyz' sebenarnya membuka jahat.xyz.", w: 35 });
      if (/xn--/.test(host)) temuan.push({ judul: 'Domain punycode (IDN)', jelas: 'Domain memakai encoding khusus yang bisa menyembunyikan huruf tiruan (homograph).', w: 25 });
      if (/[^\x00-\x7F]/.test(host)) temuan.push({ judul: 'Karakter non-standar di domain', jelas: 'Ada huruf aneh yang mirip huruf biasa — trik homograph untuk menipu mata.', w: 20 });
      const du = domainUtama(host);
      if (SHORTENERS.includes(du)) temuan.push({ judul: 'Link shortener', jelas: 'Tujuan aslinya disembunyikan. Buka hanya bila kamu percaya penuh ke pengirimnya.', w: 20 });
      const tld = host.split('.').pop();
      if (TLD_CURIGA.includes(tld)) temuan.push({ judul: 'TLD jarang dipakai situs resmi (.' + tld + ')', jelas: 'TLD murah/gratisan sering dipakai untuk link jebakan sekali pakai.', w: 15 });
      const labels = host.split('.');
      if (labels.length >= 5) temuan.push({ judul: 'Subdomain bertumpuk (' + labels.length + ' lapis)', jelas: 'Struktur berlapis dipakai untuk menyamarkan domain asli: ' + du + '.', w: 10 });
      const hay = (host + ' ' + u.pathname + ' ' + u.search).toLowerCase();
      const kena = KW_PHISH.filter((k) => hay.includes(k));
      if (kena.length) temuan.push({ judul: 'Kata kunci phishing: ' + kena.slice(0, 4).join(', '), jelas: 'Kata-kata ini sering muncul di halaman login palsu / umpan hadiah.', w: 25 });
      Object.keys(BRAND).forEach((b) => {
        if (host.includes(b) && du !== BRAND[b]) temuan.push({ judul: "Kemungkinan menyamar sebagai '" + b + "'", jelas: "Ada kata '" + b + "' tapi domain aslinya " + du + ' — bukan ' + BRAND[b] + '.', w: 30 });
      });
      if (s.length > 200) temuan.push({ judul: 'URL sangat panjang (' + s.length + ' karakter)', jelas: 'URL panjang dipakai untuk menyembunyikan bagian mencurigakan di luar layar.', w: 10 });
      if (u.port && !['80', '443', ''].includes(u.port)) temuan.push({ judul: 'Port tidak umum (:' + u.port + ')', jelas: 'Situs normal jarang memakai port eksplisit.', w: 10 });
      const skor = Math.min(100, temuan.reduce((a, t) => a + t.w, 0));
      T.show(box, hasilHTML('Skor risiko URL', skor, temuan, info));
      last = { jenis: 'URL', target: s, skor, temuan, info };
      pushHist({ jenis: 'URL', target: s.slice(0, 80), skor, waktu: Date.now() });
      dlRow.hidden = false;
    };
    const dlRow = T.el('<div hidden style="margin-top:10px"></div>');
    const bDl = T.btn('Unduh Laporan', () => { if (last) simpanLaporan('virus-scan-url.txt', laporanText(last.jenis, last.target, last.skor, last.temuan, last.info)); });
    dlRow.appendChild(bDl);
    pUrl.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Dapat link mencurigakan? Tempel di sini — kita cek pola phishing-nya langsung di perangkatmu.</p>'));
    pUrl.appendChild(T.field('URL', inp));
    pUrl.appendChild(T.row(T.btn('Pindai URL', cek, true)));
    pUrl.appendChild(box);
    pUrl.appendChild(dlRow);
  }

  /* ---------- TAB: File ---------- */
  const pFile = T.el('<div></div>');
  {
    const fi = fileInput('*/*');
    fi.style.margin = '6px 0';
    const box = T.out();
    let last = null;
    const MAGIC = [
      ['MZ', 'Executable Windows (EXE/DLL)'], ['PK', 'Arsip ZIP (bisa APK/JAR/DOCX)'],
      ['%PDF', 'Dokumen PDF'], ['\x7fELF', 'Executable Linux (ELF)'], ['Rar!', 'Arsip RAR'],
      ['GIF8', 'Gambar GIF'], ['\x89PNG', 'Gambar PNG'], ['BM', 'Gambar BMP'],
      ['ID3', 'Audio MP3'], ['OggS', 'Audio/Video Ogg'], ['fLaC', 'Audio FLAC'],
      ['\x1a\x45\xdf\xa3', 'Video Matroska/WebM'], ['\x00\x00\x00', 'MP4 (kemungkinan)'],
    ];
    const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    async function sha256(buf) {
      const d = await crypto.subtle.digest('SHA-256', buf);
      return hex(d);
    }
    function entropi(bytes) {
      const f = new Array(256).fill(0);
      for (const b of bytes) f[b]++;
      let e = 0;
      for (const c of f) { if (c) { const p = c / bytes.length; e -= p * Math.log2(p); } }
      return e;
    }
    const cek = async () => {
      const file = fi.files && fi.files[0];
      if (!file) { T.show(box, errBox('Pilih dulu file yang mau dipindai.')); return; }
      if (file.size > 32 * 1024 * 1024) { T.show(box, errBox('File terlalu besar. Maksimal 32 MB.')); return; }
      T.show(box, '<span class="dim">Menghitung hash & menganalisis…</span>');
      try {
        const buf = await file.arrayBuffer();
        const hash = await sha256(buf);
        const head = new Uint8Array(buf.slice(0, 8));
        const headStr = String.fromCharCode(...head);
        const tipe = (MAGIC.find(([m]) => headStr.startsWith(m)) || ['', 'Tidak dikenal'])[1];
        const sampel = new Uint8Array(buf.slice(0, Math.min(buf.byteLength, 65536)));
        const ent = entropi(sampel);
        const temuan = []; const info = [];
        info.push(['Nama', file.name.slice(0, 80)]);
        info.push(['Ukuran', fmtBytes(file.size)]);
        info.push(['SHA-256', hash]);
        info.push(['Tipe (magic bytes)', tipe]);
        info.push(['Entropi', ent.toFixed(2) + ' / 8']);
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const parts = file.name.split('.');
        if (parts.length > 2 && ['exe', 'msi', 'bat', 'cmd', 'scr', 'jar', 'ps1', 'vbs', 'com', 'pif'].includes(ext))
          temuan.push({ judul: 'Ekstensi ganda (.' + parts[parts.length - 2] + '.' + ext + ')', jelas: 'Trik klasik: file terlihat seperti dokumen, padahal program yang bisa dijalankan.', w: 30 });
        if (['exe', 'msi', 'bat', 'cmd', 'scr', 'ps1', 'vbs', 'com', 'pif', 'reg'].includes(ext))
          temuan.push({ judul: 'File executable (.' + ext + ')', jelas: 'Bisa menjalankan kode di perangkatmu. Jalankan hanya dari sumber yang kamu percaya penuh.', w: 20 });
        if (headStr.startsWith('MZ'))
          temuan.push({ judul: 'Program Windows terdeteksi', jelas: 'File ini program beneran (bukan dokumen). Pastikan sumbernya tepercaya.', w: 20 });
        if (tipe === 'Tidak dikenal')
          temuan.push({ judul: 'Tipe file tidak dikenali', jelas: 'Header file tidak cocok dengan format umum. Waspada bila file datang dari sumber asing.', w: 10 });
        if (ent > 7.5)
          temuan.push({ judul: 'Entropi sangat tinggi', jelas: 'Isi terkompresi/terenkripsi — umum pada installer resmi, tapi juga pada malware yang dikemas (packed).', w: 15 });
        const skor = Math.min(100, temuan.reduce((a, t) => a + t.w, 0));
        T.show(box, hasilHTML('Skor risiko file', skor, temuan, info));
        last = { jenis: 'File', target: file.name + ' (' + hash.slice(0, 16) + '…)', skor, temuan, info };
        pushHist({ jenis: 'File', target: file.name.slice(0, 60), skor, waktu: Date.now() });
        dlRow.hidden = false;
      } catch (e) { T.show(box, errBox('Gagal membaca file: ' + e.message)); }
    };
    const dlRow = T.el('<div hidden style="margin-top:10px"></div>');
    dlRow.appendChild(T.btn('Unduh Laporan', () => { if (last) simpanLaporan('virus-scan-file.txt', laporanText(last.jenis, last.target, last.skor, last.temuan, last.info)); }));
    pFile.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">File dihitung SHA-256-nya dan dicek pola mencurigakannya — semuanya lokal, file tidak diupload.</p>'));
    pFile.appendChild(fi);
    pFile.appendChild(T.row(T.btn('Pindai File', cek, true)));
    pFile.appendChild(box);
    pFile.appendChild(dlRow);
  }

  /* ---------- TAB: Hash ---------- */
  const pHash = T.el('<div></div>');
  {
    const inp = T.input('text', 'Tempel SHA-256 (64 karakter hex)…');
    inp.style.fontFamily = 'monospace';
    const box = T.out();
    const cek = () => {
      const s = inp.value.trim().toLowerCase();
      if (!s) { T.show(box, errBox('Tempel dulu hash-nya.')); return; }
      const temuan = []; const info = [];
      info.push(['Hash', s.slice(0, 64)]);
      if (/^[0-9a-f]{64}$/.test(s)) {
        info.push(['Format', 'SHA-256 valid']);
      } else if (/^[0-9a-f]{32}$/i.test(s)) {
        temuan.push({ judul: 'Ini MD5, bukan SHA-256', jelas: 'MD5 sudah usang untuk verifikasi keamanan — minta SHA-256 ke sumber file-nya.', w: 10 });
      } else if (/^[0-9a-f]{40}$/i.test(s)) {
        temuan.push({ judul: 'Ini SHA-1, bukan SHA-256', jelas: 'SHA-1 sudah lemah — minta SHA-256 ke sumber file-nya.', w: 10 });
      } else {
        T.show(box, errBox('Format tidak dikenali. SHA-256 = 64 karakter hex (0-9, a-f).'));
        return;
      }
      info.push(['Catatan', 'Pengecekan blocklist online tidak tersedia offline — bandingkan manual dengan hash resmi dari sumber file.']);
      const skor = Math.min(100, temuan.reduce((a, t) => a + t.w, 0));
      T.show(box, hasilHTML('Hasil cek hash', skor, temuan, info));
      pushHist({ jenis: 'Hash', target: s.slice(0, 24) + '…', skor, waktu: Date.now() });
    };
    pHash.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Punya hash SHA-256 dari sumber resmi? Tempel di sini untuk validasi formatnya.</p>'));
    pHash.appendChild(T.field('Hash', inp));
    pHash.appendChild(T.row(T.btn('Cek Hash', cek, true)));
    pHash.appendChild(box);
  }

  /* ---------- TAB: Domain ---------- */
  const pDom = T.el('<div></div>');
  {
    const inp = T.input('text', 'contoh.co.id');
    inp.style.fontFamily = 'monospace';
    const box = T.out();
    const cek = () => {
      let s = inp.value.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      if (!s) { T.show(box, errBox('Isi dulu domainnya.')); return; }
      const temuan = []; const info = [];
      info.push(['Domain', s]);
      if (!/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(s) && !/^[a-z0-9-]+(\.[a-z0-9-]+)*\.xn--[a-z0-9-]+$/.test(s)) {
        if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(s)) { T.show(box, errBox('Format domain tidak valid.')); return; }
      }
      const labels = s.split('.');
      const tld = labels[labels.length - 1];
      const utama = labels.slice(0, -1).join('.');
      if (/xn--/.test(s)) temuan.push({ judul: 'Domain punycode', jelas: 'Menyembunyikan karakter tiruan (homograph). Ketik manual domain resmi untuk memastikan.', w: 25 });
      if (TLD_CURIGA.includes(tld)) temuan.push({ judul: 'TLD jarang dipakai situs resmi (.' + tld + ')', jelas: 'TLD murah/gratisan favorit untuk domain jebakan sekali pakai.', w: 15 });
      const panjang = labels.reduce((a, l) => (l.length > a.length ? l : a), '');
      let e = 0; const fr = {};
      for (const c of panjang) fr[c] = (fr[c] || 0) + 1;
      for (const c in fr) { const p = fr[c] / panjang.length; e -= p * Math.log2(p); }
      if (panjang.length >= 12 && e > 4.0) temuan.push({ judul: 'Pola mirip DGA', jelas: 'Label domain terlihat acak seperti hasil generator domain malware (' + panjang.slice(0, 20) + '…).', w: 15 });
      const strip = (s.match(/-/g) || []).length;
      if (strip > 3) temuan.push({ judul: 'Terlalu banyak strip (' + strip + ')', jelas: 'Domain resmi jarang pakai banyak strip; pola ini umum di domain tiruan.', w: 10 });
      if (/\d{4,}/.test(utama)) temuan.push({ judul: 'Banyak angka berurutan', jelas: 'Domain resmi jarang menaruh deretan angka panjang di namanya.', w: 10 });
      Object.keys(BRAND).forEach((b) => {
        if (utama.includes(b) && domainUtama(s) !== BRAND[b]) temuan.push({ judul: "Kemungkinan menyamar sebagai '" + b + "'", jelas: "Domain aslinya " + domainUtama(s) + ' — bukan ' + BRAND[b] + '.', w: 30 });
      });
      const skor = Math.min(100, temuan.reduce((a, t) => a + t.w, 0));
      T.show(box, hasilHTML('Skor risiko domain', skor, temuan, info));
      pushHist({ jenis: 'Domain', target: s.slice(0, 60), skor, waktu: Date.now() });
    };
    pDom.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cek apakah sebuah domain terlihat mencurigakan sebelum kamu kunjungi.</p>'));
    pDom.appendChild(T.field('Domain', inp));
    pDom.appendChild(T.row(T.btn('Cek Domain', cek, true)));
    pDom.appendChild(box);
  }

  /* ---------- TAB: IP ---------- */
  const pIp = T.el('<div></div>');
  {
    const inp = T.input('text', '8.8.8.8 atau 2001:4860:4860::8888');
    inp.style.fontFamily = 'monospace';
    const box = T.out();
    const cek = () => {
      const s = inp.value.trim();
      if (!s) { T.show(box, errBox('Isi dulu alamat IP-nya.')); return; }
      const temuan = []; const info = [];
      info.push(['IP', s]);
      const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
      const v6 = /^[0-9a-f:]+$/i.test(s) && s.includes(':');
      if (v4) {
        const o = v4.slice(1, 5).map(Number);
        if (o.some((n) => n > 255)) { T.show(box, errBox('IPv4 tidak valid: oktet maksimal 255.')); return; }
        info.push(['Versi', 'IPv4']);
        const [a, b] = o;
        if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) temuan.push({ judul: 'IP privat (jaringan lokal)', jelas: 'Alamat ini hanya berlaku di jaringan lokal — bukan alamat publik internet.', w: 0 });
        else if (a === 127) temuan.push({ judul: 'Loopback (localhost)', jelas: 'Alamat ini menunjuk ke perangkat sendiri.', w: 0 });
        else if (a >= 224 && a <= 239) temuan.push({ judul: 'Multicast', jelas: 'Rentang multicast — bukan alamat host biasa.', w: 0 });
        else if (a === 169 && b === 254) temuan.push({ judul: 'Link-local (APIPA)', jelas: 'IP otomatis saat perangkat gagal dapat IP dari DHCP.', w: 0 });
        else if (a === 0) temuan.push({ judul: 'IP tidak valid (0.x.x.x)', jelas: 'Rentang 0.0.0.0/8 dicadangkan, bukan alamat host.', w: 0 });
        else info.push(['Status', 'Alamat publik, format valid']);
      } else if (v6) {
        info.push(['Versi', 'IPv6']);
        if (s === '::1') temuan.push({ judul: 'Loopback IPv6', jelas: 'Setara localhost.', w: 0 });
        else if (/^fe80:/i.test(s)) temuan.push({ judul: 'Link-local IPv6', jelas: 'Hanya berlaku di jaringan lokal.', w: 0 });
        else if (/^(fc|fd)/i.test(s)) temuan.push({ judul: 'Unique local (privat)', jelas: 'Setara IP privat di IPv4.', w: 0 });
        else info.push(['Status', 'Format IPv6 valid']);
      } else { T.show(box, errBox('Format IP tidak dikenali. Contoh IPv4: 8.8.8.8 — IPv6: 2001:4860:4860::8888')); return; }
      const skor = Math.min(100, temuan.reduce((a, t) => a + t.w, 0));
      T.show(box, hasilHTML('Hasil cek IP', skor, temuan, info));
      pushHist({ jenis: 'IP', target: s, skor, waktu: Date.now() });
    };
    const bSaya = T.btn('IP Saya', async () => {
      T.show(box, '<span class="dim">Mendeteksi IP publik…</span>');
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        const j = await r.json();
        inp.value = j.ip; cek();
      } catch (e) { T.show(box, errBox('Gagal mendeteksi IP. Cek koneksi lalu coba lagi.')); }
    });
    pIp.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Validasi alamat IP dan kenali apakah itu IP publik, privat, atau cadangan.</p>'));
    pIp.appendChild(T.field('Alamat IP', inp));
    pIp.appendChild(T.row(T.btn('Cek IP', cek, true), bSaya));
    pIp.appendChild(box);
  }

  /* ---------- Riwayat ---------- */
  const pHis = T.el('<div></div>');
  {
    const box = T.out();
    const gambar = () => {
      const l = readHist();
      if (!l.length) { T.show(box, '<span class="dim">Belum ada riwayat pindaian.</span>'); return; }
      T.show(box, '<div style="display:grid;gap:8px">' + l.map((h) => {
        const [lbl, cls] = skorLabel(h.skor);
        return '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;font-size:13px"><b>' + T.esc(h.jenis) + '</b> <span class="dim">·</span> <span style="font-family:monospace">' + T.esc(h.target) + '</span><div style="margin-top:4px"><span class="' + cls + '">' + lbl + ' (' + h.skor + ')</span> <span class="dim">· ' + new Date(h.waktu).toLocaleString('id-ID') + '</span></div></div>';
      }).join('') + '</div>');
    };
    const bHapus = T.btn('Hapus Riwayat', () => { try { localStorage.removeItem(HIST_KEY); } catch (e) {} gambar(); });
    bHapus.classList.add('small');
    pHis.appendChild(T.row(bHapus));
    pHis.appendChild(box);
    pHis._gambar = gambar;
  }

  const pages = [pUrl, pFile, pHash, pDom, pIp, pHis];
  const bar = tabs([['URL', 0], ['File', 1], ['Hash', 2], ['Domain', 3], ['IP', 4], ['Riwayat', 5]], pages);
  bar.addEventListener('click', () => { if (!pHis.hidden && pHis._gambar) pHis._gambar(); });
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Analisis keamanan lokal: pindai link, file, hash, domain, atau IP tanpa mengupload apa pun.</p>'));
  root.appendChild(bar);
  pages.forEach((p) => root.appendChild(p));
}
