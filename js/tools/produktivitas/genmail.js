import { h as T, utils, errBox, kv, tabs, onLeave } from '../../core.js?v=6.9.20';

export const meta = {"id": "genmail", "name": "Temp Mail", "cat": "produktivitas", "icon": "📧", "desc": "Email sementara: buat alamat, terima & baca pesan tanpa daftar.", "keywords": "temp mail,email sementara,inbox,otp,spam,guerrillamail"};

const API = 'https://api.guerrillamail.com/ajax.php';
const AGENT = 'adip-tools-tempmail';
const EXPIRY_MS = 60 * 60 * 1000; // alamat GuerrillaMail kedaluwarsa ±60 menit

const q = (p) => Object.entries(p).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');

async function api(params, signal) {
  const r = await fetch(API + '?' + q(params), { signal });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

// Sanitasi HTML email: buang script/style/iframe/form + event handler,
// link hanya http/https/mailto. Kembalikan {html, links}.
function sanitizeEmailHtml(raw) {
  const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) n.removeAttribute(a.name);
      if ((a.name === 'src' || a.name === 'href') && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
    });
  });
  const links = [];
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (/^(https?:|mailto:)/i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.style.color = '#8ab8ff';
      links.push(href);
    } else a.removeAttribute('href');
  });
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!/^(https?:|data:image\/)/i.test(src)) img.removeAttribute('src');
    img.style.maxWidth = '100%';
  });
  return { html: doc.body.innerHTML, links: [...new Set(links)] };
}

