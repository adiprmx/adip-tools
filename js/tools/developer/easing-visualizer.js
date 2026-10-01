import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"easing-visualizer","name":"Easing Visualizer","cat":"developer","icon":"〰️","desc":"Lihat & racik kurva easing cubic-bezier dengan animasi live.","keywords":"easing,cubic-bezier,css,animasi,transition"};

const PRESETS=[['Linear',[0,0,1,1]],['Ease',[0.25,0.1,0.25,1]],['Ease In',[0.42,0,1,1]],['Ease Out',[0,0,0.58,1]],['Ease In Out',[0.42,0,0.58,1]]];

function makeCubic(x1,y1,x2,y2){
  const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx;
  const cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
  const sx=(t)=>((ax*t+bx)*t+cx)*t;
  const sy=(t)=>((ay*t+by)*t+cy)*t;
  const pt=(t)=>[sx(t),sy(t)];
  const at=(p)=>{let lo=0,hi=1;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(sx(m)<p)lo=m;else hi=m;}return sy((lo+hi)/2);};
  return {pt,at};
}

export function render(root){
  let x1=0.25,y1=0.1,x2=0.25,y2=1;
  const css=()=>'cubic-bezier('+x1.toFixed(2)+', '+y1.toFixed(2)+', '+x2.toFixed(2)+', '+y2.toFixed(2)+')';

  const cv=document.createElement('canvas');
  cv.width=640;cv.height=440;
  cv.style.cssText='width:100%;border-radius:10px;background:#14110d;border:1px solid #2b251d';
  const valLbl=T.el('<div class="center" style="font-family:monospace;font-size:13px;margin:10px 0"></div>');

  const draw=()=>{
    const c=cv.getContext('2d'),W=cv.width,H=cv.height,P=44;
    const X=(x)=>P+x*(W-2*P),Y=(y)=>H-P-y*(H-2*P);
    c.save();c.clearRect(0,0,W,H);
    c.beginPath();c.rect(0,0,W,H);c.clip();
    c.strokeStyle='#2b251d';c.lineWidth=1;
    for(let g=0;g<=4;g++){
      c.beginPath();c.moveTo(X(g/4),Y(-0.5));c.lineTo(X(g/4),Y(1.5));c.stroke();
      c.beginPath();c.moveTo(X(0),Y(-0.5+g*0.5));c.lineTo(X(1),Y(-0.5+g*0.5));c.stroke();
    }
    // sumbu 0..1
    c.strokeStyle='#4a4033';
    c.beginPath();c.moveTo(X(0),Y(0));c.lineTo(X(1),Y(0));c.stroke();
    c.beginPath();c.moveTo(X(0),Y(1));c.lineTo(X(1),Y(1));c.stroke();
    const cu=makeCubic(x1,y1,x2,y2);
    c.strokeStyle='#8a7a5f';c.setLineDash([6,5]);c.lineWidth=1.5;
    c.beginPath();c.moveTo(X(0),Y(0));c.lineTo(X(x1),Y(y1));c.stroke();
    c.beginPath();c.moveTo(X(1),Y(1));c.lineTo(X(x2),Y(y2));c.stroke();
    c.setLineDash([]);
    c.strokeStyle='#ff8c69';c.lineWidth=4;c.lineCap='round';c.beginPath();
    for(let i=0;i<=120;i++){const p=cu.pt(i/120);const xx=X(p[0]),yy=Y(p[1]);if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}
    c.stroke();
    c.fillStyle='#f5efe2';
    [[0,0],[x1,y1],[x2,y2],[1,1]].forEach((p)=>{c.beginPath();c.arc(X(p[0]),Y(p[1]),7,0,7);c.fill();});
    c.restore();
    valLbl.textContent=css();
  };

  const sliders=[];
  const mkSlider=(label,get,set,min,max)=>{
    const r=document.createElement('input');
    r.type='range';r.min=min;r.max=max;r.value=Math.round(get()*100);
    r.style.cssText='width:100%;padding:0';
    const lb=T.el('<div class="mut" style="font-size:12px;margin-bottom:2px"></div>');
    const upd=()=>{lb.textContent=label+': '+(r.value/100).toFixed(2);};
    r.addEventListener('input',()=>{set(r.value/100);upd();draw();});
    upd();
    sliders.push({set:(v)=>{r.value=Math.round(v*100);set(v);upd();}});
    const w=T.el('<div style="margin-bottom:10px"></div>');
    w.appendChild(lb);w.appendChild(r);
    return w;
  };
  const sX1=mkSlider('x1',( )=>x1,(v)=>{x1=v;},0,100);
  const sY1=mkSlider('y1',()=>y1,(v)=>{y1=v;},-50,150);
  const sX2=mkSlider('x2',()=>x2,(v)=>{x2=v;},0,100);
  const sY2=mkSlider('y2',()=>y2,(v)=>{y2=v;},-50,150);

  const presetBar=T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>');
  PRESETS.forEach(([label,v],pi)=>{
    const b=T.btn(label,()=>{
      [x1,y1,x2,y2]=v;
      sliders[0].set(x1);sliders[1].set(y1);sliders[2].set(x2);sliders[3].set(y2);
      draw();
    });
    presetBar.appendChild(b);
  });

  const track=T.el('<div style="position:relative;height:56px;border-radius:10px;background:#14110d;border:1px solid #2b251d;overflow:hidden;margin:14px 0 10px"></div>');
  const dot=T.el('<div style="position:absolute;top:8px;left:8px;width:40px;height:40px;border-radius:10px;background:#ff8c69"></div>');
  track.appendChild(dot);

  const DUR=1800;
  let raf=null,playing=true,t0=performance.now();
  const loop=(now)=>{
    if(!playing){raf=null;return;}
    const p=((now-t0)%DUR)/DUR;
    const e=makeCubic(x1,y1,x2,y2).at(p);
    const maxX=Math.max(0,track.clientWidth-56);
    dot.style.transform='translateX('+(e*maxX)+'px)';
    raf=requestAnimationFrame(loop);
  };
  const playBtn=T.btn('⏸ Jeda animasi',()=>{
    playing=!playing;
    playBtn.textContent=playing?'⏸ Jeda animasi':'▶ Putar animasi';
    if(playing){t0=performance.now();raf=requestAnimationFrame(loop);}
  });
  T.onLeave(()=>{if(raf)cancelAnimationFrame(raf);});

  root.appendChild(T.el('<div class="h3">〰️ Kurva easing</div>'));
  root.appendChild(cv);
  root.appendChild(valLbl);
  root.appendChild(presetBar);
  root.appendChild(T.el('<div class="h3">🎚️ Cubic-bezier custom</div>'));
  root.appendChild(sX1);root.appendChild(sY1);root.appendChild(sX2);root.appendChild(sY2);
  root.appendChild(T.el('<div class="h3">▶️ Demo animasi</div>'));
  root.appendChild(track);
  root.appendChild(T.row(playBtn,T.copyBtn(()=>'transition-timing-function: '+css()+';','Salin CSS')));
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Geser slider lalu lihat kurva &amp; kotaknya bergerak live. y boleh minus/lebih dari 1 buat efek memantul.</div>'));

  draw();
  raf=requestAnimationFrame(loop);
}
