import { h as T, utils, beep, actx, onLeave, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "cheatsheet-git", "name": "Cheatsheet Git", "cat": "developer", "icon": "📝", "desc": "Perintah git penting, dikelompokkan + bisa dicari.", "keywords": "git,cheatsheet,perintah,commit,branch,remote"};

export const GROUPS = [
  { g: '🚀 Mulai', items: [
    ['git init', 'Bikin repo git baru di folder ini'],
    ['git clone <url>', 'Salin repo dari remote ke komputermu'],
    ['git status', 'Lihat status file: berubah, staged, atau belum dilacak'],
    ['git log --oneline', 'Lihat riwayat commit versi ringkas'],
  ]},
  { g: '💾 Commit', items: [
    ['git add <file>', 'Masukkan file ke staging area (siap di-commit)'],
    ['git add .', 'Masukkan SEMUA perubahan ke staging'],
    ['git commit -m "pesan"', 'Simpan snapshot perubahan dengan pesan'],
    ['git commit --amend', 'Perbaiki commit terakhir (pesan atau isi)'],
  ]},
  { g: '🌿 Branch', items: [
    ['git branch', 'Lihat daftar branch lokal'],
    ['git checkout -b <nama>', 'Bikin branch baru sekaligus pindah ke sana'],
    ['git switch <nama>', 'Pindah ke branch lain'],
    ['git merge <branch>', 'Gabungkan branch lain ke branch aktif'],
    ['git branch -d <nama>', 'Hapus branch lokal yang sudah di-merge'],
  ]},
  { g: '☁️ Remote', items: [
    ['git remote -v', 'Lihat daftar remote (origin dll)'],
    ['git push origin <branch>', 'Kirim commit ke remote'],
    ['git pull', 'Tarik + gabungkan perubahan terbaru dari remote'],
    ['git fetch', 'Tarik info terbaru tanpa menggabungkan'],
  ]},
  { g: '↩️ Undo / Batalkan', items: [
    ['git restore <file>', 'Buang perubahan di file (kembalikan ke commit terakhir)'],
    ['git restore --staged <file>', 'Keluarkan file dari staging, perubahannya tetap'],
    ['git reset --soft HEAD~1', 'Batalkan commit terakhir, perubahan tetap di staging'],
    ['git revert <hash>', 'Buat commit baru yang membatalkan commit lama (aman buat repo bersama)'],
    ['git stash', 'Simpan sementara perubahan yang belum di-commit'],
    ['git stash pop', 'Kembalikan perubahan yang di-stash tadi'],
  ]},
];

export function render(root) {
  const cari = T.input('text', '🔍 Cari perintah, mis. "branch" atau "undo"...', '');
  const box = T.out();

  function gambar() {
    const q = cari.value.trim().toLowerCase();
    let html = '';
    GROUPS.forEach(({ g, items }) => {
      const cocok = items.filter(([cmd, desc]) => !q || cmd.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || g.toLowerCase().includes(q));
      if (!cocok.length) return;
      html += '<div style="margin:14px 0 8px"><b style="font-size:14px">' + T.esc(g) + '</b></div>';
      cocok.forEach(([cmd, desc], i) => {
        const id = 'c' + Math.abs(hashStr(g + cmd + i));
        html += '<div style="display:flex;gap:10px;align-items:flex-start;border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
          '<div style="flex:1;min-width:0"><code style="font-size:13px;color:#fff;word-break:break-all">' + T.esc(cmd) + '</code>' +
          '<div class="dim" style="font-size:12px;margin-top:3px">' + T.esc(desc) + '</div></div>' +
          '<button type="button" class="btn small" data-cmd="' + id + '">Salin</button></div>';
      });
    });
    T.show(box, html || errBox('Tidak ada perintah yang cocok dengan pencarianmu.'));
    box.querySelectorAll('[data-cmd]').forEach((b) => {
      b.addEventListener('click', () => {
        const baris = b.closest('div').querySelector('code');
        T.copy(baris ? baris.textContent : '');
      });
    });
  }

  function hashStr(s) {
    let x = 0;
    for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
    return x;
  }

  cari.addEventListener('input', gambar);
  root.append(
    T.el('<p class="dim" style="font-size:13px">Perintah git yang paling sering dipakai sehari-hari. Ketuk "Salin" buat langsung tempel di terminal.</p>'),
    cari, box
  );
  gambar();
}
