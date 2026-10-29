// Socle : canvas, stockage local, réglages, palettes, langue, écran, audio, date du défi, données campagne/tutoriel/succès.
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
const lay=document.createElement('canvas'), lctx=lay.getContext('2d');
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } },
              set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
              json(k,d){ try{ const v=JSON.parse(this.get(k,'null')); return v==null?d:v; }catch(e){ return d; } } };
const STEP=1/120, HOLD=0.25, VERSION=6;
const SET=Object.assign({ sound:true, vib:true, speed:1, cb:false, lang:null }, store.json('resonance.settings',{}));
LANG = LANGS.includes(SET.lang) ? SET.lang : detectLang();

/* ---------- palettes ---------- */
const THEMES=[
  { id:'seiche', need:0,     ink:'#13100e', bone:'#efe3cf', acc:'#f2a541', rose:'#d9776b', dust:'#8a7d6c', p2:'#6fc2c0', wave:'sine',     base:1,    light:false },
  { id:'abysse', need:3000,  ink:'#0a1417', bone:'#d3eaec', acc:'#ff8a65', rose:'#a89bff', dust:'#62848a', p2:'#f2c14e', wave:'sine',     base:0.75, light:false },
  { id:'braise', need:8000,  ink:'#170c0a', bone:'#f5ddd0', acc:'#ff6b3d', rose:'#ffcf5a', dust:'#a26f60', p2:'#7fc8ff', wave:'triangle', base:1,    light:false },
  { id:'lichen', need:15000, ink:'#0f1411', bone:'#e2e8d8', acc:'#d8c65a', rose:'#c98bd6', dust:'#748271', p2:'#ef8f6f', wave:'sine',     base:1.25, light:false },
  { id:'papier', need:30000, ink:'#f1ebe0', bone:'#1d1a17', acc:'#c2410c', rose:'#2f6f8f', dust:'#71685e', p2:'#7a3e9d', wave:'triangle', base:1.5,  light:true }
];
const themeName=i=>t('themes')[i];
const rgb=h=>{ const n=parseInt(h.slice(1),16); return `${n>>16&255},${n>>8&255},${n&255}`; };
let TH=THEMES[0], C={};
function applyTheme(id){
  TH=THEMES.find(x=>x.id===id)||THEMES[0];
  const acc=SET.cb?'#E69F00':TH.acc, rose=SET.cb?'#CC79A7':TH.rose, p2=SET.cb?'#56B4E9':TH.p2;
  const s=document.documentElement.style;
  s.setProperty('--ink',TH.ink); s.setProperty('--bone',TH.bone); s.setProperty('--saffron',acc);
  s.setProperty('--rose',rose); s.setProperty('--dust',TH.dust); s.setProperty('--p2',p2);
  s.setProperty('color-scheme',TH.light?'light':'dark');
  C={ ink:rgb(TH.ink), bone:rgb(TH.bone), saffron:rgb(acc), rose:rgb(rose), dust:rgb(TH.dust), p2:rgb(p2) };
  store.set('resonance.theme',TH.id);
  if(W) buildGrid();
}

/* ---------- langue ---------- */
function applyLang(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i]').forEach(el=>{ el.textContent=t(el.dataset.i); });
  document.querySelectorAll('[data-ia]').forEach(el=>{ el.setAttribute('aria-label',t(el.dataset.ia)); });
  TODAY_LABEL=dayLabel(TODAY);
}

/* ---------- écran ---------- */
let W=0,H=0,M=0,DPR=1,TOP=90,BOT=70,grid=null;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2); W=innerWidth; H=innerHeight; M=Math.min(W,H);
  cv.width=lay.width=W*DPR; cv.height=lay.height=H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0); lctx.setTransform(DPR,0,0,DPR,0,0);
  buildGrid();
  if(G){ G.env=makeEnv(); G.speed=speedFor(G.env); E.layout(G); }
}
function buildGrid(){
  grid=document.createElement('canvas'); grid.width=W*DPR; grid.height=H*DPR;
  const g=grid.getContext('2d'); g.setTransform(DPR,0,0,DPR,0,0);
  g.fillStyle=TH.ink; g.fillRect(0,0,W,H);
  const step=Math.max(22,M/16); g.fillStyle=`rgba(${C.dust},0.2)`;
  for(let y=step/2;y<H;y+=step) for(let x=step/2;x<W;x+=step) g.fillRect(x-0.75,y-0.75,1.5,1.5);
  const rg=g.createRadialGradient(W/2,H*0.55,0,W/2,H*0.55,Math.hypot(W,H)*0.6);
  rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,TH.light?'rgba(80,60,40,0.12)':'rgba(0,0,0,0.55)');
  g.fillStyle=rg; g.fillRect(0,0,W,H);
}

/* ---------- audio ---------- */
let AC=null;
const SCALE=[261.6,293.7,329.6,392,440,523.3,587.3,659.3,784,880,1046.5];
function osc(f,d,type,v,delay){
  if(!AC||!SET.sound) return;
  const t0=AC.currentTime+(delay||0), o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t0);
  g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(v,t0+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+d+0.05); return o;
}
function tone(f,d=0.25,type,v=0.08,delay=0){ osc(f*TH.base,d,type||TH.wave,v,delay); }
function kick(){ const o=osc(120,0.25,'sine',0.22,0); if(o){ o.frequency.exponentialRampToValueAtTime(42,AC.currentTime+0.2); } }
function buzz(ms){ if(!SET.vib) return; try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} }
function startAudio(){ try{ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); AC.resume&&AC.resume(); }catch(e){} }

