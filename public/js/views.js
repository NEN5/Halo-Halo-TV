/* Lumen / views.js: One function per screen. */

/* ---------------- views ---------------- */
let tab="Recommend";
async function showMovies(){
  setNav("");
  $("#nav").hidden=false;
  view.innerHTML=`<header class="top pad">
    <div class="searchrow"><a class="searchbox" href="#/search" aria-label="Search">${I.search}<span>Search titles, genres</span></a>
    <a class="iconbtn" href="#/me" aria-label="Watch history">${I.clock}</a>
    <button class="iconbtn" id="dlb" aria-label="Downloads">${I.dl}</button></div>
    <div class="tabs" role="tablist">${CONFIG.tabs.map(t=>`<button class="tab" role="tab" data-t="${esc(t)}" aria-selected="${t===tab}">${esc(t)}</button>`).join("")}</div></header>
    <main id="body"></main>`;
  $("#dlb").onclick=()=>toast("Offline downloads are not available in the web version");
  view.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{tab=b.dataset.t;showMovies()});
  const body=$("#body");
  body.innerHTML=`<div class="pad"><div class="skel"></div></div>`;
  try{
    if(tab==="Recommend"){
      const h=await api.home();
      body.innerHTML=banners(h.banners)+collections()+h.shelves.filter(s=>s.items.length).map(s=>
        `<section class="sec pad"><h3>${esc(s.name)}</h3><div class="rail">${s.items.map(card).join("")}</div></section>`).join("");
      initBanners();
      body.querySelectorAll(".coll").forEach(c=>c.onclick=()=>{location.hash="#/search/"+encodeURIComponent(c.dataset.q)});
    }else{
      const items=await api.list({tab});
      body.innerHTML=`<section class="pad" style="padding-top:8px">${items.length?`<div class="grid">${items.map(card).join("")}</div>`:`<div class="empty">Nothing here yet.</div>`}</section>`;
    }
  }catch(e){fail(e)}
}
function banners(list){
  if(!list.length)return"";
  return `<div class="banners"><div class="bscroll" id="bs">${list.map(t=>`
    <a class="banner" href="#/title/${encodeURIComponent(t.id)}">
      <div class="art poster" style="${artStyle(t)}">${t.banner?`<img alt="" src="${esc(t.banner)}" onerror="this.remove()">`:""}</div><div class="shade"></div>
      <div class="txt"><h2>${esc(t.title)}</h2><p>${esc(t.synopsis)}</p>
      <div class="meta">${I.star}<span>${esc(t.rating)}</span><span>${esc(t.year)}</span><span>${esc(t.type)}</span></div></div></a>`).join("")}</div>
    <div class="dots pad" id="dots" style="padding:0">${list.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}</div></div>`;
}
function initBanners(){
  const bs=$("#bs");if(!bs)return;
  const dots=[...document.querySelectorAll("#dots i")];
  const idx=()=>Math.round(bs.scrollLeft/bs.clientWidth);
  bs.addEventListener("scroll",()=>dots.forEach((d,i)=>d.classList.toggle("on",i===idx())),{passive:true});
  if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  const id=setInterval(()=>{const n=(idx()+1)%dots.length;bs.scrollTo({left:n*bs.clientWidth,behavior:"smooth"})},4500);
  onLeave(()=>clearInterval(id));
}
function collections(){
  if(!CONFIG.collections.length)return"";
  return `<section class="sec pad"><h3>Collections</h3><div class="rail">${CONFIG.collections.map(c=>{
    const h=hue(c.name);
    return `<button class="coll" data-q="${esc(c.q)}" style="background:linear-gradient(135deg,hsl(${h} 50% 26%),hsl(${(h+40)%360} 55% 14%))">${esc(c.name)}</button>`}).join("")}</div></section>`;
}

async function showList(){
  setNav("list");
  view.innerHTML=`<div class="pad"><h1 class="h1">My List</h1><div id="res"><div class="skel"></div></div></div>`;
  const ids=myList();
  const items=(await Promise.all(ids.map(id=>api.detail(id).catch(()=>null)))).filter(Boolean);
  $("#res").innerHTML=items.length?`<div class="grid">${items.map(card).join("")}</div>`:`<div class="empty">Titles you add show up here.</div>`;
}

