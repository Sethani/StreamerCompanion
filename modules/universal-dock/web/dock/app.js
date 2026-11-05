'use strict';
const $ = id => document.getElementById(id), frame = $('controls');
let modules = [], favorites = new Set(), csrf = '', selected = '', onlyFavorites = false, available = true, preferencesAvailable = false;
try { selected = localStorage.getItem('companion-dock-selected') || ''; onlyFavorites = localStorage.getItem('companion-dock-favorites') === 'true'; } catch (_) {}
$('favorites').checked = onlyFavorites;
const rows = new Map(), groups = new Map(), compare = new Intl.Collator('en', {sensitivity:'base',numeric:true});
const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const category = item => String(item.category || '').trim() || 'Other';
function setText(node,value){ if(node.textContent!==value)node.textContent=value; }
function showSelection() {
 const item = modules.find(i => i.packageId === selected);
 const usable = available && item && !['broken','incompatible','missing-dependency'].includes(item.state);
 setText($('module-picker'), item ? item.name + ' ▾' : selected ? 'Selected module unavailable ▾' : 'Choose module…');
 setText($('status'), !available ? 'Companion unavailable. Reconnecting…' : item ? item.state === 'ready' ? preferencesAvailable ? 'Ready' : 'Ready · shared favorites unavailable' : item.problem || item.state : preferencesAvailable ? '' : 'Shared favorites unavailable; update Companion.');
 $('placeholder').hidden = Boolean(usable); frame.hidden = !usable;
 setText($('placeholder'), !available ? 'Companion is unavailable. Your selection is retained.' : selected ? 'The selected module is unavailable. Choose a module or wait for it to return.' : 'Choose a module to open its controls.');
 const url = usable ? item.nodeUrl : 'about:blank'; if(frame.getAttribute('src') !== url)frame.src=url;
}
function draw() {
 const terms = fold($('search').value).split(/\s+/).filter(Boolean);
 const matches = modules.filter(i => (!onlyFavorites || favorites.has(i.packageId)) && terms.every(term => fold([i.name,i.packageId,i.description,category(i)].join(' ')).includes(term)));
 setText($('count'), matches.length + ' of ' + modules.length + ' modules' + (!matches.length ? ' · No matching modules.' : ''));
 const visibleIds=new Set(matches.map(i=>i.packageId)),visibleCategories=new Set(matches.map(category));
 for(const [id,row] of rows)row.node.hidden=!visibleIds.has(id);for(const [cat,group] of groups)group.node.hidden=!visibleCategories.has(cat);
 const cats = [...new Set(matches.map(category))].sort(compare.compare);
 for(const cat of cats){
  let group=groups.get(cat); if(!group){const node=document.createElement('section'), title=document.createElement('h2');title.textContent=cat;node.append(title);group={node};groups.set(cat,group);$('choices').append(node);}group.node.hidden=false;
  for(const item of matches.filter(i=>category(i)===cat)){
   let row=rows.get(item.packageId);
   if(!row){ const node=document.createElement('div'), choose=document.createElement('button'), star=document.createElement('button');node.className='choice';choose.className='choose';star.className='star';node.append(choose,star);row={node,choose,star}; rows.set(item.packageId,row);
    choose.onclick=()=>{selected=item.packageId;try{localStorage.setItem('companion-dock-selected',selected);}catch(_){}closePicker();showSelection();draw();};
    star.onclick=async()=>{star.disabled=true;try{const response=await fetch('/api/ui/favorites/'+encodeURIComponent(item.packageId),{method:'PUT',headers:{'Content-Type':'application/json','X-Companion-CSRF':csrf},body:JSON.stringify({favorite:!favorites.has(item.packageId)})});if(!response.ok)throw new Error('Could not save favorite.');favorites=new Set((await response.json()).favorites);draw();}catch(error){setText($('status'),error.message);}finally{star.disabled=false;}};
   }
   row.node.hidden=false;setText(row.choose,item.name+' · '+(item.state==='ready'?'Ready':item.problem||item.state));row.choose.setAttribute('aria-current',String(selected===item.packageId));setText(row.star,favorites.has(item.packageId)?'★':'☆');row.star.setAttribute('aria-pressed',String(favorites.has(item.packageId)));row.star.setAttribute('aria-label',(favorites.has(item.packageId)?'Unfavorite ':'Favorite ')+item.name);row.star.disabled=!csrf;
   if(row.node.parentNode!==group.node)group.node.append(row.node);
  }
  const ordered=matches.filter(i=>category(i)===cat);ordered.forEach((item,index)=>{const node=rows.get(item.packageId).node,current=[...group.node.querySelectorAll('.choice')].filter(n=>!n.hidden)[index];if(node!==current)group.node.insertBefore(node,current||null);});
 }
 cats.forEach((cat,index)=>{const node=groups.get(cat).node,current=[...$('choices').children].filter(n=>!n.hidden)[index];if(node!==current)$('choices').insertBefore(node,current||null);});
}
function closePicker(){$('picker').hidden=true;$('module-picker').setAttribute('aria-expanded','false');$('module-picker').focus();}
$('module-picker').onclick=()=>{const open=$('picker').hidden;$('picker').hidden=!open;$('module-picker').setAttribute('aria-expanded',String(open));if(open)$('search').focus();};
$('picker').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();closePicker();}};
$('search').oninput=draw;$('clear').onclick=()=>{$('search').value='';draw();$('search').focus();};
$('favorites').onchange=()=>{onlyFavorites=$('favorites').checked;try{localStorage.setItem('companion-dock-favorites',String(onlyFavorites));}catch(_){}draw();};
let refreshing=false;
async function refresh(){if(refreshing)return;refreshing=true;try{
 const registry=await StreamingModuleRegistry.load();modules=registry.modules.filter(i=>i.packageId!=='universal-dock'&&i.nodeUrl).sort((a,b)=>compare.compare(category(a),category(b))||compare.compare(a.name,b.name)||a.packageId.localeCompare(b.packageId));available=true;
 try{const response=await fetch('/api/ui/preferences',{cache:'no-store'});if(!response.ok)throw new Error();const preferences=await response.json();favorites=new Set(preferences.favorites);csrf=preferences.csrf;preferencesAvailable=true;}catch(_){csrf='';preferencesAvailable=false;setText($('status'),'Shared favorites unavailable; update Companion.');}
 draw();showSelection();
}catch(_){available=false;csrf='';showSelection();}finally{refreshing=false;}}
refresh();setInterval(refresh,3000);
