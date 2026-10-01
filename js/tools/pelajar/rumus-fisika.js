import { h as T } from '../../core.js?v=6.5.0';

export const meta = {"id":"rumus-fisika","name":"Rumus Fisika","cat":"pelajar","icon":"🔬","desc":"Isi yang diketahui, kosongkan satu — jawabannya dihitung + langkahnya.","keywords":"fisika,rumus,glb,glbb,gaya,usaha,daya,energi kinetik,gerak lurus,percepatan"};

// Angka ala Indonesia: 12.5 -> "12,5"
const fn = (x) => Number(x).toLocaleString('id-ID', { maximumFractionDigits: 4 });
const R = (unit, rumus, val, langkah) => ({ unit, rumus, val, langkah });
const ERR = (error) => ({ error });

const RUMUS = [
  {
    id: 'glb', name: 'GLB — Gerak Lurus Beraturan', formula: 'v = s / t',
    fields: [['v', 'Kecepatan (v)', 'm/s'], ['s', 'Jarak tempuh (s)', 'm'], ['t', 'Waktu (t)', 's']],
    solve(target, v) {
      if (target === 'v') return R('m/s', 'v = s / t', v.s / v.t,
        ['v = s / t', 'v = ' + fn(v.s) + ' / ' + fn(v.t)]);
      if (target === 's') return R('m', 's = v × t', v.v * v.t,
        ['s = v × t', 's = ' + fn(v.v) + ' × ' + fn(v.t)]);
      return R('s', 't = s / v', v.s / v.v,
        ['t = s / v', 't = ' + fn(v.s) + ' / ' + fn(v.v)]);
    },
  },
  {
    id: 'glbb', name: 'GLBB — Gerak Lurus Berubah Beraturan', formula: 's = v₀·t + ½·a·t²',
    fields: [['s', 'Jarak (s)', 'm'], ['v0', 'Kecepatan awal (v₀)', 'm/s'], ['t', 'Waktu (t)', 's'], ['a', 'Percepatan (a)', 'm/s²']],
    solve(target, v) {
      if (target === 's') return R('m', 's = v₀·t + ½·a·t²', v.v0 * v.t + 0.5 * v.a * v.t * v.t,
        ['s = v₀·t + ½·a·t²',
         's = (' + fn(v.v0) + ' × ' + fn(v.t) + ') + ½ × ' + fn(v.a) + ' × ' + fn(v.t) + '²']);
      if (target === 'v0') return R('m/s', 'v₀ = (s − ½·a·t²) / t', (v.s - 0.5 * v.a * v.t * v.t) / v.t,
        ['v₀ = (s − ½·a·t²) / t',
         'v₀ = (' + fn(v.s) + ' − ½ × ' + fn(v.a) + ' × ' + fn(v.t) + '²) / ' + fn(v.t)]);
      if (target === 'a') return R('m/s²', 'a = 2·(s − v₀·t) / t²', 2 * (v.s - v.v0 * v.t) / (v.t * v.t),
        ['a = 2·(s − v₀·t) / t²',
         'a = 2 × (' + fn(v.s) + ' − ' + fn(v.v0) + ' × ' + fn(v.t) + ') / ' + fn(v.t) + '²']);
      // target t: ½·a·t² + v₀·t − s = 0
      if (v.a === 0) return R('s', 't = s / v₀  (a = 0, geraknya jadi GLB)', v.s / v.v0,
        ['t = s / v₀', 't = ' + fn(v.s) + ' / ' + fn(v.v0)]);
      const D = v.v0 * v.v0 + 2 * v.a * v.s;
      if (D < 0) return ERR('Diskriminannya negatif — nggak ada solusi waktu yang nyata dengan angka ini.');
      const t1 = (-v.v0 + Math.sqrt(D)) / v.a;
      const t2 = (-v.v0 - Math.sqrt(D)) / v.a;
      const val = t1 >= 0 ? t1 : t2;
      if (!(val >= 0)) return ERR('Solusinya negatif — cek lagi angka yang kamu masukkan.');
      return R('s', '½·a·t² + v₀·t − s = 0  (kuadrat)', val,
        ['D = v₀² + 2·a·s = ' + fn(D),
         't = (−v₀ + √D) / a, diambil yang positif']);
    },
  },
  {
    id: 'gaya', name: 'Gaya', formula: 'F = m × a',
    fields: [['F', 'Gaya (F)', 'N'], ['m', 'Massa (m)', 'kg'], ['a', 'Percepatan (a)', 'm/s²']],
    solve(target, v) {
      if (target === 'F') return R('N', 'F = m × a', v.m * v.a,
        ['F = m × a', 'F = ' + fn(v.m) + ' × ' + fn(v.a)]);
      if (target === 'm') return R('kg', 'm = F / a', v.F / v.a,
        ['m = F / a', 'm = ' + fn(v.F) + ' / ' + fn(v.a)]);
      return R('m/s²', 'a = F / m', v.F / v.m,
        ['a = F / m', 'a = ' + fn(v.F) + ' / ' + fn(v.m)]);
    },
  },
  {
    id: 'usaha', name: 'Usaha', formula: 'W = F × s',
    fields: [['W', 'Usaha (W)', 'J'], ['F', 'Gaya (F)', 'N'], ['s', 'Perpindahan (s)', 'm']],
    solve(target, v) {
      if (target === 'W') return R('J', 'W = F × s', v.F * v.s,
        ['W = F × s', 'W = ' + fn(v.F) + ' × ' + fn(v.s)]);
      if (target === 'F') return R('N', 'F = W / s', v.W / v.s,
        ['F = W / s', 'F = ' + fn(v.W) + ' / ' + fn(v.s)]);
      return R('m', 's = W / F', v.W / v.F,
        ['s = W / F', 's = ' + fn(v.W) + ' / ' + fn(v.F)]);
    },
  },
  {
    id: 'daya', name: 'Daya', formula: 'P = W / t',
    fields: [['P', 'Daya (P)', 'W'], ['W', 'Usaha (W)', 'J'], ['t', 'Waktu (t)', 's']],
    solve(target, v) {
      if (target === 'P') return R('W', 'P = W / t', v.W / v.t,
        ['P = W / t', 'P = ' + fn(v.W) + ' / ' + fn(v.t)]);
      if (target === 'W') return R('J', 'W = P × t', v.P * v.t,
        ['W = P × t', 'W = ' + fn(v.P) + ' × ' + fn(v.t)]);
      return R('s', 't = W / P', v.W / v.P,
        ['t = W / P', 't = ' + fn(v.W) + ' / ' + fn(v.P)]);
    },
  },
  {
    id: 'ek', name: 'Energi Kinetik', formula: 'Ek = ½·m·v²',
    fields: [['Ek', 'Energi kinetik (Ek)', 'J'], ['m', 'Massa (m)', 'kg'], ['v', 'Kecepatan (v)', 'm/s']],
    solve(target, v) {
      if (target === 'Ek') return R('J', 'Ek = ½·m·v²', 0.5 * v.m * v.v * v.v,
        ['Ek = ½·m·v²', 'Ek = ½ × ' + fn(v.m) + ' × ' + fn(v.v) + '²']);
      if (target === 'm') return R('kg', 'm = 2·Ek / v²', 2 * v.Ek / (v.v * v.v),
        ['m = 2·Ek / v²', 'm = 2 × ' + fn(v.Ek) + ' / ' + fn(v.v) + '²']);
      if (2 * v.Ek / v.m < 0) return ERR('Angkanya nggak masuk akal — akar dari bilangan negatif.');
      return R('m/s', 'v = √(2·Ek / m)', Math.sqrt(2 * v.Ek / v.m),
        ['v = √(2·Ek / m)', 'v = √(2 × ' + fn(v.Ek) + ' / ' + fn(v.m) + ')']);
    },
  },
];

