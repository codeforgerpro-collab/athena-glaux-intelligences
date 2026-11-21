(function(){
var R=document.getElementById("mp");if(!R)return;
var T=JSON.parse(R.getAttribute("data-t")),LK=JSON.parse(R.getAttribute("data-links")),LANG=R.getAttribute("data-lang");
var EUC="AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB NO CH IS AL BA ME MK RS TR UA MD XK".split(" ");
var KEY="athena.place.v1",KIT="athena.kit.v1",place=null,radius=300,hits=[],D={q:[],ev:[],gd:[]},NS="http://www.w3.org/2000/svg";
function $(i){return document.getElementById(i);}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n;}
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||"null");localStorage.setItem(k,JSON.stringify(v));}catch(x){}return null;}
function ok(u){return typeof u==="string"&&u.indexOf("https://")===0;}
function km(a,b,c,d){var r=Math.PI/180,p=(c-a)*r,q=(d-b)*r,x=Math.sin(p/2)*Math.sin(p/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(q/2)*Math.sin(q/2);return 12742*Math.asin(Math.sqrt(x));}
function when(ms){if(!ms||isNaN(ms))return"";var m=Math.round((Date.now()-ms)/60000),s;if(m<90)s=Math.max(m,1)+" "+T.m;else if(m<2880)s=Math.round(m/60)+" "+T.h;else s=Math.round(m/1440)+" "+T.d;
var f="";try{f=new Intl.DateTimeFormat(LANG,{dateStyle:"medium",timeStyle:"short"}).format(new Date(ms));}catch(x){}return f+" ("+s+")";}
function jget(u){return fetch(u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
function put(id,items,none){var b=$(id);b.textContent="";if(!items.length){b.appendChild(el("p","mp-none",none));return;}
var ul=el("ul","mp-list");items.forEach(function(it){var li=el("li","mp-item"),h=el("div","mp-t");
if(it.href&&ok(it.href)){var a=el("a",null,it.title);a.href=it.href;a.rel="noopener nofollow";a.target="_blank";h.appendChild(a);}else h.appendChild(el("span",null,it.title));
if(it.lvl){h.appendChild(el("span","mp-lvl mp-"+it.lvl.toLowerCase(),T.lvl[it.lvl]||it.lvl));}li.appendChild(h);
if(it.meta)li.appendChild(el("div","mp-m",it.meta));ul.appendChild(li);});b.appendChild(ul);}
function fail(id){var b=$(id);b.textContent="";b.appendChild(el("p","mp-none",T.err));}
function load(id){var b=$(id);b.textContent="";b.appendChild(el("p","mp-none",T.loading));}
function inUS(p){return p.cc==="US"||(!p.cc&&p.lat>17&&p.lat<72&&p.lon>-180&&p.lon<-60);}
/* ---- charts: small inline SVG, no library ---- */
function sv(t,a){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);return n;}
function tx(x,y,s,a){var n=sv("text",Object.assign({x:x,y:y,fill:"currentColor","font-size":11},a||{}));n.textContent=s;return n;}
function fig(id,title,build){var b=$(id);b.textContent="";var f=el("figure","mp-fig"),c=el("figcaption",null,title),s=sv("svg",{viewBox:"0 0 600 220",role:"img","aria-label":title,width:"100%"});f.appendChild(c);
if(!build(s)){f.appendChild(el("p","mp-none",T.ch_none));}else f.appendChild(s);b.appendChild(f);}
function charts(){var C=$("mp-ch");C.textContent="";["mp-c1","mp-c2","mp-c3"].forEach(function(i){var d=el("div","mp-chart");d.id=i;C.appendChild(d);});
var q=D.q;
fig("mp-c1",T.ch_daily,function(s){var n=[],lab=[],now=new Date();for(var i=6;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i);var c=0;
q.forEach(function(e){var z=new Date(e.t);if(z.getFullYear()===d.getFullYear()&&z.getMonth()===d.getMonth()&&z.getDate()===d.getDate())c++;});n.push(c);
var l="";try{l=new Intl.DateTimeFormat(LANG,{weekday:"short"}).format(d);}catch(x){l=String(d.getDate());}lab.push(l);}
var mx=Math.max.apply(null,n);if(!q.length)return false;var W=600/7;n.forEach(function(v,i){var h=v/mx*150;s.appendChild(sv("rect",{x:i*W+14,y:175-h,width:W-28,height:Math.max(h,1),fill:"var(--accent,#1f4e79)",opacity:.85}));
s.appendChild(tx(i*W+W/2,170-h,String(v),{"text-anchor":"middle"}));s.appendChild(tx(i*W+W/2,198,lab[i],{"text-anchor":"middle"}));});s.appendChild(sv("line",{x1:0,x2:600,y1:175,y2:175,stroke:"currentColor",opacity:.4}));return true;});
fig("mp-c2",T.ch_mag,function(s){if(!q.length)return false;var my=Math.max(6,Math.ceil(Math.max.apply(null,q.map(function(e){return e.mag;}))));
s.appendChild(sv("line",{x1:40,x2:590,y1:180,y2:180,stroke:"currentColor",opacity:.5}));s.appendChild(sv("line",{x1:40,x2:40,y1:10,y2:180,stroke:"currentColor",opacity:.5}));
for(var i=0;i<=my;i+=(my>8?2:1)){var y=180-i/my*170;s.appendChild(tx(34,y+4,String(i),{"text-anchor":"end"}));s.appendChild(sv("line",{x1:40,x2:590,y1:y,y2:y,stroke:"currentColor",opacity:.12}));}
[0,.5,1].forEach(function(f){s.appendChild(tx(40+f*550,198,String(Math.round(f*radius)),{"text-anchor":"middle"}));});s.appendChild(tx(315,214,T.x_km,{"text-anchor":"middle"}));
s.appendChild(tx(6,14,T.y_mag));q.forEach(function(e){var c=sv("circle",{cx:40+Math.min(e.d/radius,1)*550,cy:180-Math.max(e.mag,0)/my*170,r:3.6,fill:"var(--accent,#1f4e79)",opacity:.6});
var t=sv("title",{});t.textContent="M"+e.mag.toFixed(1)+" - "+Math.round(e.d)+" "+T.km;c.appendChild(t);s.appendChild(c);});return true;});
fig("mp-c3",T.ch_mix,function(s){var m={};if(D.q.length)m[T.t_eq]=D.q.length;D.gd.forEach(function(g){var k=T["t_"+g.type];if(k&&g.type!=="eq")m[k]=(m[k]||0)+1;});D.ev.forEach(function(e){m[e.cat]=(m[e.cat]||0)+1;});
var rows=Object.keys(m).map(function(k){return[k,m[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,7);if(!rows.length)return false;var mx=rows[0][1],H=Math.min(26,190/rows.length);
rows.forEach(function(r,i){var y=8+i*(H+4),w=r[1]/mx*330;s.appendChild(tx(190,y+H/2+4,r[0].slice(0,26),{"text-anchor":"end"}));s.appendChild(sv("rect",{x:198,y:y,width:Math.max(w,2),height:H,fill:"var(--accent,#1f4e79)",opacity:.85}));s.appendChild(tx(204+w,y+H/2+4,String(r[1])));});return true;});}
/* ---- sources ---- */
function official(){load("mp-off");var jobs=[],all=[];D.gd=[];
if(inUS(place))jobs.push(jget("https://api.weather.gov/alerts/active?point="+place.lat.toFixed(4)+","+place.lon.toFixed(4)).then(function(j){(j.features||[]).forEach(function(f){var p=f.properties||{};
all.push({title:(p.headline||p.event||"").slice(0,220),meta:T.src+": "+T.nws+(p.senderName?" - "+p.senderName:"")+" - "+T.pub+" "+when(Date.parse(p.sent||p.effective)),lvl:p.severity==="Extreme"||p.severity==="Severe"?"Red":p.severity==="Moderate"?"Orange":"Green",href:"https://forecast.weather.gov/MapClick.php?lat="+place.lat.toFixed(4)+"&lon="+place.lon.toFixed(4),t:Date.parse(p.sent||p.effective)||0});});}).catch(function(){return"x";}));
jobs.push(jget("https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP").then(function(j){var lim=Math.max(radius,500),cut=Date.now()-14*864e5;
(j.features||[]).forEach(function(f){var p=f.properties||{},g=f.geometry||{},c=g.coordinates;if(g.type!=="Point"||!c)return;var d=km(place.lat,place.lon,c[1],c[0]);
var to=Date.parse(p.todate)||Date.parse(p.fromdate)||0;if(to<cut||d>lim)return;D.gd.push({type:String(p.eventtype||"").toLowerCase()});
var u=p.url&&p.url.report;all.push({title:(p.name||p.description||p.eventtype||"").slice(0,220),meta:T.src+": "+T.gdacs+" - "+(p.country||"")+" - "+Math.round(d)+" "+T.km+" - "+T.pub+" "+when(Date.parse(p.fromdate)),lvl:p.alertlevel,href:u,t:to});});}).catch(function(){return"x";}));
Promise.all(jobs).then(function(r){if(r.length&&r.every(function(x){return x==="x";}))return fail("mp-off");all.sort(function(a,b){return b.t-a.t;});put("mp-off",all.slice(0,20),T.off_none);charts();});}
function quakes(){load("mp-eq");var deg=Math.min(radius/111,10),st=new Date(Date.now()-7*864e5).toISOString().slice(0,19);
var a=jget("https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=300&orderby=time&minmag=0&lat="+place.lat.toFixed(3)+"&lon="+place.lon.toFixed(3)+"&maxradius="+deg.toFixed(2)+"&starttime="+st).then(function(j){var o=[];
(j.features||[]).forEach(function(f){var p=f.properties||{},c=f.geometry&&f.geometry.coordinates;if(!c||p.mag==null)return;var la=p.lat!=null?p.lat:c[1],lo=p.lon!=null?p.lon:c[0],d=km(place.lat,place.lon,la,lo);if(d>radius)return;
o.push({t:Date.parse(p.time),mag:+p.mag,d:d,lat:la,lon:lo,title:"M"+(+p.mag).toFixed(1)+" - "+(p.flynn_region||""),src:T.emsc,href:p.unid?"https://www.seismicportal.eu/eventdetails.html?unid="+encodeURIComponent(p.unid):null});});return o;}).catch(function(){return null;});
var b=jget("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson").then(function(j){var o=[];(j.features||[]).forEach(function(f){var c=f.geometry.coordinates,d=km(place.lat,place.lon,c[1],c[0]);if(d>radius)return;var p=f.properties;
o.push({t:p.time,mag:+p.mag,d:d,lat:c[1],lon:c[0],title:"M"+(p.mag!=null?p.mag.toFixed(1):"?")+" - "+(p.place||""),src:T.usgs,href:p.url});});return o;}).catch(function(){return null;});
Promise.all([a,b]).then(function(r){if(r[0]===null&&r[1]===null){D.q=[];fail("mp-eq");charts();return;}var e1=r[0]||[],o=e1.slice();
(r[1]||[]).forEach(function(u){var dup=e1.some(function(e){return Math.abs(e.t-u.t)<120000&&km(e.lat,e.lon,u.lat,u.lon)<150;});if(!dup)o.push(u);});
o.sort(function(x,y){return y.t-x.t;});D.q=o;put("mp-eq",o.slice(0,30).map(function(e){return{title:e.title,meta:Math.round(e.d)+" "+T.km+" - "+T.src+": "+e.src+" - "+T.pub+" "+when(e.t),href:e.href};}),T.eq_none);
if(o.length>30){$("mp-eq").appendChild(el("p","mp-priv",T.more.replace("{n}",String(o.length-30))));}charts();});}
function events(){load("mp-ev");D.ev=[];jget("https://eonet.gsfc.nasa.gov/api/v3/events?days=7&status=all&limit=300").then(function(j){var o=[];
(j.events||[]).forEach(function(e){var g=(e.geometry||[]).slice(-1)[0];if(!g)return;var c=g.coordinates;if(g.type==="Polygon")c=c[0][0];if(!c||c.length<2||typeof c[0]!=="number")return;
var d=km(place.lat,place.lon,c[1],c[0]);if(d>radius)return;var cat=(e.categories||[{}])[0].title||"",s=(e.sources||[{}])[0].url;
o.push({title:(cat?cat+": ":"")+e.title,cat:cat||"?",meta:Math.round(d)+" "+T.km+" - "+T.src+": "+T.eonet+" - "+T.pub+" "+when(Date.parse(g.date)),href:ok(s)?s:e.link,t:Date.parse(g.date)||0});});
o.sort(function(a,b){return b.t-a.t;});D.ev=o;put("mp-ev",o.slice(0,25),T.ev_none);charts();}).catch(function(){fail("mp-ev");});}
function links(){var b=$("mp-lk");b.textContent="";var ul=el("ul","mp-list"),cc=place.cc||"",L=(LK[cc]||[]).concat(EUC.indexOf(cc)>=0||!cc?T.eu_links:[]).concat([[T.wmo,"https://severeweather.wmo.int/"],[T.gd_all,"https://www.gdacs.org/"],[T.eu112,"https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-112/index_en.htm"]]);
L.forEach(function(x){var li=el("li","mp-item"),a=el("a",null,x[0]);a.href=x[1];a.rel="noopener";a.target="_blank";li.appendChild(el("div","mp-t")).appendChild(a);ul.appendChild(li);});b.appendChild(ul);}
function alts(){var b=$("mp-alts");b.textContent="";if(hits.length<2)return;b.appendChild(el("span","mp-priv",T.alts+" "));
hits.slice(1,6).forEach(function(x){var bt=el("button","mp-alt",[x.name,x.admin1,x.country].filter(Boolean).join(", "));bt.type="button";bt.onclick=function(){setPlace(pick(x));};b.appendChild(bt);});}
function show(){$("mp-pick").hidden=!!place;$("mp-res").hidden=!place;if(!place)return;$("mp-name").textContent=place.name;
$("mp-chk").textContent=T.checked+": "+when(Date.now());D.q=[];D.ev=[];D.gd=[];charts();official();quakes();events();links();alts();}
function setPlace(p){place=p;ls(KEY,p);show();window.scrollTo&&$("mp-res").scrollIntoView&&$("mp-res").scrollIntoView({behavior:"smooth",block:"start"});}
function pick(x){return{name:[x.name,x.country].filter(Boolean).join(", "),lat:x.latitude,lon:x.longitude,cc:(x.country_code||"").toUpperCase(),country:x.country||""};}
function search(){var q=$("mp-q").value.trim(),o=$("mp-hits");o.textContent="";if(q.length<2)return;o.appendChild(el("p","mp-none",T.loading));
jget("https://geocoding-api.open-meteo.com/v1/search?count=8&format=json&language="+encodeURIComponent(LANG)+"&name="+encodeURIComponent(q)).then(function(j){o.textContent="";var r=j.results||[];
if(!r.length){o.appendChild(el("p","mp-none",T.nores));return;}hits=r;setPlace(pick(r[0]));}).catch(function(){o.textContent="";o.appendChild(el("p","mp-none",T.err));});}
$("mp-form").addEventListener("submit",function(e){e.preventDefault();search();});
$("mp-geo").addEventListener("click",function(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){hits=[];setPlace({name:T.my_loc,lat:p.coords.latitude,lon:p.coords.longitude,cc:"",country:""});},function(){});});
$("mp-chg").addEventListener("click",function(){place=null;hits=[];ls(KEY,null);show();$("mp-q").focus();});
$("mp-rad").addEventListener("change",function(){radius=+this.value;ls("athena.place.r",radius);if(place){official();quakes();events();}});
$("mp-print").addEventListener("click",function(){window.print();});
var r0=ls("athena.place.r");if(r0){radius=+r0;$("mp-rad").value=String(radius);}
var saved=ls(KIT)||{};var boxes=R.querySelectorAll("input.mp-k");for(var i=0;i<boxes.length;i++){(function(b){b.checked=!!saved[b.value];b.addEventListener("change",function(){var s=ls(KIT)||{};s[b.value]=b.checked;ls(KIT,s);});})(boxes[i]);}
var qs=new URLSearchParams(location.search).get("q");if(qs)$("mp-q").value=qs.slice(0,80);place=qs?null:ls(KEY);show();if(qs)search();
})();
