import { h as T, utils } from '../../core.js?v=6.2.0';

export const meta = {"id": "json-yaml", "name": "JSON ↔ YAML", "cat": "converter", "icon": "⇄", "desc": "Konversi JSON ke YAML dan sebaliknya.", "keywords": "json,yaml"};
export function render(root) {

    const CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
    const status = T.out();
    const wrap = T.el('<div></div>');
    const inp = T.ta(8, 'Tempel JSON atau YAML di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(8, 'Hasil muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const errBox = T.out();

    const keYaml = () => {
      T.hide(errBox);
      try {
        const obj = JSON.parse(inp.value);
        outp.value = window.jsyaml.dump(obj, { indent: 2 });
      } catch (e) { T.show(errBox, '<span class="err">JSON tidak valid: ' + T.esc(e.message) + '</span>'); }
    };
    const keJson = () => {
      T.hide(errBox);
      try {
        const obj = window.jsyaml.load(inp.value);
        outp.value = JSON.stringify(obj, null, 2);
      } catch (e) { T.show(errBox, '<span class="err">YAML tidak valid: ' + T.esc(e.message) + '</span>'); }
    };

    T.show(status, '<span class="dim">⏳ Memuat library YAML…</span>');
    root.appendChild(status);
    root.appendChild(wrap);
    T.hide(wrap);
    T.loadScript(CDN).then((ok) => {
      if (!ok || !window.jsyaml) {
        status.innerHTML = '<span class="err">⚠️ CDN tidak bisa dimuat, cek koneksi internet kamu.</span>';
        const retry = T.btn('🔄 Coba Lagi', () => {
          status.innerHTML = '<span class="dim">⏳ Memuat library YAML…</span>';
          T.loadScript(CDN).then((ok2) => {
            if (!ok2 || !window.jsyaml) {
              status.innerHTML = '<span class="err">⚠️ Masih gagal. Coba lagi nanti.</span>';
              status.appendChild(retry);
              return;
            }
            init();
          });
        });
        retry.style.marginTop = '10px';
        status.appendChild(retry);
        return;
      }
      init();
    });
    let booted = false;
    function init() {
      if (booted) return; booted = true;
      T.hide(status);
      wrap.appendChild(T.field('Input', inp));
      wrap.appendChild(T.row(T.btn('JSON → YAML', keYaml, true), T.btn('YAML → JSON', keJson)));
      wrap.appendChild(errBox);
      T.hide(errBox);
      wrap.appendChild(T.field('Output', outp));
      wrap.appendChild(T.row(T.copyBtn(() => outp.value, 'Salin Hasil')));
      wrap.hidden = false;
    }
  
}
