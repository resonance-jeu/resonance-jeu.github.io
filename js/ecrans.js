// Écrans : carte de la campagne, éditeur de grilles, réglages, menu, statistiques.
/* ---------- campagne : carte ---------- */
function renderCamp(){
  const wrap=$('campWorlds'); wrap.innerHTML='';
  const tot=campStars();
  $('campSum').textContent=`${t('camp_sum',{n:tot,m:WORLDS.length*30})} ${t('camp_sum2')}`;
  WORLDS.forEach((wd,w)=>{
    const open=worldOpen(w), sec=document.createElement('section'); sec.className='world'+(open?'':' locked');
    const st=Array.from({length:10},(_,i)=>CAMP[campKey(w,i)]||0).reduce((a,b)=>a+b,0);
    const h=document.createElement('h3'); h.textContent=`${w+1}. ${worldName(w)}`; const hs=document.createElement('span'); hs.textContent=`${st}/30 ★`; h.appendChild(hs);
    const p=document.createElement('p'); p.textContent=worldDesc(w);
    sec.append(h,p);
    const cells=document.createElement('div'); cells.className='cells';
    for(let i=0;i<10;i++){
      const s=CAMP[campKey(w,i)]||0, ok=gridOpen(w,i), b=document.createElement('button');
      b.className='cell'+(i===9?' boss':'')+(ok?'':' locked')+(s?' done':'');
      b.innerHTML=`${i===9?'G':i+1}<small>${s?'★'.repeat(s):''}</small>`;
      b.setAttribute('aria-label',[worldName(w), i===9?t('cp_boss'):t('cp_grid',{n:i+1}), s?t('cp_star',{n:s}):null, ok?null:t('cp_locked')].filter(Boolean).join(', '));
      if(ok) b.onclick=()=>playCamp(w,i); else b.disabled=true;
      cells.appendChild(b);
    }
    sec.appendChild(cells); wrap.appendChild(sec);
  });
}
function openCamp(){
  swap(()=>{ S.phase='menu'; G=null; hideAll(); renderCamp(); $('campView').hidden=false; $('campView').scrollTop=0; });
}
function playCamp(w,i){
  startAudio();
  swap(()=>{ hideAll(); S.mode='camp'; S.camp={w,i}; S.score=0; S.level=1; makeLevel(); });
}
$('closeCamp').onclick=()=>toMenu();

