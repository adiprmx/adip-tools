import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"kuis-maker","name":"Kuis Maker","cat":"pelajar","icon":"📝","desc":"Bikin kuis pilihan ganda, simpan, lalu kerjakan dengan nilai otomatis.","keywords":"kuis,soal,pilihan ganda,ujian,latihan,tes,nilai"};

const KEY = 'adip-tools:kuis-maker';
const ABJAD = ['A', 'B', 'C', 'D'];
const uid = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function loadAll() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function saveAll(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function render(root) {
  let quizzes = loadAll();
  let current = quizzes[0] || null;

  const editorBox = T.el('<div></div>');
  const playBox = T.el('<div></div>');
  const outBox = T.out();

  root.appendChild(T.el('<p class="mut">Bikin bank soal pilihan ganda, tersimpan otomatis di HP ini, lalu kerjakan dan dapat nilainya langsung.</p>'));

  // ---------- pemilih kuis ----------
  const sel = T.select([], '');
  const judulInp = T.input('text', 'Judul kuis baru…', '');
  const refreshSel = () => {
    sel.innerHTML = '';
    quizzes.forEach((q) => {
      const o = document.createElement('option');
      o.value = q.id; o.textContent = q.judul + ' (' + q.soal.length + ' soal)';
      sel.appendChild(o);
    });
    const o = document.createElement('option');
    o.value = '__baru'; o.textContent = '＋ Kuis baru…';
    sel.appendChild(o);
    sel.value = current ? current.id : '__baru';
  };
  const pilih = () => {
    if (sel.value === '__baru') {
      const j = judulInp.value.trim();
      if (!j) { T.show(outBox, '<span class="err">Kasih judul dulu buat kuis barunya.</span>'); return; }
      current = { id: uid(), judul: j, soal: [] };
      quizzes.push(current); saveAll(quizzes);
      judulInp.value = '';
    } else {
      current = quizzes.find((q) => q.id === sel.value) || null;
    }
    refreshSel(); drawEditor(); T.hide(outBox);
  };
  root.appendChild(T.grid2(T.field('Kuis tersimpan', sel), T.field('Judul kuis baru', judulInp)));
  root.appendChild(T.row(T.btn('📂 Pilih / Buat kuis', pilih, true)));
  root.appendChild(T.el('<div style="height:10px"></div>'));

  // ---------- editor ----------
  function drawEditor() {
    editorBox.innerHTML = '';
    if (!current) {
      editorBox.appendChild(T.el('<p class="center mut">Belum ada kuis. Pilih / buat kuis di atas dulu. 📝</p>'));
      return;
    }
    editorBox.appendChild(T.el('<h3 style="margin:6px 0">' + T.esc(current.judul) + '</h3>'));

    const soalTa = T.ta(3, 'Tulis pertanyaan…', '');
    const opsiInp = ABJAD.map((a) => T.input('text', 'Opsi ' + a, ''));
    const kunciSel = T.select(ABJAD.map((a, i) => [String(i), 'Jawaban: ' + a]), '0');
    const tambah = () => {
      const q = soalTa.value.trim();
      const opsi = opsiInp.map((i) => i.value.trim());
      if (!q || opsi.some((o) => !o)) { T.show(outBox, '<span class="err">Lengkapi pertanyaan dan keempat opsi dulu.</span>'); return; }
      current.soal.push({ q, opsi, kunci: Number(kunciSel.value) });
      saveAll(quizzes);
      soalTa.value = ''; opsiInp.forEach((i) => { i.value = ''; });
      drawEditor(); T.hide(outBox);
      T.toast('Soal #' + current.soal.length + ' ditambahkan');
    };
    editorBox.appendChild(T.field('Pertanyaan', soalTa));
    const grid = T.el('<div class="grid2"></div>');
    ABJAD.forEach((a, i) => grid.appendChild(T.field('Opsi ' + a, opsiInp[i])));
    editorBox.appendChild(grid);
    editorBox.appendChild(T.grid2(T.field('Kunci jawaban', kunciSel), T.el('<div></div>')));
    editorBox.appendChild(T.row(T.btn('＋ Tambah soal', tambah, true)));

    // daftar soal
    editorBox.appendChild(T.el('<h4 style="margin:16px 0 8px">Daftar soal (' + current.soal.length + ')</h4>'));
    const listEl = T.el('<div></div>');
    if (!current.soal.length) listEl.appendChild(T.el('<p class="mut">Belum ada soal. Tambah lewat form di atas. ✍️</p>'));
    current.soal.forEach((s, i) => {
      const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
      card.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">' + (i + 1) + '. ' + T.esc(s.q) + '</div>'));
      s.opsi.forEach((o, j) => {
        const baris = T.el('<div style="padding:4px 0;font-size:14px"></div>');
        baris.appendChild(T.el('<span class="' + (j === s.kunci ? 'ok' : 'dim') + '" style="font-weight:600">' + ABJAD[j] + (j === s.kunci ? ' ✓' : '') + '.</span> ' + T.esc(o)));
        card.appendChild(baris);
      });
      const delRow = T.el('<div style="text-align:right;margin-top:6px"></div>');
      delRow.appendChild(T.btn('✕ Hapus soal', () => {
        current.soal.splice(i, 1); saveAll(quizzes); refreshSel(); drawEditor();
      }));
      card.appendChild(delRow);
      listEl.appendChild(card);
    });
    editorBox.appendChild(listEl);

    const kerjakan = () => {
      if (!current.soal.length) { T.show(outBox, '<span class="err">Kuis ini belum punya soal.</span>'); return; }
      T.hide(outBox); drawPlay();
    };
    const hapusKuis = () => {
      if (!confirm('Hapus kuis "' + current.judul + '" beserta semua soalnya?')) return;
      quizzes = quizzes.filter((q) => q.id !== current.id);
      saveAll(quizzes);
      current = quizzes[0] || null;
      refreshSel(); drawEditor(); T.toast('Kuis dihapus');
    };
    editorBox.appendChild(T.el('<div style="height:10px"></div>'));
    editorBox.appendChild(T.row(T.btn('▶ Kerjakan kuis ini', kerjakan, true), T.btn('🗑 Hapus kuis', hapusKuis)));
  }

  // ---------- mode kerjakan ----------
  function drawPlay() {
    playBox.innerHTML = '';
    playBox.appendChild(T.el('<h3 style="margin:6px 0">' + T.esc(current.judul) + '</h3>'));
    playBox.appendChild(T.el('<p class="mut">Pilih satu jawaban untuk tiap soal, lalu kumpulkan.</p>'));
    const order = acak(current.soal.map((_, i) => i));
    order.forEach((si, n) => {
      const s = current.soal[si];
      const card = T.el('<div class="card" style="margin-bottom:10px" data-q="' + si + '"></div>');
      card.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">' + (n + 1) + '. ' + T.esc(s.q) + '</div>'));
      s.opsi.forEach((o, j) => {
        const lab = T.el('<label style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;cursor:pointer;font-size:14.5px"></label>');
        const r = document.createElement('input');
        r.type = 'radio'; r.name = 'km_q' + si; r.value = String(j);
        lab.appendChild(r);
        lab.appendChild(T.el('<span><b>' + ABJAD[j] + '.</b> ' + T.esc(o) + '</span>'));
        card.appendChild(lab);
      });
      playBox.appendChild(card);
    });
    const hasilBox = T.out();
    const kumpul = () => {
      let benar = 0;
      const review = T.el('<div></div>');
      order.forEach((si, n) => {
        const s = current.soal[si];
        const picked = playBox.querySelector('input[name="km_q' + si + '"]:checked');
        const jwb = picked ? Number(picked.value) : -1;
        const ok = jwb === s.kunci;
        if (ok) benar++;
        const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
        card.appendChild(T.el('<div style="font-weight:600;margin-bottom:8px">' + (n + 1) + '. ' + T.esc(s.q) + ' <span class="' + (ok ? 'ok' : 'err') + '">' + (ok ? '✓ benar' : '✕ salah') + '</span></div>'));
        s.opsi.forEach((o, j) => {
          const cls = j === s.kunci ? 'ok' : (j === jwb ? 'err' : 'dim');
          const mark = j === s.kunci ? ' ✓' : (j === jwb ? ' ← pilihanmu' : '');
          card.appendChild(T.el('<div class="' + cls + '" style="padding:3px 0;font-size:14px"><b>' + ABJAD[j] + '.</b> ' + T.esc(o) + mark + '</div>'));
        });
        review.appendChild(card);
      });
      const total = order.length;
      const persen = Math.round((benar / total) * 100);
      const predikat = persen >= 90 ? 'Sempurna! 🏆' : persen >= 75 ? 'Bagus! 👍' : persen >= 60 ? 'Cukup 🙂' : 'Belajar lagi 💪';
      const hasil = T.el('<div class="card" style="margin:14px 0;text-align:center"></div>');
      hasil.innerHTML =
        '<div class="dim">Skor akhir</div>' +
        '<div class="big ' + (persen >= 60 ? 'ok' : 'err') + '">' + persen + '</div>' +
        '<div>' + benar + ' dari ' + total + ' benar · ' + predikat + '</div>';
      hasilBox.innerHTML = '';
      hasilBox.appendChild(hasil);
      hasilBox.appendChild(T.el('<h4 style="margin:14px 0 8px">Pembahasan</h4>'));
      hasilBox.appendChild(review);
      T.show(hasilBox, hasilBox.innerHTML);
      T.scrollToPreview(hasilBox);
    };
    const kembali = () => { playBox.innerHTML = ''; };
    playBox.appendChild(T.el('<div style="height:6px"></div>'));
    playBox.appendChild(T.row(T.btn('📤 Kumpulkan jawaban', kumpul, true), T.btn('← Kembali ke editor', kembali)));
    playBox.appendChild(hasilBox);
    T.scrollToPreview(playBox);
  }

  root.appendChild(editorBox);
  root.appendChild(playBox);
  root.appendChild(outBox);
  refreshSel();
  drawEditor();
}
