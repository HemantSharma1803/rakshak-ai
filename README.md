# Rakshak 🛡️

**Personal Scam Intelligence & Protection Platform** — an explainable, local-first prototype that helps people understand suspicious messages before they act.

## What it does
- **Threat Analyzer:** SMS, WhatsApp, email and call-transcript style inputs.
- **Explainable risk report:** risk score, verdict, attack intent, evidence and manipulation chain.
- **Evidence map:** highlights pressure, authority, secrecy, extraction and channel signals.
- **Response playbook:** turns detection into concrete next actions.
- **URL Intelligence:** inspects URL structure without opening the destination.
- **Dashboard:** local scan history, risk metrics and signal profile.
- **Scam Lab:** interactive practice scenarios for scam-awareness training.
- **Family Protection:** generates a simple warning message for sharing.
- **Incident Report:** creates a local, copyable incident summary.
- **Privacy Center:** explains the local-first data flow and provides a one-click local-data wipe.
- **Hindi / English / Hinglish-oriented detection corpus** in the explainable engine.

## Privacy architecture
The prototype is a static browser application. There is no required account, backend database, analytics SDK or API key. Message analysis is performed in the browser. Suspicious URLs are analyzed as text and are **not automatically opened**.

> This is a prototype, not a substitute for an official bank, police, cybercrime or security service. Heuristic detection can miss novel scams and can produce false positives.

## Run locally
Because the app uses ES modules, serve the folder with any static server (for example VS Code Live Server) and open `index.html` through that server.

## GitHub Pages
The repository includes `.github/workflows/deploy.yml`. Set GitHub Pages **Source** to **GitHub Actions**, then push to `main`.

## Project structure
```text
assets/js/engine.js       # explainable detection engine
assets/js/app.js          # product UI + local workflows
assets/css/rakshak.css    # responsive design system
.github/workflows/        # GitHub Pages deployment
404.html                  # SPA fallback
```
