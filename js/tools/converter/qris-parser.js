import { h as T, utils } from '../../core.js';

export const meta = {id:"qris-parser", name:"Bedah Kode QRIS", cat:"converter", icon:"🧾", desc:"Lihat isi kode QRIS bagian per bagian, plus cek CRC-nya.", keywords:"qris,emvco,parser,crc,payload,qr,desain,keamanan"};
export function render(root) {

    // ---------- CRC16-CCITT (poly 0x1021, init 0xFFFF), sesuai standar EMVCo ----------
    function crc16ccitt(str) {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
          crc &= 0xFFFF;
        }
      }
      return crc;
    }

    // ---------- TLV parser: ID(2 digit) + Length(2 digit) + Value ----------
    function parseTLV(str, what) {
      const fields = [];
      let p = 0;
      while (p < str.length) {
        if (p + 4 > str.length) throw new Error(what + ' rusak di posisi ' + p + ': sisanya kurang dari 4 karakter (ID+panjang).');
        const id = str.substring(p, p + 2), ln = str.substring(p + 2, p + 4);
        if (!/^\d{2}$/.test(id)) throw new Error(what + ' rusak di posisi ' + p + ': ID "' + id + '" bukan 2 digit angka.');
        if (!/^\d{2}$/.test(ln)) throw new Error(what + ' rusak di posisi ' + p + ': Panjang "' + ln + '" bukan 2 digit angka.');
        const len = parseInt(ln, 10);
        const val = str.substring(p + 4, p + 4 + len);
        if (val.length < len) throw new Error(what + ' rusak di posisi ' + p + ': bagian ' + id + ' mengaku panjangnya ' + len + ' tapi sisanya cuma ' + val.length + ' karakter.');
        fields.push({ id: id, len: len, val: val });
        p += 4 + len;
      }
      return fields;
    }

    // ---------- Penjelasan field ----------
    const INFO = {
      "00": ["Payload Format Indicator", "Versi format kode EMVCo. Untuk QRIS/QR statis selalu '01'."],
      "01": ["Point of Initiation Method", "'11' = QR STATIS (nominal diketik manual oleh pembayar), '12' = QR DINAMIS (nominal sudah tertanam)."],
      "52": ["Merchant Category Code (MCC)", "Kode 4 digit kategori usaha merchant (mis. 5411 = toko kelontong)."],
      "53": ["Transaction Currency", "Kode mata uang ISO 4217. '360' = Rupiah Indonesia (IDR)."],
      "54": ["Transaction Amount", "Nominal yang harus dibayar pembeli, dalam mata uang bagian 53."],
      "55": ["Tip / Convenience Indicator", "Indikator opsional: '01' = tip boleh diinput, '02' = biaya tambahan persen, '03' = biaya tetap."],
      "58": ["Country Code", "Kode negara ISO 3166-1 alpha-2. 'ID' = Indonesia."],
      "59": ["Merchant Name", "Nama merchant/toko yang akan menerima pembayaran."],
      "60": ["Merchant City", "Kota lokasi merchant."],
      "61": ["Postal Code", "Kode pos merchant (opsional)."],
      "63": ["CRC", "Kode cek CRC16-CCITT dari seluruh kode — memastikan datanya utuh."],
      "64": ["Merchant Information — Language", "Template bahasa alternatif (sub-bagian: 00 = kode bahasa, 01 = nama merchant alternatif)."]
    };
    const SUB_INFO_26 = {
      "00": ["Globally Unique ID (GUI)", "ID unik penyedia QRIS (mis. ID.CO.* milik penerbit)."],
      "01": ["Merchant PAN / ID Merchant", "Nomor akun / ID merchant di penyedia."],
      "02": ["Merchant Criteria", "Kriteria merchant, mis. 'UMI' (Usaha Mikro), 'UME' (Usaha Menengah)."]
    };
    const SUB_INFO_62 = {
      "01": ["Bill Number", "Nomor tagihan / invoice (opsional)."],
      "02": ["Mobile Number", "Nomor HP tujuan (opsional)."],
      "03": ["Store Label", "Label/nama toko cabang (opsional)."],
      "04": ["Loyalty Number", "Nomor loyalti pelanggan (opsional)."],
      "05": ["Reference Label", "Label referensi transaksi (opsional)."],
      "07": ["Terminal Label", "Label terminal/EDC (opsional)."],
      "08": ["Purpose of Transaction", "Tujuan transaksi (opsional)."]
    };
    function fieldTitle(id) {
      const n = parseInt(id, 10);
      if (id === "62") return ["Additional Data Field", "Data tambahan opsional (lihat sub-bagian di bawah)."];
      if (id === "63") return INFO["63"];
      if (n >= 26 && n <= 51) return ["Merchant Account Information (ID " + id + ")", "Info akun merchant dari penyedia QRIS (lihat sub-bagian di bawah)."];
      if (n >= 65 && n <= 79) return ["Unreserved Template (ID " + id + ")", "Template cadangan untuk penggunaan khusus penyedia."];
      if (n >= 80 && n <= 99) return ["Unreserved (ID " + id + ")", "Bagian bebas untuk kebutuhan khusus."];
      return INFO[id] || ["Field " + id, "Bagian tidak dikenal / tidak wajib di QRIS."];
    }
    function subTitle(containerId, subId) {
      if (containerId === "62") return SUB_INFO_62[subId] || ["Sub-bagian " + subId, "Sub-bagian tambahan."];
      if (containerId === "64") return subId === "00" ? ["Language Preference", "Kode bahasa ISO 639 (mis. ID)."] : ["Nama Merchant Alternatif", "Nama merchant dalam bahasa lain."];
      return SUB_INFO_26[subId] || ["Sub-bagian " + subId, "Sub-bagian info akun merchant."];
    }
    const CURR = { "360": "IDR — Rupiah Indonesia", "840": "USD — Dolar AS", "978": "EUR — Euro", "702": "SGD — Dolar Singapura", "458": "MYR — Ringgit Malaysia", "764": "THB — Baht Thailand", "608": "PHP — Peso Filipina", "392": "JPY — Yen Jepang", "356": "INR — Rupee India", "36": "AUD — Dolar Australia", "826": "GBP — Pound Inggris", "704": "VND — Dong Vietnam" };
    const fmtRp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

    // ---------- Payload contoh (SINTETIS — bukan merchant asli) ----------
    // Dibangkitkan dengan CRC16-CCITT yang benar (lihat laporan subagent).
    const CONTOH = "00020101021126450013ID.CO.EXAMPLE0117ID.CNTH.UMI0000000203UMI5204000053033605405150005802ID5911TOKO CONTOH6007JAKARTA63047F7B";

    const inp = T.ta(4, 'Tempel kode QRIS/EMVCo di sini… (contoh: 00020101…)');
    const out = T.out();

    function bedah() {
      const raw = inp.value.replace(/[\r\n\t]/g, '').trim().toUpperCase();
      if (!raw) { T.show(out, '<span class="err">Tempel dulu kode QRIS-nya.</span>'); return; }
      if (!/^[0-9A-Z.\-_ ]+$/.test(raw)) { T.show(out, '<span class="err">Kodenya tidak benar: hanya boleh berisi huruf, angka, spasi, titik (.), strip (-), atau garis bawah (_).</span>'); return; }
      let fields;
      try { fields = parseTLV(raw, 'Payload'); }
      catch (e) { T.show(out, '<span class="err">⚠️ ' + T.esc(e.message) + '</span>'); return; }
      if (fields.length === 0) { T.show(out, '<span class="err">Kodenya kosong — tidak ada bagian yang bisa dibedah.</span>'); return; }

      const map = {};
      fields.forEach((f) => { map[f.id] = f.val; });

      // ---------- Validasi CRC ----------
      let crcHtml;
      const crcField = fields[fields.length - 1];
      if (crcField.id === '63' && crcField.val.length === 4 && /^[0-9A-F]{4}$/.test(crcField.val)) {
        const calc = crc16ccitt(raw.slice(0, -4)).toString(16).toUpperCase().padStart(4, '0');
        const ok = calc === crcField.val;
        crcHtml = ok
          ? '<div style="padding:12px;border:1px solid #22c55e55;border-radius:10px;background:#052e16;color:#bbf7d0;font-weight:700;font-size:15px">✔ CRC COCOK <span style="font-weight:400;font-size:12px;opacity:.85">(tertera ' + T.esc(crcField.val) + ' = hitungan ' + calc + ' — kodenya utuh & tidak diubah)</span></div>'
          : '<div style="padding:12px;border:1px solid #ef444455;border-radius:10px;background:#450a0a;color:#fecaca;font-weight:700;font-size:15px">✘ CRC TIDAK COCOK <span style="font-weight:400;font-size:12px;opacity:.85">(tertera ' + T.esc(crcField.val) + ' ≠ hitungan ' + calc + ' — kodenya rusak / sudah diubah)</span></div>';
      } else {
        crcHtml = '<div style="padding:12px;border:1px solid #f59e0b55;border-radius:10px;background:#451a03;color:#fde68a;font-weight:700;font-size:15px">⚠ CRC TIDAK DITEMUKAN <span style="font-weight:400;font-size:12px;opacity:.85">(bagian 63 wajib ada di ujung kode QRIS yang benar)</span></div>';
      }

      // ---------- Ringkasan ----------
      const amt = map["54"];
      const currNote = map["53"] && CURR[map["53"]] ? ' <span style="opacity:.7">(' + T.esc(CURR[map["53"]]) + ')</span>' : '';
      const sumHtml =
        '<h3 class="h3">📋 Ringkasan</h3>' +
        '<div class="kv"><span class="k">Nama merchant</span><span class="v">' + T.esc(map["59"] || '— (bagian 59 tidak ada)') + '</span></div>' +
        '<div class="kv"><span class="k">Kota</span><span class="v">' + T.esc(map["60"] || '— (bagian 60 tidak ada)') + '</span></div>' +
        '<div class="kv"><span class="k">Nominal</span><span class="v big">' + (amt && /^\d+(\.\d+)?$/.test(amt) ? T.esc(fmtRp(amt)) : '— (QR statis / bagian 54 tidak ada)') + '</span></div>' +
        '<div class="kv"><span class="k">Mata uang</span><span class="v">' + T.esc(map["53"] || '—') + currNote + '</span></div>' +
        '<div class="kv"><span class="k">Tipe QR</span><span class="v">' + (map["01"] === '11' ? 'Statis (nominal manual)' : map["01"] === '12' ? 'Dinamis (nominal tertanam)' : '—') + '</span></div>';

      // ---------- Detail field ----------
      let det = '<h3 class="h3" style="margin-top:18px">🔍 Bedah Bagian (' + fields.length + ' bagian)</h3>';
      fields.forEach((f) => {
        const t = fieldTitle(f.id);
        let inner = '<div style="font-size:12px;opacity:.75;margin-top:2px">' + T.esc(t[1]) + '</div>';
        const n = parseInt(f.id, 10);
        if ((n >= 26 && n <= 51) || f.id === '62' || f.id === '64') {
          try {
            const subs = parseTLV(f.val, 'Sub-bagian ' + f.id);
            inner += '<div style="margin-top:6px;border-left:2px solid #ffffff22;padding-left:10px">';
            subs.forEach((s) => {
              const st = subTitle(f.id, s.id);
              inner += '<div class="kv" style="padding:3px 0"><span class="k" style="font-size:12px">(' + s.id + ') ' + T.esc(st[0]) + '</span><span class="v monoall" style="font-size:12px;word-break:break-all">' + T.esc(s.val) + '</span></div>' +
                '<div style="font-size:11px;opacity:.6;margin:-2px 0 6px 0">' + T.esc(st[1]) + '</div>';
            });
            inner += '</div>';
          } catch (e) {
            inner += '<div style="font-size:12px;color:#fca5a5;margin-top:4px">⚠️ ' + T.esc(e.message) + '</div>';
          }
        }
        det += '<div style="border:1px solid #ffffff1a;border-radius:10px;padding:10px 12px;margin:8px 0">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap">' +
          '<b style="font-size:14px">ID ' + f.id + ' — ' + T.esc(t[0]) + '</b>' +
          '<span class="monoall" style="font-size:11px;opacity:.6">panjang=' + f.len + '</span></div>' +
          '<div class="monoall" style="font-size:13px;margin-top:6px;word-break:break-all;background:#00000055;border-radius:6px;padding:6px 8px">' + T.esc(f.val) + '</div>' +
          inner + '</div>';
      });

      const note = map["00"] !== '01' ? '<div style="font-size:12px;color:#fde68a;margin:8px 0">⚠️ Catatan: bagian 00 bukan "01" — ini mungkin bukan kode QRIS/EMVCo standar.</div>' : '';

      T.show(out, crcHtml + note +
        '<div style="margin-top:14px">' + sumHtml + '</div>' +
        '<div style="margin-top:6px">' + det + '</div>');
      out.appendChild(T.row(T.copyBtn(() => raw, 'Salin Kode')));
    }

    root.appendChild(T.el('<h3 class="h3">📥 Kode QRIS / EMVCo</h3>'));
    root.appendChild(T.field('Kode QRIS', inp, 'Tempel kode panjang dari QR QRIS (biasanya diawali "000201"). Semua diproses di HP kamu.'));
    root.appendChild(T.row(
      T.btn('🔍 Bedah Kode', bedah, true),
      T.btn('Contoh Benar', () => { inp.value = CONTOH; bedah(); }),
      T.btn('Contoh Rusak', () => { inp.value = CONTOH.slice(0, -2) + 'FF'; bedah(); }),
      T.btn('Bersihkan', () => { inp.value = ''; out.innerHTML = ''; })
    ));
    root.appendChild(out);
    root.appendChild(T.el('<div style="font-size:12px;opacity:.65;margin-top:10px">ℹ️ <b>Edukasi:</b> kode QRIS memakai format TLV — <b>T</b>ag (2 digit ID field), <b>L</b>ength (2 digit panjang value), <b>V</b>alue (isi sepanjang Length). Bagian 63 (CRC16-CCITT) memastikan kodenya tidak rusak saat disalin/dipindai. Data contoh di atas sintetis, bukan merchant asli.</div>'));

}
