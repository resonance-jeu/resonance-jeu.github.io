// Déroulé d'une partie : tirs (entrées), événements du moteur, modes à vagues, victoire/défaite.
/* ---------- entrées ---------- */
function ownerAt(y){ return SPLIT.includes(S.mode) ? (y<H/2?2:1) : 0; }
function fire(x,y,freq){
  const owner=ownerAt(y);
  const freeze=S.freezeArmed;
  if(freeze){ S.freezeArmed=false; S.freezes--; }
  else if(S.mode==='duel'){ if(S.pp[owner]<=0) return; S.pp[owner]--; }
  else { if(S.pulses<=0) return; S.pulses--; }
  let tag=null;
  if(S.mode==='rhythm' && S.rh){ const d=Math.min(Math.abs(G.t-S.rh.lastBeat), Math.abs(S.rh.next-G.t)); if(d<=0.09){ tag='beat'; S.marks.push({x,y:y-14,t:G.t,txt:t('mk_beat')}); } }
  S.tapLog.push({ s:G.stepN, nx:(x-G.env.x0)/G.env.w, ny:(y-G.env.y0)/G.env.h, f:freq||null, z:freeze?1:0 });
  E.tap(G,x,y,owner,freq,{tag,freeze});
  S.marks.push({x,y,t:G.t,owner});
  if(S.mode==='tuto') S.tutoTaps++;
  STATS.waves++; if(STATS.waves>=1000) award('waves1000');
  tone((S.mode==='zen'?SCALE[Math.floor(Math.random()*5)]:SCALE[0])*(freq==='low'?0.25:0.5),0.2,'triangle',0.05); buzz(8);
  const tp=$('tip'); if(!tp.hidden && S.mode!=='tuto') tp.style.opacity=0.35;
  renderHud();
}
function beaconAt(x,y){ if(!G) return -1; const R=nodeR(); return G.beacons.findIndex(b=>Math.hypot(b.x-x,b.y-y)<R*1.8); }
function beaconOn(i,owner,id){
  const b=G.beacons[i]; if(b.active) return;
  if(S.mode==='duel'){ if(S.pp[owner]<=0) return; S.pp[owner]--; } else { if(S.pulses<=0) return; S.pulses--; }
  b.active=true; b.next=G.t; b.owner=owner; S.bhold={id,i,t0:G.t};
  S.tapLog.push({ s:G.stepN, b:i, on:1 }); renderHud();
}
function beaconOff(){
  if(!S.bhold||!G) return; const b=G.beacons[S.bhold.i]; if(b) b.active=false;
  S.tapLog.push({ s:G.stepN, b:S.bhold.i, on:0 }); S.bhold=null;
}
cv.addEventListener('pointerdown',e=>{
  if(S.mode==='editor'&&S.phase==='edit'){ e.preventDefault(); return edTap(e.clientX,e.clientY); }
  if(S.phase!=='play'||S.mode==='replay'||!G) return;
  e.preventDefault();
  const bi=beaconAt(e.clientX,e.clientY);
  if(bi>=0 && !S.freezeArmed){ beaconOn(bi,ownerAt(e.clientY),e.pointerId); return; }
  if(G.hasFreq && !S.freezeArmed){ S.hold={x:e.clientX,y:e.clientY,t0:performance.now(),id:e.pointerId}; return; }
  fire(e.clientX,e.clientY,null);
});
const release=e=>{
  if(S.bhold && e.pointerId===S.bhold.id){ beaconOff(); return; }
  if(!S.hold||e.pointerId!==S.hold.id) return;
  const h=S.hold; S.hold=null;
  if(S.phase!=='play'||!G) return;
  fire(h.x,h.y,(performance.now()-h.t0)/1000>=HOLD?'low':'high');
};
cv.addEventListener('pointerup',release); cv.addEventListener('pointercancel',release);
// armer le gel ne coûte rien : la charge est consommée au tir
$('freezeBtn').onclick=()=>{ if(S.phase!=='play') return; if(S.freezeArmed) S.freezeArmed=false; else if(S.freezes>0) S.freezeArmed=true; renderHud(); };

