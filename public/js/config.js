/* Lumen / config.js: Settings, endpoints and JSON mappers. Edit this to fit your API. */

/* ============================================================
   CONFIG
   API keys are NOT stored here. They live in .env and are added
   by server.js. Run `node server.js`, then open http://localhost:3000.
   Opened straight from disk, the app shows sample data instead.

   The mappers below turn a provider's JSON into the Title shape:
   { id, title, poster, banner, type, tags, year, rating, synopsis,
     badge, corner, dubbing, latest, episodes:[{ n, title, src }] }

   A provider with a different response shape or different paths gets
   its own entry in `providers`, keyed by its lowercase name from .env:
     providers: { alpha: { endpoints:{ home:"/v2/home" }, mapTitle:r=>({...}) } }
   ============================================================ */
// "episodes" can be a list or just a count
const epCount=r=>Array.isArray(r.episodes)?r.episodes.length:(Number(r.episodes)||Number(r.episode_count)||Number(r.chapterCount)||Number(r.totalEpisodes)||0);

// Turns any value into display text: strings stay, {name|text|title|label} objects use that field, numbers become text.
const txt=v=>{
  if(v==null||v===false)return "";
  if(typeof v==="string")return v;
  if(typeof v==="number"||v===true)return String(v);
  if(typeof v==="object")return txt(v.name||v.text||v.title||v.label||v.tagName||"");
  return "";
};
const txtList=a=>(Array.isArray(a)?a:[]).map(txt).filter(Boolean);

// Finds the list of dramas in a response, wherever the API put it:
// a bare array, {items|list|data|results|records|dramas}, {sections:[{items}]}, or nested one level deeper.
function findItems(r,depth=0){
  if(Array.isArray(r))return r;
  if(!r||typeof r!=="object")return null;
  if(Array.isArray(r.sections))return r.sections.flatMap(s=>(s&&s.items||[]).map(x=>({...x,tags:x.tags||x.genres||(s.title?[s.title]:[])})));
  for(const k of ["items","list","data","results","records","dramas","books","rows"]){
    if(Array.isArray(r[k]))return r[k];
  }
  if(depth<2){
    for(const k of ["data","result","response","payload",...Object.keys(r)]){
      if(r[k]&&typeof r[k]==="object"){const f=findItems(r[k],depth+1);if(f)return f}
    }
  }
  return null;
}
function needItems(r){
  const f=findItems(r);
  if(!f)throw new Error("Unexpected response shape. Top-level keys: "+(r&&typeof r==="object"?Object.keys(r).join(", ")||"(none)":typeof r));
  return f;
}

const CONFIG = {
  endpoints: {
    home:   "/home",
    list:   (o) => `/titles?tab=${encodeURIComponent(o.tab||"")}&kind=${encodeURIComponent(o.kind||"")}&genre=${encodeURIComponent(o.genre||"")}&year=${encodeURIComponent(o.year||"")}&sort=${encodeURIComponent(o.sort||"")}&page=${o.page||1}`,
    detail: (id) => `/titles/${encodeURIComponent(id)}`,
    search: (q) => `/search?q=${encodeURIComponent(q)}`,
    shorts: (o) => `/shorts?tab=${encodeURIComponent(o.tab||"")}&sub=${encodeURIComponent(o.sub||"")}`,
    shortDetail: (id) => `/shorts/${encodeURIComponent(id)}`
  },
  providers: {
    // Key = lowercase name from .env (SHORTS_DRAMABOX_* -> "dramabox").
    // Overrides only what differs from the defaults above.
    dramabox: {
      endpoints: {
        // Same /v1/dramabox/api/dramabox/<name> pattern for every list. Key goes in the X-API-Key header (.env).
        shorts: (o) => {
          const name = o.tab === "Ranking" ? "trending"
                     : o.tab === "New"     ? "latest"
                     : o.tab === "Categories" ? "browse"
                     : "foryou";                      // Home Page, Platform, Females, Males
          return `/v1/dramabox/api/dramabox/${name}?lang=en`;
        },
        // UNCONFIRMED parameter name: check the docs. The docs may call it keyword, q or query.
        search: (q) => `/v1/dramabox/api/dramabox/search?keyword=${encodeURIComponent(q)}`
      }
    }
  },
  tabs: ["Recommend","Filipino","Movies","Series","Anime","Korean"],
  genres: ["All","Adventure","Romance","Horror","Comedy","Action","Drama","Thriller","Fantasy"],
  shortsTabs: ["Home Page","Platform","Ranking","New","Categories","Females","Males"],
  shortsSubs: ["All","Comeback Story","Family Drama","Hidden Identity","Angsty Romance","Marriage Crisis","Rebirth and Time Travel","Rise from the Bottom","Forbidden Love"],
  collections: [               // the row under the banner; set to [] to hide
    {name:"New this week", q:"new"},{name:"Binge-worthy", q:"series"},{name:"Weekend picks", q:"movie"},{name:"Fan favorites", q:"top"}
  ],
  /* ---- mappers: adapt to your API's response shape ---- */
  mapTitle(r){
    return {
      id:r.id||r.bookId||r.book_id||r.dramaId, title:r.title||r.name||r.bookName||r.dramaName||"Untitled", poster:r.poster||r.cover||r.coverWap||r.coverUrl||r.image||"", banner:r.banner||r.backdrop||"",
      type:txt(r.type)||(epCount(r)>1?"Series":"Movie"), tags:txtList(r.tags||r.genres||r.tagNames),
      year:txt(r.year), rating:txt(r.rating||r.score), synopsis:r.synopsis||r.description||r.introduction||r.intro||"",
      badge:txt(r.badge), corner:txt(r.corner), short:!!r.short, dubbing:!!(r.dubbing||r.dubbed),
      latest:r.latest||r.episode_count||epCount(r)||1,
      episodes:Array.isArray(r.episodes)
        ? r.episodes.map((e,i)=>({n:e.n||i+1,title:e.title||("Episode "+(i+1)),src:e.src||e.url||""}))
        : Array.from({length:epCount(r)},(_,i)=>({n:i+1,title:"Episode "+(i+1),src:""}))   // numbered placeholders until a detail/episodes call fills in the video links
    };
  },
  mapHome(r,mt=CONFIG.mapTitle){
    return { banners:(r.banners||[]).map(x=>mt(x)),
             shelves:(r.shelves||[]).map(s=>({name:s.name,items:(s.items||[]).map(x=>mt(x))})) };
  },
  mapList(r,mt=CONFIG.mapTitle){ return needItems(r).map(x=>mt(x)); },
  mapShorts(r,mt=CONFIG.mapTitle){
    const seen=new Set();
    return needItems(r).filter(x=>{const k=x&&(x.id||x.bookId||x.title||x.name);return k&&!seen.has(k)&&seen.add(k)}).map(x=>({...mt(x),short:true}));
  }
};