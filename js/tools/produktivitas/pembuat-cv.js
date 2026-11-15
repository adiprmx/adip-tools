import { h as T, utils } from '../../core.js?v=6.12.0';

export const meta = {"id": "pembuat-cv", "name": "Pembuat CV Lamaran", "cat": "produktivitas", "icon": "📄", "desc": "Isi form bertahap, langsung jadi CV 1 halaman rapi dengan 5 pilihan tampilan dan cek kelengkapan, siap cetak atau simpan PDF.", "keywords": "cv,lamaran kerja,daftar riwayat hidup,resume,ats,lamar kerja,sertifikat"};

let _printCssDone = false;

function ensurePrintCss() {
  if (_printCssDone) return;
  _printCssDone = true;
  const st = document.createElement('style');
  st.textContent =
    '@page{size:A4;margin:12mm}' +
    '@media print{' +
    'body *{visibility:hidden !important}' +
    '#cv-print,#cv-print *{visibility:visible !important}' +
    '#cv-print{position:absolute;inset:0;background:#fff;color:#000;padding:0}' +
    '#cv-print .cv-page{box-shadow:none !important;border:none !important;margin:0 !important;width:100% !important}' +
    '}';
  document.head.appendChild(st);
}

const LS_KEY = 'at-pembuat-cv-v1';

const CONTOH = {
  nama: 'Contoh Nama', gelar: '', tempatLahir: 'Contoh Kota', tanggalLahir: '',
  alamat: 'Jl. Contoh No. 1, Contoh Kota', telepon: '0812-0000-0000', email: 'contoh@email.com',
  ringkasan: 'Lulusan SMK jurusan Administrasi yang teliti, disiplin, dan siap belajar. Berpengalaman magang di bagian administrasi selama 3 bulan.',
  pendidikan: [{ sekolah: 'SMK Contoh Negeri 1', jurusan: 'Administrasi Perkantoran', tahun: '2023 - 2026' }],
  pengalaman: [{ tempat: 'PT Contoh Sejahtera', jabatan: 'Magang Administrasi', tahun: 'Jan - Mar 2026', tugas: 'Mengarsip dokumen, menginput data, dan melayani tamu kantor.' }],
  sertifikat: [{ nama: 'Sertifikat Komputer Dasar', tahun: '2025' }],
  keahlian: ['Microsoft Word & Excel', 'Mengetik 10 jari', 'Administrasi perkantoran', 'Komunikasi'],
  template: 'formal'
};

function kosong() {
  return {
    nama: '', gelar: '', tempatLahir: '', tanggalLahir: '',
    alamat: '', telepon: '', email: '', ringkasan: '',
    pendidikan: [{ sekolah: '', jurusan: '', tahun: '' }],
    pengalaman: [{ tempat: '', jabatan: '', tahun: '', tugas: '' }],
    sertifikat: [{ nama: '', tahun: '' }],
    keahlian: [''],
    template: 'formal'
  };
}