/* ---------- événements moteur ---------- */
function onEvent(type,nd){
  if(type==='light'){
    const d=nd.depth, m=S.mode;
    let note = m==='zen' ? SCALE[Math.floor(Math.random()*SCALE.length)] : SCALE[Math.min(d+2,SCALE.length-1)];
    if(m==='melody') note=nd.note;
    tone(note,0.7,null,0.09); tone(note*1.5,0.5,null,0.035,0.06); buzz(d>1?[12,30,12]:15);
    STATS.lit++; STATS.chain=Math.max(STATS.chain,d);
    if(nd.spread!=null){ STATS.precSum+=Math.max(0,1-nd.spread/G.win); STATS.precN++; if(nd.spread<0.015) award('perfect'); }
    award('first'); if(d>=3) award('chain3'); if(d>=5) award('chain5'); if(d>=7) award('chain7');
    if(nd.need===3) award('triple'); if(nd.byVia) award('mirror'); if(nd.byPortal) award('portal');
    if(nd.battery && S.max!==Infinity && m!=='duel'){ S.pulses++; S.max=Math.max(S.max,S.pulses); STATS.batt++; if(STATS.batt>=10) award('batt10'); S.marks.push({x:nd.x,y:nd.y+18,t:G.t,txt:t('mk_pulse')}); }
    let wrong=false;
    if(m==='melody'){
      if(nd.seq===S.expect){ S.expect++; }
      else {
        wrong=true; S.melodyFails++; S.expect=0;
        G.targets.forEach(o=>{ o.lit=false; o.hits=[]; });
        S.marks.push({x:nd.x,y:nd.y,t:G.t,txt:t('mk_wrong'),bad:true}); tone(120,0.5,'sawtooth',0.04);
      }
    }
    if(m==='surv'){ S.pulses=Math.min(S.pulses+1,S.max); }
    let gain=0;
    if(['arcade','daily','replay','surv','melody','custom','camp','coop','rhythm'].includes(m) && !wrong) gain=100*d;
    else if(m==='chrono') gain=d>1?100*(d-1):0;
    else if(m==='zen'){ S.zenLit++; const z=+store.get('resonance.zen',0)+1; store.set('resonance.zen',z); if(z>=100) award('zen100'); }
    if(m==='rhythm' && nd.onBeat){ gain*=2; S.rh.onBeat++; if(S.rh.onBeat>=10) award('beat10'); }
    if(gain){ S.score+=gain; if(!['replay','custom'].includes(m)) addTotal(gain); S.marks.push({x:nd.x,y:nd.y,t:G.t,txt:`+${fmt(gain)}`}); }
    if(m==='daily') S.levelDepth=Math.max(S.levelDepth,d);
    renderHud();
  } else if(type==='prism'){ tone(SCALE[7],0.25,'triangle',0.035); }
  else if(type==='portal'){ tone(SCALE[9],0.2,'sine',0.03); tone(SCALE[6],0.2,'sine',0.03,0.05); }
  else if(type==='delay'){ tone(SCALE[3],0.15,'triangle',0.025); }
  else if(type==='echo'){ tone(SCALE[3],0.3,'triangle',0.04); }
  else if(type==='beacon'){ tone(SCALE[2],0.15,'triangle',0.035); buzz(6); }
  else if(type==='freeze'){ award('freeze'); tone(SCALE[10],0.3,'sine',0.03); S.marks.push({x:nd.x,y:nd.y,t:G.t,txt:t('mk_frozen')}); }
  else if(type==='arm'){ tone(SCALE[5],0.2,'triangle',0.03); }
  else if(type==='break'){ tone(110,0.5,'sawtooth',0.04); buzz([20,40,20]); S.marks.push({x:nd.x,y:nd.y,t:G.t,txt:t('mk_broken'),bad:true}); }
  else if(type==='fade'){ tone(140,0.4,'triangle',0.04); S.marks.push({x:nd.x,y:nd.y,t:G.t,txt:t('mk_off'),bad:true}); }
}

/* ---------- déroulé ---------- */
function banner(big,small){ const b=$('banner'); b.textContent=big; if(small){ const s=document.createElement('small'); s.textContent=small; b.appendChild(s); } b.classList.add('show'); }
function hideBanner(){ $('banner').classList.remove('show'); }

