import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "tts", "name": "Text-to-Speech", "cat": "musik", "icon": "🗣️", "desc": "Bacakan teks bahasa Indonesia.", "keywords": "tts,suara,baca,teks"};
export function render(root) {

    const teks = T.ta(5, 'Ketik atau tempel teks di sini…');
    const suara = T.select([], '');
    const rate = T.el('<input type="range" class="inp" min="50" max="200" value="100">');
    const pitch = T.el('<input type="range" class="inp" min="50" max="200" value="100">');
    const box = T.out();
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      if (!synth) return;
      const vs = synth.getVoices();
      const sorted = [...vs].sort((a, b) => {
        const ai = /id[-_]ID/i.test(a.lang) ? 0 : /id/i.test(a.lang) ? 1 : 2;
        const bi = /id[-_]ID/i.test(b.lang) ? 0 : /id/i.test(b.lang) ? 1 : 2;
        return ai - bi;
      });
      suara.innerHTML = '';
      sorted.forEach((v) => {
        const o = document.createElement('option');
        o.value = v.name; o.textContent = v.name + ' (' + v.lang + ')';
        suara.appendChild(o);
      });
      if (!sorted.length) {
        const o = document.createElement('option');
        o.value = ''; o.textContent = 'Suara bawaan sistem';
        suara.appendChild(o);
      }
    };
    if (synth) {
      loadVoices();
      if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    }
    const speak = () => {
      if (!synth) { T.show(box, '<p class="err">Browser tidak mendukung text-to-speech.</p>'); return; }
      const t = teks.value.trim();
      if (!t) { T.show(box, '<p class="warn">Isi teksnya dulu ya.</p>'); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'id-ID';
      const v = synth.getVoices().find((x) => x.name === suara.value);
      if (v) u.voice = v;
      u.rate = +rate.value / 100; u.pitch = +pitch.value / 100;
      u.onend = () => T.hide(box);
      u.onerror = () => T.show(box, '<p class="err">Gagal membacakan teks.</p>');
      synth.speak(u);
      T.show(box, '<p class="center mut">Membacakan…</p>');
    };
    const stop = () => { try { synth && synth.cancel(); } catch (e) {} T.hide(box); };
    T.onLeave(stop);
    root.appendChild(T.field('Teks', teks));
    root.appendChild(T.field('Suara', suara, 'Suara Indonesia (id-ID) diprioritaskan bila tersedia'));
    root.appendChild(T.grid2(
      T.field('Kecepatan (' + rate.value + '%)', rate),
      T.field('Nada (' + pitch.value + '%)', pitch)
    ));
    rate.addEventListener('input', () => { rate.closest('.fld').querySelector('label').textContent = 'Kecepatan (' + rate.value + '%)'; });
    pitch.addEventListener('input', () => { pitch.closest('.fld').querySelector('label').textContent = 'Nada (' + pitch.value + '%)'; });
    root.appendChild(T.row(T.btn('Bacakan', speak, true), T.btn('Stop', stop)));
    root.appendChild(box);
  
}
