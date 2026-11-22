/* Lumen / data.js: Sample data shown when no provider is configured in .env. */

/* ---------------- sample data ---------------- */
const SAMPLE="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const mk=(id,title,tags,year,eps,syn,x={})=>({id,title,tags,year,synopsis:syn,badge:x.badge||"",corner:x.corner||"",short:!!x.short,rating:x.rating||"8.1",
  type:eps>1?"Series":"Movie",latest:eps,poster:"",banner:"",
  episodes:Array.from({length:eps},(_,i)=>({n:i+1,title:"Episode "+(i+1),src:SAMPLE}))});
const MOCK=[
 mk("s1","Street Lights",["Filipino","Drama","Romance"],2026,24,"Four friends chase a dancing dream through the alleys of Manila while rent, family and first love pull them apart.",{badge:"New episode",rating:"8.9"}),
 mk("s2","Kape at Ulan",["Filipino","Romance"],2026,1,"A barista and a stranded commuter share one rainy afternoon and one very long pot of coffee.",{rating:"8.0"}),
 mk("s3","Night Shift Clinic",["Korean","Thriller","Drama","Horror"],2026,16,"A surgeon who never forgets a patient takes the overnight shift at a hospital hiding something in the basement.",{badge:"New episode",rating:"8.7"}),
 mk("s4","Iron Harbor",["Action","Thriller","Adventure"],2025,1,"A dockworker uncovers a smuggling ring and has until dawn to get the evidence across the bay.",{rating:"7.8"}),
 mk("s5","Paper Moons",["Anime","Fantasy"],2026,12,"A girl who folds paper animals discovers each one carries a memory from a world that no longer exists.",{rating:"9.0"}),
 mk("s6","Last Bus to Naga",["Filipino","Comedy"],2026,1,"Six strangers, one broken-down bus and a driver who refuses to admit he is lost.",{rating:"7.9"}),
 mk("s7","Dalagang Bundok",["Filipino","Drama"],2025,30,"A mountain schoolteacher fights to keep the only classroom in her barangay open through three typhoon seasons.",{rating:"8.5"}),
 mk("s8","Starfall Academy",["Anime","Fantasy","Action"],2026,24,"Students at a floating school train to catch fallen stars before they reach the ground.",{badge:"New episode",rating:"8.6"}),
 mk("s9","The Quiet Tide",["Korean","Romance","Drama"],2025,20,"A marine biologist and a retired diver reunite on an island that is slowly going under.",{rating:"8.3"}),
 mk("s10","Neon Barrio",["Filipino","Action","Adventure"],2026,1,"In a near-future Quezon City, a delivery rider takes one package that changes everything.",{rating:"7.6"}),
 mk("s11","Mayon Rising",["Filipino","Drama"],2024,1,"Three generations of one family face the evacuation order they have been dreading all their lives.",{rating:"8.4"}),
 mk("s12","Tita Squad",["Filipino","Comedy"],2026,10,"Five aunts run a neighborhood karaoke bar and an unofficial detective agency.",{badge:"New episode",rating:"8.2"})
];
const SHORT_DRAMAS=[
 mk("d1","Fired the Wrong Daughter",["Angsty Romance","Females"],2026,68,"She was dismissed in front of the whole board. Now the new owner has her resume on his desk.",{short:true,rating:"9.1"}),
 mk("d2","Forced to Marry the Duke",["Marriage Crisis","Females"],2026,72,"A seamstress is sold into a marriage of convenience and discovers her husband has been waiting for her for years.",{short:true,corner:"Hot",rating:"9.3"}),
 mk("d3","My Little Fortune Charm",["Rebirth and Time Travel","Females"],2026,55,"A mother wakes up eight years in the past with her son's luck in her pocket and a second chance to protect him.",{short:true,corner:"New",rating:"8.8"}),
 mk("d4","The Heir Behind the Counter",["Hidden Identity","Males"],2026,64,"The convenience store clerk everyone mocks is the only son of the family that owns the whole street.",{short:true,rating:"8.7"}),
 mk("d5","Last Lap Legends",["Rise from the Bottom","Males"],2026,60,"A mechanic with a borrowed bike enters the city's most dangerous night race to save his brother's garage.",{short:true,rating:"8.9"}),
 mk("d6","The Letter Father Hid",["Forbidden Love","Females"],2025,48,"A sealed letter from her late father reveals who she is allowed to love and who she never could.",{short:true,rating:"8.5"}),
 mk("d7","Return of the Third Sister",["Comeback Story","Females"],2026,58,"Cast out at nineteen, she comes home at thirty as the investor the family cannot afford to refuse.",{short:true,corner:"New",rating:"8.6"}),
 mk("d8","Sunday Dinner Secrets",["Family Drama","Males"],2025,52,"One long family dinner, four siblings and a will that nobody has read out loud yet.",{short:true,rating:"8.2"}),
 mk("d9","Midnight Contract",["Marriage Crisis","Males"],2026,66,"A fake marriage with a three-month expiry date goes wrong the moment both sides start telling the truth.",{short:true,corner:"Hot",rating:"9.0"})
];

SHORT_DRAMAS.forEach((t,i)=>{t.provider="demo"+(i%3+1);t.dubbing=(i===1||i===2)});
