import { h as T, utils, beep } from '../../core.js?v=6.9.5';

export const meta = {"id": "jejak-digital", "name": "Jejak Digital", "cat": "keamanan", "icon": "🔍", "desc": "Lihat apa yang bisa disimpulkan penjahat dari info pribadimu yang tersebar publik.", "keywords": "jejak digital,doxing,privasi,identitas,keamanan,edukasi,osint"};

// bobot: kontribusi ke skor risiko (0-100)
export const ITEM = [
  { id: 'nama', label: 'Nama lengkap', bobot: 10,
    jelas: 'Titik awal doxing: dari nama lengkap, penjahat bisa menelusuri akun sosmed, pekerjaan, & keluargamu.' },
  { id: 'tgl', label: 'Tanggal lahir', bobot: 15,
    jelas: 'Dipakai menebak PIN/password (ddmmyy) dan menjawab "pertanyaan keamanan" di banyak layanan.' },
  { id: 'ibu', label: 'Nama ibu kandung', bobot: 15,
    jelas: 'Jawaban pertanyaan keamanan PALING umum di bank & e-wallet. Jangan pernah dipajang publik!' },
  { id: 'hp', label: 'Nomor HP', bobot: 12,
    jelas: 'Target spam, penipuan "mama minta pulsa", sampai percobaan bajak WhatsApp & SIM-swap.' },
  { id: 'alamat', label: 'Alamat rumah lengkap', bobot: 15,
    jelas: 'Membuka risiko paket palsu, "kurir" gadungan, hingga didatangi langsung. Cukup kota saja untuk publik.' },
  { id: 'fotorumah', label: 'Foto depan rumah', bobot: 8,
    jelas: 'Memudahkan penjahat memastikan target & merencanakan kapan rumah kosong.' },
  { id: 'ktp', label: 'Foto KTP / SIM / KK', bobot: 20,
    jelas: 'Paket lengkap pencurian identitas: bisa dipakai daftar pinjol ilegal & rekening atas namamu!' },
  { id: 'boarding', label: 'Foto boarding pass / tiket', bobot: 12,
    jelas: 'Barcode boarding pass menyimpan kode booking (PNR) — orang lain bisa mengubah/cancel penerbangamu.' },
  { id: 'realtime', label: 'Lokasi real-time / check-in liburan', bobot: 10,
    jelas: '"Lagi di Bali nih!" = pengumuman rumahmu kosong. Maling berterima kasih atas infonya.' },
  { id: 'plat', label: 'Foto plat nomor kendaraan', bobot: 6,
    jelas: 'Bisa dilacak ke data kendaraan & dipakai untuk penipuan tilang/parkir palsu.' },
  { id: 'sekolah', label: 'Nama sekolah anak', bobot: 10,
    jelas: 'Dipakai penipu untuk skenario "anakmu kecelakaan, transfer sekarang!" ke orang tuanya.' },
  { id: 'tiket', label: 'Foto tiket event (barcode terlihat)', bobot: 8,
    jelas: 'Barcode yang terlihat bisa diduplikat — kamu bisa ditolak masuk karena "tiket sudah dipakai".' },
];

// Kombinasi berbahaya: bila SEMUA id dalam set tercentang → tampilkan peringatan.
export const KOMBO = [
  { butuh: ['nama', 'tgl', 'ibu'], judul: '⚠️ Kombo jawaban keamanan bank',
    jelas: 'Nama + tanggal lahir + nama ibu kandung = jawaban 3 pertanyaan keamanan paling umum. Penjahat bisa mencoba reset password bank/e-wallet atas namamu.' },
  { butuh: ['ktp', 'nama', 'hp'], judul: '⚠️ Kombo pencurian identitas',
    jelas: 'Foto KTP + nama + nomor HP = modal lengkap mengajukan pinjol ilegal atau verifikasi palsu atas namamu. Korban baru sadar saat ditagih debt collector!' },
  { butuh: ['alamat', 'realtime'], judul: '⚠️ Kombo rumah kosong',
    jelas: 'Alamat rumah + pengumuman "lagi liburan" = undangan terbuka untuk maling. Jangan pernah posting lokasi real-time.' },
  { butuh: ['nama', 'tgl', 'hp'], judul: '⚠️ Kombo tebakan akun',
    jelas: 'Tiga info ini cukup untuk menebak username, PIN, & password umum (mis. Nama+ddmmyy) lalu mencoba login ke akun-akunmu satu per satu.' },
];

export function hitungSkor(terpilih) {
  return Math.min(100, terpilih.reduce((a, it) => a + it.bobot, 0));
}

