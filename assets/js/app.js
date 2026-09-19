import { analyse, nextSteps } from './engine.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const KEY = 'rakshak_v2_history';
const LAB_KEY = 'rakshak_v2_lab';
const samples = {
  bank: `Dear Customer, your bank KYC will expire today. Your account will be blocked. Verify immediately at https://sbi-kyc-verify.xyz/update and share the OTP with our officer to avoid suspension. Do not tell anyone.`,
  job: `Congratulations! Work from home and earn ₹5,000 daily. No experience needed. Join our Telegram group and complete a prepaid rating task. Deposit ₹499 to unlock today's higher payout.`,
  upi: `Your UPI refund is pending. To receive the refund, confirm your UPI PIN on the secure portal: https://paytm-refund-login.top/claim. Refund expires in 30 minutes.`,
  safe: `Your monthly account statement is ready. You can view it by opening your bank's official app. If you did not request this message, contact the number printed on your card.`
};
const labData = [
  {from:'BANK ALERT', text:'Your debit card transaction was declined. If this was not you, open your bank app directly or call the number on the back of your card.', answer:'safe', why:'It recommends an independent verification channel and does not ask for OTP, PIN, payment or a message link.'},
  {from:'KYC DESK', text:'KYC expires today. Keep the call connected, do not tell your family, and install AnyDesk so our officer can help you verify.', answer:'scam', why:'Secrecy + remote access + urgency is a high-risk manipulation chain.'},
  {from:'DELIVERY', text:'Your parcel is held for a ₹25 address fee. Pay using this short link to release it today.', answer:'scam', why:'A tiny fee, urgency and a hidden destination are common extraction signals.'},
  {from:'COLLEGE OFFICE', text:'Reminder: semester timetable has been updated. Please check the student portal from your usual bookmark. No action is required by reply.', answer:'safe', why:'It points to a known channel and does not request money or credentials in the message.'},
  {from:'RECRUITER', text:'Guaranteed ₹8,000 daily. Send ₹999 registration fee to reserve your slot and share the payment screenshot.', answer:'scam', why:'Guaranteed income + advance payment + proof-of-payment request is an extraction pattern.'},
  {from:'UPI ALERT', text:'Payment of ₹1,240 received. If you did not make this transaction, check your bank app or statement for details.', answer:'safe', why:'A transaction notification can mention the amount without asking you to share secrets or pay anyone.'},
  {from:'POLICE NOTICE', text:'You are under investigation. Stay on video call, keep your camera on and transfer funds to a verification account immediately.', answer:'scam', why:'Authority pressure + isolation + money transfer is a classic social-engineering chain.'},
  {from:'SHOP', text:'Thanks for your order. Your invoice is available in the official app under Orders. Contact support from the app if you need help.', answer:'safe', why:'The message directs you to a familiar app instead of a risky link or payment request.'}
];
let state = {last:null, source:'WhatsApp', labIndex:0, labScore:Number(localStorage.getItem(LAB_KEY)||0), expanded:false};

