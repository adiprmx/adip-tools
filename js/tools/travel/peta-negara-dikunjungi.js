import { h as T, utils, kv, fileInput } from '../../core.js';
import { NEGARA } from '../sehari/kode-telepon-internasional.js';

// Peta negara yang dikunjungi: tandai negara yang pernah kamu kunjungi,
// lihat jumlahnya, persentase dunia yang sudah dijelajahi, dan progres per
// region. Data hanya tersimpan di HP ini (localStorage), bisa diekspor
// dan diimpor sebagai JSON. Tanpa data, tampilannya kosong dengan jujur.
// Pemetaan region mengikuti skema geografi PBB (UN geoscheme).
export const REGION = {
  asia: 'Asia', eropa: 'Eropa', afrika: 'Afrika',
  amerikaUtara: 'Amerika Utara', amerikaSelatan: 'Amerika Selatan',
  oseania: 'Oseania', lainnya: 'Lainnya',
};
const ISO_REGION = {};
[
  ['asia', 'AF SA AM AZ BH BD BT BN KH CN GE HK IN ID IQ IR IL JP KZ KG KR KP KW LA LB MO MY MV MN MM NP OM PK PS PH QA SG LK SY TW TJ TH TL TR TM AE UZ VN YE JO CY'],
  ['eropa', 'AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA AX'],
  ['afrika', 'DZ AO BJ BW BF BI CM CV CF TD KM CG CD DJ EG GQ ER SZ ET GA GM GH GN GW CI KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO SD SS TZ TG TN UG ZM ZW IO'],
  ['amerikaUtara', 'AI AG AW BS BB BZ BM CA KY CR CU CW DM DO SV GD GP GT HT HN JM MQ MX MS NI PA PR BL KN LC MF PM VC SX TC TT US VG VI GL'],
  ['amerikaSelatan', 'AR BO BR CL CO EC FK GF GY PY PE SR UY VE'],
  ['oseania', 'AU FJ GU KI MH FM NR NC NZ NU NF PW PG CK WS AS SB TK TO TV VU PF WF CX CC PN'],
  ['lainnya', 'AQ BV'],
].forEach(([reg, daftar]) => daftar.split(' ').forEach((iso) => { ISO_REGION[iso] = reg; }));
export function regionDariISO(iso) {
  return ISO_REGION[String(iso || '').toUpperCase()] || 'lainnya';
}
export function negaraPerRegion() {
  const hasil = {};
  Object.keys(REGION).forEach((r) => { hasil[r] = []; });
  NEGARA.forEach(([nama, , iso]) => {
    hasil[regionDariISO(iso)].push({ nama, iso });
  });
  return hasil;
}
export function hitungProgres(dikunjungi) {
  const set = dikunjungi instanceof Set ? dikunjungi : new Set(Array.isArray(dikunjungi) ? dikunjungi : []);
  const perRegion = negaraPerRegion();
  const rincian = Object.keys(REGION).map((r) => {
    const total = perRegion[r].length;
    const sudah = perRegion[r].filter((n) => set.has(n.iso)).length;
    return { region: r, label: REGION[r], total, sudah, persen: total ? Math.round(sudah / total * 100) : 0 };
  });
  return {
    total: NEGARA.length,
    sudah: set.size,
    persen: Math.round(set.size / NEGARA.length * 100),
    rincian,
  };
}
// Bentuk benua yang disederhanakan untuk peta sketsa (viewBox 0 0 100 50).
export const PETA_SKETSA = {
  amerikaUtara: 'M4,6 L14,3 L26,5 L30,10 L27,16 L22,18 L20,24 L15,27 L10,24 L6,18 L3,12 Z',
  amerikaSelatan: 'M24,28 L34,27 L37,33 L33,42 L28,48 L24,40 L22,33 Z',
  eropa: 'M45,5 L55,4 L58,9 L54,14 L47,15 L43,10 Z',
  afrika: 'M44,17 L56,16 L60,22 L57,32 L50,38 L45,32 L42,24 Z',
  asia: 'M59,4 L92,3 L97,9 L93,17 L84,22 L72,24 L64,20 L59,13 Z',
  oseania: 'M80,30 L95,29 L97,35 L88,40 L80,36 Z',
};
export const STORAGE_KEY = 'adip-tools:negara-dikunjungi';
// ISO yang sah = yang ada di daftar NEGARA. Data lama di localStorage
// bisa berisi kode basi (negara dihapus/diubah di daftar) — tanpa
// validasi, kode basi itu menggelembungkan hitungan.
const ISO_SAH = new Set(NEGARA.map((n) => n[2]));
export function validasiISO(daftar) {
  const bersih = new Set();
  let dibuang = 0;
  (Array.isArray(daftar) ? daftar : []).forEach((iso) => {
    if (typeof iso === 'string' && ISO_SAH.has(iso)) bersih.add(iso);
    else dibuang++;
  });
  return { bersih, dibuang };
}
utils.petaNegara = { regionDariISO, negaraPerRegion, hitungProgres, validasiISO };

