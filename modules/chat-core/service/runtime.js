'use strict';
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), crypto = require('node:crypto');
const pluralmind = require('./pluralmind.cjs');
const appearanceKeys = new Set(('direction background bubble_color text_color msg_color announcement_color announcement_bg_color highlight_color highlight_bg_color default_color pastel bubble_border_color cmdprefix bots timestamp timestamp_locale bubbles bubble_border_radius bubble_border_size fade_duration max_messages pronouns highlights announcements badges badges_left emote_size fontfamily fontsize pluralmind chat_core_delay_ms sb_twitch sb_youtube').split(' '));
const defaults = { enabled: true, streamerBotUrl: 'ws://127.0.0.1:8080/', twitch: true, youtube: true, pronouns: true, pluralmind: true, appearance: '' };
const text = (value, max = 200) => String(value ?? '').slice(0,max);
const flag = value => value === true || value === 1 || value === 'true';
const colour = value => /^#[a-f0-9]{6}$/i.test(value || '') ? value : '';
function media(items) { return items.filter(item=>{try{return new URL(item.imageUrl).protocol==='https:';}catch(_){return false;}}).map(item=>({...item,imageUrl:text(item.imageUrl,2048)})); }
function partEmotes(parts) {
  let position=0; const result=[];
  for(const part of Array.isArray(parts)?parts.slice(0,1000):[]) {
    const value=String(part.text || '');if(part.imageUrl && /emote|cheer/i.test(part.type || ''))result.push({startIndex:position,endIndex:position+value.length-1,imageUrl:part.imageUrl});
    position+=value.length;
  }
  return result;
}
function appearance(value) {
  const raw = text(value, 16000).trim(); let params;
  try { params = new URL(raw).searchParams; } catch (_) { params = new URLSearchParams(raw.replace(/^\?/,'')); }
  const clean = new URLSearchParams(); for (const [key,value] of params) if (appearanceKeys.has(key) && !clean.has(key)) clean.set(key,text(value,1000));
  return clean.toString();
}
function normalize(input = {}) {
  const url = new URL(input.streamerBotUrl || defaults.streamerBotUrl);
  if (url.protocol !== 'ws:' || !['127.0.0.1','localhost'].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use a local unauthenticated Streamer.bot WebSocket URL.');
  const result = { ...defaults, streamerBotUrl: url.href, appearance: appearance(input.appearance || '') };
  for (const key of ['enabled','twitch','youtube','pronouns','pluralmind']) result[key] = typeof input[key] === 'boolean' ? input[key] : defaults[key];
  return result;
}
function normalizeMessage(data, platform, type = 'chat', now = Date.now()) {
  const m = typeof data.message === 'object' && data.message ? data.message : data, u = data.user || {};
  const rawId = text(m.msgId || data.messageId || m.id || data.eventId);
  if (!rawId) return null; // Do not fabricate a different ID on each delivery.
  const badges = Array.isArray(m.badges || u.badges) ? (m.badges || u.badges).slice(0,30) : [];
  const role = m.role || u.role || 0, names = new Set(badges.map(b => b.name));
  const userId = text(m.userId || u.id || data.userId,100), login = text(m.login || u.login || data.userLogin,100).replace(/^@+/,'').toLowerCase();
  const announcementColour={blue:'#0099ff',green:'#00ff00',orange:'#ff9900',purple:'#9900ff'}[String(data.announcementColor || '').toLowerCase()];
  return { schemaVersion: 1, platform, messageId: platform + ':' + rawId, occurredAtMs: Number(data.timestamp || data.timeStamp || m.timestamp) || Date.parse(data.createdAt) || now, channelId: text(data.broadcaster?.id || data.channelId,100), messageType: type,
    user: { id: platform + ':' + userId, login, displayName: text(m.displayName || u.name || u.displayName || login,200), colour: announcementColour || colour(m.color || u.color), pronouns: '' },
    lookupId: userId || login, text: text(typeof m.message === 'string' ? m.message : data.text || data.message,20000),
    emotes: media((Array.isArray(m.emotes || data.emotes) ? (m.emotes || data.emotes) : partEmotes(data.parts || m.parts)).slice(0,100)), badges:media(badges), role,
    isSubscriber: flag(m.isSubscriber || u.isSubscriber || u.subscribed || u.isSponsor) || names.has('subscriber'), isVip: flag(m.isVip || u.isVip) || names.has('vip'),
    isModerator: flag(m.isModerator || u.isModerator) || names.has('moderator'), isBroadcaster: flag(m.isBroadcaster || u.isOwner) || names.has('broadcaster'), isVerified: flag(u.isVerified),
    isFirstMessage: flag(data.meta?.isFirstMessage || m.isFirstMessage), isHighlighted: flag(data.meta?.isHighlighted || m.isHighlighted), enriched: false, pluralmind: false };
}
function createService(options = {}) {
  const directory = options.dataDirectory || process.env.COMPANION_DATA_DIRECTORY || path.join(process.cwd(),'chat-core-data');
  fs.mkdirSync(directory,{recursive:true}); const configFile = path.join(directory,'config.json'), csrf = crypto.randomBytes(24).toString('hex'), now = options.now || Date.now;
  let saved = {}; try { saved = JSON.parse(fs.readFileSync(configFile)); } catch (_) {}
  let config; try { config = normalize(saved); } catch (_) { config = normalize(); }
  const clients = new Set(), recent = new Map(), profiles = new Map(), inflight = new Map(), aborts = new Set();
  const WS = options.WebSocket || globalThis.WebSocket, request = options.fetch || fetch;
  let socket, generation = 0, epoch = 0, reconnect, watchdog, keepalive, closed = false, lastPacket = 0;
  const state = { connected: false, subscribed: false, received: 0, delivered: 0, enrichmentFailed: 0, lastError: '' };
  const safeConfig = () => ({ enabled: config.enabled, twitch: config.twitch, youtube: config.youtube, pronouns: config.pronouns, pluralmind: config.pluralmind });
  function publish(event,payload) {
    const frame = 'event: ' + event + '\ndata: ' + JSON.stringify(payload) + '\n\n';
    for (const client of clients) { if (client.writableLength > 262144) { client.destroy();clients.delete(client);continue; } try { client.write(frame); } catch (_) { clients.delete(client); } }
  }
  function prune() { const cutoff = now() - 10*60000; for (const [id,item] of recent) if (item.at < cutoff) recent.delete(id); while (recent.size > 2000) recent.delete(recent.keys().next().value); }
  function status() { return { ...state, enabled: config.enabled, eventClients: clients.size }; }
  async function cached(key,url) {
    const cached = profiles.get(key); if (cached && cached.until > now()) return cached.value;
    if (inflight.has(key)) return inflight.get(key);
    // Bounded enrichment concurrency; message delivery never waits for a lookup.
    if (inflight.size >= 16) return null;
    const task = (async () => {
      const abort = new AbortController(); aborts.add(abort); const timer = setTimeout(()=>abort.abort(),options.lookupTimeout || 2000);
      try {
        const response = await request(url,{signal:abort.signal,credentials:'omit',cache:'no-store'});
        const value = response.status === 404 ? null : response.ok ? await response.json() : null;
        if (!response.ok && response.status !== 404) state.enrichmentFailed++;
        profiles.delete(key); profiles.set(key,{value,until:now() + (response.ok || response.status === 404 ? 5*60000 : 15000)});
        while(profiles.size>500)profiles.delete(profiles.keys().next().value); return value;
      } catch (_) { state.enrichmentFailed++; return null; } finally { clearTimeout(timer);aborts.delete(abort); }
    })();
    inflight.set(key,task); try { return await task; } finally { inflight.delete(key); }
  }
  function wire(item) { const { lookupId, ...result } = item; return result; }
  async function enrich(item, marker, currentEpoch) {
    const [normal, catalog, system] = await Promise.all([
      config.pronouns && item.user.login ? cached('pronouns:'+item.user.login,'https://pronouns.alejo.io/api/users/'+encodeURIComponent(item.user.login)) : null,
      config.pronouns ? cached('pronoun-catalog','https://pronouns.alejo.io/api/pronouns') : null,
      config.pluralmind && item.lookupId ? cached('pluralmind:'+item.lookupId,'https://pluralmind.chat/api/v2/system/'+encodeURIComponent(item.lookupId)) : null
    ]);
    if (closed || currentEpoch !== epoch || recent.get(item.messageId) !== marker || marker.deleted) return;
    const pronounId = normal?.[0]?.pronoun_id, pronouns = text(Array.isArray(catalog) ? catalog.find(p=>p.name===pronounId)?.display || pronounId || '' : pronounId || '',100);
    let proxy; try { if (system) proxy = pluralmind.getProxiedMessage(system,item.text); } catch (_) { state.enrichmentFailed++; }
    const resolved = { ...item, user: { ...item.user, pronouns: config.pronouns ? text(proxy?.pronouns || pronouns,200) : '', displayName: text(proxy?.member?.name || item.user.displayName), colour: colour(proxy?.color) || item.user.colour }, text: text(proxy?.body ?? item.text,20000), emotes: proxy ? [] : item.emotes, enriched:true, pluralmind:Boolean(proxy), normalPronouns:pronouns };
    publish('message-update',wire(resolved));
  }
  function ingest(item, synthetic = false) {
    if (!item || !item.text || !config.enabled || (!synthetic && !config[item.platform])) return;
    prune(); if(recent.has(item.messageId))return;
    const marker = { at: now(), user: item.user.id, platform:item.platform, deleted:false };recent.set(item.messageId,marker);prune();
    item.originalText=item.text;item.originalUser={...item.user};item.originalEmotes=item.emotes;
    state.delivered++;publish('message',wire(item));
    if (!synthetic && item.platform==='twitch' && (config.pronouns || config.pluralmind)) enrich(item,marker,epoch).catch(()=>{state.enrichmentFailed++;});
  }
  function remove(platform, data = {}) {
    const id = data.targetMessageId || data.messageId || data.message?.id || data.eventId;
    const user = data.userId || data.user?.id;
    if(id) { const key=platform+':'+text(id); const marker=recent.get(key)||{at:now(),platform}; marker.deleted=true; recent.set(key,marker);publish('message-delete',{schemaVersion:1,messageId:key}); }
    else if(user) { const key=platform+':'+text(user,100); for(const item of recent.values())if(item.user===key)item.deleted=true;publish('user-delete',{schemaVersion:1,userId:key,platform}); }
    else { epoch++;for(const item of recent.values())if(item.platform===platform)item.deleted=true;publish('chat-clear',{schemaVersion:1,platform}); }
    prune();
  }
  function handle(packet) {
    const platform=packet.event?.source?.toLowerCase(); if(!['twitch','youtube'].includes(platform) || !config.enabled || !config[platform])return;
    const type=packet.event.type, data=packet.data || {};state.received++;
    if(['ChatMessage','Message','Announcement'].includes(type))ingest(normalizeMessage(data,platform,type==='Announcement'?'announcement':'chat',now()));
    else if(['ChatMessageDeleted','MessageDeleted'].includes(type)) { if(data.targetMessageId||data.messageId||data.message?.id||data.eventId)remove(platform,data); }
    else if(['UserTimedOut','UserTimedout','UserBanned'].includes(type)) { const user=data.targetUser?.id||data.userId||data.user?.id;if(user)remove(platform,{userId:user}); }
    else if(['ChatCleared','ClearChat'].includes(type))remove(platform,{});
  }
  function retire(current,version) {
    if(version!==generation||current!==socket)return;socket=null;state.connected=false;state.subscribed=false;state.lastError='Streamer.bot is unavailable.';publish('connection',status());try{current.close();}catch(_){}schedule();
  }
  function schedule() { clearTimeout(reconnect); if(!closed&&config.enabled)reconnect=setTimeout(connect,options.reconnectDelay || 3000); }
  function connect() {
    clearTimeout(reconnect);if(closed||!config.enabled)return;const version=++generation;let active;
    try{active=new WS(config.streamerBotUrl);}catch(_){state.lastError='Could not connect to Streamer.bot.';schedule();return;}
    socket=active;let subscribed=false;
    function subscribe(){if(subscribed||active.readyState!==1||version!==generation)return;subscribed=true;const events={};if(config.twitch)events.Twitch=['ChatMessage','Announcement','ChatMessageDeleted','UserTimedOut','UserBanned','ChatCleared'];if(config.youtube)events.YouTube=['Message','MessageDeleted','UserBanned','UserTimedout'];active.send(JSON.stringify({request:'Subscribe',id:'chat-core-subscribe',events}));}
    active.addEventListener('open',()=>{if(version!==generation)return;state.connected=true;state.lastError='';lastPacket=now();subscribe();});
    active.addEventListener('message',event=>{if(version!==generation)return;lastPacket=now();let packet;try{packet=JSON.parse(String(event.data));}catch(_){return;}
      if(packet.request==='Hello')subscribe();else if(packet.id==='chat-core-subscribe'){state.subscribed=packet.status==='ok';state.lastError=state.subscribed?'':'Streamer.bot rejected the subscription. Check WebSocket authentication and event access.';publish('connection',status());}else handle(packet);
    });
    active.addEventListener('close',()=>retire(active,version));active.addEventListener('error',()=>retire(active,version));
  }
  function disconnect(){generation++;try{socket?.close();}catch(_){}socket=null;clearTimeout(reconnect);state.connected=false;state.subscribed=false;}
  function save(input) {
    const next=normalize({...config,...input});fs.writeFileSync(configFile+'.tmp',JSON.stringify(next,null,2));fs.renameSync(configFile+'.tmp',configFile);
    config=next;epoch++;for(const abort of aborts)abort.abort();profiles.clear();disconnect();publish('configuration',safeConfig());if(!config.enabled)publish('chat-clear',{schemaVersion:1});if(config.enabled)connect();return config;
  }
  function json(response,code,value){const bytes=Buffer.from(JSON.stringify(value));response.writeHead(code,{'Content-Type':'application/json','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(bytes);}
  const server=http.createServer(async(req,res)=>{
    try{
      const host=String(req.headers.host||'');if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return json(res,403,{error:'Local requests only.'});
      const url=new URL(req.url,'http://'+host), origin=String(req.headers.origin||'');
      if(origin && origin!=='http://'+host && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))return json(res,403,{error:'Local requests only.'});
      if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{service:'chat-core',ready:true,configured:true,...status()});
      if(req.method==='GET'&&url.pathname==='/api/chat-core/events'){
        if(origin && origin!=='http://'+host)res.setHeader('Access-Control-Allow-Origin',origin);
        if(clients.size>=20)return json(res,503,{error:'Too many chat renderers.'});
        res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('event: ready\ndata: '+JSON.stringify({schemaVersion:1,connection:status(),config:safeConfig()})+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
      }
      const pages={'/settings':'settings.html','/settings.js':'settings.js','/chat/chat.html':'chat.html'};
      if(req.method==='GET'&&pages[url.pathname]){
        let source=fs.readFileSync(path.join(__dirname,pages[url.pathname]),'utf8');
        if(url.pathname==='/chat/chat.html')source=source.replace('__CHAT_BOOTSTRAP__',JSON.stringify({...safeConfig(),appearance:config.appearance}).replaceAll('<','\\u003c'));
        else source=source.replace('__CSRF__',csrf);
        res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'application/javascript':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(source);
      }
      if((origin && origin!=='http://'+host)||req.headers['x-companion-csrf']!==csrf || (req.method!=='GET' && origin!=='http://'+host))return json(res,403,{error:'Open Live Chatbox settings to make changes.'});
      if(req.method==='GET'&&url.pathname==='/api/chat-core/settings')return json(res,200,{config,connection:status()});
      if(req.method!=='POST')return json(res,404,{error:'Not found.'});
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>20000)return json(res,413,{error:'Request too large.'});chunks.push(chunk);}const input=JSON.parse(Buffer.concat(chunks).toString()||'{}');
      if(url.pathname==='/api/chat-core/settings')return json(res,200,{config:save(input),connection:status()});
      if(url.pathname==='/api/chat-core/test'){
        if(!config.enabled)return json(res,409,{error:'Enable the live chatbox first.'});
        if(input.clear){publish('chat-clear',{schemaVersion:1,synthetic:true});return json(res,200,{ok:true});}
        const item=normalizeMessage({message:{msgId:'test-'+crypto.randomUUID(),userId:'test',login:'synthetic',displayName:'Test Viewer',color:'#5ad67e',message:'Live Chatbox test message'}},'twitch','chat',now());ingest(item,true);
        if(input.enriched)publish('message-update',wire({...item,user:{...item.user,displayName:'Test Member',pronouns:'They/Them'},text:'Enriched live chatbox test',enriched:true,pluralmind:true,emotes:[]}));
        return json(res,200,{ok:true,deliveredTo:clients.size});
      }
      return json(res,404,{error:'Not found.'});
    }catch(_){return json(res,400,{error:'Chatbox request failed. Check the local settings.'});}
  });
  return {server,csrf,config:()=>({...config}),status,handle,save,
    async start(){closed=false;await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(options.port ?? Number(process.env.COMPANION_SERVICE_PORT||3136),'127.0.0.1',resolve);});connect();keepalive=setInterval(()=>{prune();for(const client of clients)client.write(': keepalive\n\n');},15000);watchdog=setInterval(()=>{if(socket&&now()-lastPacket>45000)retire(socket,generation);else if(socket?.readyState===1)try{socket.send(JSON.stringify({request:'GetStatus',id:'chat-core-heartbeat'}));}catch(_){retire(socket,generation);}},15000);return server.address().port;},
    async stop(){closed=true;epoch++;disconnect();clearInterval(keepalive);clearInterval(watchdog);for(const abort of aborts)abort.abort();for(const client of clients)client.end();clients.clear();if(server.listening)await new Promise(resolve=>server.close(resolve));}
  };
}
if(require.main===module){const service=createService();service.start().catch(()=>{console.error('Live Chatbox service could not start.');process.exitCode=1;});for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>service.stop().finally(()=>process.exit(0)));}
module.exports={createService,normalize,normalizeMessage,appearance};