const waktu = (ts) => {
  if (!ts) return '-';
  const d = new Date(Number(ts) * 1000);
  return isNaN(d) ? '-' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function render(root) {
  let sid = null, email = null, bornAt = 0;
  let ctl = null;
  onLeave(() => { if (ctl) ctl.abort(); });

  const abort = () => { if (ctl) ctl.abort(); ctl = new AbortController(); return ctl.signal; };

  // ---- Tab 1: Email baru ----
  const pNew = T.el('<div></div>');
  const userInp = T.input('text', 'Nama email (opsional, mis. adip123)', '');
  userInp.maxLength = 64;
  userInp.style.fontFamily = 'monospace';
  const outNew = T.out();
  const addrBox = T.out();

  const showAddr = () => {
    if (!email) { T.hide(addrBox); return; }
    const sisa = Math.max(0, Math.round((EXPIRY_MS - (Date.now() - bornAt)) / 60000));
    T.show(addrBox,
      '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#161311">' +
      '<div class="dim" style="font-size:12px">Alamat email aktif ' + (sisa > 0 ? '(±' + sisa + ' mnt lagi)' : '(segera kedaluwarsa)') + '</div>' +
      '<div style="font-family:monospace;font-size:17px;word-break:break-all;margin:8px 0">' + T.esc(email) + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn" data-a="copy">📋 Salin Email</button>' +
      '<button class="btn primary" data-a="inbox">📥 Buka Inbox</button>' +
      '</div></div>');
    addrBox.querySelector('[data-a=copy]').onclick = () => T.copy(email);
    addrBox.querySelector('[data-a=inbox]').onclick = () => { setTab(1); muatInbox(); };
  };

  const buat = async () => {
    const nama = userInp.value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (userInp.value.trim() && !nama) { T.show(outNew, errBox('Nama email hanya boleh huruf, angka, titik, strip, underscore.')); return; }
    if (nama.length > 64) { T.show(outNew, errBox('Nama email maksimal 64 karakter.')); return; }
    const sig = abort();
    T.show(outNew, '<p class="dim">Membuat alamat email…</p>');
    try {
      if (nama) {
        // alamat acak dulu untuk dapat sid_token, lalu set nama custom
        const s0 = await api({ f: 'get_email_address', ip: '127.0.0.1', agent: AGENT, lang: 'en' }, sig);
        const s1 = await api({ f: 'set_email_user', email_user: nama, lang: 'en', sid_token: s0.sid_token }, sig);
        if (s1.alias_error) throw new Error('Nama "' + nama + '" tidak bisa dipakai. Coba nama lain.');
        sid = s1.sid_token; email = s1.email_addr;
      } else {
        const s0 = await api({ f: 'get_email_address', ip: '127.0.0.1', agent: AGENT, lang: 'en' }, sig);
        sid = s0.sid_token; email = s0.email_addr;
      }
      bornAt = Date.now();
      T.hide(outNew);
      showAddr();
      T.toast('Email aktif!');
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(outNew, errBox('Gagal membuat email: ' + e.message + '. Coba lagi.'));
    }
  };

  pNew.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Butuh email sekali pakai buat daftar/OTP tanpa mengumbar email utama? Buat di sini — gratis, tanpa daftar, kedaluwarsa ±60 menit. Email ini <b>hanya bisa menerima</b>, tidak bisa mengirim.</p>'));
  pNew.appendChild(T.field('Nama email (opsional — kosong = acak)', userInp));
  pNew.appendChild(T.row(T.btn('✨ Buat Email', buat, true)));
  pNew.appendChild(outNew);
  pNew.appendChild(addrBox);

  // ---- Tab 2: Inbox ----
  const pIn = T.el('<div></div>');
  const outIn = T.out();
  const listBox = T.out();
  const readBox = T.out();
  let lastCd = 0;

  const muatInbox = async () => {
    if (!sid) { T.show(listBox, '<p class="dim">Buat email dulu di tab "Email Baru".</p>'); T.hide(readBox); return; }
    const now = Date.now();
    if (now - lastCd < 5000) { T.toast('Tunggu sebentar sebelum refresh lagi'); return; }
    lastCd = now;
    const sig = abort();
    T.show(listBox, '<p class="dim">Memeriksa inbox…</p>');
    T.hide(readBox);
    try {
      const j = await api({ f: 'get_email_list', seq: 0, offset: 0, sid_token: sid }, sig);
      const list = (j && j.list) || [];
      setTabLabel(list.length);
      if (!list.length) {
        T.show(listBox, '<p class="dim">Inbox masih kosong. Daftarkan <b>' + T.esc(email || '') + '</b> di situs/aplikasi, lalu refresh.</p>');
        return;
      }
      T.show(listBox, '<div style="display:grid;gap:8px">' + list.map((m) =>
        '<button class="btn" data-mid="' + T.esc(String(m.mail_id)) + '" style="text-align:left;display:block;width:100%">' +
        '<div style="font-size:13px"><b>' + T.esc(m.mail_subject || '(tanpa subjek)') + '</b>' + (m.mail_read === '1' || m.mail_read === 1 ? '' : ' <span style="color:#ff7a59">●</span>') + '</div>' +
        '<div class="dim" style="font-size:12px;margin-top:4px">' + T.esc(m.mail_from || '') + ' · ' + T.esc(waktu(m.mail_timestamp)) + '</div>' +
        '<div class="dim" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc((m.mail_excerpt || '').replace(/\s+/g, ' ').slice(0, 90)) + '</div>' +
        '</button>').join('') + '</div>');
      listBox.querySelectorAll('[data-mid]').forEach((b) => { b.onclick = () => bacaPesan(b.getAttribute('data-mid')); });
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(listBox, errBox('Gagal memuat inbox: ' + e.message));
    }
  };

  const bacaPesan = async (mid) => {
    const sig = abort();
    T.show(readBox, '<p class="dim">Membuka pesan…</p>');
    try {
      let j = await api({ f: 'fetch_email', email_id: mid, sid_token: sid }, sig);
      if (!j || j === false) {
        const l = await api({ f: 'get_email_list', seq: 0, offset: 0, sid_token: sid }, sig);
        j = (l.list || []).find((m) => String(m.mail_id) === String(mid)) || {};
      }
      const subj = j.mail_subject || '(tanpa subjek)';
      const body = j.mail_body || '';
      const isHtml = /<[a-z][\s\S]*>/i.test(body);
      let isiHtml, links = [];
      if (isHtml) {
        const s = sanitizeEmailHtml(body);
        isiHtml = s.html; links = s.links;
      } else {
        isiHtml = '<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.7;margin:0">' + T.esc(body) + '</pre>';
        const found = String(body).match(/https?:\/\/[^\s<>"']+/g) || [];
        links = [...new Set(found)];
      }
      T.show(readBox,
        '<div style="border:1px solid #ffffff20;border-radius:12px;padding:14px;margin-top:10px;background:#161311">' +
        '<div style="font-size:14px"><b>' + T.esc(subj) + '</b></div>' +
        kv('Dari', T.esc(j.mail_from || '-')) + kv('Waktu', T.esc(waktu(j.mail_timestamp))) +
        '<div style="margin-top:10px;border-top:1px dashed #ffffff20;padding-top:10px;font-size:13px;line-height:1.7;overflow-wrap:anywhere">' + isiHtml + '</div>' +
        (links.length ? '<div style="margin-top:10px"><b>🔗 Link dalam email:</b><ul style="margin:6px 0 0;padding-left:20px;font-size:12.5px;word-break:break-all">' +
          links.map((l) => '<li><a href="' + T.esc(l) + '" target="_blank" rel="noopener" style="color:#8ab8ff">' + T.esc(l.length > 70 ? l.slice(0, 70) + '…' : l) + '</a></li>').join('') + '</ul></div>' : '') +
        '</div>');
      readBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (e) {
      if (e.name === 'AbortError') return;
      T.show(readBox, errBox('Gagal membuka pesan: ' + e.message));
    }
  };

  const tabBar = tabs([['✨ Email Baru', 0], ['📥 Inbox', 1]], [pNew, pIn]);
  const setTab = (i) => tabBar.querySelectorAll('button')[i].click();
  const setTabLabel = (n) => { tabBar.querySelectorAll('button')[1].textContent = n ? '📥 Inbox (' + n + ')' : '📥 Inbox'; };

  pIn.appendChild(T.row(T.btn('🔄 Refresh Inbox', muatInbox, true)));
  pIn.appendChild(outIn);
  pIn.appendChild(listBox);
  pIn.appendChild(readBox);

  root.appendChild(tabBar);
  pNew.hidden = false; pIn.hidden = true;
  root.appendChild(pNew);
  root.appendChild(pIn);
}
