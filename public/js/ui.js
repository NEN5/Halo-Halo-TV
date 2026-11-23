/* Lumen / ui.js: Shared helpers, icons, poster and card builders. */

/* ---------------- helpers ---------------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h};
const I={
 search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 clock:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 dl:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/></svg>',
 play:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
 plus:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 check:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
 star:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#ffb020"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg>',
 film:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="17" r="1.6"/><circle cx="7" cy="12" r="1.6"/><circle cx="17" cy="12" r="1.6"/></svg>',
 shorts:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10.5 9v6l4-3z" fill="currentColor"/></svg>',
 compass:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
 list:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M10 9v6l4.5-3z" fill="currentColor"/></svg>',
 user:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-4 4-5.5 7.5-5.5s6.3 1.5 7.5 5.5"/></svg>',
 vol:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4zM16.5 9a4 4 0 0 1 0 6"/></svg>'
};
document.querySelectorAll(".nav a span").forEach(()=>{});
$("#nav").innerHTML=$("#nav").innerHTML.replace(/__I_(\w+)__/g,(_,k)=>I[k]);

function toast(msg){
  document.querySelectorAll(".toast").forEach(n=>n.remove());
  const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2200);
}
function artStyle(t){const h=hue(t.title);return `--h1:hsl(${h} 55% 32%);--h2:hsl(${(h+50)%360} 60% 16%)`}
function poster(t,{tag=true,upd=true}={}){
  const img=t.poster?`<img loading="lazy" alt="" src="${esc(t.poster)}" onerror="this.remove()">`:"";
  return `<div class="poster" style="${artStyle(t)}"><div class="ptitle"><b>${esc(t.title)}</b></div>${img}
    ${tag&&t.badge?`<span class="tag">${esc(t.badge)}</span>`:""}
    ${t.corner?`<span class="corner ${esc(String(t.corner).toLowerCase())}">${esc(String(t.corner))}</span>`:""}
    ${upd&&t.type==="Series"&&!t.short?`<span class="upd">Update to ${t.latest}</span>`:""}</div>`;
}
function card(t){
  return `<a class="card" href="#/title/${encodeURIComponent(t.id)}">${poster(t)}<div class="name">${esc(t.title)}</div><div class="sub">${t.short?esc(t.tags[0]||""):esc(t.type)+" · "+esc(t.tags[0]||"")}</div></a>`;
}
const myList=()=>store.get("lumen.list",[]);
const history=()=>store.get("lumen.history",[]);
const inList=id=>myList().includes(id);
function toggleList(id){
  const l=myList(),i=l.indexOf(id);
  if(i>=0){l.splice(i,1);toast("Removed from My List")}else{l.unshift(id);toast("Added to My List")}
  store.set("lumen.list",l);
}
let cleanup=[];
function onLeave(fn){cleanup.push(fn)}
function runCleanup(){cleanup.forEach(f=>{try{f()}catch(e){}});cleanup=[]}
const view=$("#view");
function setNav(k){
  document.querySelectorAll(".nav a").forEach(a=>{
    if(a.dataset.k===k)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
  });
}
function fail(e){
  view.innerHTML=`<div class="pad"><div class="empty"><p><b>Could not load.</b></p><p>${esc(e.message||e)}</p>
  <p style="margin-top:10px">Check the provider settings in .env and the server console.</p></div></div>`;
}