import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"pelacak-langganan","name":"Pelacak Langganan","cat":"produktivitas","icon":"💳","desc":"Catat semua langganan bulananmu, lihat total per bulan & tahun, dan tahu mana yang paling menguras.","keywords":"langganan,subscription,biaya,bulanan,hemat,pengeluaran,streaming"};

export function render(root) {
  const KEY = 'adip-tools:langganan';
  let subs = [];
  try { subs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { subs = []; }
  if (!Array.isArray(subs)) subs = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(subs)); } catch (e) {} };
  const uid = () => 's' + Date.now().toString(36) + Math.floor(Math.random() * 999);
  const num = (v) => Math.round(Number(String(v).replace(/[^0-9.]/g, '')) || 0);

  const sumBox = T.el('<div></div>');
  const box = T.el('<div></div>');

  const draw = () => {
    const sorted = subs.slice().sort((a, b) => (b.cost || 0) - (a.cost || 0));
    const totalM = sorted.reduce((s, x) => s + (x.cost || 0), 0);
    const totalY = totalM * 12;
    const avg = sorted.length ? totalM / sorted.length : 0;

    sumBox.innerHTML = '';
    if (sorted.length) {
      const sum = T.el(
        '<div class="card" style="margin:12px 0;background:#ffffff08">' +
        '<div class="mut" style="font-size:12px">TOTAL PER BULAN</div>' +
        '<div style="font-size:26px;font-weight:700">' + T.rp(totalM) + '</div>' +
        '<div class="mut" style="font-size:12px;margin-top:4px">≈ ' + T.rp(totalY) + ' per tahun · rata-rata ' + T.rp(avg) + '/langganan</div>' +
        '</div>');
      sumBox.appendChild(sum);
    }

    box.innerHTML = '';
    if (!sorted.length) {
      box.appendChild(T.el('<p class="center mut">Belum ada langganan tercatat. Daftarkan semua — yang Rp15 ribu pun ngaruh. 💳</p>'));
      return;
    }
    sorted.forEach((s, idx) => {
      const over = s.cost > avg && sorted.length > 1;
      const badge = idx === 0 && sorted.length > 1
        ? ' <span style="font-size:11px;background:#ef444422;color:#ef4444;border-radius:99px;padding:2px 8px;white-space:nowrap">💸 Termahal</span>'
        : (over ? ' <span style="font-size:11px;background:#f59e0b22;color:#f59e0b;border-radius:99px;padding:2px 8px;white-space:nowrap">⚠️ Di atas rata-rata</span>' : '');
      const card = T.el(
        '<div class="card" style="margin-bottom:10px' + (idx === 0 && sorted.length > 1 ? ';border-color:#ef444455' : '') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
        '<b>' + T.esc(s.name) + '</b>' +
        '<span style="white-space:nowrap">' + T.rp(s.cost) + '<span class="mut" style="font-size:12px">/bln</span></span>' +
        '</div>' +
        '<div style="margin-top:4px">' + badge +
        '<span class="mut" style="font-size:12px">≈ ' + T.rp((s.cost || 0) * 12) + '/tahun</span></div>' +
        '</div>');
      const row2 = T.el('<div style="display:flex;gap:8px;margin-top:8px"></div>');
      const edit = T.btn('Ubah biaya', () => {
        const v = prompt('Biaya baru per bulan untuk "' + s.name + '" (angka saja):', String(s.cost || 0));
        if (v === null) return;
        const n = num(v);
        if (!n) { T.toast('Biayanya nggak valid'); return; }
        s.cost = n; save(); draw();
      });
      edit.style.padding = '6px 12px'; edit.style.fontSize = '13px';
      const del = T.btn('Hapus', () => {
        if (confirm('Berhenti langganan "' + s.name + '" (hapus dari daftar)?')) {
          subs = subs.filter((x) => x.id !== s.id);
          save(); draw();
        }
      });
      del.classList.add('danger');
      del.style.padding = '6px 12px'; del.style.fontSize = '13px';
      row2.appendChild(edit); row2.appendChild(del);
      card.appendChild(row2);
      box.appendChild(card);
    });
  };

  const nameInp = T.input('text', 'Nama langganan, mis. Netflix');
  const costInp = T.input('text', 'Biaya per bulan, mis. 65000');
  costInp.inputMode = 'decimal';
  const add = () => {
    const name = nameInp.value.trim();
    const cost = num(costInp.value);
    if (!name) { T.toast('Isi nama langganannya dulu'); return; }
    if (!cost) { T.toast('Isi biaya per bulannya'); return; }
    subs.push({ id: uid(), name, cost });
    nameInp.value = ''; costInp.value = '';
    save(); draw();
    T.toast('Langganan tercatat 💳');
  };
  nameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  costInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<p class="hint">Langganan kecil yang banyak itu diam-diam mahal. Catat semua di sini, yang paling menguras langsung kelihatan.</p>'));
  root.appendChild(T.field('Nama langganan', nameInp));
  root.appendChild(T.field('Biaya per bulan (Rp)', costInp));
  root.appendChild(T.row(T.btn('Tambah langganan', add, true)));
  root.appendChild(sumBox);
  root.appendChild(box);
  draw();
}
