// test-consent-stamp.mjs — W2 consent-stempel i payload.meta (kontrakt-frys-sikkert)
//
// Verificerer at klient-samtykke-valget lander i payload.meta.consent (klartekst
// INDE i ciphertext — serveren ser det aldrig, jf. core.js:390). Additivt:
// fravær af consent => meta uden consent-felt (bagudkompatibelt, Swift ignorerer
// ukendte felter). Kontrakt FROSSET: ingen ny route/felt ud over meta-stemplet.
//
// Kør: node test-consent-stamp.mjs   (exit 0 = grøn)

import { buildPayloadCSD } from './mentem-skema-core.js';

let pass = 0, fail = 0;
const ok  = (m) => { console.log('  ✅ ' + m); pass++; };
const bad = (m) => { console.log('  ❌ ' + m); fail++; };

const entries = [{ date: '2026-06-08', quality: 3 }];

// T1: consent leveret => meta.consent == {optIn, timestamp}
(() => {
  const consent = { optIn: true, timestamp: '2026-06-08T06:30:00Z' };
  const p = buildPayloadCSD(entries, { name: 'SYN', consent });
  if (p.meta && p.meta.consent && p.meta.consent.optIn === true
      && p.meta.consent.timestamp === '2026-06-08T06:30:00Z') {
    ok('consent-stempel i payload.meta.consent (optIn=true)');
  } else {
    bad('consent mangler/forkert: ' + JSON.stringify(p.meta && p.meta.consent));
  }
})();

// T2: klient-NEJ stemples lige så troværdigt (autonomi: NEJ skal kunne nå Mentem)
(() => {
  const p = buildPayloadCSD(entries, { consent: { optIn: false, timestamp: '2026-06-08T06:31:00Z' } });
  if (p.meta && p.meta.consent && p.meta.consent.optIn === false) ok('klient-NEJ stemples (optIn=false)');
  else bad('NEJ ikke stemplet: ' + JSON.stringify(p.meta && p.meta.consent));
})();

// T3: ingen consent => intet consent-felt (bagudkompatibelt / frys-sikkert)
(() => {
  const p = buildPayloadCSD(entries, { name: 'SYN' });
  if (p.meta && !('consent' in p.meta)) ok('intet consent-felt uden samtykke (additivt)');
  else bad('consent-felt uventet til stede: ' + JSON.stringify(p.meta.consent));
})();

// T4: kontrakt-invariant — meta-blokken beholder de eksisterende kerne-felter
(() => {
  const p = buildPayloadCSD(entries, { consent: { optIn: true, timestamp: 'x' } });
  const need = ['schemaVersion', 'instrument', 'protocolVersion', 'forloebId'];
  const missing = need.filter((k) => !(k in p.meta));
  if (missing.length === 0) ok('eksisterende meta-kontrakt-felter urørt');
  else bad('manglende kontrakt-felter: ' + missing.join(','));
})();

console.log(`\n════ ${pass} passed, ${fail} failed ════`);
process.exit(fail === 0 ? 0 : 1);
