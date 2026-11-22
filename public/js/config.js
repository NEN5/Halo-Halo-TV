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
const CONFIG = {
  endpoints: {
    home:   "/home",
    list:   (o) => `/titles?tab=${encodeURIComponent(o.tab||"")}&kind=${encodeURIComponent(o.kind||"")}&genre=${encodeURIComponent(o.genre||"")}&year=${encodeURIComponent(o.year||"")}&sort=${encodeURIComponent(o.sort||"")}&page=${o.page||1}`,
    detail: (id) => `/titles/${encodeURIComponent(id)}`,
    search: (q) => `/search?q=${encodeURIComponent(q)}`,
    shorts: (o) => `/shorts?tab=${encodeURIComponent(o.tab||"")}&sub=${encodeURIComponent(o.sub||"")}`,
    shortDetail: (id) => `/shorts/${encodeURIComponent(id)}`
  },
  providers: {},
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
      id:r.id, title:r.title||r.name, poster:r.poster||r.cover||"", banner:r.banner||r.backdrop||"",
      type:r.type||((r.episodes||[]).length>1?"Series":"Movie"), tags:r.tags||r.genres||[],
      year:r.year||"", rating:r.rating||"", synopsis:r.synopsis||r.description||"",
      badge:r.badge||"", corner:r.corner||"", short:!!r.short, dubbing:!!(r.dubbing||r.dubbed),
      latest:r.latest||r.episode_count||(r.episodes||[]).length||1,
      episodes:(r.episodes||[]).map((e,i)=>({n:e.n||i+1,title:e.title||("Episode "+(i+1)),src:e.src||e.url||""}))
    };
  },
  mapHome(r,mt=CONFIG.mapTitle){
    return { banners:(r.banners||[]).map(x=>mt(x)),
             shelves:(r.shelves||[]).map(s=>({name:s.name,items:(s.items||[]).map(x=>mt(x))})) };
  },
  mapList(r,mt=CONFIG.mapTitle){ return (r.items||r||[]).map(x=>mt(x)); },
  mapShorts(r,mt=CONFIG.mapTitle){ return (r.items||r||[]).map(x=>({...mt(x),short:true})); }
};
