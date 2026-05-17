
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, 'data', 'data.json');
const sessions = new Set();

function send(res, code, body, type='text/plain'){
  res.writeHead(code, {'Content-Type': type});
  res.end(body);
}
function readBody(req){
  return new Promise(resolve => {
    let data='';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
  });
}
function getCookie(req, name){
  const c = req.headers.cookie || '';
  const m = c.match(new RegExp(name+'=([^;]+)'));
  return m ? m[1] : '';
}
function authed(req){ return sessions.has(getCookie(req,'nd_session')); }
function mime(file){
  const ext = path.extname(file).toLowerCase();
  return {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif'}[ext] || 'application/octet-stream';
}
const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  if(req.method==='POST' && url.pathname==='/api/login'){
    const body = JSON.parse(await readBody(req) || '{}');
    const current = JSON.parse(fs.readFileSync(DATA,'utf8'));
    const auth = current.auth || {username:'admin', password:'neudarmstadt'};
    if(body.username===auth.username && body.password===auth.password){
      const token = crypto.randomBytes(24).toString('hex');
      sessions.add(token);
      res.writeHead(200, {'Content-Type':'application/json','Set-Cookie':`nd_session=${token}; Path=/; SameSite=Lax`});
      return res.end(JSON.stringify({ok:true}));
    }
    return send(res,401,JSON.stringify({ok:false,error:'Falscher Login'}),'application/json');
  }
  if(req.method==='POST' && url.pathname==='/api/logout'){
    sessions.delete(getCookie(req,'nd_session'));
    res.writeHead(200, {'Content-Type':'application/json','Set-Cookie':'nd_session=; Path=/; Max-Age=0'});
    return res.end(JSON.stringify({ok:true}));
  }
  if(url.pathname==='/api/status'){
    return send(res,200,JSON.stringify({loggedIn:authed(req)}),'application/json');
  }


  if(req.method==='POST' && url.pathname==='/api/message'){
    const body = JSON.parse(await readBody(req) || '{}');
    const current = JSON.parse(fs.readFileSync(DATA,'utf8'));
    current.messages = current.messages || [];
    if(!body.recipientName || !body.text){
      return send(res,400,JSON.stringify({ok:false,error:'Empfaenger und Nachricht erforderlich'}),'application/json');
    }
    current.messages.unshift({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      recipientUuid: body.recipientUuid || '',
      recipientName: body.recipientName || '',
      sender: body.sender || 'Unbekannt',
      contact: body.contact || '',
      text: body.text || ''
    });
    fs.writeFileSync(DATA, JSON.stringify(current, null, 2), 'utf8');
    return send(res,200,JSON.stringify({ok:true}),'application/json');
  }

  if(req.method==='POST' && url.pathname==='/api/sl-status'){
    const body = JSON.parse(await readBody(req) || '{}');
    const current = JSON.parse(fs.readFileSync(DATA,'utf8'));
    if(body.secret !== (current.statusSecret || 'neudarmstadt-status-2026')){
      return send(res,403,JSON.stringify({ok:false,error:'Falscher Secret-Key'}),'application/json');
    }
    const uuid = String(body.uuid || '').toLowerCase();
    const person = current.people.find(p => String(p.uuid || '').toLowerCase() === uuid);
    if(!person) return send(res,404,JSON.stringify({ok:false,error:'UUID nicht gefunden'}),'application/json');
    person.online = body.online === true || body.online === 'true' || body.online === 1 || body.online === '1';
    person.lastSeen = new Date().toISOString();
    fs.writeFileSync(DATA, JSON.stringify(current, null, 2), 'utf8');
    return send(res,200,JSON.stringify({ok:true,name:person.name,online:person.online}),'application/json');
  }


  if(req.method==='POST' && url.pathname==='/api/change-password'){
    if(!authed(req)) return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');
    const body = JSON.parse(await readBody(req) || '{}');
    const current = JSON.parse(fs.readFileSync(DATA,'utf8'));
    current.auth = current.auth || {username:'admin', password:'neudarmstadt'};
    if(!body.oldPassword || !body.newPassword){
      return send(res,400,JSON.stringify({ok:false,error:'Bitte altes und neues Passwort eingeben'}),'application/json');
    }
    if(body.oldPassword !== current.auth.password){
      return send(res,403,JSON.stringify({ok:false,error:'Das alte Passwort ist falsch'}),'application/json');
    }
    if(String(body.newPassword).length < 5){
      return send(res,400,JSON.stringify({ok:false,error:'Das neue Passwort muss mindestens 5 Zeichen haben'}),'application/json');
    }
    current.auth.password = String(body.newPassword);
    if(body.username) current.auth.username = String(body.username);
    fs.writeFileSync(DATA, JSON.stringify(current, null, 2), 'utf8');
    return send(res,200,JSON.stringify({ok:true}),'application/json');
  }

  if(req.method==='GET' && url.pathname==='/api/data'){
    return send(res,200,fs.readFileSync(DATA,'utf8'),'application/json');
  }
  if(req.method==='POST' && url.pathname==='/api/data'){
    if(!authed(req)) return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');
    const body = await readBody(req);
    JSON.parse(body);
    fs.writeFileSync(DATA, JSON.stringify(JSON.parse(body), null, 2), 'utf8');
    return send(res,200,JSON.stringify({ok:true}),'application/json');
  }
  let file = url.pathname==='/' ? '/index.html' : decodeURIComponent(url.pathname);
  file = path.normalize(file).replace(/^(\.\.[\/\\])+/, '');
  const full = path.join(ROOT, file);
  if(!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res,404,'Nicht gefunden');
  send(res,200,fs.readFileSync(full),mime(full));
});
server.listen(PORT,()=>console.log(`Neudarmstadt CMS läuft: http://localhost:${PORT}`));