function getHistory(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]} }
function setHistory(h){ localStorage.setItem(KEY, JSON.stringify(h.slice(0,30))); }
function saveScan(result, source, text){
  const item={id:Date.now(), date:new Date().toISOString(), source, text:text.slice(0,500), score:result.score, verdict:result.verdict, findings:result.findings.map(x=>x.id), links:result.stats.links};
  setHistory([item,...getHistory()]); renderDashboard(); return item;
}
function esc(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function markEvidence(text, spans){
  if(!spans?.length) return esc(text).replace(/\n/g,'<br>');
  const sorted=[...spans].sort((a,b)=>a.start-b.start); let out='', pos=0;
  for(const sp of sorted){if(sp.start<pos) continue; out+=esc(text.slice(pos,sp.start)); const cls=sp.family==='pressure'?'pressure':sp.family==='authority'?'authority':sp.family==='secrecy'?'secrecy':sp.family==='channel'?'channel':'extraction'; out+=`<mark class="${cls}" title="${esc(sp.title||'Signal')}">${esc(text.slice(sp.start,sp.end))}</mark>`; pos=sp.end;}
  out+=esc(text.slice(pos)); return out.replace(/\n/g,'<br>');
}
function intent(result){
  const ids=new Set(result.findings.map(f=>f.id));
  if(ids.has('credentials')) return ['Harvest credentials','The sender is trying to obtain an OTP, PIN, password or card detail.','CREDENTIAL THEFT'];
  if(ids.has('money')||ids.has('prize')||ids.has('jobscam')) return ['Extract money','The message creates a reason to send money, deposit a fee, or pay before receiving a promised benefit.','FINANCIAL EXTRACTION'];
  if(ids.has('remote')) return ['Gain device control','The sender is trying to move the conversation into a remote-access or screen-sharing flow.','REMOTE ACCESS'];
  if(ids.has('shortlink')||ids.has('lookalike')) return ['Redirect you to a risky destination','The visible message uses a link as the next step, so the destination needs independent verification.','LINK MANIPULATION'];
  if(ids.has('secrecy')||ids.has('fear')) return ['Control the conversation','The script uses isolation or fear to reduce the chance that you verify with someone you trust.','SOCIAL ENGINEERING'];
  return result.verdict==='safe'?['Provide information','This message looks informational and does not show a strong risky request.','LOW-INTERVENTION']:['Create pressure','The wording contains manipulation signals that deserve a pause and independent verification.','SOCIAL ENGINEERING'];
}
function chain(result){
 const ids=new Set(result.findings.map(f=>f.id)); const parts=[];
 if(ids.has('authority')) parts.push('FAKE AUTHORITY'); else if(ids.has('fear')) parts.push('FEAR');
 if(ids.has('pressure')) parts.push('URGENCY');
 if(ids.has('secrecy')) parts.push('ISOLATION');
 if(ids.has('credentials')) parts.push('OTP / PIN ASK');
 else if(ids.has('money')||ids.has('jobscam')||ids.has('prize')) parts.push('PAYMENT ASK');
 else if(ids.has('remote')) parts.push('REMOTE ACCESS');
 else if(result.stats.links) parts.push('LINK');
 if(!parts.length) parts.push('INFORMATION');
 return parts.map((x,i)=>`<div class="chain-node"><span>${String(i+1).padStart(2,'0')}</span><b>${x}</b></div>`).join('<i class="chain-arrow">→</i>');
}
function renderReport(result,text){
 state.last={result,text,source:state.source}; $('#idleReport').hidden=true; $('#activeReport').hidden=false;
 const score=result.score; const verdict=result.verdict; const title=verdict==='scam'?'Critical risk detected':verdict==='suspicious'?'Suspicious pattern detected':'No strong scam pattern';
 const sub=verdict==='scam'?'Pause. Do not follow the requested action until you verify independently.':verdict==='suspicious'?'Treat this as untrusted until you verify the sender and destination.':'The message does not show a strong extraction or manipulation pattern.';
 $('#scoreValue').textContent=score; $('#scoreRing').style.setProperty('--score',`${score*3.6}deg`); $('#verdictBadge').textContent=verdict.toUpperCase(); $('#verdictBadge').className=`verdict-badge ${verdict}`; $('#verdictTitle').textContent=title; $('#verdictSub').textContent=sub; $('#riskFill').style.width=score+'%';
 $('#reportMetrics').innerHTML=[['SIGNALS',result.findings.length],['LINKS',result.stats.links],['WORDS',result.stats.words],['EVIDENCE',result.spans.length]].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 const it=intent(result); $('#intentTitle').textContent=it[0]; $('#intentText').textContent=it[1]; $('#intentType').textContent=it[2]; $('#attackChain').innerHTML=chain(result);
 $('#findings').innerHTML=result.findings.length?result.findings.map((f,i)=>`<article class="finding ${i>2&&!state.expanded?'collapsed':''}"><button class="finding-head" data-expand><span class="finding-index">${String(i+1).padStart(2,'0')}</span><span><b>${esc(f.title.en||f.title)}</b><small>${f.points} risk points · ${esc(f.family)}</small></span><strong>+</strong></button><div class="finding-body"><p>${esc(f.why.en||f.why)}</p></div></article>`).join(''):`<div class="clean-state">✓ No evidence pattern fired strongly enough to flag this message.</div>`;
 const steps=nextSteps(result); $('#steps').innerHTML=steps.map((s,i)=>`<div class="action-row"><span>${i+1}</span><div><b>${esc(s.en)}</b></div></div>`).join('');
 const urls=[...text.matchAll(/https?:\/\/[^\s]+/gi)].map(m=>m[0].replace(/[),.!?]+$/,'')); if(urls.length){$('#linkIntelMini').hidden=false; $('#linkIntelMini').innerHTML=`<div><span class="section-kicker">URL SIGNAL</span><b>${urls.length} destination${urls.length>1?'s':''} detected</b><small>Inspect before opening →</small></div><button id="inspectDetected" class="text-btn">Open URL Intel</button>`; $('#inspectDetected').onclick=()=>{route('url'); $('#urlInput').value=urls[0]; analyzeUrl();};}else $('#linkIntelMini').hidden=true;
 $('#toggleEvidence').textContent=state.expanded?'Collapse extras':'Expand all';
 saveScan(result,state.source,text); renderHighlighted(text,result.spans); window.scrollTo({top:document.querySelector('#reportPanel').offsetTop-90,behavior:'smooth'});
}
function renderHighlighted(text,spans){ $('#markedText').innerHTML=markEvidence(text,spans); }
function analyze(){const text=$('#messageInput').value.trim(); if(!text){$('#inputHint').textContent='Paste a message first, or choose a sample.'; $('#messageInput').focus();return;} $('#inputHint').textContent='Analyzing locally…'; setTimeout(()=>{const result=analyse(text); renderReport(result,text); $('#inputHint').textContent='Analysis complete — evidence stays in this browser.';},220);}
function route(name){
 $$('.route').forEach(r=>r.classList.toggle('active',r.id===`route-${name}`)); $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.route===name)); location.hash=name; if(name==='dashboard') renderDashboard(); if(name==='lab') renderLab(); if(name==='scan') $('#messageInput').focus();
}
function renderDashboard(){
 const h=getHistory(); const scans=h.length, threats=h.filter(x=>x.verdict==='scam').length, avg=scans?Math.round(h.reduce((a,x)=>a+x.score,0)/scans):0, links=h.reduce((a,x)=>a+x.links,0);
 $('#dashboardCards').innerHTML=[['TOTAL SCANS',scans,'local analyses'],['HIGH RISK',threats,'flagged as scam'],['AVG RISK',avg+'/100','across scans'],['LINKS INSPECTED',links,'found in messages']].map((x,i)=>`<div class="dash-card"><span>${['◌','⚠','◒','↗'][i]}</span><small>${x[0]}</small><b>${x[1]}</b><em>${x[2]}</em></div>`).join('');
 $('#historyList').innerHTML=h.length?h.slice(0,12).map(x=>`<button class="history-row" data-history="${x.id}"><span class="history-score ${x.verdict}">${x.score}</span><span><b>${esc(x.text.replace(/\s+/g,' ').slice(0,72))}</b><small>${x.source} · ${new Date(x.date).toLocaleString()}</small></span><strong>→</strong></button>`).join(''):`<div class="empty-history">No local scans yet. Analyze a message to build your private threat timeline.</div>`;
 const counts={}; h.forEach(x=>x.findings.forEach(id=>counts[id]=(counts[id]||0)+1)); const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6); $('#signalChart').innerHTML=top.length?top.map(([id,n])=>`<div class="signal-bar"><span>${id.replace(/([A-Z])/g,' $1')}</span><i><b style="width:${Math.min(100,n/h.length*100)}%"></b></i><em>${n}</em></div>`).join(''):`<div class="empty-history">Signal profile will appear after your first scan.</div>`;
}
function renderLab(){const q=labData[state.labIndex]; $('#labQuestion').innerHTML=`<div class="lab-meta"><span>${q.from}</span><i>incoming message</i></div><blockquote>${esc(q.text)}</blockquote>`; $('#labScore').textContent=state.labScore; $('#labProgress').textContent=`${state.labIndex} / ${labData.length}`; $('#labBar').style.width=(state.labIndex/labData.length*100)+'%'; $('#labFeedback').hidden=true; $('#guessScam').disabled=false; $('#guessSafe').disabled=false;}
function answerLab(guess){const q=labData[state.labIndex]; const ok=guess===q.answer; if(ok) state.labScore++; localStorage.setItem(LAB_KEY,state.labScore); $('#labFeedback').hidden=false; $('#labFeedback').innerHTML=`<b>${ok?'Correct ✓':'Not quite — pause and inspect the ask.'}</b><p>${q.why}</p><button id="labNext" class="primary-btn">${state.labIndex===labData.length-1?'Restart lab':'Next scenario'} →</button>`; $('#guessScam').disabled=true; $('#guessSafe').disabled=true; $('#labNext').onclick=()=>{state.labIndex=state.labIndex===labData.length-1?0:state.labIndex+1; if(state.labIndex===0) state.labScore=0; renderLab();};}
function analyzeUrl(){const raw=$('#urlInput').value.trim(); if(!raw){return;} let u; try{u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw)}catch{$('#urlResult').innerHTML='<div class="url-result"><div class="url-risk high">INVALID</div><h2>That does not look like a valid URL.</h2><p>Check the address and try again. No network request was made.</p></div>';return;}
 const host=u.hostname.toLowerCase(), signals=[]; if(u.protocol!=='https:') signals.push(['Insecure protocol','The URL does not use HTTPS.']); const short=['bit.ly','tinyurl.com','t.co','cutt.ly','rb.gy','is.gd','ow.ly','shorturl.at']; if(short.some(x=>host===x||host.endsWith('.'+x))) signals.push(['Shortened destination','The visible address hides the final destination.']); if(host.split('.').length>3) signals.push(['Deep subdomain','Multiple subdomains can make impersonation harder to notice.']); if(/(login|verify|kyc|refund|secure|update|support|reward|bank|upi|wallet)/i.test(host)) signals.push(['Action-heavy domain','The domain contains words commonly used in lure pages.']); if(/(xn--|@|\d{1,3}(?:\.\d{1,3}){3})/.test(raw)) signals.push(['Unusual address form','The URL contains a pattern worth verifying before opening.']); const suspiciousTld=['xyz','top','click','buzz','icu','cfd','rest','monster','work','online']; if(suspiciousTld.includes(host.split('.').pop())) signals.push(['Uncommon TLD','This is not proof of fraud, but it adds a verification signal.']); const score=Math.min(95,signals.length*17+(u.protocol==='https:'?0:15)); const level=score>=55?'HIGH':score>=25?'CAUTION':'LOW'; $('#urlResult').innerHTML=`<div class="url-result"><div class="url-result-top"><div><span class="section-kicker">DESTINATION ASSESSMENT</span><h2>${esc(host)}</h2><p>${esc(u.protocol)} · ${esc(u.pathname||'/')}</p></div><div class="url-risk ${level.toLowerCase()}">${score}/100 · ${level}</div></div><div class="url-signal-list">${signals.length?signals.map(s=>`<div><span>⚠</span><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div>`).join(''):'<div class="clean-state">✓ No obvious structural red flag detected. This does not prove the destination is safe.</div>'}</div><div class="url-actions"><button class="primary-btn" id="copyDomain">Copy domain</button><button class="ghost-btn" id="backScan">Analyze the message instead</button></div></div>`; $('#copyDomain').onclick=()=>copyText(host,'Domain copied'); $('#backScan').onclick=()=>route('scan');}