async function showSearch(q0){
  setNav("");
  view.innerHTML=`<header class="top pad"><div class="searchrow"><a class="iconbtn" href="#/" aria-label="Back">${I.back}</a>
   <input class="sinput" id="q" type="search" placeholder="Search titles, genres" autocomplete="off" value="${esc(q0)}"></div></header>
   <div class="pad" style="padding-top:14px" id="res"></div>`;
  const q=$("#q");let tm;
  const run=async()=>{
    const v=q.value.trim(),res=$("#res");
    if(!v){res.innerHTML=`<div class="pills">${["Filipino","Romance","Anime","Thriller","Comedy"].map(g=>`<button class="pill" data-g="${g}">${g}</button>`).join("")}</div><div class="empty" style="padding-top:30px">Try a title or a genre.</div>`;
      res.querySelectorAll(".pill").forEach(b=>b.onclick=()=>{q.value=b.dataset.g;run()});return}
    try{const items=await api.search(v);if(q.value.trim()!==v)return;
      res.innerHTML=items.length?`<div class="grid">${items.map(card).join("")}</div>`:`<div class="empty">No results for "${esc(v)}".</div>`}catch(e){res.innerHTML=`<div class="empty">${esc(e.message)}</div>`}
  };
  q.oninput=()=>{clearTimeout(tm);tm=setTimeout(run,250)};
  run();if(!q0)q.focus();
}

async function showTitle(id){
  setNav("");
  view.innerHTML=`<div class="pad"><div class="skel" style="margin-top:60px"></div></div>`;
  try{
    const t=await api.detail(id);
    if(!t){view.innerHTML=`<div class="empty">Title not found.</div>`;return}
    const seen=new Set(history().filter(h=>h.id===t.id).map(h=>h.ep));
    const last=history().find(h=>h.id===t.id);
    const start=last?last.ep:1;
    view.innerHTML=`<a class="back" href="javascript:history.back()" aria-label="Back">${I.back}</a>
    <div class="hero"><div class="art poster" style="${artStyle(t)};position:absolute;inset:0;border-radius:0">${t.banner||t.poster?`<img alt="" src="${esc(t.banner||t.poster)}" onerror="this.remove()">`:`<div class="ptitle" style="font-size:44px;padding:20px"></div>`}</div><div class="shade"></div></div>
    <div class="pad"><h1 class="dtitle">${esc(t.title)}</h1>
    <div class="chips">${I.star}<b style="color:var(--fg)">${esc(t.rating)}</b><span>${esc(t.year)}</span><span>${esc(t.type)}</span>${t.tags.map(g=>`<span class="c">${esc(g)}</span>`).join("")}</div>
    <div class="btnrow"><a class="btn primary" href="#/watch/${encodeURIComponent(t.id)}/${start}">${I.play}${last?(t.type==="Series"?"Continue E"+start:"Continue"):"Play"}</a>
    <button class="btn" id="lb" aria-pressed="${inList(t.id)}">${inList(t.id)?I.check+"In list":I.plus+"My List"}</button></div>
    <p class="syn">${esc(t.synopsis)}</p>
    ${t.type==="Series"?`<section class="sec"><h3>Episodes <small>${t.episodes.length} total</small></h3><div class="eps">${t.episodes.map(e=>`<a class="ep ${seen.has(e.n)?"seen":""}" href="#/watch/${encodeURIComponent(t.id)}/${e.n}">${e.n}</a>`).join("")}</div></section>`:""}
    </div>`;
    $("#lb").onclick=e=>{toggleList(t.id);const b=e.currentTarget;b.innerHTML=inList(t.id)?I.check+"In list":I.plus+"My List"};
  }catch(e){fail(e)}
}

