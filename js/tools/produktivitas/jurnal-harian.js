import { h as T, todayISO } from '../../core.js?v=6.7.0';

export const meta = {"id":"jurnal-harian","name":"Jurnal Harian","cat":"produktivitas","icon":"📓","desc":"Tulis jurnal per tanggal, buka lagi kapan pun kangen masa lalu.","keywords":"jurnal,diary,harian,catatan,refleksi,menulis,curhat"};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtTgl(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return (+m[3]) + ' ' + BULAN[(+m[2]) - 1] + ' ' + m[1];
}
function snippet(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > 90 ? t.slice(0, 90) + '…' : t;
}

export function render(root) {
  const KEY = 'adip-tools:jurnal-harian';
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  let tgl = todayISO();
  const dateInp = T.input('date', '', tgl);
  const area = T.ta(8, 'Tulis harimu di sini... apa aja boleh, nggak ada yang nilai.');
  const status = T.el('<p class="hint" style="margin:6px 0 0;min-height:18px"></p>');
  const listBox = T.el('<div></div>');

  const isDirty = () => area.value !== String(data[tgl] || '');

  const drawList = () => {
    listBox.innerHTML = '';
    const keys = Object.keys(data).filter((k) => String(data[k] || '').trim()).sort().reverse();
    if (!keys.length) {
      listBox.appendChild(T.el('<p class="center mut">Belum ada entri. Tulis yang pertama di atas. ✍️</p>'));
      return;
    }
    keys.forEach((k) => {
      const card = T.el('<div style="border:1px solid #ffffff14;border-radius:10px;padding:10px 12px;margin-bottom:8px"></div>');
      const head = T.el('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"></div>');
      head.appendChild(T.el('<strong style="font-size:13px">' + T.esc(fmtTgl(k)) + '</strong>'));
      const acts = T.el('<div style="display:flex;gap:6px"></div>');
      const buka = T.btn('Buka', () => loadTgl(k));
      buka.style.padding = '4px 10px';
      const hapus = T.btn('Hapus', () => {
        if (confirm('Hapus entri ' + fmtTgl(k) + '? Nggak bisa dibalikin loh.')) {
          delete data[k];
          save();
          if (k === tgl) { area.value = ''; status.textContent = ''; }
          drawList();
          T.toast('Entri dihapus');
        }
      });
      hapus.style.padding = '4px 10px';
      acts.appendChild(buka);
      acts.appendChild(hapus);
      head.appendChild(acts);
      card.appendChild(head);
      card.appendChild(T.el('<div class="mut" style="font-size:13px;line-height:1.5;white-space:pre-wrap">' + T.esc(snippet(data[k])) + '</div>'));
      listBox.appendChild(card);
    });
  };

  const loadTgl = (iso) => {
    tgl = iso;
    dateInp.value = iso;
    area.value = String(data[iso] || '');
    status.textContent = '';
    drawList();
  };

  dateInp.addEventListener('change', () => { if (dateInp.value) loadTgl(dateInp.value); });
  area.addEventListener('input', () => { status.textContent = isDirty() ? 'Ada perubahan yang belum disimpan.' : ''; });

  const saveBtn = T.btn('Simpan entri', () => {
    const v = area.value.trim();
    if (v) data[tgl] = area.value;
    else delete data[tgl];
    save();
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    status.textContent = 'Tersimpan ' + jam + ' ✓';
    drawList();
    T.toast('Jurnal tersimpan!');
  }, true);

  root.appendChild(T.el('<p class="hint">Satu tanggal, satu halaman. Tulis sebebasnya — semua tersimpan di HP kamu, bukan di server siapa-siapa.</p>'));
  root.appendChild(T.field('Tanggal', dateInp));
  root.appendChild(T.field('Isi jurnal', area));
  root.appendChild(status);
  root.appendChild(T.row(saveBtn));
  root.appendChild(T.el('<h3 style="margin:18px 0 8px;font-size:14px">Entri tersimpan</h3>'));
  root.appendChild(listBox);
  drawList();
}
