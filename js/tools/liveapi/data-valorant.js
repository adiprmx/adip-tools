import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-valorant","name":"Data Valorant","cat":"liveapi","icon":"🎯","desc":"Info agen, senjata, dan versi terbaru game Valorant.","keywords":"valorant,agen,agent,senjata,weapon,versi,game,riot","since":"6.16.0"};

const API = 'https://valorant-api.com/v1/';

async function ambilJson(url, detik) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), (detik || 15) * 1000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

export function render(root) {
  const box = T.out();
  const selMode = T.select([['agen', 'Agen'], ['senjata', 'Senjata'], ['versi', 'Versi game']], 'agen');
  let agenCache = null;
  let senjataCache = null;

  const gagal = (e, ulang) => {
    const msg = e && e.name === 'AbortError'
      ? 'Waktu habis, server Valorant tidak merespons.'
      : 'Gagal ambil data Valorant. Cek koneksi internet, lalu coba lagi.';
    T.show(box, errBox(msg));
    const wr = T.el('<div style="margin-top:8px"></div>');
    wr.appendChild(T.btn('🔄 Coba lagi', ulang));
    box.appendChild(wr);
  };

  const tampilDetailAgen = (a) => {
    const peran = a.role ? a.role.displayName : '';
    const skill = Array.isArray(a.abilities) ? a.abilities.filter((x) => x.slot !== 'Passive') : [];
    const pasif = Array.isArray(a.abilities) ? a.abilities.find((x) => x.slot === 'Passive') : null;
    let html = '<div style="margin-bottom:10px"><button type="button" class="btn" id="kembali-agen">← Kembali ke daftar agen</button></div>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
      (a.fullPortrait ? '<img src="' + esc(a.fullPortrait) + '" alt="" loading="lazy" style="width:130px;border-radius:8px;background:#221d19;flex:none">' : '') +
      '<div style="flex:1;min-width:200px"><div style="font-weight:800;font-size:20px">' + esc(a.displayName || '-') + '</div>' +
      (peran ? '<div class="dim">Peran: ' + esc(peran) + '</div>' : '') +
      '<p style="font-size:14px;line-height:1.65;margin:8px 0">' + esc(a.description || '') + '</p></div></div>';
    if (pasif) html += '<div class="kv"><span class="k">Kemampuan pasif</span><span class="v"><b>' + esc(pasif.displayName || '') + '</b><br><span class="dim">' + esc(pasif.description || '') + '</span></span></div>';
    skill.forEach((s) => {
      html += '<div class="kv"><span class="k">' + esc(s.slot || 'Skill') + '</span><span class="v"><b>' + esc(s.displayName || '') + '</b><br><span class="dim">' + esc(s.description || '') + '</span></span></div>';
    });
    html += '<p class="hint">Sumber: valorant-api.com (data tidak resmi, dari Riot Games).</p>';
    T.show(box, html);
    box.querySelector('#kembali-agen').addEventListener('click', muatAgen);
  };

  const muatAgen = async () => {
    if (!agenCache) {
      T.show(box, '<p class="mut">Mengambil daftar agen…</p>');
      try {
        const j = await ambilJson(API + 'agents?isPlayableCharacter=true', 20);
        if (!j || !Array.isArray(j.data) || !j.data.length) throw new Error('bad-data');
        agenCache = j.data;
      } catch (e) { gagal(e, muatAgen); return; }
    }
    let html = '<p class="hint">' + agenCache.length + ' agen. Ketuk nama untuk melihat skill-nya.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    agenCache.forEach((a) => {
      html += '<button type="button" class="btn" data-agen="' + esc(a.uuid) + '">' + esc(a.displayName) + '</button>';
    });
    html += '</div>';
    T.show(box, html);
    box.querySelectorAll('[data-agen]').forEach((b) => {
      b.addEventListener('click', () => {
        const a = agenCache.find((x) => x.uuid === b.getAttribute('data-agen'));
        if (a) tampilDetailAgen(a);
      });
    });
  };

  const muatSenjata = async () => {
    if (!senjataCache) {
      T.show(box, '<p class="mut">Mengambil daftar senjata…</p>');
      try {
        const j = await ambilJson(API + 'weapons', 20);
        if (!j || !Array.isArray(j.data) || !j.data.length) throw new Error('bad-data');
        senjataCache = j.data;
      } catch (e) { gagal(e, muatSenjata); return; }
    }
    let html = '<p class="hint">' + senjataCache.length + ' senjata dan pisau.</p>';
    senjataCache.forEach((w) => {
      const st = w.weaponStats || {};
      const harga = w.shopData && w.shopData.cost != null ? w.shopData.cost + ' kredit' : 'Gratis';
      const kat = String(w.category || '').split('::').pop();
      html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">' +
        (w.displayIcon ? '<img src="' + esc(w.displayIcon) + '" alt="" loading="lazy" style="width:90px;object-fit:contain;flex:none">' : '') +
        '<div style="flex:1;min-width:0"><div style="font-weight:700">' + esc(w.displayName || '-') + '</div>' +
        '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc(kat) + ' · ' + esc(harga) +
        (st.magazineSize != null ? ' · ' + esc(String(st.magazineSize)) + ' peluru' : '') +
        (st.fireRate != null ? ' · ' + esc(String(st.fireRate)) + ' tembakan/detik' : '') + '</div></div></div>';
    });
    html += '<p class="hint">Sumber: valorant-api.com (data tidak resmi, dari Riot Games).</p>';
    T.show(box, html);
  };

  const muatVersi = async () => {
    T.show(box, '<p class="mut">Mengambil info versi game…</p>');
    try {
      const j = await ambilJson(API + 'version', 15);
      const d = j && j.data;
      if (!d || !d.version) throw new Error('bad-data');
      const tgl = d.buildDate ? new Date(d.buildDate) : null;
      T.show(box,
        '<div class="center"><div class="dim">Versi Valorant saat ini</div>' +
        '<div class="big" style="margin:6px 0">' + esc(d.version) + '</div>' +
        '<div class="dim">' + esc(d.branch || '') + '</div></div>' +
        '<div class="kv"><span class="k">Nomor build</span><span class="v">' + esc(d.buildVersion || '-') + '</span></div>' +
        '<div class="kv"><span class="k">Tanggal build</span><span class="v">' + esc(tgl && !isNaN(tgl) ? tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-') + '</span></div>' +
        '<div class="kv"><span class="k">Versi Riot Client</span><span class="v">' + esc(d.riotClientVersion || '-') + '</span></div>' +
        '<p class="hint">Sumber: valorant-api.com</p>');
    } catch (e) { gagal(e, muatVersi); }
  };

  const muat = () => {
    if (selMode.value === 'senjata') muatSenjata();
    else if (selMode.value === 'versi') muatVersi();
    else muatAgen();
  };

  selMode.addEventListener('change', muat);
  root.appendChild(T.field('Lihat', selMode));
  root.appendChild(box);
  muat();
}
