// Smoke test for the built app (index.html), run in jsdom. Usage: node tests/smoke.js [path-to-index.html]
// Needs jsdom (npm install --no-save jsdom). Exits 1 if any check fails.
const {JSDOM, VirtualConsole} = require('jsdom');
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
let failed = 0;
const ok = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failed++; };

function load(narrow) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errs.push(e.message));
  vc.on('error', e => errs.push(String(e)));
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1:8000/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {   // jsdom has no layout: stub what the page asks the browser for
      w.matchMedia = q => ({matches: narrow && /max-width:860/.test(q), addEventListener() {}, removeEventListener() {}});
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.scrollTo = () => {};
    },
  });
  return {d: dom.window.document, errs};
}

for (const narrow of [false, true]) {
  console.log('== ' + (narrow ? 'narrow' : 'wide') + ' viewport');
  const {d, errs} = load(narrow);
  ok('no script errors ' + errs.join(' | '), errs.length === 0);
  ok('skip link has text and targets #main', d.getElementById('ab-skip').textContent.length > 3 && d.getElementById('main') !== null);
  ok('salary chart is a group with hidden bars', d.querySelector('.sal').getAttribute('role') === 'group' && d.querySelector('.sal .track').getAttribute('aria-hidden') === 'true');
  ok('contents list collapsed only on narrow screens', d.querySelector('nav.toc details').open === !narrow);

  // answer part of quiz 1 and part of the exam, switch language: answers must survive
  const box = d.querySelector('[data-quiz="p1"]');
  for (let i = 0; i < 2; i++) box.querySelectorAll('.card')[i].querySelector('.opt').click();
  const cards = d.querySelectorAll('#examQ .card');
  for (let i = 0; i < 3; i++) cards[i].querySelector('.opt').click();
  d.querySelector('#ab-langs button[data-l="pl"]').click();
  const box2 = d.querySelector('[data-quiz="p1"]');
  ok('part-quiz answers kept after a language switch',
    box2.querySelectorAll('.card[data-i="0"] .opt:disabled').length > 0 &&
    box2.querySelectorAll('.card[data-i="1"] .opt:disabled').length > 0 &&
    box2.querySelectorAll('.card[data-i="2"] .opt:disabled').length === 0);
  ok('exam picks kept after a language switch', d.querySelectorAll('#examQ .opt[aria-pressed="true"]').length === 3);

  // finish and grade the exam, switch again: result must stay
  d.querySelectorAll('#examQ .card').forEach(c => { if (!c.querySelector('[aria-pressed="true"]')) c.querySelector('.opt').click(); });
  d.getElementById('examSubmit').click();
  d.querySelector('#ab-langs button[data-l="es"]').click();
  ok('graded exam kept after a language switch',
    !d.getElementById('examResult').hidden && d.querySelectorAll('#examQ .opt.ok').length > 0 && d.getElementById('examSubmit').dataset.m === 'retake');

  // role modules
  d.querySelector('#rm-quizQ .card .opt').click();
  d.querySelector('#ab-langs button[data-l="en"]').click();
  ok('role-module quiz answer kept after a language switch', d.querySelectorAll('#rm-quizQ .opt:disabled').length > 0);
  ok('still no script errors ' + errs.join(' | '), errs.length === 0);
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
