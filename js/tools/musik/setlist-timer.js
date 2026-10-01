import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id":"setlist-timer","name":"Setlist Timer","cat":"musik","icon":"⏳","desc":"Timer setlist manggung: countdown per lagu + total durasi.","keywords":"setlist,timer,manggung,live,dj,musik,konser,panggung"};

export function render(root){
  const p2=(n)=>String(n).padStart(2,'0');
  const fmt=(s)=>{s=Math.max(0,Math.ceil(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h>0?h+':'+p2(m):m)+':'+p2(x);};
  const parseDur=(v)=>{v=String(v==null?'':v).trim();const m=v.match(/^(\d{1,3}):([0-5]?\d)$/);if(m)return (+m[1])*60+(+m[2]);const n=Number(v);return (Number.isFinite(n)&&n>0)?n*60:0;};

  let songs=[{name:'',dur:'3:30'},{name:'',dur:'4:00'},{name:'',dur:'5:00'}];
  let idx=0,left=0,lastT=0,iv=null,running=false,finished=false;

  const listBox=T.el('<div></div>');
  const totalBox=T.out();
  const songLbl=T.el('<div class="center mut" style="margin-bottom:4px"></div>');
  const disp=T.el('<div class="big center" style="font-variant-numeric:tabular-nums">--:--</div>');
  const barWrap=T.el('<div style="height:10px;border-radius:6px;background:#221d16;overflow:hidden;margin:12px 0 6px"></div>');
  const barFill=T.el('<i style="display:block;height:100%;width:0%;background:#fff;border-radius:6px"></i>');
  barWrap.appendChild(barFill);
  const totalLeftLbl=T.el('<div class="center hint"></div>');

  const durAt=(i)=>parseDur(songs[i]?songs[i].dur:'');
  const totalSecs=()=>songs.reduce((a,s)=>a+parseDur(s.dur),0);

  const paintTotal=()=>{
    T.show(totalBox,
      '<div class="kv"><span>Total durasi setlist</span><b>'+fmt(totalSecs())+'</b></div>'+
      '<div class="kv"><span>Jumlah lagu</span><b>'+songs.length+'</b></div>');
  };

  const paintPerf=()=>{
    if(!songs.length){songLbl.innerHTML='<span class="mut">Belum ada lagu — tambah dulu di atas.</span>';disp.textContent='--:--';barFill.style.width='0%';totalLeftLbl.textContent='';return;}
    if(finished){songLbl.innerHTML='<b>🎉 Setlist selesai! Encore?</b>';disp.textContent='00:00';barFill.style.width='100%';totalLeftLbl.textContent='Total durasi: '+fmt(totalSecs());return;}
    const cur=songs[idx];
    songLbl.innerHTML='Lagu '+(idx+1)+'/'+songs.length+': <b>'+T.esc(cur.name||('Lagu '+(idx+1)))+'</b>';
    disp.textContent=fmt(left);
    const d=durAt(idx)||1;
    barFill.style.width=Math.max(0,Math.min(100,(left/d)*100))+'%';
    const rest=left+songs.slice(idx+1).reduce((a,s)=>a+parseDur(s.dur),0);
    totalLeftLbl.textContent='Sisa total: '+fmt(rest);
  };

  const paintList=()=>{
    listBox.innerHTML='';
    songs.forEach((s,i)=>{
      const nm=T.input('text','Nama lagu',s.name);
      nm.style.flex='1';nm.style.minWidth='0';
      const du=T.input('text','m:ss',s.dur);
      du.style.width='78px';du.style.flex='none';du.inputMode='numeric';
      const del=T.btn('✕',()=>{songs.splice(i,1);resetPerf();paintList();paintTotal();});
      nm.addEventListener('input',()=>{s.name=nm.value;if(!running)paintPerf();});
      du.addEventListener('input',()=>{s.dur=du.value;paintTotal();if(!running){left=durAt(idx);paintPerf();}});
      listBox.appendChild(T.row(nm,du,del));
    });
  };

  const stop=()=>{if(iv)clearInterval(iv);iv=null;running=false;};
  const tick=()=>{const now=Date.now();left-=(now-lastT)/1000;lastT=now;if(left<=0){nextSong(true);return;}paintPerf();};
  const start=()=>{if(running||!songs.length||finished)return;if(left<=0)left=durAt(idx);if(left<=0){T.toast('Durasi lagu ini 0 — isi dulu ya');return;}lastT=Date.now();running=true;iv=setInterval(tick,250);};
  const pause=()=>{stop();};
  const nextSong=(auto)=>{
    T.beep(auto?880:660,0.18);
    if(idx>=songs.length-1){stop();finished=true;left=0;T.beep(1320,0.4,'sine',0.25);T.toast('Setlist selesai! 🎉');paintPerf();return;}
    idx++;left=durAt(idx);paintPerf();
  };
  const resetPerf=()=>{stop();idx=0;finished=false;left=songs.length?durAt(0):0;paintPerf();};

  T.onLeave(stop);

  const addBtn=T.btn('＋ Tambah lagu',()=>{songs.push({name:'',dur:'3:00'});if(!running)resetPerf();paintList();paintTotal();});

  root.appendChild(T.el('<div class="h3">🎵 Daftar lagu</div>'));
  root.appendChild(listBox);
  root.appendChild(T.row(addBtn));
  root.appendChild(totalBox);
  root.appendChild(T.el('<div class="h3" style="margin-top:18px">⏳ Mode perform</div>'));
  root.appendChild(songLbl);
  root.appendChild(disp);
  root.appendChild(barWrap);
  root.appendChild(totalLeftLbl);
  root.appendChild(T.row(
    T.btn('▶ Mulai',start,true),
    T.btn('⏸ Jeda',pause),
    T.btn('↺ Reset',resetPerf),
    T.btn('⏭ Lagu berikutnya',()=>nextSong(false))
  ));
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Format durasi: menit:detik, contoh 3:30. Angka polos dibaca sebagai menit.</div>'));

  paintList();paintTotal();resetPerf();
}
