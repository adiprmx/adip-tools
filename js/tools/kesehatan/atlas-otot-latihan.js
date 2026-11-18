import { h as T } from '../../core.js';

// Data otot + latihan: panduan MuscleWiki (musclewiki.com/exercises),
// diakses 18 Nov 2026. Latihan perut memakai studi ACE / San Diego State
// University (via fitnessandpower.com) karena panduan Abs MuscleWiki justru
// menaruh latihan compound sebagai 4 teratas. Nama Latin = anatomi baku.
const OTOT = [
  { id: 'dada', nama: 'Dada', latin: 'Pectoralis major', sisi: 'depan', latihan: [
    ['Barbell Bench Press', 'Berbaring di bangku, dorong barbel dari dada ke atas sampai lengan lurus.'],
    ['Push Up', 'Tubuh lurus bertumpu tangan dan ujung kaki, turunkan dada lalu dorong naik.'],
    ['Dumbbell Incline Bench Press', 'Di bangku miring, dorong dua dumbbell dari dada ke atas.'],
    ['Machine Pec Fly', 'Duduk di mesin, rapatkan kedua lengan di depan dada.'],
  ]},
  { id: 'punggung', nama: 'Punggung sayap', latin: 'Latissimus dorsi', sisi: 'belakang', latihan: [
    ['Chin Ups', 'Gantung di palang dengan telapak tangan menghadapmu, tarik badan sampai dagu melewati palang.'],
    ['Cable Lat Prayer', 'Tarik kabel dari atas ke bawah dengan lengan lurus, rasakan punggung sayap bekerja.'],
    ['Dumbbell Row Unilateral', 'Satu tangan bertumpu di bangku, tarik dumbbell ke arah pinggang.'],
    ['Pull Ups', 'Gantung di palang dengan telapak tangan menjauh, tarik badan sampai dagu melewati palang.'],
  ]},
  { id: 'bahu', nama: 'Bahu', latin: 'Deltoid', sisi: 'keduanya', latihan: [
    ['Barbell Overhead Press', 'Berdiri, dorong barbel dari bahu ke atas kepala sampai lengan lurus.'],
    ['Dumbbell Seated Overhead Press', 'Duduk, dorong dua dumbbell dari bahu ke atas.'],
    ['Cable Low Single Arm Lateral Raise', 'Satu tangan memegang kabel dari bawah, angkat lengan ke samping sampai sejajar bahu.'],
    ['Barbell Upright Row', 'Berdiri, tarik barbel dari depan paha ke arah dagu.'],
  ]},
  { id: 'bisep', nama: 'Bisep', latin: 'Biceps brachii', sisi: 'depan', latihan: [
    ['Chin Ups', 'Gantung di palang dengan telapak tangan menghadapmu, tarik badan sampai dagu melewati palang.'],
    ['Barbell Curl', 'Berdiri, tekuk siku untuk mengangkat barbel ke arah dada.'],
    ['Dumbbell Preacher Curl', 'Lengan bertumpu di bangku preacher, tekuk siku mengangkat dumbbell.'],
    ['Dumbbell Incline Curl', 'Di bangku miring, tekuk siku mengangkat dumbbell dari posisi lengan menggantung.'],
  ]},
  { id: 'trisep', nama: 'Trisep', latin: 'Triceps brachii', sisi: 'belakang', latihan: [
    ['Cable Rope Pushdown', 'Pegang tali kabel di depan, luruskan siku ke bawah.'],
    ['Barbell Close Grip Bench Press', 'Berbaring, dorong barbel dengan pegangan sempit dari dada ke atas.'],
    ['Dumbbell Skullcrusher', 'Berbaring, tekuk dan luruskan siku sambil memegang dumbbell di atas kepala.'],
    ['Bench Dips', 'Tangan bertumpu di bangku di belakangmu, turun-naikkan badan dengan menekuk siku.'],
  ]},
  { id: 'perut', nama: 'Perut', latin: 'Rectus abdominis', sisi: 'depan', sumberKhusus: 'Studi ACE / San Diego State University', latihan: [
    ['Bicycle Crunch', 'Berbaring, kayuh kaki sambil menyentuhkan siku ke lutut berlawanan.'],
    ["Captain's Chair Leg Raise", "Bertumpu di siku pada alat captain's chair, angkat lutut ke arah dada."],
    ['Crunch di bola latihan', 'Punggung di atas bola latihan, angkat bahu ke arah lutut.'],
    ['Plank', 'Tahan tubuh lurus bertumpu lengan bawah dan ujung kaki.'],
  ]},
  { id: 'paha-depan', nama: 'Paha depan', latin: 'Quadriceps femoris', sisi: 'depan', latihan: [
    ['Barbell Squat', 'Barbel di bahu, turunkan badan sampai paha sejajar lantai lalu berdiri lagi.'],
    ['Dumbbell Goblet Squat', 'Pegang satu dumbbell di depan dada, jongkok lalu berdiri.'],
    ['Machine Leg Extension', 'Duduk di mesin, luruskan lutut mengangkat beban.'],
    ['Barbell Step Up', 'Barbel di bahu, naik ke bangku satu kaki lalu turun bergantian.'],
  ]},
  { id: 'paha-belakang', nama: 'Paha belakang', latin: 'Hamstrings', sisi: 'belakang', latihan: [
    ['Barbell Stiff Leg Deadlifts', 'Barbel di depan paha, turunkan dengan lutut hampir lurus lalu angkat lagi.'],
    ['Glute Ham Raise', 'Tumit terkunci di alat, turunkan badan lalu angkat dengan paha belakang.'],
    ['Machine Hamstring Curl', 'Berbaring di mesin, tekuk lutut menarik beban ke arah bokong.'],
    ['Barbell Low Bar Good Morning', 'Barbel di punggung atas, membungkuk ke depan dengan punggung lurus lalu tegak lagi.'],
  ]},
  { id: 'bokong', nama: 'Bokong', latin: 'Gluteus maximus', sisi: 'belakang', latihan: [
    ['Barbell Squat', 'Barbel di bahu, turunkan badan sampai paha sejajar lantai lalu berdiri lagi.'],
    ['Barbell Stiff Leg Deadlifts', 'Barbel di depan paha, turunkan dengan lutut hampir lurus lalu angkat lagi.'],
    ['Barbell Hip Thrust', 'Punggung atas di bangku, dorong pinggul ke atas dengan barbel di pangkal paha.'],
    ['Dumbbell Goblet Squat', 'Pegang satu dumbbell di depan dada, jongkok lalu berdiri.'],
  ]},
  { id: 'betis', nama: 'Betis', latin: 'Gastrocnemius', sisi: 'keduanya', latihan: [
    ['Machine Standing Calf Raises', 'Berdiri di mesin, jinjit mengangkat beban.'],
    ['Machine Seated Calf Raises', 'Duduk di mesin, jinjit mengangkat beban dengan lutut tertekuk.'],
    ['Barbell Calf Raises', 'Barbel di bahu, jinjit lalu turun perlahan.'],
    ['Calves Stretch Variation One', 'Regangkan betis dengan satu kaki di depan dan tumit menempel lantai.'],
  ]},
  { id: 'traps', nama: 'Leher & punggung atas', latin: 'Trapezius', sisi: 'belakang', latihan: [
    ['Barbell Silverback Shrug', 'Pegang barbel di depan, angkat bahu setinggi mungkin.'],
    ['Cable 30 Degree Shrug', 'Pegang kabel dengan badan sedikit miring, angkat bahu.'],
    ['Dumbbell Shrug', 'Pegang dumbbell di kedua tangan, angkat bahu setinggi mungkin.'],
    ['Barbell Upright Row', 'Berdiri, tarik barbel dari depan paha ke arah dagu.'],
  ]},
  { id: 'lengan-bawah', nama: 'Lengan bawah', latin: 'Forearm flexors & extensors', sisi: 'keduanya', latihan: [
    ['Chin Ups', 'Gantung di palang dengan telapak tangan menghadapmu, tarik badan sampai dagu melewati palang.'],
    ['Dumbbell Row Unilateral', 'Satu tangan bertumpu di bangku, tarik dumbbell ke arah pinggang.'],
    ['Dumbbell Reverse Curl', 'Pegang dumbbell dengan telapak tangan menghadap bawah, tekuk siku.'],
    ['Barbell Reverse Curl', 'Pegang barbel dengan telapak tangan menghadap bawah, tekuk siku.'],
  ]},
];