async function showWatch(id,ep){
  setNav("");
  view.innerHTML=`<div class="skel"></div>`;
  try{
    const t=await api.detail(id);
    if(!t){view.innerHTML=`<div class="empty">Title not found.</div>`;return}
    const e=t.episodes.find(x=>x.n===ep)||t.episodes[0];
    const prev=history().find(h=>h.id===t.id&&h.ep===e.n);
    view.innerHTML=`<div class="player">${e&&e.src?`<video id="vid" controls playsinline autoplay preload="metadata" src="${esc(e.src)}"></video>`:`<div class="noSrc"><p>No video source for this episode.<br>Check the episodes mapping in CONFIG.</p></div>`}</div>
    <div class="pad" style="padding-top:14px">
      <a class="iconbtn" href="#/title/${encodeURIComponent(t.id)}" style="display:inline-grid;margin-left:-10px" aria-label="Back to title">${I.back}</a>
      <h1 style="font:700 22px var(--display)">${esc(t.title)}</h1>
      <p style="color:var(--muted);font-size:13px;margin-top:2px">${t.type==="Series"?esc(e.title)+" · ":""}${esc(t.year)} · ${esc(t.tags.join(", "))}</p>
      ${t.type==="Series"?`<section class="sec"><h3>Episodes</h3><div class="eps">${t.episodes.map(x=>`<a class="ep" href="#/watch/${encodeURIComponent(t.id)}/${x.n}" ${x.n===e.n?'aria-current="true"':""}>${x.n}</a>`).join("")}</div></section>`:""}
      ${live?"":`<section class="sec"><h3>More like this</h3><div class="rail">${(t.short?SHORT_DRAMAS:MOCK).filter(m=>m.id!==t.id).slice(0,6).map(card).join("")}</div></section>`}</div>`;
    const v=$("#vid");if(!v)return;
    let lastSave=0;
    const save=(p)=>{const h=history().filter(x=>x.id!==t.id);h.unshift({id:t.id,ep:e.n,p});store.set("lumen.history",h.slice(0,30))};
    v.addEventListener("loadedmetadata",()=>{if(prev&&prev.p&&prev.p<.97)v.currentTime=v.duration*prev.p});
    v.addEventListener("timeupdate",()=>{const n=Date.now();if(n-lastSave>4000&&v.duration){lastSave=n;save(v.currentTime/v.duration)}});
    v.addEventListener("pause",()=>{if(v.duration)save(v.currentTime/v.duration)});
    v.addEventListener("ended",()=>{save(1);const nx=t.episodes.find(x=>x.n===e.n+1);if(nx){toast("Playing next episode");location.hash=`#/watch/${encodeURIComponent(t.id)}/${nx.n}`}});
    v.play().catch(()=>{});
    onLeave(()=>{if(v.duration&&!v.ended)save(v.currentTime/v.duration);v.pause();v.removeAttribute("src");v.load()});
  }catch(err){fail(err)}
}

function guestId(){let g=store.get("lumen.gid",null);if(!g){g=String(Math.floor(1e8+Math.random()*9e8));store.set("lumen.gid",g)}return g}

async function showDiscover(){
  setNav("discover");
  const yr=new Date().getFullYear();
  const years=["All",...Array.from({length:5},(_,i)=>String(yr-i))];
  const f={kind:"Movie",genre:"All",year:"All",sort:"Popularity"};
  const kinds=[{v:"Movie",l:"Movies"},{v:"Series",l:"TV Shows"}];
  const bar=(key,opts,cls)=>`<div class="seg ${cls||""}">${opts.map(o=>{const v=o.v||o,l=o.l||o;return `<button data-k="${key}" data-v="${esc(v)}" aria-pressed="${f[key]===v}">${esc(l)}</button>`}).join("")}</div>`;
  view.innerHTML=`<div class="pad"><div class="ptop"><h1>Categories</h1><a class="iconbtn" href="#/search" aria-label="Search">${I.search}</a></div><div id="f"></div><div id="res"></div></div>`;
  const paint=()=>{$("#f").innerHTML=bar("kind",kinds,"big")+bar("genre",CONFIG.genres)+bar("year",years)+bar("sort",["Popularity","Latest","Top today"])};
  const load=async()=>{
    const res=$("#res");res.innerHTML=`<div class="skel" style="margin-top:12px"></div>`;
    try{
      const items=await api.list({...f,tab:"Recommend"});
      res.innerHTML=items.length?`<div class="grid4">${items.map(card).join("")}</div>`:`<div class="empty">No titles match these filters.</div>`;
    }catch(e){res.innerHTML=`<div class="empty">${esc(e.message)}</div>`}
  };
  $("#f").onclick=e=>{const b=e.target.closest("button[data-k]");if(!b)return;f[b.dataset.k]=b.dataset.v;paint();load()};
  paint();load();
}

