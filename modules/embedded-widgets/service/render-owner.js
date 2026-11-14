'use strict';
const fs=require('node:fs');
const valid=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
module.exports=function(file,write){let owner=null,broken=false;try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.version!==1||saved.owner!==null&&!valid(saved.owner))throw Error();owner=saved.owner;}catch(e){if(e.code!=='ENOENT')broken=true;}
 function check(id){if(broken)throw Object.assign(Error('Widget renderer ownership needs an off-stream recovery check.'),{statusCode:503});if(!valid(id))throw Object.assign(Error('Invalid renderer session.'),{statusCode:400});}
 function persist(next){try{write(file,{version:1,owner:next});}catch{throw Object.assign(Error('Renderer ownership could not be saved.'),{statusCode:503});}owner=next;}
 return{acquire(id){check(id);if(owner&&owner!==id)return false;if(!owner)persist(id);return true;},release(id){check(id);if(owner&&owner!==id)return false;if(owner)persist(null);return true;}};
};