function copyText(text,msg='Copied'){navigator.clipboard?.writeText(text).then(()=>toast(msg)).catch(()=>toast('Copy not available in this browser'));}
function toast(msg){const t=$('#toast'); if(!t)return; t.hidden=false;t.textContent=msg;clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.hidden=true,2400);}
function warningText(){if(!state.last)return ''; const {result,text}=state.last; return `⚠ RAKSHAK WARNING\nRisk: ${result.score}/100 (${result.verdict.toUpperCase()})\n\n${result.verdict==='safe'?'No strong scam pattern detected. Still verify independently when money or credentials are involved.':'Do not reply, pay, share OTP/PIN/password, or open the link until you verify the sender through an official channel.'}\n\nWhy it was flagged: ${result.findings.slice(0,4).map(f=>f.title.en).join(', ')||'No strong signal'}\n\nMessage preview: ${text.slice(0,220)}`;}
function openModal(type){const m=$('#modalContent'); if(type==='family')m.innerHTML=`<span class="section-kicker">FAMILY PROTECTION CARD</span><h2>Send a clear warning, not panic.</h2><div class="warning-card"><div class="warning-card__logo">R</div><strong>⚠ ${state.last?.result.score||0}/100 RISK</strong><h3>Pause before you act.</h3><p>${state.last?.result.verdict==='safe'?'No strong scam pattern was detected. Still verify independently.':'Do not reply, pay, share OTP/PIN/password, or open the link. Verify through an official channel.'}</p><small>Generated locally by Rakshak</small></div><button class="primary-btn" id="copyFamilyModal">Copy warning text</button>`; else m.innerHTML=`<span class="section-kicker">INCIDENT REPORT</span><h2>Local incident record</h2><div class="incident"><div><span>Risk score</span><b>${state.last?.result.score}/100</b></div><div><span>Verdict</span><b>${state.last?.result.verdict}</b></div><div><span>Source</span><b>${state.last?.source}</b></div><div><span>Signals</span><b>${state.last?.result.findings.length}</b></div><hr><p>${esc(state.last?.text||'')}</p></div><button class="primary-btn" id="copyIncident">Copy report</button>`; $('#modalBackdrop').hidden=false; if($('#copyFamilyModal'))$('#copyFamilyModal').onclick=()=>copyText(warningText(),'Warning copied'); if($('#copyIncident'))$('#copyIncident').onclick=()=>copyText(warningText(),'Report copied');}

