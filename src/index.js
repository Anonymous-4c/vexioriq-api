import { createRouter } from './router/router.js';
import { registerV1Routes } from './api/v1/index.js';
import { corsMiddleware, handleCorsOptions } from './middleware/cors.js';
import { securityHeaders } from './middleware/security.js';
import { authenticationMiddleware } from './middleware/authentication.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generateRequestId } from './utils/ids.js';
import { ApiError } from './utils/errors.js';
import { jsonResponse } from './utils/response.js';

import './tools/index.js';

const router = createRouter();
registerV1Routes(router);

const API_TESTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vexioriq API Tester</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#171717;--bg-el:#1B1B1B;--bg-card:#222222;--bg-over:#2A2A2A;
  --border:#343434;--border-sub:rgba(190,190,190,0.10);--border-str:rgba(190,190,190,0.20);
  --t1:#F2F2F2;--t2:#E5E5E5;--t3:#9B9B9C;--t4:#717078;
  --accent:#BEBEBE;--accent-d:rgba(190,190,190,0.08);
  --ok:#6FAF82;--ok-d:rgba(111,175,130,0.15);--ok-b:rgba(111,175,130,0.30);
  --err:#C96B6B;--err-d:rgba(201,107,107,0.15);--err-b:rgba(201,107,107,0.30);
  --warn:#C4A45D;--warn-d:rgba(196,164,93,0.15);--warn-b:rgba(196,164,93,0.30);
  --info:#8297B5;--info-d:rgba(130,151,181,0.15);--info-b:rgba(130,151,181,0.30);
  --sans:'Inter',system-ui,-apple-system,sans-serif;
  --mono:'JetBrains Mono','Fira Code',ui-monospace,monospace;
  --r-sm:6px;--r-md:8px;--r-lg:12px;--r-xl:16px;--r-full:9999px;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--t1);font-family:var(--sans);min-height:100vh;-webkit-font-smoothing:antialiased}
::selection{background:rgba(190,190,190,0.2);color:var(--t1)}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:var(--r-full)}
::-webkit-scrollbar-thumb:hover{background:#404040}

.hd{padding:16px 24px;border-bottom:1px solid var(--border-sub);display:flex;align-items:center;gap:14px;background:var(--bg-el);backdrop-filter:blur(20px)}
.hd .logo{font-size:15px;font-weight:800;letter-spacing:-0.02em;color:var(--t1)}
.hd h1{font-size:15px;font-weight:500;color:var(--t3)}
.hd .sep{color:var(--border);font-weight:300}
.badge{font-size:10px;padding:3px 10px;border-radius:var(--r-full);background:var(--accent-d);border:1px solid var(--border-sub);color:var(--accent);font-weight:600;letter-spacing:0.05em;text-transform:uppercase}

.wrap{display:grid;grid-template-columns:300px 1fr;height:calc(100vh - 57px)}
.side{border-right:1px solid var(--border-sub);overflow-y:auto;padding:16px;background:var(--bg-el)}
.main{overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px}

.slbl{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--t4);margin-bottom:8px;font-weight:600;padding:0 4px}
.pr{padding:8px 10px;border-radius:var(--r-md);cursor:pointer;margin-bottom:2px;display:flex;align-items:center;gap:8px;transition:all 150ms;border:1px solid transparent;font-size:12px;color:var(--t2)}
.pr:hover{background:var(--accent-d);border-color:var(--border-sub);color:var(--t1)}
.pr.on{background:var(--accent-d);border-color:var(--border-str);color:var(--t1)}
.mb{font-size:9px;font-weight:700;padding:2px 6px;border-radius:var(--r-sm);font-family:var(--mono);min-width:34px;text-align:center;letter-spacing:0.02em}
.mg{background:var(--ok-d);color:var(--ok);border:1px solid rgba(111,175,130,0.20)}
.mp{background:var(--info-d);color:var(--info);border:1px solid rgba(130,151,181,0.20)}
.mu{background:var(--warn-d);color:var(--warn);border:1px solid rgba(196,164,93,0.20)}
.md{background:var(--err-d);color:var(--err);border:1px solid rgba(201,107,107,0.20)}
.pp{font-family:var(--mono);font-size:11px;color:var(--t4)}

