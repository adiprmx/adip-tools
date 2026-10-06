import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"rumus-saku","name":"Rumus Saku","cat":"pelajar","icon":"🧮","desc":"Kantong rumus cepat Matematika, Kimia, dan Statistika untuk dihafal.","keywords":"rumus,matematika,kimia,statistik,hafalan,contekan,referensi"};

const RUMUS = [
  // Matematika — aljabar
  { kat: 'Matematika', judul: 'Kuadrat sempurna', rumus: '(a ± b)² = a² ± 2ab + b²', ket: 'Aljabar dasar — paling sering keluar.' },
  { kat: 'Matematika', judul: 'Selisih kuadrat', rumus: 'a² − b² = (a + b)(a − b)', ket: 'Faktorisasi dua suku kuadrat.' },
  { kat: 'Matematika', judul: 'Rumus ABC (kuadrat)', rumus: 'x = (−b ± √(b² − 4ac)) / 2a', ket: 'Akar persamaan ax² + bx + c = 0.' },
  { kat: 'Matematika', judul: 'Diskriminan', rumus: 'D = b² − 4ac → D>0 dua akar, D=0 kembar, D<0 imajiner', ket: 'Menentukan jenis akar persamaan kuadrat.' },
  { kat: 'Matematika', judul: 'Sifat pangkat', rumus: 'aᵐ × aⁿ = aᵐ⁺ⁿ · aᵐ ÷ aⁿ = aᵐ⁻ⁿ · (aᵐ)ⁿ = aᵐⁿ', ket: 'Eksponen — basis sama.' },
  { kat: 'Matematika', judul: 'Sifat logaritma', rumus: 'ᵃlog(bc) = ᵃlog b + ᵃlog c · ᵃlog(b/c) = ᵃlog b − ᵃlog c · ᵃlog bⁿ = n·ᵃlog b', ket: 'Syarat a>0, a≠1, b>0, c>0.' },
  { kat: 'Matematika', judul: 'Turunan dasar', rumus: "f(x)=xⁿ → f′(x)=n·xⁿ⁻¹", ket: 'Aturan pangkat turunan.' },
  { kat: 'Matematika', judul: 'Integral dasar', rumus: '∫ xⁿ dx = xⁿ⁺¹/(n+1) + C  (n≠−1)', ket: 'Kebalikan turunan pangkat.' },
  { kat: 'Matematika', judul: 'Jumlah deret aritmetika', rumus: 'Sₙ = n/2 × (2a + (n−1)b)', ket: 'a = suku pertama, b = beda.' },
  { kat: 'Matematika', judul: 'Jumlah deret geometri', rumus: 'Sₙ = a(rⁿ − 1)/(r − 1), r≠1', ket: 'a = suku pertama, r = rasio.' },
  { kat: 'Matematika', judul: 'Teorema Pythagoras', rumus: 'a² + b² = c²', ket: 'Segitiga siku-siku, c = sisi miring.' },
  { kat: 'Matematika', judul: 'Luas lingkaran', rumus: 'L = πr² · K = 2πr', ket: 'r = jari-jari.' },
  { kat: 'Matematika', judul: 'Volume bola & tabung', rumus: 'V bola = 4/3 πr³ · V tabung = πr²t', ket: 't = tinggi tabung.' },
  // Kimia
  { kat: 'Kimia', judul: 'Jumlah mol', rumus: 'n = m / Mr', ket: 'n = mol, m = massa (gram), Mr = massa molekul relatif.' },
  { kat: 'Kimia', judul: 'Molaritas', rumus: 'M = n / V', ket: 'V dalam liter. Satuan: mol/L.' },
  { kat: 'Kimia', judul: 'Pengenceran', rumus: 'M₁V₁ = M₂V₂', ket: 'Konsentrasi sebelum & sesudah pengenceran.' },
  { kat: 'Kimia', judul: 'Hukum Avogadro (gas STP)', rumus: 'V = n × 22,4 L', ket: 'Volume 1 mol gas pada STP = 22,4 liter.' },
  { kat: 'Kimia', judul: 'pH', rumus: 'pH = −log[H⁺] · pH + pOH = 14', ket: '[H⁺] = konsentrasi ion H⁺ (M).' },
  { kat: 'Kimia', judul: '% massa unsur', rumus: '%X = (Ar X × jumlah atom / Mr senyawa) × 100%', ket: 'Kadar unsur dalam senyawa.' },
  // Statistika
  { kat: 'Statistika', judul: 'Rata-rata (mean)', rumus: 'x̄ = Σx / n', ket: 'Jumlah semua data dibagi banyak data.' },
  { kat: 'Statistika', judul: 'Variansi & simpangan baku', rumus: 'σ² = Σ(x − x̄)² / n · σ = √σ²', ket: 'Ukuran sebaran data.' },
  { kat: 'Statistika', judul: 'Peluang kejadian', rumus: 'P(A) = n(A) / n(S)', ket: 'n(A) = kejadian, n(S) = ruang sampel.' },
  { kat: 'Statistika', judul: 'Kombinasi', rumus: 'C(n,r) = n! / (r!(n−r)!)', ket: 'Urutan tidak penting.' },
  { kat: 'Statistika', judul: 'Permutasi', rumus: 'P(n,r) = n! / (n−r)!', ket: 'Urutan penting.' },
];

