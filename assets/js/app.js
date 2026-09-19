import { analyse, nextSteps } from './engine.js';
import { SAMPLES, DRILL } from './corpus.js';

const $ = (id) => document.getElementById(id);
let lang = (navigator.language || '').toLowerCase().startsWith('hi') ? 'hi' : 'en';
let last = null;
let lastText = '';
let currentView = 'scan';
const t = (obj) => (obj && obj[lang]) || (obj && obj.en) || '';

const COPY = {
  scam: { word:{en:'Scam',hi:'ठगी'}, line:{en:'Multiple fraud signals are working together. Do not act on this message.',hi:'ठगी के कई संकेत एक साथ काम कर रहे हैं। इस मैसेज पर कोई कार्रवाई न करें.'} },
  suspicious: { word:{en:'Suspicious',hi:'संदिग्ध'}, line:{en:'Some risky signals are present. Pause and verify through a channel you already trust.',hi:'कुछ जोखिम वाले संकेत मिले हैं। रुकें और पहले से भरोसेमंद माध्यम से पुष्टि करें.'} },
  safe: { word:{en:'No red flags',hi:'कोई बड़ा संकेत नहीं'}, line:{en:'No strong fraud tactics were detected. This does not prove the sender or link is legitimate.',hi:'ठगी की मजबूत चाल नहीं मिली। इससे भेजने वाला या लिंक अपने-आप असली साबित नहीं होता.'} },
};

const INTENT = {
  pressure: {en:'Create urgency or fear',hi:'जल्दी या डर पैदा करना', desc:{en:'The message is trying to make you act before you have time to verify it.',hi:'मैसेज आपको बिना जाँच किए जल्दी कार्रवाई करने के लिए दबाव डाल रहा है.'}},
  authority: {en:'Borrow trust from authority',hi:'किसी बड़ी संस्था का भरोसा लेना', desc:{en:'It uses an official-sounding identity to make the request feel legitimate.',hi:'यह आधिकारिक नाम या पहचान का इस्तेमाल करके माँग को असली दिखाता है.'}},
  secrecy: {en:'Keep you isolated',hi:'आपको अकेला रखना', desc:{en:'It discourages you from asking family, friends or the real organisation for a second opinion.',hi:'यह आपको परिवार, दोस्तों या असली संस्था से पुष्टि करने से रोकने की कोशिश करता है.'}},
  extraction: {en:'Get money or credentials',hi:'पैसे या गोपनीय जानकारी लेना', desc:{en:'The clearest danger is the requested payment, OTP, PIN, password or other sensitive action.',hi:'सबसे बड़ा खतरा पैसे, OTP, PIN, पासवर्ड या दूसरी संवेदनशील जानकारी की माँग है.'}},
  channel: {en:'Move you to a risky channel',hi:'आपको असुरक्षित माध्यम पर ले जाना', desc:{en:'It tries to move the conversation to a personal number, remote-access tool or suspicious link.',hi:'यह बातचीत को निजी नंबर, रिमोट ऐप या संदिग्ध लिंक की तरफ ले जा रहा है.'}},
  safe: {en:'Inform, not pressure',hi:'सिर्फ़ सूचना देना', desc:{en:'No strong risky request was detected. Still verify independently when the message matters.',hi:'कोई मजबूत जोखिम वाली माँग नहीं मिली। फिर भी महत्वपूर्ण मामलों में स्वतंत्र रूप से पुष्टि करें.'}},
};

