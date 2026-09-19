/*
 * Rakshak detection engine
 * ------------------------
 * Fraud messages in India are not random text. They are a script, and the
 * script has fixed moves: manufacture urgency, borrow authority, demand
 * secrecy, then extract money or a credential.
 *
 * So instead of guessing with a black box, we score the moves. Every signal
 * below is one move of that script, with a weight, a plain explanation, and
 * the exact phrases that triggered it. The score is explainable by
 * construction: you can always point at the words.
 *
 * Everything runs in the browser. No message ever leaves the device.
 */

/** Tactic families, used for grouping and colour. */
export const FAMILIES = {
  pressure: { en: 'Pressure', hi: 'दबाव' },
  authority: { en: 'Borrowed authority', hi: 'नकली अधिकार' },
  secrecy: { en: 'Secrecy', hi: 'गोपनीयता' },
  extraction: { en: 'What they want', hi: 'उनकी माँग' },
  channel: { en: 'Unsafe channel', hi: 'असुरक्षित रास्ता' },
};

/**
 * weight: contribution to the 0-100 risk score when the signal fires.
 * cap:    max contribution even if the signal fires many times.
 */
const SIGNALS = [
  {
    id: 'urgency',
    family: 'pressure',
    weight: 9,
    cap: 18,
    title: { en: 'Clock pressure', hi: 'जल्दबाज़ी का दबाव' },
    why: {
      en: 'A deadline is there to stop you thinking. Real banks and government offices do not settle anything in the next 2 hours over SMS.',
      hi: 'डेडलाइन इसलिए दी जाती है ताकि आप सोच न सकें। असली बैंक या सरकारी दफ़्तर SMS पर 2 घंटे की मोहलत नहीं देते।',
    },
    patterns: [
      /\b(within|in)\s+\d+\s*(hour|hours|hrs?|minutes?|mins?|din|ghante)\b/gi,
      /\b(immediately|urgent(ly)?|right now|asap|at once)\b/gi,
      /\b(turant|abhi|abhi ke abhi|jaldi|aaj hi|kal tak)\b/gi,
      /\b(last (warning|chance|reminder)|final notice|aakhri (mauka|chetavani))\b/gi,
      /\b(will be (blocked|suspended|deactivated|closed|seized|disconnected)|band ho jayega|block ho jayega)\b/gi,
      /\b(kaat diya jayega|disconnect(ed|ion)?|cut off)\b/gi,
      /\b(expir(e|es|ing|ed)|deadline)\b/gi,
      /(तुरंत|अभी|आज ही|बंद हो जाएगा|आख़िरी चेतावनी)/g,
    ],
  },
  {
    id: 'fear',
    family: 'pressure',
    weight: 12,
    cap: 24,
    title: { en: 'Fear and threat', hi: 'डर और धमकी' },
    why: {
      en: 'Arrest, case, penalty. Fear is the product being sold. No agency announces a case to you through WhatsApp or a random number.',
      hi: 'गिरफ़्तारी, केस, जुर्माना — डर ही उनका असली हथियार है। कोई भी एजेंसी WhatsApp या अनजान नंबर से केस की सूचना नहीं देती।',
    },
    patterns: [
      /\b(arrest(ed)?|warrant|fir\b|legal action|court case|non[- ]bailable)\b/gi,
      /\b(penalt(y|ies)|fine|jurmana|case darj|giraftar)\b/gi,
      /\b(money laundering|drugs? (parcel|consignment)|illegal (content|activity))\b/gi,
      /(गिरफ़्तार|गिरफ्तार|वारंट|मुकदमा|जुर्माना)/g,
    ],
  },
  {
    id: 'authority',
    family: 'authority',
    weight: 10,
    cap: 20,
    title: { en: 'Borrowed uniform', hi: 'उधार की वर्दी' },
    why: {
      en: 'Naming a big institution costs the sender nothing. Anyone can type RBI. Verify by calling the number printed on your own card or the official site — never a number inside the message.',
      hi: 'बड़ी संस्था का नाम लिखना मुफ़्त है — कोई भी "RBI" टाइप कर सकता है। जाँच हमेशा अपने कार्ड पर छपे नंबर या आधिकारिक वेबसाइट से करें, मैसेज में दिए नंबर से कभी नहीं।',
    },
    patterns: [
      /\b(rbi|reserve bank|income[- ]?tax|it department|cbi|ed\b|enforcement directorate|narcotics|ncb)\b/gi,
      /\b(cyber (cell|crime)|police|customs|trai|sebi|uidai|epfo|supreme court|high court)\b/gi,
      /\b(aadhaar|adhaar|pan card|kyc)\b/gi,
      /\b(bank (manager|officer|official)|from (sbi|hdfc|icici|axis|kotak|pnb|boi|canara))\b/gi,
      /\b(electricity (board|officer|department)|discom|bijli vibhag|gas agency|postal department)\b/gi,
      /(आरबीआई|आयकर|पुलिस|साइबर सेल|आधार|बिजली विभाग)/g,
    ],
  },
  {
    id: 'impersonal',
    family: 'authority',
    weight: 5,
    cap: 5,
    title: { en: 'Does not know who you are', hi: 'आपका नाम तक नहीं पता' },
    why: {
      en: 'Your bank knows your name and the last four digits of your account. A blast message opens with "Dear Customer" because it went to a hundred thousand people.',
      hi: 'आपका बैंक आपका नाम और खाते के आख़िरी चार अंक जानता है। "Dear Customer" इसलिए लिखा है क्योंकि यही मैसेज लाखों लोगों को गया है।',
    },
    patterns: [
      /\b(dear (customer|user|sir\/madam|member|subscriber)|priya grahak)\b/gi,
      /(प्रिय ग्राहक)/g,
    ],
  },
  {
    id: 'secrecy',
    family: 'secrecy',
    weight: 16,
    cap: 26,
    title: { en: 'Cut you off from help', hi: 'मदद से काट देना' },
    why: {
      en: 'This is the single clearest tell. Every genuine process survives you telling your family or walking into a branch. Only a scam needs you alone and on the line.',
      hi: 'यह सबसे पक्का सबूत है। हर असली प्रक्रिया इस बात से नहीं टूटती कि आपने घरवालों को बता दिया या ब्रांच चले गए। सिर्फ़ ठगी को आपका अकेला रहना चाहिए।',
    },
    patterns: [
      /\b(do ?n[o']?t (tell|inform|share with) (any ?one|your family|anybody))\b/gi,
      /\b(kisi ko (mat|na) (batao|bataye|bataiye)|ghar mein mat batana)\b/gi,
      /\b(keep (this )?confidential|strictly confidential|between us|confidential investigation)\b/gi,
      /\b(batane ki (zarurat|zaroorat) nahi|bina kisi ko bataye|ghar (mein|me) mat batana)\b/gi,
      /\b(digital arrest|stay on (the )?(call|line)|do ?n[o']?t (disconnect|cut|hang up))\b/gi,
      /\b(camera (on|chalu)|video call (mandatory|zaroori)|24x7 surveillance)\b/gi,
      /(किसी को मत बताना|गोपनीय|कॉल मत काटना)/g,
    ],
  },
  {
    id: 'credentials',
    family: 'extraction',
    weight: 22,
    cap: 30,
    title: { en: 'Asking for your keys', hi: 'आपकी चाबी माँग रहे हैं' },
    why: {
      en: 'OTP, PIN, CVV and passwords are never collected by staff — not by your bank, not by the police, not by a delivery agent. An OTP request is the end of the conversation.',
      hi: 'OTP, PIN, CVV या पासवर्ड कोई कर्मचारी कभी नहीं माँगता — न बैंक, न पुलिस, न डिलीवरी वाला। OTP माँगते ही बात ख़त्म कर दीजिए।',
    },
    // A bank alert mentions the OTP too. What separates a scam is the ask,
    // so the verb has to be there and it must not be a negation.
    negated: /\b(never|do ?n[o']?t|don't|not|kabhi|mat|nahi)\s*$/i,
    patterns: [
      /\b(share|send|tell|give|provide|confirm|forward|read out)\b[^.\n]{0,28}\b(o\.?t\.?p\.?|one[- ]time password|pin|cvv|password|code)\b/gi,
      /\b(o\.?t\.?p\.?|pin|cvv|password)\b[^.\n]{0,22}\b(bata(o|iye|ye)|bhej(o|iye| na)|share kar|send kar)\b/gi,
      /\b(enter|verify|update)\s+(your\s+)?(atm pin|upi pin|mpin|m-pin|cvv|card number|net ?banking password|login (id|password))\b/gi,
      /\b(card number and (cvv|expiry)|full card details)\b/gi,
      /(ओटीपी|पिन|पासवर्ड)[^।\n]{0,22}(बताइए|बताओ|भेज|शेयर)/g,
    ],
  },
  {
    id: 'money',
    family: 'extraction',
    weight: 14,
    cap: 24,
    title: { en: 'Pay first, get later', hi: 'पहले पैसे, बाद में वादा' },
    why: {
      en: 'Advance fee is the oldest shape of fraud: a small payment to unlock a big promise. Refunds, prizes and jobs never require you to send money first.',
      hi: 'पहले फ़ीस लेकर बड़ा वादा करना ठगी का सबसे पुराना तरीक़ा है। रिफ़ंड, इनाम या नौकरी के लिए आपसे पहले पैसे कभी नहीं माँगे जाते।',
    },
    patterns: [
      /\b(processing|registration|clearance|customs|security|verification|convenience|refundable) (fee|charge|charges|amount|deposit)\b/gi,
      /\b(pay|transfer|deposit|send|remit) (only )?(rs\.?|inr|₹)\s?[\d,]+/gi,
      /\b(scan (the )?qr|qr code|upi id\b|[a-z0-9.\-_]+@(oksbi|okaxis|okhdfcbank|okicici|paytm|ybl|upi)\b)/gi,
      /\b(paise|amount|payment)\s*(bhej|jama|transfer)/gi,
      /(शुल्क|फ़ीस|जमा कर|भेज दीजिए)/g,
    ],
  },
  {
    id: 'prize',
    family: 'extraction',
    weight: 16,
    cap: 30,
    title: { en: 'Unearned reward', hi: 'बिना वजह का इनाम' },
    why: {
      en: 'You did not enter, so you did not win. A lottery you never bought a ticket for is a payment request wearing a party hat.',
      hi: 'आपने हिस्सा ही नहीं लिया, तो जीते कैसे? जिस लॉटरी का टिकट ही नहीं ख़रीदा, वह असल में पैसे माँगने का बहाना है।',
    },
    patterns: [
      /\b(you (have )?won|congratulations|lucky (winner|draw)|lottery|jackpot|bumper (prize|offer))\b/gi,
      /\b(kbc|kaun banega|lucky customer|selected (winner|for))\b/gi,
      /\b(free (gift|recharge|iphone|laptop)|claim your (prize|reward|gift))\b/gi,
      /\b\d+(\.\d+)?\s?(lakh|crore|lac)\b/gi,
      /(बधाई|इनाम|लॉटरी|जीत)/g,
    ],
  },
  {
    id: 'jobscam',
    family: 'extraction',
    weight: 14,
    cap: 30,
    title: { en: 'Too-easy income', hi: 'बहुत आसान कमाई' },
    why: {
      en: 'Like videos, rate hotels, earn thousands daily. The early tasks really do pay — that is the bait. The loss comes when you are asked to top up for a bigger task.',
      hi: 'वीडियो लाइक करो, होटल रेट करो, रोज़ हज़ारों कमाओ। शुरू के टास्क में पैसे सच में मिलते हैं — वही चारा है। नुक़सान तब होता है जब बड़े टास्क के लिए पैसे डलवाए जाते हैं।',
    },
    patterns: [
      /\b(part[- ]?time job|work from home|daily (income|earning|payout)|earn \d+)\b/gi,
      /\b(like (and|&) earn|rating task|prepaid task|refer and earn scheme)\b/gi,
      /\b(no (experience|investment) (required|needed)|ghar baithe kamao)\b/gi,
      /\b(join (our )?telegram|whatsapp group (join|link))\b/gi,
      /(घर बैठे कमाओ|रोज़ कमाई)/g,
    ],
  },
  {
    id: 'giftcard',
    family: 'extraction',
    weight: 16,
    cap: 20,
    title: { en: 'Gift cards instead of money', hi: 'पैसों की जगह गिफ़्ट कार्ड' },
    why: {
      en: 'Gift card codes cannot be reversed or traced, which is exactly why fraudsters ask for them. No employer, office or agency settles anything in vouchers.',
      hi: 'गिफ़्ट कार्ड का कोड न वापस होता है, न ट्रेस — ठग इसीलिए यही माँगते हैं। कोई ऑफ़िस या एजेंसी वाउचर से लेन-देन नहीं करती।',
    },
    patterns: [
      /\b(gift ?cards?|amazon voucher|google play code|steam card|itunes card)\b/gi,
      /\b(send (me )?the (codes?|voucher))\b/gi,
    ],
  },
  {
    id: 'wrongnumber',
    family: 'secrecy',
    weight: 14,
    cap: 14,
    title: { en: 'The accidental hello', hi: '"ग़लत नंबर" वाली शुरुआत' },
    why: {
      en: 'A stranger opens with a wrong number and stays to chat. This is the first page of the investment-romance script: friendship first, a trading app two weeks later.',
      hi: 'अजनबी "ग़लत नंबर" कहकर बात जारी रखता है। यह इन्वेस्टमेंट-रोमांस स्क्रिप्ट का पहला पन्ना है — पहले दोस्ती, दो हफ़्ते बाद ट्रेडिंग ऐप।',
    },
    patterns: [
      /\b(wrong number|galat number|sorry to disturb|maaf kijiye galat)\b/gi,
      /\b(kya aap kya karte ho|are you free to chat|new friend)\b/gi,
    ],
  },
  {
    id: 'investment',
    family: 'extraction',
    weight: 14,
    cap: 20,
    title: { en: 'Returns nobody can promise', hi: 'ऐसा मुनाफ़ा जो कोई नहीं दे सकता' },
    why: {
      en: 'Guaranteed profit, a private tip group, a trading app you have never heard of. The early withdrawals work; the large one never does.',
      hi: 'गारंटीड मुनाफ़ा, प्राइवेट टिप ग्रुप, अनजाना ट्रेडिंग ऐप। शुरू में निकासी चलती है, बड़ी रक़म कभी नहीं निकलती।',
    },
    patterns: [
      /\b(crypto|forex|trading) (tips?|group|signals?|profit|karti? hu|kar raha)\b/gi,
      /\b(guaranteed (returns?|profit)|double your money|fixed daily profit|achha profit)\b/gi,
      /\b(investment (plan|opportunity|app)|stock tips)\b/gi,
    ],
  },
  {
    id: 'remote',
    family: 'channel',
    weight: 20,
    cap: 26,
    title: { en: 'Handing over your screen', hi: 'आपकी स्क्रीन उनके हाथ' },
    why: {
      en: 'Screen sharing and remote apps let a stranger watch you type your PIN and operate your phone. No support team needs this to fix a payment.',
      hi: 'स्क्रीन शेयर या रिमोट ऐप से अजनबी आपका PIN टाइप होते देख सकता है और फ़ोन चला सकता है। पेमेंट ठीक करने के लिए किसी सपोर्ट टीम को इसकी ज़रूरत नहीं होती।',
    },
    patterns: [
      /\b(anydesk|teamviewer|quick ?support|screen ?(share|sharing)|remote (access|control))\b/gi,
      /\b((install|download) (this|the|our) ?app|download (the )?apk|\.apk\b|sideload)\b/gi,
      /(स्क्रीन शेयर|ऐप इंस्टॉल)/g,
    ],
  },
  {
    id: 'shortlink',
    family: 'channel',
    weight: 15,
    cap: 22,
    title: { en: 'Hidden destination', hi: 'छिपा हुआ पता' },
    why: {
      en: 'A shortened link hides where it actually goes, so you cannot check the domain before you tap. Official notices link to their own full domain.',
      hi: 'शॉर्ट लिंक असली पता छिपा देता है, इसलिए टैप करने से पहले आप डोमेन जाँच ही नहीं सकते। असली सूचना हमेशा अपने पूरे डोमेन पर ले जाती है।',
    },
    patterns: [
      /\b(bit\.ly|tinyurl\.com|t\.me|cutt\.ly|rb\.gy|is\.gd|shorturl|ow\.ly|rebrand\.ly|linktr\.ee)\S*/gi,
    ],
  },
  {
    id: 'lookalike',
    family: 'channel',
    weight: 18,
    cap: 24,
    title: { en: 'Lookalike web address', hi: 'नक़ली मिलता-जुलता पता' },
    why: {
      en: 'The brand name sits in the wrong place — in a cheap domain, a subdomain or a hyphenated copy. Read a link right to left: the part just before the first single slash is the real owner.',
      hi: 'ब्रांड का नाम ग़लत जगह लगा है — सस्ते डोमेन, सबडोमेन या हाइफ़न वाली नक़ल में। लिंक को दाएँ से बाएँ पढ़िए: पहले स्लैश से ठीक पहले वाला हिस्सा ही असली मालिक है।',
    },
    patterns: [
      /\bhttps?:\/\/[^\s]*\.(xyz|top|buzz|click|icu|link|cfd|rest|online|shop|monster|work)\b\S*/gi,
      /\bhttps?:\/\/[^\s]*(sbi|hdfc|icici|axis|kotak|paytm|phonepe|npci|upi|irctc|indiapost|epfo)[^\s]*\.(?!gov\.in|nic\.in|co\.in\b)[a-z]{2,}\S*/gi,
      /\bhttp:\/\/(?!localhost)\S+/gi,
      /\b[a-z0-9-]*(sbi|hdfc|icici|axis|paytm|phonepe|irctc)[a-z0-9-]*-(kyc|verify|update|login|secure|refund)[a-z0-9-]*\.\S+/gi,
    ],
  },
  {
    id: 'shouting',
    family: 'pressure',
    weight: 4,
    cap: 8,
    title: { en: 'Shouting and broken tone', hi: 'चीख़ता हुआ लहजा' },
    why: {
      en: 'Blast messages are written fast and in bulk: stray capitals, stacked exclamation marks, odd spacing. Institutions send edited text.',
      hi: 'थोक में भेजे मैसेज जल्दबाज़ी में लिखे जाते हैं — बेतरतीब कैपिटल, कई विस्मयादिबोधक चिह्न, अजीब स्पेसिंग। संस्थाएँ जाँचा हुआ टेक्स्ट भेजती हैं।',
    },
    patterns: [
      /\b[A-Z]{7,}\b/g,
      /[!]{2,}/g,
      /[*]{2,}\s*[A-Za-z]/g,
    ],
  },
];

/** Phrases that genuinely point the other way. */
const COUNTER_SIGNALS = [
  {
    id: 'self-warning',
    delta: -18,
    title: { en: 'Carries the standard warning', hi: 'मानक चेतावनी मौजूद है' },
    why: {
      en: 'Real bank alerts tell you never to share the OTP and ask for nothing back.',
      hi: 'असली बैंक अलर्ट में लिखा होता है कि OTP किसी को न बताएँ, और बदले में कुछ नहीं माँगा जाता।',
    },
    patterns: [
      /\b(never share (this |your )?(otp|pin|code|password))\b/gi,
      /\b(do ?n[o']?t share (this |your )?(otp|pin|password)( with any ?one)?)\b/gi,
      /\b(we never ask for (your )?(otp|pin|password)|bank never asks)\b/gi,
      /\b(ओटीपी किसी को न बताएँ|किसी को ओटीपी न बताएं)\b/g,
    ],
  },
  {
    id: 'no-ask',
    delta: -10,
    title: { en: 'Asks you for nothing', hi: 'आपसे कुछ माँगा नहीं गया' },
    why: {
      en: 'The message only informs. There is no link, no number to call back and no payment request.',
      hi: 'मैसेज सिर्फ़ सूचना देता है — न लिंक, न कॉल-बैक नंबर, न पैसे की माँग।',
    },
    // handled programmatically
    patterns: [],
  },
];

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
const PHONE_RE = /\b(?:\+?91[- ]?)?[6-9]\d{9}\b/g;

function collectMatches(text, patterns) {
  const hits = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].trim().length === 0) {
        re.lastIndex += 1;
        continue;
      }
      hits.push({ text: m[0], start: m.index, end: m.index + m[0].length });
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return hits;
}

/** Longest-first, non-overlapping spans, sorted by position. */
function mergeSpans(spans) {
  const sorted = [...spans].sort((a, b) => (b.end - b.start) - (a.end - a.start));
  const kept = [];
  for (const s of sorted) {
    if (!kept.some((k) => s.start < k.end && k.start < s.end)) kept.push(s);
  }
  return kept.sort((a, b) => a.start - b.start);
}

/**
 * @param {string} raw
 * @returns {{score:number, verdict:string, findings:Array, credits:Array, spans:Array, stats:Object}}
 */
export function analyse(raw) {
  const text = (raw || '').trim();
  const findings = [];
  const credits = [];
  const spans = [];
  let score = 0;

  if (text.length < 8) {
    return { score: 0, verdict: 'empty', findings, credits, spans: [], stats: {} };
  }

  for (const sig of SIGNALS) {
    let hits = collectMatches(text, sig.patterns);
    if (sig.negated) {
      // "Never share your OTP" is advice, not a request.
      hits = hits.filter((h) => !sig.negated.test(text.slice(Math.max(0, h.start - 20), h.start)));
    }
    if (hits.length === 0) continue;
    const unique = [...new Set(hits.map((h) => h.text.toLowerCase()))];
    const points = Math.min(sig.cap, sig.weight * Math.min(unique.length, 3));
    score += points;
    findings.push({
      id: sig.id,
      family: sig.family,
      title: sig.title,
      why: sig.why,
      points,
      evidence: unique.slice(0, 4),
    });
    hits.forEach((h) => spans.push({ ...h, family: sig.family, signal: sig.id }));
  }

  const urls = collectMatches(text, [URL_RE]);
  const phones = collectMatches(text, [PHONE_RE]);

  // A personal 10-digit mobile as the callback route. Toll-free 1800 numbers
  // and short codes do not match the pattern, so a real bank alert is safe.
  if (phones.length > 0) {
    score += 10;
    findings.push({
      id: 'callback',
      family: 'channel',
      title: { en: 'Answers on a personal mobile', hi: 'जवाब निजी मोबाइल पर' },
      why: {
        en: 'A personal mobile number inside an official-sounding request deserves extra verification. It is not proof of fraud by itself, so Rakshak treats it as one signal rather than a verdict.',
        hi: 'आधिकारिक लगने वाली माँग में निजी मोबाइल नंबर दिखे तो अतिरिक्त पुष्टि करें। यह अकेले ठगी का सबूत नहीं है, इसलिए Rakshak इसे सिर्फ़ एक संकेत मानता है।',
      },
      points: 10,
      evidence: [...new Set(phones.map((p) => p.text))].slice(0, 2),
    });
    phones.forEach((p) => spans.push({ ...p, family: 'channel', signal: 'callback' }));
  }

  for (const cs of COUNTER_SIGNALS) {
    let fired = false;
    if (cs.id === 'no-ask') {
      const asks = findings.some((f) => f.family === 'extraction' || f.family === 'channel');
      fired = urls.length === 0 && phones.length === 0 && !asks && score > 0;
    } else {
      fired = collectMatches(text, cs.patterns).length > 0;
    }
    if (fired) {
      score += cs.delta;
      credits.push({ id: cs.id, title: cs.title, why: cs.why, points: cs.delta });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 55 ? 'scam' : score >= 25 ? 'suspicious' : 'safe';

  findings.sort((a, b) => b.points - a.points);

  return {
    score,
    verdict,
    findings,
    credits,
    spans: mergeSpans(spans),
    stats: {
      words: text.split(/\s+/).length,
      links: urls.length,
      phones: phones.length,
    },
  };
}

/** What the reader should physically do next, tuned to what fired. */
export function nextSteps(result) {
  const ids = new Set(result.findings.map((f) => f.id));
  const steps = [];

  if (result.verdict === 'safe') {
    return [
      { en: 'Nothing alarming here. Still, open apps from your home screen, not from a message.', hi: 'यहाँ चिंता की बात नहीं दिखी। फिर भी ऐप हमेशा होम स्क्रीन से खोलें, मैसेज के लिंक से नहीं।' },
    ];
  }

  steps.push({
    en: 'Do not reply and do not call the number in the message.',
    hi: 'जवाब न दें और मैसेज में दिए नंबर पर कॉल न करें।',
  });

  if (ids.has('credentials')) {
    steps.push({
      en: 'If you already shared an OTP or PIN, call your bank now and block the card, then change the password.',
      hi: 'अगर OTP या PIN बता चुके हैं तो अभी बैंक को कॉल करके कार्ड ब्लॉक कराएँ और पासवर्ड बदलें।',
    });
  }
  if (ids.has('money') || ids.has('prize') || ids.has('jobscam')) {
    steps.push({
      en: 'If money has left your account, report it promptly at cybercrime.gov.in or call 1930 so the official response can start as soon as possible.',
      hi: 'अगर पैसे कट चुके हैं तो पहले एक घंटे के अंदर cybercrime.gov.in पर या 1930 पर शिकायत करें — इसी दौरान रक़म रुकवाई जा सकती है।',
    });
  }
  if (ids.has('remote')) {
    steps.push({
      en: 'Uninstall any app they made you install, disconnect that device from the internet, and check your bank/email accounts from a trusted device.',
      hi: 'उनके कहने पर इंस्टॉल किया ऐप हटाएँ, इंटरनेट से डिस्कनेक्ट करें, और बैंक/ईमेल खातों की जाँच किसी भरोसेमंद डिवाइस से करें।',
    });
  }
  if (ids.has('secrecy') || ids.has('fear')) {
    steps.push({
      en: 'Tell one person in your family right now. Scripts like this only work on someone who stays alone with them.',
      hi: 'घर के किसी एक इंसान को अभी बताएँ। ऐसी स्क्रिप्ट सिर्फ़ अकेले इंसान पर चलती है।',
    });
  }

  steps.push({
    en: 'Verify with the real organisation using the number on your card, passbook or their official website.',
    hi: 'असली संस्था से अपने कार्ड, पासबुक या उनकी आधिकारिक वेबसाइट पर दिए नंबर से पुष्टि करें।',
  });

  return steps.slice(0, 4);
}
