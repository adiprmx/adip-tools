import { h as T, utils } from '../../core.js';

export const meta = {"id": "url-encoder", "name": "URL Encoder/Decoder", "cat": "converter", "icon": "🔗", "desc": "Ubah link atau teks jadi kode URL dan sebaliknya.", "keywords": "url,encode,decode,link"};
export function render(root) {

    const inp = T.ta(4, 'Tulis URL atau teks di sini…');
    const outp = T.ta(4, 'Hasil muncul di sini…');
    outp.readOnly = true;
    const r1 = T.el('<label class="pick"><input type="radio" name="urlm" value="comp" checked style="width:20px;height:20px"> <span><b>encodeURIComponent</b>: untuk isi di dalam link (semua karakter khusus diubah jadi kode)</span></label>');
    const r2 = T.el('<label class="pick"><input type="radio" name="urlm" value="full" style="width:20px;height:20px"> <span><b>encodeURI</b>: untuk link utuh (: / ? & tidak diubah)</span></label>');
    // nama radio harus unik per render agar tidak bentrok antar tool
    const nm = 'urlm_' + Math.random().toString(36).slice(2, 8);
    r1.querySelector('input').name = nm; r2.querySelector('input').name = nm;
    const enc = () => {
      const full = r2.querySelector('input').checked;
      outp.value = full ? encodeURI(inp.value) : encodeURIComponent(inp.value);
    };
    const dec = () => {
      try { outp.value = decodeURIComponent(inp.value); }
      catch (e) { outp.value = '⚠️ Linknya tidak benar atau kodenya tidak lengkap.'; }
    };
    root.appendChild(T.field('Teks', inp));
    root.appendChild(r1); root.appendChild(r2);
    root.appendChild(T.row(T.btn('Jadi Kode →', enc, true), T.btn('← Jadi Teks', dec)));
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.row(T.copyBtn(() => outp.value, 'Salin Hasil')));
  
}