.rbar{display:flex;gap:8px;align-items:stretch}
.msel{background:var(--bg-card);color:var(--ok);border:1px solid var(--border);border-radius:var(--r-md);padding:0 12px;font-family:var(--mono);font-size:12px;font-weight:600;cursor:pointer;appearance:none;min-width:72px;text-align:center;outline:none;transition:border-color 150ms}
.msel:focus{border-color:var(--accent)}
.uinp{flex:1;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-md);padding:10px 14px;color:var(--t1);font-family:var(--mono);font-size:12px;outline:none;transition:border-color 150ms}
.uinp:focus{border-color:var(--accent)}
.uinp::placeholder{color:var(--t4)}
.sbtn{background:var(--t1);color:var(--bg);border:none;border-radius:var(--r-md);padding:10px 20px;font-weight:600;font-size:12px;font-family:var(--sans);cursor:pointer;transition:all 150ms;white-space:nowrap;letter-spacing:0.01em}
.sbtn:hover{opacity:0.9;box-shadow:0 0 20px rgba(190,190,190,0.08)}
.sbtn:active{transform:scale(0.98)}
.sbtn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
.sbtn.ld{color:transparent;pointer-events:none}

.bedit{width:100%;min-height:100px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;color:var(--t2);font-family:var(--mono);font-size:12px;line-height:1.7;resize:vertical;outline:none;transition:border-color 150ms;tab-size:2}
.bedit:focus{border-color:var(--accent)}
.bedit::placeholder{color:var(--t4);opacity:0.5}

.tabs{display:flex;gap:0;border-bottom:1px solid var(--border-sub)}
.tab{padding:8px 14px;font-size:11px;font-weight:600;cursor:pointer;color:var(--t4);border-bottom:2px solid transparent;transition:all 150ms;letter-spacing:0.02em}
.tab:hover{color:var(--t3)}
.tab.on{color:var(--t1);border-bottom-color:var(--accent)}

.pnl{display:none}.pnl.on{display:block}

.rsp{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg)}
.spill{font-family:var(--mono);font-size:12px;font-weight:700;padding:4px 12px;border-radius:var(--r-full)}
.s2{background:var(--ok-d);color:var(--ok);border:1px solid var(--ok-b)}
.s3{background:var(--warn-d);color:var(--warn);border:1px solid var(--warn-b)}
.s4{background:var(--err-d);color:var(--err);border:1px solid var(--err-b)}
.s5{background:var(--err-d);color:var(--err);border:1px solid var(--err-b)}
.mpill{font-size:11px;color:var(--t4);font-family:var(--mono)}
.mpill strong{color:var(--t3)}

.cblk{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;font-family:var(--mono);font-size:11px;line-height:1.8;overflow-x:auto;white-space:pre-wrap;word-break:break-all;max-height:480px;overflow-y:auto;color:var(--t3)}
.cblk .k{color:var(--info)}.cblk .s{color:#A8D4A0}.cblk .n{color:#E0A87E}.cblk .b{color:var(--warn)}

.htbl{width:100%;border-collapse:collapse;font-size:11px}
.htbl th{text-align:left;padding:8px 12px;color:var(--t4);font-weight:600;border-bottom:1px solid var(--border-sub);font-size:10px;text-transform:uppercase;letter-spacing:0.08em}
.htbl td{padding:7px 12px;border-bottom:1px solid var(--border-sub);font-family:var(--mono);font-size:10px;color:var(--t3)}
.htbl td:first-child{color:var(--info);white-space:nowrap}

.crow{display:flex;gap:8px;margin-bottom:8px;align-items:center}
.clbl{font-size:10px;color:var(--t4);min-width:70px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em}
.cinp{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-md);padding:7px 10px;color:var(--t2);font-family:var(--mono);font-size:11px;outline:none;transition:border-color 150ms}
.cinp:focus{border-color:var(--accent)}
.cinp::placeholder{color:var(--t4);opacity:0.5}

