import { h as T, utils, esc } from '../../core.js';

export const meta = {"id": "citation", "name": "Citation Generator", "cat": "pelajar", "icon": "📚", "desc": "Daftar pustaka APA & MLA.", "keywords": "citation,sitasi,skripsi,daftar,pustaka"};

export const splitAuthors = (raw) => String(raw || '').split(/[;]+/).map((s) => s.trim()).filter(Boolean);
// Pecah "Budi Santoso" -> fam "Santoso", ini "B.". Penulis satu kata
// ("Budi") tidak punya nama depan — inisialnya kosong supaya tidak
// muncul koma menggantung ("Budi, ").
export const inisial = (nama) => {
  const p = String(nama || '').split(/\s+/).filter(Boolean);
  const fam = p[p.length - 1] || '';
  const ini = p.slice(0, -1).map((x) => x.charAt(0).toUpperCase() + '.').join(' ');
  return { fam, ini, depan: p.slice(0, -1).join(' ') };
};
// APA 7: 1-20 penulis ditulis semua (dipisah koma, "&" sebelum
// terakhir); 21+ penulis: 19 pertama, lalu elipsis, lalu penulis
// terakhir — tanpa "&" (aturan daftar pustaka APA 7th, §9.8).
export const apaAuthors = (raw) => {
  const list = splitAuthors(raw).map((a) => { const x = inisial(a); return x.ini ? x.fam + ', ' + x.ini : x.fam; });
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return list[0] + ', & ' + list[1];
  if (list.length >= 21) return list.slice(0, 19).join(', ') + ', … ' + list[list.length - 1];
  return list.slice(0, -1).join(', ') + ', & ' + list[list.length - 1];
};
// MLA 9: 1 penulis ditulis penuh ("Santoso, Budi"); 2 penulis ditulis
// dua-duanya; 3+ penulis: penulis pertama + "et al."
export const mlaAuthors = (raw) => {
  const list = splitAuthors(raw).map((a, i) => {
    const x = inisial(a);
    return i === 0 ? (x.depan ? x.fam + ', ' + x.depan : x.fam) : a;
  });
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return list[0] + ', and ' + list[1];
  return list[0] + ', et al.';
};
// Normalisasi DOI dari berbagai bentuk ketikan ("10.1234/abc",
// "doi:10.1234/abc", "https://doi.org/10.1234/abc") jadi { doi, url }.
// Mengembalikan null bila tidak diawali "10.".
export function normalisasiDoi(raw) {
  const s = String(raw || '').trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '').trim();
  if (!/^10\.\S+\/\S+/.test(s)) return null;
  return { doi: s, url: 'https://doi.org/' + s };
}

