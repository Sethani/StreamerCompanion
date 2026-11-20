'use strict';
const boxOptions=window.ChatboxOptions,boxForm=document.getElementById('chatbox-editor'),boxSelect=document.getElementById('chatbox-select');
let savedBoxes={revision:0,items:[]},boxDraft='',boxDirty=false;
const boxFeedback=(value,error=false)=>{const node=document.getElementById('box-feedback');node.textContent=value;node.className=error?'error':'';};
const boxControls=new Map();
let previewTimer;
document.getElementById('box-backing').onchange=event=>{document.querySelector('.box-preview-stage').dataset.backing=event.target.value;};
for(const [title,fields]of Object.entries(boxOptions.groups)){
 const group=document.createElement('details'),summary=document.createElement('summary');summary.textContent=title;group.append(summary);group.open=title==='Layout and text';
 const grid=document.createElement('div');grid.className='box-fields';group.append(grid);
 for(const[key,[title,value,kind]]of Object.entries(fields)){
  const meta=boxOptions.meta[key]||{},row=document.createElement('div');row.className='box-field';row.dataset.field=key;
  const label=document.createElement('label');label.htmlFor='box-'+key;label.textContent=title;
  const control=document.createElement('div');control.className='box-control';
  let enabled;
  if(meta.optional){const toggleLabel=document.createElement('label');toggleLabel.className='box-override';enabled=document.createElement('input');enabled.type='checkbox';enabled.name=key+'_override';enabled.setAttribute('aria-label','Override '+title);toggleLabel.append(enabled,document.createTextNode('Override'));control.append(toggleLabel);}
  const input=document.createElement(Array.isArray(kind)?'select':'input');input.id='box-'+key;input.name=key;
  if(Array.isArray(kind))for(const choice of kind){const option=document.createElement('option');option.value=choice;option.textContent=choice==='horizontal'?'Horizontal ticker':'Normal vertical chat';input.append(option);}
  else input.type=meta.type||(typeof value==='boolean'?'checkbox':'text');
  for(const property of ['min','max','step'])if(meta[property]!==undefined)input[property]=meta[property];
  if(key==='command_prefix'){input.required=true;input.maxLength=100;}
  if(key==='fontfamily')input.setAttribute('list','box-fonts');
  if(input.type==='number')input.required=true;
  control.append(input);row.append(label,control);
  let hex;
  if(input.type==='color'){hex=document.createElement('input');hex.type='text';hex.className='box-hex';hex.maxLength=7;hex.pattern='#?[a-fA-F0-9]{6}';hex.setAttribute('aria-label',title+' hexadecimal color');hex.oninput=()=>{if(/^#?[a-fA-F0-9]{6}$/.test(hex.value))input.value='#'+hex.value.replace(/^#/,'');};input.addEventListener('input',()=>{hex.value=input.value;});control.append(hex);}
  const help=document.createElement('small');help.id='box-help-'+key;help.textContent=meta.help||'';row.append(help);input.setAttribute('aria-describedby',help.id);
  boxControls.set(key,{input,enabled,hex,meta});grid.append(row);
 }
 boxForm.append(group);
}
function syncBoxControls(){for(const{input,enabled,hex}of boxControls.values()){input.disabled=!!enabled&&!enabled.checked;if(hex)hex.disabled=input.disabled;}document.querySelector('[data-field=command_prefix]').hidden=!boxForm.elements.hide_commands.checked;boxForm.elements.command_prefix.required=boxForm.elements.hide_commands.checked;document.getElementById('box-delete').disabled=!boxDraft;}
function boxQuery(){const p=new URLSearchParams();for(const[key,{input,enabled}]of boxControls){if(enabled&&!enabled.checked)continue;const value=input.type==='checkbox'?String(input.checked):input.type==='color'?input.value.slice(1):input.value;if(value!==''||input.type==='checkbox')p.set(key,value);}return boxOptions.snapshot(p.toString());}
function boxUrl(){return location.origin+'/chat/chat.html?'+boxQuery();}
function refreshBoxPreview(){clearTimeout(previewTimer);const frame=document.getElementById('box-preview-frame');if(frame.hidden||!boxForm.checkValidity())return;frame.src=boxUrl()+'&preview=isolated';}
function sizeBoxPreview(){const horizontal=boxForm.elements.direction.value==='horizontal',workspace=document.getElementById('box-workspace');workspace.dataset.direction=horizontal?'horizontal':'vertical';const frame=document.getElementById('box-preview-frame');frame.style.width=document.getElementById('box-width').value+'px';frame.style.height=document.getElementById('box-height').value+'px';}
function updateBoxUrl(){syncBoxControls();document.getElementById('box-url').value=boxUrl();sizeBoxPreview();clearTimeout(previewTimer);previewTimer=setTimeout(refreshBoxPreview,300);}
function fillBox(query,name='New chatbox',id=''){
 const p=boxOptions.clean(query);boxDraft=id;document.getElementById('box-name').value=name;
 const messageColor=p.get('msg_color')||'',brightness=/^[a-f0-9]{6}$/i.test(messageColor)?[0,2,4].reduce((sum,offset,index)=>sum+parseInt(messageColor.slice(offset,offset+2),16)*[0.299,0.587,0.114][index],0):0;
 document.getElementById('box-backing').value=brightness>160?'dark':'light';document.querySelector('.box-preview-stage').dataset.backing=document.getElementById('box-backing').value;
 for(const[key,[,fallback]]of Object.entries(boxOptions.fields)){const{input,enabled,hex,meta}=boxControls.get(key),value=p.has(key)?p.get(key):meta.value??fallback;if(enabled)enabled.checked=p.has(key);if(input.type==='checkbox')input.checked=value===true||value==='true'||value==='1';else if(input.type==='color'){input.value=/^#?[a-fA-F0-9]{6}$/.test(value)?'#'+value.replace(/^#/,''):meta.value;if(hex)hex.value=input.value;}else input.value=value;}
 boxDirty=false;boxSelect.value=id;document.getElementById('box-width').value=boxForm.elements.direction.value==='horizontal'?900:300;document.getElementById('box-height').value=boxForm.elements.direction.value==='horizontal'?30:500;updateBoxUrl();
}
function drawBoxList(){boxSelect.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Unsaved chatbox';boxSelect.append(placeholder);for(const box of savedBoxes.items){const option=document.createElement('option');option.value=box.id;option.textContent=box.name;boxSelect.append(option);}boxSelect.value=boxDraft;document.getElementById('box-delete').disabled=!boxDraft;}
async function reloadBoxes(){savedBoxes=await api('/api/chat-core/chatboxes');drawBoxList();boxFeedback('Saved chatboxes loaded. The current draft is preserved.');}
boxForm.oninput=event=>{boxDirty=true;if(event.target.name==='direction'){const horizontal=event.target.value==='horizontal';document.getElementById('box-width').value=horizontal?900:300;document.getElementById('box-height').value=horizontal?30:500;}updateBoxUrl();};
boxForm.onchange=()=>updateBoxUrl();
for(const id of ['box-width','box-height'])document.getElementById(id).oninput=()=>{if(['box-width','box-height'].every(key=>document.getElementById(key).checkValidity())){sizeBoxPreview();clearTimeout(previewTimer);previewTimer=setTimeout(refreshBoxPreview,300);}};
const fonts=document.getElementById('box-fonts');for(const name of ['Open Sans','Arial','Arial Black','Calibri','Cambria','Comic Sans MS','Consolas','Courier New','Georgia','Impact','Segoe UI','Tahoma','Times New Roman','Trebuchet MS','Verdana']){const option=document.createElement('option');option.value=name;fonts.append(option);}
document.getElementById('box-name').oninput=()=>{boxDirty=true;};
boxSelect.onchange=()=>{if(boxDirty&&!confirm('Discard this unsaved chatbox draft?')){boxSelect.value=boxDraft;return;}const box=savedBoxes.items.find(item=>item.id===boxSelect.value);fillBox(box?.appearance||'',box?.name||'New chatbox',box?.id||'');};
document.getElementById('box-new').onclick=()=>{if(boxDirty&&!confirm('Discard this unsaved chatbox draft?'))return;fillBox('');};
document.getElementById('box-import').onclick=()=>{const value=document.getElementById('box-import-url').value,p=boxOptions.clean(value);if(p.get('appearance_mode')!=='standalone'){const merged=boxOptions.clean(form.elements.appearance.value);for(const[k,v]of p)merged.set(k,v);fillBox(merged.toString(),'Imported chatbox');}else fillBox(p.toString(),'Imported chatbox');boxFeedback('URL loaded into a new draft. Connection and unsupported options are discarded. Your OBS source has not changed.');};
document.getElementById('box-reload').onclick=()=>reloadBoxes().catch(error=>boxFeedback(error.message,true));
document.getElementById('box-save').onclick=async()=>{
 if(!boxForm.reportValidity())return;
 updateBoxUrl();
 try{const name=document.getElementById('box-name').value.trim();if(!name||name.length>100)throw Error('Enter a name up to 100 characters.');const id=boxDraft||crypto.randomUUID(),item={id,name,appearance:boxQuery()},items=savedBoxes.items.filter(box=>box.id!==id);items.push(item);savedBoxes=await api('/api/chat-core/chatboxes',{revision:savedBoxes.revision,items});boxDraft=id;drawBoxList();boxDirty=false;boxFeedback('Chatbox saved. Previously copied URLs keep their appearance.');}catch(error){boxFeedback(error.message,true);}
};
document.getElementById('box-delete').onclick=async()=>{if(!boxDraft)return;try{savedBoxes=await api('/api/chat-core/chatboxes',{revision:savedBoxes.revision,items:savedBoxes.items.filter(box=>box.id!==boxDraft)});fillBox(boxQuery(),document.getElementById('box-name').value);drawBoxList();boxFeedback('Saved chatbox deleted. Its copied URLs still work.');}catch(error){boxFeedback(error.message,true);}};
document.getElementById('box-copy').onclick=async()=>{if(!boxForm.reportValidity())return;try{await navigator.clipboard.writeText(boxUrl());boxFeedback('OBS URL copied.');}catch(_){document.getElementById('box-url').select();boxFeedback('Select and copy the URL above.');}};
function openBoxPreview(){const frame=document.getElementById('box-preview-frame');frame.hidden=false;sizeBoxPreview();refreshBoxPreview();boxFeedback('Local synthetic preview updates as you edit. Live renderers and the archive receive nothing.');}
document.getElementById('box-preview').onclick=openBoxPreview;
document.querySelector('[data-panel="chatboxes-panel"]').addEventListener('click',openBoxPreview);
document.getElementById('box-preview-close').onclick=()=>{const frame=document.getElementById('box-preview-frame');clearTimeout(previewTimer);frame.src='about:blank';frame.hidden=true;};
fillBox('');reloadBoxes().catch(error=>boxFeedback(error.message,true));
