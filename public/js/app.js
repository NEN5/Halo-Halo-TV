/* Lumen / app.js: Router and startup. */

/* ---------------- router ---------------- */
function route(){
  runCleanup();
  window.scrollTo(0,0);
  const p=location.hash.replace(/^#\/?/,"").split("/");
  const a=p[0]||"",dec=s=>{try{return decodeURIComponent(s||"")}catch(e){return s||""}};
  $("#nav").hidden=false;
  if(a==="title")return showTitle(dec(p[1]));
  if(a==="watch")return showWatch(dec(p[1]),parseInt(p[2],10)||1);
  if(a==="search")return showSearch(dec(p[1]));
  if(a==="shorts")return showShorts();
  if(a==="discover")return showDiscover();
  if(a==="list")return showList();
  if(a==="me")return showMe();
  setNav("");document.querySelector('.nav a[data-k=""]').setAttribute("aria-current","page");
  return showMovies();
}
addEventListener("hashchange",route);
initProviders().then(route);
