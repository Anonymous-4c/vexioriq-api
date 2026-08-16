import { createRouter } from './router/router.js';
import { registerV1Routes } from './api/v1/index.js';
import { corsMiddleware, handleCorsOptions } from './middleware/cors.js';
import { securityHeaders } from './middleware/security.js';
import { authenticationMiddleware } from './middleware/authentication.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generateRequestId } from './utils/ids.js';
import { ApiError } from './utils/errors.js';
import { errorResponse, jsonResponse } from './utils/response.js';

import './tools/index.js';

const router = createRouter();
registerV1Routes(router);

const API_TESTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vexioriq API Tester</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0a0f;--surface:#12121a;--border:#1e1e2e;--text:#e4e4e7;--muted:#71717a;--accent:#6d5dfc;--green:#22c55e;--red:#ef4444;--yellow:#eab308;--blue:#3b82f6;--radius:8px;--font:system-ui,-apple-system,sans-serif;--mono:'SF Mono',SFMono-Regular,Consolas,monospace}
body{background:var(--bg);color:var(--text);font-family:var(--font);min-height:100vh}
.header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px}
.header h1{font-size:18px;font-weight:600}
.header span{color:var(--accent);font-weight:700}
.badge{font-size:11px;padding:2px 8px;border-radius:20px;background:var(--accent);color:#fff;font-weight:600}
.container{display:grid;grid-template-columns:320px 1fr;height:calc(100vh - 65px)}
.sidebar{border-right:1px solid var(--border);overflow-y:auto;padding:16px}
.main{overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px}
.section-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px;font-weight:600}
.preset{padding:10px 12px;border-radius:var(--radius);cursor:pointer;margin-bottom:4px;display:flex;align-items:center;gap:10px;transition:background .15s;border:1px solid transparent;font-size:13px}
.preset:hover{background:var(--surface);border-color:var(--border)}
.preset.active{background:var(--surface);border-color:var(--accent)}
.method-badge{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;font-family:var(--mono);min-width:38px;text-align:center}
.method-GET{background:#22c55e22;color:var(--green)}.method-POST{background:#3b82f622;color:var(--blue)}.method-PUT{background:#eab30822;color:var(--yellow)}.method-DELETE{background:#ef444422;color:var(--red)}
.request-bar{display:flex;gap:10px;align-items:stretch}
.method-select{background:var(--surface);color:var(--green);border:1px solid var(--border);border-radius:var(--radius);padding:0 12px;font-family:var(--mono);font-size:13px;font-weight:600;cursor:pointer;appearance:none;min-width:80px;text-align:center}
.url-input{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-family:var(--mono);font-size:13px;outline:none;transition:border-color .15s}
.url-input:focus{border-color:var(--accent)}
.send-btn{background:var(--accent);color:#fff;border:none;border-radius:var(--radius);padding:10px 24px;font-weight:600;font-size:13px;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.send-btn:hover{opacity:.9}.send-btn:disabled{opacity:.5;cursor:not-allowed}.send-btn.loading{color:transparent}
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border)}
.tab{padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;transition:all .15s}
.tab:hover{color:var(--text)}.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.panel{display:none}.panel.active{display:block}
.response-meta{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.status{font-family:var(--mono);font-size:13px;font-weight:700;padding:4px 10px;border-radius:var(--radius)}
.status-2xx{background:#22c55e22;color:var(--green)}.status-3xx{background:#eab30822;color:var(--yellow)}.status-4xx{background:#ef444422;color:var(--red)}.status-5xx{background:#ef444422;color:var(--red)}
.meta-item{font-size:12px;color:var(--muted)}.meta-item strong{color:var(--text)}
.code-block{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;font-family:var(--mono);font-size:12px;line-height:1.6;overflow-x:auto;white-space:pre-wrap;word-break:break-all;max-height:500px;overflow-y:auto;color:var(--muted)}
.code-block .key{color:var(--accent)}.code-block .str{color:var(--green)}.code-block .num{color:var(--yellow)}.code-block .bool{color:var(--blue)}
.headers-table{width:100%;border-collapse:collapse;font-size:12px}
.headers-table th{text-align:left;padding:8px 12px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border)}
.headers-table td{padding:8px 12px;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:11px}
.headers-table td:first-child{color:var(--accent);white-space:nowrap}
.config-row{display:flex;gap:12px;margin-bottom:12px;align-items:center}
.config-label{font-size:12px;color:var(--muted);min-width:80px}
.config-input{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;color:var(--text);font-family:var(--mono);font-size:12px;outline:none}
.config-input:focus{border-color:var(--accent)}
.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}.empty-state p{margin-top:8px;font-size:13px}
.history-item{padding:8px 12px;border-radius:var(--radius);cursor:pointer;margin-bottom:4px;font-size:12px;display:flex;align-items:center;gap:8px;transition:background .15s}
.history-item:hover{background:var(--surface)}
.history-time{color:var(--muted);font-size:10px;margin-left:auto;white-space:nowrap}
@media(max-width:768px){.container{grid-template-columns:1fr}.sidebar{display:none}}
</style>
</head>
<body>
<div class="header"><span>VEXIORIQ</span><h1>API Tester</h1><span class="badge">v1</span></div>
<div class="container">
<div class="sidebar">
<div class="section-title">Configuration</div>
<div class="config-row"><span class="config-label">Base URL</span><input class="config-input" id="baseUrl" value="" placeholder="https://your-worker.workers.dev" spellcheck="false"></div>
<div class="config-row"><span class="config-label">API Key</span><input class="config-input" id="apiKey" type="password" placeholder="vxr_..." spellcheck="false"></div>
<div style="margin-top:20px"><div class="section-title">Quick Endpoints</div>
<div class="preset active" data-method="GET" data-path="/v1/health" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/health</span></div>
<div class="preset" data-method="GET" data-path="/v1/meta" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/meta</span></div>
<div class="preset" data-method="GET" data-path="/v1/tools" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/tools</span></div>
<div class="preset" data-method="GET" data-path="/v1/tools/uuid-generator" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/tools/uuid-generator</span></div>
<div class="preset" data-method="GET" data-path="/v1/tools/hash-generator" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/tools/hash-generator</span></div>
<div class="preset" data-method="GET" data-path="/v1/tools/json-formatter" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>/v1/tools/json-formatter</span></div>
</div>
<div style="margin-top:20px"><div class="section-title">Tool Execution</div>
<div class="preset" data-method="POST" data-path="/v1/tools/uuid-generator" data-body='{"count":3}' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>uuid-generator</span></div>
<div class="preset" data-method="POST" data-path="/v1/tools/hash-generator" data-body='{"input":"hello world","algorithm":"SHA-256"}' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>hash-generator</span></div>
<div class="preset" data-method="POST" data-path="/v1/tools/json-formatter" data-body='{"input":{"name":"vexioriq","version":1},"mode":"format","indent":2}' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>json-formatter</span></div>
<div class="preset" data-method="POST" data-path="/v1/tools/base64-encoder" data-body='{"input":"Hello Vexioriq","mode":"encode"}' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>base64-encoder</span></div>
<div class="preset" data-method="POST" data-path="/v1/tools/timestamp-converter" data-body='{}' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>timestamp-converter</span></div>
</div>
<div style="margin-top:20px"><div class="section-title">Error Tests</div>
<div class="preset" data-method="GET" data-path="/v1/nonexistent" onclick="selectPreset(this)"><span class="method-badge method-GET">GET</span><span>404 Test</span></div>
<div class="preset" data-method="DELETE" data-path="/v1/health" onclick="selectPreset(this)"><span class="method-badge method-DELETE">DEL</span><span>405 Test</span></div>
<div class="preset" data-method="POST" data-path="/v1/tools/uuid-generator" data-body='bad json' onclick="selectPreset(this)"><span class="method-badge method-POST">POST</span><span>Bad JSON Test</span></div>
</div>
<div style="margin-top:20px"><div class="section-title">History</div><div id="history"></div></div>
</div>
<div class="main">
<div class="request-bar">
<select class="method-select" id="method" onchange="updateMethodColor()"><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select>
<input class="url-input" id="url" value="/v1/health" spellcheck="false" onkeydown="if(event.key==='Enter')sendRequest()">
<button class="send-btn" id="sendBtn" onclick="sendRequest()">Send</button>
</div>
<div id="bodySection" style="display:none"><div class="tabs"><div class="tab active" onclick="switchTab(this,'body')">Body</div></div>
<textarea id="body" style="width:100%;height:120px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;color:var(--text);font-family:var(--mono);font-size:12px;resize:vertical;outline:none;margin-top:8px" spellcheck="false" placeholder='{"key":"value"}'></textarea></div>
<div id="responseSection">
<div class="empty-state" id="emptyState"><p style="font-size:24px;margin-bottom:4px">&#8593;</p><p>Send a request to see the response</p></div>
<div id="responseContent" style="display:none">
<div class="response-meta" id="responseMeta"></div>
<div class="tabs" style="margin-top:12px"><div class="tab active" onclick="switchResponseTab(this,'response')">Response</div><div class="tab" onclick="switchResponseTab(this,'respHeaders')">Headers</div></div>
<div class="panel active" id="panel-response"><div class="code-block" id="responseBody"></div></div>
<div class="panel" id="panel-respHeaders"><table class="headers-table" id="responseHeaders"></table></div>
</div>
</div>
</div>
</div>
<script>
let history=[];
function selectPreset(el){document.querySelectorAll('.preset').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.getElementById('method').value=el.dataset.method;document.getElementById('url').value=el.dataset.path;document.getElementById('body').value=el.dataset.body||'';updateMethodColor();updateBodyVisibility()}
function updateMethodColor(){const sel=document.getElementById('method');const c={GET:'var(--green)',POST:'var(--blue)',PUT:'var(--yellow)',PATCH:'var(--yellow)',DELETE:'var(--red)'};sel.style.color=c[sel.value]||'var(--text)';updateBodyVisibility()}
function updateBodyVisibility(){document.getElementById('bodySection').style.display=['POST','PUT','PATCH'].includes(document.getElementById('method').value)?'block':'none'}
function switchTab(el){el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active')}
function switchResponseTab(el,name){el.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');document.querySelectorAll('#responseSection .panel').forEach(p=>p.classList.remove('active'));document.getElementById('panel-'+name).classList.add('active')}
function syntaxHighlight(j){if(typeof j!=='string')j=JSON.stringify(j,null,2);return j.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"([^"]+)"(?=\\s*:)/g,'<span class="key">"$1"</span>').replace(/: "([^"]*)"/g,': <span class="str">"$1"</span>').replace(/: (\\d+\\.?\\d*)/g,': <span class="num">$1</span>').replace(/: (true|false|null)/g,': <span class="bool">$1</span>')}
async function sendRequest(){const btn=document.getElementById('sendBtn');const method=document.getElementById('method').value;const baseUrl=document.getElementById('baseUrl').value.replace(/\\/+$/,'')||location.origin;const path=document.getElementById('url').value;const apiKey=document.getElementById('apiKey').value;const body=document.getElementById('body').value;const fullUrl=path.startsWith('http')?path:baseUrl+path;const headers={};if(apiKey)headers['Authorization']='Bearer '+apiKey;if(['POST','PUT','PATCH'].includes(method)&&body)headers['Content-Type']='application/json';const opts={method,headers};if(['POST','PUT','PATCH'].includes(method)&&body)opts.body=body;btn.classList.add('loading');btn.disabled=true;const t0=performance.now();try{const res=await fetch(fullUrl,opts);const dur=Math.round(performance.now()-t0);const data=await res.text();let parsed;try{parsed=JSON.parse(data)}catch(e){parsed=null}const sc=res.status<300?'status-2xx':res.status<400?'status-3xx':res.status<500?'status-4xx':'status-5xx';document.getElementById('emptyState').style.display='none';document.getElementById('responseContent').style.display='block';document.getElementById('responseMeta').innerHTML='<span class="status '+sc+'">'+res.status+' '+res.statusText+'</span><span class="meta-item"><strong>'+dur+'ms</strong></span><span class="meta-item">'+data.length+' bytes</span>';document.getElementById('responseBody').innerHTML=parsed?syntaxHighlight(parsed):syntaxHighlight(data);let hh='<tr><th>Header</th><th>Value</th></tr>';res.headers.forEach((v,k)=>{hh+='<tr><td>'+k+'</td><td>'+v+'</td></tr>'});document.getElementById('responseHeaders').innerHTML=hh;addToHistory(method,path,res.status,dur)}catch(err){document.getElementById('emptyState').style.display='none';document.getElementById('responseContent').style.display='block';document.getElementById('responseMeta').innerHTML='<span class="status status-5xx">Error</span>';document.getElementById('responseBody').innerHTML=syntaxHighlight({error:err.message})}finally{btn.classList.remove('loading');btn.disabled=false}}
function addToHistory(m,p,s,d){history.unshift({method:m,path:p,status:s,duration:d,time:new Date().toLocaleTimeString()});if(history.length>20)history.pop();renderHistory()}
function renderHistory(){document.getElementById('history').innerHTML=history.map(h=>{const c=h.status<300?'color:var(--green)':h.status<500?'color:var(--yellow)':'color:var(--red)';return '<div class="history-item" onclick="document.getElementById(\\'method\\').value=\\''+h.method+'\\';document.getElementById(\\'url\\').value=\\''+h.path+'\\';updateMethodColor();updateBodyVisibility()"><span class="method-badge method-'+h.method+'" style="font-size:9px;padding:1px 4px">'+h.method+'</span><span style="font-family:var(--mono);font-size:11px">'+h.path+'</span><span style="'+c+';font-family:var(--mono);font-size:11px;font-weight:600">'+h.status+'</span><span class="history-time">'+h.time+'</span></div>'}).join('')}
updateMethodColor();
</script>
</body>
</html>`;

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