/* ---------- aléa & date ---------- */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let x=Math.imul(a^a>>>15,1|a); x=x+Math.imul(x^x>>>7,61|x)^x; return ((x^x>>>14)>>>0)/4294967296; }; }
// le jour change à minuit heure de Paris pour tout le monde (defi.js) ; une partie du défi garde son jour (S.defi)
let TD=Defi.today(), TODAY=TD.key, TODAY_LABEL='';
function dayLabel(key){ const [y,m,d]=key.split('-').map(Number); return new Date(Date.UTC(y,m-1,d,12)).toLocaleDateString(LOCALES[LANG],{day:'numeric',month:'long',timeZone:'UTC'}); }
function refreshDay(){ TD=Defi.today(); TODAY=TD.key; TODAY_LABEL=dayLabel(TODAY); }
function untilNext(key){ const [y,m,d]=key.split('-').map(Number); let c=Date.UTC(y,m-1,d+1)-7200000; if(Defi.parisDate(c).key===key) c+=3600000;
  const ms=Math.max(0,c-Date.now()); return { h:Math.floor(ms/3600000), m:String(Math.floor(ms%3600000/60000)).padStart(2,'0') }; }
const SHARE_URL='https://resonance-jeu.github.io/';
// liens des autres jeux : à remplacer par le lien Play Store quand l'appli sera publiée
const AUTRES_JEUX=[{nom:'ÉCHO',d:'o_echo',url:'https://echo-jeu.github.io/'},{nom:'LUMEN',d:'o_lumen',url:'https://lumen-jeu.github.io/'},{nom:'Fragments',d:'o_frag',url:'https://fragments-jeu.github.io/'}];
function flame(n){ const f=document.createElement('span'); f.className='flame'; f.setAttribute('aria-label',t('a_streak',{n}));
  f.innerHTML='<svg viewBox="0 0 9 12" aria-hidden="true"><path d="M4.6 0C5 2.4 8.6 4 8.6 7.6A4.1 4.1 0 0 1 .4 7.6C.4 5.6 1.7 4.4 2.5 3.4c.1 1.3.7 2.1 1.5 2.4C3.6 3.9 3.9 1.9 4.6 0z"/></svg>';
  f.append(String(n)); return f; }
const DAILY_LEVELS=[2,4,7,10,12,14];

/* ---------- campagne ---------- */
const WORLDS=[
  { F:i=>({ n:3+Math.floor(i/2), triples:i>=6?0.25:0, battery:i>=4 }) },
  { F:i=>({ n:4+Math.floor(i/3), walls:1+Math.floor(i/4), prisms:i>=2?1:0, mirror:i>=5, triples:0.2, battery:true }) },
  { F:i=>({ n:5+Math.floor(i/3), walls:1, mud:1, twins:i>=3, fragile:i>=6, drift:i>=8, prisms:1, triples:0.2 }) },
  { F:i=>({ n:5+Math.floor(i/3), walls:1, currents:1, portal:i>=3, freq:i>=5, jam:i>=7, freeze:true, prisms:1 }) },
  { F:i=>({ n:5+Math.floor(i/3), walls:2, chroma:true, delay:i>=3, beacon:i>=5, decay:i>=7, prisms:2, drift:i>=6, freeze:true }) }
];
const worldName=w=>t('worlds')[w][0], worldDesc=w=>t('worlds')[w][1];
const CAMP=store.json('resonance.camp',{});
const campKey=(w,i)=>`${w}-${i}`;
const campStars=()=>Object.values(CAMP).reduce((a,b)=>a+b,0);
const worldOpen=w=> w===0 || !!CAMP[campKey(w-1,9)];
const gridOpen=(w,i)=> worldOpen(w) && (i===0 || !!CAMP[campKey(w,i-1)]);

/* ---------- tutoriel ---------- */
const TUTO=[
  { L:{ targets:[{nx:.5,ny:.5}] }, hints:[[.2,.5],[.8,.5]] },
  { L:{ targets:[{nx:.3,ny:.35}] }, hints:[[.3,.95],[.75,.35]] },
  { L:{ targets:[{nx:.3,ny:.35},{nx:.7,ny:.75}] }, hints:[[.1,.35],[.5,.35],[.7,.2]] },
  { L:{ targets:[{nx:.5,ny:.9}], prisms:[{nx:.25,ny:.5},{nx:.75,ny:.5}], walls:[{nx:.5,ny:.5,a:0,len:.2}] }, hints:[[.5,.1]] },
  { L:{ targets:[{nx:.25,ny:.3},{nx:.75,ny:.3},{nx:.5,ny:.75}] }, hints:[], pulses:5 }
];

/* ---------- statistiques & succès ---------- */
const STATS=Object.assign({ waves:0, lit:0, chain:0, precSum:0, precN:0, playSec:0, batt:0 }, store.json('resonance.stats',{}));
let statsDirty=0;
function saveStats(){ store.set('resonance.stats',JSON.stringify(STATS)); statsDirty=0; }
const ACH=['tuto','first','chain3','chain5','chain7','perfect','triple','mirror','portal','freeze','batt10','world1','camp','stars100','arc10','arc20','thrift',
  'daily','share','puz1','puzall','chrono3k','surv60','beat10','melody','coop5','duel','zen100','editor','palette','waves1000'];
const achText=id=>(I18N[LANG].ach&&I18N[LANG].ach[id])||I18N.en.ach[id];
const got=new Set(store.json('resonance.ach',[]));
let toastTimer=0;
function toast(msg,ms){ const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),ms||1400); }
function award(id){
  if(got.has(id)) return; got.add(id); store.set('resonance.ach',JSON.stringify([...got]));
  toast(t('ach_toast',{n:achText(id)[0]}),2600);
  tone(SCALE[8],0.4,'triangle',0.04); tone(SCALE[10],0.5,'triangle',0.03,0.08);
}
