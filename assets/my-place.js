(function(){
var R=document.getElementById("mp");if(!R)return;
var T=JSON.parse(R.getAttribute("data-t")),LK=JSON.parse(R.getAttribute("data-links")),LANG=R.getAttribute("data-lang");
var KEY="athena.place.v1",KIT="athena.kit.v1",place=null,radius=300;
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
function official(){load("mp-off");var jobs=[],all=[];
if(inUS(place))jobs.push(jget("https://api.weather.gov/alerts/active?point="+place.lat.toFixed(4)+","+place.lon.toFixed(4)).then(function(j){(j.features||[]).forEach(function(f){var p=f.properties||{};
all.push({title:(p.headline||p.event||"").slice(0,220),meta:T.src+": "+T.nws+(p.senderName?" - "+p.senderName:"")+" - "+T.pub+" "+when(Date.parse(p.sent||p.effective)),lvl:p.severity==="Extreme"||p.severity==="Severe"?"Red":p.severity==="Moderate"?"Orange":"Green",href:"https://forecast.weather.gov/MapClick.php?lat="+place.lat.toFixed(4)+"&lon="+place.lon.toFixed(4),t:Date.parse(p.sent||p.effective)||0});});}).catch(function(){return"x";}));
jobs.push(jget("https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP").then(function(j){var lim=Math.max(radius,500),cut=Date.now()-14*864e5;
(j.features||[]).forEach(function(f){var p=f.properties||{},g=f.geometry||{},c=g.coordinates;if(g.type!=="Point"||!c)return;var d=km(place.lat,place.lon,c[1],c[0]);
var to=Date.parse(p.todate)||Date.parse(p.fromdate)||0;if(to<cut)return;if(d>lim)return;
var u=p.url&&p.url.report;all.push({title:(p.name||p.description||p.eventtype||"").slice(0,220),meta:T.src+": "+T.gdacs+" - "+(p.country||"")+" - "+Math.round(d)+" "+T.km+" - "+T.pub+" "+when(Date.parse(p.fromdate)),lvl:p.alertlevel,href:u,t:to});});}).catch(function(){return"x";}));
Promise.all(jobs).then(function(r){if(r.length&&r.every(function(x){return x==="x";}))return fail("mp-off");all.sort(function(a,b){return b.t-a.t;});put("mp-off",all.slice(0,20),T.off_none);});}
function quakes(){load("mp-eq");jget("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson").then(function(j){var o=[];
(j.features||[]).forEach(function(f){var c=f.geometry.coordinates,d=km(place.lat,place.lon,c[1],c[0]);if(d>radius)return;var p=f.properties;
o.push({title:"M"+(p.mag!=null?p.mag.toFixed(1):"?")+" - "+(p.place||""),meta:Math.round(d)+" "+T.km+" - "+T.src+": "+T.usgs+" - "+T.pub+" "+when(p.time),href:p.url,t:p.time});});
o.sort(function(a,b){return b.t-a.t;});put("mp-eq",o.slice(0,25),T.eq_none);}).catch(function(){fail("mp-eq");});}
function events(){load("mp-ev");jget("https://eonet.gsfc.nasa.gov/api/v3/events?days=7&status=all&limit=300").then(function(j){var o=[];
(j.events||[]).forEach(function(e){var g=(e.geometry||[]).slice(-1)[0];if(!g)return;var c=g.coordinates;if(g.type==="Polygon")c=c[0][0];if(!c||c.length<2||typeof c[0]!=="number")return;
var d=km(place.lat,place.lon,c[1],c[0]);if(d>radius)return;var cat=(e.categories||[{}])[0].title||"",s=(e.sources||[{}])[0].url;
o.push({title:(cat?cat+": ":"")+e.title,meta:Math.round(d)+" "+T.km+" - "+T.src+": "+T.eonet+" - "+T.pub+" "+when(Date.parse(g.date)),href:ok(s)?s:e.link,t:Date.parse(g.date)||0});});
o.sort(function(a,b){return b.t-a.t;});put("mp-ev",o.slice(0,25),T.ev_none);}).catch(function(){fail("mp-ev");});}
function links(){var b=$("mp-lk");b.textContent="";var ul=el("ul","mp-list"),cc=place.cc||"",L=(LK[cc]||[]).concat([[T.wmo,"https://severeweather.wmo.int/"],[T.gd_all,"https://www.gdacs.org/"],[T.eu112,"https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency-112/index_en.htm"]]);
L.forEach(function(x){var li=el("li","mp-item"),a=el("a",null,x[0]);a.href=x[1];a.rel="noopener";a.target="_blank";li.appendChild(el("div","mp-t")).appendChild(a);ul.appendChild(li);});b.appendChild(ul);}
function show(){$("mp-pick").hidden=!!place;$("mp-res").hidden=!place;if(!place)return;$("mp-name").textContent=place.name;
$("mp-chk").textContent=T.checked+": "+when(Date.now());official();quakes();events();links();}
function setPlace(p){place=p;ls(KEY,p);show();}
function search(){var q=$("mp-q").value.trim(),o=$("mp-hits");o.textContent="";if(q.length<2)return;o.appendChild(el("p","mp-none",T.loading));
jget("https://geocoding-api.open-meteo.com/v1/search?count=8&format=json&language="+encodeURIComponent(LANG)+"&name="+encodeURIComponent(q)).then(function(j){o.textContent="";var r=j.results||[];
if(!r.length){o.appendChild(el("p","mp-none",T.nores));return;}var ul=el("ul","mp-list");r.forEach(function(x){var li=el("li","mp-item"),b=el("button","mp-pickbtn",[x.name,x.admin1,x.country].filter(Boolean).join(", "));b.type="button";
b.onclick=function(){setPlace({name:[x.name,x.country].filter(Boolean).join(", "),lat:x.latitude,lon:x.longitude,cc:(x.country_code||"").toUpperCase(),country:x.country||""});};li.appendChild(b);ul.appendChild(li);});o.appendChild(ul);}).catch(function(){o.textContent="";o.appendChild(el("p","mp-none",T.err));});}
$("mp-form").addEventListener("submit",function(e){e.preventDefault();search();});
$("mp-geo").addEventListener("click",function(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){setPlace({name:T.my_loc,lat:p.coords.latitude,lon:p.coords.longitude,cc:"",country:""});},function(){});});
$("mp-chg").addEventListener("click",function(){place=null;ls(KEY,null);show();});
$("mp-rad").addEventListener("change",function(){radius=+this.value;ls("athena.place.r",radius);if(place){quakes();events();official();}});
$("mp-print").addEventListener("click",function(){window.print();});
var r0=ls("athena.place.r");if(r0){radius=+r0;$("mp-rad").value=String(radius);}
var saved=ls(KIT)||{};var boxes=R.querySelectorAll("input.mp-k");for(var i=0;i<boxes.length;i++){(function(b){b.checked=!!saved[b.value];b.addEventListener("change",function(){var s=ls(KIT)||{};s[b.value]=b.checked;ls(KIT,s);});})(boxes[i]);}
var qs=new URLSearchParams(location.search).get("q");if(qs)$("mp-q").value=qs.slice(0,80);place=qs?null:ls(KEY);show();if(qs)search();
})();
