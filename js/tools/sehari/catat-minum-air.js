import { h as T, kv, todayISO } from '../../core.js?v=6.5.0';

export const meta = {"id": "catat-minum-air", "name": "Catat Minum Air", "cat": "sehari", "icon": "💧", "desc": "Pantau air minum harianmu, jangan sampai kurang.", "keywords": "air minum,hidrasi,catat minum,tracker air,kesehatan"};

export function render(root) {

    const K = 'adip.water.v1';
    const load = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
    const save = (s) => { try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {} };

    const hariIni = todayISO();
    let st = load();
    if (!st || st.tanggal !== hariIni) st = { tanggal: hariIni, target: (st && st.target) || 2000, log: [] };

    const targetI = T.input('number', '2000', String(st.target));
    targetI.style.width = '130px';

    const barWrap = T.el('<div style="height:22px;border-radius:11px;background:#1c1a16;border:1px solid #ffffff14;overflow:hidden;margin:10px 0 6px"></div>');
    const barFill = T.el('<div style="height:100%;width:0%;border-radius:11px;background:linear-gradient(90deg,#38bdf8,#818cf8);transition:width .5s ease"></div>');
    barWrap.appendChild(barFill);
    const bigBox = T.out();
    const logBox = T.out();

    const total = () => st.log.reduce((a, b) => a + b.ml, 0);
    const jamID = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const paint = () => {
      const t = Math.max(1, st.target), cur = total();
      const pct = Math.min(100, Math.round(cur / t * 100));
      barFill.style.width = pct + '%';
      T.show(bigBox,
        '<div class="big center">' + cur.toLocaleString('id-ID') + ' <span class="mut" style="font-size:15px">/ ' + t.toLocaleString('id-ID') + ' ml</span></div>' +
        '<p class="center">' + (cur >= t ? '🎉 Target tercapai, mantap! Besok ulangi lagi ya.' : 'kurang ' + (t - cur).toLocaleString('id-ID') + ' ml lagi — ' + pct + '% jalan') + '</p>');
      if (st.log.length) {
        T.show(logBox, '<p class="hint" style="margin-bottom:6px">Riwayat hari ini</p>' + st.log.map((x, i) =>
          '<div class="kv"><span class="k">' + jamID(x.ts) + '</span><span class="v">+' + x.ml + ' ml <button type="button" class="btn" data-i="' + i + '" style="padding:2px 10px;font-size:12px">hapus</button></span></div>'
        ).join(''));
        logBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
          st.log.splice(+b.dataset.i, 1); save(st); paint();
        }));
      } else {
        T.show(logBox, '<p class="center mut">Belum ada catatan hari ini — mulai minum dulu gih.</p>');
      }
      save(st);
    };

    const add = (ml) => {
      st.log.push({ ml, ts: Date.now() });
      if (cur() >= st.target && cur() - ml < st.target) T.beep(880, 0.25, 'sine');
      paint();
    };
    const cur = () => total();

    targetI.addEventListener('change', () => {
      const v = parseInt(targetI.value, 10);
      if (v > 0 && v <= 10000) { st.target = v; paint(); T.toast('Target diubah jadi ' + v + ' ml'); }
      else { targetI.value = st.target; T.toast('Target 1–10000 ml aja ya'); }
    });

    const add250 = T.btn('+250 ml', () => add(250), true);
    const add500 = T.btn('+500 ml', () => add(500));
    root.appendChild(T.el('<p class="note">Minum air sering kelupaan — <b>catat setiap teguk</b> biar ketahuan udah cukup atau belum.</p>'));
    root.appendChild(T.row(T.el('<span style="align-self:center" class="mut">Target hari ini (ml)</span>'), targetI));
    root.appendChild(barWrap);
    root.appendChild(bigBox);
    root.appendChild(T.row(add250, add500));
    root.appendChild(T.row(T.btn('Reset hari ini', () => { st.log = []; paint(); T.toast('Catatan hari ini dihapus'); })));
    root.appendChild(logBox);
    paint();
}
