import { h as T, _NI } from '../../core.js?v=6.9.5';

export const meta = {"id": "tebak-chord", "name": "Tebak Chord dari Nada", "cat": "musik", "icon": "🔍", "desc": "Ketik nada-nada, tebak nama chordnya.", "keywords": "chord,nada,tebak,nama chord,identifikasi,interval"};
export function render(root) {

    const NS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const PATTERNS = [
      { suf: '',      iv: [0, 4, 7],    label: 'mayor' },
      { suf: 'm',     iv: [0, 3, 7],    label: 'minor' },
      { suf: 'dim',   iv: [0, 3, 6],    label: 'diminished' },
      { suf: 'aug',   iv: [0, 4, 8],    label: 'augmented' },
      { suf: 'sus2',  iv: [0, 2, 7],    label: 'suspended 2' },
      { suf: 'sus4',  iv: [0, 5, 7],    label: 'suspended 4' },
      { suf: '5',     iv: [0, 7],       label: 'power chord' },
      { suf: '6',     iv: [0, 4, 7, 9], label: 'mayor 6' },
      { suf: 'm6',    iv: [0, 3, 7, 9], label: 'minor 6' },
      { suf: '7',     iv: [0, 4, 7, 10], label: 'dominan 7' },
      { suf: 'maj7',  iv: [0, 4, 7, 11], label: 'mayor 7' },
      { suf: 'm7',    iv: [0, 3, 7, 10], label: 'minor 7' },
      { suf: 'm(maj7)', iv: [0, 3, 7, 11], label: 'minor mayor 7' },
      { suf: 'dim7',  iv: [0, 3, 6, 9],  label: 'diminished 7' },
      { suf: 'm7b5',  iv: [0, 3, 6, 10], label: 'minor 7 flat 5 (half-diminished)' },
    ];
    const normTok = (t) => {
      t = String(t || '').trim().replace(/♯/g, '#').replace(/♭/g, 'b');
      if (!t) return null;
      return t.charAt(0).toUpperCase() + t.slice(1);
    };
    const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
    const pcFreq = (pc) => 440 * Math.pow(2, (pc - 9) / 12);

    const inp = T.input('text', 'Contoh: C E G  atau  A C E', '');
    inp.autocapitalize = 'characters';
    const noteBar = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>');
    NS.forEach((n) => {
      const b = T.btn(n, () => {
        inp.value = (inp.value ? inp.value.trim() + ' ' : '') + n;
        inp.focus();
      });
      b.style.padding = '8px 10px';
      b.style.fontSize = '13px';
      noteBar.appendChild(b);
    });
    const box = T.out();

    const dengarBtn = (rootName, iv) => T.btn('🔊 dengar', () => {
      iv.forEach((step, i) => {
        try { T.beep(pcFreq((rootName + step) % 12), 0.4, 'triangle', i * 0.18); } catch (e) {}
      });
    });

    const tebak = () => {
      const toks = String(inp.value).split(/[\s,;]+/).filter(Boolean);
      if (!toks.length) {
        box.innerHTML = '<div style="color:#f59e0b;font-size:13px">Ketik dulu nada-nadanya, mis. <b>C E G</b> — atau ketuk tombol nada di atas.</div>';
        return;
      }
      const bad = [], pcs = [];
      toks.forEach((tk) => {
        const n = normTok(tk);
        const pc = n != null ? _NI[n] : undefined;
        if (pc == null) bad.push(tk);
        else if (!pcs.includes(pc)) pcs.push(pc);
      });
      if (bad.length) {
        box.innerHTML = '<div style="color:#ef4444;font-size:13px;line-height:1.6">Nada tidak dikenali: <b>' + bad.map((b) => T.esc(b)).join(', ') + '</b>.<br>Pakai nama nada seperti: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.</div>';
        return;
      }
      if (pcs.length < 2) {
        box.innerHTML = '<div style="color:#f59e0b;font-size:13px">Butuh minimal 2 nada berbeda untuk menebak chord.</div>';
        return;
      }
      const found = [];
      pcs.forEach((rootPc) => {
        const iv = pcs.map((p) => (p - rootPc + 12) % 12).sort((a, b) => a - b);
        PATTERNS.forEach((p) => {
          if (sameSet(iv, p.iv)) found.push({ root: rootPc, suf: p.suf, label: p.label, iv: p.iv });
        });
      });
      if (!found.length) {
        box.innerHTML = '<div style="color:#f59e0b;font-size:13px;line-height:1.6">Tidak ada chord yang cocok dengan kombinasi <b>' + pcs.map((p) => NS[p]).join(' ') + '</b>.<br>Coba 2–4 nada yang membentuk interval umum, mis. <b>C E G</b> (= C mayor) atau <b>A C E</b> (= A minor).</div>';
        return;
      }
      const wrap = T.el('<div></div>');
      wrap.appendChild(T.el('<div style="font-size:13px;color:#a1a1aa;margin-bottom:8px">Nada: <b style="color:#fff">' + pcs.map((p) => NS[p]).join(' – ') + '</b> → kemungkinan chord:</div>'));
      found.forEach((c) => {
        const tones = c.iv.map((s) => NS[(c.root + s) % 12]).join(' ');
        const row = T.el('<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;margin-bottom:8px;background:#18181b"></div>');
        const nm = T.el('<div style="flex:1"><div style="font-size:20px;font-weight:800">' + NS[c.root] + c.suf + '</div><div style="font-size:12px;color:#a1a1aa">' + c.label + ' · ' + tones + '</div></div>');
        row.appendChild(nm);
        row.appendChild(dengarBtn(c.root, c.iv));
        wrap.appendChild(row);
      });
      box.innerHTML = '';
      box.appendChild(wrap);
    };

    const goBtn = T.btn('Tebak', tebak, true);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tebak(); });
    root.appendChild(T.field('Nada-nada (pisahkan dengan spasi)', inp));
    root.appendChild(noteBar);
    root.appendChild(T.el('<div style="height:12px"></div>'));
    root.appendChild(T.row(goBtn));
    root.appendChild(box);
  
}
