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
  return {d: dom.window.document, w: dom.window, errs};
}

const SECTIONS = 36, LANGS = ['en', 'uk', 'pl', 'es'];

for (const narrow of [false, true]) {
  console.log('== ' + (narrow ? 'narrow' : 'wide') + ' viewport');
  const {d, w, errs} = load(narrow);
  const lang = l => d.querySelector(`#ab-langs button[data-l="${l}"]`).click();
  const type = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new w.Event('input', {bubbles: true})) };
  const txt = sel => [...d.querySelectorAll(sel)].map(e => e.textContent.trim());
  ok('no script errors ' + errs.join(' | '), errs.length === 0);
  ok('skip link has text and targets #main', d.getElementById('ab-skip').textContent.length > 3 && d.getElementById('main') !== null);
  ok('salary chart is a group with hidden bars', d.querySelector('.sal').getAttribute('role') === 'group' && d.querySelector('.sal .track').getAttribute('aria-hidden') === 'true');
  ok('contents list collapsed only on narrow screens', d.querySelector('nav.toc details').open === !narrow);

  // answer part of quiz 1 and part of the exam, switch language: answers must survive
  const box = d.querySelector('[data-quiz="p1"]');
  for (let i = 0; i < 2; i++) box.querySelectorAll('.card')[i].querySelector('.opt').click();
  ok('answering moves focus to the explanation (keyboard users keep their place)', d.activeElement && d.activeElement.classList.contains('a') && !d.activeElement.hidden);
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
  ok('grading the exam moves focus to the result', d.activeElement === d.getElementById('examResult'));
  d.querySelector('#ab-langs button[data-l="es"]').click();
  ok('graded exam kept after a language switch',
    !d.getElementById('examResult').hidden && d.querySelectorAll('#examQ .opt.ok').length > 0 && d.getElementById('examSubmit').dataset.m === 'retake');

  // role modules
  d.querySelector('#rm-quizQ .card .opt').click();
  ok('role-module answer moves focus to the explanation', d.activeElement && d.activeElement.classList.contains('a'));
  d.querySelector('#ab-langs button[data-l="en"]').click();
  ok('role-module quiz answer kept after a language switch', d.querySelectorAll('#rm-quizQ .opt:disabled').length > 0);
  ok('still no script errors ' + errs.join(' | '), errs.length === 0);

  // ---- pitfalls by language ----
  ok('page has ' + SECTIONS + ' sections', d.querySelectorAll('#hub-sections > section').length === SECTIONS);
  ok('every-language habits checklist has 10 items', d.querySelectorAll('ul.checks[data-lv="secure"] input').length === 10);
  d.querySelector('ul.checks[data-lv="secure"] input').click();
  lang('uk');
  ok('a ticked habit survives a language switch', d.querySelector('ul.checks[data-lv="secure"] input').checked);
  lang('en');
  ok('12 language tabs; the first is Python', d.querySelectorAll('#pitTabs button').length === 12 && d.querySelector('#pitTabs button').textContent === 'Python');
  d.querySelectorAll('#pitTabs button')[4].click();   // Go
  ok('choosing a tab shows that language and keeps focus on the tab',
    d.querySelector('#pitTabs [aria-pressed="true"]').textContent === 'Go' && /InsecureSkipVerify/.test(d.getElementById('pitPanel').textContent) && d.activeElement === d.querySelector('#pitTabs [aria-pressed="true"]'));
  d.querySelectorAll('#pitTabs button')[5].click();   // PHP has no reliability list
  ok('a language with no reliability items shows only security and tools', d.querySelectorAll('#pitPanel h4').length === 2);
  ok('six risky/safer example tabs', d.querySelectorAll('#pcTabs button').length === 6);
  d.querySelectorAll('#pcTabs button')[5].click();   // Bash
  ok('risky and safer code both shown', /rm \$file/.test(d.getElementById('pcBad').textContent) && /rm -- "\$file"/.test(d.getElementById('pcGood').textContent));
  lang('uk');
  ok('code stays English in other languages', /rm -- "\$file"/.test(d.getElementById('pcGood').textContent) && !/[а-яА-Я]/.test(d.getElementById('pcBad').textContent));
  lang('en');

  // ---- test design ----
  const bva = () => [...d.querySelectorAll('#t-bva tr')].map(r => [...r.children].map(c => c.textContent));
  ok('boundary values for 18 to 65', JSON.stringify(bva().map(r => r[0])) === '["17","18","19","64","65","66"]' && bva()[0][2] === 'Rejected' && bva()[1][2] === 'Accepted' && bva()[5][2] === 'Rejected');
  type('bvaMin', '1'); type('bvaMax', '2');
  ok('a tiny range merges equal values', JSON.stringify(bva().map(r => r[0])) === '["0","1","2","3"]' && bva()[1][1] === 'min / max − 1');
  type('bvaMin', '5'); type('bvaMax', '3');
  ok('minimum above maximum shows a message, not a table', bva().length === 0 && d.getElementById('bvaMsg').textContent.length > 10);
  type('bvaMin', '');
  ok('empty input is rejected', bva().length === 0);
  type('bvaMin', '18'); type('bvaMax', '65');
  const hit = () => [...d.querySelectorAll('#t-sev tr')].findIndex(r => r.getAttribute('aria-current') === 'true');
  type('sevI', '5'); type('sevL', '4');
  ok('impact 5 x likelihood 4 = 20 is Critical', hit() === 0 && /= 20: Critical/.test(d.getElementById('sevOut').textContent));
  type('sevI', '3'); type('sevL', '3');
  ok('3 x 3 = 9 is Medium', hit() === 2);
  type('sevI', '1'); type('sevL', '1');
  ok('1 x 1 = 1 is Informational', hit() === 4);
  ok('exactly one severity row is highlighted', d.querySelectorAll('#t-sev tr.hit').length === 1);
  ok('bug template present and copy button labelled', /QA-001/.test(d.getElementById('bugTpl').textContent) && d.getElementById('bugCopy').textContent.length > 3);
  d.getElementById('bugCopy').click();
  ok('copy button does not throw without a clipboard', errs.length === 0);
  ok('new part quizzes have 5 questions each', d.querySelectorAll('[data-quiz="sec"] .card').length === 5 && d.querySelectorAll('[data-quiz="test"] .card').length === 5);
  d.querySelector('[data-quiz="test"] .card .opt').click();
  ok('new quiz scores like the others', /1/.test(d.querySelector('[data-quiz="test"] .score').textContent));

  // ---- quick reference: terminal table ----
  const term = [...d.querySelectorAll('#t-term tr')];
  ok('terminal table: 10 rows of 4 cells', term.length === 10 && term.every(r => r.children.length === 4));
  ok('commands are shown as code and escaped', d.querySelectorAll('#t-term code').length > 25 && txt('#t-term').join(' ').includes("awk '$2 != 0'") && !d.querySelector('#t-term script'));

  // ---- every language: structure and hygiene ----
  for (const l of LANGS) {
    lang(l);
    const ids = {}; d.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1);
    const dup = Object.keys(ids).filter(k => ids[k] > 1);
    const unnamed = [...d.querySelectorAll('button,a[href],input,select')].filter(e => !(e.textContent.trim() || e.getAttribute('aria-label') || e.getAttribute('title') || (e.labels && e.labels.length)));
    const broken = [...d.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href').length > 1 && !d.getElementById(a.getAttribute('href').slice(1)));
    ok(`${l}: ${SECTIONS} sections, no duplicate ids (${dup}), no unnamed controls (${unnamed.length}), no broken in-page links (${broken.map(a => a.getAttribute('href'))})`,
      d.querySelectorAll('#hub-sections > section').length === SECTIONS && !dup.length && !unnamed.length && !broken.length);
    ok(`${l}: external links are noopener`, [...d.querySelectorAll('a[target=_blank]')].every(a => /noopener/.test(a.rel)));
  }
  ok('no script errors after switching through every language ' + errs.join(' | '), errs.length === 0);
}

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
