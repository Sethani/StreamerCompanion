'use strict';
// Narrow owner API: no credentials, device IDs, settings writes or arbitrary URLs.
const crypto = require('node:crypto');
module.exports = function phoneDeck({port, configured, playback, execute, read, write}) {
  const csrf = crypto.randomBytes(32).toString('hex');
  let queue = Promise.resolve();
  function allowed(req, mutation) {
    const origins = ['http://127.0.0.1:'+port, 'http://localhost:'+port];
    return origins.some(o => new URL(o).host === req.headers.host) &&
      (!req.headers.origin || origins.includes(req.headers.origin) && new URL(req.headers.origin).host === req.headers.host) &&
      req.headers['sec-fetch-site'] !== 'cross-site' &&
      (!mutation || req.headers['x-companion-csrf'] === csrf);
  }
  return async function handle(req, res, url, json) {
    if (!url.pathname.startsWith('/api/spotify/phone-deck/')) return false;
    const send = (code, value) => { json(res, code, value); return true; };
    const mutation = req.method !== 'GET';
    if (!allowed(req, mutation)) return send(403, {error:'Unexpected host, origin or CSRF token.'});
    if (req.method === 'GET' && url.pathname === '/api/spotify/phone-deck/state') {
      if (!configured()) return send(200, {csrf, configured:false, available:false});
      try { return send(200, {csrf, configured:true, available:true, ...await playback()}); }
      catch { return send(200, {csrf, configured:true, available:false, error:'Spotify playback is unavailable.'}); }
    }
    if (req.method !== 'POST' || url.pathname !== '/api/spotify/phone-deck/control') return send(404, {error:'Not found'});
    let input;
    try {
      let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body)>4096) throw Error(); }
      input = JSON.parse(body);
      if (!input || Array.isArray(input) || Object.keys(input).some(k=>!['command','volume','requestId'].includes(k)) ||
        !['resume','pause','toggle','next','previous','volume'].includes(input.command) ||
        typeof input.requestId !== 'string' || !/^[\w-]{1,128}$/.test(input.requestId) ||
        (input.command==='volume' ? !Number.isInteger(input.volume)||input.volume<0||input.volume>100 : input.volume!==undefined)) throw Error();
    } catch { return send(400, {error:'Invalid Spotify control request.'}); }
    const operation = async () => {
      const records = read();
      const old = records[input.requestId];
      if (old) return send(old.intent===JSON.stringify(input)&&old.status==='requested'?200:409,
        {status:old.status, error:old.status==='requested'?undefined:'Previous outcome is unknown; the command was not retried.'});
      if (!configured()) return send(503, {error:'Spotify is not configured.'});
      const record = {intent:JSON.stringify(input),status:'unknown'};
      records[input.requestId] = record;
      while(Object.keys(records).length>256) delete records[Object.keys(records)[0]];
      try { write(records); } catch { return send(503,{error:'Could not save the operation; nothing was dispatched.'}); }
      try {
        await execute(input);
        record.status = 'requested';
        write(records);
        return send(200, {status:'requested'});
      } catch { return send(502, {error:'Spotify command outcome is unknown. Check playback; no automatic retry was made.'}); }
    };
    const result = queue.then(operation); queue = result.catch(()=>{});
    return result;
  };
};