async function showMe(){
  setNav("me");
  const h=history();
  const items=(await Promise.all(h.map(async x=>({x,t:await api.detail(x.id).catch(()=>null)})))).filter(r=>r.t);
  const hist=items.map(({x,t})=>`<a href="#/watch/${encodeURIComponent(t.id)}/${x.ep}">${poster(t,{tag:false,upd:false})}<b>${esc(t.title)}</b><span class="ep-of">${t.episodes.length>1?`EP.${x.ep} <i>/ EP.${t.episodes.length}</i>`:"Movie"}</span></a>`).join("");
  const row=(ic,label,a)=>`<button class="mrow" data-a="${a}"><span class="ci">${ic}</span><span>${label}</span><span class="chev">&rsaquo;</span></button>`;
  view.innerHTML=`<div class="pad" id="me">
    <div class="prof"><div class="avatar">${I.user}</div><div class="who"><b>Guest</b><span>ID: ${guestId()}</span></div><button class="login" data-a="login">Login &rsaquo;</button></div>
    <div class="gold"><div class="t"><b>Go Premium for ad-free viewing</b><small>Connect your own billing to enable plans</small></div><button data-a="sub"><i>Limited time</i>Subscribe</button></div>
    <section class="panel"><div class="phead"><span class="ci">${I.clock}</span><b>History</b>${items.length?`<button class="clr" data-a="clr">Clear</button>`:""}</div>
      ${items.length?`<div class="hist">${hist}</div>`:`<p class="muted" style="padding:2px 0 16px">Nothing watched yet.</p>`}</section>
    <section class="panel">${row(I.dl,"My downloads","dl")}${row("&equiv;","Order list","ord")}</section>
    <section class="panel">${row("A","Language switching","lang")}${row("?","Feedback","fb")}</section>
    <p class="muted" style="margin:18px 0 8px;font-size:13px">Data source: ${live?"live providers: "+[...PROV.movies,...PROV.shorts].map(p=>esc(p.label)).join(", "):"sample data. Add providers in .env and run node server.js."}</p></div>`;
  const msg={login:"Login is handled by your own backend",sub:"Connect your billing to enable plans",dl:"Downloads are not available in the web version",ord:"No orders yet",lang:"Only English is bundled for now",fb:"Feedback form is not connected"};
  $("#me").onclick=e=>{
    const b=e.target.closest("[data-a]");if(!b)return;
    const a=b.dataset.a;
    if(a==="clr"){store.set("lumen.history",[]);showMe()}else toast(msg[a]);
  };
}

const rankRow=(t,i)=>`<a class="rank" href="#/title/${encodeURIComponent(t.id)}">
  <div class="pw">${poster(t,{tag:false,upd:false})}<span class="no">${String(i+1).padStart(2,"0")}</span>${t.dubbing?`<span class="dub">Dubbing</span>`:""}</div>
  <div class="rb"><h3>${esc(t.title)}</h3><div class="tags">${t.tags.filter(g=>g!=="Females"&&g!=="Males").slice(0,2).map(g=>`<span>${esc(g)}</span>`).join("")}</div><p>${esc(t.synopsis)}</p></div></a>`;

async function showShorts(){
  setNav("shorts");
  const f={tab:"Home Page",sub:"All",platform:"All"};
  view.innerHTML=`<div class="sbg"><header class="top pad" id="sh"><a class="searchbox" href="#/search" aria-label="Search">${I.search}<span>Search short dramas</span></a>
    <div class="stabs" id="st"></div><div class="ssubs" id="ss"></div></header><div class="pad" id="res" style="padding-top:6px"></div></div>`;
  let plats=null;
  const paint=()=>{
    $("#st").innerHTML=CONFIG.shortsTabs.map(t=>`<button data-k="tab" data-v="${esc(t)}" aria-selected="${f.tab===t}">${esc(t)}</button>`).join("");
    $("#ss").hidden=f.tab==="Platform";
    $("#ss").innerHTML=CONFIG.shortsSubs.map(t=>`<button data-k="sub" data-v="${esc(t)}" aria-pressed="${f.sub===t}">${esc(t)}</button>`).join("");
  };
  const load=async()=>{
    const res=$("#res");res.innerHTML=`<div class="skel"></div>`;
    try{
      if(f.tab==="Platform"){
        if(!plats)plats=await api.platforms();
        const items=await api.shorts(f);
        res.innerHTML=`<div class="phero"><h2>All Short Drama Platforms</h2><p>Ranked by views and interactions, tuned to your interests</p></div>
          <div class="plats" id="pl">${[{id:"All",label:"All"},...plats].map(p=>`<button class="plat" data-p="${esc(p.id)}" aria-pressed="${f.platform===p.id}"><i style="--ph:${hue(p.label)}">${esc(p.label.charAt(0))}</i>${esc(p.label)}</button>`).join("")}</div>
          <div id="rk">${items.length?items.map(rankRow).join(""):`<div class="empty">${live&&!PROV.shorts.length?"No shorts provider configured in .env.":"Nothing here yet."}</div>`}</div>`;
        $("#pl").onclick=e=>{const b=e.target.closest("[data-p]");if(!b)return;f.platform=b.dataset.p;load()};
      }else{
        const items=await api.shorts(f);
        res.innerHTML=items.length?`<div class="grid3">${items.map(card).join("")}</div>`:`<div class="empty">${live&&!PROV.shorts.length?"No shorts provider configured in .env.":"Nothing here yet."}</div>`;
      }
    }catch(e){fail(e)}
  };
  $("#sh").onclick=e=>{const b=e.target.closest("button[data-k]");if(!b)return;f[b.dataset.k]=b.dataset.v;paint();load()};
  paint();load();
}
