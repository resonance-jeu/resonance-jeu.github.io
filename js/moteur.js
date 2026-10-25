/*ENGINE*/
const TAU=Math.PI*2, K_MUD=2.2, ANG=0.6;
const angDiff=(a,b)=>{ let d=Math.abs(a-b)%TAU; return d>Math.PI?TAU-d:d; };
const E = {
  pos(G,o){ return { x:G.env.x0+o.nx*G.env.w, y:G.env.y0+o.ny*G.env.h }; },
  mkTarget(t){
    return { nx:t.nx, ny:t.ny, need:t.need||2, twin:(t.twin==null?null:t.twin), fragile:!!t.fragile, vx:t.vx||0, vy:t.vy||0,
      freq:t.freq||null, battery:!!t.battery, decay:t.decay||0, seq:(t.seq==null?null:t.seq), chroma:!!t.chroma, coop:!!t.coop, boss:!!t.boss,
      hits:[], lit:false, litT:0, depth:0, owner:0, dirs:0, armedT:null, frozenUntil:0 };
  },
  layout(G){
    for(const w of G.walls){ const c=E.pos(G,w), h=w.len*G.env.U/2; w.e=[c.x-Math.cos(w.a)*h,c.y-Math.sin(w.a)*h,c.x+Math.cos(w.a)*h,c.y+Math.sin(w.a)*h]; }
    for(const m of [...G.muds,...G.jammers,...G.currents]){ const c=E.pos(G,m); m.x=c.x; m.y=c.y; m.rr=m.r*G.env.U; }
    for(const o of [...G.prisms,...G.gates,...G.targets,...G.delays,...G.beacons]){ const c=E.pos(G,o); o.x=c.x; o.y=c.y; }
  },
  create(L, env, speed, win){
    const gates=[];
    for(const p of (L.portals||[])){ const a={nx:p.a.nx,ny:p.a.ny,lastT:-9}, b={nx:p.b.nx,ny:p.b.ny,lastT:-9}; a.mate=b; b.mate=a; gates.push(a,b); }
    const G={ env, speed, win, t:0, stepN:0, rings:[], gates, pending:[],
      targets:L.targets.map(E.mkTarget),
      walls:(L.walls||[]).map(w=>({ nx:w.nx, ny:w.ny, a:w.a, len:w.len, mirror:!!w.mirror })),
      prisms:(L.prisms||[]).map(p=>({ nx:p.nx, ny:p.ny, lastT:-9, hue:(p.hue==null?null:p.hue) })),
      muds:(L.muds||[]).map(m=>({ nx:m.nx, ny:m.ny, r:m.r })),
      jammers:(L.jammers||[]).map(j=>({ nx:j.nx, ny:j.ny, r:j.r, vx:j.vx||0, vy:j.vy||0 })),
      currents:(L.currents||[]).map(c=>({ nx:c.nx, ny:c.ny, r:c.r, vx:c.vx, vy:c.vy })),
      delays:(L.delays||[]).map(d=>({ nx:d.nx, ny:d.ny, lastT:-9 })),
      beacons:(L.beacons||[]).map(b=>({ nx:b.nx, ny:b.ny, active:false, next:0, period:b.period||0.7, owner:0 })) };
    G.drift = G.targets.some(t=>t.vx||t.vy) || G.jammers.length>0 || G.currents.length>0;
    G.hasFreq = G.targets.some(t=>t.freq);
    E.layout(G); return G;
  },
  addTarget(G,t){ const o=E.mkTarget(t), c=E.pos(G,o); o.x=c.x; o.y=c.y; G.targets.push(o); return o; },
  inter(ax,ay,bx,by,cx,cy,dx,dy){
    const d=(bx-ax)*(dy-cy)-(by-ay)*(dx-cx); if(Math.abs(d)<1e-9) return null;
    const u=((cx-ax)*(dy-cy)-(cy-ay)*(dx-cx))/d, v=((cx-ax)*(by-ay)-(cy-ay)*(bx-ax))/d;
    return (u>1e-3&&u<1-1e-3&&v>=0&&v<=1) ? { x:ax+u*(bx-ax), y:ay+u*(by-ay) } : null;
  },
  blocked(G,ax,ay,bx,by,except){
    for(const w of G.walls){ if(w===except) continue; const e=w.e; if(E.inter(ax,ay,bx,by,e[0],e[1],e[2],e[3])) return true; }
    return false;
  },
  segCirc(ax,ay,bx,by,cx,cy,r){
    const dx=bx-ax, dy=by-ay, L2=dx*dx+dy*dy; const k=L2?Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/L2)):0;
    return Math.hypot(ax+k*dx-cx, ay+k*dy-cy) < r;
  },
  mudOverlap(G,ox,oy,px,py){
    const dx=px-ox, dy=py-oy, d=Math.hypot(dx,dy); if(!d) return 0;
    const ux=dx/d, uy=dy/d; let s=0;
    for(const m of G.muds){
      const fx=ox-m.x, fy=oy-m.y, b=fx*ux+fy*uy, c=fx*fx+fy*fy-m.rr*m.rr, disc=b*b-c;
      if(disc<=0) continue; const q=Math.sqrt(disc);
      const t1=Math.max(-b-q,0), t2=Math.min(-b+q,d); if(t2>t1) s+=t2-t1;
    }
    return s;
  },
  eff(G,r,px,py){
    const d=Math.hypot(px-r.x,py-r.y);
    return (r.via||!G.muds.length) ? d : d+(K_MUD-1)*E.mudOverlap(G,r.x,r.y,px,py);
  },
  reach(G,r,px,py){
    let ax=r.x, ay=r.y;
    if(r.via){
      const e=r.via.e, X=E.inter(r.x,r.y,px,py,e[0],e[1],e[2],e[3]);
      if(!X || E.blocked(G,X.x,X.y,px,py,r.via)) return false; ax=X.x; ay=X.y;
    } else if(E.blocked(G,ax,ay,px,py,null)) return false;
    for(const j of G.jammers) if(E.segCirc(ax,ay,px,py,j.x,j.y,j.rr)) return false;
    return true;
  },
  ring(G,x,y,kind,src,depth,owner,freq,portaled,ex){
    ex=ex||{};
    const mk=(x,y,via)=>({ x, y, r:0, kind, src, depth, owner, freq:freq||null, portaled:!!portaled, via, trig:new Set(),
      hue:(ex.hue==null?null:ex.hue), tag:ex.tag||null, freeze:!!ex.freeze, delayed:!!ex.delayed });
    const out=[mk(x,y,null)];
    for(const w of G.walls){
      if(!w.mirror) continue;
      const [ax,ay,bx,by]=w.e, dx=bx-ax, dy=by-ay, t=((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy);
      const px=ax+t*dx, py=ay+t*dy; if(Math.hypot(x-px,y-py)<2) continue;
      out.push(mk(2*px-x, 2*py-y, w));
    }
    const extra = 0.25*G.env.U + (G.drift?0.35*G.env.U:0);
    for(const r of out){
      let m=0;
      for(const o of G.targets) m=Math.max(m,E.eff(G,r,o.x,o.y));
      for(const o of G.prisms) m=Math.max(m,E.eff(G,r,o.x,o.y));
      for(const o of G.gates) m=Math.max(m,E.eff(G,r,o.x,o.y));
      for(const o of G.delays) m=Math.max(m,E.eff(G,r,o.x,o.y));
      r.lim=m+extra;
    }
    return out;
  },
  tap(G,x,y,owner,freq,ex){ G.rings.push(...E.ring(G,x,y,'tap',null,0,owner||0,freq||null,false,ex)); },
  active(G){ return G.rings.some(r=>r.r<=r.lim) || G.pending.length>0 || G.beacons.some(b=>b.active) || G.targets.some(t=>t.armedT!=null&&!t.lit); },
  allLit(G){ return G.targets.every(t=>t.lit); },
  ready(t){
    if(t.dirs<t.need) return false;
    if(t.chroma){ const s=new Set(); for(const h of t.hits) if(h.hue!=null) s.add(h.hue); if(s.size<2) return false; }
    if(t.coop){ const s=new Set(t.hits.map(h=>h.owner)); if(!s.has(1)||!s.has(2)) return false; }
    return true;
  },
  hitInfo(hs){
    let depth=0; const cnt={};
    for(const h of hs){ depth=Math.max(depth,h.depth); if(h.owner) cnt[h.owner]=(cnt[h.owner]||0)+1; }
    let owner=0, best=-1;
    for(const k in cnt){ if(cnt[k]>best){ best=cnt[k]; owner=+k; } else if(cnt[k]===best){ owner=hs[hs.length-1].owner; } }
    return { depth, owner };
  },
  light(G,t,born,ev){
    const info=E.hitInfo(t.hits);
    const depth=Math.max(info.depth, t.armedT!=null?(t.armDepth||0):0)+1;
    t.byVia=t.hits.some(h=>h.via); t.byPortal=t.hits.some(h=>h.portal); t.onBeat=t.hits.some(h=>h.tag==='beat');
    const dh=t.hits.filter(h=>h.direct);
    t.spread=dh.length>1 ? Math.max(...dh.map(h=>h.t))-Math.min(...dh.map(h=>h.t)) : null;
    t.lit=true; t.litT=G.t; t.depth=depth; t.owner=info.owner||t.armOwner||0; t.armedT=null; t.hits=[];
    born.push(...E.ring(G,t.x,t.y,'chain',t,depth,t.owner,t.freq,false,{}));
    ev('light',t);
  },
  step(G,dt,ev){
    G.t+=dt; G.stepN++;
    const moved=new Set();
    for(const o of [...G.targets,...G.jammers]){
      if(!(o.vx||o.vy) || (o.frozenUntil && G.t<o.frozenUntil)) continue;
      o.nx+=o.vx*dt; o.ny+=o.vy*dt;
      if(o.nx<0.03||o.nx>0.97){ o.vx*=-1; o.nx=Math.min(Math.max(o.nx,0.03),0.97); }
      if(o.ny<0.03||o.ny>0.97){ o.vy*=-1; o.ny=Math.min(Math.max(o.ny,0.03),0.97); }
      moved.add(o);
    }
    if(G.currents.length) for(const t of G.targets){
      if(t.frozenUntil && G.t<t.frozenUntil) continue;
      for(const c of G.currents) if(Math.hypot(t.x-c.x,t.y-c.y)<c.rr){
        t.nx=Math.min(Math.max(t.nx+c.vx*dt,0.03),0.97); t.ny=Math.min(Math.max(t.ny+c.vy*dt,0.03),0.97); moved.add(t); }
    }
    for(const o of moved){ const c=E.pos(G,o); o.x=c.x; o.y=c.y; }
    const born=[];
    for(const b of G.beacons) if(b.active && G.t>=b.next){ b.next=G.t+b.period; born.push(...E.ring(G,b.x,b.y,'beacon',null,0,b.owner,null,false,{})); ev('beacon',b); }
    if(G.pending.length){
      const due=G.pending.filter(p=>p.t<=G.t);
      if(due.length){ G.pending=G.pending.filter(p=>p.t>G.t); for(const p of due){ born.push(...E.ring(G,...p.a)); ev('echo',p); } }
    }
    for(const r of G.rings){
      const prev=r.r; r.r+=G.speed*dt;
      if(prev>r.lim) continue;
      for(const t of G.targets){
        if(t===r.src) continue;
        if(r.freeze){
          if(!t.lit && (t.vx||t.vy||G.currents.length)){ const e=E.eff(G,r,t.x,t.y); if(prev<e&&e<=r.r&&E.reach(G,r,t.x,t.y)){ t.frozenUntil=G.t+3; ev('freeze',t); } }
          continue;
        }
        if(t.lit&&!t.fragile) continue;
        if(t.freq && r.freq && r.freq!==t.freq) continue;
        const e=E.eff(G,r,t.x,t.y);
        if(prev<e && e<=r.r && E.reach(G,r,t.x,t.y))
          t.hits.push({ t:G.t, a:Math.atan2(r.y-t.y,r.x-t.x), depth:r.depth, kind:r.kind, owner:r.owner,
            direct:r.kind==='tap'&&!r.via&&!r.portaled, via:!!r.via, portal:r.portaled, hue:r.hue, tag:r.tag });
      }
      if(r.freeze) continue;
      const ex={ hue:r.hue, tag:r.tag, delayed:r.delayed };
      if(r.kind!=='prism') for(const p of G.prisms){
        if(r.trig.has(p)) continue;
        const e=E.eff(G,r,p.x,p.y);
        if(prev<e && e<=r.r && E.reach(G,r,p.x,p.y) && G.t-p.lastT>0.15){
          r.trig.add(p); p.lastT=G.t;
          born.push(...E.ring(G,p.x,p.y,'prism',p,r.depth,r.owner,r.freq,r.portaled,{...ex, hue:(p.hue!=null?p.hue:r.hue)})); ev('prism',p);
        }
      }
      if(!r.portaled) for(const g of G.gates){
        if(r.trig.has(g)) continue;
        const e=E.eff(G,r,g.x,g.y);
        if(prev<e && e<=r.r && E.reach(G,r,g.x,g.y) && G.t-g.lastT>0.15){
          r.trig.add(g); g.lastT=g.mate.lastT=G.t;
          born.push(...E.ring(G,g.mate.x,g.mate.y,r.kind,r.src,r.depth,r.owner,r.freq,true,ex)); ev('portal',g);
        }
      }
      if(!r.delayed) for(const d of G.delays){
        if(r.trig.has(d)) continue;
        const e=E.eff(G,r,d.x,d.y);
        if(prev<e && e<=r.r && E.reach(G,r,d.x,d.y) && G.t-d.lastT>0.15){
          r.trig.add(d); d.lastT=G.t;
          G.pending.push({ t:G.t+1, d, a:[d.x,d.y,'delay',d,r.depth,r.owner,r.freq,r.portaled,{...ex, delayed:true}] }); ev('delay',d);
        }
      }
    }
    for(const t of G.targets){
      if(t.lit && t.decay && G.t-t.litT>t.decay){ t.lit=false; t.hits=[]; t.armedT=null; ev('fade',t); continue; }
      if(!t.lit){
        t.hits=t.hits.filter(h=>G.t-h.t<=G.win);
        const dirs=[]; for(const h of t.hits) if(dirs.every(a=>angDiff(a,h.a)>ANG)) dirs.push(h.a);
        t.dirs=dirs.length;
        if(E.ready(t)){
          if(t.twin==null) E.light(G,t,born,ev);
          else{
            if(t.armedT==null){ const i=E.hitInfo(t.hits); t.armedT=G.t; t.armDepth=i.depth; t.armOwner=i.owner; ev('arm',t); }
            const tw=G.targets[t.twin];
            if(tw && !tw.lit && tw.armedT!=null){ E.light(G,t,born,ev); E.light(G,tw,born,ev); }
          }
        }
        if(!t.lit && t.armedT!=null && G.t-t.armedT>G.win) t.armedT=null;
      } else if(t.fragile){
        for(const h of t.hits){
          if(h.done || !h.direct || G.t-h.t<=G.win) continue;
          h.done=true;
          if(!t.hits.some(o=>o!==h && Math.abs(o.t-h.t)<=G.win && angDiff(o.a,h.a)>ANG)){
            t.lit=false; t.hits=[]; t.armedT=null; ev('break',t); break;
          }
        }
        t.hits=t.hits.filter(h=>G.t-h.t<=2*G.win);
      }
    }
    G.rings.push(...born);
  }
};
/*/ENGINE*/