function spawnNode(minD,extra){
  const env=G.env, R=nodeR();
  for(let k=0;k<60;k++){
    const nd=Object.assign({nx:0.05+Math.random()*0.9, ny:0.05+Math.random()*0.9, need:2},extra||{});
    const p=E.pos(G,nd);
    if(G.targets.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>minD*env.U) && G.prisms.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>R*3)){ return E.addTarget(G,nd); }
  }
  return null;
}
function survTick(){
  const before=Math.floor(S.survT*4);
  S.survT+=STEP; if(S.survT>=60) award('surv60');
  G.targets=G.targets.filter(x=>!(x.lit && G.t-x.litT>2.2));
  S.spawnT-=STEP;
  if(S.spawnT<=0){
    S.spawnT=Math.max(1.1, 3.2-S.survT*0.025);
    if(spawnNode(0.16,{need:Math.random()<Math.min(0.1+S.survT/300,0.35)?3:2})) tone(SCALE[1],0.15,'triangle',0.025);
  }
  if(Math.floor(S.survT*4)!==before) renderHud();
  const off=G.targets.filter(x=>!x.lit).length;
  if(off>=8 || (S.pulses<=0 && !E.active(G))) endSurv();
}
function rhythmTick(){
  const rh=S.rh;
  if(G.t>=rh.next){
    rh.lastBeat=rh.next; rh.next+=rh.beat; rh.n++; rh.flash=G.t;
    if(S.pulses<S.max){ S.pulses++; renderHud(); }
    if(rh.n%2===1) kick(); osc(6200,0.04,'square',0.012,0);
    const bass=[0,0,4,3][Math.floor(rh.n/2)%4]; if(rh.n%2===1) osc(SCALE[bass]*0.25,0.35,'triangle',0.06,0);
    // la cadence d'apparition double après une minute
    if(rh.n%(rh.n>100?1:2)===0 && G.targets.filter(x=>!x.lit).length<6){ const nd=spawnNode(0.18); if(nd) nd.expire=G.t+rh.beat*6; }
  }
  G.targets=G.targets.filter(x=>{
    if(x.lit) return G.t-x.litT<1.5;
    if(x.expire && G.t>x.expire){ rh.lives--; S.marks.push({x:x.x,y:x.y,t:G.t,txt:t('mk_miss'),bad:true}); tone(130,0.3,'triangle',0.05); renderHud(); return false; }
    return true;
  });
  if(rh.lives<=0) endRhythm();
}

function campClear(){
  const {w,i}=S.camp, k=campKey(w,i), left=S.pulses;
  const need3=Math.ceil(S.max*0.35);
  const stars = left>=need3 ? 3 : left>=1 ? 2 : 1;
  if(!CAMP[k] || stars>CAMP[k]) CAMP[k]=stars; store.set('resonance.camp',JSON.stringify(CAMP));
  addTotal(100*stars);
  if(i===9 && w===0) award('world1'); if(i===9 && w===WORLDS.length-1) award('camp'); if(campStars()>=100) award('stars100');
  S.phase='over';
  const next = i<9 ? {w,i:i+1} : (w<WORLDS.length-1 ? {w:w+1,i:0} : null);
  showEnd({ kicker:`${worldName(w)} · ${i===9?t('cp_boss'):t('cp_grid',{n:i+1})}`, title:'★'.repeat(stars)+'☆'.repeat(3-stars),
    msg: stars===3 ? t('cp_3') : t('cp_keep',{n:need3}),
    btns:[ ...(next?[{label:t(i===9?'next_sea':'next_grid'), fn:()=>playCamp(next.w,next.i)}]:[]),
           {label:t('replay'), ghost:true, fn:()=>playCamp(w,i)}, {label:t('map'), ghost:true, fn:openCamp} ] });
}

