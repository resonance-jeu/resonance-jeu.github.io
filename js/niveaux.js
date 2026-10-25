// État de la partie, génération des grilles, construction des niveaux, conseils, HUD.
/* ---------- état ---------- */
let G=null;
const S={ mode:'arcade', level:1, score:0, levelStartScore:0, pulses:0, max:0, pp:[0,0,0], ppMax:0,
  phase:'menu', clearT:0, acc:0, marks:[], timeLeft:0, grids:0, fails:0, zenLit:0, levelDepth:0,
  tapLog:[], dailyRuns:[], dailyStats:[], dailyRetries:0, replay:null, layout:null,
  survT:0, spawnT:0, expect:0, melodyFails:0, custom:null, hold:null, bhold:null,
  freezes:0, freezeArmed:false, camp:null, tutoTaps:0, rh:null };
const seen=new Set();

const SQUARE=['puzzle','editor','custom','tuto'];
const FIXED=['puzzle','daily','replay','camp','tuto','custom','editor'];
const SPLIT=['duel','coop'];
function square(){ return SQUARE.includes(S.mode); }
function makeEnv(){
  if(square()){
    const top = S.mode==='editor' ? 110 : TOP, bot = S.mode==='editor' ? 80 : (S.mode==='tuto'?120:BOT);
    const side=Math.min(W-32, H-top-bot-24);
    return { x0:(W-side)/2, y0:top+(H-top-bot-side)/2, w:side, h:side, U:side };
  }
  return { x0:28, y0:TOP, w:W-56, h:H-TOP-BOT, U:M };
}
const speedFor=env=> (square() ? env.U*0.42 : Math.max(env.U*0.42,160)) * (FIXED.includes(S.mode)?1:SET.speed);
const nodeR=()=>Math.max(13,(G?G.env.U:M)*0.032);

