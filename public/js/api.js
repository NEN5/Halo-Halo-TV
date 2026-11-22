/* Lumen / api.js: Provider layer: calls the proxy, merges providers, falls back to sample data. */

/* ---------------- providers: keys live in .env on the server, never in this file ---------------- */
let PROV={movies:[],shorts:[]},live=false;
const DEMO_PLATFORMS=[{id:"demo1",label:"Sample Platform A"},{id:"demo2",label:"Sample Platform B"},{id:"demo3",label:"Sample Platform C"}];
async function initProviders(){
  try{
    const r=await fetch("/api/providers",{cache:"no-store"});
    if(r.ok){const j=await r.json();PROV={movies:j.movies||[],shorts:j.shorts||[]}}
  }catch(e){}
  live=PROV.movies.length+PROV.shorts.length>0;
}
const epOf=id=>({...CONFIG.endpoints,...((CONFIG.providers[id]||{}).endpoints||{})});
const mtOf=id=>(CONFIG.providers[id]||{}).mapTitle||CONFIG.mapTitle;
async function pget(kind,p,path){
  const r=await fetch(`/api/proxy/${kind}/${encodeURIComponent(p.id)}${path}`,{headers:{Accept:"application/json"}});
  if(!r.ok)throw new Error(`${p.label}: HTTP ${r.status}`);
  return r.json();
}
const tagId=(kind,p,t)=>({...t,id:`${kind[0]}~${p.id}~${t.id}`,provider:p.id});
function settle(rs){
  const ok=rs.filter(r=>r.status==="fulfilled").flatMap(r=>r.value);
  if(!ok.length&&rs.length&&rs.every(r=>r.status==="rejected"))throw rs[0].reason;
  return ok;
}
const fanOut=async(kind,fn)=>settle(await Promise.allSettled(PROV[kind].map(async p=>(await fn(p)).map(t=>tagId(kind,p,t)))));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const inTab=(t,tab)=>tab==="Recommend"||(tab==="Movies"?t.type==="Movie":tab==="Series"?t.type==="Series":t.tags.includes(tab));
const byRating=(a,b)=>parseFloat(b.rating)-parseFloat(a.rating);
const api={
  async home(){
    if(live){
      if(!PROV.movies.length)return {banners:[],shelves:[]};
      const multi=PROV.movies.length>1;
      const ok=settle(await Promise.allSettled(PROV.movies.map(async p=>{
        const h=CONFIG.mapHome(await pget("movies",p,epOf(p.id).home),mtOf(p.id));
        const T=t=>tagId("movies",p,t);
        return {banners:h.banners.map(T),shelves:h.shelves.map(s=>({name:multi?`${s.name} · ${p.label}`:s.name,items:s.items.map(T)}))};
      })));
      return {banners:ok.flatMap(h=>h.banners).slice(0,8),shelves:ok.flatMap(h=>h.shelves)};
    }
    await wait(120);
    const by=f=>MOCK.filter(f);
    return {banners:[MOCK[0],MOCK[4],MOCK[2],MOCK[11]],shelves:[
      {name:"Trending Now",items:[MOCK[0],MOCK[7],MOCK[2],MOCK[4],MOCK[8]]},
      {name:"Filipino Picks",items:by(t=>t.tags.includes("Filipino"))},
      {name:"Binge a Series",items:by(t=>t.type==="Series")},
      {name:"One-Sitting Movies",items:by(t=>t.type==="Movie")}]};
  },
  async list(o={}){
    if(live)return fanOut("movies",async p=>CONFIG.mapList(await pget("movies",p,epOf(p.id).list(o)),mtOf(p.id)));
    await wait(80);
    const r=MOCK.filter(t=>inTab(t,o.tab||"Recommend")&&(!o.kind||t.type===o.kind)&&(!o.genre||o.genre==="All"||t.tags.includes(o.genre))&&(!o.year||o.year==="All"||String(t.year)===String(o.year)));
    if(o.sort==="Latest")r.sort((a,b)=>b.year-a.year);
    if(o.sort==="Top today")r.sort(byRating);
    return r;
  },
  async detail(id){
    const m=/^([ms])~([^~]+)~(.+)$/.exec(id);
    if(m){
      const kind=m[1]==="m"?"movies":"shorts";
      const p=PROV[kind].find(x=>x.id===m[2]);
      if(!p)return null;
      const ep=epOf(p.id);
      const raw=await pget(kind,p,kind==="movies"?ep.detail(m[3]):ep.shortDetail(m[3]));
      const t=tagId(kind,p,{...mtOf(p.id)(raw),id:m[3]});
      if(kind==="shorts")t.short=true;
      return t;
    }
    return MOCK.concat(SHORT_DRAMAS).find(t=>t.id===id);
  },
  async search(q){
    if(live){
      const a=await fanOut("movies",async p=>CONFIG.mapList(await pget("movies",p,epOf(p.id).search(q)),mtOf(p.id)));
      const b=(await fanOut("shorts",async p=>CONFIG.mapList(await pget("shorts",p,epOf(p.id).search(q)),mtOf(p.id)))).map(t=>({...t,short:true}));
      return [...a,...b];
    }
    const s=q.toLowerCase();
    return MOCK.concat(SHORT_DRAMAS).filter(t=>t.title.toLowerCase().includes(s)||t.tags.some(g=>g.toLowerCase().includes(s))||t.type.toLowerCase()===s);
  },
  async platforms(){
    return live?PROV.shorts.map(p=>({id:p.id,label:p.label})):DEMO_PLATFORMS;
  },
  async shorts(o={}){
    if(live){
      const ps=o.platform&&o.platform!=="All"?PROV.shorts.filter(p=>p.id===o.platform):PROV.shorts;
      const l=settle(await Promise.allSettled(ps.map(async p=>CONFIG.mapShorts(await pget("shorts",p,epOf(p.id).shorts(o)),mtOf(p.id)).map(t=>tagId("shorts",p,t)))));
      if(o.tab==="Ranking")l.sort(byRating);
      return l;
    }
    await wait(60);
    let l=SHORT_DRAMAS.filter(t=>(!o.sub||o.sub==="All"||t.tags.includes(o.sub))&&(!o.platform||o.platform==="All"||t.provider===o.platform)&&(o.tab!=="Females"||t.tags.includes("Females"))&&(o.tab!=="Males"||t.tags.includes("Males"))&&(o.tab!=="New"||t.corner==="New"));
    if(o.tab==="Ranking")l=[...l].sort(byRating);
    return l;
  }
};
