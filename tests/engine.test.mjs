import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse, nextSteps } from '../assets/js/engine.js';
import { DRILL, SAMPLES } from '../assets/js/corpus.js';

test('empty input is not scored', () => {
  assert.equal(analyse('').verdict, 'empty');
  assert.equal(analyse('hi').verdict, 'empty');
});

test('the digital arrest script scores as a scam', () => {
  const r = analyse(SAMPLES.find((s) => s.label === 'Digital arrest call').text);
  assert.equal(r.verdict, 'scam');
  const ids = r.findings.map((f) => f.id);
  assert.ok(ids.includes('secrecy'), 'secrecy must fire');
  assert.ok(ids.includes('fear'), 'fear must fire');
  assert.ok(ids.includes('money'), 'payment ask must fire');
});

test('a genuine bank debit alert is not flagged', () => {
  const r = analyse(SAMPLES.find((s) => s.label === 'Real bank alert').text);
  assert.notEqual(r.verdict, 'scam');
  assert.ok(r.credits.some((c) => c.id === 'self-warning'));
});

test('lookalike KYC link is caught', () => {
  const r = analyse(SAMPLES.find((s) => s.label === 'KYC expiry').text);
  assert.equal(r.verdict, 'scam');
  assert.ok(r.findings.some((f) => f.id === 'lookalike' || f.id === 'shortlink'));
});

test('every finding carries evidence the user can see', () => {
  for (const s of SAMPLES) {
    for (const f of analyse(s.text).findings) {
      assert.ok(f.evidence.length > 0, `${f.id} fired without evidence`);
      assert.ok(f.why.en && f.why.hi, `${f.id} is missing an explanation`);
    }
  }
});

test('highlight spans never overlap', () => {
  for (const s of SAMPLES) {
    const spans = analyse(s.text).spans;
    for (let i = 1; i < spans.length; i++) {
      assert.ok(spans[i].start >= spans[i - 1].end, 'overlapping span would break the markup');
    }
  }
});

test('the practice bank keeps scam and genuine messages balanced', () => {
  const scams = DRILL.filter((d) => d.scam).length;
  assert.ok(scams >= 4 && scams <= DRILL.length - 4, 'drill must not be guessable by always answering one way');
});

test('no genuine message is called a scam, and no scam is called clean', () => {
  for (const item of DRILL) {
    const { verdict, score } = analyse(item.text);
    if (item.scam) {
      assert.notEqual(verdict, 'safe', `missed a scam (${score}): ${item.text.slice(0, 48)}`);
    } else {
      assert.equal(verdict, 'safe', `false alarm (${score}): ${item.text.slice(0, 48)}`);
    }
  }
});

test('advice is specific when credentials are requested', () => {
  const r = analyse('Sir please share the OTP received on your phone to verify your account immediately.');
  const steps = nextSteps(r).map((s) => s.en).join(' ');
  assert.match(steps, /block the card/);
});
