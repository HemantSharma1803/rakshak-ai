import assert from 'node:assert/strict';
import { analyse } from '../assets/js/engine.js';

const scam = analyse('Your KYC will be blocked today. Share the OTP immediately and pay a processing fee at https://sbi-kyc-verify.xyz/update. Do not tell anyone.');
assert.ok(scam.score >= 55);
assert.equal(scam.verdict, 'scam');
assert.ok(scam.findings.length >= 3);

const safe = analyse('Your monthly statement is ready. Open your bank app directly to view it. If you did not request this, call the number on your card.');
assert.equal(safe.verdict, 'safe');

console.log('Rakshak engine smoke tests passed');
