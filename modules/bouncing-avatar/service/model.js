'use strict';
const crypto=require('node:crypto');
const MAX_BYTES=8*1024*1024,MAX_IMAGES=64;
function error(message,statusCode=400){return Object.assign(Error(message),{statusCode});}
function object(v,allowed){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw error('Invalid avatar settings.');}
function id(v){return typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);}
function defaults(){return{version:1,revision:0,enabled:false,changeColorOnBounce:true,imageId:'',images:[]};}
function settings(input){object(input,['enabled','changeColorOnBounce','imageId']);if(typeof input.enabled!=='boolean'||typeof input.changeColorOnBounce!=='boolean'||input.imageId!==''&&!id(input.imageId))throw error('Invalid avatar settings.');return{enabled:input.enabled,changeColorOnBounce:input.changeColorOnBounce,imageId:input.imageId};}
function dimensions(bytes){
 let type,width,height;
 if(bytes.length>=33&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))&&bytes.readUInt32BE(8)===13&&bytes.toString('ascii',12,16)==='IHDR'){type='png';width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);}
 else if(bytes.length>=13&&['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))){type='gif';width=bytes.readUInt16LE(6);height=bytes.readUInt16LE(8);}
 // RIFF/VP8X/VP8L layout: https://developers.google.com/speed/webp/docs/riff_container
 else if(bytes.length>=26&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'&&bytes.readUInt32LE(4)+8===bytes.length&&bytes.readUInt32LE(16)<=bytes.length-20){
  type='webp';const kind=bytes.toString('ascii',12,16);
  if(kind==='VP8X'&&bytes.length>=30&&bytes.readUInt32LE(16)===10){width=1+bytes.readUIntLE(24,3);height=1+bytes.readUIntLE(27,3);}
  else if(kind==='VP8 '&&bytes.length>=30&&bytes.subarray(23,26).equals(Buffer.from('9d012a','hex'))){width=bytes.readUInt16LE(26)&0x3fff;height=bytes.readUInt16LE(28)&0x3fff;}
  else if(kind==='VP8L'&&bytes[20]===0x2f){const value=bytes.readUInt32LE(21);width=(value&0x3fff)+1;height=((value>>>14)&0x3fff)+1;}
 }
 else if(bytes.length>=4&&bytes[0]===0xff&&bytes[1]===0xd8){
  let pos=2;while(pos+3<bytes.length){if(bytes[pos++]!==0xff)break;while(bytes[pos]===0xff)pos++;const marker=bytes[pos++];if(marker===0xda||marker===0xd9)break;if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;if(pos+2>bytes.length)break;const length=bytes.readUInt16BE(pos);if(length<2||pos+length>bytes.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=8){type='jpeg';height=bytes.readUInt16BE(pos+3);width=bytes.readUInt16BE(pos+5);break;}pos+=length;}
 }
 if(!type||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>8192||height>8192||width*height>32000000)throw error('Use a PNG, JPEG, GIF or WebP image within the size limits.');return{type,width,height};
}
function upload(input){object(input,['revision','name','data']);if(typeof input.name!=='string'||!input.name.trim()||input.name.length>160||/[\u0000-\u001f\u007f\\/]/.test(input.name)||typeof input.data!=='string'||input.data.length>Math.ceil(MAX_BYTES/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data))throw error('Invalid image upload.');const bytes=Buffer.from(input.data,'base64');if(!bytes.length||bytes.length>MAX_BYTES||bytes.toString('base64')!==input.data)throw error('Image must be no larger than 8 MiB.');return{bytes,image:{id:crypto.createHash('sha256').update(bytes).digest('hex'),name:input.name,...dimensions(bytes),bytes:bytes.length}};}
function validate(record){object(record,['version','revision','enabled','changeColorOnBounce','imageId','images']);if(record.version!==1||!Number.isSafeInteger(record.revision)||record.revision<0||!Array.isArray(record.images)||record.images.length>MAX_IMAGES)throw error('Invalid saved avatar settings.');const chosen=settings({enabled:record.enabled,changeColorOnBounce:record.changeColorOnBounce,imageId:record.imageId}),seen=new Set();for(const image of record.images){object(image,['id','name','type','width','height','bytes']);if(!id(image.id)||seen.has(image.id)||!['png','jpeg','gif','webp'].includes(image.type)||typeof image.name!=='string'||!image.name||image.name.length>160||/[\u0000-\u001f\u007f\\/]/.test(image.name)||!Number.isSafeInteger(image.bytes)||image.bytes<1||image.bytes>MAX_BYTES||![image.width,image.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=8192)||image.width*image.height>32000000)throw error('Invalid saved image library.');seen.add(image.id);}if(chosen.imageId&&!seen.has(chosen.imageId))throw error('Selected image is unavailable.');return{version:1,revision:record.revision,...chosen,images:record.images.map(i=>({...i}))};}
function summary(config){return{enabled:config.enabled,configured:!!config.imageId,changeColorOnBounce:config.changeColorOnBounce};}
module.exports={MAX_BYTES,MAX_IMAGES,error,object,id,defaults,settings,upload,dimensions,validate,summary};
