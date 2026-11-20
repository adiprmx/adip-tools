import { h as T, utils, errBox, esc } from '../../core.js';

// JSON <-> YAML <-> TOML <-> XML.
// YAML: js-yaml (dipakai repo). TOML: smol-toml (ESM, via dynamic import).
// XML: fast-xml-parser (ESM, via dynamic import). Pustaka dimuat hanya
// saat formatnya dipakai, dan hasilnya disimpan supaya tidak muat ulang.
const YAML_CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js';
const TOML_ESM = 'https://cdn.jsdelivr.net/npm/smol-toml@1.3.1/+esm';
const XML_ESM = 'https://cdn.jsdelivr.net/npm/fast-xml-parser@4.5.7/+esm';

const libs = { yaml: null, toml: null, xml: null };
const failed = { yaml: false, toml: false, xml: false };

async function getYaml() {
  if (libs.yaml) return libs.yaml;
  if (failed.yaml) throw new Error('yaml');
  // Loader kanonis: utils.loadLibOnce (core.js) — timeout 30 dtk.
  const ok = await utils.loadLibOnce(YAML_CDN, () => !!window.jsyaml);
  if (!ok || !window.jsyaml) { failed.yaml = true; throw new Error('yaml'); }
  libs.yaml = window.jsyaml;
  return libs.yaml;
}
async function getToml() {
  if (libs.toml) return libs.toml;
  if (failed.toml) throw new Error('toml');
  try {
    libs.toml = await import(/* webpackIgnore: true */ TOML_ESM);
    return libs.toml;
  } catch (e) { failed.toml = true; throw new Error('toml'); }
}
async function getXml() {
  if (libs.xml) return libs.xml;
  if (failed.xml) throw new Error('xml');
  try {
    libs.xml = await import(/* webpackIgnore: true */ XML_ESM);
    return libs.xml;
  } catch (e) { failed.xml = true; throw new Error('xml'); }
}

function isPlainObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

async function parseInput(text, fmt) {
  if (fmt === 'json') return JSON.parse(text);
  if (fmt === 'yaml') return (await getYaml()).load(text);
  if (fmt === 'toml') return (await getToml()).parse(text);
  if (fmt === 'xml') {
    const { XMLParser } = await getXml();
    return new XMLParser({ ignoreAttributes: false, parseTagValue: true, parseAttributeValue: true, trimValues: true }).parse(text);
  }
  throw new Error('format tidak dikenal: ' + fmt);
}

async function stringifyOutput(value, fmt) {
  if (fmt === 'json') return JSON.stringify(value, null, 2);
  if (fmt === 'yaml') return (await getYaml()).dump(value, { indent: 2 });
  if (fmt === 'toml') {
    const toml = await getToml();
    // TOML hanya kenal tabel di tingkat atas; nilai lain dibungkus.
    const doc = isPlainObj(value) ? value : { value };
    return toml.stringify(doc);
  }
  if (fmt === 'xml') {
    const { XMLBuilder } = await getXml();
    // XML butuh satu elemen akar; objek multi-kunci dibungkus <root>.
    const doc = isPlainObj(value) && Object.keys(value).length === 1 ? value : { root: isPlainObj(value) ? value : { value } };
    return new XMLBuilder({ ignoreAttributes: false, format: true }).build(doc);
  }
  throw new Error('format tidak dikenal: ' + fmt);
}

const LIB_FAIL_MSG = {
  yaml: 'Pustaka YAML gagal dimuat dari internet. Cek koneksi lalu coba lagi.',
  toml: 'Pustaka TOML gagal dimuat dari internet. Cek koneksi lalu coba lagi.',
  xml: 'Pustaka XML gagal dimuat dari internet. Cek koneksi lalu coba lagi.',
};

export const meta = {"id": "ubah-format-data", "name": "Ubah Format Data", "cat": "developer", "icon": "🔄", "desc": "JSON, YAML, TOML & XML saling tukar format.", "keywords": "json,yaml,toml,xml,konversi,format,data", "since": "6.11.0"};
export function render(root) {

    const fromSel = T.select([['json', 'JSON'], ['yaml', 'YAML'], ['toml', 'TOML'], ['xml', 'XML']], 'json');
    const toSel = T.select([['yaml', 'YAML'], ['json', 'JSON'], ['toml', 'TOML'], ['xml', 'XML']], 'yaml');
    const inp = T.ta(8, 'Tempel data di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(8, 'Hasil muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const status = T.out();
    let lastResult = '';

    const swap = () => {
      const f = fromSel.value;
      fromSel.value = toSel.value;
      toSel.value = f;
      if (lastResult) { inp.value = lastResult; outp.value = ''; lastResult = ''; T.hide(status); }
    };

    const run = async () => {
      const raw = inp.value.trim();
      if (!raw) { T.show(status, errBox('Tempel dulu datanya.')); return; }
      const from = fromSel.value, to = toSel.value;
      if (from === to) { T.show(status, errBox('Format asal dan tujuan sama. Pilih format tujuan yang berbeda.')); return; }
      T.show(status, '<span class="dim">Mengubah format…</span>');
      try {
        const value = await parseInput(raw, from);
        if (value === undefined) throw new Error('Data kosong atau tidak dikenali.');
        lastResult = await stringifyOutput(value, to);
        outp.value = lastResult;
        let note = '';
        if (to === 'toml' && !isPlainObj(value)) note = ' Nilai dibungkus jadi { value: ... } karena TOML hanya kenal tabel di tingkat atas.';
        if (to === 'xml' && !(isPlainObj(value) && Object.keys(value).length === 1)) note = ' Data dibungkus <root> karena XML butuh satu elemen akar.';
        if (from === 'xml') note += ' Atribut XML dibaca dengan awalan @ (misal @id).';
        T.show(status, '<span class="ok">✓ Berhasil diubah.</span>' + (note ? ' <span class="dim">' + esc(note.trim()) + '</span>' : ''));
      } catch (e) {
        lastResult = '';
        const msg = (e && e.message) || String(e);
        if (LIB_FAIL_MSG[msg]) {
          T.show(status, errBox(LIB_FAIL_MSG[msg]));
          const retry = T.btn('🔄 Coba Lagi', () => { failed[msg] = false; run(); });
          retry.style.marginTop = '10px';
          status.appendChild(retry);
        }
        else T.show(status, errBox('Gagal mengubah: datanya tidak bisa dibaca. Periksa lagi isinya, lalu coba lagi.'));
      }
    };

    root.appendChild(T.grid2(T.field('Dari format', fromSel), T.field('Ke format', toSel)));
    root.appendChild(T.field('Input', inp));
    root.appendChild(T.row(T.btn('Ubah Format', run, true), T.btn('Tukar', swap)));
    root.appendChild(status);
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.row(T.copyBtn(() => lastResult, 'Salin Hasil')));
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Semua format didukung dua arah. Catatan: tanggal di TOML dibaca apa adanya sebagai teks/angka, dan angka di XML bisa berubah jadi teks bila ada huruf di sekitarnya. Pustaka YAML, TOML, dan XML dimuat dari internet sekali saat pertama dipakai.</div>'));
  
}
