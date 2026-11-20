'use strict';
const path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{initialize,legacyMember}=require('./schema');
const text=(v,max=200)=>typeof v==='string'?v.slice(0,max):'';
function createStore(directory,options={}){
 const db=new DatabaseSync(path.join(directory,'chat.sqlite')),now=options.now||Date.now;
 let migration;try{db.exec('PRAGMA journal_mode=WAL;PRAGMA secure_delete=ON;PRAGMA foreign_keys=ON;');migration=initialize(db,directory,options);}catch(error){db.close();throw error;}
 db.function('is_command',{deterministic:true},(body,prefix)=>String(body).trimStart().startsWith(String(prefix))?1:0);
 const getMessage=db.prepare('SELECT * FROM archive_messages WHERE message_id=?');
 const getUser=db.prepare('SELECT * FROM users WHERE platform=? AND platform_user_id=?');
 const saveIdentity=db.prepare(`INSERT INTO users(platform,platform_user_id,login,display_name,identity_at) VALUES(?,?,?,?,?) ON CONFLICT(platform,platform_user_id) DO UPDATE SET login=CASE WHEN excluded.login<>'' THEN excluded.login ELSE users.login END,display_name=CASE WHEN excluded.display_name<>'' THEN excluded.display_name ELSE users.display_name END,identity_at=excluded.identity_at WHERE excluded.identity_at>=users.identity_at`);
 const savePronouns=db.prepare('UPDATE users SET pronouns=?,pronouns_at=? WHERE id=? AND pronouns_at<=?');
 const saveMember=db.prepare(`INSERT INTO pluralmind_members(system_id,member_id,name,pronouns,profile_at) VALUES(?,?,?,?,?) ON CONFLICT(system_id,member_id) DO UPDATE SET name=excluded.name,pronouns=CASE WHEN ? THEN excluded.pronouns ELSE pluralmind_members.pronouns END,profile_at=excluded.profile_at WHERE excluded.profile_at>=pluralmind_members.profile_at`);
 const getMember=db.prepare('SELECT id FROM pluralmind_members WHERE system_id=? AND member_id=?');
 const insert=db.prepare('INSERT INTO messages(message_id,occurred_at_ms,archived_at_ms,channel_id,user_ref,member_ref,original_text,displayed_text,message_type) VALUES(?,?,?,?,?,?,?,?,?)');
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
 function profile(m,platform,userId,at,current){
  const proxy=m.pluralmind===true;
  const original=m.originalUser||(!proxy?m.user:null)||{};
  const originalName=text(original.displayName||current?.original_name||m.user?.displayName);
  const login=text(original.login||m.user?.login||current?.login);
  saveIdentity.run(platform,userId,login,originalName,at);const user=getUser.get(platform,userId);
  const pronouns=proxy?m.normalPronouns:m.user?.pronouns;
  // Old producers cannot distinguish unknown from removed pronouns. Never erase a
  // known profile for an unconfirmed empty field; new producers explicitly confirm it.
  if(typeof pronouns==='string'&&(pronouns||m.pronounsKnown===true))savePronouns.run(text(pronouns),at,user.id,at);
  let memberId=null;
  if(proxy){
   const identity=m.pluralmindMember;
   const key=identity?.id?{systemId:text(identity.systemId)||'account:'+platform+':'+userId,id:text(identity.id)}:legacyMember(platform+':'+userId,text(m.user?.displayName));
   const known=!!m.user?.pronouns||identity?.pronounsKnown===true||(identity?.pronounsKnown===undefined&&m.pronounsKnown===true);
   saveMember.run(key.systemId,key.id,text(m.user?.displayName),text(m.user?.pronouns),at,known?1:0);memberId=getMember.get(key.systemId,key.id).id;
  }
  return {userId:user.id,memberId};
 }
 function accept(type,m,cfg){
  if(!cfg.enabled||!m||m.schemaVersion!==1||m.synthetic)return;
  if(m.user?.id==='twitch:test'&&String(m.messageId).startsWith('twitch:test-'))return;
  if(type==='message'){
   if(cfg.excludeCommands&&String(m.originalText??m.text??'').trimStart().startsWith(cfg.commandPrefix||'!'))return;
   const platform=m.platform;if(!['twitch','youtube'].includes(platform)||!m.messageId?.startsWith(platform+':')||!m.user?.id||!m.text)return;
   if(m.messageType==='announcement'&&!cfg.archiveAnnouncements)return;
   const at=Number(m.occurredAtMs);if(!Number.isSafeInteger(at)||at<0||at>now()+86400000||at<now()-cfg.retentionDays*86400000)return;
   if(getMessage.get(text(m.messageId)))return;
   const blocked=db.prepare("SELECT 1 FROM moderation WHERE (scope='message-delete' AND target=?) OR (scope='user-delete' AND target=? AND at>=?) OR (scope='chat-clear' AND target=? AND at>=?)").get(text(m.messageId),text(m.user.id),at,platform,at);if(blocked)return;
   transaction(()=>{const p=profile(m,platform,text(m.user.id),at),original=text(m.originalText??m.text,20000),displayed=text(m.text,20000);insert.run(text(m.messageId),at,now(),text(m.channelId),p.userId,p.memberId,original,displayed===original?null:displayed,m.messageType==='announcement'?'announcement':'chat');});
  }else if(type==='message-update'){
   const current=getMessage.get(text(m.messageId));if(!current||current.deleted)return;
   transaction(()=>{const p=profile(m,current.platform,current.user_id,current.occurred_at_ms,current),displayed=text(m.text,20000);db.prepare('UPDATE messages SET member_ref=?,displayed_text=? WHERE id=?').run(p.memberId,displayed===current.original_text?null:displayed,current.id);});
  }else{
   const where=type==='message-delete'?'message_id=?':type==='user-delete'?'user_id=?':type==='chat-clear'?'platform=?':null;
   const value=type==='message-delete'?m.messageId:type==='user-delete'?m.userId:m.platform;if(!where||!value)return;
   transaction(()=>{db.prepare('INSERT INTO moderation(scope,target,at) VALUES(?,?,?) ON CONFLICT(scope,target) DO UPDATE SET at=excluded.at').run(type,text(value),now());const scrub=cfg.archiveDeletedText?'':",original_text='',displayed_text=NULL";db.prepare('UPDATE messages SET deleted=1'+scrub+' WHERE id IN(SELECT id FROM archive_messages WHERE '+where+')').run(text(value));});
  }
 }
 function filters(params,cfg={}){
  const where=[],values=[],q=text(params.get('query')||'',500).trim(),user=text(params.get('user')||'',200).trim(),platform=params.get('platform'),deleted=params.get('deleted');
  if(cfg.excludeCommands){where.push('is_command(original_text,?)=0');values.push(cfg.commandPrefix||'!');}
  if(q){where.push('(instr(lower(original_text),lower(?))>0 OR instr(lower(displayed_text),lower(?))>0)');values.push(q,q);}
  if(user){where.push('(instr(lower(login),lower(?))>0 OR instr(lower(original_name),lower(?))>0 OR instr(lower(display_name),lower(?))>0 OR user_id=?)');values.push(user,user,user,user);}
  if(platform){if(!['twitch','youtube'].includes(platform))throw Error('Invalid platform filter.');where.push('platform=?');values.push(platform);}
  if(deleted){if(!['yes','no'].includes(deleted))throw Error('Invalid deletion filter.');where.push('deleted=?');values.push(deleted==='yes'?1:0);}
  for(const key of ['from','to']){const date=params.get(key);if(!date)continue;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Invalid date filter.');where.push('occurred_at_ms'+(key==='from'?'>=':'<')+'?');values.push(Date.parse(date+'T00:00:00Z')+(key==='to'?86400000:0));}
  if(params.get('from')&&params.get('to')&&params.get('from')>params.get('to'))throw Error('From must precede Through.');
  return{where:where.length?' WHERE '+where.join(' AND '):'',values};
 }
 function count(cfg={}){const{where,values}=filters(new URLSearchParams(),cfg);return Number(db.prepare('SELECT count(*) AS n FROM archive_messages'+where).get(...values).n);}
 function page(params,cfg){const{where,values}=filters(params,cfg),limit=Number(params.get('limit')||100),offset=Number(params.get('offset')||0);if(!Number.isInteger(limit)||limit<1||limit>500||!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid page.');return{rows:db.prepare('SELECT * FROM archive_messages'+where+' ORDER BY occurred_at_ms DESC,id DESC LIMIT ? OFFSET ?').all(...values,limit,offset),total:Number(db.prepare('SELECT count(*) AS n FROM archive_messages'+where).get(...values).n),limit,offset};}
 return{accept,page,count,migration,
  exportRows(params,cfg){const{where,values}=filters(params,cfg);const total=Number(db.prepare('SELECT count(*) AS n FROM archive_messages'+where).get(...values).n);if(total>10000)throw Error('Export limited to 10,000 messages. Narrow your filters.');return db.prepare('SELECT * FROM archive_messages'+where+' ORDER BY occurred_at_ms DESC,id DESC').all(...values);},
  prune(days){return transaction(()=>{db.prepare('DELETE FROM moderation WHERE at<?').run(now()-days*86400000);const removed=Number(db.prepare('DELETE FROM messages WHERE occurred_at_ms<?').run(now()-days*86400000).changes);db.exec('DELETE FROM pluralmind_members WHERE NOT EXISTS(SELECT 1 FROM messages WHERE member_ref=pluralmind_members.id);DELETE FROM users WHERE NOT EXISTS(SELECT 1 FROM messages WHERE user_ref=users.id);');return removed;});},
  scrub(){db.exec("UPDATE messages SET original_text='',displayed_text=NULL WHERE deleted=1");},
  close(){db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();}
 };
}
module.exports={createStore};
