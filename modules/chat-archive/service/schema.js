'use strict';
const path=require('node:path'),crypto=require('node:crypto');
const profileSchema=`
 CREATE TABLE users(id INTEGER PRIMARY KEY,platform TEXT NOT NULL,platform_user_id TEXT NOT NULL,login TEXT NOT NULL,display_name TEXT NOT NULL,pronouns TEXT NOT NULL DEFAULT '',identity_at INTEGER NOT NULL,pronouns_at INTEGER NOT NULL DEFAULT 0,UNIQUE(platform,platform_user_id));
 CREATE TABLE pluralmind_members(id INTEGER PRIMARY KEY,system_id TEXT NOT NULL,member_id TEXT NOT NULL,name TEXT NOT NULL,pronouns TEXT NOT NULL DEFAULT '',profile_at INTEGER NOT NULL,UNIQUE(system_id,member_id));`;
const messageSchema=`CREATE TABLE messages(id INTEGER PRIMARY KEY,message_id TEXT NOT NULL UNIQUE,occurred_at_ms INTEGER NOT NULL,archived_at_ms INTEGER NOT NULL,channel_id TEXT NOT NULL,user_ref INTEGER NOT NULL REFERENCES users(id),member_ref INTEGER REFERENCES pluralmind_members(id),original_text TEXT NOT NULL,displayed_text TEXT,message_type TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0);`;
const indexesAndView=`
 CREATE INDEX IF NOT EXISTS archive_time ON messages(occurred_at_ms DESC,id DESC);
 CREATE INDEX IF NOT EXISTS archive_user ON messages(user_ref,occurred_at_ms);
 CREATE INDEX IF NOT EXISTS archive_member ON messages(member_ref);
 CREATE VIEW IF NOT EXISTS archive_messages AS SELECT m.id,m.message_id,m.occurred_at_ms,m.archived_at_ms,u.platform,m.channel_id,u.platform_user_id AS user_id,u.login,COALESCE(p.name,u.display_name) AS display_name,u.display_name AS original_name,COALESCE(p.pronouns,u.pronouns) AS pronouns,m.original_text,COALESCE(m.displayed_text,m.original_text) AS displayed_text,m.message_type,m.deleted FROM messages m JOIN users u ON u.id=m.user_ref LEFT JOIN pluralmind_members p ON p.id=m.member_ref;`;
function legacyMember(userId,name){return {systemId:'legacy:'+userId,id:crypto.createHash('sha256').update(name).digest('hex')};}
function initialize(db,directory,options={}){
 const version=Number(db.prepare('PRAGMA user_version').get().user_version);if(version>2)throw Error('Archive database is newer than this module.');
 const existing=!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='messages'").get();
 let backup=null;if(existing&&version<2){backup=path.join(directory,'chat.before-v2-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex')+'.sqlite');db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 if(version<2){
  db.exec('BEGIN IMMEDIATE');try{
   db.exec(profileSchema);
   if(existing)db.exec('ALTER TABLE messages RENAME TO messages_v1');
   db.exec(messageSchema);
   if(existing){
    const saveUser=db.prepare(`INSERT INTO users(platform,platform_user_id,login,display_name,pronouns,identity_at,pronouns_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(platform,platform_user_id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name,identity_at=excluded.identity_at,pronouns=CASE WHEN excluded.pronouns<>'' THEN excluded.pronouns ELSE users.pronouns END,pronouns_at=CASE WHEN excluded.pronouns<>'' THEN excluded.pronouns_at ELSE users.pronouns_at END`);
    const findUser=db.prepare('SELECT id FROM users WHERE platform=? AND platform_user_id=?');
    const saveMember=db.prepare(`INSERT INTO pluralmind_members(system_id,member_id,name,pronouns,profile_at) VALUES(?,?,?,?,?) ON CONFLICT(system_id,member_id) DO UPDATE SET name=excluded.name,pronouns=CASE WHEN excluded.pronouns<>'' THEN excluded.pronouns ELSE pluralmind_members.pronouns END,profile_at=excluded.profile_at`);
    const findMember=db.prepare('SELECT id FROM pluralmind_members WHERE system_id=? AND member_id=?');
    const insert=db.prepare('INSERT INTO messages(id,message_id,occurred_at_ms,archived_at_ms,channel_id,user_ref,member_ref,original_text,displayed_text,message_type,deleted) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
    for(const r of db.prepare('SELECT * FROM messages_v1 ORDER BY occurred_at_ms,id').iterate()){
     const member=!!r.original_name&&!!r.display_name&&r.original_name!==r.display_name;
     saveUser.run(r.platform,r.user_id,r.login,r.original_name||r.display_name,member?'':r.pronouns,r.occurred_at_ms,member||!r.pronouns?0:r.occurred_at_ms);
     const userId=findUser.get(r.platform,r.user_id).id;let memberId=null;
     if(member){const key=legacyMember(r.platform+':'+r.user_id,r.display_name);saveMember.run(key.systemId,key.id,r.display_name,r.pronouns,r.occurred_at_ms);memberId=findMember.get(key.systemId,key.id).id;}
     insert.run(r.id,r.message_id,r.occurred_at_ms,r.archived_at_ms,r.channel_id,userId,memberId,r.original_text,r.displayed_text===r.original_text?null:r.displayed_text,r.message_type,r.deleted);
    }
    if(db.prepare('SELECT count(*) AS n FROM messages').get().n!==db.prepare('SELECT count(*) AS n FROM messages_v1').get().n)throw Error('Archive migration row mismatch.');
    db.exec('DROP TABLE messages_v1');
   }
   db.exec("CREATE TABLE IF NOT EXISTS moderation(scope TEXT NOT NULL,target TEXT NOT NULL,at INTEGER NOT NULL,PRIMARY KEY(scope,target));"+indexesAndView);
   if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Archive migration reference mismatch.');
   options.beforeMigrationCommit?.(db);db.exec('PRAGMA user_version=2;COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  if(existing){try{db.exec('VACUUM;PRAGMA wal_checkpoint(TRUNCATE)');}catch(_){/* Migration is committed; a later backup/maintenance can compact free pages. */}}
 }
 db.exec(indexesAndView);
 return {version:2,backup};
}
module.exports={initialize,legacyMember};