export function render(root) {

    ensurePrintCss();

    let data = kosong();
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && typeof saved === 'object') data = Object.assign(kosong(), saved);
    } catch (e) { /* abaikan data rusak */ }

    let langkah = 1;
    const box = T.out();
    const previewBox = T.out();
    const langkahBox = T.out();

    const simpan = () => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* penyimpanan penuh */ }
    };

    const esc = (s) => T.esc(String(s == null ? '' : s));
    const baris = (v) => String(v == null ? '' : v).trim();

    /* ---------- render CV ---------- */
    function cvHtml() {
      const nama = baris(data.nama) || '(Nama lengkap)';
      const kontak = [baris(data.alamat), baris(data.telepon), baris(data.email)].filter(Boolean);
      const ttl = [baris(data.tempatLahir), baris(data.tanggalLahir)].filter(Boolean).join(', ');
      const pend = data.pendidikan.filter((p) => baris(p.sekolah) || baris(p.jurusan));
      const peng = data.pengalaman.filter((p) => baris(p.tempat) || baris(p.jabatan));
      const sert = (data.sertifikat || []).filter((s) => baris(s.nama));
      const ahli = data.keahlian.map(baris).filter(Boolean);
      const tpl = data.template || 'formal';

      // Tampilan dua kolom: kontak + keahlian di kiri, isi utama di kanan.
      if (tpl === 'kolom') {
        const jdl = (t) => '<div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px">' + t + '</div>';
        const jdlKiri = (t) => '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 6px">' + t + '</div>';
        let kiri = '';
        if (kontak.length || ttl) {
          kiri += jdlKiri('Kontak') + '<div style="font-size:12px;line-height:1.7;color:#333">' +
            kontak.map(esc).join('<br/>') + (ttl ? (kontak.length ? '<br/>' : '') + esc(ttl) : '') + '</div>';
        }
        if (ahli.length) {
          kiri += jdlKiri('Keahlian') + '<div style="font-size:12px;line-height:1.7">' + ahli.map((a) => '• ' + esc(a)).join('<br/>') + '</div>';
        }
        let kanan = '';
        if (baris(data.ringkasan)) kanan += jdl('Tentang Saya') + '<p style="font-size:13px;line-height:1.6;margin:0 0 14px">' + esc(data.ringkasan) + '</p>';
        if (pend.length) {
          kanan += jdl('Pendidikan');
          pend.forEach((p) => {
            kanan += '<div style="font-size:13px;line-height:1.5;margin-bottom:6px"><b>' + esc(p.sekolah || '(Sekolah)') + '</b>' +
              (baris(p.tahun) ? ' <span style="color:#555">(' + esc(p.tahun) + ')</span>' : '') +
              (baris(p.jurusan) ? '<br/>' + esc(p.jurusan) : '') + '</div>';
          });
          kanan += '<div style="height:8px"></div>';
        }
        if (peng.length) {
          kanan += jdl('Pengalaman');
          peng.forEach((p) => {
            kanan += '<div style="font-size:13px;line-height:1.5;margin-bottom:8px"><b>' + esc(p.jabatan || '(Jabatan)') + '</b> - ' + esc(p.tempat || '(Tempat)') +
              (baris(p.tahun) ? ' <span style="color:#555">(' + esc(p.tahun) + ')</span>' : '') +
              (baris(p.tugas) ? '<br/>' + esc(p.tugas) : '') + '</div>';
          });
          kanan += '<div style="height:8px"></div>';
        }
        if (sert.length) {
          kanan += jdl('Pelatihan & Sertifikat');
          sert.forEach((s) => {
            kanan += '<div style="font-size:13px;line-height:1.5;margin-bottom:4px">• ' + esc(s.nama) +
              (baris(s.tahun) ? ' <span style="color:#555">(' + esc(s.tahun) + ')</span>' : '') + '</div>';
          });
        }
        return '<div style="border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:0">' +
          '<div style="font-size:26px;font-weight:700;letter-spacing:.5px">' + esc(nama) + '</div>' +
          (baris(data.gelar) ? '<div style="font-size:13px;margin-top:2px">' + esc(data.gelar) + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;gap:0">' +
          '<div style="width:190px;flex-shrink:0;padding:4px 16px 0 0;border-right:1px solid #ccc">' + kiri + '</div>' +
          '<div style="flex:1;padding:14px 0 0 16px">' + kanan + '</div>' +
          '</div>';
      }

      const head = tpl === 'formal'
        ? '<div style="text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px">' +
          '<div style="font-size:24px;font-weight:700;letter-spacing:.5px">' + esc(nama) + '</div>' +
          (baris(data.gelar) ? '<div style="font-size:13px;margin-top:2px">' + esc(data.gelar) + '</div>' : '') +
          (kontak.length ? '<div style="font-size:12px;margin-top:6px;color:#333">' + kontak.map(esc).join(' &nbsp;|&nbsp; ') + '</div>' : '') +
          (ttl ? '<div style="font-size:12px;color:#333">' + esc(ttl) + '</div>' : '') +
          '</div>'
        : tpl === 'modern'
        ? '<div style="border-left:4px solid #111;padding-left:12px;margin-bottom:14px">' +
          '<div style="font-size:26px;font-weight:700;letter-spacing:.5px">' + esc(nama) + '</div>' +
          (baris(data.gelar) ? '<div style="font-size:13px;margin-top:2px">' + esc(data.gelar) + '</div>' : '') +
          (kontak.length ? '<div style="font-size:12px;margin-top:6px;color:#333">' + kontak.map(esc).join(' &nbsp;|&nbsp; ') + '</div>' : '') +
          (ttl ? '<div style="font-size:12px;color:#333">' + esc(ttl) + '</div>' : '') +
          '</div>'
        : tpl === 'ats'
        ? '<div style="margin-bottom:12px">' +
          '<div style="font-size:20px;font-weight:700">' + esc(nama) + '</div>' +
          (baris(data.gelar) ? '<div style="font-size:13px;margin-top:2px">' + esc(data.gelar) + '</div>' : '') +
          (kontak.length ? '<div style="font-size:12px;margin-top:4px">' + kontak.map(esc).join(' | ') + '</div>' : '') +
          (ttl ? '<div style="font-size:12px">' + esc(ttl) + '</div>' : '') +
          '</div>'
        : '<div style="margin-bottom:14px">' +
          '<div style="font-size:24px;font-weight:700">' + esc(nama) + '</div>' +
          (baris(data.gelar) ? '<div style="font-size:13px;margin-top:2px">' + esc(data.gelar) + '</div>' : '') +
          (kontak.length ? '<div style="font-size:12px;margin-top:6px;color:#333">' + kontak.map(esc).join('<br/>') + '</div>' : '') +
          (ttl ? '<div style="font-size:12px;color:#333">' + esc(ttl) + '</div>' : '') +
          '</div>';

      const judul = (t) => tpl === 'formal'
        ? '<div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #999;padding-bottom:3px;margin:14px 0 8px">' + t + '</div>'
        : tpl === 'modern'
        ? '<div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-left:4px solid #111;padding-left:8px;margin:14px 0 8px">' + t + '</div>'
        : tpl === 'ats'
        ? '<div style="font-size:13px;font-weight:700;margin:12px 0 4px">' + t + '</div>'
        : '<div style="font-size:13px;font-weight:700;margin:14px 0 6px">' + t + '</div>';

      let h = head;
      if (baris(data.ringkasan)) h += judul('Tentang Saya') + '<p style="font-size:13px;line-height:1.6;margin:0">' + esc(data.ringkasan) + '</p>';
      if (pend.length) {
        h += judul('Pendidikan');
        pend.forEach((p) => {
          h += '<div style="font-size:13px;line-height:1.5;margin-bottom:6px"><b>' + esc(p.sekolah || '(Sekolah)') + '</b>' +
            (baris(p.tahun) ? ' <span style="color:#555">(' + esc(p.tahun) + ')</span>' : '') +
            (baris(p.jurusan) ? '<br/>' + esc(p.jurusan) : '') + '</div>';
        });
      }
      if (peng.length) {
        h += judul('Pengalaman');
        peng.forEach((p) => {
          h += '<div style="font-size:13px;line-height:1.5;margin-bottom:8px"><b>' + esc(p.jabatan || '(Jabatan)') + '</b> - ' + esc(p.tempat || '(Tempat)') +
            (baris(p.tahun) ? ' <span style="color:#555">(' + esc(p.tahun) + ')</span>' : '') +
            (baris(p.tugas) ? '<br/>' + esc(p.tugas) : '') + '</div>';
        });
      }
      if (sert.length) {
        h += judul('Pelatihan & Sertifikat');
        sert.forEach((s) => {
          h += '<div style="font-size:13px;line-height:1.5;margin-bottom:4px">• ' + esc(s.nama) +
            (baris(s.tahun) ? ' <span style="color:#555">(' + esc(s.tahun) + ')</span>' : '') + '</div>';
        });
      }
      if (ahli.length) {
        h += judul('Keahlian');
        h += '<div style="font-size:13px;line-height:1.7">' + ahli.map((a) => '• ' + esc(a)).join('<br/>') + '</div>';
      }
      return h;
    }

    function cvText() {
      const tmp = document.createElement('div');
      tmp.innerHTML = cvHtml();
      return tmp.innerText || tmp.textContent;
    }

    function cekKelengkapan() {
      const cek = [
        { ok: !!baris(data.nama), label: 'Nama lengkap terisi' },
        { ok: !!baris(data.telepon), label: 'Nomor HP terisi' },
        { ok: !!baris(data.email), label: 'Email terisi' },
        { ok: baris(data.ringkasan).length >= 30, label: 'Ringkasan minimal 30 karakter' },
        { ok: data.pendidikan.some((p) => baris(p.sekolah) || baris(p.jurusan)), label: 'Pendidikan terisi' },
        { ok: data.pengalaman.some((p) => baris(p.tempat) || baris(p.jabatan)), label: 'Pengalaman atau magang terisi' },
        { ok: data.keahlian.map(baris).filter(Boolean).length >= 3, label: 'Keahlian minimal 3' },
        { ok: true, label: 'Tanpa foto, ramah sistem HRD' }
      ];
      const terisi = cek.filter((c) => c.ok).length;
      return '<div style="border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px;margin-bottom:12px">' +
        '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Cek kelengkapan: ' + terisi + ' dari ' + cek.length + ' terisi</div>' +
        cek.map((c) => '<div style="font-size:13px;line-height:1.7">' + (c.ok ? '✓ ' : '○ ') + esc(c.label) + '</div>').join('') +
        '<div style="font-size:12px;color:#a1a1aa;margin-top:6px">Lengkapi yang masih kosong dengan kembali ke langkah sebelumnya. Cek ini hanya menghitung kolom yang terisi, bukan jaminan lolos seleksi.</div>' +
        '</div>';
    }

    function tampilkanPreview() {
      T.show(previewBox,
        cekKelengkapan() +
        '<div id="cv-print"><div class="cv-page" style="background:#fff;color:#111;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:720px;margin:0 auto;padding:28px 32px;font-family:Arial,Helvetica,sans-serif">' +
        cvHtml() +
        '</div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn primary" data-act="print">🖨️ Cetak / Simpan PDF</button>' +
        '<button class="btn" data-act="dl">⬇️ Unduh HTML</button>' +
        '<button class="btn" data-act="copy">📋 Salin teks CV</button>' +
        '<button class="btn" data-act="txt">⬇️ Unduh TXT</button></div>' +
        '<p class="hint">Tips cetak: pilih ukuran kertas A4 dan matikan header/footer browser supaya CV bersih 1 halaman. Teks polos berguna untuk ditempel ke formulir lamaran online.</p>');
      previewBox.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
      previewBox.querySelector('[data-act="copy"]').addEventListener('click', () => T.copy(cvText()));
      previewBox.querySelector('[data-act="txt"]').addEventListener('click', () => {
        T.dl('cv-' + (baris(data.nama) || 'lamaran').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt', cvText(), 'text/plain');
      });
      previewBox.querySelector('[data-act="dl"]').addEventListener('click', () => {
        const html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>CV ' + esc(data.nama || 'Lamaran') + '</title>' +
          '<style>@page{size:A4;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:700px;margin:0 auto;padding:24px}</style></head><body>' +
          cvHtml() + '</body></html>';
        T.dl('cv-' + (baris(data.nama) || 'lamaran').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html', html, 'text/html');
      });
    }

    /* ---------- form bertahap ---------- */
    const navLangkah = () => {
      const nama = ['1. Data Diri', '2. Pendidikan', '3. Pengalaman', '4. Keahlian & Ringkasan', '5. Hasil'];
      T.show(langkahBox,
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
        nama.map((n, i) => '<button class="btn' + (langkah === i + 1 ? ' primary' : '') + '" data-lk="' + (i + 1) + '">' + n + '</button>').join('') +
        '</div>');
      langkahBox.querySelectorAll('[data-lk]').forEach((b) => b.addEventListener('click', () => { langkah = Number(b.dataset.lk); tampilkanLangkah(); }));
    };

    const inpTxt = (label, val, onIn, ph) => {
      const i = T.input('text', ph || '', val || '');
      i.addEventListener('input', () => { onIn(i.value); simpan(); if (langkah === 5) tampilkanPreview(); });
      return T.field(label, i);
    };

    function daftarDinamis(list, fields, judulBaru) {
      const wrap = T.el('<div></div>');
      const gambar = () => {
        wrap.innerHTML = '';
        list.forEach((item, i) => {
          const card = T.el('<div style="border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px;margin-bottom:10px"></div>');
          fields.forEach((f) => {
            const inp = f.ta ? T.ta(2, f.ph || '', item[f.k] || '') : T.input('text', f.ph || '', item[f.k] || '');
            inp.addEventListener('input', () => { item[f.k] = inp.value; simpan(); });
            card.appendChild(T.field(f.label, inp));
          });
          if (list.length > 1) {
            const del = T.btn('✕ Hapus', () => { list.splice(i, 1); gambar(); });
            card.appendChild(del);
          }
          wrap.appendChild(card);
        });
        const add = T.btn('＋ ' + judulBaru, () => {
          const baru = {};
          fields.forEach((f) => { baru[f.k] = ''; });
          list.push(baru);
          gambar();
        });
        wrap.appendChild(add);
      };
      gambar();
      return wrap;
    }

    function tampilkanLangkah() {
      navLangkah();
      box.innerHTML = '';
      previewBox.innerHTML = '';
      if (langkah === 1) {
        box.appendChild(inpTxt('Nama lengkap', data.nama, (v) => { data.nama = v; }, 'Sesuai KTP'));
        box.appendChild(inpTxt('Gelar / sebutan (boleh kosong)', data.gelar, (v) => { data.gelar = v; }, 'Contoh: S.Pd.'));
        box.appendChild(T.grid2(
          inpTxt('Tempat lahir (boleh kosong)', data.tempatLahir, (v) => { data.tempatLahir = v; }, 'Kota lahir'),
          inpTxt('Tanggal lahir (boleh kosong)', data.tanggalLahir, (v) => { data.tanggalLahir = v; }, 'Contoh: 12 Januari 2005')
        ));
        box.appendChild(inpTxt('Alamat', data.alamat, (v) => { data.alamat = v; }, 'Alamat domisili'));
        box.appendChild(T.grid2(
          inpTxt('Nomor HP / WhatsApp', data.telepon, (v) => { data.telepon = v; }, '08xxxxxxxxxx'),
          inpTxt('Email', data.email, (v) => { data.email = v; }, 'nama@email.com')
        ));
        box.appendChild(T.el('<p class="hint">Data tersimpan otomatis di HP ini saja, tidak dikirim ke mana pun. Nomor KTP tidak perlu ditulis di CV.</p>'));
      } else if (langkah === 2) {
        box.appendChild(T.el('<p class="dim">Isi dari pendidikan terakhir. Tambah baris bila ada lebih dari satu.</p>'));
        box.appendChild(daftarDinamis(data.pendidikan, [
          { k: 'sekolah', label: 'Nama sekolah / kampus', ph: 'Contoh: SMK Negeri 1' },
          { k: 'jurusan', label: 'Jurusan / program', ph: 'Contoh: Administrasi Perkantoran' },
          { k: 'tahun', label: 'Tahun', ph: 'Contoh: 2023 - 2026' }
        ], 'Tambah pendidikan'));
      } else if (langkah === 3) {
        box.appendChild(T.el('<p class="dim">Pengalaman kerja, magang, atau PKL. Lulusan baru boleh mengisi magang/PKL saja.</p>'));
        box.appendChild(daftarDinamis(data.pengalaman, [
          { k: 'tempat', label: 'Nama perusahaan / tempat', ph: 'Contoh: PT Maju Bersama' },
          { k: 'jabatan', label: 'Jabatan / posisi', ph: 'Contoh: Staff Administrasi' },
          { k: 'tahun', label: 'Periode', ph: 'Contoh: Jan 2025 - Jun 2025' },
          { k: 'tugas', label: 'Tugas utama (singkat)', ph: 'Apa saja yang dikerjakan', ta: true }
        ], 'Tambah pengalaman'));
        box.appendChild(T.el('<p class="dim" style="margin-top:16px">Pelatihan &amp; sertifikat (opsional, misal kursus komputer atau sertifikat kerja)</p>'));
        if (!Array.isArray(data.sertifikat)) data.sertifikat = [{ nama: '', tahun: '' }];
        box.appendChild(daftarDinamis(data.sertifikat, [
          { k: 'nama', label: 'Nama pelatihan / sertifikat', ph: 'Contoh: Sertifikat Komputer Dasar' },
          { k: 'tahun', label: 'Tahun', ph: 'Contoh: 2025' }
        ], 'Tambah sertifikat'));
      } else if (langkah === 4) {
        const ring = T.ta(3, 'Ceritakan diri kamu dalam 2-3 kalimat: latar belakang, kelebihan, dan tujuan melamar.', data.ringkasan);
        ring.addEventListener('input', () => { data.ringkasan = ring.value; simpan(); });
        box.appendChild(T.field('Tentang saya (ringkasan singkat)', ring));
        box.appendChild(T.el('<p class="dim" style="margin-top:12px">Keahlian (satu per baris)</p>'));
        const ahli = T.ta(4, 'Contoh:\nMicrosoft Word & Excel\nMengetik 10 jari\nAdministrasi perkantoran', data.keahlian.join('\n'));
        ahli.addEventListener('input', () => { data.keahlian = ahli.value.split('\n'); simpan(); });
        box.appendChild(ahli);
        const tpl = T.select([
          ['formal', 'Formal, judul tengah dan garis tegas'],
          ['simpel', 'Simpel, rapi tanpa garis'],
          ['modern', 'Modern, aksen garis tebal di kiri'],
          ['kolom', 'Dua kolom, kontak & keahlian di kiri'],
          ['ats', 'ATS, polos dan mudah dibaca sistem HRD']
        ], data.template);
        tpl.addEventListener('change', () => { data.template = tpl.value; simpan(); });
        box.appendChild(T.field('Pilih tampilan CV', tpl));
      } else {
        tampilkanPreview();
      }
      const nav = T.row(
        langkah > 1 ? T.btn('← Sebelumnya', () => { langkah--; tampilkanLangkah(); }) : T.el('<span></span>'),
        langkah < 5 ? T.btn('Lanjut →', () => { langkah++; tampilkanLangkah(); }, true) : T.el('<span></span>')
      );
      box.appendChild(nav);
    }

    const isiContoh = () => {
      data = JSON.parse(JSON.stringify(CONTOH));
      simpan();
      langkah = 5;
      tampilkanLangkah();
      T.toast('Contoh terisi, ganti dengan data kamu');
    };
    const hapusSemua = () => {
      data = kosong();
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      langkah = 1;
      tampilkanLangkah();
      T.toast('Data dihapus');
    };

    root.appendChild(T.el('<p class="note">Buat CV lamaran 1 halaman yang rapi dan mudah dibaca sistem HRD. Isi langkah demi langkah, lalu cetak atau simpan sebagai PDF.</p>'));
    root.appendChild(T.row(T.btn('👀 Lihat contoh', isiContoh), T.btn('🗑️ Hapus semua data', hapusSemua)));
    root.appendChild(langkahBox);
    root.appendChild(box);
    root.appendChild(previewBox);
    tampilkanLangkah();

}
