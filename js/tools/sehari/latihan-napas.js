import { h as T, utils } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): pola napas = daftar fase (nama, detik).
utils.POLA_NAPAS = {
  box: { nama: 'Box breathing (4-4-4-4)', fase: [['Tarik napas', 4], ['Tahan', 4], ['Buang napas', 4], ['Tahan', 4]] },
 478: { nama: 'Pola 4-7-8 (rileks dan tidur)', fase: [['Tarik napas', 4], ['Tahan', 7], ['Buang napas', 8]] },
  tenang: { nama: 'Napas tenang (4-6)', fase: [['Tarik napas', 4], ['Buang napas', 6]] }
};
utils.durasiSiklus = function (pola) {
  return utils.POLA_NAPAS[pola].fase.reduce((a, f) => a + f[1], 0);
};

export const meta = {"id": "latihan-napas", "name": "Latihan Napas", "cat": "sehari", "icon": "🫁", "desc": "Latihan napas terpandu untuk tenang dan tidur lebih mudah.", "keywords": "napas,breathing,tenang,relaksasi,tidur,box breathing,4-7-8,stress", "since": "6.11.0"};

export function render(root) {
  const pola = T.select(Object.keys(utils.POLA_NAPAS).map((k) => [k, utils.POLA_NAPAS[k].nama]), 'box');
  const lingkaran = T.el('<div style="width:140px;height:140px;border-radius:50%;border:2px solid #fff;margin:24px auto;transition:transform 1s ease;display:flex;align-items:center;justify-content:center"></div>');
  const labelFase = T.el('<div style="text-align:center;font-size:20px;font-weight:600;margin-bottom:4px">Siap?</div>');
  const labelHitung = T.el('<div style="text-align:center;font-size:13px;color:#a1a1aa;margin-bottom:8px">Tekan mulai, lalu ikuti lingkaran dan hitungannya.</div>');
  const labelSiklus = T.el('<div style="text-align:center;font-size:13px;color:#a1a1aa"></div>');
  const box = T.out();
  let timer = null, faseIdx = 0, detikSisa = 0, siklus = 0, berjalan = false;

  function simpanStreak() {
    try {
      const kunci = 'at-napas-streak';
      const data = JSON.parse(localStorage.getItem(kunci) || '{"total":0,"terakhir":""}');
      const hariIni = new Date().toISOString().slice(0, 10);
      if (data.terakhir !== hariIni) {
        data.total += 1;
        data.terakhir = hariIni;
        localStorage.setItem(kunci, JSON.stringify(data));
      }
      return data.total;
    } catch (e) { return 0; }
  }

  function tampilStreak() {
    let total = 0;
    try { total = JSON.parse(localStorage.getItem('at-napas-streak') || '{"total":0}').total || 0; } catch (e) { /* abaikan */ }
    labelSiklus.textContent = total > 0
      ? 'Siklus selesai: ' + siklus + ' · Latihan di ' + total + ' hari berbeda'
      : 'Siklus selesai: ' + siklus;
  }

  function aturFase() {
    const fase = utils.POLA_NAPAS[pola.value].fase[faseIdx];
    labelFase.textContent = fase[0];
    detikSisa = fase[1];
    labelHitung.textContent = detikSisa + ' detik';
    lingkaran.style.transform = fase[0] === 'Tarik napas' ? 'scale(1.4)' : (fase[0] === 'Buang napas' ? 'scale(0.85)' : 'scale(1.15)');
  }

  function mulai() {
    if (berjalan) return;
    berjalan = true;
    faseIdx = 0;
    aturFase();
    timer = setInterval(() => {
      detikSisa -= 1;
      if (detikSisa > 0) { labelHitung.textContent = detikSisa + ' detik'; return; }
      faseIdx += 1;
      if (faseIdx >= utils.POLA_NAPAS[pola.value].fase.length) {
        faseIdx = 0;
        siklus += 1;
        simpanStreak();
        tampilStreak();
      }
      aturFase();
    }, 1000);
    T.show(box, '<div class="hint">Latihan berjalan. Duduk atau berbaring dengan nyaman, tarik napas lewat hidung, buang perlahan lewat mulut.</div>');
  }

  function berhenti() {
    berjalan = false;
    if (timer) { clearInterval(timer); timer = null; }
    labelFase.textContent = 'Selesai';
    labelHitung.textContent = siklus > 0 ? 'Kamu menyelesaikan ' + siklus + ' siklus.' : 'Tekan mulai untuk latihan lagi.';
    lingkaran.style.transform = 'scale(1)';
  }

  T.onLeave(berhenti);
  pola.addEventListener('change', () => { if (berjalan) { berhenti(); } });

  root.appendChild(T.el('<p class="note">Latihan napas terpandu. Ikuti lingkaran yang membesar dan mengecil, sesuai hitungan di layar.</p>'));
  root.appendChild(T.field('Pilih pola napas', pola));
  root.appendChild(lingkaran);
  root.appendChild(labelFase);
  root.appendChild(labelHitung);
  root.appendChild(labelSiklus);
  root.appendChild(T.row(
    T.btn('Mulai', mulai, true),
    T.btn('Berhenti', berhenti)
  ));
  root.appendChild(box);
  tampilStreak();
}
