import { h as T, utils, errBox, esc, kvRows } from '../../core.js?v=6.12.1';

export const meta = {"id": "dns-lookup", "name": "DNS Lookup", "cat": "developer", "icon": "📡", "desc": "Lookup DNS via Google DNS-over-HTTPS.", "keywords": "dns,domain,lookup,website"};
export function render(root) {

    const name = T.input('text', 'misal: adipmusic.my.id', '');
    const type = T.select([['A', 'A'], ['AAAA', 'AAAA'], ['MX', 'MX'], ['TXT', 'TXT'], ['NS', 'NS'], ['CNAME', 'CNAME'], ['SOA', 'SOA']], 'A');
    const box = T.out();
    const cache = new Map(); // kunci "nama|tipe" -> { at, data } (cache 60 detik)
    const tampil = (j, n, tipe) => {
      if (j.Status !== 0) { T.show(box, errBox('Query gagal (status ' + j.Status + '). Cek lagi nama domainnya.')); return; }
      if (!j.Answer || !j.Answer.length) { T.show(box, '<span class="warn">Tidak ada record ' + esc(tipe) + ' untuk ' + esc(n) + '.</span>'); return; }
      T.show(box, kvRows(j.Answer.map((a) => [a.type + ' · TTL ' + a.TTL + 's', a.data])));
    };
    const lookup = async () => {
      const n = name.value.trim().replace(/^https?:\/\//, '').split('/')[0];
      const tipe = type.value;
      if (!n) { T.show(box, errBox('Isi dulu nama domainnya.')); return; }
      const kunci = n.toLowerCase() + '|' + tipe;
      const cached = cache.get(kunci);
      if (cached && Date.now() - cached.at < 60000) { tampil(cached.data, n, tipe); return; }
      T.show(box, '<span class="dim">Menghubungi dns.google…</span>');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(n) + '&type=' + tipe, { signal: ctrl.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        cache.set(kunci, { at: Date.now(), data: j });
        tampil(j, n, tipe);
      } catch (e) {
        const msg = e.name === 'AbortError'
          ? 'Waktu habis — dns.google tidak merespons dalam 15 detik.'
          : 'Gagal lookup. Kemungkinan kamu offline atau dns.google tidak bisa dijangkau. (' + e.message + ')';
        T.show(box, errBox(msg));
        const wr = T.el('<div style="margin-top:8px"></div>');
        wr.appendChild(T.btn('🔄 Coba lagi', lookup));
        box.appendChild(wr);
      } finally { clearTimeout(timer); }
    };
    root.appendChild(T.grid2(T.field('Nama domain', name), T.field('Tipe record', type)));
    root.appendChild(T.row(T.btn('Lookup', lookup, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint">Memakai DNS-over-HTTPS publik dari Google. Tidak ada data yang disimpan.</div>'));
  
}