export function render(root) {

    const sel = T.select(RUMUS.map((r) => [r.id, r.name]));
    const rumusLbl = T.el('<p class="hint" style="margin:6px 0 12px"></p>');
    const fieldsBox = T.el('<div></div>');
    const box = T.out();
    let inputs = {};

    const paintFields = () => {
      const def = RUMUS.find((r) => r.id === sel.value);
      rumusLbl.textContent = 'Rumus: ' + def.formula;
      fieldsBox.innerHTML = '';
      inputs = {};
      def.fields.forEach(([k, label, unit]) => {
        const i = T.input('text', 'kosongkan kalau ini yang dicari', '');
        i.inputMode = 'decimal';
        inputs[k] = i;
        fieldsBox.appendChild(T.field(label + '  [' + unit + ']', i));
      });
      T.hide(box);
    };
    sel.addEventListener('change', paintFields);

    const hitung = () => {
      const def = RUMUS.find((r) => r.id === sel.value);
      const vals = {};
      const kosong = [];
      for (const [k, label] of def.fields) {
        const raw = inputs[k].value.trim();
        if (!raw) { kosong.push(k); continue; }
        const n = T.num(raw);
        if (!isFinite(n)) { T.toast('"' + label + '" harus angka yang valid'); return; }
        vals[k] = n;
      }
      if (kosong.length === 0) {
        T.show(box, '<p class="hint center">Semua terisi — kosongkan SATU kolom yang mau dicari jawabannya.</p>');
        return;
      }
      if (kosong.length > 1) {
        T.show(box, '<p class="hint center">Isi semua kecuali SATU — yang kosong itu yang bakal dihitung.</p>');
        return;
      }
      let r;
      try { r = def.solve(kosong[0], vals); }
      catch (e) { r = ERR('Angkanya nggak masuk akal — cek lagi.'); }
      if (!r || r.error || !isFinite(r.val)) {
        T.show(box, '<p class="err">' + T.esc((r && r.error) || 'Nggak bisa dihitung — mungkin ada pembagian dengan nol.') + '</p>');
        return;
      }
      const target = def.fields.find(([k]) => k === kosong[0]);
      T.show(box,
        '<div class="big center">' + T.esc(fn(r.val)) + ' <span class="mut" style="font-size:15px">' + T.esc(r.unit) + '</span></div>' +
        '<p class="center"><b>' + T.esc(target[1]) + '</b> ketemu!</p>' +
        '<div class="mut" style="font-size:12px;margin-bottom:6px">Rumus: ' + T.esc(r.rumus) + '</div>' +
        r.langkah.map((l) => '<div style="font-size:13.5px">' + T.esc(l) + '</div>').join('') +
        '<div style="font-size:14px;margin-top:4px">= <b>' + T.esc(fn(r.val)) + ' ' + T.esc(r.unit) + '</b></div>');
    };

    root.appendChild(T.el('<p class="note">Isi variabel yang kamu tahu, <b>kosongkan satu</b> yang mau dicari — jawabannya dihitung otomatis lengkap dengan langkah substitusinya.</p>'));
    root.appendChild(T.field('Pilih rumus', sel));
    root.appendChild(rumusLbl);
    root.appendChild(fieldsBox);
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
    paintFields();

}