const KATS = ['Semua', 'Matematika', 'Kimia', 'Statistika'];

export function render(root) {
  root.appendChild(T.el('<p class="mut">Kumpulan rumus yang paling sering dipakai — cari, baca, salin, hafalkan. 🧠</p>'));

  const searchInp = T.input('text', '🔍 Cari rumus…', '');
  root.appendChild(T.field('Cari', searchInp));

  let katAktif = 'Semua';
  const chipWrap = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px"></div>');
  const chips = [];
  const drawChips = () => {
    chipWrap.innerHTML = ''; chips.length = 0;
    KATS.forEach((k) => {
      const n = k === 'Semua' ? RUMUS.length : RUMUS.filter((r) => r.kat === k).length;
      const c = T.el('<button type="button" class="btn' + (k === katAktif ? ' primary' : '') + '" style="font-size:13px;padding:6px 12px">' + k + ' (' + n + ')</button>');
      c.addEventListener('click', () => { katAktif = k; drawChips(); drawList(); });
      chipWrap.appendChild(c); chips.push(c);
    });
  };
  root.appendChild(chipWrap);

  const listEl = T.el('<div></div>');
  const drawList = () => {
    const q = searchInp.value.trim().toLowerCase();
    const hasil = RUMUS.filter((r) =>
      (katAktif === 'Semua' || r.kat === katAktif) &&
      (!q || r.judul.toLowerCase().includes(q) || r.rumus.toLowerCase().includes(q) || r.ket.toLowerCase().includes(q)));
    listEl.innerHTML = '';
    if (!hasil.length) { listEl.appendChild(T.el('<p class="center mut">Tidak ketemu. Coba kata kunci lain. 🔎</p>')); return; }
    hasil.forEach((r) => {
      const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
      card.appendChild(T.el('<div style="font-size:12px" class="dim">' + T.esc(r.kat) + '</div>'));
      card.appendChild(T.el('<div style="font-weight:700;font-size:15px;margin:2px 0 6px">' + T.esc(r.judul) + '</div>'));
      card.appendChild(T.el('<div style="font-size:15px;line-height:1.6;background:var(--bg2);border-radius:8px;padding:8px 10px">' + T.esc(r.rumus) + '</div>'));
      card.appendChild(T.el('<div class="dim" style="font-size:13px;margin-top:6px">' + T.esc(r.ket) + '</div>'));
      const rowB = T.el('<div style="text-align:right;margin-top:8px"></div>');
      rowB.appendChild(T.copyBtn(() => r.judul + ': ' + r.rumus + ' — ' + r.ket, 'Salin'));
      card.appendChild(rowB);
      listEl.appendChild(card);
    });
  };
  searchInp.addEventListener('input', drawList);
  root.appendChild(listEl);
  drawChips();
  drawList();
}