function wire(){
 $$('.nav-btn,[data-route]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.route)));
 $$('.source').forEach(b=>b.onclick=()=>{$$('.source').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.source=b.dataset.source;});
 $('#messageInput').oninput=e=>$('#charCount').textContent=`${e.target.value.length} / 5000`;
 $('#analyzeBtn').onclick=analyze; $('#clearBtn').onclick=()=>{$('#messageInput').value='';$('#charCount').textContent='0 / 5000';$('#inputHint').textContent='';}; $('#newScan').onclick=()=>{$('#activeReport').hidden=true;$('#idleReport').hidden=false;};
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')analyze();});
 [['sample1','bank'],['sample2','job'],['sample3','upi'],['sample4','safe']].forEach(([id,k])=>$('#'+id).onclick=()=>{$('#messageInput').value=samples[k];$('#messageInput').dispatchEvent(new Event('input'));}); $('#randomBtn').onclick=()=>{const k=Object.keys(samples)[Math.floor(Math.random()*4)];$('#messageInput').value=samples[k];$('#messageInput').dispatchEvent(new Event('input'));};
 $('#toggleEvidence').onclick=()=>{state.expanded=!state.expanded;if(state.last)renderReport(state.last.result,state.last.text);};
 $('#familyBtn').onclick=()=>openModal('family'); $('#incidentBtn').onclick=()=>openModal('incident'); $('#copyBtn').onclick=()=>copyText(warningText(),'Analysis copied'); $('#cardBtn').onclick=()=>openModal('family'); $('#modalClose').onclick=()=>$('#modalBackdrop').hidden=true; $('#modalBackdrop').onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.hidden=true};
 $('#urlAnalyze').onclick=analyzeUrl; $('#urlClear').onclick=()=>{$('#urlInput').value='';$('#urlResult').innerHTML='<div class="idle-report compact"><div class="url-globe">◎</div><span class="section-kicker">URL INTELLIGENCE</span><h2>Paste a URL to begin.</h2><p>Domain, protocol, shortener and impersonation patterns will be surfaced here.</p></div>';};
 $('#guessScam').onclick=()=>answerLab('scam');$('#guessSafe').onclick=()=>answerLab('safe');
 $('#clearHistory').onclick=()=>{localStorage.removeItem(KEY);renderDashboard();}; $('#wipeAll').onclick=()=>{localStorage.removeItem(KEY);localStorage.removeItem(LAB_KEY);location.reload();}; $('#clearDataBtn').onclick=()=>{localStorage.removeItem(KEY);localStorage.removeItem(LAB_KEY);toast('Local history cleared');};
 $('#menuBtn').onclick=()=>$('#quickMenu').hidden=!$('#quickMenu').hidden;
 window.addEventListener('hashchange',()=>route((location.hash||'#scan').slice(1))); renderDashboard(); renderLab();
}
wire(); route((location.hash||'#scan').slice(1));
