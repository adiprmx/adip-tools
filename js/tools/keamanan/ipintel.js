import { h as T, utils, errBox, kv, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "ipintel", "name": "IP & ASN Intelligence", "cat": "keamanan", "icon": "🌐", "desc": "Lookup IP: ASN, organisasi jaringan, negara, dan status bogon.", "keywords": "ip,asn,lookup,jaringan,negara,bogon,whois"};

const HIST_KEY = 'at-ipintel-history-v1';

const isBogonV4 = (ip) => {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => isNaN(n) || n < 0 || n > 255)) return null; // bukan IPv4 valid
  const [a, b] = p;
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'private';
  if (a === 127) return 'loopback';
  if (a === 169 && b === 254) return 'link-local';
  if (a >= 224 && a <= 239) return 'multicast';
  if (a === 0) return 'reserved';
  return false;
};
const isBogonV6 = (ip) => {
  const s = ip.toLowerCase();
  if (s === '::1' || s === '::ffff:127.0.0.1') return 'loopback';
  if (/^(fc|fd)/.test(s.replace(/:/g, ''))) return 'unique-local';
  if (/^fe[89ab]/.test(s.replace(/:/g, ''))) return 'link-local';
  return false;
};

async function lookupIpwho(ip) {
  const r = await fetch('https://ipwho.is/' + encodeURIComponent(ip));
  if (!r.ok) throw new Error('ipwho.is: http ' + r.status);
  const j = await r.json();
  if (!j.success) throw new Error('ipwho.is: ' + (j.message || 'lookup gagal'));
  return {
    ip: j.ip, ver: j.type || (ip.includes(':') ? 'IPv6' : 'IPv4'),
    asn: j.connection && j.connection.asn ? 'AS' + j.connection.asn : '-',
    asname: (j.connection && j.connection.org) || '-',
    asdomain: (j.connection && j.connection.domain) || '',
    country: [j.country, j.country_code].filter(Boolean).join(' · ') || '-',
    continent: [j.continent, j.continent_code].filter(Boolean).join(' · ') || '-',
    via: 'ipwho.is',
  };
}
async function lookupIpapi(ip) {
  const r = await fetch('https://ipapi.co/' + encodeURIComponent(ip) + '/json/');
  if (!r.ok) throw new Error('ipapi.co: http ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error('ipapi.co: ' + j.reason);
  const cc = { AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe', NA: 'North America', OC: 'Oceania', SA: 'South America' };
  return {
    ip: j.ip, ver: j.version || (ip.includes(':') ? 'IPv6' : 'IPv4'),
    asn: j.asn || '-', asname: j.org || '-', asdomain: '',
    country: [j.country_name, j.country_code].filter(Boolean).join(' · ') || '-',
    continent: cc[j.continent_code] ? cc[j.continent_code] + ' · ' + j.continent_code : '-',
    via: 'ipapi.co',
  };
}

const getHist = () => { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } };
const pushHist = (h) => {
  const l = [h, ...getHist().filter((x) => x.ip !== h.ip)].slice(0, 6);
  try { localStorage.setItem(HIST_KEY, JSON.stringify(l)); } catch (e) {}
};

export function render(root) {
  let ctl = null;
  onLeave(() => { if (ctl) ctl.abort(); });

  const inp = T.input('text', '8.8.8.8 atau 2001:4860:4860::8888', '');
  inp.style.fontFamily = 'monospace';
  inp.inputMode = 'decimal';
  const out = T.out();
  const histBox = T.out();
  const btnAnalisis = T.btn('Analisis IP', () => analisis(false), true);
  const btnSaya = T.btn('IP Saya', () => analisis(true));

  const tampilHist = () => {
    const l = getHist();
    if (!l.length) { T.hide(histBox); return; }
    T.show(histBox, '<p class="dim" style="font-size:12.5px;margin:14px 0 6px"><b>Riwayat:</b></p><div style="display:flex;gap:6px;flex-wrap:wrap">' +
      l.map((h, i) => '<button class="btn" data-h="' + i + '" style="font-family:monospace;font-size:12px" title="' + T.esc(h.country || '') + '">' +
        T.esc(h.ip) + (h.asn && h.asn !== '-' ? ' <span class="dim">' + T.esc(h.asn) + '</span>' : '') + '</button>').join('') + '</div>');
    histBox.querySelectorAll('[data-h]').forEach((b) => { b.onclick = () => { inp.value = getHist()[+b.getAttribute('data-h')].ip; analisis(); }; });
  };

  const analisis = async (self) => {
    let ip = inp.value.trim();
    if (self) ip = '';
    if (!self && !ip) { T.show(out, errBox('IP belum diisi.')); return; }
    if (ctl) ctl.abort();
    ctl = new AbortController();
    btnAnalisis.disabled = true;
    btnSaya.disabled = true;
    T.show(out, '<p class="dim">Menganalisis…</p>');
    try {
      let d;
      if (self) {
        const r = await fetch('https://ipwho.is/', { signal: ctl.signal });
        const j = await r.json();
        if (!j.success) throw new Error('gagal deteksi IP sendiri');
        d = await lookupIpwho(j.ip);
      } else {
        const b4 = isBogonV4(ip), b6 = ip.includes(':') ? isBogonV6(ip) : false;
        if (b4 === null && !ip.includes(':')) throw new Error('Format IP tidak valid.');
        const bogon = b4 || b6;
        if (bogon) {
          T.show(out,
            '<div style="border:1px solid #fbbf24;border-radius:12px;padding:14px;background:#1a1410">' +
            '<div class="big" style="color:#fbbf24">BOGON · NON-ROUTABLE</div>' +
            kv('IP', '<span style="font-family:monospace">' + T.esc(ip) + '</span>') +
            kv('Jenis', T.esc(String(bogon))) +
            '<p class="dim" style="font-size:12.5px;line-height:1.6">Alamat ini terdeteksi sebagai bogon / non-routable (rentang privat, loopback, atau reserved) — tidak ada di internet publik, jadi tidak ada data ASN-nya.</p></div>');
          return;
        }
        try { d = await lookupIpwho(ip); }
        catch (e1) { d = await lookupIpapi(ip); } // fallback penyedia kedua
      }
      pushHist({ ip: d.ip, asn: d.asn, country: d.country, t: Date.now() });
      tampilHist();
      const asLink = d.asdomain ? '<a href="https://' + T.esc(d.asdomain) + '" target="_blank" rel="noopener" style="color:#8ab8ff">Buka ' + T.esc(d.asdomain) + ' ↗</a>' : '-';
      T.show(out,
        '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#161311">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">' +
        '<span style="font-size:12px;border:1px solid #ffffff30;border-radius:20px;padding:3px 10px">' + T.esc(d.ver) + '</span>' +
        '<span style="font-size:12px;border:1px solid #7ccf8f66;color:#7ccf8f;border-radius:20px;padding:3px 10px">● ROUTABLE</span>' +
        '<span style="font-size:12px;border:1px solid #8ab8ff66;color:#8ab8ff;border-radius:20px;padding:3px 10px">LIVE</span>' +
        '<span class="dim" style="font-size:11px">via ' + T.esc(d.via) + '</span></div>' +
        kv('IP Address', '<span style="font-family:monospace">' + T.esc(d.ip) + '</span>') +
        kv('ASN', '<b style="font-family:monospace">' + T.esc(d.asn) + '</b>') +
        kv('Nama AS', T.esc(d.asname)) +
        kv('Domain AS', asLink) +
        kv('Negara', T.esc(d.country)) +
        kv('Benua', T.esc(d.continent)) +
        '<p class="dim" style="font-size:11.5px;line-height:1.6;margin:10px 0 0">Data paket Lite: hanya info ASN &amp; negara — tanpa klaim kota/koordinat/VPN/proxy.</p>' +
        '<div style="margin-top:12px"><button class="btn" data-c="json">Salin JSON</button></div></div>');
      out.querySelector('[data-c=json]').onclick = () => T.copy(JSON.stringify(d, null, 2));
    } catch (e) {
      if (e.name === 'AbortError') return;
      const msg = /429|rate limit/i.test(e.message)
        ? 'Batas permintaan API tercapai (rate limit). Tunggu sebentar lalu coba lagi.'
        : 'Gagal: ' + e.message + ' (kedua penyedia tidak merespons)';
      T.show(out, errBox(msg));
    } finally {
      btnAnalisis.disabled = false;
      btnSaya.disabled = false;
    }
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cek info jaringan sebuah IP: nomor ASN, organisasi, negara, dan benua. Data dari API publik ipwho.is (fallback ipapi.co) — langsung dari browser, tanpa server.</p>'));
  root.appendChild(T.field('Alamat IP', inp));
  root.appendChild(T.row(btnAnalisis, btnSaya));
  root.appendChild(out);
  root.appendChild(histBox);
  tampilHist();
}
