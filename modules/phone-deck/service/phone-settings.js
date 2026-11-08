'use strict';
function normalize(value){
 if(!value||typeof value.host!=='string'||!Array.isArray(value.hosts||[])||(value.hosts||[]).length>16)throw Error('Invalid phone address.');
 const host=v=>{if(typeof v!=='string'||v.length>253||v!==v.trim())throw Error('Use a hostname or IP address without a port or path.');let u;try{u=new URL('https://'+v);}catch{throw Error('Invalid phone hostname.');}if(u.hostname!==v.toLowerCase()||u.port||u.pathname!=='/'||u.username||u.password||u.search||u.hash)throw Error('Use a hostname or IP address without a port or path.');return u.hostname;};
 return{host:host(value.host),hosts:[...new Set((value.hosts||[]).map(host))]};
}
module.exports={normalize};
