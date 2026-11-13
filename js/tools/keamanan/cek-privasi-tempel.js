import { h as T, utils, LOCAL_NOTE } from '../../core.js?v=6.10.0';

export const meta = {"id": "cek-privasi-tempel", "name": "Cek Privasi sebelum Tempel ke AI", "cat": "keamanan", "icon": "🛡️", "desc": "Pindai teks sebelum ditempel ke chatbot, tandai data pribadi yang tidak sengaja ikut.", "keywords": "privasi,cek,nik,ai,chatgpt,gemini,data,pribadi,sensor"};
export function render(root) {

    const inp = T.ta(6, 'Tempel teks yang mau dikirim ke chatbot di sini…');
    const box = T.out();
    const cleanTa = T.ta(6, 'Versi bersih muncul di sini…');
    cleanTa.readOnly = true;
    let findings = [];

    const PATTERNS = [
      { label: 'NPWP', tag: 'NPWP', re: /\b\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}\b/g },
      { label: 'Email', tag: 'EMAIL', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
      { label: 'Kata sandi / token / kunci API', tag: 'KATA-SANDI', re: /(?:password|kata[ -]?sandi|sandi|token|api[-_ ]?key|secret|bearer|pin)\s*[:=]\s*\S+/gi },
      { label: 'Nomor HP', tag: 'NO-HP', re: /\+62\s?8\d{2}[\d\s-]{6,11}\d|(?:\+62|62|0)8\d{8,11}\b/g },
      { label: 'Nomor kartu', tag: 'NO-KARTU', re: /\b(?:\d{4}[ -]?){3}\d{4}\b/g },
      { label: 'NIK / No. KK (16 digit)', tag: 'NIK', re: /\b\d{16}\b/g },
      { label: 'Nomor rekening (10–15 digit)', tag: 'NO-REKENING', re: /\b\d{10,15}\b/g },
    ];

    function scan(text) {
      const hits = [];
      PATTERNS.forEach((p) => {
        p.re.lastIndex = 0;
        let m;
        while ((m = p.re.exec(text)) !== null) {
          const val = m[0].trim();
          if (!val) continue;
          // Nomor kartu: abaikan yang ternyata NIK 16 digit tanpa pemisah (sudah ditangkap pola NIK)
          hits.push({ label: p.label, tag: p.tag, value: val, start: m.index, end: m.index + m[0].length });
        }
      });
      // Urutkan, lalu buang yang tumpang tindih (pola yang lebih dulu menang)
      hits.sort((a, b) => a.start - b.start || b.end - a.end);
      const kept = [];
      for (const h of hits) {
        if (kept.some((k) => h.start < k.end && k.start < h.end)) continue;
        kept.push(h);
      }
      return kept.sort((a, b) => a.start - b.start);
    }

    function mask(v) {
      if (v.length <= 4) return '•'.repeat(v.length);
      return v.slice(0, 2) + '•'.repeat(Math.min(v.length - 4, 8)) + v.slice(-2);
    }

    function cleanText(text, hits) {
      let out = '', last = 0;
      hits.forEach((h) => { out += text.slice(last, h.start) + '[' + h.tag + ']'; last = h.end; });
      return out + text.slice(last);
    }

    function highlightHtml(text, hits) {
      let html = '', last = 0;
      hits.forEach((h) => {
        html += T.esc(text.slice(last, h.start));
        html += '<mark style="background:#f59e0b33;border:1px solid #f59e0b;border-radius:4px;padding:0 2px">' + T.esc(h.value) + '</mark>';
        last = h.end;
      });
      return html + T.esc(text.slice(last));
    }

    function doScan() {
      const text = inp.value;
      if (!text.trim()) { T.toast('Tempel teks dulu'); return; }
      findings = scan(text);
      const clean = cleanText(text, findings);
      cleanTa.value = clean;
      if (!findings.length) {
        T.show(box, '<div style="color:#22c55e;font-size:14px;line-height:1.6">✅ Tidak ditemukan data pribadi yang umum. Tetap baca ulang teksnya sebelum ditempel — pemindaian ini hanya mengenali pola yang umum.</div>');
        return;
      }
      const byLabel = {};
      findings.forEach((f) => { (byLabel[f.label] = byLabel[f.label] || []).push(f); });
      let html = '<div style="color:#f59e0b;font-size:14px;line-height:1.6;margin-bottom:8px">⚠️ Ditemukan <b>' + findings.length + '</b> data yang sebaiknya tidak dibagikan:</div>';
      Object.keys(byLabel).forEach((label) => {
        const list = byLabel[label];
        html += '<div style="margin:6px 0"><b style="font-size:13px">' + T.esc(label) + ' (' + list.length + ')</b><div style="font-size:13px;opacity:.85">' +
          list.map((f) => T.esc(mask(f.value))).join(' &nbsp;·&nbsp; ') + '</div></div>';
      });
      html += '<div style="margin-top:10px;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word;border-top:1px solid rgba(255,255,255,.12);padding-top:10px">' + highlightHtml(text, findings) + '</div>';
      T.show(box, html);
    }

    root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + ' Pindai ini hanya mengenali pola umum — tetap baca ulang sebelum mengirim.</p>'));
    root.appendChild(T.field('Teks yang mau ditempel', inp));
    root.appendChild(T.row(
      T.btn('Pindai Teks', doScan, true),
      T.btn('Bersihkan Input', () => { inp.value = ''; cleanTa.value = ''; findings = []; T.hide(box); })
    ));
    root.appendChild(box);
    root.appendChild(T.field('Versi bersih (data sensitif diganti tanda)', cleanTa, 'Salin versi ini ke chatbot, bukan teks aslinya.'));
    root.appendChild(T.row(
      T.btn('Salin Versi Bersih', () => {
        if (!cleanTa.value) { T.toast('Pindai dulu teksnya'); return; }
        T.copy(cleanTa.value);
      }, true),
      T.btn('Unduh Versi Bersih', () => {
        if (!cleanTa.value) { T.toast('Pindai dulu teksnya'); return; }
        T.dl('teks-bersih.txt', cleanTa.value, 'text/plain;charset=utf-8');
      })
    ));
  
}