export function levelSkor(skor) {
  if (skor >= 70) return { label: 'KRITIS 🔴', warna: '#ef4444' };
  if (skor >= 40) return { label: 'TINGGI 🟠', warna: '#f59e0b' };
  if (skor >= 15) return { label: 'SEDANG 🟡', warna: '#eab308' };
  return { label: 'RENDAH 🟢', warna: '#22c55e' };
}

export function render(root) {
  const terpilih = new Set();
  const box = T.out();

  const hasil = T.out();
  const list = T.el('<div></div>');

  function renderHasil() {
    const items = ITEM.filter(it => terpilih.has(it.id));
    if (!items.length) {
      T.show(hasil,
        '<div class="dim" style="font-size:13px;text-align:center;padding:16px;border:1px dashed #ffffff20;border-radius:12px">Centang info yang pernah kamu bagikan secara publik (sosmed, grup chat, dsb) untuk melihat analisisnya. 👆</div>'
      );
      return;
    }
    const skor = hitungSkor(items);
    const lv = levelSkor(skor);
    const kombo = KOMBO.filter(k => k.butuh.every(id => terpilih.has(id)));

    let html =
      '<div style="border:1px solid ' + lv.warna + ';border-radius:12px;padding:14px;background:#18181b;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:14px"><b>Skor Risiko Jejak Digital</b></span><span style="font-size:13px;color:' + lv.warna + '"><b>' + lv.label + '</b></span></div>' +
      '<div style="height:10px;border-radius:6px;background:#27272a;overflow:hidden;margin-bottom:6px">' +
      '<div style="height:100%;width:' + skor + '%;border-radius:6px;background:' + lv.warna + ';transition:width .35s ease"></div></div>' +
      '<div class="dim" style="font-size:12px">' + skor + '/100 • ' + items.length + ' info tercentang</div></div>';

    html += '<div style="font-size:14px;margin:12px 0 8px"><b>🔎 Yang bisa disimpulkan penjahat:</b></div>';
    items.forEach(it => {
      html += '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:13px;line-height:1.6">' +
        '<b>' + T.esc(it.label) + '</b><br><span class="dim">' + T.esc(it.jelas) + '</span></div>';
    });

    if (kombo.length) {
      html += '<div style="font-size:14px;margin:14px 0 8px"><b>🚨 Kombinasi berbahaya terdeteksi:</b></div>';
      kombo.forEach(k => {
        html += '<div style="border:1px solid #ef4444;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:13px;line-height:1.6;background:rgba(239,68,68,.06)">' +
          '<b>' + T.esc(k.judul) + '</b><br><span class="dim">' + T.esc(k.jelas) + '</span></div>';
      });
    }

    html += '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;font-size:12.5px;line-height:1.7;margin-top:12px">' +
      '<b>🧹 Cara membersihkan jejak digital:</b><br>1. Hapus postingan lama berisi info di atas (cek arsip IG/FB).<br>' +
      '2. Atur akun sosmed ke <b>privat</b> & audit daftar followers.<br>' +
      '3. Jangan pernah posting dokumen identitas, boarding pass, atau lokasi real-time.<br>' +
      '4. Matikan tag lokasi otomatis di kamera/ponsel.</div>';

    T.show(hasil, html);
  }

  ITEM.forEach(it => {
    const row = T.el(
      '<label style="display:flex;gap:10px;align-items:center;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;margin-bottom:8px;cursor:pointer;font-size:13.5px;background:#18181b">' +
      '<input type="checkbox" style="width:18px;height:18px;accent-color:#f59e0b;flex-shrink:0;cursor:pointer">' +
      '<span>' + T.esc(it.label) + '</span></label>'
    );
    const cb = row.querySelector('input');
    cb.addEventListener('change', () => {
      if (cb.checked) terpilih.add(it.id); else terpilih.delete(it.id);
      row.style.borderColor = cb.checked ? '#f59e0b' : '#ffffff20';
      try { beep(cb.checked ? 660 : 330, 0.07, 'sine'); } catch (e) {}
      renderHasil();
    });
    list.appendChild(row);
  });

  root.append(
    T.el('<p class="dim" style="font-size:13px">Centang semua info pribadi yang <b>pernah kamu bagikan secara publik</b> (postingan, story, bio, grup chat). Tool ini menunjukkan apa yang bisa disimpulkan penjahat — 100% edukatif, tidak ada data yang dikirim ke mana pun.</p>'),
    list,
    hasil
  );
  renderHasil();
}
