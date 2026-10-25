// Rendu canvas : ondes, nœuds, obstacles, démo du menu.
/* ---------- rendu ---------- */
function ringColor(r){
  if(SPLIT.includes(S.mode)) return r.owner===2?C.p2:C.saffron;
  if(r.freeze) return C.p2;
  if(r.hue!=null && G.prisms.some(p=>p.hue!=null)) return r.hue===0?C.rose:C.p2;
  return r.kind==='chain'?C.saffron : r.kind==='prism'?C.rose : r.kind==='delay'?C.dust : C.bone;
}
function ringPath(g,r){
  g.beginPath();
  if(r.via||!G.muds.length){ g.arc(r.x,r.y,Math.max(r.r,0.1),0,TAU); return; }
  const N=120;
  if(!r.ivc){
    r.ivc=[];
    for(let i=0;i<N;i++){
      const th=i/N*TAU, ux=Math.cos(th), uy=Math.sin(th), iv=[];
      for(const m of G.muds){ const fx=r.x-m.x, fy=r.y-m.y, b=fx*ux+fy*uy, c=fx*fx+fy*fy-m.rr*m.rr, d=b*b-c;
        if(d<=0) continue; const q=Math.sqrt(d), t1=Math.max(-b-q,0), t2=-b+q; if(t2>t1) iv.push([t1,t2]); }
      iv.sort((a,b)=>a[0]-b[0]); r.ivc.push(iv);
    }
  }
  for(let i=0;i<=N;i++){
    const k=i%N, th=k/N*TAU; let rho=0, rem=r.r;
    for(const [a,b] of r.ivc[k]){
      if(a>rho){ const f=a-rho; if(rem<=f){ rho+=rem; rem=0; break; } rho=a; rem-=f; }
      const cost=(b-Math.max(a,rho))*K_MUD; if(rem<=cost){ rho+=rem/K_MUD; rem=0; break; } rho=b; rem-=cost;
    }
    rho+=rem;
    const x=r.x+Math.cos(th)*rho, y=r.y+Math.sin(th)*rho; i?g.lineTo(x,y):g.moveTo(x,y);
  }
}
function strokeRing(g,r,a){
  const col=ringColor(r); ringPath(g,r);
  const thick=r.freq==='low', thin=r.freq==='high';
  if(thin) g.setLineDash([7,6]); else if(r.freeze) g.setLineDash([2,6]); else if(r.kind==='delay') g.setLineDash([12,4]);
  g.strokeStyle=`rgba(${col},${a*0.14})`; g.lineWidth=thick?16:10; g.stroke();
  g.strokeStyle=`rgba(${col},${a*0.9})`; g.lineWidth=thick?3.4:r.freeze?2.6:1.6; g.stroke();
  g.setLineDash([]);
}
function sideOf(e,x,y){ return Math.sign((e[2]-e[0])*(y-e[1])-(e[3]-e[1])*(x-e[0])); }
function drawRings(){
  const diag=Math.hypot(W,H), far=diag*3;
  G.rings=G.rings.filter(r=>r.r<=Math.max(r.lim,diag*1.15));
  const occl = G.walls.length || G.jammers.length;
  for(const r of G.rings){
    const a=Math.max(0,1-r.r/(diag*1.15)); if(a<=0) continue;
    if(!occl && !r.via){ strokeRing(ctx,r,a); continue; }
    const x0=Math.max(0,Math.floor(r.x-r.r-10)), y0=Math.max(0,Math.floor(r.y-r.r-10));
    const x1=Math.min(W,Math.ceil(r.x+r.r+10)), y1=Math.min(H,Math.ceil(r.y+r.r+10));
    if(x1<=x0||y1<=y0) continue;
    lctx.clearRect(x0,y0,x1-x0,y1-y0);
    strokeRing(lctx,r,a);
    const cone=(e)=>{ const [ax,ay,bx,by]=e, da=Math.hypot(ax-r.x,ay-r.y)||1, db=Math.hypot(bx-r.x,by-r.y)||1;
      lctx.beginPath(); lctx.moveTo(ax,ay); lctx.lineTo(bx,by);
      lctx.lineTo(bx+(bx-r.x)/db*far,by+(by-r.y)/db*far); lctx.lineTo(ax+(ax-r.x)/da*far,ay+(ay-r.y)/da*far); lctx.closePath(); lctx.fill(); };
    lctx.fillStyle='#000';
    if(r.via){ lctx.globalCompositeOperation='destination-in'; cone(r.via.e); }
    lctx.globalCompositeOperation='destination-out';
    const vs = r.via ? sideOf(r.via.e,r.x,r.y) : 0;
    for(const w of G.walls){
      if(w===r.via) continue;
      if(r.via && sideOf(r.via.e,w.e[0],w.e[1])===vs && sideOf(r.via.e,w.e[2],w.e[3])===vs) continue;
      cone(w.e);
    }
    for(const j of G.jammers){
      const dx=j.x-r.x, dy=j.y-r.y, d=Math.hypot(dx,dy);
      lctx.beginPath(); lctx.arc(j.x,j.y,j.rr,0,TAU); lctx.fill();
      if(d<=j.rr+1) continue;
      const base=Math.atan2(dy,dx), al=Math.asin(j.rr/d), L=Math.sqrt(d*d-j.rr*j.rr);
      const p1=[r.x+Math.cos(base-al)*L, r.y+Math.sin(base-al)*L], p2=[r.x+Math.cos(base+al)*L, r.y+Math.sin(base+al)*L];
      lctx.beginPath(); lctx.moveTo(p1[0],p1[1]); lctx.lineTo(p1[0]+Math.cos(base-al)*far,p1[1]+Math.sin(base-al)*far);
      lctx.lineTo(p2[0]+Math.cos(base+al)*far,p2[1]+Math.sin(base+al)*far); lctx.lineTo(p2[0],p2[1]); lctx.closePath(); lctx.fill();
    }
    lctx.globalCompositeOperation='source-over';
    ctx.drawImage(lay,x0*DPR,y0*DPR,(x1-x0)*DPR,(y1-y0)*DPR,x0,y0,x1-x0,y1-y0);
  }
}
function label(txt,x,y,col,size){
  ctx.fillStyle=`rgba(${col},0.95)`; ctx.font=`700 ${size||11}px Unbounded, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(txt,x,y); ctx.textBaseline='alphabetic';
}
function draw(){
  ctx.drawImage(grid,0,0,W,H);
  const R=nodeR(), tt=G.t;
  if(square()){ const e=G.env; ctx.strokeStyle=`rgba(${C.dust},0.35)`; ctx.lineWidth=1; ctx.setLineDash([4,6]); ctx.strokeRect(e.x0,e.y0,e.w,e.h); ctx.setLineDash([]); }
  if(SPLIT.includes(S.mode)){
    ctx.fillStyle=`rgba(${C.p2},0.035)`; ctx.fillRect(0,0,W,H/2);
    ctx.fillStyle=`rgba(${C.saffron},0.035)`; ctx.fillRect(0,H/2,W,H/2);
    ctx.strokeStyle=`rgba(${C.dust},0.5)`; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke(); ctx.setLineDash([]);
  }
  if(S.mode==='rhythm' && S.rh){
    const k=Math.max(0,1-(tt-S.rh.flash)/0.35), strong=S.rh.n%2===1;
    ctx.strokeStyle=`rgba(${strong?C.saffron:C.bone},${k*(strong?0.5:0.25)})`; ctx.lineWidth=6; ctx.strokeRect(3,3,W-6,H-6);
  }
  for(const c of G.currents){
    ctx.beginPath(); ctx.arc(c.x,c.y,c.rr,0,TAU); ctx.fillStyle=`rgba(${C.p2},0.06)`; ctx.fill();
    ctx.strokeStyle=`rgba(${C.p2},0.3)`; ctx.lineWidth=1; ctx.setLineDash([3,6]); ctx.stroke(); ctx.setLineDash([]);
    const a=Math.atan2(c.vy,c.vx), off=reduce?0:(tt*30)%24;
    ctx.save(); ctx.beginPath(); ctx.arc(c.x,c.y,c.rr,0,TAU); ctx.clip(); ctx.translate(c.x,c.y); ctx.rotate(a);
    ctx.strokeStyle=`rgba(${C.p2},0.45)`; ctx.lineWidth=1.4;
    for(let yy=-c.rr+10; yy<c.rr; yy+=16) for(let xx=-c.rr-24+off; xx<c.rr; xx+=24){ ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx+8,yy); ctx.lineTo(xx+5,yy-3); ctx.moveTo(xx+8,yy); ctx.lineTo(xx+5,yy+3); ctx.stroke(); }
    ctx.restore();
  }
  for(const m of G.muds){
    const g=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,m.rr);
    g.addColorStop(0,`rgba(${C.dust},0.32)`); g.addColorStop(1,`rgba(${C.dust},0.08)`);
    ctx.beginPath(); ctx.arc(m.x,m.y,m.rr,0,TAU); ctx.fillStyle=g; ctx.fill();
    for(let i=1;i<=3;i++){ ctx.beginPath(); ctx.arc(m.x,m.y,m.rr*(i/3.4)+(reduce?0:Math.sin(tt*1.2+i)*2),0,TAU); ctx.strokeStyle=`rgba(${C.dust},0.28)`; ctx.lineWidth=1; ctx.stroke(); }
  }
  if(S.mode==='puzzle' && S.fails>=4 && S.layout.hint){
    const hx=G.env.x0+S.layout.hint[0]*G.env.w, hy=G.env.y0+S.layout.hint[1]*G.env.h, k=reduce?0.5:(Math.sin(tt*3)+1)/2;
    ctx.setLineDash([3,5]); ctx.beginPath(); ctx.arc(hx,hy,G.env.U*0.045+k*4,0,TAU); ctx.strokeStyle=`rgba(${C.bone},${0.35+k*0.35})`; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
  }
  if(S.mode==='tuto'){
    TUTO[S.level-1].hints.forEach(([hx,hy],i)=>{
      const x=G.env.x0+hx*G.env.w, y=G.env.y0+hy*G.env.h, next=i===S.tutoTaps, k=reduce?0.5:(Math.sin(tt*4)+1)/2;
      ctx.beginPath(); ctx.arc(x,y,16+(next?k*5:0),0,TAU); ctx.fillStyle=`rgba(${C.saffron},${next?0.22:0.06})`; ctx.fill();
      ctx.strokeStyle=`rgba(${C.saffron},${next?0.9:0.35})`; ctx.lineWidth=1.5; ctx.stroke();
      label(String(i+1),x,y+1,next?C.saffron:C.dust,12);
    });
  }
  drawRings();
  for(const j of G.jammers){
    ctx.beginPath(); ctx.arc(j.x,j.y,j.rr,0,TAU); ctx.fillStyle=TH.ink; ctx.fill();
    ctx.strokeStyle=`rgba(${C.rose},0.8)`; ctx.lineWidth=1.5; ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.beginPath(); ctx.arc(j.x,j.y,Math.max(j.rr-3,1),0,TAU); ctx.clip(); ctx.fillStyle=`rgba(${C.dust},0.6)`;
    const sd=Math.floor((reduce?0:tt)*12);
    for(let i=0;i<26;i++){ const a=((i*137+sd*29)%360)*Math.PI/180, rr=((i*53+sd*17)%100)/100*j.rr; ctx.fillRect(j.x+Math.cos(a)*rr-1,j.y+Math.sin(a)*rr-1,2,2); }
    ctx.restore();
  }
  ctx.lineCap='round';
  for(const w of G.walls){
    const [ax,ay,bx,by]=w.e; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
    if(w.mirror){ ctx.strokeStyle=`rgba(${C.bone},0.25)`; ctx.lineWidth=9; ctx.stroke(); ctx.strokeStyle=`rgba(${C.bone},0.95)`; ctx.lineWidth=3; ctx.stroke(); }
    else { ctx.strokeStyle=`rgba(${C.dust},0.9)`; ctx.lineWidth=7; ctx.stroke(); ctx.strokeStyle=`rgba(${C.bone},0.3)`; ctx.lineWidth=1.5; ctx.stroke(); }
  }
  G.gates.forEach((g,i)=>{
    const k=Math.max(0,1-(tt-g.lastT)/0.5);
    ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(reduce?0:tt*(i%2?-0.8:0.8));
    ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(0,0,R*0.9,0,TAU); ctx.strokeStyle=`rgba(${C.p2},${0.6+k*0.4})`; ctx.lineWidth=2.2; ctx.stroke();
    ctx.setLineDash([]); ctx.beginPath(); ctx.arc(0,0,R*0.45,0,TAU); ctx.fillStyle=`rgba(${C.p2},${0.15+k*0.5})`; ctx.fill(); ctx.restore();
  });
  for(const d of G.delays){
    const pend=G.pending.find(p=>p.d===d), k=pend?1-(pend.t-tt):0;
    ctx.beginPath(); ctx.arc(d.x,d.y,R*0.8,0,TAU); ctx.strokeStyle=`rgba(${C.bone},0.6)`; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(d.x,d.y,R*0.8,-Math.PI/2,-Math.PI/2+k*TAU); ctx.strokeStyle=`rgba(${C.bone},0.95)`; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x,d.y-R*0.5); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x+R*0.35,d.y); ctx.strokeStyle=`rgba(${C.bone},0.8)`; ctx.lineWidth=1.6; ctx.stroke();
  }
  for(const b of G.beacons){
    const ph=b.active?((tt-b.next+b.period)/b.period):0, k=b.active?Math.max(0,1-ph):0;
    ctx.beginPath(); ctx.arc(b.x,b.y,R*1.05+k*4,0,TAU); ctx.fillStyle=`rgba(${C.saffron},${0.12+k*0.4})`; ctx.fill();
    ctx.strokeStyle=`rgba(${C.saffron},0.9)`; ctx.lineWidth=2; ctx.stroke();
    for(let i=1;i<=2;i++){ ctx.beginPath(); ctx.arc(b.x,b.y,R*0.35*i,0,TAU); ctx.strokeStyle=`rgba(${C.saffron},0.6)`; ctx.lineWidth=1.2; ctx.stroke(); }
  }
  if(S.mode==='editor' && ED && ED.draft._pend){ const p=E.pos(G,ED.draft._pend); ctx.setLineDash([5,4]); ctx.beginPath(); ctx.arc(p.x,p.y,R*0.9,0,TAU); ctx.strokeStyle=`rgba(${C.p2},0.6)`; ctx.lineWidth=2; ctx.stroke(); ctx.setLineDash([]); }
  const chromaLvl=G.prisms.some(p=>p.hue!=null);
  for(const p of G.prisms){
    const k=Math.max(0,1-(tt-p.lastT)/0.5), s=R*0.62*(1+k*0.25), col=p.hue==null?C.rose:(p.hue===0?C.rose:C.p2);
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(Math.PI/4+(reduce?0:tt*0.4));
    ctx.beginPath(); ctx.rect(-s,-s,s*2,s*2); ctx.fillStyle=`rgba(${col},${0.12+k*0.6})`; ctx.fill();
    ctx.strokeStyle=`rgb(${col})`; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
    if(chromaLvl && p.hue!=null) label(p.hue===0?'A':'B',p.x,p.y+1,col,10);
  }
  const done=new Set();
  for(const n of G.targets){
    if(n.twin==null||done.has(n)) continue; const o=G.targets[n.twin]; if(!o) continue; done.add(o);
    ctx.setLineDash([2,7]); ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(o.x,o.y);
    ctx.strokeStyle=`rgba(${n.lit&&o.lit?C.saffron:C.bone},0.35)`; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
  }
  S.marks=S.marks.filter(m=>tt-m.t<1.2);
  for(const m of S.marks){
    const k=(tt-m.t)/1.2;
    if(m.txt){ ctx.fillStyle=`rgba(${m.bad?C.rose:C.saffron},${1-k})`; ctx.font='700 13px Unbounded, sans-serif'; ctx.textAlign='center'; ctx.fillText(m.txt,m.x,m.y-30-k*24); }
    else { ctx.beginPath(); ctx.arc(m.x,m.y,4+k*6,0,TAU); ctx.fillStyle=`rgba(${m.owner===2?C.p2:m.owner===1?C.saffron:C.bone},${0.8*(1-k)})`; ctx.fill(); }
  }
  if(S.hold){
    const h=(performance.now()-S.hold.t0)/1000, k=Math.min(h/HOLD,1);
    ctx.beginPath(); ctx.arc(S.hold.x,S.hold.y,10+k*16,0,TAU); ctx.strokeStyle=`rgba(${C.bone},${0.3+k*0.6})`; ctx.lineWidth=k>=1?3.4:1.6;
    if(k<1) ctx.setLineDash([7,6]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=`rgba(${C.bone},0.85)`; ctx.font='500 11px "IBM Plex Mono", monospace'; ctx.textAlign='center';
    ctx.fillText(t(k>=1?'hold_low':'hold_high'), S.hold.x, S.hold.y-34);
  }
  for(const n of G.targets){
    const x=n.x, y=n.y, RR=n.boss?R*1.6:R;
    const split=SPLIT.includes(S.mode);
    const litCol = split ? (n.owner===2?C.p2:C.saffron) : C.saffron;
    if(S.mode==='melody' && !n.lit && n.seq===S.expect && S.phase==='play'){
      const k=reduce?0.5:(Math.sin(tt*4)+1)/2; ctx.beginPath(); ctx.arc(x,y,RR+9+k*4,0,TAU); ctx.strokeStyle=`rgba(${C.saffron},${0.25+k*0.35})`; ctx.lineWidth=1.5; ctx.stroke();
    }
    if(n.frozenUntil && tt<n.frozenUntil){
      ctx.beginPath(); ctx.arc(x,y,RR+8,0,TAU); ctx.strokeStyle=`rgba(${C.p2},0.85)`; ctx.lineWidth=2; ctx.setLineDash([2,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x,y,RR+8,-Math.PI/2,-Math.PI/2+(n.frozenUntil-tt)/3*TAU); ctx.strokeStyle=`rgba(${C.p2},0.9)`; ctx.lineWidth=3; ctx.stroke();
    }
    if(n.expire && !n.lit){ const left=Math.max(0,(n.expire-tt)/(S.rh?S.rh.beat*6:5)); ctx.beginPath(); ctx.arc(x,y,RR+6,-Math.PI/2,-Math.PI/2+left*TAU); ctx.strokeStyle=`rgba(${left<0.3?C.rose:C.dust},0.8)`; ctx.lineWidth=2; ctx.stroke(); }
    if(n.lit){
      const k=tt-n.litT;
      if(!reduce && k<0.8){ ctx.beginPath(); ctx.arc(x,y,RR+k*60,0,TAU); ctx.strokeStyle=`rgba(${litCol},${0.6*(1-k/0.8)})`; ctx.lineWidth=2; ctx.stroke(); }
      const pulse=reduce?0:Math.sin(tt*3+n.nx*9)*1.5;
      ctx.save(); ctx.shadowColor=`rgba(${litCol},0.8)`; ctx.shadowBlur=24;
      ctx.beginPath(); ctx.arc(x,y,RR*0.72+pulse,0,TAU); ctx.fillStyle=`rgb(${litCol})`; ctx.fill(); ctx.restore();
      if(n.fragile){ ctx.setLineDash([3,4]); ctx.beginPath(); ctx.arc(x,y,RR+3,0,TAU); ctx.strokeStyle=`rgba(${C.rose},0.9)`; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]); }
      if(n.decay){ const left=Math.max(0,1-(tt-n.litT)/n.decay); ctx.beginPath(); ctx.arc(x,y,RR+5,-Math.PI/2,-Math.PI/2+left*TAU); ctx.strokeStyle=`rgba(${C.rose},0.95)`; ctx.lineWidth=2.5; ctx.stroke(); }
      if(split && SET.cb) label(String(n.owner||''),x,y+1,C.ink,11);
    } else {
      const armed=n.armedT!=null, gap=n.need>=4?0.22:0.32, seg=TAU/n.need;
      for(let i=0;i<n.need;i++){
        const a0=-Math.PI/2+i*seg+gap/2; ctx.beginPath(); ctx.arc(x,y,RR,a0,a0+seg-gap);
        const on=armed||i<n.dirs, blink=armed&&!reduce&&Math.sin(tt*30)>0;
        let base=C.bone;
        if(n.chroma) base = i%2===0?C.rose:C.p2;
        if(n.coop) base = i%2===0?C.saffron:C.p2;
        ctx.strokeStyle= on ? `rgba(${C.saffron},${blink?0.5:1})` : `rgba(${base},${n.chroma||n.coop?0.8:0.55})`; ctx.lineWidth=on?3.5:(n.boss?3:2); ctx.stroke();
      }
      if(n.boss){ ctx.beginPath(); ctx.arc(x,y,RR+7,0,TAU); ctx.strokeStyle=`rgba(${C.rose},0.5)`; ctx.lineWidth=1; ctx.stroke(); }
      if(n.fragile){ ctx.setLineDash([3,4]); ctx.beginPath(); ctx.arc(x,y,RR+6,0,TAU); ctx.strokeStyle=`rgba(${C.rose},0.8)`; ctx.lineWidth=1.2; ctx.stroke(); ctx.setLineDash([]); }
      if(n.decay){ ctx.beginPath(); ctx.arc(x,y,RR+6,0,TAU); ctx.strokeStyle=`rgba(${C.rose},0.45)`; ctx.lineWidth=1; ctx.stroke(); }
    }
    const ic = n.lit ? C.ink : C.bone;
    ctx.fillStyle=`rgba(${ic},0.9)`; ctx.strokeStyle=`rgba(${ic},0.9)`; ctx.lineWidth=2;
    if(n.lit && split && SET.cb){}
    else if(n.seq!=null) label(String(n.seq+1),x,y+1,ic,12);
    else if(n.chroma && !n.lit) label('A·B',x,y+1,C.bone,8);
    else if(n.coop && !n.lit) label('1·2',x,y+1,C.bone,8);
    else if(n.boss && !n.lit) label('4',x,y+1,C.rose,13);
    else if(n.battery){ ctx.beginPath(); ctx.moveTo(x-5,y); ctx.lineTo(x+5,y); ctx.moveTo(x,y-5); ctx.lineTo(x,y+5); ctx.stroke(); }
    else if(n.freq==='low'){ ctx.fillRect(x-4,y-4,8,8); }
    else if(n.freq==='high'){ ctx.beginPath(); ctx.moveTo(x,y-5); ctx.lineTo(x+5,y+4); ctx.lineTo(x-5,y+4); ctx.closePath(); ctx.stroke(); }
    else if(n.decay){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-5); ctx.moveTo(x,y); ctx.lineTo(x+4,y); ctx.stroke(); }
    else if(!n.lit){ ctx.beginPath(); ctx.arc(x,y,3,0,TAU); ctx.fill(); }
    for(const h of n.hits){
      const k=1-(tt-h.t)/G.win; if(k<=0) continue;
      const col = split ? (h.owner===2?C.p2:C.saffron) : (h.hue!=null&&chromaLvl) ? (h.hue===0?C.rose:C.p2) : h.kind==='chain'?C.saffron : h.kind==='prism'?C.rose : C.bone;
      ctx.beginPath(); ctx.moveTo(x+Math.cos(h.a)*(RR+4),y+Math.sin(h.a)*(RR+4)); ctx.lineTo(x+Math.cos(h.a)*(RR+4+18*k),y+Math.sin(h.a)*(RR+4+18*k));
      ctx.strokeStyle=`rgba(${col},${k})`; ctx.lineWidth=2.5; ctx.stroke();
    }
  }
}
let demoRings=[], demoT=0, demoNext=0;
function drawDemo(dt){
  demoT+=dt; ctx.drawImage(grid,0,0,W,H); if(reduce) return;
  if(demoT>demoNext){ demoRings.push({x:(0.2+Math.random()*0.6)*W,y:(0.1+Math.random()*0.4)*H,b:demoT,c:[C.bone,C.saffron,C.rose][Math.floor(Math.random()*3)]}); demoNext=demoT+0.9; }
  demoRings=demoRings.filter(r=>demoT-r.b<5);
  for(const r of demoRings){ const a=Math.max(0,1-(demoT-r.b)/5); ctx.beginPath(); ctx.arc(r.x,r.y,(demoT-r.b)*M*0.25,0,TAU); ctx.strokeStyle=`rgba(${r.c},${a*0.5})`; ctx.lineWidth=1.4; ctx.stroke(); }
}