/* ---------- éditeur ---------- */
const TOOLS=['node','prism','wall','mirror','mud','portal','erase'];
const NODE_TYPES=[{need:2},{need:3},{need:2,battery:true},{need:2,freq:'high'},{need:2,freq:'low'},{need:2,fragile:true},{need:2,decay:6}];
let ED=null;
function blankDraft(){ return { targets:[], prisms:[], walls:[], muds:[], portals:[], pulses:3, _pend:null }; }
function loadDraft(){ const d=store.json('resonance.draft',null); return d?Object.assign(blankDraft(),d,{_pend:null}):blankDraft(); }
function saveDraft(){ const {_pend,...d}=ED.draft; store.set('resonance.draft',JSON.stringify(d)); }
function buildTools(){
  const bar=$('edTools'); bar.innerHTML='';
  TOOLS.forEach(id=>{ const b=document.createElement('button'); b.className='tool'+(ED.tool===id?' sel':''); b.textContent=t('tl_'+id);
    b.onclick=()=>{ ED.tool=id; ED.draft._pend=null; buildTools(); edTip(); }; bar.appendChild(b); });
}
function edTip(){
  const k = ED.tool==='portal' ? (ED.draft._pend?'et_portal_b':'et_portal_a') : 'et_'+ED.tool;
  const te=$('tip'); te.classList.remove('mid','strong'); te.classList.add('high'); te.textContent=t(k); te.hidden=false; te.style.opacity=1;
}
function edRefresh(){
  const d=ED.draft;
  d.pulses=Math.min(Math.max(d.pulses,1),20);
  $('pVal').textContent=d.pulses;
  $('edCount').textContent=t('ed_nodes',{n:d.targets.length});
  const env=makeEnv(); G=E.create(d, env, speedFor(env), 0.3);
  saveDraft();
}
function edTap(x,y){
  const d=ED.draft, env=G.env;
  const nx=(x-env.x0)/env.w, ny=(y-env.y0)/env.h;
  if(nx<0||nx>1||ny<0||ny>1) return;
  const cl=v=>Math.min(Math.max(v,0.04),0.96), q={nx:cl(nx),ny:cl(ny)};
  const near=(o,r=26)=>Math.hypot((o.nx-nx)*env.w,(o.ny-ny)*env.h)<r;
  const segNear=w=>{ const h=w.len*env.U/2, cx=w.nx*env.w, cy=w.ny*env.h, ax=cx-Math.cos(w.a)*h, ay=cy-Math.sin(w.a)*h, bx=cx+Math.cos(w.a)*h, by=cy+Math.sin(w.a)*h;
    const px=nx*env.w, py=ny*env.h, dx=bx-ax, dy=by-ay, k=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))); return Math.hypot(px-ax-k*dx,py-ay-k*dy)<20; };
  const tool=ED.tool;
  if(tool==='erase'){
    let i;
    if((i=d.targets.findIndex(o=>near(o)))>=0) d.targets.splice(i,1);
    else if((i=d.prisms.findIndex(o=>near(o)))>=0) d.prisms.splice(i,1);
    else if((i=d.portals.findIndex(p=>near(p.a)||near(p.b)))>=0) d.portals.splice(i,1);
    else if((i=d.walls.findIndex(segNear))>=0) d.walls.splice(i,1);
    else if((i=d.muds.findIndex(m=>near(m,m.r*env.U)))>=0) d.muds.splice(i,1);
  } else if(tool==='node'){
    const o=d.targets.find(o=>near(o));
    if(o){ const k=((o._k||0)+1)%NODE_TYPES.length;
      for(const kk of Object.keys(o)) if(kk!=='nx'&&kk!=='ny') delete o[kk];
      Object.assign(o,NODE_TYPES[k],{_k:k}); toast(t('nt')[k]); }
    else if(d.targets.length<14) d.targets.push({...q,need:2,_k:0});
    else toast(t('max_nodes'));
  } else if(tool==='prism'){ if(!d.prisms.some(o=>near(o))) d.prisms.push(q); }
  else if(tool==='wall'||tool==='mirror'){
    const w=d.walls.find(segNear);
    if(w) w.a=(w.a+Math.PI/6)%Math.PI;
    else d.walls.push({...q,a:0,len:0.3,mirror:tool==='mirror'});
  } else if(tool==='mud'){ if(d.muds.length<4) d.muds.push({...q,r:0.1}); else toast(t('max_mud')); }
  else if(tool==='portal'){
    if(d._pend){ d.portals.push({a:d._pend,b:q}); d._pend=null; } else if(d.portals.length<3) d._pend=q; else toast(t('max_portal'));
    edTip();
  }
  tone(SCALE[4],0.1,'triangle',0.025);
  edRefresh();
}
function encodeDraft(d){
  const r=v=>Math.round(v*1000);
  const o={ t:d.targets.map(x=>[r(x.nx),r(x.ny),x._k||0]), p:d.prisms.map(p=>[r(p.nx),r(p.ny)]),
    w:d.walls.map(w=>[r(w.nx),r(w.ny),Math.round(w.a*180/Math.PI),r(w.len),w.mirror?1:0]),
    m:d.muds.map(m=>[r(m.nx),r(m.ny),r(m.r)]), o:d.portals.map(p=>[r(p.a.nx),r(p.a.ny),r(p.b.nx),r(p.b.ny)]), n:d.pulses };
  return 'RSN1.'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function decodeDraft(code){
  const s=code.trim().replace(/\s+/g,''); if(!s.startsWith('RSN1.')) throw new Error('prefix');
  const o=JSON.parse(decodeURIComponent(escape(atob(s.slice(5))))); const v=x=>Math.min(Math.max(+x/1000||0,0),1);
  const d=blankDraft(), K=k=>Math.abs(k|0)%NODE_TYPES.length;
  d.targets=(o.t||[]).slice(0,14).map(([x,y,k])=>({nx:v(x),ny:v(y),...NODE_TYPES[K(k)],_k:K(k)}));
  d.prisms=(o.p||[]).slice(0,10).map(([x,y])=>({nx:v(x),ny:v(y)}));
  d.walls=(o.w||[]).slice(0,10).map(([x,y,a,l,m])=>({nx:v(x),ny:v(y),a:(+a||0)*Math.PI/180,len:Math.min(Math.max(v(l),0.05),0.6),mirror:!!m}));
  d.muds=(o.m||[]).slice(0,4).map(([x,y,r])=>({nx:v(x),ny:v(y),r:Math.min(Math.max(v(r),0.03),0.2)}));
  d.portals=(o.o||[]).slice(0,3).map(([a,b,c,e])=>({a:{nx:v(a),ny:v(b)},b:{nx:v(c),ny:v(e)}}));
  d.pulses=Math.min(Math.max(o.n|0,1),20);
  return d;
}
function openEditor(){
  startAudio();
  swap(()=>{
    hideAll(); S.mode='editor'; S.phase='edit'; TOP=90; BOT=70; S.marks=[]; S.hold=null;
    if(!ED) ED={ tool:'node', draft:loadDraft() };
    $('edTop').hidden=false; $('edTools').hidden=false;
    buildTools(); edTip(); edRefresh();
  });
}
$('pMinus').onclick=()=>{ ED.draft.pulses--; edRefresh(); };
$('pPlus').onclick=()=>{ ED.draft.pulses++; edRefresh(); };
$('edTest').onclick=()=>{
  if(!ED.draft.targets.length){ toast(t('need_node')); return; }
  award('editor');
  const {_pend,...d}=ED.draft; S.custom=JSON.parse(JSON.stringify(d));
  swap(()=>{ hideAll(); S.mode='custom'; S.score=0; S.level=1; makeLevel(); });
};
$('edCode').onclick=()=>{
  const code=encodeDraft(ED.draft); S.phase='over';
  showEnd({ kicker:t('code_k'), title:t('code_t'), msg:t('code_msg'),
    box:{ value:code, readOnly:false },
    btns:[ {label:t('copy'), keep:true, fn:(b)=>copyBox(b,$('shareBox').value)},
           {label:t('load'), keep:true, fn:(b)=>{ try{ ED.draft=decodeDraft($('shareBox').value); $('end').hidden=true; S.phase='edit'; edRefresh(); edTip(); toast(t('loaded')); }
             catch(e){ b.textContent=t('bad_code'); } }},
           {label:t('close'), ghost:true, fn:()=>{ S.phase='edit'; }} ] });
};

/* ---------- réglages ---------- */
function buildLangSeg(){
  const seg=$('langSeg'); seg.innerHTML='';
  LANGS.forEach(l=>{ const b=document.createElement('button'); b.dataset.v=l; b.textContent=I18N[l]._name; b.lang=l; seg.appendChild(b); });
}
function paintSettings(){
  document.querySelectorAll('#setView .seg').forEach(seg=>{
    const k=seg.dataset.k, cur=k==='speed'?String(SET.speed):k==='lang'?LANG:(SET[k]?'1':'0');
    seg.querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.v===cur); b.setAttribute('aria-pressed',b.dataset.v===cur?'true':'false'); });
  });
}
function bindSettings(){
  document.querySelectorAll('#setView .seg').forEach(seg=>{
    seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      const k=seg.dataset.k;
      if(k==='lang'){ SET.lang=b.dataset.v; LANG=SET.lang; applyLang(); refreshMenu(); }
      else SET[k]= k==='speed' ? +b.dataset.v : b.dataset.v==='1';
      store.set('resonance.settings',JSON.stringify(SET)); paintSettings();
      if(k==='cb'){ applyTheme(TH.id); refreshMenu(); }
      if(k==='sound' && SET.sound){ startAudio(); tone(SCALE[4],0.2,null,0.06); }
      if(k==='vib' && SET.vib) buzz(20);
    });
  });
}
$('openSet').onclick=()=>{ paintSettings(); $('setView').hidden=false; $('setView').scrollTop=0; };
$('closeSet').onclick=()=>{ $('setView').hidden=true; };

