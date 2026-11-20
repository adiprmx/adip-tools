#!/usr/bin/env node
/* Validasi vercel.json terhadap skema resmi Vercel yang di-vendor di repo.
   Dibuat pasca-insiden v6.20.0: Vercel menolak deploy karena vercel.json
   berisi kunci "$comment" yang tidak ada di skema — semua gerbang lokal
   lolos karena tidak ada yang memvalidasi skema.
   - OFFLINE & DETERMINISTIK: hanya baca file lokal (vercel.json +
     scripts/vercel-schema.json), tanpa fetch jaringan.
   - Skema di-vendor byte-identik dari sumber resmi; integritasnya dicek
     via sha256 setiap jalan (bila berubah = re-pin manual).
   Jalankan: node scripts/check-vercel-schema.js [path-ke-vercel.json]
   Default target: <repo>/vercel.json. Exit 0 = lolos, 1 = gagal.
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_URL = 'https://openapi.vercel.sh/vercel.json';
const SCHEMA_FETCHED = '2026-11-20';
const SCHEMA_SHA256 = '538ba2f0288be4c9392b23ae38a251bbd5711447125dfa9ffbc848d6ef0bd92d';

const SCHEMA_PATH = path.join(__dirname, 'vercel-schema.json');
const DEFAULT_TARGET = path.join(__dirname, '..', 'vercel.json');

const errors = [];
const warnings = [];

function fail(p, msg) {
  errors.push(`${p}: ${msg}`);
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // string | number | boolean | object | undefined
}

function typeMatches(v, t) {
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v);
  if (t === 'number') return typeof v === 'number';
  return typeOf(v) === t;
}

// Validator subset JSON Schema (draft-04, sesuai skema Vercel):
// type, properties, required, additionalProperties, patternProperties,
// items, enum, const, min/maxLength, min/maxItems, min/maximum,
// exclusiveMinimum/Maximum (bentuk angka & boolean), oneOf, anyOf,
// allOf, min/maxProperties, pattern. Keyword lain (description, example,
// deprecated, private, format, dsb.) diabaikan.
function validate(value, schema, p) {
  if (schema === true) return;
  if (schema === false) {
    fail(p, 'nilai tidak diizinkan di sini');
    return;
  }
  if (typeof schema !== 'object' || schema === null) return;

  if (schema.const !== undefined && value !== schema.const) {
    fail(p, `nilai harus ${JSON.stringify(schema.const)}`);
    return;
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    fail(p, `nilai harus salah satu dari: ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`);
    return;
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) {
      fail(p, `tipe harus ${types.join(' atau ')}, didapat ${typeOf(value)}`);
      return;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      fail(p, `panjang minimal ${schema.minLength} karakter`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      fail(p, `panjang maksimal ${schema.maxLength} karakter (didapat ${value.length})`);
    }
    if (typeof schema.pattern === 'string') {
      let re;
      try { re = new RegExp(schema.pattern); } catch { re = null; }
      if (re && !re.test(value)) fail(p, `tidak cocok dengan pola ${schema.pattern}`);
    }
  }

  if (typeof value === 'number') {
    let min = schema.minimum;
    let max = schema.maximum;
    let minExclusive = false;
    let maxExclusive = false;
    if (typeof schema.exclusiveMinimum === 'number') { min = schema.exclusiveMinimum; minExclusive = true; }
    else if (schema.exclusiveMinimum === true) minExclusive = true;
    if (typeof schema.exclusiveMaximum === 'number') { max = schema.exclusiveMaximum; maxExclusive = true; }
    else if (schema.exclusiveMaximum === true) maxExclusive = true;
    if (min !== undefined && (minExclusive ? value <= min : value < min)) {
      fail(p, `nilai harus ${minExclusive ? '>' : '>='} ${min}`);
    }
    if (max !== undefined && (maxExclusive ? value >= max : value > max)) {
      fail(p, `nilai harus ${maxExclusive ? '<' : '<='} ${max}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      fail(p, `minimal ${schema.minItems} entri`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      fail(p, `maksimal ${schema.maxItems} entri (didapat ${value.length})`);
    }
    if (schema.items) {
      if (Array.isArray(schema.items)) {
        schema.items.forEach((sub, i) => {
          if (i < value.length) validate(value[i], sub, `${p}[${i}]`);
        });
      } else {
        value.forEach((item, i) => validate(item, schema.items, `${p}[${i}]`));
      }
    }
  }

  if (typeOf(value) === 'object') {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      fail(p, `minimal ${schema.minProperties} properti`);
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      fail(p, `maksimal ${schema.maxProperties} properti (didapat ${keys.length})`);
    }
    if (Array.isArray(schema.required)) {
      for (const req of schema.required) {
        if (!(req in value)) fail(p, `properti wajib "${req}" tidak ada`);
      }
    }
    const props = schema.properties || {};
    const patterns = schema.patternProperties || {};
    for (const key of keys) {
      const childPath = `${p}.${key}`;
      if (key in props) {
        validate(value[key], props[key], childPath);
      } else {
        let matched = false;
        for (const pat of Object.keys(patterns)) {
          let re;
          try { re = new RegExp(pat); } catch { continue; }
          if (re.test(key)) { matched = true; validate(value[key], patterns[pat], childPath); }
        }
        if (!matched) {
          if (schema.additionalProperties === false) {
            fail(
              childPath,
              `kunci "${key}" TIDAK DIKENAL — tidak ada di skema resmi Vercel ` +
              `(${SCHEMA_URL}, di-vendor ${SCHEMA_FETCHED}); ` +
              `vercel.json tidak mengizinkan kunci tambahan (additionalProperties: false). ` +
              `Vercel akan MENOLAK deploy dengan kunci ini.`
            );
          } else if (typeof schema.additionalProperties === 'object') {
            validate(value[key], schema.additionalProperties, childPath);
          }
        }
      }
    }
  }

  // Kombinator: coba tiap varian di "sandbox" error terpisah.
  if (Array.isArray(schema.oneOf)) {
    let ok = 0;
    let lastErrs = [];
    for (const sub of schema.oneOf) {
      const before = errors.length;
      validate(value, sub, p);
      if (errors.length === before) ok++;
      else lastErrs = errors.splice(before);
    }
    if (ok !== 1) {
      fail(p, `harus cocok dengan tepat SATU dari ${schema.oneOf.length} varian yang diizinkan (cocok: ${ok})` +
        (lastErrs.length ? ` — contoh masalah: ${lastErrs[0]}` : ''));
    }
  }
  if (Array.isArray(schema.anyOf)) {
    let ok = false;
    let lastErrs = [];
    for (const sub of schema.anyOf) {
      const before = errors.length;
      validate(value, sub, p);
      if (errors.length === before) { ok = true; break; }
      lastErrs = errors.splice(before);
    }
    if (!ok) {
      fail(p, `tidak cocok dengan satu pun dari ${schema.anyOf.length} varian yang diizinkan` +
        (lastErrs.length ? ` — contoh masalah: ${lastErrs[0]}` : ''));
    }
  }
  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) validate(value, sub, p);
  }
}

function main() {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TARGET;

  // 1. Skema vendor: integritas pin (sha256) + parse.
  let schemaRaw;
  try {
    schemaRaw = fs.readFileSync(SCHEMA_PATH);
  } catch (e) {
    console.error(`GAGAL: tidak bisa membaca skema vendor ${SCHEMA_PATH}: ${e.message}`);
    process.exit(1);
  }
  const actualHash = crypto.createHash('sha256').update(schemaRaw).digest('hex');
  if (actualHash !== SCHEMA_SHA256) {
    console.error('GAGAL: skema vendor scripts/vercel-schema.json BERUBAH (sha256 tidak cocok dengan pin).');
    console.error(`  pin     : ${SCHEMA_SHA256}`);
    console.error(`  aktual  : ${actualHash}`);
    console.error('  Re-pin manual dari ' + SCHEMA_URL + ' dan perbarui SCHEMA_SHA256 + SCHEMA_FETCHED di scripts/check-vercel-schema.js.');
    process.exit(1);
  }
  let schema;
  try {
    schema = JSON.parse(schemaRaw.toString('utf8'));
  } catch (e) {
    console.error(`GAGAL: skema vendor bukan JSON valid: ${e.message}`);
    process.exit(1);
  }

  // 2. Target: baca + parse (pesan jelas bila malformed).
  let raw;
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (e) {
    console.error(`GAGAL: tidak bisa membaca ${target}: ${e.message}`);
    process.exit(1);
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    console.error(`GAGAL: ${target} bukan JSON valid — ${e.message}`);
    console.error('  Perbaiki sintaks JSON-nya (koma/ kurung kurawal yang hilang/berlebih) lalu jalankan lagi.');
    process.exit(1);
  }
  if (typeOf(config) !== 'object') {
    console.error(`GAGAL: ${target} harus berisi objek JSON di top-level, didapat ${typeOf(config)}.`);
    process.exit(1);
  }

  // 3. Validasi terhadap skema.
  validate(config, schema, '$');

  // 4. Peringatan non-fatal: $schema menunjuk ke URL lain dari pin.
  if (typeof config.$schema === 'string' && config.$schema !== SCHEMA_URL) {
    warnings.push(`$.$schema menunjuk ke ${config.$schema}, bukan ${SCHEMA_URL} (pin vendor) — validasi tetap memakai pin lokal.`);
  }

  for (const w of warnings) console.log(`PERINGATAN: ${w}`);

  if (errors.length) {
    console.error(`GAGAL: ${target} TIDAK VALID menurut skema Vercel (${errors.length} masalah):`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(`  Skema: ${SCHEMA_URL} (di-vendor ${SCHEMA_FETCHED}, sha256 ${SCHEMA_SHA256.slice(0, 12)}…)`);
    process.exit(1);
  }

  const topKeys = Object.keys(config).length;
  const headerCount = Array.isArray(config.headers) ? config.headers.length : 0;
  const headerEntries = Array.isArray(config.headers)
    ? config.headers.reduce((n, h) => n + (Array.isArray(h.headers) ? h.headers.length : 0), 0)
    : 0;
  console.log(`OK: ${target} valid menurut skema Vercel (${topKeys} kunci top-level` +
    (headerCount ? `, ${headerCount} aturan headers, ${headerEntries} entri header` : '') +
    `; skema di-vendor ${SCHEMA_FETCHED}).`);
}

main();
