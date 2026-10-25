// Écrans de fin de partie, partage du Défi du jour (texte et image), transitions.
/* ---------- fins de partie ---------- */
function endTuto(){
  S.phase='over'; store.set('resonance.tuto',1); award('tuto');
  showEnd({ kicker:t('tu_k'), title:t('tu_t'), msg:t('tu_msg'),
    btns:[ {label:t('m_camp'), fn:openCamp}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function endChrono(){
  S.phase='over'; const prev=+store.get('resonance.chrono',0); saveBest();
  if(S.score>=3000) award('chrono3k');
  showEnd({ kicker:t('ch_k'), title: t(S.score>prev?'t_record':'t_end'),
    msg:`${t('e_score',{n:S.score})} ${t('ch_grids',{n:S.grids})} ${t('rec',{n:Math.max(prev,S.score)})}`,
    btns:[ {label:t('replay'), fn:()=>startMode('chrono')}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function endRhythm(){
  S.phase='over'; const prev=+store.get('resonance.rhythm',0); saveBest();
  showEnd({ kicker:t('rh_k'), bad:true, title: t(S.score>prev?'t_record':'rh_t'),
    msg:`${t('e_score',{n:S.score})} ${t('rh_beats',{n:S.rh.onBeat})} ${t('rec',{n:Math.max(prev,S.score)})}`,
    btns:[ {label:t('replay'), fn:()=>startMode('rhythm')}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function endSurv(){
  S.phase='over'; const sec=Math.floor(S.survT), prev=+store.get('resonance.surv',0);
  if(sec>prev) store.set('resonance.surv',sec);
  showEnd({ kicker:t('sv_k'), bad:true, title: t(sec>prev?'t_record':'sv_t'),
    msg:`${t('sv_msg',{n:sec})} ${t('e_score',{n:S.score})} ${t('sv_rec',{n:Math.max(prev,sec)})}`,
    btns:[ {label:t('replay'), fn:()=>startMode('surv')}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function endDuel(){
  S.phase='over'; award('duel');
  const a=G.targets.filter(x=>x.lit&&x.owner===1).length, b=G.targets.filter(x=>x.lit&&x.owner===2).length;
  renderHud();
  showEnd({ kicker:t('dl_k'), title:t(a===b?'dl_tie':a>b?'dl_p1':'dl_p2'), msg:`${t('dl_a',{n:a})} ${t('dl_b',{n:b})}`,
    btns:[ {label:t('rematch'), fn:()=>startMode('duel')}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function endPuzzles(){
  S.phase='over';
  showEnd({ kicker:t('pz_k'), title:t('pz_t'), msg:t('pz_msg',{n:PUZZLES.length}),
    btns:[ {label:t('restart'), fn:()=>{ store.set('resonance.puzzle',0); startMode('puzzle'); }}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function copyBox(btn,text){
  const box=$('shareBox'); box.value=text; box.hidden=false; box.focus(); box.select();
  const done=()=>btn.textContent=t('copied'), fail=()=>btn.textContent=t('selected');
  try{ navigator.clipboard.writeText(text).then(done,fail); }catch(e){ fail(); }
}
function shareText(td,streak){
  // 6 niveaux, 2 par ligne : defi.js limite la grille à 5 lignes
  const lv=[], lines=[];
  S.dailyStats.forEach((s,i)=>{ if(!s) return; lv.push(`${i+1} ${'🟧'.repeat(s.used)}${'⬜'.repeat(Math.max(0,s.max-s.used))}${s.chain>1?' '+t('sh_chain',{n:s.chain}):''}`); });
  for(let i=0;i<lv.length;i+=2) lines.push(lv.slice(i,i+2).join('  '));
  return Defi.shareText({ nom:'Résonance', n:td.n, emoji:'〰️', score:fmt(S.score), lignes:lines,
    detail:dayLabel(td.key)+(S.dailyRetries?' · '+t('sh_retries',{n:S.dailyRetries}):''), serie:streak, libelleSerie:t('sh_streak',{n:'{0}'}), url:SHARE_URL });
}
function shareResult(text){
  const st=$('shareStatus'); st.textContent='';
  Defi.share(text).then(r=>{
    if(!r) return;
    st.textContent=t(r==='partage'?'st_shared':r==='copie'?'st_copied':'st_manual');
    if(r==='manuel'){ const b=$('shareBox'); b.value=text; b.readOnly=true; b.hidden=false; $('shareLbl').hidden=false; b.focus(); b.select(); }
  });
}
// carte image 1080×1920 préparée dès l'écran de fin : le clic partage tout de suite (le partage natif exige un geste récent)
function shareCard(td,streak){
  const cs=getComputedStyle(document.documentElement), v=k=>cs.getPropertyValue('--'+k).trim();
  return ShareCard.render(document,{ kicker:dayLabel(td.key), titre:t('m_daily')+' #'+td.n, scoreLbl:t('score'), score:fmt(S.score),
    niveaux:S.dailyStats.map(s=>s&&{used:s.used,max:s.max,extra:s.chain>1?t('sh_chain',{n:s.chain}):''}),
    serie:streak>=2?t('sh_streak',{n:streak}):'', url:SHARE_URL,
    couleurs:{ink:v('ink'),bone:v('bone'),acc:v('saffron'),rose:v('rose'),dust:v('dust'),p2:v('p2')} });
}
function shareImage(card,text,td){
  const st=$('shareStatus'); st.textContent='';
  card.then(c=>ShareCard.share(c,text,'resonance-defi-'+td.n+'.png')).then(r=>{
    if(r==='partage'||r==='telechargement') st.textContent=t(r==='partage'?'st_shared':'st_saved');
    else if(r==='echec') shareResult(text); // image impossible : on garde au moins le texte
  },()=>shareResult(text));
}
function endDaily(){
  S.phase='over'; award('daily');
  const td=S.defi||TD, key='resonance.daily.'+td.key, prev=+store.get(key,-1);
  if(S.score>prev){ store.set(key,S.score); store.set('resonance.dailyrun.'+td.key, JSON.stringify({v:VERSION,score:S.score,runs:S.dailyRuns})); }
  const run=store.json('resonance.dailyrun.'+td.key,null);
  const st=Defi.record('resonance',td,S.score,''), text=shareText(td,st.count);
  Defi.record('resonance',td,S.score,text);
  const card=shareCard(td,st.count); card.catch(()=>{});
  showEnd({ kicker:t('dy_k',{d:dayLabel(td.key)}), title:t('dy_t'), msg:`${t('e_score',{n:S.score})} ${t('dy_best',{n:Math.max(prev,S.score)})}`,
    btns:[ {label:t('share_res'), keep:true, fn:()=>{ award('share'); shareResult(text); }},
           {label:t('share_img'), keep:true, ghost:true, fn:()=>{ award('share'); shareImage(card,text,td); }},
           ...(run&&run.v===VERSION?[{label:t('watch'), ghost:true, fn:startReplay}]:[]),
           {label:t('menu'), ghost:true, fn:toMenu} ] });
  const pv=$('sharePrev'); pv.querySelector('pre').textContent=text; pv.hidden=false;
  pv.setAttribute('aria-label',t('a_sum',{d:td.n,s:fmt(S.score),n:st.count}));
  const ex=$('endExtra'), nx=untilNext(Defi.today().key); ex.textContent=''; // jour réel : un défi lancé la veille ne doit pas afficher 0 h 00
  ex.append(flame(st.count),t('dy_streak',{n:st.count,b:st.best})+'\n'+t('dy_next',nx)); ex.hidden=false;
}
function startReplay(){
  const run=store.json('resonance.dailyrun.'+(S.defi||TD).key,null);
  if(!run||run.v!==VERSION){ toMenu(); return; }
  S.mode='replay'; S.replay=run; S.level=1; S.score=0;
  $('end').hidden=true; $('menu').hidden=true; makeLevel();
}
function endReplay(){
  S.phase='over';
  showEnd({ kicker:t('rp_k'), title:t('rp_t'), msg:t('rp_msg',{n:S.replay.score}),
    btns:[ {label:t('watch_again'), fn:startReplay}, {label:t('menu'), ghost:true, fn:toMenu} ] });
}
function showEnd({kicker,bad,title,msg,btns,box}){
  $('endKicker').textContent=kicker; $('endKicker').style.color=bad?'var(--rose)':'var(--saffron)';
  $('endTitle').textContent=title; $('endMsg').textContent=msg;
  const sb=$('shareBox'); sb.hidden=!box; if(box){ sb.readOnly=!!box.readOnly; sb.value=box.value||''; }
  $('sharePrev').hidden=true; $('endExtra').hidden=true; $('shareLbl').hidden=true; $('shareStatus').textContent='';
  const row=$('endBtns'); row.innerHTML='';
  btns.forEach(b=>{ const el=document.createElement('button'); el.className='btn'+(b.ghost?' ghost':''); el.textContent=b.label;
    el.onclick=()=>{ startAudio(); if(!b.keep) $('end').hidden=true; b.fn(el); }; row.appendChild(el); });
  $('freezeBtn').hidden=true;
  $('end').hidden=false; $('end').scrollTop=0;
}

/* ---------- transitions ---------- */
function swap(fn){
  const f=$('fade');
  if(reduce){ fn(); return; }
  f.classList.add('on'); setTimeout(()=>{ fn(); f.classList.remove('on'); },220);
}