export const meta = {"id": "peta-negara-dikunjungi", "name": "Peta Negara yang Dikunjungi", "cat": "travel", "icon": "🌍", "desc": "Tandai negara yang pernah kamu kunjungi, lihat progresmu per region dan berapa persen dunia yang sudah dijelajahi.", "keywords": "negara dikunjungi,peta negara,visited countries,travel map,daftar negara,jejak travel", "since": "6.19.0"};
export function render(root) {
  const cariI = T.input('text', 'Cari negara, cth: Jepang', '');
  const petaBox = T.el('<div></div>');
  const ringkasBox = T.out();
  const daftarBox = T.el('<div></div>');
  const aksiBox = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"></div>');
  const pesanBox = T.out();

  let dikunjungi = new Set();
  let dibuangBasi = 0;
  try {
    const tersimpan = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(tersimpan)) {
      const v = validasiISO(tersimpan);
      dikunjungi = v.bersih;
      dibuangBasi = v.dibuang;
    }
  } catch (e) { /* data lama rusak, mulai kosong */ }
  const simpan = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dikunjungi))); } catch (e) { /* penyimpanan penuh atau diblokir */ }
  };
  // Self-heal: bila ada kode basi yang dibuang, simpan ulang daftar bersih.
  if (dibuangBasi > 0) simpan();

  const gambarPeta = (prog) => {
    const isi = Object.keys(PETA_SKETSA).map((r) => {
      const d = prog.rincian.find((x) => x.region === r);
      const persen = d ? d.persen : 0;
      const warna = persen === 0 ? 'rgba(127,127,127,.25)' : 'rgba(255,107,74,' + (0.25 + persen / 100 * 0.75).toFixed(2) + ')';
      return '<path d="' + PETA_SKETSA[r] + '" fill="' + warna + '" stroke="rgba(127,127,127,.5)" stroke-width="0.4"><title>' + T.esc(REGION[r]) + ': ' + persen + '%</title></path>';
    }).join('');
    petaBox.innerHTML = '<svg viewBox="0 0 100 50" style="width:100%;height:auto;border:1px solid rgba(127,127,127,.3);border-radius:12px;background:rgba(127,127,127,.06)" role="img" aria-label="Peta sketsa dunia, warna region makin kuat bila makin banyak negara dikunjungi">' + isi + '</svg>' +
      '<p class="mut" style="font-size:12px;margin-top:4px">Peta sketsa, bentuk benua disederhanakan. Warna region makin kuat bila makin banyak negaranya dikunjungi.</p>';
  };

  const tampil = () => {
    const prog = hitungProgres(dikunjungi);
    gambarPeta(prog);
    if (prog.sudah === 0) {
      T.show(ringkasBox, '<div class="big">0 negara</div><p class="center mut">Belum ada negara yang ditandai. Cari negaramu di daftar bawah dan centang yang pernah kamu kunjungi.</p>');
    } else {
      const barRegion = prog.rincian.filter((d) => d.total > 0).map((d) => {
        return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>' + T.esc(d.label) + '</span><span><b>' + d.sudah + '/' + d.total + '</b> (' + d.persen + '%)</span></div>' +
          '<div style="height:8px;border-radius:4px;background:rgba(127,127,127,.18);overflow:hidden;margin-top:3px"><div style="height:100%;width:' + d.persen + '%;background:#ff6b4a;border-radius:4px"></div></div></div>';
      }).join('');
      T.show(ringkasBox,
        '<div class="big">' + T.fmt(prog.sudah) + ' negara <span class="mut" style="font-size:16px">(' + prog.persen + '%)</span></div>' +
        '<p class="center mut">Dari ' + prog.total + ' negara dan wilayah di daftar.</p>' +
        '<div class="dim" style="margin-top:12px">Progres per region</div>' + barRegion);
    }
    // Daftar centang per region (difilter pencarian).
    const q = cariI.value.trim().toLowerCase();
    const perRegion = negaraPerRegion();
    daftarBox.innerHTML = '';
    Object.keys(REGION).forEach((r) => {
      const daftar = perRegion[r].filter((n) => !q || n.nama.toLowerCase().includes(q) || n.iso.toLowerCase().includes(q));
      if (!daftar.length) return;
      const judul = T.el('<div class="dim" style="margin:14px 0 6px">' + T.esc(REGION[r]) + ' (' + daftar.filter((n) => dikunjungi.has(n.iso)).length + '/' + perRegion[r].length + ')</div>');
      daftarBox.appendChild(judul);
      const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"></div>');
      daftar.forEach((n) => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;padding:8px;border:1px solid rgba(127,127,127,.3);border-radius:10px;cursor:pointer;min-height:44px;box-sizing:border-box';
        const cek = document.createElement('input');
        cek.type = 'checkbox';
        cek.checked = dikunjungi.has(n.iso);
        cek.setAttribute('aria-label', n.nama);
        cek.addEventListener('change', () => {
          if (cek.checked) dikunjungi.add(n.iso); else dikunjungi.delete(n.iso);
          simpan();
          tampil();
        });
        label.appendChild(cek);
        label.appendChild(document.createTextNode(n.nama));
        grid.appendChild(label);
      });
      daftarBox.appendChild(grid);
    });
    if (!daftarBox.children.length) {
      daftarBox.innerHTML = '<p class="mut" style="font-size:13px">Tidak ada negara yang cocok dengan pencarianmu.</p>';
    }
  };

  const eksporBtn = T.btn('Ekspor JSON', () => {
    const data = JSON.stringify({ dikunjungi: Array.from(dikunjungi).sort(), total: NEGARA.length, diekspor: new Date().toISOString().slice(0, 10) }, null, 2);
    T.dl('negara-dikunjungi.json', data, 'application/json');
    T.show(pesanBox, '<p class="mut" style="font-size:13px">File negara-dikunjungi.json diunduh.</p>');
  });
  const fi = fileInput('.json,application/json');
  fi.addEventListener('change', () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    const baca = new FileReader();
    baca.onload = () => {
      try {
        const data = JSON.parse(String(baca.result || ''));
        const daftar = Array.isArray(data) ? data : data.dikunjungi;
        if (!Array.isArray(daftar)) throw new Error('format');
        const baru = validasiISO(daftar).bersih;
        dikunjungi = baru;
        simpan();
        tampil();
        T.show(pesanBox, '<p class="mut" style="font-size:13px">Impor berhasil: ' + baru.size + ' negara ditandai.</p>');
      } catch (e) {
        T.show(pesanBox, '<div class="err">File bukan JSON daftar negara yang valid. Ekspor dulu dari tool ini untuk melihat formatnya.</div>');
      }
      fi.value = '';
    };
    baca.readAsText(f);
  });
  const imporBtn = T.btn('Impor JSON', () => fi.click());
  const hapusBtn = T.btn('Hapus semua centang', () => {
    dikunjungi = new Set();
    simpan();
    tampil();
    T.show(pesanBox, '<p class="mut" style="font-size:13px">Semua centang dihapus.</p>');
  });
  aksiBox.appendChild(eksporBtn);
  aksiBox.appendChild(imporBtn);
  aksiBox.appendChild(hapusBtn);

  cariI.addEventListener('input', tampil);

  root.appendChild(T.el('<p class="note">Centang negara yang pernah kamu kunjungi. Datamu tersimpan di HP ini saja, tidak dikirim ke mana-mana.</p>'));
  root.appendChild(petaBox);
  root.appendChild(ringkasBox);
  root.appendChild(T.field('Cari negara', cariI));
  root.appendChild(aksiBox);
  root.appendChild(pesanBox);
  root.appendChild(daftarBox);
  tampil();
}
