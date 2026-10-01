import { h as T, utils, LOCAL_NOTE } from '../../core.js?v=4.2.0';

export const meta = {"id": "extract-contact", "name": "Ekstrak Kontak", "cat": "teks", "icon": "📇", "desc": "Ambil email & nomor HP dari teks."};

export function render(root) {

      const taIn = T.ta(8, 'Tempel teks yang berisi email / nomor HP…');
      const box = T.out();

      function extract() {
        const emails = utils.extractEmails(taIn.value);
        const phones = utils.extractPhones(taIn.value);
        T.show(box, '');
        const cardE = T.el('<div class="card" style="margin-bottom:10px"></div>');
        cardE.appendChild(T.el(`<b>📧 Email (${emails.length})</b>`));
        cardE.appendChild(T.el(`<div class="list">${emails.length ? emails.map((e) => `<div class="kv"><span style="word-break:break-all">${T.esc(e)}</span></div>`).join('') : '<div class="hint">Tidak ketemu.</div>'}</div>`));
        const rE = T.el('<div class="row" style="margin-top:6px"></div>');
        rE.appendChild(T.copyBtn(() => emails.join('\n'), 'Salin Semua'));
        cardE.appendChild(rE);

        const cardP = T.el('<div class="card"></div>');
        cardP.appendChild(T.el(`<b>📱 Nomor HP (${phones.length})</b>`));
        cardP.appendChild(T.el(`<div class="list">${phones.length ? phones.map((p) => `<div class="kv"><span>${T.esc(p)}</span></div>`).join('') : '<div class="hint">Tidak ketemu.</div>'}</div>`));
        const rP = T.el('<div class="row" style="margin-top:6px"></div>');
        rP.appendChild(T.copyBtn(() => phones.join('\n'), 'Salin Semua'));
        cardP.appendChild(rP);

        box.appendChild(cardE);
        box.appendChild(cardP);
      }

      root.appendChild(T.el('<p class="note">Mendeteksi email umum dan nomor HP Indonesia (08xx, +62, 62xx). ' + T.esc(LOCAL_NOTE) + '</p>'));
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.btn('Ekstrak', extract, true));
      root.appendChild(box);
    
}