function checkState(){
  const m=S.mode;
  if(S.bhold && G.t-S.bhold.t0>5) beaconOff();
  if(m==='surv') return survTick();
  if(m==='rhythm') return rhythmTick();
  if(m==='chrono'){ S.timeLeft-=STEP; if(S.timeLeft<=0){ S.timeLeft=0; return endChrono(); } }
  if(E.allLit(G) && (m!=='melody' || S.expect>=G.targets.length)){
    S.phase='clear'; S.clearT=G.t; beaconOff();
    [0,0.08,0.16].forEach((d,i)=>tone(SCALE[4+i*2],0.7,null,0.06,d));
    if(m==='zen'){ banner(t('bn_harmony'),t('bn_newgrid')); return; }
    if(m==='chrono'){ S.score+=200; addTotal(200); banner('+200',t('bn_gridfull')); return; }
    if(m==='camp') return campClear();
    if(m==='tuto'){ banner(t('bn_step',{n:S.level}), t(S.level<TUTO.length?'bn_next':'bn_tutodone')); return; }
    if(m==='puzzle'){
      const solved=+store.get('resonance.puzzle',0); if(S.level>solved){ store.set('resonance.puzzle',S.level); addTotal(300); }
      if(S.fails===0) award('puz1'); if(+store.get('resonance.puzzle',0)>=PUZZLES.length) award('puzall');
      banner(t('bn_solved'), t('bn_puz',{k:S.level,n:S.fails+1})); return;
    }
    if(m==='duel') return endDuel();
    if(m==='custom'){ S.phase='over'; const u=S.max-S.pulses;
      return showEnd({ kicker:t('cu_k'), title:t('cu_ok'), msg:`${t('cu_used',{n:u,m:S.max})} ${t('e_score',{n:S.score})}`,
        btns:[ {label:t('to_editor'), fn:openEditor}, {label:t('replay'), ghost:true, fn:()=>{ S.score=0; makeLevel(); }} ] }); }
    if(m==='melody'){
      if(S.melodyFails===0) award('melody');
      const bonus=S.pulses*50; S.score+=bonus; addTotal(bonus); saveBest();
      banner(t('bn_melody',{n:S.level}), S.melodyFails?t('bn_wrongs',{n:S.melodyFails}):t('bn_clean'));
      playMelody(); return;
    }
    const bonus=S.pulses*50; S.score+=bonus; if(m!=='replay') addTotal(bonus);
    if(m==='arcade' && S.pulses>=S.max/2) award('thrift');
    if(m==='daily'){ S.dailyRuns[S.level-1]=S.tapLog.slice(); S.dailyStats[S.level-1]={used:S.max-S.pulses,max:S.max,chain:S.levelDepth||1}; }
    const head = m==='daily'||m==='replay' ? `${S.level} / 6` : m==='coop' ? t('bn_coop',{n:S.level}) : t('bn_level',{n:S.level});
    banner(head, m==='replay'?t('bn_replay'):bonus?t('bn_kept',{n:bonus}):t('bn_full'));
    saveBest(); renderHud(); return;
  }
  if(E.active(G)) return;
  if(m==='duel'){ if(S.pp[1]<=0&&S.pp[2]<=0) endDuel(); return; }
  if(m==='tuto'){
    const need=TUTO[S.level-1].hints.length;
    if((S.pulses===Infinity && S.tutoTaps>=Math.max(need,1)) || S.pulses<=0){ S.phase='retry'; S.clearT=G.t; banner(t('bn_almost'),t('bn_retry')); }
    return;
  }
  if(S.pulses>0) return;
  if(m==='puzzle'){ S.phase='retry'; S.clearT=G.t; S.fails++; banner(t('bn_missed'),t('bn_retry')); tone(150,0.4,'triangle',0.05); return; }
  if(m==='replay'){ S.phase='clear'; S.clearT=G.t; return; }
  S.phase='over'; saveBest();
  const left=G.targets.filter(x=>!x.lit).length, nodesTxt=t('e_left',{n:left});
  if(m==='custom') return showEnd({ kicker:t('cu_k'), bad:true, title:t('cu_fail'), msg:`${nodesTxt} ${t('cu_fail_msg')}`,
    btns:[ {label:t('retry'), fn:()=>{ S.score=0; makeLevel(); }}, {label:t('to_editor'), ghost:true, fn:openEditor} ] });
  if(m==='camp') return showEnd({ kicker:worldName(S.camp.w), bad:true, title:t('e_silence'), msg:nodesTxt,
    btns:[ {label:t('retry'), fn:()=>playCamp(S.camp.w,S.camp.i)}, {label:t('map'), ghost:true, fn:openCamp} ] });
  showEnd({ kicker:t('e_nopulse'), bad:true, title:t('e_silence'), msg:`${nodesTxt} ${t('e_score',{n:S.score})}`,
    btns:[ {label:t('replay_lvl'), fn:()=>{ S.score=S.levelStartScore; if(S.mode==='daily') S.dailyRetries++; S.levelDepth=0; S.melodyFails=0; makeLevel(); }},
           {label:t('menu'), ghost:true, fn:toMenu} ] });
  tone(130,0.6,'triangle',0.07);
}
function playMelody(){ [...G.targets].sort((a,b)=>a.seq-b.seq).forEach((x,i)=>tone(x.note,0.5,'sine',0.06,0.5+i*0.22)); }
function afterClear(){
  const m=S.mode, el=G.t-S.clearT;
  if(S.phase==='retry'){ if(el>0.9){ hideBanner(); makeLevel(); } return; }
  if(el < (m==='chrono'?0.7:m==='melody'?2.6:1.6)) return;
  hideBanner();
  if(m==='chrono'){ S.grids++; S.level++; return makeLevel(); }
  if(m==='daily' && S.level>=6) return endDaily();
  if(m==='replay' && S.level>=6) return endReplay();
  if(m==='puzzle' && S.level>=PUZZLES.length) return endPuzzles();
  if(m==='tuto' && S.level>=TUTO.length) return endTuto();
  S.level++; S.levelDepth=0; S.fails=0; S.melodyFails=0; makeLevel();
}
function saveBest(){
  const keys={arcade:'resonance.best',chrono:'resonance.chrono',melody:'resonance.melody',rhythm:'resonance.rhythm'};
  const k=keys[S.mode]; if(k && S.score>+store.get(k,0)) store.set(k,S.score);
  if(S.mode==='coop' && S.level>+store.get('resonance.coop',0)) store.set('resonance.coop',S.level);
}