/* ---------- génération de grilles ---------- */
function featuresFor(L,o){
  const off={ n:4, walls:0, mirror:false, prisms:0, mud:0, twins:false, fragile:false, battery:false, freq:false, decay:false, portal:false,
    jam:false, drift:false, triples:0, currents:0, chroma:false, delay:false, beacon:false, boss:false, freeze:false, speedL:10 };
  if(o.F) return Object.assign(off,o.F);
  const wantPortal = L>=12 && (L%2===0 || L>=16);
  return Object.assign(off,{ n:o.n||Math.min(3+Math.floor((L-1)/2),10),
    walls:o.noWalls?0:(L>=3?Math.min(1+Math.floor((L-3)/2),4):0), mirror:L>=6&&!wantPortal, prisms:L>=5?(L>=8?2:1):0,
    mud:o.noMud?0:(L>=11?2:(L>=7?1:0)), twins:L>=8&&!o.noTwins, fragile:L>=9&&!o.noFragile, battery:L>=4&&!o.noBattery,
    freq:L>=13&&!o.noFreq, decay:L>=15&&!o.noDecay, portal:wantPortal&&!o.noPortal, jam:L>=14&&!o.noJam, drift:L>=6&&!o.noDrift,
    triples:L>=4?Math.min(0.15+L*0.02,0.4):0, currents:(L>=16&&!o.noCurrents)?1:0, chroma:L>=17&&!o.noChroma, delay:L>=18&&!o.noDelay,
    beacon:L>=19&&!o.noBeacon, freeze:L>=16&&!o.noFreeze, speedL:L });
}
function genLevel(L,rng,o={}){
  const F=featuresFor(L,o);
  const env=makeEnv(), R=Math.max(13,env.U*0.032), rand=(a,b)=>a+rng()*(b-a);
  const P=q=>({x:env.x0+q.nx*env.w, y:env.y0+q.ny*env.h});
  const dist=(a,b)=>{ const p=P(a), q=P(b); return Math.hypot(p.x-q.x,p.y-q.y); };
  const T=[]; let tries=0;
  if(F.boss) T.push({nx:0.5,ny:0.5,need:4,boss:true});
  const n=F.n+(F.boss?1:0);
  while(T.length<n && tries<4000){ tries++;
    const nd={nx:rand(0.05,0.95),ny:rand(0.05,0.95),need:2};
    if(T.every(q=>dist(q,nd)>(q.boss?0.28:0.2)*env.U)) T.push(nd); }
  const free=()=>T.filter(x=>x.need===2&&!x.boss&&x.twin==null&&!x.fragile&&!x.battery&&!x.freq&&!x.decay&&!x.chroma);
  if(F.twins && T.length>=4){ const f=free(); if(f.length>=2){ f[0].twin=T.indexOf(f[1]); f[1].twin=T.indexOf(f[0]); } }
  if(F.fragile){ const f=free(); if(f.length) f[f.length-1].fragile=true; }
  if(F.battery && rng()<0.55){ const f=free(); if(f.length) f[0].battery=true; }
  if(F.freq){ const f=free(); const k=Math.floor(rng()*2); f.slice(0,Math.min(3,f.length)).forEach((x,i)=>x.freq=(i+k)%2?'low':'high'); }
  if(F.decay){ const f=free(); if(f.length) f[f.length-1].decay=6; }
  if(F.chroma){ const f=free(); f.slice(0,Math.min(2,f.length)).forEach(x=>x.chroma=true); }
  if(F.triples) free().forEach(x=>{ if(rng()<F.triples) x.need=3; });
  if(F.drift) T.forEach(x=>{ if(x.boss) return; const sp=Math.min(0.01+F.speedL*0.0012,0.026), a=rand(0,TAU); x.vx=Math.cos(a)*sp; x.vy=Math.sin(a)*sp; });
  const drift=T.some(x=>x.vx);
  const ends=w=>{ const c=P(w), h=w.len*env.U/2; return [c.x-Math.cos(w.a)*h,c.y-Math.sin(w.a)*h,c.x+Math.cos(w.a)*h,c.y+Math.sin(w.a)*h]; };
  const dSeg=(px,py,e)=>{ const [ax,ay,bx,by]=e, dx=bx-ax, dy=by-ay; const k=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))); return Math.hypot(px-ax-k*dx,py-ay-k*dy); };
  const Wl=[]; tries=0;
  while(Wl.length<F.walls && tries<4000){ tries++;
    const w={nx:rand(0.1,0.9),ny:rand(0.1,0.9),a:rand(0,Math.PI),len:rand(0.22,0.34)}; const e=ends(w);
    if(Math.min(e[0],e[2])<20||Math.max(e[0],e[2])>W-20||Math.min(e[1],e[3])<TOP-10||Math.max(e[1],e[3])>H-BOT) continue;
    if(T.some(x=>{const p=P(x);return dSeg(p.x,p.y,e)<(drift?R*4.5:x.boss?R*4:R*2.8);})) continue;
    if(Wl.some(q=>dist(q,w)<0.25*env.U)) continue;
    Wl.push(w); }
  if(F.mirror && Wl.length) Wl[0].mirror=true;
  const okSpot=(q,rad)=>{ const c=P(q);
    if(T.some(x=>{const p=P(x);return Math.hypot(p.x-c.x,p.y-c.y)<rad+R*2+(drift?0.12*env.U:0);})) return false;
    if(Wl.some(w=>dSeg(c.x,c.y,ends(w))<rad+12)) return false; return true; };
  const Md=[]; tries=0;
  while(Md.length<F.mud && tries<4000){ tries++;
    const m={nx:rand(0.12,0.88),ny:rand(0.12,0.88),r:rand(0.09,0.12)};
    if(!okSpot(m,m.r*env.U)) continue;
    if(Md.some(q=>dist(q,m)<(q.r+m.r)*env.U+20)) continue; Md.push(m); }
  const spotFree=(p,minT=0.14)=>{
    if(T.some(x=>dist(x,p)<minT*env.U)) return false;
    if(Wl.some(w=>{const c=P(p);return dSeg(c.x,c.y,ends(w))<R*2.5;})) return false;
    if(Md.some(m=>dist(m,p)<m.r*env.U+R)) return false; return true; };
  const Pr=[]; const np=Math.max(F.prisms, F.chroma?2:0); tries=0;
  while(Pr.length<np && tries<4000){ tries++;
    const p={nx:rand(0.08,0.92),ny:rand(0.08,0.92)};
    if(!spotFree(p) || Pr.some(q=>dist(q,p)<0.25*env.U)) continue; Pr.push(p); }
  if(F.chroma) Pr.forEach((p,i)=>p.hue=i%2);
  const others=[...Pr];
  const Po=[]; if(F.portal){ tries=0;
    while(!Po.length && tries<4000){ tries++;
      const a={nx:rand(0.08,0.92),ny:rand(0.08,0.92)}, b={nx:rand(0.08,0.92),ny:rand(0.08,0.92)};
      if(dist(a,b)<0.45*env.U) continue;
      if(![a,b].every(q=>okSpot(q,R)&&spotFree(q)&&!others.some(p=>dist(p,q)<0.15*env.U))) continue;
      Po.push({a,b}); others.push(a,b); } }
  const place=(minD)=>{ for(let k=0;k<4000;k++){ const p={nx:rand(0.08,0.92),ny:rand(0.08,0.92)}; if(spotFree(p) && !others.some(q=>dist(q,p)<minD*env.U)){ others.push(p); return p; } } return null; };
  const Dl=[]; if(F.delay){ const p=place(0.18); if(p) Dl.push(p); }
  const Bc=[]; if(F.beacon){ const p=place(0.2); if(p) Bc.push({...p,period:0.7}); }
  const Jm=[]; if(F.jam){ const a=rand(0,TAU), sp=0.03; Jm.push({nx:rand(0.3,0.7),ny:rand(0.3,0.7),r:0.05,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp}); }
  const Cu=[]; for(let k=0;k<F.currents;k++){ const a=rand(0,TAU), sp=0.05; Cu.push({nx:rand(0.25,0.75),ny:rand(0.25,0.75),r:0.16,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp}); }
  return { targets:T, walls:Wl, prisms:Pr, muds:Md, portals:Po, jammers:Jm, currents:Cu, delays:Dl, beacons:Bc, freeze:F.freeze };
}
function budget(Ly){
  const T=Ly.targets;
  const base=T.length+1+T.filter(x=>x.need===3).length+(T.some(x=>x.boss)?2:0)+(T.some(x=>x.twin!=null)?1:0)
    +T.filter(x=>x.fragile||x.decay).length+((Ly.jammers||[]).length?1:0)+((Ly.currents||[]).length?1:0)+(T.some(x=>x.chroma)?1:0);
  const echo=(Ly.walls||[]).filter(w=>w.mirror).length*2+((Ly.portals||[]).length?2:0)+Math.max(0,(Ly.prisms||[]).length-1)+((Ly.delays||[]).length?1:0);
  return Math.max(Math.ceil(T.length*0.6)+1, base-echo);
}

