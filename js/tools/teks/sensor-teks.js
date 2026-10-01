import { h as T, utils } from '../../core.js?v=4.3.0';

utils.sensorText = function (text, words, mask, autoPhone, autoEmail) {
    let s = String(text == null ? '' : text);
    const m = mask || '***';
    (words || []).forEach((w) => {
      w = String(w).trim();
      if (!w) return;
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      s = s.replace(re, m);
    });
    if (autoPhone) {
      const phones = utils.extractPhones(s);
      phones.forEach((p) => { s = s.split(p).join(m); });
    }
    if (autoEmail) {
      const emails = utils.extractEmails(s);
      emails.forEach((e) => { s = s.split(e).join(m); });
    }
    return s;
  };

export const meta = {"id": "sensor-teks", "name": "Sensor Teks", "cat": "teks", "icon": "🙈", "desc": "Sensor kata/nomor otomatis."};

export function render(root) {

      const taIn = T.ta(6, 'Teks yang mau disensor…');
      const taWords = T.ta(3, 'Kata sensitif, satu per baris…');
      const maskSel = T.select([['***', '*** (bintang)'], ['███', '███ (kotak)']], '***');
      const box = T.out();
      let last = '';

      function chk(label, checked) {
        const l = document.createElement('label');
        l.className = 'chk';
        const c = document.createElement('input');
        c.type = 'checkbox'; c.checked = !!checked;
        l.appendChild(c);
        l.appendChild(document.createTextNode(' ' + label));
        return { el: l, box: c };
      }
      const oPhone = chk('Sensor otomatis nomor HP', true);
      const oEmail = chk('Sensor otomatis email', true);

      function process() {
        last = utils.sensorText(
          taIn.value,
          taWords.value.split('\n'),
          maskSel.value,
          oPhone.box.checked,
          oEmail.box.checked
        );
        T.show(box, `<pre class="pre">${T.esc(last)}</pre>`);
      }

      const opts = T.el('<div class="opts"></div>');
      opts.appendChild(oPhone.el); opts.appendChild(oEmail.el);
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.field('Daftar kata sensitif', taWords, 'Satu kata/frasa per baris. Tidak case-sensitive.'));
      root.appendChild(T.grid2(T.field('Gaya sensor', maskSel), T.field('Sensor otomatis', opts)));
      root.appendChild(T.row(
        T.btn('Sensor', process, true),
        T.copyBtn(() => last, 'Salin Hasil')
      ));
      root.appendChild(box);
    
}
