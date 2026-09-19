# Rakshak 🛡️

**Understand the message before you act.**

Rakshak is a private, browser-only scam-message explainer for SMS and WhatsApp text. Instead of returning a mysterious "scam / not scam" label, it highlights the words creating pressure, borrowing authority, demanding secrecy, asking for money or credentials, or moving you to an unsafe channel — then gives a short next-action checklist.

> **No account. No backend. No API key. No message upload.**

## Live demo

After GitHub Pages is enabled, the project is available at:

`https://<your-username>.github.io/<repository-name>/`

## 30-second demo story

Paste a suspicious SMS or WhatsApp message → Rakshak highlights the exact phrases that matter → groups the signals → explains what the sender is trying to make you do → gives the safest next action.

**The product thesis:** scam detection should be explainable enough that a user can show the evidence to a parent, friend or teammate instead of asking them to trust a mysterious score.

## Why Rakshak

Fraud messages are often persuasive because of the **script**, not because the victim is careless:

**Pressure → authority → secrecy → extraction → unsafe channel**

Rakshak makes those moves visible in the original text. That makes the result easier to question, explain to a family member, and act on.

## Core features

- 🔎 **Explainable message analysis** — risk score from 0–100 with named signals.
- 🖍️ **Evidence highlighting** — exact phrases that triggered a signal are marked in the message.
- 🇮🇳 **English + Hindi + Hinglish** — detection patterns include common Indian scam language.
- 🧠 **No black-box dependency** — deterministic rules make the result inspectable and testable.
- 🔗 **Link awareness** — identifies shortened/lookalike-style links without opening them.
- 🛡️ **Action-first guidance** — OTP/PIN, money-loss, remote-access, secrecy and verification steps are handled differently.
- 👨‍👩‍👧 **Family warning** — copy or share a short warning with the important signals.
- 🖼️ **Warning card** — generate a shareable PNG locally in the browser.
- 🎯 **Practice mode** — a mixed set of genuine notifications and scams teaches pattern recognition.
- 🔒 **Privacy by architecture** — analysis happens locally in the browser; there is no app server, database, analytics layer or login. Message text is not intentionally persisted.
- 📱 **Responsive UI** — designed for desktop and mobile screens.

## Detection signals

| Family | Examples |
|---|---|
| Pressure | urgent deadlines, threats, account blocking, arrest language |
| Authority | bank/government impersonation, KYC, police, tax, RBI-style claims |
| Secrecy | "don't tell anyone", stay on the call, digital-arrest patterns |
| Extraction | OTP/PIN/CVV/password, fees, prizes, jobs, investment bait |
| Channel | personal callback numbers, remote-access apps, shortened links, lookalike domains |
| Counter-signals | standard "never share your OTP" warnings and messages that make no risky ask |

### Important design choice: false-positive resistance

A real bank OTP alert can contain the word **OTP**. Rakshak therefore looks for the *request* to share or enter the credential, not the word alone. The test suite also includes genuine notifications so the engine is checked in both directions.

## Privacy model

Rakshak is a static site. The repository contains no API key and no server endpoint for message analysis. Pasted text is processed by JavaScript in the current browser tab. The app does not intentionally store scan history, create an account, or send message content to a service.

This does **not** mean the tool can prove a sender is genuine. A clean result is only an absence of the signals Rakshak knows about. For money or account issues, verify using a phone number, app or website you already trust — not the contact details supplied by the suspicious message.

## Emergency reporting in India

If money has already been lost to a cyber financial fraud, use the official reporting route at **[cybercrime.gov.in](https://www.cybercrime.gov.in/)** or call **1930**. Do not wait for Rakshak to finish an analysis before reporting a real loss.

## Run locally

No npm install or build tool is required.

```bash
git clone https://github.com/<your-username>/<repository-name>.git
cd <repository-name>
python -m http.server 8000
```

Open `http://localhost:8000`.

ES modules should be served over HTTP rather than opening `index.html` directly with `file://`.

## Test the engine

Node's built-in test runner is enough:

```bash
node --test tests/engine.test.mjs
```

The test suite covers empty input, digital-arrest patterns, genuine bank alerts, lookalike links, evidence availability, non-overlapping highlights, balanced practice content, scam/genuine classification, and credential-specific advice.

## GitHub Pages deployment

The repository includes `.github/workflows/deploy.yml`.

The workflow:

1. Runs the detection-engine tests on every push to `main`.
2. Stops the deployment if the tests fail.
3. Uploads the static repository as a Pages artifact.
4. Deploys it to GitHub Pages.
5. Supports manual runs from the **Actions** tab.

One-time GitHub setting:

**Repository → Settings → Pages → Build and deployment → Source → GitHub Actions**

GitHub Pages is a static host, so this project deliberately avoids server-side dependencies.

## Repository structure

```text
.
├── .github/workflows/deploy.yml
├── assets/
│   ├── css/rakshak.css
│   └── js/
│       ├── app.js
│       ├── corpus.js
│       └── engine.js
├── tests/engine.test.mjs
├── .nojekyll
├── index.html
├── LICENSE
└── README.md
```

## Tech

- HTML5
- Modern CSS
- Vanilla JavaScript ES modules
- Node built-in test runner
- GitHub Actions + GitHub Pages
- Canvas API for local warning-card generation

No framework or runtime backend is required.

## What Rakshak deliberately does not do

- It does not open suspicious links.
- It does not claim that a clean result proves legitimacy.
- It does not ask users to upload private messages to a cloud model.
- It does not replace the bank, police, cybercrime portal, or an official verification channel.

## Limitations

Rakshak reads the text supplied to it. It does not verify a person's identity, authenticate a bank, open a link to inspect its destination, or guarantee that a message is safe. Scam language changes, so the rule set will never catch every fraud.

The right mental model is:

> **Rakshak is a second pair of eyes — not a replacement for independent verification.**

## License

MIT.
