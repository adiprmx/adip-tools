import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "cari-file-duplikat", "name": "Cari File Duplikat", "cat": "converter", "icon": "🔎", "desc": "Temukan file kembar dari isi yang sama persis.", "keywords": "duplikat,kembar,sama,hash,cari,file ganda", "since": "6.17.0"};

// Kelompokkan daftar {nama, ukuran, hash} berdasarkan hash isinya. Hanya
// kelompok berisi 2 file atau lebih yang dikembalikan. Murni, bisa diuji.
export function kelompokkanDuplikat(daftar) {
  const byHash = new Map();
  for (const f of daftar) {
    if (!f || !f.hash) continue;
    if (!byHash.has(f.hash)) byHash.set(f.hash, []);
    byHash.get(f.hash).push(f);
  }
  const kelompok = [];
  for (const files of byHash.values()) {
    if (files.length > 1) {
      files.sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
      kelompok.push({ hash: files[0].hash, ukuran: files[0].ukuran, files });
    }
  }
  kelompok.sort((a, b) => b.ukuran - a.ukuran);
  return kelompok;
}

// Ruang yang bisa dibebaskan bila tiap kelompok disisakan satu file.
export function ruangTerbuang(kelompok) {
  return kelompok.reduce((total, k) => total + k.ukuran * (k.files.length - 1), 0);
}

export function render(root) {
  const file = T.input('file');
  file.multiple = true;
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  let files = [];
  let busy = false;

  const refreshInfo = () => {
    if (!files.length) {
      T.show(infoBox, '<p class="hint">Belum ada file. Pilih banyak file di atas untuk diperiksa.</p>');
      return;
    }
    const total = files.reduce((a, f) => a + f.size, 0);
    T.show(infoBox, kv('File dipilih', files.length + ' file') + kv('Total ukuran', fmtBytes(total)));
  };

  file.addEventListener('change', () => {
    const picked = Array.from(file.files || []);
    file.value = '';
    if (!picked.length) return;
    T.hide(outBox);
    files = files.concat(picked);
    refreshInfo();
  });

  const hashFile = async (f) => {
    const buf = await f.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const goBtn = T.btn('Cari file kembar', async () => {
    if (busy) return;
    if (files.length < 2) { T.show(outBox, errBox('Pilih minimal 2 file untuk dibandingkan.')); return; }
    if (!crypto.subtle || !crypto.subtle.digest) {
      T.show(outBox, errBox('Browser ini tidak bisa menghitung sidik jari file. Coba Chrome, Edge, atau Firefox versi terbaru.'));
      return;
    }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    barWrap.hidden = false;
    const hasil = [];
    let gagal = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const pct = Math.round((i / files.length) * 100);
        barFill.style.width = pct + '%';
        barLabel.textContent = 'Memeriksa file ' + (i + 1) + ' dari ' + files.length + '…';
        try {
          const hash = await hashFile(f);
          hasil.push({ nama: f.name, ukuran: f.size, hash });
        } catch (e) {
          gagal++;
        }
      }
      barFill.style.width = '100%';
      barLabel.textContent = 'Mengelompokkan…';
      const kelompok = kelompokkanDuplikat(hasil);
      if (!kelompok.length) {
        T.show(outBox, '<span class="ok">Tidak ada file kembar.</span>' +
          kv('File diperiksa', hasil.length + ' file') +
          (gagal ? kv('File gagal dibaca', gagal + ' file') : '') +
          '<p class="hint" style="margin-top:8px">Setiap file dicek dari isi lengkapnya, jadi nama yang sama belum tentu kembar, dan nama yang beda bisa saja kembar.</p>');
        return;
      }
      let html = '<span class="ok">Ketemu ' + kelompok.length + ' kelompok file kembar.</span>' +
        kv('File diperiksa', hasil.length + ' file') +
        kv('Ruang yang bisa dibebaskan', fmtBytes(ruangTerbuang(kelompok)) + ' (bila tiap kelompok disisakan satu)') +
        (gagal ? kv('File gagal dibaca', gagal + ' file') : '');
      T.show(outBox, html);
      kelompok.forEach((k, gi) => {
        const g = T.el('<div style="margin-top:12px;border-top:1px solid #ffffff10;padding-top:8px"></div>');
        g.appendChild(T.el('<p style="font-size:13px;margin:0 0 4px"><b>Kelompok ' + (gi + 1) + '</b> <span class="dim">(' + k.files.length + ' file, masing-masing ' + fmtBytes(k.ukuran) + ')</span></p>'));
        k.files.forEach((f) => {
          g.appendChild(T.el('<p style="font-size:13px;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.nama) + '</p>'));
        });
        outBox.appendChild(g);
      });
      outBox.appendChild(T.el('<p class="hint" style="margin-top:10px">Tool ini hanya menunjukkan mana yang kembar. Menghapusnya tetap keputusanmu, di luar tool ini.</p>'));
    } catch (e) {
      T.show(outBox, errBox('Pemeriksaan gagal di tengah jalan. Coba lagi dengan file yang lebih sedikit.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih banyak file, tool ini membaca isi tiap file dan mengelompokkan yang isinya sama persis. Nama file tidak menentukan, isinya yang menentukan.</p>'));
  root.appendChild(T.field('Pilih file (boleh banyak)', file, 'File dipilih bertahap, semuanya masuk daftar pemeriksaan.'));
  root.appendChild(infoBox);
  root.appendChild(T.row(goBtn, T.btn('Kosongkan daftar', () => { files = []; T.hide(outBox); refreshInfo(); })));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana, yang dibandingkan hanya sidik jari isinya.</p>'));
  refreshInfo();
}