/* ---------- menu ---------- */
function refreshMenu(){
  const total=+store.get('resonance.total',0), tutoDone=store.get('resonance.tuto',null)!=null;
  $('mTuto').classList.toggle('primary',!tutoDone); $('mCamp').classList.toggle('primary',tutoDone);
  $('tutoLine').textContent = t(tutoDone?'tuto_done':'tuto_todo');
  $('campStars').textContent=`${campStars()}/${WORLDS.length*30}`;
  $('bestArcade').textContent=fmt(+store.get('resonance.best',0));
  refreshDay();
  const d=store.get('resonance.daily.'+TODAY,null), dl=$('dailyLine'), sr=Defi.serie('resonance',TD); dl.textContent='';
  dl.textContent = d==null ? t('daily_todo',{n:TD.n}) : t('daily_done',{n:TD.n,s:fmt(+d)});
  if(sr>0) dl.appendChild(flame(sr));
  $('puzCount').textContent=`${Math.min(+store.get('resonance.puzzle',0),PUZZLES.length)}/${PUZZLES.length}`;
  $('bestChrono').textContent=fmt(+store.get('resonance.chrono',0));
  $('bestSurv').textContent=`${store.get('resonance.surv',0)} s`;
  $('bestRhythm').textContent=fmt(+store.get('resonance.rhythm',0));
  $('bestMelody').textContent=fmt(+store.get('resonance.melody',0));
  $('bestCoop').textContent=store.get('resonance.coop',0);
  $('zenCount').textContent=fmt(+store.get('resonance.zen',0));
  $('totalLine').textContent=t('palettes',{n:fmt(total)});
  $('achCount').textContent=`${got.size}/${ACH.length}`;
  const sw=$('swatches'); sw.innerHTML='';
  THEMES.forEach((th,i)=>{
    const ok=total>=th.need, b=document.createElement('button');
    b.className='sw'+(th.id===TH.id?' sel':'')+(ok?'':' locked');
    b.setAttribute('aria-label', ok?t('theme_aria',{t:themeName(i)}):t('theme_lock',{t:themeName(i),n:th.need}));
    const sp=document.createElement('span'); sp.style.background=`conic-gradient(${th.acc} 0 33%,${th.rose} 0 55%,${th.bone} 0 70%,${th.ink} 0)`;
    b.append(sp, ok?themeName(i):fmt(th.need));
    b.onclick=()=>{ if(!ok) return; applyTheme(th.id); refreshMenu(); };
    sw.appendChild(b);
  });
}
function openStats(){
  saveStats();
  const prec = STATS.precN ? Math.round(STATS.precSum/STATS.precN*100)+' %' : '—';
  const items=[ ['st_waves',fmt(STATS.waves)], ['st_lit',fmt(STATS.lit)],
    ['st_chain',STATS.chain?'×'+STATS.chain:'—'], ['st_prec',prec],
    ['st_time',t('st_min',{n:Math.floor(STATS.playSec/60)})], ['st_batt',fmt(STATS.batt)],
    ['st_stars',`${campStars()}/${WORLDS.length*30}`], ['st_arcade',fmt(+store.get('resonance.best',0))] ];
  const g=$('statsGrid'); g.innerHTML='';
  items.forEach(([k,v])=>{ const d=document.createElement('div'); d.textContent=t(k); const b=document.createElement('b'); b.textContent=v; d.appendChild(b); g.appendChild(d); });
  $('achHead').textContent=t('ach_head',{n:got.size,m:ACH.length});
  const ul=$('achList'); ul.innerHTML='';
  ACH.forEach(id=>{ const [n,dsc]=achText(id); const li=document.createElement('li'); if(got.has(id)) li.className='on';
    const sp=document.createElement('span'); const b=document.createElement('b'); b.textContent=n; sp.append(b,' · '+dsc); li.append(document.createElement('i'),sp); ul.appendChild(li); });
  $('statsView').hidden=false; $('statsView').scrollTop=0;
}
$('openStats').onclick=openStats;
$('closeStats').onclick=()=>{ $('statsView').hidden=true; };
function hideAll(){
  ['hud','duelTop','duelBot','tip','end','menu','campView','setView','statsView','edTop','edTools','freezeBtn'].forEach(id=>$(id).hidden=true);
  hideBanner();
}
function toMenu(){
  saveBest(); saveStats(); beaconOff();
  swap(()=>{ S.phase='menu'; G=null; S.hold=null; hideAll(); refreshMenu(); $('menu').hidden=false; $('menu').scrollTop=0; });
}
function startMode(m){
  startAudio();
  swap(()=>{
    hideAll();
    S.mode=m; S.score=0; S.zenLit=0; S.grids=0; S.fails=0; S.levelDepth=0; S.melodyFails=0; S.survT=0;
    S.level = m==='puzzle' ? Math.max(1,Math.min(+store.get('resonance.puzzle',0)+1, PUZZLES.length)) : 1;
    if(m==='chrono') S.timeLeft=60;
    if(m==='daily'){ S.defi=Defi.today(); S.dailyRuns=[]; S.dailyStats=[]; S.dailyRetries=0; }
    makeLevel();
  });
}
const MODES={ mTuto:'tuto', mArcade:'arcade', mDaily:'daily', mPuzzle:'puzzle', mChrono:'chrono', mSurv:'surv', mRhythm:'rhythm', mMelody:'melody', mCoop:'coop', mDuel:'duel', mZen:'zen' };
for(const id in MODES) $(id).onclick=()=>startMode(MODES[id]);
$('mCamp').onclick=openCamp;
$('mEditor').onclick=openEditor;
$('toMenu').onclick=toMenu; $('toMenu2').onclick=toMenu; $('toMenu3').onclick=toMenu;
