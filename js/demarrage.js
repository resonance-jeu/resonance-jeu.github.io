// Boucle d'animation et démarrage (chargé en dernier) : initialisation, bouton retour Android, écran d'accueil.
/* ---------- boucle ---------- */
let last=performance.now();
function frame(nowT){
  const dt=Math.min((nowT-last)/1000,0.05); last=nowT;
  if(S.phase==='menu'||!G){ drawDemo(dt); requestAnimationFrame(frame); return; }
  if(S.mode==='editor'){ draw(); requestAnimationFrame(frame); return; }
  if(S.phase==='play'){ STATS.playSec+=dt; if(++statsDirty>600) saveStats(); }
  S.acc+=dt*(S.mode==='replay'?2:1);
  let guard=0;
  while(S.acc>=STEP && guard++<40){
    S.acc-=STEP;
    if(S.phase==='over') continue;
    if(S.mode==='replay' && S.phase==='play'){
      const taps=S.replay.runs[S.level-1]||[];
      for(const tp of taps){ if(tp.done || tp.s>G.stepN) continue; tp.done=true;
        if(tp.b!=null){ const b=G.beacons[tp.b]; if(b){ if(tp.on){ if(S.pulses>0) S.pulses--; b.active=true; b.next=G.t; } else b.active=false; } continue; }
        const x=G.env.x0+tp.nx*G.env.w, y=G.env.y0+tp.ny*G.env.h;
        if(tp.z){ S.freezes--; } else if(S.pulses>0) S.pulses--;
        E.tap(G,x,y,0,tp.f||null,{freeze:!!tp.z}); S.marks.push({x,y,t:G.t}); tone(SCALE[0]*0.5,0.2,'triangle',0.04); renderHud(); }
      if(taps.every(tp=>tp.done)) S.pulses=0;
    }
    E.step(G,STEP,onEvent);
    if(S.phase==='play') checkState();
    else if(S.phase==='clear'||S.phase==='retry') afterClear();
    if(!G) break;
  }
  if(G){ if(S.mode==='chrono'&&S.phase==='play') $('lvl').textContent=Math.ceil(S.timeLeft); draw(); }
  else drawDemo(dt);
  requestAnimationFrame(frame);
}
addEventListener('pagehide',saveStats);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveStats(); else if(S.phase==='menu') refreshMenu(); });

$('othersList').append(...AUTRES_JEUX.map(j=>{ const a=document.createElement('a'); a.className='mode other'; a.href=j.url; a.target='_blank'; a.rel='noopener';
  a.innerHTML='<strong>'+j.nom+' <span aria-hidden="true">↗</span></strong><small data-i="'+j.d+'"></small>'; return a; }));
buildLangSeg(); bindSettings(); applyLang();
applyTheme(store.get('resonance.theme','seiche'));
if(+store.get('resonance.total',0) < TH.need) applyTheme('seiche');
addEventListener('resize',resize); resize();
refreshMenu();
// bouton retour d'Android : ferme l'écran ouvert, sinon revient au menu ; renvoie false au menu pour quitter
window.resonanceBack=()=>{
  for(const id of ['statsView','setView']) if(!$(id).hidden){ $(id).hidden=true; return true; }
  if(!$('campView').hidden){ toMenu(); return true; }
  if(S.phase==='menu' && !$('menu').hidden) return false;
  toMenu(); return true;
};
const sp=$('splash');
const leave=()=>{ if(sp.classList.contains('hide')) return; sp.classList.add('hide'); $('menu').hidden=false; setTimeout(()=>{ sp.hidden=true; }, reduce?0:500); };
sp.addEventListener('pointerdown',()=>{ startAudio(); leave(); });
setTimeout(leave, reduce?200:1600);
requestAnimationFrame(frame);
