import { h as T, kv, esc, errBox } from '../../core.js?v=6.13.0';

export const UTM_KEY = 'adiptools-utm-history';

/* Fungsi murni (bisa diuji dari node tanpa DOM). */
export function buildUtm(base, p) {
  let url = String(base == null ? '' : base).trim();
  if (!url) throw new Error('URL dasar kosong');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = 'https://' + url;
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('URL harus http atau https');
  const set = (k, v) => { const s = String(v == null ? '' : v).trim(); if (s) u.searchParams.set(k, s); };
  set('utm_source', p.source);
  set('utm_medium', p.medium);
  set('utm_campaign', p.campaign);
  set('utm_term', p.term);
  set('utm_content', p.content);
  return u.toString();
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(UTM_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

export function saveHistory(list) {
  try { localStorage.setItem(UTM_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) { /* penyimpanan penuh atau diblokir, abaikan */ }
}

export const meta = {"id": "utm-builder", "name": "UTM Builder", "cat": "developer", "icon": "🔗", "desc": "Susun link UTM untuk melacak asal pengunjung.", "keywords": "utm,link,tracking,analytics,kampanye", "since": "6.11.0"};
export function render(root) {
  const fUrl = T.input('text', 'https://contoh.com/halaman', '');
  const fSource = T.input('text', 'Misal: instagram, google, whatsapp', '');
  const fMedium = T.input('text', 'Misal: social, email, cpc', '');
  const fCampaign = T.input('text', 'Misal: promo-lebaran, launching', '');
  const fTerm = T.input('text', 'Kata kunci iklan (opsional)', '');
  const fContent = T.input('text', 'Pembeda konten, misal: tombol-biru (opsional)', '');
  const outBox = T.out();
  const histBox = T.el('<div style="margin-top:16px"></div>');
  let history = loadHistory();

  const collect = () => ({ source: fSource.value, medium: fMedium.value, campaign: fCampaign.value, term: fTerm.value, content: fContent.value });

  const paintHistory = () => {
    histBox.innerHTML = '';
    const head = T.el('<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span style="font-size:13px;font-weight:600">Riwayat (' + history.length + ')</span><span class="hint">Tersimpan di perangkat ini saja.</span></div>');
    histBox.appendChild(head);
    if (!history.length) {
      histBox.appendChild(T.el('<div class="hint">Belum ada riwayat. Link yang kamu buat akan muncul di sini.</div>'));
      return;
    }
    history.forEach((h, i) => {
      const row = T.el('<div style="background:#131316;border:1px solid #27272a;border-radius:8px;padding:10px;margin-bottom:6px"></div>');
      row.appendChild(T.el('<div style="font-size:13px;font-weight:600;margin-bottom:2px">' + esc(h.label || '(tanpa nama kampanye)') + '</div>'));
      row.appendChild(T.el('<div style="font-size:12px;font-family:monospace;word-break:break-all;color:#a1a1aa">' + esc(h.url) + '</div>'));
      const ctl = T.row(
        T.btn('Salin', () => T.copy(h.url)),
        T.btn('Hapus', () => { history.splice(i, 1); saveHistory(history); paintHistory(); })
      );
      ctl.style.marginTop = '8px';
      row.appendChild(ctl);
      histBox.appendChild(row);
    });
    const clear = T.btn('Hapus Semua Riwayat', () => { history = []; saveHistory(history); paintHistory(); });
    clear.style.marginTop = '4px';
    histBox.appendChild(clear);
  };

  const presets = [
    ['Google / Iklan', 'google', 'cpc'],
    ['Instagram', 'instagram', 'social'],
    ['TikTok', 'tiktok', 'social'],
    ['WhatsApp', 'whatsapp', 'referral'],
    ['Email', 'email', 'email'],
  ];
  const presetRow = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px"></div>');
  presets.forEach(([label, s, m]) => {
    const b = T.btn(label, () => { fSource.value = s; fMedium.value = m; });
    presetRow.appendChild(b);
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">UTM adalah penanda di ujung link yang mencatat dari mana pengunjung datang. Isi kolomnya, lalu bagikan link hasil akhirnya.</p>'));
  root.appendChild(T.field('URL dasar', fUrl, 'Halaman tujuan linkmu.'));
  root.appendChild(T.el('<div class="hint" style="margin-bottom:4px">Isi cepat sumber dan media:</div>'));
  root.appendChild(presetRow);
  root.appendChild(T.grid2(T.field('Sumber (source)', fSource, 'Dari mana: instagram, google, whatsapp.'), T.field('Media (medium)', fMedium, 'Jenisnya: social, email, cpc.')));
  root.appendChild(T.field('Nama kampanye (campaign)', fCampaign, 'Nama kegiatan atau promonya, misal promo-lebaran.'));
  root.appendChild(T.grid2(T.field('Kata kunci (term, opsional)', fTerm, 'Untuk iklan berbayar.'), T.field('Pembeda konten (content, opsional)', fContent, 'Untuk membedakan dua link kampanye yang sama.')));
  root.appendChild(T.row(T.btn('Buat Link', () => {
    let built;
    try { built = buildUtm(fUrl.value, collect()); } catch (e) {
      T.show(outBox, errBox(e.message === 'URL dasar kosong' ? 'Isi dulu URL dasarnya.' : 'URL dasarnya tidak benar. Periksa lagi penulisannya.'));
      return;
    }
    if (!fSource.value.trim() && !fMedium.value.trim() && !fCampaign.value.trim()) {
      T.show(outBox, errBox('Isi minimal satu dari: sumber, media, atau nama kampanye.'));
      return;
    }
    history.unshift({ url: built, label: fCampaign.value.trim() || fSource.value.trim(), ts: Date.now() });
    history = history.slice(0, 20);
    saveHistory(history);
    paintHistory();
    T.show(outBox, '<div style="font-size:12.5px;font-family:monospace;word-break:break-all;line-height:1.6">' + esc(built) + '</div>');
  }, true), T.copyBtn(() => { try { return buildUtm(fUrl.value, collect()); } catch (e) { return ''; } }, 'Salin Link')));
  root.appendChild(outBox);
  root.appendChild(histBox);
  paintHistory();
}