.emp{text-align:center;padding:60px 20px;color:var(--t4)}
.emp .ico{font-size:20px;margin-bottom:8px;opacity:0.4}
.emp p{font-size:12px;letter-spacing:0.02em}

.hi{padding:6px 8px;border-radius:var(--r-md);cursor:pointer;margin-bottom:2px;font-size:11px;display:flex;align-items:center;gap:6px;transition:all 150ms;color:var(--t4)}
.hi:hover{background:var(--accent-d);color:var(--t3)}
.ht{font-size:9px;margin-left:auto;white-space:nowrap;opacity:0.5}

.dv{height:1px;background:linear-gradient(90deg,transparent,var(--border-sub),transparent);margin:16px 0}

@media(max-width:768px){.wrap{grid-template-columns:1fr}.side{display:none}}
</style>
</head>
<body>
<div class="hd"><span class="logo">VEXIORIQ</span><span class="sep">/</span><h1>API Tester</h1><span class="badge">v1</span></div>
<div class="wrap">
<div class="side">
<div class="slbl">Configuration</div>
<div class="crow"><span class="clbl">Base</span><input class="cinp" id="baseUrl" placeholder="https://your-worker.workers.dev" spellcheck="false"></div>
<div class="crow"><span class="clbl">Key</span><input class="cinp" id="apiKey" type="password" placeholder="vxr_..." spellcheck="false"></div>
<div class="dv"></div><div class="slbl">Endpoints</div>
<div class="pr on" data-m="GET" data-p="/v1/health" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/health</span></div>
<div class="pr" data-m="GET" data-p="/v1/meta" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/meta</span></div>
<div class="pr" data-m="GET" data-p="/v1/tools" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/tools</span></div>
<div class="pr" data-m="GET" data-p="/v1/tools/uuid-generator" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/tools/uuid-generator</span></div>
<div class="pr" data-m="GET" data-p="/v1/tools/hash-generator" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/tools/hash-generator</span></div>
<div class="pr" data-m="GET" data-p="/v1/tools/json-formatter" onclick="sel(this)"><span class="mb mg">GET</span><span class="pp">/v1/tools/json-formatter</span></div>
<div class="dv"></div><div class="slbl">Execute</div>
<div class="pr" data-m="POST" data-p="/v1/tools/uuid-generator" data-b='{"count":3}' onclick="sel(this)"><span class="mb mp">POST</span><span>uuid-generator</span></div>
<div class="pr" data-m="POST" data-p="/v1/tools/hash-generator" data-b='{"input":"hello world","algorithm":"SHA-256"}' onclick="sel(this)"><span class="mb mp">POST</span><span>hash-generator</span></div>
<div class="pr" data-m="POST" data-p="/v1/tools/json-formatter" data-b='{"input":{"name":"vexioriq"},"mode":"format","indent":2}' onclick="sel(this)"><span class="mb mp">POST</span><span>json-formatter</span></div>
<div class="pr" data-m="POST" data-p="/v1/tools/base64-encoder" data-b='{"input":"Hello Vexioriq","mode":"encode"}' onclick="sel(this)"><span class="mb mp">POST</span><span>base64-encoder</span></div>
<div class="pr" data-m="POST" data-p="/v1/tools/timestamp-converter" data-b='{}' onclick="sel(this)"><span class="mb mp">POST</span><span>timestamp-converter</span></div>
<div class="dv"></div><div class="slbl">Errors</div>
<div class="pr" data-m="GET" data-p="/v1/nonexistent" onclick="sel(this)"><span class="mb mg">GET</span><span>404 Test</span></div>
<div class="pr" data-m="DELETE" data-p="/v1/health" onclick="sel(this)"><span class="mb md">DEL</span><span>405 Test</span></div>
<div class="pr" data-m="POST" data-p="/v1/tools/uuid-generator" data-b='bad json' onclick="sel(this)"><span class="mb mp">POST</span><span>Bad JSON</span></div>
<div class="dv"></div><div class="slbl">History</div><div id="hist"></div>
</div>
<div class="main">
<div class="rbar">
<select class="msel" id="method" onchange="uc()"><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select>
<input class="uinp" id="url" value="/v1/health" spellcheck="false" onkeydown="if(event.key==='Enter')go()">
<button class="sbtn" id="sendBtn" onclick="go()">Send</button>
</div>
<div id="bodySec" style="display:none"><div class="tabs"><div class="tab on">Body</div></div>
<textarea class="bedit" id="body" spellcheck="false" placeholder='{"key": "value"}'></textarea></div>
<div id="respSec">
<div class="emp" id="emp"><div class="ico">&#8593;</div><p>Send a request to see the response</p></div>
<div id="respCont" style="display:none">
<div class="rsp" id="rmeta"></div>
<div class="tabs" style="margin-top:12px"><div class="tab on" onclick="st(this,'rp')">Response</div><div class="tab" onclick="st(this,'hd')">Headers</div></div>
<div class="pnl on" id="p-rp"><div class="cblk" id="rbody"></div></div>
<div class="pnl" id="p-hd"><table class="htbl" id="rhdr"></table></div>
</div></div>
</div></div>
<script>
let H=[];
function sel(e){document.querySelectorAll('.pr').forEach(p=>p.classList.remove('on'));e.classList.add('on');document.getElementById('method').value=e.dataset.m;document.getElementById('url').value=e.dataset.p;document.getElementById('body').value=e.dataset.b||'';uc();ub()}
function uc(){const s=document.getElementById('method'),c={GET:'var(--ok)',POST:'var(--info)',PUT:'var(--warn)',PATCH:'var(--warn)',DELETE:'var(--err)'};s.style.color=c[s.value]||'var(--t1)';ub()}
function ub(){document.getElementById('bodySec').style.display=['POST','PUT','PATCH'].includes(document.getElementById('method').value)?'block':'none'}
function st(e,n){e.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));e.classList.add('on');document.querySelectorAll('#respSec .pnl').forEach(p=>p.classList.remove('on'));document.getElementById('p-'+n).classList.add('on')}
function hl(j){if(typeof j!=='string')j=JSON.stringify(j,null,2);return j.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"([^"]+)"(?=\\s*:)/g,'<span class="k">"$1"</span>').replace(/:\\s*"([^"]*)"/g,': <span class="s">"$1"</span>').replace(/:\\s*(\\d+\\.?\\d*)/g,': <span class="n">$1</span>').replace(/:\\s*(true|false|null)/g,': <span class="b">$1</span>')}
async function go(){const b=document.getElementById('sendBtn'),m=document.getElementById('method').value,base=document.getElementById('baseUrl').value.replace(/\\/+$/,'')||location.origin,p=document.getElementById('url').value,k=document.getElementById('apiKey').value,body=document.getElementById('body').value,full=p.startsWith('http')?p:base+p;const h={};if(k)h['Authorization']='Bearer '+k;if(['POST','PUT','PATCH'].includes(m)&&body)h['Content-Type']='application/json';const o={method:m,headers:h};if(['POST','PUT','PATCH'].includes(m)&&body)o.body=body;b.classList.add('ld');b.disabled=true;const t0=performance.now();try{const r=await fetch(full,o),d=Math.round(performance.now()-t0),t=await r.text();let j;try{j=JSON.parse(t)}catch(e){j=null}const sc=r.status<300?'s2':r.status<400?'s3':r.status<500?'s4':'s5';document.getElementById('emp').style.display='none';document.getElementById('respCont').style.display='block';document.getElementById('rmeta').innerHTML='<span class="spill '+sc+'">'+r.status+' '+r.statusText+'</span><span class="mpill"><strong>'+d+'ms</strong></span><span class="mpill">'+t.length+' B</span>';document.getElementById('rbody').innerHTML=j?hl(j):hl(t);let hh='<tr><th>Header</th><th>Value</th></tr>';r.headers.forEach((v,k)=>{hh+='<tr><td>'+k+'</td><td>'+v+'</td></tr>'});document.getElementById('rhdr').innerHTML=hh;aH(m,p,r.status,d)}catch(e){document.getElementById('emp').style.display='none';document.getElementById('respCont').style.display='block';document.getElementById('rmeta').innerHTML='<span class="spill s5">Error</span>';document.getElementById('rbody').innerHTML=hl({error:e.message})}finally{b.classList.remove('ld');b.disabled=false}}
function aH(m,p,s,d){H.unshift({m,p,s,d,t:new Date().toLocaleTimeString()});if(H.length>15)H.pop();rH()}
function rH(){document.getElementById('hist').innerHTML=H.map(h=>{const c=h.s<300?'var(--ok)':h.s<500?'var(--warn)':'var(--err)';return '<div class="hi" onclick="document.getElementById(\\'method\\').value=\\''+h.m+'\\';document.getElementById(\\'url\\').value=\\''+h.p+'\\';uc();ub()"><span class="mb m'+(h.m==='GET'?'g':h.m==='POST'?'p':h.m==='DELETE'?'d':'u')+'" style="font-size:8px;padding:1px 4px">'+h.m+'</span><span style="font-family:var(--mono);font-size:10px">'+h.p+'</span><span style="color:'+c+';font-family:var(--mono);font-size:10px;font-weight:600">'+h.s+'</span><span class="ht">'+h.t+'</span></div>'}).join('')}
uc();
</script>
</body></html>`;

export default {
  async fetch(request, env, ctx) {
    const requestId = generateRequestId();
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (method === 'OPTIONS') {
        return handleCorsOptions(request, env);
      }

      if (pathname === '/' || pathname === '/tester') {
        return new Response(API_TESTER_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...securityHeaders() },
        });
      }

      const matched = router.match(method, pathname);
      if (!matched) {
        if (router.matchPath(pathname)) {
          throw ApiError.methodNotAllowed(`Method ${method} not allowed for ${pathname}`);
        }
        throw ApiError.notFound('Endpoint not found');
      }

      const corsHeaders = corsMiddleware(request, env);
      const secHeaders = securityHeaders();

      let authContext = { authenticated: false, tier: 'anonymous', keyContext: null };
      const needsAuth = matched.handler._requiresAuth;
      if (needsAuth) {
        authContext = await authenticationMiddleware(request, env);
      }

      const rateLimitId = authContext.authenticated
        ? authContext.keyContext.id
        : (request.headers.get('x-forwarded-for') || 'anonymous');
      const rlHeaders = rateLimitMiddleware(rateLimitId, authContext.tier);

      const result = await matched.handler(request, env, matched.params, authContext);

      if (result instanceof Response) {
        for (const [k, v] of Object.entries({ ...corsHeaders, ...secHeaders, ...rlHeaders, 'X-Request-ID': requestId })) {
          result.headers.set(k, v);
        }
        return result;
      }

      return jsonResponse(result, 200, { ...corsHeaders, ...secHeaders, ...rlHeaders, 'X-Request-ID': requestId });
    } catch (error) {
      const resp = errorHandler(error, requestId);
      const corsHeaders = corsMiddleware(request, env);
      const secHeaders = securityHeaders();
      for (const [k, v] of Object.entries({ ...corsHeaders, ...secHeaders })) {
        resp.headers.set(k, v);
      }
      return resp;
    }
  },
};
