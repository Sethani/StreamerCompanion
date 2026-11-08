'use strict';
// Generic, read-only widget formatting. The host clock avoids handset clock skew.
(function(root){
 function remaining(timer,fields,hostNow){const status=fields[timer.status],left=fields[timer.remainingMs];if(!['running','paused','idle','finished'].includes(status)||!Number.isFinite(left)||left<0)return null;if(status==='running'){const end=fields[timer.endTimeMs];if(!Number.isFinite(end)||!Number.isFinite(hostNow))return null;return Math.max(0,end-hostNow);}return status==='idle'||status==='finished'?0:left;}
 function format(ms){if(ms===null)return 'Unknown';const seconds=Math.ceil(ms/1000),hours=Math.floor(seconds/3600);return hours?hours+':'+String(Math.floor(seconds/60)%60).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'):Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
 function widget(control,fields,hostNow){const parts=(control.display||[]).map(k=>fields[k]===undefined||fields[k]===null?'Unknown':fields[k]===''?'':(control.displayLabels?.[k]?control.displayLabels[k]+': ':'')+String(fields[k])).filter(Boolean);if(!control.timer)return{value:parts.join(' · '),detail:''};const ms=remaining(control.timer,fields,hostNow),status=fields[control.timer.status];return{value:format(ms),detail:ms===null?'Timer state unavailable':ms===0&&status!=='idle'?'Finished'+(fields[control.timer.finishedText]?' · '+fields[control.timer.finishedText]:''):status==='paused'?'Paused':status==='idle'?'Idle':'Running'};}
 function combined(kind,groups){const state=id=>groups.find(g=>g.packageId===id)?.state||{};
  if(kind==='stream'){const s=state('stream-launch');return s.status===undefined?'':`Launch: ${s.status}${s.spotify?' · Music: '+s.spotify:''}${s.followup?' · Follow-up: '+s.followup:''}${s.error?' · '+s.error:''}`;}
  const v=state('video'),w=state('wheel');return{value:v.visible===true?'Playing':v.visible===false?'Ready':'Video unavailable',detail:[v.visible===true?(v.title||v.video||'Registered video'):'',v.error||'',w.status===undefined?'Wheel unavailable':'Wheel: '+w.status,w.result?'Result: '+w.result:''].filter(Boolean).join(' · ')};
 }
 const api={remaining,format,widget,combined};if(typeof module==='object'&&module.exports)module.exports=api;else root.PhoneDeckPresentation=api;
})(typeof window==='object'?window:globalThis);
