/* Study hub view. Content comes from window.I18N_HUB[lang] (built from hub/content/<lang>.json).
   The whole view re-renders when the app language changes; progress in localStorage is kept. */
(() => {
  const HUB = window.I18N_HUB, ORDER = window.HUB_ORDER;
  const root = document.getElementById('hub-root');
  const $ = s => root.querySelector(s);
  let lang = window.APP.lang, U, D;
  const t = (k, v = {}) => U[k].replace(/\{(\w+)\}/g, (_, x) => v[x]);

  /* ---- saved progress (untrusted: keep only the expected shapes) ---- */
  let st = {};
  try { st = JSON.parse(localStorage.getItem('plhub') || '{}') } catch (e) {}
  const isInt = v => Number.isInteger(v) && v >= 0;
  function clean() {
    if (!st || typeof st !== 'object' || Array.isArray(st)) st = {};
    if (!isInt(st.examBest)) delete st.examBest;
    st.qbest = Object.fromEntries(Object.entries(st.qbest && typeof st.qbest === 'object' ? st.qbest : {}).filter(([, v]) => isInt(v)));
    st.missed = Object.fromEntries(Object.entries(st.missed && typeof st.missed === 'object' ? st.missed : {}).filter(([k]) => /^[a-z0-9]+-\d+$/.test(k)).map(([k]) => [k, 1]));
    if (typeof st.codeLang !== 'string') delete st.codeLang;
  }
  clean();
  const save = () => { try { localStorage.setItem('plhub', JSON.stringify(st)) } catch (e) {} };

  const rows = (sel, data) => { $(sel).innerHTML = data.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') };
  const lvName = lv => U['lv' + lv[0].toUpperCase() + lv.slice(1)];
  const lvlName = lv => U['lvl' + lv[0].toUpperCase() + lv.slice(1)];

  /* ---- multiple-choice cards ---- */
  function mcq(el, list) {
    el.innerHTML = list.map((q, i) => '<div class="card" data-i="' + i + '"><div class="label">' + t('question', {i: i + 1, n: list.length}) + '</div><p>' + q[0] + '</p><div class="opts" role="group" aria-label="' + t('answers') + '">' +
      q[1].map((o, j) => [Math.random(), j]).sort((x, y) => x[0] - y[0]).map(([, j]) => '<button type="button" class="opt" data-j="' + j + '" aria-pressed="false">' + q[1][j] + '</button>').join('') +
      '</div><p class="a" hidden></p></div>').join('');
  }
  function reveal(card, q, pick) {
    card.querySelectorAll('.opt').forEach(b => {
      const j = +b.dataset.j; b.disabled = true;
      if (j === q[2]) { b.classList.add('ok'); b.insertAdjacentText('afterbegin', '✓ ') }
      else if (j === pick) { b.classList.add('bad'); b.insertAdjacentText('afterbegin', '✗ ') }
    });
    const a = card.querySelector('.a'); a.hidden = false;
    a.innerHTML = '<strong>' + (pick === q[2] ? t('correct') : t('wrong')) + '</strong> ' + q[3];
  }

  /* ---- missed questions, review list, summary ---- */
  const lookup = key => { const [k, i] = key.split('-'); return k === 'ex' ? D.exam[+i] : (D.quizzes[k] || [])[+i] };
  function track(key, ok) { if (ok) delete st.missed[key]; else st.missed[key] = 1; save() }
  let reviewKeys = [];
  function drawReview() {
    reviewKeys = Object.keys(st.missed).filter(lookup);
    mcq($('#reviewQ'), reviewKeys.map(lookup));
    $('#reviewEmpty').hidden = reviewKeys.length > 0;
    $('#reviewCount').textContent = t('toReview', {n: reviewKeys.length});
  }
  const passMark = () => Math.ceil(D.exam.length * 0.7);
  function summary() {
    const parts = Object.keys(D.quizzes), qb = st.qbest, done = parts.filter(k => qb[k] != null);
    const pct = done.length ? Math.round(done.reduce((a, k) => a + Math.min(qb[k], D.quizzes[k].length) / D.quizzes[k].length, 0) / done.length * 100) : null;
    const miss = Object.keys(st.missed).filter(lookup).length, n = D.exam.length, pm = passMark();
    const tile = (l, v, w) => '<div class="stat"><span class="label">' + l + '</span><span class="v">' + v + '</span><span class="w">' + w + '</span></div>';
    $('#summary').innerHTML =
      tile(t('tileQuizzes'), done.length + ' / ' + parts.length, pct == null ? t('tileNone') : t('tileAvg', {p: pct})) +
      tile(t('tileExam'), st.examBest != null ? Math.min(st.examBest, n) + ' / ' + n : '–', st.examBest == null ? t('notAttempted') : (st.examBest >= pm ? t('tilePassed') : t('tilePassMark', {p: pm}))) +
      tile(t('tileReview'), miss, miss ? '<a href="#review">' + t('tileReviewLink') + '</a>' : t('tileNothing'));
  }
  const refreshStudy = () => { drawReview(); summary() };

  /* ---- checklists and progress bars ---- */
  function prog() {
    let h = '';
    for (const lv of ['intern', 'junior', 'mid']) {
      const list = D.checklists[lv], n = list.length, d = list.filter((_, i) => st[lv + '-' + i]).length;
      h += '<div class="pbox lv-' + lv + '"><div class="row"><span class="pill">' + lvName(lv) + '</span><span>' + d + ' / ' + n + '</span></div><div class="bar"><i style="width:' + Math.round(d / n * 100) + '%"></i></div></div>';
      const c = $('[data-c="' + lv + '"]'); if (c) c.textContent = t('ready', {d, n});
    }
    $('#progress').innerHTML = h;
  }
  const checkbox = (id, text, prefix = '') => '<li><label for="' + id + '">' + prefix + '<input type="checkbox" id="' + id + '"' + (st[id] === true ? ' checked' : '') + '><span>' + text + '</span></label></li>';

  /* ---- language filter ---- */
  let goal = null;
  function drawLangs() {
    const g = D.goals.find(x => x[0] === goal);
    rows('#t-langs', D.languages.filter(l => !g || g[1].includes(l[0])));
    $('#goalWhy').innerHTML = g ? '<strong>' + g[0] + ':</strong> ' + g[2] : t('allLangs', {n: D.languages.length});
    root.querySelectorAll('#goalTabs button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.g || null) === goal)));
  }

  /* ---- code viewers ---- */
  let task = 0, sqlI = 0;
  function drawCode() {
    const SN = D.snippets, LANGS = Object.keys(SN[0].code);
    const lg = LANGS.includes(st.codeLang) ? st.codeLang : LANGS[0], x = SN[task];
    $('#taskTabs').innerHTML = SN.map((s, i) => '<button type="button" data-t="' + i + '" aria-pressed="' + (i === task) + '">' + s.task + '</button>').join('');
    $('#langTabs').innerHTML = LANGS.map(l => '<button type="button" data-l="' + l + '" aria-pressed="' + (l === lg) + '">' + l + '</button>').join('');
    $('#snipCap').textContent = x.task + ' · ' + lg; $('#snippet').textContent = x.code[lg]; $('#snipNote').textContent = x.note;
    $('#copyBtn').textContent = t('copy');
  }
  function drawSql() {
    const SQ = D.sqlExamples;
    $('#sqlTabs').innerHTML = SQ.map((x, i) => '<button type="button" data-i="' + i + '" aria-pressed="' + (i === sqlI) + '">' + x.task + '</button>').join('');
    $('#sqlCode').textContent = SQ[sqlI].code; $('#sqlNote').textContent = SQ[sqlI].note; $('#sqlCopy').textContent = t('copy');
  }
  function copy(btn, text) {
    try { navigator.clipboard.writeText(text).then(() => btn.textContent = t('copied'), () => btn.textContent = t('copyFailed')) }
    catch (e) { btn.textContent = t('copyFailed') }
  }

  /* ---- part quizzes and final exam ---- */
  const partState = {};
  function drawPart(box) {
    const k = box.dataset.quiz, list = D.quizzes[k];
    partState[k] = {got: 0, done: 0};
    mcq(box.querySelector('.quiz'), list);
    box.querySelector('.score').textContent = t('answered', {d: 0, n: list.length});
  }
  let picks = {};
  function drawExam() {
    picks = {};
    mcq($('#examQ'), D.exam);
    $('#examResult').hidden = true;
    const b = $('#examSubmit'); b.textContent = t('submit'); b.dataset.m = 'submit';
    $('#examMsg').textContent = t('answered', {d: 0, n: D.exam.length});
    $('#examBest').textContent = st.examBest != null ? t('best', {s: Math.min(st.examBest, D.exam.length), n: D.exam.length}) : t('notAttempted');
  }

  /* ---- table of contents and search ---- */
  let secs = [];
  function runSearch() {
    const q = document.getElementById('search').value.trim().toLowerCase(), items = [...document.getElementById('toc').children];
    let n = 0;
    secs.forEach((s, i) => { const hit = !q || s.textContent.toLowerCase().includes(q); items[i].hidden = !hit; if (hit) n++ });
    document.getElementById('searchMsg').textContent = q ? (n ? t('searchHits', {n, m: secs.length}) : t('searchNone')) : '';
    return secs.filter((s, i) => !items[i].hidden);
  }

  /* ---- render everything for the current language ---- */
  function render() {
    const L = HUB[lang]; U = L.ui; D = L.data;
    $('#hub-hero').innerHTML = L.hero;
    $('#hub-sections').innerHTML = ORDER.map(s => '<section ' + s.attrs + '>' + L.sections[s.id] + '</section>').join('');

    rows('#t-tools', D.tools); rows('#t-concepts', D.concepts); rows('#t-types', D.types); rows('#t-mem', D.memory);
    rows('#t-goals', D.goals.map(g => [g[0], g[1].join(' / '), g[2]]));
    rows('#t-sql', D.sqlSkills); rows('#t-dialects', D.dialects);
    rows('#t-proj', D.projects.map(r => ['<span class="pill lv-' + r[0] + '">' + lvName(r[0]) + '</span>', r[1], r[2]]));
    $('#profiles').innerHTML = D.profiles.map(p => '<details class="pr"><summary>' + p[0] + '</summary><p>' + p[1] + '</p></details>').join('');
    $('#goalTabs').setAttribute('aria-label', t('goalAria'));
    $('#goalTabs').innerHTML = '<button type="button">' + t('all') + '</button>' + D.goals.map(g => '<button type="button" data-g="' + g[0] + '">' + g[0] + '</button>').join('');
    if (!D.goals.some(g => g[0] === goal)) goal = null;
    drawLangs();
    const X = v => (v - 100) / 110 * 100;
    $('#sal').innerHTML = D.salaries.map(r => '<div class="srow"><span class="nm">' + r[0] + '</span><div class="track"><i class="' + (r[4] ? 'alt' : '') + '" style="left:' + X(r[1]) + '%;width:' + Math.max(X(r[2]) - X(r[1]), 0) + '%"></i></div><span class="amt">' + r[3] + '</span></div>').join('');

    root.querySelectorAll('.checks[data-lv]').forEach(ul => { const lv = ul.dataset.lv; ul.innerHTML = D.checklists[lv].map((x, i) => checkbox(lv + '-' + i, x)).join('') });
    $('#seq').innerHTML = D.sequence.map((x, i) => checkbox('seq-' + i, x, '<span class="k">' + String(i + 1).padStart(2, '0') + '</span>')).join('');
    prog();
    $('#mistakes').innerHTML = D.mistakes.map(x => '<li>' + x + '</li>').join('');
    $('#phases').innerHTML = D.path.map((ph, i) => '<article class="phase lv-' + ph.lv + '"><div class="phase-head"><span class="k">' + t('phase', {i: i + 1}) + '</span><h3>' + ph.phase + '</h3><span class="pill">' + lvlName(ph.lv) + '</span><span class="t">' + ph.time + '</span></div><p class="goal">' + ph.goal + '</p><div class="pcols">' +
      [[t('learn'), ph.learn], [t('build'), ph.practice], [t('doneWhen'), ph.done]].map(([h, l]) => '<div><div class="label">' + h + '</div><ul>' + l.map(x => '<li>' + x + '</li>').join('') + '</ul></div>').join('') + '</div></article>').join('');

    $('#quiz').innerHTML = D.selfCheck.map((q, i) => '<div class="card"><div class="label">' + t('check', {i: i + 1, n: D.selfCheck.length}) + '</div><p>' + q[0] + '</p><button type="button" aria-expanded="false">' + t('showHint') + '</button><p class="a" hidden>' + q[1] + '</p></div>').join('');
    root.querySelectorAll('[data-quiz]').forEach(drawPart);
    $('#examIntro').textContent = t('examIntro', {n: D.exam.length, p: passMark()});
    drawExam(); refreshStudy();
    $('#taskTabs').setAttribute('aria-label', t('taskAria')); $('#langTabs').setAttribute('aria-label', t('langAria')); $('#sqlTabs').setAttribute('aria-label', t('sqlAria'));
    drawCode(); drawSql();

    const link = r => '<li><a href="' + r[2] + '" target="_blank" rel="noopener"><span>' + r[0] + '</span><small>' + r[1] + '</small></a></li>';
    $('#refs').innerHTML = D.docs.map(link).join('');
    $('#practice').innerHTML = D.practice.map(link).join('');

    secs = [...root.querySelectorAll('#hub-sections section')];
    secs.forEach((s, i) => s.querySelector('h2').insertAdjacentHTML('afterbegin', '<span class="n">' + String(i + 1).padStart(2, '0') + '</span>'));
    document.getElementById('tocLabel').textContent = t('contents');
    const search = document.getElementById('search');
    search.placeholder = t('searchPh'); search.setAttribute('aria-label', t('searchAria'));
    document.getElementById('toc').innerHTML = secs.map((s, i) => '<li><a href="#' + s.id + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + s.querySelector('h2').lastChild.textContent.trim() + '</a></li>').join('');
    runSearch();
  }

  /* ---- one set of event handlers for the whole view ---- */
  root.addEventListener('click', e => {
    const el = e.target;
    let b;
    if ((b = el.closest('#goalTabs button'))) { goal = b.dataset.g || null; drawLangs(); return }
    if ((b = el.closest('#quiz .card button'))) {
      const a = b.nextElementSibling; a.hidden = !a.hidden;
      b.textContent = a.hidden ? t('showHint') : t('hideHint'); b.setAttribute('aria-expanded', String(!a.hidden)); return;
    }
    if ((b = el.closest('[data-quiz] .retry'))) { drawPart(b.closest('[data-quiz]')); return }
    if ((b = el.closest('[data-quiz] .opt')) && !b.disabled) {
      const box = b.closest('[data-quiz]'), k = box.dataset.quiz, list = D.quizzes[k], c = b.closest('.card'), q = list[+c.dataset.i], j = +b.dataset.j, ps = partState[k];
      reveal(c, q, j); track(k + '-' + c.dataset.i, j === q[2]); ps.done++; if (j === q[2]) ps.got++;
      if (ps.done === list.length) { st.qbest[k] = Math.max(st.qbest[k] || 0, ps.got); save() }
      box.querySelector('.score').textContent = ps.done < list.length ? t('answered', {d: ps.done, n: list.length}) : t('score', {s: ps.got, n: list.length});
      refreshStudy(); return;
    }
    if ((b = el.closest('#examQ .opt')) && !b.disabled) {
      const c = b.closest('.card');
      c.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      picks[c.dataset.i] = +b.dataset.j; $('#examMsg').textContent = t('answered', {d: Object.keys(picks).length, n: D.exam.length}); return;
    }
    if (el.closest('#examSubmit')) {
      const btn = $('#examSubmit'), EX = D.exam;
      if (btn.dataset.m === 'retake') { drawExam(); $('#exam').scrollIntoView(); return }
      const n = Object.keys(picks).length;
      if (n < EX.length) { $('#examMsg').textContent = t('answerAll', {n: EX.length, d: n}); return }
      let s = 0;
      $('#examQ').querySelectorAll('.card').forEach(c => { const i = +c.dataset.i, ok = picks[i] === EX[i][2]; if (ok) s++; reveal(c, EX[i], picks[i]); track('ex-' + i, ok) });
      const pass = s >= passMark();
      st.examBest = Math.max(st.examBest || 0, s); save();
      $('#examBest').textContent = t('best', {s: st.examBest, n: EX.length});
      const r = $('#examResult'); r.hidden = false;
      r.innerHTML = '<strong>' + t('examResult', {s, n: EX.length, p: Math.round(s / EX.length * 100), v: pass ? t('passed') : t('notPassed')}) + '</strong> ' + (pass ? t('passedMsg') : t('failedMsg'));
      $('#examMsg').textContent = ''; btn.textContent = t('retakeExam'); btn.dataset.m = 'retake';
      refreshStudy(); return;
    }
    if ((b = el.closest('#reviewQ .opt')) && !b.disabled) {
      const c = b.closest('.card'), key = reviewKeys[+c.dataset.i], q = lookup(key), j = +b.dataset.j;
      reveal(c, q, j);
      if (j === q[2]) { track(key, true); summary(); $('#reviewCount').textContent = t('toReview', {n: Object.keys(st.missed).filter(lookup).length}) }
      return;
    }
    if (el.closest('#reviewRefresh')) { drawReview(); return }
    if ((b = el.closest('#taskTabs button'))) { task = +b.dataset.t; drawCode(); return }
    if ((b = el.closest('#langTabs button'))) { st.codeLang = b.dataset.l; save(); drawCode(); return }
    if ((b = el.closest('#copyBtn'))) { const SN = D.snippets, LANGS = Object.keys(SN[0].code); copy(b, SN[task].code[LANGS.includes(st.codeLang) ? st.codeLang : LANGS[0]]); return }
    if ((b = el.closest('#sqlTabs button'))) { sqlI = +b.dataset.i; drawSql(); return }
    if ((b = el.closest('#sqlCopy'))) { copy(b, D.sqlExamples[sqlI].code); return }
    if (el.closest('#reset')) {
      st = {}; clean(); save();
      root.querySelectorAll('input[type=checkbox]').forEach(x => x.checked = false);
      prog(); root.querySelectorAll('[data-quiz]').forEach(drawPart); drawExam(); refreshStudy();
    }
  });
  root.addEventListener('change', e => {
    const x = e.target;
    if (x.type !== 'checkbox') return;
    st[x.id] = x.checked; save(); prog();
  });
  const search = document.getElementById('search');
  search.addEventListener('input', runSearch);
  search.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const hit = runSearch();
    if (hit.length && search.value.trim()) hit[0].scrollIntoView();
  });

  document.addEventListener('app:lang', e => { lang = e.detail; render() });
  render();
  // Sections are rendered by script, so jump to a section link (e.g. #sql) once they exist
  const target = location.hash.slice(1) && document.getElementById(location.hash.slice(1));
  if (target && root.contains(target)) target.scrollIntoView();
})();
