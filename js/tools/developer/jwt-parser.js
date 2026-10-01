import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=6.7.0';

function b64urlDecode(seg) {
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const bin = atob(b64 + (pad ? '='.repeat(4 - pad) : ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

function jwtDecode(token) {
    const parts = String(token == null ? '' : token).trim().split('.');
    if (parts.length !== 3) return { error: 'Format JWT harus punya 3 bagian (header.payload.signature).' };
    try {
      const header = JSON.parse(b64urlDecode(parts[0]));
      const payload = JSON.parse(b64urlDecode(parts[1]));
      return { header, payload, signature: parts[2] };
    } catch (e) {
      return { error: 'Gagal decode JWT: ' + (e && e.message ? e.message : e) };
    }
  }

export const meta = {"id": "jwt-parser", "name": "JWT Parser", "cat": "developer", "icon": "🎫", "desc": "Baca isi header & payload JWT.", "keywords": "jwt,token,auth"};
export function render(root) {

    const ta = T.ta(4, 'Paste token JWT (xxxxx.yyyyy.zzzzz)…');
    const box = T.out();
    const fmtDur = (sec) => {
      if (sec < 0) return null;
      const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
      const p = [];
      if (d) p.push(d + ' hari'); if (h) p.push(h + ' jam'); if (m || !p.length) p.push(m + ' menit');
      return p.join(' ');
    };
    root.appendChild(T.field('Token JWT', ta));
    root.appendChild(T.row(T.btn('Decode', () => {
      const r = jwtDecode(ta.value);
      if (r.error) { T.show(box, errBox(r.error)); return; }
      let expHtml = '<span class="dim">tidak ada klaim exp</span>';
      if (r.payload && r.payload.exp != null) {
        const now = Math.floor(Date.now() / 1000);
        const left = r.payload.exp - now;
        const when = new Date(r.payload.exp * 1000).toLocaleString('id-ID');
        expHtml = left <= 0
          ? '<span class="err">⛔ Kedaluwarsa (' + esc(when) + ')</span>'
          : '<span class="ok">✓ Berlaku</span> <span class="dim">, kedaluwarsa ' + esc(when) + ' (sisa ' + esc(fmtDur(left)) + ')</span>';
      }
      let iatHtml = '';
      if (r.payload && r.payload.iat != null) iatHtml = '<div class="hint">Diterbitkan: ' + esc(new Date(r.payload.iat * 1000).toLocaleString('id-ID')) + '</div>';
      T.show(box,
        '<div style="background:#3f2f04;border:1px solid #eab308;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:10px">⚠️ <b>Signature TIDAK diverifikasi.</b> Tool ini hanya membaca isi token. Jangan pakai untuk memastikan token itu asli/sah.</div>' +
        '<div class="hint" style="margin:8px 0 4px">Header:</div>' + preHtml(JSON.stringify(r.header, null, 2)) +
        '<div class="hint" style="margin:8px 0 4px">Payload:</div>' + preHtml(JSON.stringify(r.payload, null, 2)) +
        '<div style="font-size:13px;margin-top:10px"><b>Status exp:</b> ' + expHtml + '</div>' + iatHtml +
        '<div class="hint" style="margin-top:6px">Signature: <span style="font-family:monospace">' + esc(String(r.signature).slice(0, 24)) + '…</span></div>');
    }, true)));
    root.appendChild(box);
  
}
