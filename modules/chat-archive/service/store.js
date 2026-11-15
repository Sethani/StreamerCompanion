'use strict';
const path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const text=(v,max=200)=>typeof v==='string'?v.slice(0,max):'';
function createStore(directory,options={}){
 const db=new DatabaseSync(path.join(directory,'chat.sqlite')),now=options.now||Date.now;
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
 CREATE TABLE IF NOT EXISTS messages (
 id INTEGER PRIMARY KEY, message_id TEXT NOT NULL UNIQUE, occurred_at_ms INTEGER NOT NULL,
 archived_at_ms INTEGER NOT NULL, platform TEXT NOT NULL, channel_id TEXT NOT NULL,
 user_id TEXT NOT NULL, login TEXT NOT NULL, display_name TEXT NOT NULL,
 original_name TEXT NOT NULL, pronouns TEXT NOT NULL, original_text TEXT NOT NULL,
 displayed_text TEXT NOT NULL, message_type TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS archive_time ON messages(occurred_at_ms DESC,id DESC);
 CREATE INDEX IF NOT EXISTS archive_user ON messages(user_id,occurred_at_ms);
 CREATE TABLE IF NOT EXISTS moderation (scope TEXT NOT NULL, target TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY(scope,target));
 PRAGMA user_version=1;`);
 const row=()=>Number(db.prepare('SELECT count(*) AS n FROM messages').get().n);
 const insert=db.prepare(`INSERT OR IGNORE INTO messages(message_id,occurred_at_ms,archived_at_ms,platform,channel_id,user_id,login,display_name,original_name,pronouns,original_text,displayed_text,message_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
 function accept(type,m,cfg){
  if(!cfg.enabled||!m||m.schemaVersion!==1||m.synthetic)return;
  // Live Chatbox 1.0.1 predates explicit synthetic tagging. Exclude its fixed test identity.
  if(m.user?.id==='twitch:test'&&String(m.messageId).startsWith('twitch:test-'))return;
  if(type==='message'){
   const platform=m.platform;if(!['twitch','youtube'].includes(platform)||!m.messageId?.startsWith(platform+':')||!m.user?.id||!m.text)return;
   if(m.messageType==='announcement'&&!cfg.archiveAnnouncements)return;
   const at=Number(m.occurredAtMs);if(!Number.isSafeInteger(at)||at<0||at>now()+86400000)return;
   if(at<now()-cfg.retentionDays*86400000)return;
   const blocked=db.prepare("SELECT 1 FROM moderation WHERE (scope='message-delete' AND target=?) OR (scope='user-delete' AND target=? AND at>=?) OR (scope='chat-clear' AND target=? AND at>=?)").get(text(m.messageId),text(m.user.id),at,platform,at);
   if(blocked)return;
   insert.run(text(m.messageId),at,now(),platform,text(m.channelId),text(m.user.id),text(m.user.login),text(m.user.displayName),text(m.originalUser?.displayName||m.user.displayName),text(m.user.pronouns),text(m.originalText||m.text,20000),text(m.text,20000),m.messageType==='announcement'?'announcement':'chat');
  }else if(type==='message-update'){
   // Updates never insert or restore deleted/expired records.
   db.prepare('UPDATE messages SET display_name=?,pronouns=?,displayed_text=? WHERE message_id=? AND deleted=0').run(text(m.user?.displayName),text(m.user?.pronouns),text(m.text,20000),text(m.messageId));
  }else{
   const where=type==='message-delete'?'message_id=?':type==='user-delete'?'user_id=?':type==='chat-clear'?'platform=?':null;
   const value=type==='message-delete'?m.messageId:type==='user-delete'?m.userId:m.platform;
   if(!where||!value)return;
   db.prepare('INSERT INTO moderation(scope,target,at) VALUES(?,?,?) ON CONFLICT(scope,target) DO UPDATE SET at=excluded.at').run(type,text(value),now());
   const scrub=cfg.archiveDeletedText?'':",original_text='',displayed_text=''";
   db.prepare('UPDATE messages SET deleted=1'+scrub+' WHERE '+where).run(text(value));
  }
 }
 function filters(params){
  const where=[],values=[],q=text(params.get('query')||'',500).trim(),user=text(params.get('user')||'',200).trim(),platform=params.get('platform'),deleted=params.get('deleted');
  if(q){where.push('(instr(lower(original_text),lower(?))>0 OR instr(lower(displayed_text),lower(?))>0)');values.push(q,q);}
  if(user){where.push('(instr(lower(login),lower(?))>0 OR instr(lower(original_name),lower(?))>0 OR instr(lower(display_name),lower(?))>0 OR user_id=?)');values.push(user,user,user,user);}
  if(platform){if(!['twitch','youtube'].includes(platform))throw Error('Invalid platform filter.');where.push('platform=?');values.push(platform);}
  if(deleted){if(!['yes','no'].includes(deleted))throw Error('Invalid deletion filter.');where.push('deleted=?');values.push(deleted==='yes'?1:0);}
  for(const key of ['from','to']){const date=params.get(key);if(!date)continue;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Invalid date filter.');where.push('occurred_at_ms'+(key==='from'?'>=':'<')+'?');values.push(Date.parse(date+'T00:00:00Z')+(key==='to'?86400000:0));}
  if(params.get('from')&&params.get('to')&&params.get('from')>params.get('to'))throw Error('From must precede Through.');
  return{where:where.length?' WHERE '+where.join(' AND '):'',values};
 }
 function page(params){const{where,values}=filters(params),limit=Number(params.get('limit')||100),offset=Number(params.get('offset')||0);if(!Number.isInteger(limit)||limit<1||limit>500||!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid page.');return{rows:db.prepare('SELECT * FROM messages'+where+' ORDER BY occurred_at_ms DESC,id DESC LIMIT ? OFFSET ?').all(...values,limit,offset),total:Number(db.prepare('SELECT count(*) AS n FROM messages'+where).get(...values).n),limit,offset};}
 return{accept,page,count:row,
  exportRows(params){const{where,values}=filters(params);const total=Number(db.prepare('SELECT count(*) AS n FROM messages'+where).get(...values).n);if(total>10000)throw Error('Export limited to 10,000 messages. Narrow your filters.');return db.prepare('SELECT * FROM messages'+where+' ORDER BY occurred_at_ms DESC,id DESC').all(...values);},
  prune(days){db.prepare('DELETE FROM moderation WHERE at<?').run(now()-days*86400000);return Number(db.prepare('DELETE FROM messages WHERE occurred_at_ms<?').run(now()-days*86400000).changes);},
  scrub(){db.exec("UPDATE messages SET original_text='',displayed_text='' WHERE deleted=1");},
  close(){db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();}
 };
}
module.exports={createStore};