// Zona klik per tampilan (viewBox 300 x 520). Gambar skema, bukan anatomi detail.
const ZONA = {
  depan: [
    ['bahu', 'ellipse', [108, 78, 18, 24]], ['bahu', 'ellipse', [192, 78, 18, 24]],
    ['dada', 'rect', [118, 70, 30, 55]], ['dada', 'rect', [152, 70, 30, 55]],
    ['bisep', 'ellipse', [100, 130, 12, 28]], ['bisep', 'ellipse', [200, 130, 12, 28]],
    ['lengan-bawah', 'ellipse', [98, 190, 10, 26]], ['lengan-bawah', 'ellipse', [202, 190, 10, 26]],
    ['perut', 'rect', [128, 130, 44, 75]],
    ['paha-depan', 'rect', [122, 225, 26, 95]], ['paha-depan', 'rect', [152, 225, 26, 95]],
    ['betis', 'ellipse', [135, 360, 13, 32]], ['betis', 'ellipse', [165, 360, 13, 32]],
  ],
  belakang: [
    ['traps', 'poly', '130,55 170,55 195,100 105,100'],
    ['bahu', 'ellipse', [108, 78, 18, 24]], ['bahu', 'ellipse', [192, 78, 18, 24]],
    ['punggung', 'rect', [112, 105, 30, 80]], ['punggung', 'rect', [158, 105, 30, 80]],
    ['trisep', 'ellipse', [100, 130, 12, 28]], ['trisep', 'ellipse', [200, 130, 12, 28]],
    ['lengan-bawah', 'ellipse', [98, 190, 10, 26]], ['lengan-bawah', 'ellipse', [202, 190, 10, 26]],
    ['bokong', 'rect', [122, 215, 56, 45]],
    ['paha-belakang', 'rect', [122, 265, 26, 80]], ['paha-belakang', 'rect', [152, 265, 26, 80]],
    ['betis', 'ellipse', [135, 360, 13, 32]], ['betis', 'ellipse', [165, 360, 13, 32]],
  ],
};

