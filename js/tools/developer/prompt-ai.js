import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "prompt-ai", "name": "Generator Prompt AI", "cat": "developer", "icon": "🤖", "desc": "Susun prompt AI yang rapi dari template.", "keywords": "prompt,ai,chatgpt,template,generator", "file": "tools/developer/prompt-ai.js"};
export function render(root) {
  const peran = T.input('text', 'cth: ahli marketing digital', '');
  const tugas = T.ta(3, 'cth: buatkan 10 ide konten TikTok untuk jualan kopi susu…');
  const konteks = T.ta(3, 'cth: target anak muda 18-25 tahun, budget minim, baru buka 1 bulan…');
  const format = T.select([['paragraf', 'Paragraf'], ['poin', 'Poin-poin'], ['tabel', 'Tabel'], ['kode', 'Kode'], ['langkah', 'Langkah-langkah']], 'poin');
  const tone = T.select([['formal', 'Formal'], ['santai', 'Santai'], ['tegas', 'Tegas'], ['lucu', 'Lucu']], 'santai');
  const batasan = T.input('text', 'cth: maks 200 kata, jangan pakai bahasa Inggris (opsional)', '');
  const box = T.out();
  let hasil = '';

  const FMT = {
    paragraf: 'tulis sebagai paragraf naratif yang mengalir dan enak dibaca',
    poin: 'tulis sebagai daftar poin (bullet list) yang rapi, tiap poin satu gagasan jelas',
    tabel: 'tulis sebagai tabel yang rapi dengan kolom yang sesuai dengan isi jawabannya',
    kode: 'tulis sebagai blok kode yang siap dipakai, sertakan penjelasan singkat sebelum/sesudah kode bila perlu',
    langkah: 'tulis sebagai langkah-langkah bernomor yang runut, konkret, dan mudah diikuti'
  };
  const TONE = {
    formal: 'Gunakan bahasa yang formal, sopan, dan profesional.',
    santai: 'Gunakan bahasa yang santai dan akrab, seperti sedang mengobrol dengan teman.',
    tegas: 'Gunakan bahasa yang tegas, lugas, dan langsung ke inti — tanpa basa-basi.',
    lucu: 'Gunakan bahasa yang ringan dan sesekali humoris, tapi isinya tetap akurat dan berguna.'
  };

  const rakit = () => {
    const p = peran.value.trim(), t = tugas.value.trim(), k = konteks.value.trim(), b = batasan.value.trim();
    if (!t) { T.toast('Isi dulu Tugas-nya ya'); tugas.focus(); return; }
    const L = [];
    L.push('Kamu adalah seorang ' + (p ? p : 'asisten yang kompeten') + '.');
    L.push('');
    L.push('## Tugas');
    L.push(t);
    if (k) { L.push(''); L.push('## Konteks'); L.push(k); }
    L.push('');
    L.push('## Format Output');
    L.push('Untuk jawabanmu, ' + FMT[format.value] + '.');
    L.push('');
    L.push('## Gaya Bahasa');
    L.push(TONE[tone.value]);
    if (b) { L.push(''); L.push('## Batasan'); L.push(b); }
    L.push('');
    L.push('Jawablah dengan detail dan konkret — hindari jawaban generik yang bisa ditebak tanpa konteks di atas.');
    hasil = L.join('\n');
    T.show(box, '');
    const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.6;margin:0 0 10px"></pre>');
    pre.textContent = hasil;
    box.appendChild(pre);
    box.appendChild(T.row(T.copyBtn(() => hasil, 'Salin Prompt')));
  };

  root.appendChild(T.field('Peran AI', peran, 'Mau AI-nya berperan sebagai siapa?'));
  root.appendChild(T.field('Tugas', tugas, 'Apa yang harus dikerjakan AI? Makin spesifik makin bagus.'));
  root.appendChild(T.field('Konteks', konteks, 'Latar belakang yang perlu AI tahu.'));
  root.appendChild(T.field('Format output', format));
  root.appendChild(T.field('Tone / gaya bahasa', tone));
  root.appendChild(T.field('Batasan (opsional)', batasan));
  root.appendChild(T.row(T.btn('Rakit Prompt', rakit, true)));
  root.appendChild(box);
}