/* ------------------------------ navigation */
document.querySelectorAll('.nav__item').forEach((tab) => tab.addEventListener('click', () => {
  const view = tab.dataset.view;
  currentView = view;
  document.querySelectorAll('.nav__item').forEach((x) => x.classList.toggle('is-active', x === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

$('lang').addEventListener('click', () => {
  lang = lang === 'en' ? 'hi' : 'en';
  $('lang').setAttribute('aria-pressed', String(lang === 'hi'));
  if (last) { renderMarked(lastText, last.spans); renderReport(last); }
  if (current) renderQuestion();
  persistPrefs();
});

function persistPrefs() {
  try { localStorage.setItem('rakshak-lang', lang); } catch {}
}
try {
  const saved = localStorage.getItem('rakshak-lang');
  if (saved === 'en' || saved === 'hi') lang = saved;
} catch {}

/* ------------------------------ scanner */
function setHint(message = '') { $('inputHint').textContent = message; }
function updateCount() {
  const n = $('input').value.length;
  $('charCount').textContent = `${n.toLocaleString()} / 5,000`;
  $('charCount').classList.toggle('is-near-limit', n > 4500);
}
$('input').addEventListener('input', updateCount);
$('input').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) throw new Error('empty');
    $('input').value = text.slice(0, 5000); updateCount(); setHint(''); $('input').focus();
    if ($('input').value.trim().length >= 8) toast(lang === 'hi' ? 'मैसेज paste हो गया — Analyse दबाएँ।' : 'Message pasted — press Analyse when ready.');
  } catch {
    setHint(lang === 'hi' ? 'ब्राउज़र ने clipboard की अनुमति नहीं दी। मैसेज यहाँ paste करें।' : 'Clipboard permission was not available. Paste the message into the box.');
  }
}
$('paste').addEventListener('click', pasteFromClipboard);

function addSamples() {
  $('samples').innerHTML = '';
  SAMPLES.forEach((s, i) => {
    const b = document.createElement('button'); b.className = 'sample'; b.type = 'button'; b.textContent = s.label;
    b.setAttribute('aria-label', `Try sample: ${s.label}`);
    b.addEventListener('click', () => { $('input').value = s.text; updateCount(); run(); });
    b.dataset.index = i;
    $('samples').appendChild(b);
  });
}
addSamples();
$('randomSample').addEventListener('click', () => {
  const s = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  $('input').value = s.text; updateCount(); run();
});
$('check').addEventListener('click', run);
$('edit').addEventListener('click', () => { $('input').focus(); });
$('newScan').addEventListener('click', resetScan);
$('clear').addEventListener('click', resetScan);

function resetScan() {
  $('input').value = ''; updateCount(); setHint(''); last = null; lastText = '';
  $('report').hidden = true; $('idle').hidden = false; $('input').focus();
}

function run() {
  const text = $('input').value.trim();
  if (text.length < 8) {
    setHint(lang === 'hi' ? 'कम से कम कुछ शब्दों वाला पूरा मैसेज डालें।' : 'Paste a longer message so Rakshak has enough context to read it.');
    $('input').focus(); return;
  }
  setHint(''); lastText = text; last = analyse(text); renderMarked(text, last.spans); renderReport(last);
  document.querySelector('#results').scrollIntoView({ behavior:'smooth', block:'start' });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderMarked(text, spans) {
  let html = '', cursor = 0;
  for (const s of spans) {
    if (s.start < cursor) continue;
    html += esc(text.slice(cursor, s.start));
    html += `<mark class="m-${s.family}" title="${esc(s.signal || s.family)}">${esc(text.slice(s.start, s.end))}</mark>`;
    cursor = s.end;
  }
  html += esc(text.slice(cursor));
  $('markedBody').innerHTML = html;
}

function intentFor(r) {
  const families = r.findings.map((f) => f.family);
  const priority = ['extraction','channel','secrecy','pressure','authority'];
  const family = priority.find((x) => families.includes(x)) || 'safe';
  return INTENT[family];
}

function renderReport(r) {
  $('idle').hidden = true; $('report').hidden = false;
  const copy = COPY[r.verdict] || COPY.safe;
  const stamp = $('stamp'); stamp.className = `verdict stamp--${r.verdict}`;
  $('stampWord').textContent = t(copy.word); $('stampScore').textContent = r.score;
  $('verdictLine').textContent = t(copy.line);
  $('meterFill').style.width = `${r.score}%`;
  $('meterFill').parentElement.className = `meter meter--${r.verdict}`;
  stamp.classList.remove('stamp--press'); void stamp.offsetWidth; stamp.classList.add('stamp--press');

  $('reportStats').innerHTML = [
    ['Words', r.stats.words || 0], ['Links', r.stats.links || 0], ['Phone numbers', r.stats.phones || 0], [`${r.findings.length} signals`, r.findings.length ? 'fired' : 'clear']
  ].map(([a,b]) => `<span class="stat"><b>${esc(b)}</b> ${esc(a)}</span>`).join('');

  const intent = intentFor(r);
  $('intentTitle').textContent = t(intent);
  $('intentText').textContent = t(intent.desc);
  $('intentCard').className = `intent-card intent--${r.findings[0]?.family || 'safe'}`;

  const list = $('findings'); list.innerHTML = '';
  const items = [...r.findings, ...r.credits];
  if (!items.length) {
    const li = document.createElement('li'); li.className = 'finding';
    li.innerHTML = `<div class="finding__name">${lang === 'hi' ? 'कोई मजबूत संकेत नहीं मिला' : 'No strong signal fired'}</div><p class="finding__why">${lang === 'hi' ? 'फिर भी लिंक और sender को स्वतंत्र रूप से verify करें।' : 'Still verify the sender and destination independently before acting.'}</p>`;
    list.appendChild(li);
  }
  items.forEach((f) => {
    const li = document.createElement('li'); li.className = `finding ${f.points < 0 ? 'finding--credit' : ''}`;
    const evidence = (f.evidence || []).map((e) => `<span class="ev">${esc(e.length > 55 ? `${e.slice(0,52)}…` : e)}</span>`).join('');
    li.innerHTML = `<div class="finding__top"><span class="finding__name">${esc(t(f.title))}</span><span class="finding__pts">${f.points < 0 ? '' : '+'}${f.points}</span></div><p class="finding__why">${esc(t(f.why))}</p>${evidence ? `<div class="finding__ev">${evidence}</div>` : ''}`;
    list.appendChild(li);
  });

  $('steps').innerHTML = '';
  nextSteps(r).forEach((st) => { const li = document.createElement('li'); li.textContent = t(st); $('steps').appendChild(li); });
  renderLinks(lastText);
}

function extractUrls(text) { return text.match(/\b(?:https?:\/\/|www\.)[^\s<>]+/gi) || []; }
function getDomain(raw) {
  try { return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase(); } catch { return raw.replace(/^https?:\/\//i,'').split('/')[0].toLowerCase(); }
}
function renderLinks(text) {
  const urls = extractUrls(text); const box = $('linksPanel');
  if (!urls.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const rows = urls.slice(0,5).map((url) => {
    const clean = url.replace(/[),.;]+$/,'');
    const domain = getDomain(clean);
    const risky = /bit\.ly|tinyurl|cutt\.ly|rb\.gy|t\.me|\.xyz\b|\.top\b|\.buzz\b|\.click\b|\.icu\b|\.link\b|\.cfd\b|\.rest\b|\.online\b|\.shop\b|\.work\b/i.test(domain) || /^http:\/\//i.test(clean);
    const reason = risky ? (lang === 'hi' ? 'सावधानी: लिंक/डोमेन जाँचें' : 'Caution: inspect before opening') : (lang === 'hi' ? 'लिंक मिला' : 'Link detected');
    return `<div class="link-row"><div><code>${esc(clean)}</code><small>${esc(domain)}</small></div><span class="${risky ? 'link-flag' : 'link-ok'}">${reason}</span></div>`;
  }).join('');
  box.innerHTML = `<strong>${lang === 'hi' ? 'लिंक का quick check — Rakshak उन्हें open नहीं करता' : 'Quick link check — Rakshak never opens these links'}</strong><p class="link-note">${lang === 'hi' ? 'डोमेन को खुद official app/site से मिलाएँ।' : 'Compare the domain with the official app or site you already trust.'}</p>${rows}`;
}

/* ------------------------------ sharing */
function warningText() {
  if (!last) return '';
  const copy = COPY[last.verdict];
  const top = last.findings.slice(0,3).map((f) => `• ${t(f.title)}`).join('\n');
  const head = lang === 'hi' ? `सावधान — Rakshak ने इसे ${t(copy.word)} पढ़ा (जोखिम ${last.score}/100)` : `Rakshak read this as ${t(copy.word).toLowerCase()} (risk ${last.score}/100)`;
  const tail = lang === 'hi' ? 'जवाब न दें। लिंक न खोलें। OTP/PIN न बताएँ। पैसे कटे हों तो cybercrime.gov.in या 1930 पर तुरंत रिपोर्ट करें।' : 'Do not reply or open links. Never share an OTP/PIN. If money has left your account, use the official cybercrime reporting route or 1930 promptly.';
  return `${head}\n\n${top || (lang === 'hi' ? 'कोई मजबूत संकेत नहीं मिला।' : 'No strong signal fired.')}\n\n${tail}\n\n— Checked with Rakshak`;
}
function analysisText() {
  if (!last) return '';
  const copy = COPY[last.verdict];
  const intent = intentFor(last);
  const findings = last.findings.length ? last.findings.map((f) => `- ${t(f.title)} (+${f.points})${f.evidence?.length ? ` — ${f.evidence.join(', ')}` : ''}`).join('\n') : '- No strong signal fired';
  const steps = nextSteps(last).map((s, i) => `${i+1}. ${t(s)}`).join('\n');
  return `RAKSHAK ANALYSIS\nVerdict: ${t(copy.word)}\nRisk score: ${last.score}/100\nWhat it is trying to do: ${t(intent)}\n\nSignals:\n${findings}\n\nNext actions:\n${steps}\n\nPrivacy: analysed locally in this browser; Rakshak does not open links or upload message text.`;
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 3200); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
$('copy').addEventListener('click', async () => toast((await copyText(warningText())) ? (lang === 'hi' ? 'Warning copy हो गया।' : 'Warning copied. Send it to someone you trust.') : (lang === 'hi' ? 'Copy नहीं हो पाया।' : 'Copy was not available.')));
$('copyReport').addEventListener('click', async () => toast((await copyText(analysisText())) ? (lang === 'hi' ? 'पूरा analysis copy हो गया।' : 'Full analysis copied.') : (lang === 'hi' ? 'Copy नहीं हो पाया।' : 'Copy was not available.')));
$('share').addEventListener('click', async () => {
  const text = warningText();
  if (navigator.share) { try { await navigator.share({ title:'Rakshak warning', text }); return; } catch {} }
  if (await copyText(text)) toast(lang === 'hi' ? 'Share API नहीं मिला — warning copy हो गया।' : 'Share is not available here, so the warning was copied instead.');
});
$('card').addEventListener('click', () => { if (!last) return; drawCard(); const a = document.createElement('a'); a.href = $('canvas').toDataURL('image/png'); a.download = `rakshak-${last.verdict}-${last.score}.png`; a.click(); toast(lang === 'hi' ? 'Warning card save हो गया।' : 'Warning card saved.'); });

function drawCard() {
  const c = $('canvas'), ctx = c.getContext('2d'), W = c.width; const tone = {scam:'#d94a45',suspicious:'#c98a19',safe:'#19795d'}[last.verdict];
  ctx.fillStyle='#f5f8fb'; ctx.fillRect(0,0,W,W); ctx.fillStyle='#071a33'; ctx.fillRect(0,0,W,170);
  ctx.fillStyle='#39c79d'; ctx.font='700 42px Arial'; ctx.fillText('RAKSHAK',70,105);
  ctx.fillStyle='#fff'; ctx.font='700 26px Arial'; ctx.fillText('Understand before you act',70,142);
  ctx.strokeStyle=tone; ctx.lineWidth=9; ctx.strokeRect(70,220,W-140,205); ctx.fillStyle=tone; ctx.font='700 100px Arial'; ctx.fillText(t(COPY[last.verdict].word),105,335); ctx.fillStyle='#15243a'; ctx.font='700 36px Arial'; ctx.fillText(`Risk ${last.score}/100`,105,385);
  ctx.font='700 30px Arial'; ctx.fillText('What this message is doing',70,500);
  ctx.font='400 26px Arial'; let y=555; last.findings.slice(0,4).forEach(f=>{ctx.fillText(`• ${t(f.title)}`,80,y);y+=47;});
  ctx.fillStyle=tone; ctx.font='700 27px Arial'; y+=25; const advice=lang==='hi'?['जवाब न दें। लिंक न खोलें।','OTP / PIN किसी को न बताएँ।','पैसे कटे हों तो 1930 पर रिपोर्ट करें।']:['Do not reply. Do not open links.','Never share an OTP or PIN.','If money is gone, report it via the official route or 1930.']; advice.forEach(line=>{ctx.fillText(line,70,y);y+=43;});
  ctx.fillStyle='#6b7d90';ctx.font='400 22px Arial';ctx.fillText('rakshak · browser-only · no message upload',70,W-75);
}

/* ------------------------------ practice */
let order=[], step=0, score=0, streak=0, drillOpen=false, current=null;
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function startDrill(){order=shuffle(DRILL);step=0;score=0;streak=0;$('dTotal').textContent=order.length;$('dDone').hidden=true;$('dCard').hidden=false;$('dChoices').hidden=false;renderQuestion()}
function renderQuestion(){current=order[step];drillOpen=false;$('dTell').hidden=true;$('dChoices').hidden=false;$('dIndex').textContent=step+1;$('dScore').textContent=score;$('dStreak').textContent=streak;$('dBar').style.width=`${(step/order.length)*100}%`;$('dText').textContent=current.text;$('dFrom').textContent=current.from||'Unknown sender'}
$('dChoices').querySelectorAll('button').forEach((b)=>b.addEventListener('click',()=>{if(drillOpen)return;const guess=b.dataset.guess==='true';const wasRight=guess===current.scam;if(wasRight){score++;streak++}else streak=0;drillOpen=true;$('dScore').textContent=score;$('dStreak').textContent=streak;$('dChoices').hidden=true;$('dVerdict').textContent=wasRight?(lang==='hi'?'सही पकड़ा ✓':'Correct ✓'):(lang==='hi'?'यह छूट गया':'That one slipped past');$('dWhy').textContent=t(current.tell);$('dTell').hidden=false}));
$('dNext').addEventListener('click',()=>{step++;if(step>=order.length){finishDrill();return}renderQuestion()});
$('dAgain').addEventListener('click',startDrill);
function finishDrill(){$('dBar').style.width='100%';$('dCard').hidden=true;$('dChoices').hidden=true;$('dTell').hidden=true;$('dDone').hidden=false;$('dFinal').textContent=lang==='hi'?`${score} / ${order.length} सही`:`${score} / ${order.length} correct`;$('dNote').textContent=score>=8?(lang==='hi'?'अच्छा pattern recognition. अब यही सवाल परिवार के किसी सदस्य के साथ करें।':'Strong pattern recognition. Try the drill with a family member too.'):(lang==='hi'?'फिर से करें और हर बार पूछें: “यह मैसेज मुझसे माँग क्या रहा है?”':'Run it again and ask one question every time: what is this message asking me to do?')}

/* Keep the demo immediately usable. */
startDrill();
updateCount();
