(function(){var a=document.getElementById("mpc-c");if(!a)return;var p=null;try{p=JSON.parse(localStorage.getItem("athena.place.v1")||"null");}catch(x){}
if(!p||!p.name)return;a.textContent=a.getAttribute("data-t").replace("{place}",p.name);a.hidden=false;})();
