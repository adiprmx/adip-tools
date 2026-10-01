import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "analisis-url", "name": "Analisis URL", "cat": "keamanan", "icon": "🔗", "desc": "Bedah URL & deteksi pola mencurigakan.", "keywords": "url,phising,aman,link,analisis"};
export function render(root) {

    const BRAND = {
      bca: 'bca.co.id', mandiri: 'bankmandiri.co.id', bri: 'bri.co.id', bni: 'bni.co.id',
      dana: 'dana.id', ovo: 'ovo.id', gopay: 'gopay.co.id', paypal: 'paypal.com',
      shopee: 'shopee.co.id', tokopedia: 'tokopedia.com', lazada: 'lazada.co.id',
      whatsapp: 'whatsapp.com', telegram: 'telegram.org', instagram: 'instagram.com',
      facebook: 'facebook.com', google: 'google.com', apple: 'apple.com', tiktok: 'tiktok.com',
    };
    const TLD_UMUM = ['com', 'co.id', 'id', 'org', 'net', 'io', 'me', 'info', 'app', 'dev',
      'ac.id', 'go.id', 'sch.id', 'or.id', 'web.id', 'biz.id', 'my.id', 'co'];

    const inp = T.input('text', 'Tempel link di sini…', 'https://');
    inp.style.fontFamily = 'monospace';
    const box = T.out();

    const domainUtama = (host) => {
      const l = host.toLowerCase().split('.');
      const tiga = l.slice(-3).join('.');
      const duaBelakang = l.slice(-2).join('.');
      if (/^(co|go|ac|or|sch|web|biz|my)\.id$/.test(duaBelakang)) return l.length >= 3 ? tiga : host;
      return l.length >= 2 ? duaBelakang : host;
    };

    function bedah() {
      let s = inp.value.trim();
      if (!s) { T.show(box, '<span class="err">Tempel dulu link yang mau dianalisis.</span>'); return; }
      if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
      let u;
      try { u = new URL(s); }
      catch (e) { T.show(box, '<span class="err">Link-nya nggak valid. Coba cek lagi, mungkin ada yang kepotong.</span>'); return; }

      const host = u.hostname.toLowerCase();
      const label = host.split('.');
      const du = domainUtama(host);
      const sub = label.length > du.split('.').length ? label.slice(0, label.length - du.split('.').length).join('.') : '-';
      const params = [...u.searchParams.entries()];

      const temuan = []; // {judul, jelas}
      const aman = [];   // {judul}

      // 1. HTTP vs HTTPS
      if (u.protocol === 'https:') aman.push({ judul: 'Pakai HTTPS 🔒' });
      else temuan.push({ judul: 'Bukan HTTPS', jelas: 'Link ini pakai http biasa — data yang kamu kirim (termasuk password) bisa diintip di tengah jalan.' });

      // 2. Domain berupa IP
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':'))
        temuan.push({ judul: 'Domain-nya IP langsung', jelas: 'Situs beneran pakai nama domain, bukan angka IP mentah. Ini pola umum link jebakan.' });
      else aman.push({ judul: 'Domain berupa nama, bukan IP' });

      // 3. Karakter @
      if (u.username || /@/.test(u.href.replace(/^https?:\/\//i, '').split('/')[0]))
        temuan.push({ judul: "Ada '@' di URL", jelas: "Browser cuma buka bagian SETELAH '@'. Jadi 'bankasli.com@jahat.xyz' itu sebenarnya buka jahat.xyz, bukan bankasli.com." });
      else aman.push({ judul: "Tidak ada '@' mencurigakan" });

      // 4. Subdomain berlapis
      if (label.length >= 4)
        temuan.push({ judul: 'Subdomain bertumpuk (' + label.length + ' lapis)', jelas: 'Makin panjang tumpukannya, makin gampang nyamar. Domain aslinya yang nempel TLD: ' + du + '.' });
      else if (sub !== '-') aman.push({ judul: 'Struktur subdomain wajar' });
      else aman.push({ judul: 'Tanpa subdomain aneh' });

      // 4b. Meniru brand
      Object.keys(BRAND).forEach((b) => {
        if (host.includes(b) && du !== BRAND[b])
          temuan.push({ judul: "Mungkin nyamar jadi '" + b + "'", jelas: "Ada kata '" + b + "' di link, tapi domain aslinya " + du + ' — bukan ' + BRAND[b] + '. Situs resmi nggak bakal kayak gini.' });
      });

      // 5. Homograph / unicode aneh
      if (/[^\x00-\x7F]/.test(host))
        temuan.push({ judul: 'Ada karakter aneh di domain', jelas: 'Domain mengandung huruf non-standar (misal huruf Cyrillic yang mirip "a"). Ini trik homograph buat nipu mata.' });
      else aman.push({ judul: 'Domain pakai huruf normal' });

      // 6. TLD tidak umum
      const tld = label[label.length - 1];
      const tld2 = label.slice(-2).join('.');
      if (!TLD_UMUM.includes(tld2) && !TLD_UMUM.includes(tld))
        temuan.push({ judul: 'TLD tidak umum (.' + tld + ')', jelas: 'Situs resmi Indonesia umumnya pakai .com, .co.id, atau .id. TLD asing yang murah sering dipakai buat link jebakan — waspada ekstra.' });
      else aman.push({ judul: 'TLD umum (.' + (/\.id$/.test(tld2) ? tld2 : tld) + ')' });

      // Skor
      const n = temuan.length;
      const skor = n === 0 ? ['RENDAH', 'ok', '✅'] : n <= 2 ? ['SEDANG', 'warn', '⚠️'] : ['TINGGI', 'err', '🚨'];

      let html = '<div class="kv"><span class="k">Skor risiko</span><span class="v big ' + skor[1] + '">' + skor[2] + ' ' + skor[0] + '</span></div>';
      html += '<div style="margin-top:10px"><b>🔍 Bedah komponen:</b></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">' +
        [['Protokol', u.protocol.replace(':', '')], ['Domain', host], ['Subdomain', sub], ['Domain utama', du],
          ['Path', u.pathname === '/' ? '(kosong)' : u.pathname],
          ['Parameter', params.length ? params.length + ' buah' : '(tidak ada)']]
          .map(([k, v]) => '<tr><td style="padding:7px 8px;color:#c9bda9;border-bottom:1px solid #251f18;vertical-align:top;white-space:nowrap">' + T.esc(k) + '</td><td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;word-break:break-all">' + T.esc(v) + '</td></tr>').join('') +
        '</table>';
      if (params.length) {
        html += '<div style="margin-top:8px"><b>Parameter URL:</b></div><ul style="margin:6px 0 0;padding-left:20px;font-family:monospace;font-size:12.5px;word-break:break-all">' +
          params.map(([k, v]) => '<li>' + T.esc(k) + ' = ' + T.esc(v.length > 80 ? v.slice(0, 80) + '…' : v) + '</li>').join('') + '</ul>';
      }
      if (temuan.length) {
        html += '<div style="margin-top:12px"><b>🚩 Tanda bahaya (' + n + '):</b></div><div style="display:grid;gap:8px;margin-top:6px">' +
          temuan.map((t) => '<div style="border:1px solid #ef444455;border-radius:10px;padding:10px 12px;background:#ef444411"><b class="err">' + T.esc(t.judul) + '</b><div style="font-size:12.5px;line-height:1.6;margin-top:4px">' + T.esc(t.jelas) + '</div></div>').join('') + '</div>';
      }
      if (aman.length) {
        html += '<div style="margin-top:12px"><b>✅ Yang terlihat aman:</b></div><ul style="margin:6px 0 0;padding-left:20px;font-size:13px">' +
          aman.map((a) => '<li>' + T.esc(a.judul) + '</li>').join('') + '</ul>';
      }
      html += '<div style="margin-top:14px;border-top:1px dashed #ffffff20;padding-top:10px"><b>💡 3 tips biar nggak kena:</b><ol style="margin:6px 0 0;padding-left:20px;font-size:13px;line-height:1.7">' +
        '<li>Jangan buru-buru klik link dari chat/SMS yang maksa ("akun diblokir!", "hadiah hangus!"). Penipu jago bikin panik.</li>' +
        '<li>Selalu baca domain ASLI-nya — yang nempel TLD paling kanan. "bca.promo-gratis.xyz" itu domainnya promo-gratis.xyz, bukan BCA.</li>' +
        '<li>Kalau ragu, jangan klik. Buka aplikasinya langsung (m-banking, e-wallet) dan cek dari dalam sana.</li></ol></div>' +
        '<p class="dim" style="font-size:12px;margin-top:10px">⚠️ Tool ini cuma deteksi pola, bukan vonis final. Link yang lolos semua cek pun tetap bisa berbahaya — akal sehat tetap nomor satu.</p>';
      T.show(box, html);
    }

    root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Dapat link mencurigakan dari chat atau SMS? Tempel di sini — kita bedah bareng komponennya dan cek tanda-tanda bahayanya.</p>'));
    root.appendChild(T.field('URL yang mau dicek', inp));
    root.appendChild(T.row(T.btn('🔍 Bedah URL', bedah, true)));
    root.appendChild(box);

}
