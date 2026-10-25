// Textes : objet I18N (rempli par js/i18n/fr.js … pt.js, chargés juste après), langue, traduction t(), nombres.
const I18N = {};
const LANGS=['fr','en','es','de','it','pt'];
const LOCALES={fr:'fr-FR',en:'en-GB',es:'es-ES',de:'de-DE',it:'it-IT',pt:'pt-BR'};
let LANG='en';
function detectLang(){
  const list=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en']);
  for(const l of list){ const k=String(l).slice(0,2).toLowerCase(); if(LANGS.includes(k)) return k; }
  return 'en';
}
function plural(n){ return (LANG==='fr'||LANG==='pt') ? (Math.abs(n)>=2) : (n!==1); }
function t(key,p){
  let s=(I18N[LANG]&&I18N[LANG][key]); if(s==null) s=I18N.en[key]; if(s==null) s=I18N.fr[key]; if(s==null) return key;
  if(typeof s!=='string') return s;
  if(s.includes('|')){ const parts=s.split('|'); s=(p&&p.n!=null&&plural(+p.n))?parts[1]:parts[0]; }
  if(p) s=s.replace(/\{(\w+)\}/g,(m,k)=>p[k]!=null?(typeof p[k]==='number'?fmt(p[k]):p[k]):m);
  return s;
}
function tip(k){ return (I18N[LANG].tips||{})[k] || I18N.en.tips[k]; }
function fmt(n){ try{ return Number.isInteger(n)&&Math.abs(n)>=1000 ? n.toLocaleString(LOCALES[LANG]) : String(n); }catch(e){ return String(n); } }