export function render(root) {

    const tipe = T.select([['buku', '📕 Buku'], ['jurnal', '📰 Jurnal'], ['web', '🌐 Website']], 'buku');
    const fPenulis = T.ta(2, 'Nama penulis, pisahkan dengan titik koma bila lebih dari satu\ncth: Budi Santoso; Andi Wijaya');
    const fTahun = T.input('number', 'Tahun terbit', String(new Date().getFullYear()));
    const fJudul = T.ta(2, 'Judul');
    const fPenerbit = T.input('text', 'Penerbit');
    const fJurnal = T.input('text', 'Nama jurnal');
    const fVol = T.input('text', 'Volume (cth: 12)');
    const fHalaman = T.input('text', 'Halaman (cth: 45–67)');
    const fDoi = T.input('text', 'DOI (cth: 10.1234/abc)');
    const fUrl = T.input('text', 'URL lengkap (https://…)');
    const box = T.out();
    const formBox = T.el('<div></div>');
    const siteDariUrl = (url) => {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    };
    const paintForm = () => {
      formBox.innerHTML = '';
      formBox.appendChild(T.field('Penulis', fPenulis, 'Pisahkan beberapa penulis dengan titik koma (;)'));
      formBox.appendChild(T.grid2(T.field('Tahun', fTahun), T.field('Judul', fJudul)));
      if (tipe.value === 'buku') formBox.appendChild(T.grid2(T.field('Penerbit', fPenerbit), T.field('DOI (bila ada)', fDoi, 'Kosongkan bila buku tidak punya DOI')));
      if (tipe.value === 'jurnal') {
        formBox.appendChild(T.grid2(T.field('Nama jurnal', fJurnal), T.field('Volume', fVol)));
        formBox.appendChild(T.grid2(T.field('Nomor halaman', fHalaman, 'cth: 45–67'), T.field('DOI (bila ada)', fDoi, 'cth: 10.1234/abc')));
      }
      if (tipe.value === 'web') formBox.appendChild(T.field('URL', fUrl, 'Sertakan https://'));
    };
    const buat = () => {
      const penulis = fPenulis.value.trim(), tahun = (fTahun.value || 't.t.').trim(), judul = fJudul.value.trim();
      if (!penulis || !judul) { T.show(box, '<span class="err">Isi minimal nama penulis dan judul.</span>'); return; }
      const apaA = apaAuthors(penulis), mlaA = mlaAuthors(penulis);
      const doi = normalisasiDoi(fDoi.value);
      let apa = '', mla = '';
      if (tipe.value === 'buku') {
        const pb = fPenerbit.value.trim() || '[penerbit]';
        apa = apaA + ' (' + tahun + '). <i>' + esc(judul) + '</i>. ' + esc(pb) + '.' + (doi ? ' ' + esc(doi.url) : '');
        mla = mlaA + '. <i>' + esc(judul) + '</i>. ' + esc(pb) + ', ' + tahun + '.' + (doi ? ' doi:' + esc(doi.doi) + '.' : '');
      } else if (tipe.value === 'jurnal') {
        const j = fJurnal.value.trim() || '[nama jurnal]', v = fVol.value.trim();
        const hal = fHalaman.value.trim();
        apa = apaA + ' (' + tahun + '). ' + esc(judul) + '. <i>' + esc(j) + '</i>' + (v ? ', <i>' + esc(v) + '</i>' : '') + (hal ? ', ' + esc(hal) : '') + '.' + (doi ? ' ' + esc(doi.url) : '');
        mla = mlaA + '. "' + esc(judul) + '." <i>' + esc(j) + '</i>' + (v ? ', vol. ' + esc(v) : '') + ', ' + tahun + (hal ? ', pp. ' + esc(hal) : '') + '.' + (doi ? ' doi:' + esc(doi.doi) + '.' : '');
      } else {
        const url = fUrl.value.trim() || '[URL]';
        const site = siteDariUrl(url);
        apa = apaA + ' (' + tahun + '). ' + esc(judul) + '. ' + esc(url);
        mla = mlaA + '. "' + esc(judul) + '."' + (site ? ' <i>' + esc(site) + '</i>,' : '') + ' ' + tahun + ', ' + esc(url) + '.';
      }
      T.show(box,
        '<div class="dim" style="margin-bottom:4px"><b>APA 7th</b></div><div style="margin-bottom:8px">' + apa + '</div>' +
        '<div class="dim" style="margin-bottom:4px"><b>MLA 9th</b></div><div>' + mla + '</div>');
      const plain = box.innerText || '';
      if (fDoi.value.trim() && !doi) {
        box.appendChild(T.el('<p class="warn" style="margin-top:8px">DOI "' + esc(fDoi.value.trim()) + '" tidak dikenali (DOI diawali "10."), jadi tidak dimasukkan ke hasil.</p>'));
      }
      const bar = T.row(T.copyBtn(() => plain, 'Salin hasil'));
      box.appendChild(bar);
    };
    tipe.addEventListener('change', paintForm);
    root.appendChild(T.field('Jenis sumber', tipe));
    root.appendChild(formBox);
    root.appendChild(T.btn('📚 Buat sitasi', buat, true));
    root.appendChild(box);
    paintForm();
  
}
