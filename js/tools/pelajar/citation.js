import { h as T, utils, esc } from '../../core.js?v=6.1.1';

export const meta = {"id": "citation", "name": "Citation Generator", "cat": "pelajar", "icon": "📚", "desc": "Daftar pustaka APA & MLA.", "keywords": "citation,sitasi,skripsi,daftar,pustaka"};
export function render(root) {

    const tipe = T.select([['buku', '📕 Buku'], ['jurnal', '📰 Jurnal'], ['web', '🌐 Website']], 'buku');
    const fPenulis = T.ta(2, 'Nama penulis, pisahkan dengan titik koma bila lebih dari satu\ncth: Budi Santoso; Andi Wijaya');
    const fTahun = T.input('number', 'Tahun terbit', String(new Date().getFullYear()));
    const fJudul = T.ta(2, 'Judul');
    const fPenerbit = T.input('text', 'Penerbit');
    const fJurnal = T.input('text', 'Nama jurnal');
    const fVol = T.input('text', 'Volume (cth: 12)');
    const fUrl = T.input('text', 'URL lengkap (https://…)');
    const box = T.out();
    const formBox = T.el('<div></div>');
    const splitAuthors = (raw) => String(raw || '').split(/[;]+/).map((s) => s.trim()).filter(Boolean);
    const inisial = (nama) => {
      const p = nama.split(/\s+/);
      const fam = p[p.length - 1];
      const ini = p.slice(0, -1).map((x) => x.charAt(0).toUpperCase() + '.').join(' ');
      return { fam, ini, depan: p.slice(0, -1).join(' ') };
    };
    const apaAuthors = (raw) => {
      const list = splitAuthors(raw).map((a) => { const x = inisial(a); return x.fam + ', ' + x.ini; });
      if (!list.length) return '';
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + ', & ' + list[1];
      return list.slice(0, -1).join(', ') + ', & ' + list[list.length - 1];
    };
    const mlaAuthors = (raw) => {
      const list = splitAuthors(raw).map((a, i) => {
        const x = inisial(a);
        return i === 0 ? x.fam + ', ' + x.depan : a;
      });
      if (!list.length) return '';
      if (list.length === 1) return list[0];
      if (list.length === 2) return list[0] + ', and ' + list[1];
      return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
    };
    const siteDariUrl = (url) => {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    };
    const paintForm = () => {
      formBox.innerHTML = '';
      formBox.appendChild(T.field('Penulis', fPenulis, 'Pisahkan beberapa penulis dengan titik koma (;)'));
      formBox.appendChild(T.grid2(T.field('Tahun', fTahun), T.field('Judul', fJudul)));
      if (tipe.value === 'buku') formBox.appendChild(T.field('Penerbit', fPenerbit));
      if (tipe.value === 'jurnal') formBox.appendChild(T.grid2(T.field('Nama jurnal', fJurnal), T.field('Volume', fVol)));
      if (tipe.value === 'web') formBox.appendChild(T.field('URL', fUrl, 'Sertakan https://'));
    };
    const buat = () => {
      const penulis = fPenulis.value.trim(), tahun = (fTahun.value || 't.t.').trim(), judul = fJudul.value.trim();
      if (!penulis || !judul) { T.show(box, '<span class="err">Isi minimal nama penulis dan judul.</span>'); return; }
      const apaA = apaAuthors(penulis), mlaA = mlaAuthors(penulis);
      let apa = '', mla = '';
      if (tipe.value === 'buku') {
        const pb = fPenerbit.value.trim() || '[penerbit]';
        apa = apaA + ' (' + tahun + '). <i>' + esc(judul) + '</i>. ' + esc(pb) + '.';
        mla = mlaA + '. <i>' + esc(judul) + '</i>. ' + esc(pb) + ', ' + tahun + '.';
      } else if (tipe.value === 'jurnal') {
        const j = fJurnal.value.trim() || '[nama jurnal]', v = fVol.value.trim();
        apa = apaA + ' (' + tahun + '). ' + esc(judul) + '. <i>' + esc(j) + '</i>' + (v ? ', <i>' + esc(v) + '</i>' : '') + '.';
        mla = mlaA + '. "' + esc(judul) + '." <i>' + esc(j) + '</i>' + (v ? ', vol. ' + esc(v) : '') + ', ' + tahun + '.';
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
