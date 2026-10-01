import { h as T, utils, errBox, esc, kvRows } from '../../core.js?v=4.3.0';

export const meta = {"id": "dns-lookup", "name": "DNS Lookup", "cat": "developer", "icon": "📡", "desc": "Lookup DNS via Google DNS-over-HTTPS."};

export function render(root) {

    const name = T.input('text', 'misal: adipmusic.my.id', '');
    const type = T.select([['A', 'A'], ['AAAA', 'AAAA'], ['MX', 'MX'], ['TXT', 'TXT'], ['NS', 'NS'], ['CNAME', 'CNAME'], ['SOA', 'SOA']], 'A');
    const box = T.out();
    root.appendChild(T.grid2(T.field('Nama domain', name), T.field('Tipe record', type)));
    root.appendChild(T.row(T.btn('Lookup', () => {
      const n = name.value.trim().replace(/^https?:\/\//, '').split('/')[0];
      if (!n) { T.show(box, errBox('Isi dulu nama domainnya.')); return; }
      T.show(box, '<span class="dim">Menghubungi dns.google…</span>');
      fetch('https://dns.google/resolve?name=' + encodeURIComponent(n) + '&type=' + type.value)
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then((j) => {
          if (j.Status !== 0) { T.show(box, errBox('Query gagal (status ' + j.Status + '). Cek lagi nama domainnya.')); return; }
          if (!j.Answer || !j.Answer.length) { T.show(box, '<span class="warn">Tidak ada record ' + esc(type.value) + ' untuk ' + esc(n) + '.</span>'); return; }
          T.show(box, kvRows(j.Answer.map((a) => [a.type + ' · TTL ' + a.TTL + 's', a.data])));
        })
        .catch((e) => {
          T.show(box, errBox('Gagal lookup. Kemungkinan kamu offline atau dns.google tidak bisa dijangkau. (' + e.message + ')'));
        });
    }, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint">Memakai DNS-over-HTTPS publik dari Google. Tidak ada data yang disimpan.</div>'));
  
}