/* ---------- niveaux ---------- */
function makeLevel(){
  const m=S.mode; let Ly;
  TOP = m==='duel' ? 70 : 90; BOT = 70;
  if(m==='puzzle') Ly=PUZZLES[S.level-1];
  else if(m==='custom') Ly=S.custom;
  else if(m==='tuto') Ly=JSON.parse(JSON.stringify(TUTO[S.level-1].L));
  else if(m==='camp'){ const {w,i}=S.camp; const F=WORLDS[w].F(i); if(i===9){ F.boss=true; F.n+=1; } Ly=genLevel(10,mulberry32(9000+w*100+i),{F}); }
  else if(m==='daily'||m==='replay') Ly=genLevel(DAILY_LEVELS[S.level-1], mulberry32(Defi.seed('resonance',(S.defi||TD).key,S.level)));
  else if(m==='zen') Ly=genLevel(3+(S.level%5), Math.random, {noDrift:true,noFragile:true,noDecay:true});
  else if(m==='chrono') Ly=genLevel(Math.min(3+S.grids,9), Math.random, {noDrift:true,noFragile:true,noTwins:true});
  else if(m==='duel') Ly=genLevel(7, Math.random, {n:9,noDrift:true,noFragile:true,noTwins:true,noMud:true,noBattery:true});
  else if(m==='coop'){ Ly=genLevel(S.level+1, Math.random, {noDrift:S.level<8,noFragile:true,noTwins:true,noFreq:true,noBeacon:true,noChroma:true}); Ly.targets.forEach(x=>x.coop=true); }
  else if(m==='surv') Ly=genLevel(5, Math.random, {n:3,noDrift:true,noFragile:true,noTwins:true,noMud:true,noBattery:true,noWalls:true});
  else if(m==='rhythm') Ly=genLevel(5, Math.random, {n:2,noDrift:true,noFragile:true,noTwins:true,noMud:true,noBattery:true,noWalls:true});
  else if(m==='melody'){
    const n=Math.min(3+S.level,8);
    Ly=genLevel(Math.min(2+S.level,9), Math.random, {n,noDrift:true,noFragile:true,noTwins:true,noBattery:true,noMud:true});
    const order=[...Ly.targets.keys()].sort(()=>Math.random()-0.5);
    const pent=[0,1,2,4,5,7,8,9]; let note=Math.floor(Math.random()*3);
    order.forEach((ti,k)=>{ const x=Ly.targets[ti]; x.seq=k; x.need=2; x.note=SCALE[pent[note]]; note=Math.max(0,Math.min(7,note+[-1,1,1,2,-2][Math.floor(Math.random()*5)])); });
  }
  else Ly=genLevel(S.level, Math.random);
  S.layout=Ly;
  const env=makeEnv();
  const win = m==='zen'?0.34 : ['puzzle','duel','chrono','surv','melody','custom','tuto','coop','rhythm','camp'].includes(m)?0.3 : Math.max(0.3-(effL()-1)*0.012,0.18);
  G=E.create(Ly, env, speedFor(env), win);
  if(m==='melody') G.targets.forEach((x,i)=>x.note=Ly.targets[i].note);
  S.acc=0; S.marks=[]; S.tapLog=[]; S.levelStartScore=S.score; S.expect=0; S.hold=null; S.bhold=null; S.tutoTaps=0; S.freezeArmed=false;
  S.freezes = Ly.freeze ? 2 : 0;
  if(m==='zen'||m==='chrono'){ S.max=S.pulses=Infinity; }
  else if(m==='rhythm'){ S.max=S.pulses=3; }
  else if(m==='tuto'){ S.max=S.pulses=TUTO[S.level-1].pulses||Infinity; }
  else if(m==='puzzle'){ S.max=S.pulses=1; }
  else if(m==='custom'){ S.max=S.pulses=Ly.pulses||budget(Ly); }
  else if(m==='surv'){ S.max=12; S.pulses=8; S.spawnT=0; }
  else if(m==='melody'){ S.max=S.pulses=Ly.targets.length*2; }
  else if(m==='coop'){ S.max=S.pulses=budget(Ly)+2; }
  else if(m==='duel'){ S.ppMax=Math.ceil(Ly.targets.length*0.8)+1; S.pp=[0,S.ppMax,S.ppMax]; S.max=S.pulses=0; }
  else { S.max=S.pulses=budget(Ly); }
  if(m==='rhythm'){ S.rh={ beat:0.6, lives:5, next:0.6, n:0, flash:-9, lastBeat:0, onBeat:0 }; }
  if(m==='arcade'){ if(S.level>=10) award('arc10'); if(S.level>=20) award('arc20'); }
  if(m==='coop' && S.level>=5) award('coop5');
  S.phase='play';
  showTip(Ly);
  renderHud();
}
function effL(){ return S.mode==='daily'||S.mode==='replay' ? DAILY_LEVELS[S.level-1] : S.level; }
function showTip(Ly){
  const T=Ly.targets; let txt='', mid=false, strong=false;
  const once=k=>{ if(!txt && !seen.has(k)){ seen.add(k); txt=tip(k); } };
  if(S.mode==='tuto'){ txt=t('tuto')[S.level-1]; strong=true; }
  if(S.mode==='puzzle') once('puzzle');
  if(S.mode==='duel'){ once('duel'); mid=true; }
  if(S.mode==='coop'){ once('coop'); mid=true; }
  if(S.mode==='chrono') once('chrono');
  if(S.mode==='surv') once('surv');
  if(S.mode==='rhythm') once('rhythm');
  if(S.mode==='melody') once('melody');
  if(S.mode==='camp' && T.some(x=>x.boss)) once('boss');
  if(!['replay','tuto'].includes(S.mode)){
    if(S.level===1 && ['arcade','daily','zen'].includes(S.mode)) once('base');
    if((Ly.beacons||[]).length) once('beacon');
    if((Ly.delays||[]).length) once('delay');
    if(T.some(x=>x.chroma)) once('chroma');
    if((Ly.currents||[]).length) once('currents');
    if(T.some(x=>x.freq)) once('freq');
    if((Ly.portals||[]).length) once('portal');
    if((Ly.jammers||[]).length) once('jam');
    if(T.some(x=>x.battery)) once('battery');
    if(T.some(x=>x.decay)) once('decay');
    if(Ly.walls.some(w=>w.mirror)) once('mirror');
    if(Ly.walls.some(w=>!w.mirror)) once('walls');
    if(Ly.prisms.length) once('prisms');
    if((Ly.muds||[]).length) once('mud');
    if(T.some(x=>x.twin!=null)) once('twin');
    if(T.some(x=>x.fragile)) once('fragile');
    if(T.some(x=>x.need===3)) once('triple');
    if(T.some(x=>x.vx)) once('drift');
  }
  const te=$('tip'); te.classList.toggle('mid',mid); te.classList.toggle('high',S.mode==='tuto'||S.freezes>0); te.classList.toggle('strong',strong);
  if(txt){ te.textContent=txt; te.hidden=false; te.style.opacity=1; } else te.hidden=true;
}
function dots(el,n,max){
  el.innerHTML='';
  for(let i=0;i<max;i++){ const d=document.createElement('i'); if(i<n) d.className='on'; el.appendChild(d); }
}
function renderHud(){
  const m=S.mode, duel=m==='duel';
  $('hud').hidden=duel; $('duelTop').hidden=$('duelBot').hidden=!duel;
  const fb=$('freezeBtn'); fb.hidden=!(S.freezes>0||S.freezeArmed); $('freezeN').textContent=S.freezes; fb.classList.toggle('armed',S.freezeArmed);
  if(duel){
    const own=k=>G.targets.filter(x=>x.lit&&x.owner===k).length;
    $('d1').textContent=own(1); $('d2').textContent=own(2);
    dots($('dp1'),S.pp[1],S.ppMax); dots($('dp2'),S.pp[2],S.ppMax); return;
  }
  $('lvlLabel').textContent=t('lb_'+m);
  let lv=S.level;
  if(m==='daily'||m==='replay') lv=`${S.level}/6`;
  else if(m==='puzzle') lv=`${S.level}/${PUZZLES.length}`;
  else if(m==='tuto') lv=`${S.level}/${TUTO.length}`;
  else if(m==='chrono') lv=Math.ceil(S.timeLeft);
  else if(m==='surv') lv=`${Math.floor(S.survT)} s`;
  else if(m==='custom') lv='—';
  else if(m==='camp') lv=`${S.camp.w+1}·${S.camp.i===9?'G':S.camp.i+1}`;
  else if(m==='rhythm') lv=S.rh?S.rh.lives:5;
  $('lvl').textContent=lv;
  const el=$('pulses');
  if(S.max===Infinity) el.innerHTML='<span class="inf">∞</span>'; else dots(el,S.pulses,S.max);
  $('scoreLabel').textContent = t(m==='zen'?'sc_nodes' : m==='puzzle'?'sc_try' : m==='surv'?'sc_off' : m==='tuto'?'sc_step' : 'sc_score');
  $('score').textContent = m==='zen'?S.zenLit : m==='puzzle'?S.fails+1 : m==='surv'?`${G.targets.filter(x=>!x.lit).length}/8` : m==='tuto'?S.level : fmt(S.score);
}
function addTotal(n){
  if(n<=0) return; const tot=+store.get('resonance.total',0)+n; store.set('resonance.total',tot);
  if(tot>=THEMES[1].need) award('palette');
}
