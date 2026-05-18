
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000, ROOT = __dirname;
const DATA = path.join(ROOT,'data','data.json'), BACKUP_DIR = path.join(ROOT,'data','backups'), UPLOAD_DIR = path.join(ROOT,'assets','uploads');
const sessions = new Set(); fs.mkdirSync(BACKUP_DIR,{recursive:true}); fs.mkdirSync(UPLOAD_DIR,{recursive:true});
function send(res,c,b,t='text/plain'){res.writeHead(c,{'Content-Type':t});res.end(b)}
function readBody(req){return new Promise(r=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>r(d))})}
function getCookie(req,n){const m=(req.headers.cookie||'').match(new RegExp(n+'=([^;]+)'));return m?m[1]:''}
function authed(req){return sessions.has(getCookie(req,'nd_session'))}
function readData(){return JSON.parse(fs.readFileSync(DATA,'utf8'))}
function writeData(o){fs.writeFileSync(DATA,JSON.stringify(o,null,2),'utf8')}
function backup(reason='auto'){const f=path.join(BACKUP_DIR,new Date().toISOString().replace(/[:.]/g,'-')+'-'+reason+'.json');fs.copyFileSync(DATA,f);return f}
function mime(f){return {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.lsl':'text/plain; charset=utf-8'}[path.extname(f).toLowerCase()]||'application/octet-stream'}
http.createServer(async (req,res)=>{try{const url=new URL(req.url,'http://localhost');
if(req.method==='POST'&&url.pathname==='/api/login'){const b=JSON.parse(await readBody(req)||'{}'), d=readData(), a=d.auth||{username:'admin',password:'neudarmstadt'};if(b.username===a.username&&b.password===a.password){const tok=crypto.randomBytes(24).toString('hex');sessions.add(tok);res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':`nd_session=${tok}; Path=/; SameSite=Lax; HttpOnly`});return res.end(JSON.stringify({ok:true}))}return send(res,401,JSON.stringify({ok:false,error:'Falscher Login'}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/logout'){sessions.delete(getCookie(req,'nd_session'));res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':'nd_session=; Path=/; Max-Age=0'});return res.end(JSON.stringify({ok:true}))}
if(url.pathname==='/api/status')return send(res,200,JSON.stringify({loggedIn:authed(req)}),'application/json')
if(req.method==='POST'&&url.pathname==='/api/change-password'){if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');const b=JSON.parse(await readBody(req)||'{}'), d=readData();d.auth=d.auth||{username:'admin',password:'neudarmstadt'};if(b.oldPassword!==d.auth.password)return send(res,403,JSON.stringify({ok:false,error:'Das alte Passwort ist falsch'}),'application/json');if(String(b.newPassword||'').length<5)return send(res,400,JSON.stringify({ok:false,error:'Das neue Passwort muss mindestens 5 Zeichen haben'}),'application/json');backup('password');d.auth.password=String(b.newPassword);if(b.username)d.auth.username=String(b.username);writeData(d);return send(res,200,JSON.stringify({ok:true}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/visit'){const d=readData();d.visitors=d.visitors||{total:0,today:{},lastVisit:''};d.visitors.total=(d.visitors.total||0)+1;const day=new Date().toISOString().slice(0,10);d.visitors.today[day]=(d.visitors.today[day]||0)+1;d.visitors.lastVisit=new Date().toISOString();writeData(d);return send(res,200,JSON.stringify({ok:true,total:d.visitors.total}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/message'){const b=JSON.parse(await readBody(req)||'{}'),d=readData();d.messages=d.messages||[];if(!b.recipientName||!b.text)return send(res,400,JSON.stringify({ok:false,error:'Empfaenger und Nachricht erforderlich'}),'application/json');d.messages.unshift({id:Date.now().toString(),date:new Date().toISOString(),recipientUuid:b.recipientUuid||'',recipientName:b.recipientName||'',sender:b.sender||'Unbekannt',contact:b.contact||'',text:b.text||''});writeData(d);return send(res,200,JSON.stringify({ok:true}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/upload'){if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');const b=JSON.parse(await readBody(req)||'{}');const ext=path.extname(b.filename||'').toLowerCase();if(!['.png','.jpg','.jpeg','.gif','.webp'].includes(ext))return send(res,400,JSON.stringify({ok:false,error:'Nur Bilddateien erlaubt'}),'application/json');const safe=Date.now()+'-'+String(b.filename).replace(/[^a-zA-Z0-9._-]/g,'_');fs.writeFileSync(path.join(UPLOAD_DIR,safe),Buffer.from(String(b.data).split(',').pop(),'base64'));return send(res,200,JSON.stringify({ok:true,path:'assets/uploads/'+safe}),'application/json')}
if(req.method==='GET'&&url.pathname==='/api/backups'){if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');return send(res,200,JSON.stringify({ok:true,files:fs.readdirSync(BACKUP_DIR).filter(f=>f.endsWith('.json')).sort().reverse()}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/backup'){if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');return send(res,200,JSON.stringify({ok:true,file:path.basename(backup('manual'))}),'application/json')}
if(req.method==='POST'&&url.pathname==='/api/sl-status'){const b=JSON.parse(await readBody(req)||'{}'),d=readData();if(b.secret!==(d.statusSecret||'neudarmstadt-status-2026'))return send(res,403,JSON.stringify({ok:false,error:'Falscher Secret-Key'}),'application/json');const p=d.people.find(p=>String(p.uuid||'').toLowerCase()===String(b.uuid||'').toLowerCase());if(!p)return send(res,404,JSON.stringify({ok:false,error:'UUID nicht gefunden'}),'application/json');p.online=b.online===true||b.online==='true'||b.online===1||b.online==='1';p.lastSeen=new Date().toISOString();writeData(d);return send(res,200,JSON.stringify({ok:true,name:p.name,online:p.online}),'application/json')}
if(req.method==='GET'&&url.pathname==='/api/data')return send(res,200,fs.readFileSync(DATA,'utf8'),'application/json')
if(req.method==='POST'&&url.pathname==='/api/data'){if(!authed(req))return send(res,401,JSON.stringify({ok:false,error:'Nicht eingeloggt'}),'application/json');const parsed=JSON.parse(await readBody(req));backup('save');writeData(parsed);return send(res,200,JSON.stringify({ok:true}),'application/json')}

const publicPaths = ['/', '/index.html', '/events.html', '/vermietung.html', '/galerie.html', '/news.html', '/kontakt.html', '/impressum.html', '/datenschutz.html'];
if(req.method === 'GET' && publicPaths.includes(url.pathname)){
  try{
    const currentStatus = readData().siteStatus || {};
    if(currentStatus.online === false && url.pathname !== '/offline.html'){
      let offlineFile = path.join(ROOT, 'offline.html');
      return send(res,200,fs.readFileSync(offlineFile),mime(offlineFile));
    }
  }catch(e){}
}
let file=url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname);file=path.normalize(file).replace(/^(\\.\\.[\\/\\\\])+/, '');const full=path.join(ROOT,file);if(!full.startsWith(ROOT)||!fs.existsSync(full)||fs.statSync(full).isDirectory())return send(res,404,'Nicht gefunden');send(res,200,fs.readFileSync(full),mime(full))
}catch(e){console.error(e);send(res,500,JSON.stringify({ok:false,error:e.message}),'application/json')}}).listen(PORT,()=>console.log('Neudarmstadt CMS läuft auf Port '+PORT));
