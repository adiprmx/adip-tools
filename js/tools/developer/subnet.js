import { h as T, utils, errBox, esc, kvRows } from '../../core.js?v=6.2.0';

function subnet(ip, cidr) {
    const o = String(ip == null ? '' : ip).trim().split('.');
    if (o.length !== 4) return null;
    const n4 = o.map(Number);
    if (n4.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
    const c = Number(cidr);
    if (!Number.isInteger(c) || c < 0 || c > 32) return null;
    const n = (((n4[0] << 24) >>> 0) + (n4[1] << 16) + (n4[2] << 8) + n4[3]) >>> 0;
    const mask = c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0;
    const net = (n & mask) >>> 0;
    const bc = (net | ((~mask) >>> 0)) >>> 0;
    const f = (v) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
    const total = Math.pow(2, 32 - c);
    const hosts = c === 32 ? 1 : (c === 31 ? 2 : total - 2);
    return {
      network: f(net), broadcast: f(bc), netmask: f(mask), wildcard: f(((~mask) >>> 0)),
      prefix: c, totalAddresses: total, hosts: hosts,
      first: c === 32 ? f(net) : f((net + 1) >>> 0),
      last: c === 32 ? f(net) : f((bc - 1) >>> 0)
    };
  }

export const meta = {"id": "subnet", "name": "Kalkulator Subnet IPv4", "cat": "developer", "icon": "🌐", "desc": "Network, broadcast, range host dari CIDR.", "keywords": "subnet,ip,network,cidr"};
export function render(root) {

    const inp = T.input('text', 'misal: 192.168.1.10/24', '192.168.1.10/24');
    inp.style.fontFamily = 'monospace';
    const box = T.out();
    root.appendChild(T.field('IP / CIDR', inp, 'Format: alamat IP + garis miring + prefix, misal 10.0.0.5/16'));
    root.appendChild(T.row(T.btn('Hitung', () => {
      const raw = inp.value.trim();
      const m = raw.match(/^([0-9.]+)\s*\/\s*(\d{1,2})$/);
      if (!m) { T.show(box, errBox('Format salah. Contoh yang benar: 192.168.1.10/24')); return; }
      const r = subnet(m[1], m[2]);
      if (!r) { T.show(box, errBox('IP atau prefix tidak valid.')); return; }
      T.show(box, kvRows([
        ['Network', r.network + '/' + r.prefix],
        ['Broadcast', r.broadcast],
        ['Netmask', r.netmask],
        ['Wildcard', r.wildcard],
        ['Host pertama', r.first],
        ['Host terakhir', r.last],
        ['Jumlah host usable', T.fmt(r.hosts)],
        ['Total alamat', T.fmt(r.totalAddresses)]
      ]));
    }, true)));
    root.appendChild(box);
  
}