export const meta = {"id": "atlas-otot-latihan", "name": "Atlas Otot & Latihan", "cat": "kesehatan", "icon": "💪", "desc": "Ketuk bagian tubuh untuk melihat 4 latihan terbaik buat otot itu.", "keywords": "otot,latihan,gym,anatomi,bahu,dada,paha,perut,fitness", "since": "6.16.0"};
export function render(root) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  let tampilan = 'depan';
  let terpilih = 'dada';
  const detail = T.el('<div></div>');

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 300 520');
  svg.style.cssText = 'width:100%;max-width:300px;height:auto;display:block;margin:0 auto;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px';

  const gambar = () => {
    svg.innerHTML = '';
    // Kerangka tubuh skematis
    const kerangka = [
      ['circle', { cx: 150, cy: 35, r: 22 }],
      ['rect', { x: 112, y: 60, width: 76, height: 150, rx: 24 }],
      ['rect', { x: 88, y: 66, width: 22, height: 150, rx: 11 }],
      ['rect', { x: 190, y: 66, width: 22, height: 150, rx: 11 }],
      ['rect', { x: 122, y: 210, width: 26, height: 190, rx: 12 }],
      ['rect', { x: 152, y: 210, width: 26, height: 190, rx: 12 }],
    ];
    kerangka.forEach(([tag, at]) => {
      const e = document.createElementNS(SVGNS, tag);
      Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v));
      e.setAttribute('fill', 'none');
      e.setAttribute('stroke', 'rgba(255,255,255,.3)');
      e.setAttribute('stroke-width', '1.5');
      svg.appendChild(e);
    });
    ZONA[tampilan].forEach(([id, bentuk, a]) => {
      let e;
      if (bentuk === 'ellipse') {
        e = document.createElementNS(SVGNS, 'ellipse');
        e.setAttribute('cx', a[0]); e.setAttribute('cy', a[1]);
        e.setAttribute('rx', a[2]); e.setAttribute('ry', a[3]);
      } else if (bentuk === 'rect') {
        e = document.createElementNS(SVGNS, 'rect');
        e.setAttribute('x', a[0]); e.setAttribute('y', a[1]);
        e.setAttribute('width', a[2]); e.setAttribute('height', a[3]);
        e.setAttribute('rx', '8');
      } else {
        e = document.createElementNS(SVGNS, 'polygon');
        e.setAttribute('points', a);
      }
      const aktif = id === terpilih;
      e.setAttribute('fill', aktif ? '#ff6f61' : '#ff6f61');
      e.setAttribute('fill-opacity', aktif ? '0.95' : '0.45');
      e.setAttribute('stroke', '#fff');
      e.setAttribute('stroke-width', aktif ? '2' : '0.5');
      e.style.cursor = 'pointer';
      const t = document.createElementNS(SVGNS, 'title');
      t.textContent = OTOT.find((o) => o.id === id).nama;
      e.appendChild(t);
      e.addEventListener('click', () => { terpilih = id; gambar(); tampilDetail(); });
      svg.appendChild(e);
    });
  };

  const tampilDetail = () => {
    const o = OTOT.find((x) => x.id === terpilih);
    detail.innerHTML =
      '<div class="sechead" style="margin-top:20px"><h2>' + T.esc(o.nama) + '</h2><span class="n">' + T.esc(o.latin) + '</span></div>' +
      o.latihan.map(([nama, desk], i) =>
        '<p style="margin:10px 0"><b>' + (i + 1) + '. ' + T.esc(nama) + '</b><br><span class="mut">' + T.esc(desk) + '</span></p>'
      ).join('') +
      '<p class="hint">Sumber latihan: ' + T.esc(o.sumberKhusus || 'panduan MuscleWiki (musclewiki.com)') + ', diakses 18 November 2026. Nama latihan memakai istilah yang umum dipakai di gym Indonesia.</p>';
  };

  const depanBtn = T.btn('Tampak depan', () => { tampilan = 'depan'; gambar(); });
  const belakangBtn = T.btn('Tampak belakang', () => { tampilan = 'belakang'; gambar(); });

  root.appendChild(T.el('<p class="note">Ketuk bagian tubuh di gambar untuk melihat 4 latihan buat otot itu. Gambar ini skema sederhana — bukan gambar anatomi detail.</p>'));
  const tombol = T.el('<div class="row" style="justify-content:center;gap:8px;margin-bottom:12px"></div>');
  tombol.appendChild(depanBtn); tombol.appendChild(belakangBtn);
  root.appendChild(tombol);
  root.appendChild(svg);
  // Daftar otot (cadangan bila gambar sulit diketuk)
  const daftar = T.el('<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:14px"></div>');
  OTOT.forEach((o) => {
    const b = T.btn(o.nama, () => {
      terpilih = o.id;
      if (o.sisi !== 'keduanya') tampilan = o.sisi;
      gambar(); tampilDetail();
    });
    daftar.appendChild(b);
  });
  root.appendChild(daftar);
  root.appendChild(detail);
  gambar();
  tampilDetail();
}
