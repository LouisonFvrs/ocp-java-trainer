(function () {
  'use strict';

  const OCP = window.OCP;
  const STORE = 'ocp21.progress';
  const SESSION = 'ocp21.session';
  const LAST = 'ocp21.last';
  const THEME = 'ocp21.theme';
  const LETTERS = 'ABCDEFG';
  const app = document.getElementById('app');

  // ---------- storage ----------
  function load(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null || value === undefined ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage unavailable (private mode, quota): the site keeps working without persistence.
    }
  }

  let progress = normalizeProgress(load(STORE, null));
  let session = load(SESSION, null);
  let timerHandle = null;

  function normalizeProgress(p) {
    if (!p || typeof p !== 'object') p = {};
    if (!p.q || typeof p.q !== 'object') p.q = {};
    if (!Array.isArray(p.exams)) p.exams = [];
    return p;
  }

  // ---------- data ----------
  const Q = {};
  OCP.topics.forEach((t) => t.questions.forEach((q) => { Q[q.id] = q; }));
  const ALL = Object.values(Q);
  if (session && session.items.some((it) => !Q[it.id])) session = null;

  function stat(id) {
    return progress.q[id] || { ok: 0, ko: 0 };
  }
  function record(id, ok) {
    const s = progress.q[id] || (progress.q[id] = { ok: 0, ko: 0 });
    if (ok) s.ok++; else s.ko++;
    s.last = ok;
    s.at = Date.now();
  }
  function topicStats(topic) {
    let seen = 0, mastered = 0, ok = 0, ko = 0;
    topic.questions.forEach((q) => {
      const s = progress.q[q.id];
      if (!s || s.ok + s.ko === 0) return;
      seen++;
      if (s.last) mastered++;
      ok += s.ok;
      ko += s.ko;
    });
    const total = topic.questions.length;
    return { total, seen, mastered, ok, ko, mastery: total ? mastered / total : 0 };
  }
  // Readiness mirrors the exam: each topic counts for its share of the 50 questions.
  function readiness() {
    let sum = 0, weight = 0;
    OCP.topics.forEach((t) => {
      if (!t.questions.length) return;
      sum += topicStats(t).mastery * t.weight;
      weight += t.weight;
    });
    return weight ? sum / weight : 0;
  }
  function failedIds() {
    return ALL.filter((q) => progress.q[q.id] && progress.q[q.id].last === false).map((q) => q.id);
  }
  function flaggedIds() {
    return ALL.filter((q) => progress.q[q.id] && progress.q[q.id].flag).map((q) => q.id);
  }

  // ---------- helpers ----------
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  }
  function inline(s) {
    // Split on backticks first so that markup characters inside code spans stay literal.
    const parts = String(s).split('`');
    if (parts.length % 2 === 0) {
      const tail = parts.pop();
      parts[parts.length - 1] += '`' + tail;
    }
    return parts.map((part, i) => (i % 2
      ? '<code>' + esc(part) + '</code>'
      : esc(part).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'))).join('');
  }
  const KEYWORDS = 'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|true|false|opens|package|permits|private|protected|provides|public|record|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|transitive|try|uses|var|void|volatile|when|while|with|yield';
  const TOKEN = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
    '|("""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])+\')' +
    '|(@[A-Za-z_]\\w*)' +
    '|\\b(0[xXbB][\\da-fA-F_]+[lL]?|\\d[\\d_]*(?:\\.[\\d_]+)?(?:[eE][+-]?\\d+)?[fFdDlL]?)\\b' +
    '|(?<![\\w.])(' + KEYWORDS + ')(?![\\w-])', 'g');
  function highlight(code) {
    let out = '', last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(code))) {
      out += esc(code.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'a' : m[4] ? 'n' : 'k';
      out += '<span class="t-' + cls + '">' + esc(m[0]) + '</span>';
      last = TOKEN.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function codeBlock(code) {
    const src = code.replace(/\s+$/, '');
    const lines = src.split('\n').length;
    let gutter = '';
    for (let i = 1; i <= lines; i++) gutter += i + '\n';
    return '<div class="code"><pre class="gutter" aria-hidden="true">' + gutter + '</pre><pre class="src"><code>' + highlight(src) + '</code></pre></div>';
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pct(x) {
    return Math.round(x * 100);
  }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0');
  }
  function dateLabel(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function sameSet(a, b) {
    return a.length === b.length && a.every((x) => b.includes(x));
  }
  function plural(n, word) {
    return n + ' ' + word + (n > 1 ? 's' : '');
  }
  function bar(value, cls) {
    return '<div class="bar ' + (cls || '') + '"><span style="width:' + pct(value) + '%"></span></div>';
  }
  function go(route) {
    if (location.hash === '#/' + route) render();
    else location.hash = '#/' + route;
  }

  // ---------- sessions ----------
  function newItem(id) {
    const order = shuffle(Q[id].options.map((_, i) => i));
    return { id, order, picked: [], checked: false, flag: false };
  }
  function startPractice(ids, count) {
    const chosen = shuffle(ids).slice(0, count || ids.length);
    if (!chosen.length) return;
    session = { mode: 'practice', idx: 0, startedAt: Date.now(), items: chosen.map(newItem) };
    save(SESSION, session);
    go('session');
  }
  function buildExamIds() {
    const total = Math.min(OCP.exam.questions, ALL.length);
    const picked = [];
    const rest = [];
    OCP.topics.forEach((t) => {
      const pool = shuffle(t.questions.map((q) => q.id));
      picked.push(...pool.slice(0, t.weight));
      rest.push(...pool.slice(t.weight));
    });
    // A topic with too few questions is compensated by the others so the exam keeps its length.
    const extra = shuffle(rest);
    while (picked.length < total && extra.length) picked.push(extra.pop());
    return shuffle(picked.slice(0, total));
  }
  function startExam() {
    const ids = buildExamIds();
    if (!ids.length) return;
    const now = Date.now();
    session = { mode: 'exam', idx: 0, startedAt: now, endsAt: now + OCP.exam.minutes * 60000, items: ids.map(newItem) };
    save(SESSION, session);
    go('session');
  }
  function isCorrect(item) {
    return sameSet(item.picked, Q[item.id].answer);
  }
  function finishSession() {
    if (!session) return;
    const exam = session.mode === 'exam';
    const items = exam ? session.items : session.items.filter((it) => it.checked);
    const now = Date.now();
    if (exam) items.forEach((it) => record(it.id, isCorrect(it)));
    const result = {
      mode: session.mode,
      at: now,
      sec: Math.round((Math.min(now, session.endsAt || now) - session.startedAt) / 1000),
      items: items.map((it) => ({ id: it.id, order: it.order, picked: it.picked, ok: isCorrect(it) }))
    };
    result.ok = result.items.filter((it) => it.ok).length;
    result.total = result.items.length;
    if (exam) {
      progress.exams.push({ at: now, ok: result.ok, total: result.total, sec: result.sec });
    }
    save(STORE, progress);
    session = null;
    save(SESSION, null);
    if (!result.total) return go('');
    save(LAST, result);
    go('resultat');
  }

  // ---------- question rendering ----------
  function optionHtml(text) {
    if (text.indexOf('\n') >= 0) return '<pre class="optcode"><code>' + highlight(text) + '</code></pre>';
    // A one-line option written as a bare Java statement reads better as code.
    if (text.indexOf('`') < 0 && /[;{}]$/.test(text.trim())) return '<code class="optline">' + highlight(text) + '</code>';
    return inline(text);
  }
  function questionHtml(item, reveal, interactive) {
    const q = Q[item.id];
    const multi = q.answer.length > 1;
    const options = item.order.map((oi, pos) => {
      const picked = item.picked.includes(oi);
      const good = q.answer.includes(oi);
      let cls = 'opt';
      if (picked) cls += ' picked';
      if (reveal) cls += good ? ' good' : picked ? ' bad' : '';
      let mark = '';
      if (reveal && good) mark = '<span class="mark">✓</span>';
      else if (reveal && picked) mark = '<span class="mark">✗</span>';
      const attrs = interactive ? ' data-act="pick" data-opt="' + oi + '"' : ' disabled';
      return '<button type="button" class="' + cls + '"' + attrs + ' role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + picked + '">' +
        '<span class="key">' + LETTERS[pos] + '</span><span class="txt">' + optionHtml(q.options[oi]) + '</span>' + mark + '</button>';
    }).join('');
    return '<div class="question">' +
      '<p class="q-text">' + inline(q.q) + '</p>' +
      (q.code ? codeBlock(q.code) : '') +
      '<p class="q-hint">' + (multi ? 'Plusieurs réponses attendues : ' + q.answer.length : 'Une seule réponse') + '</p>' +
      '<div class="options" role="' + (multi ? 'group' : 'radiogroup') + '">' + options + '</div>' +
      (reveal ? '<div class="explain"><h4>Explication</h4><p>' + inline(q.explain) + '</p></div>' : '') +
      '</div>';
  }
  function badges(q) {
    const t = OCP.byId[q.topic];
    return '<span class="badge">' + esc(t.title) + '</span><span class="badge soft" title="Difficulté">' + '●'.repeat(q.difficulty) + '○'.repeat(3 - q.difficulty) + '</span>';
  }

  // ---------- views ----------
  function viewDashboard() {
    const ready = readiness();
    const seen = ALL.filter((q) => progress.q[q.id] && stat(q.id).ok + stat(q.id).ko > 0).length;
    let ok = 0, ko = 0;
    Object.values(progress.q).forEach((s) => { ok += s.ok || 0; ko += s.ko || 0; });
    const exams = progress.exams;
    const best = exams.length ? Math.max(...exams.map((e) => e.ok / e.total)) : null;
    const failed = failedIds().length;
    const weakest = OCP.topics.filter((t) => t.questions.length)
      .map((t) => ({ t, s: topicStats(t) }))
      .sort((a, b) => a.s.mastery - b.s.mastery)[0];
    const C = 2 * Math.PI * 52;

    const rows = OCP.topics.map((t) => {
      const s = topicStats(t);
      return '<tr>' +
        '<td><div class="topic-name"><span class="num">' + t.n + '</span><div><strong>' + esc(t.title) + '</strong><small>' + esc(t.official) + '</small></div></div></td>' +
        '<td class="col-bar">' + bar(s.mastery) + '<small>' + pct(s.mastery) + ' % maîtrisé · ' + s.seen + '/' + s.total + ' vues</small></td>' +
        '<td class="col-actions"><a class="btn small ghost" href="#/cours/' + t.id + '">Cours</a><a class="btn small" href="#/entrainement/' + t.id + '">S\'entraîner</a></td>' +
        '</tr>';
    }).join('');

    const history = exams.length
      ? '<table class="table"><thead><tr><th>Date</th><th>Score</th><th>Durée</th><th>Résultat</th></tr></thead><tbody>' +
        exams.slice().reverse().slice(0, 10).map((e) => {
          const p = pct(e.ok / e.total);
          const pass = p >= OCP.exam.pass;
          return '<tr><td>' + dateLabel(e.at) + '</td><td>' + e.ok + '/' + e.total + ' (' + p + ' %)</td><td>' + clock(e.sec) + '</td><td><span class="pill ' + (pass ? 'ok' : 'ko') + '">' + (pass ? 'Réussi' : 'Échoué') + '</span></td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="muted">Aucun examen blanc pour l\'instant. Lance-toi quand tu as vu la majorité des thèmes.</p>';

    return '<section class="hero">' +
      '<div class="ring" title="Part des questions maîtrisées, pondérée comme à l\'examen">' +
        '<svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/>' +
          (ready > 0 ? '<circle class="ring-fg" cx="60" cy="60" r="52" stroke-dasharray="' + (C * ready).toFixed(1) + ' ' + C.toFixed(1) + '"/>' : '') + '</svg>' +
        '<div class="ring-label"><strong>' + pct(ready) + ' %</strong><small>prêt</small></div>' +
      '</div>' +
      '<div class="hero-body">' +
        '<h1>Oracle Certified Professional — Java SE 21 Developer</h1>' +
        '<p class="muted">Examen ' + OCP.exam.code + ' · ' + OCP.exam.questions + ' questions · ' + OCP.exam.minutes + ' minutes · ' + OCP.exam.pass + ' % pour réussir</p>' +
        '<div class="stats">' +
          '<div><strong>' + seen + '<small>/' + ALL.length + '</small></strong><span>questions vues</span></div>' +
          '<div><strong>' + (ok + ko ? pct(ok / (ok + ko)) + ' %' : '—') + '</strong><span>réussite globale</span></div>' +
          '<div><strong>' + exams.length + '</strong><span>examens blancs</span></div>' +
          '<div><strong>' + (best === null ? '—' : pct(best) + ' %') + '</strong><span>meilleur score</span></div>' +
        '</div>' +
        '<div class="actions">' +
          (session ? '<a class="btn" href="#/session">Reprendre la session en cours</a>' : '') +
          (weakest ? '<a class="btn' + (session ? ' ghost' : '') + '" href="#/entrainement/' + weakest.t.id + '">Travailler mon point faible : ' + esc(weakest.t.title) + '</a>' : '') +
          '<a class="btn ghost" href="#/examen">Examen blanc</a>' +
          (failed ? '<a class="btn ghost" href="#/erreurs">Revoir mes ' + plural(failed, 'erreur') + '</a>' : '') +
        '</div>' +
      '</div></section>' +
      '<section class="card"><h2>Progression par thème</h2><table class="table topics"><tbody>' + rows + '</tbody></table>' +
      '<p class="muted small">Une question est « maîtrisée » quand ta dernière réponse était juste. Le pourcentage « prêt » pondère chaque thème selon son poids dans l\'examen blanc.</p></section>' +
      '<section class="card"><h2>Examens blancs</h2>' + history + '</section>';
  }

  function blockHtml(block) {
    if (block.h) return '<h4>' + inline(block.h) + '</h4>';
    if (block.p) return '<p>' + inline(block.p) + '</p>';
    if (block.list) return '<ul>' + block.list.map((li) => '<li>' + inline(li) + '</li>').join('') + '</ul>';
    if (block.code) return codeBlock(block.code);
    if (block.trap) return '<div class="callout trap"><span class="callout-tag">Piège</span><p>' + inline(block.trap) + '</p></div>';
    if (block.tip) return '<div class="callout tip"><span class="callout-tag">Astuce</span><p>' + inline(block.tip) + '</p></div>';
    if (block.table) {
      return '<div class="table-wrap"><table class="table grid"><thead><tr>' + block.table.head.map((h) => '<th>' + inline(h) + '</th>').join('') + '</tr></thead><tbody>' +
        block.table.rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    }
    return '';
  }
  function viewCourse(id) {
    const topic = OCP.byId[id] || OCP.topics[0];
    const side = OCP.topics.map((t) => '<a href="#/cours/' + t.id + '"' + (t === topic ? ' class="active"' : '') + '><span class="num">' + t.n + '</span>' + esc(t.title) + '</a>').join('');
    const toc = topic.course.map((s, i) => '<li><a href="#/cours/' + topic.id + '" data-act="scroll" data-target="sec-' + i + '">' + inline(s.title) + '</a></li>').join('');
    const body = topic.course.length
      ? topic.course.map((s, i) => '<section class="card course-section" id="sec-' + i + '"><h3>' + inline(s.title) + '</h3>' + s.blocks.map(blockHtml).join('') + '</section>').join('')
      : '<section class="card"><p class="muted">Le cours de ce thème n\'est pas encore disponible.</p></section>';
    return '<div class="course-layout">' +
      '<aside class="side"><nav class="side-nav">' + side + '</nav></aside>' +
      '<div class="course-main">' +
        '<header class="page-head"><div><p class="eyebrow">Thème ' + topic.n + ' · ' + esc(topic.official) + '</p><h1>' + esc(topic.title) + '</h1></div>' +
        '<a class="btn" href="#/entrainement/' + topic.id + '">S\'entraîner sur ce thème</a></header>' +
        (toc ? '<section class="card toc"><h2>Sommaire</h2><ol>' + toc + '</ol></section>' : '') +
        body +
      '</div></div>';
  }

  function viewPracticeSetup(preselect) {
    const topics = OCP.topics.map((t) => {
      const checked = !preselect || preselect === t.id;
      return '<label class="check"><input type="checkbox" name="topic" value="' + t.id + '"' + (checked ? ' checked' : '') + (t.questions.length ? '' : ' disabled') + '>' +
        '<span>' + esc(t.title) + '</span><small>' + plural(t.questions.length, 'question') + '</small></label>';
    }).join('');
    return '<header class="page-head"><div><p class="eyebrow">Correction immédiate après chaque question</p><h1>Entraînement</h1></div></header>' +
      '<form class="card form" id="practice-form">' +
        '<fieldset><legend>Thèmes</legend><div class="check-grid">' + topics + '</div>' +
        '<p><button type="button" class="link" data-act="all-topics">Tout cocher</button> · <button type="button" class="link" data-act="no-topics">Tout décocher</button></p></fieldset>' +
        '<div class="form-row">' +
          '<label>Questions à inclure<select name="filter">' +
            '<option value="all">Toutes</option><option value="unseen">Jamais vues</option><option value="failed">Ratées la dernière fois</option><option value="flagged">Marquées</option><option value="weak">Non maîtrisées (jamais vues ou ratées)</option></select></label>' +
          '<label>Difficulté<select name="difficulty"><option value="0">Toutes</option><option value="1">● Connaissance directe</option><option value="2">●● Niveau examen</option><option value="3">●●● Piégeuse</option></select></label>' +
          '<label>Nombre de questions<select name="count"><option>10</option><option selected>20</option><option>30</option><option>50</option><option value="9999">Toutes</option></select></label>' +
        '</div>' +
        '<p class="muted" id="practice-count"></p>' +
        '<div class="actions"><button class="btn" type="submit">Commencer</button></div>' +
      '</form>';
  }
  function practicePool(form) {
    const data = new FormData(form);
    const topics = data.getAll('topic');
    const filter = data.get('filter');
    const difficulty = Number(data.get('difficulty'));
    return ALL.filter((q) => {
      if (!topics.includes(q.topic)) return false;
      if (difficulty && q.difficulty !== difficulty) return false;
      const s = progress.q[q.id];
      const seen = s && s.ok + s.ko > 0;
      if (filter === 'unseen') return !seen;
      if (filter === 'failed') return seen && s.last === false;
      if (filter === 'flagged') return s && s.flag;
      if (filter === 'weak') return !seen || s.last === false;
      return true;
    }).map((q) => q.id);
  }
  function updatePracticeCount() {
    const form = document.getElementById('practice-form');
    if (!form) return;
    const n = practicePool(form).length;
    document.getElementById('practice-count').textContent = n ? plural(n, 'question') + ' correspond' + (n > 1 ? 'ent' : '') + ' à ces critères.' : 'Aucune question ne correspond à ces critères.';
    form.querySelector('[type=submit]').disabled = !n;
  }

  function viewExamIntro() {
    const e = OCP.exam;
    const resume = session && session.mode === 'exam';
    const enough = ALL.length >= e.questions;
    const split = OCP.topics.map((t) => '<tr><td>' + esc(t.title) + '</td><td>' + t.weight + '</td></tr>').join('');
    return '<header class="page-head"><div><p class="eyebrow">Conditions réelles</p><h1>Examen blanc</h1></div></header>' +
      '<section class="card"><ul class="rules">' +
        '<li><strong>' + Math.min(e.questions, ALL.length) + ' questions</strong> tirées au hasard, réparties par thème comme ci-dessous.</li>' +
        '<li><strong>' + e.minutes + ' minutes</strong> : le chronomètre ne s\'arrête pas, même si tu fermes la page.</li>' +
        '<li>Aucune correction pendant l\'épreuve. Tu peux marquer des questions pour y revenir.</li>' +
        '<li>Seuil de réussite : <strong>' + e.pass + ' %</strong>. Une question à réponses multiples n\'est juste que si toutes les réponses sont exactes.</li>' +
        '<li>Les questions sans réponse comptent comme fausses.</li></ul>' +
        (enough ? '' : '<p class="muted">La banque contient moins de ' + e.questions + ' questions : l\'examen sera plus court.</p>') +
        '<div class="actions">' +
          (resume ? '<a class="btn" href="#/session">Reprendre l\'examen en cours</a><button class="btn ghost" data-act="start-exam">Recommencer un nouvel examen</button>'
                  : '<button class="btn" data-act="start-exam"' + (ALL.length ? '' : ' disabled') + '>Démarrer l\'examen</button>') +
        '</div></section>' +
      '<section class="card"><h2>Répartition des questions</h2><table class="table compact"><thead><tr><th>Thème</th><th>Questions</th></tr></thead><tbody>' + split + '</tbody></table>' +
      '<p class="muted small">Oracle ne publie pas la pondération exacte des thèmes : cette répartition est une estimation raisonnable.</p></section>';
  }

  function viewSession() {
    if (!session) return '<section class="card"><p>Aucune session en cours.</p><div class="actions"><a class="btn" href="#/entrainement">Démarrer un entraînement</a></div></section>';
    const exam = session.mode === 'exam';
    const item = session.items[session.idx];
    const q = Q[item.id];
    const n = session.items.length;
    const last = session.idx === n - 1;
    const st = stat(item.id);
    let head, foot, aside = '';

    if (exam) {
      const answered = session.items.filter((it) => it.picked.length).length;
      head = '<div class="session-head"><div><strong>Question ' + (session.idx + 1) + ' / ' + n + '</strong><small>' + answered + ' répondue' + (answered > 1 ? 's' : '') + '</small></div>' +
        '<div class="timer" id="timer">' + clock((session.endsAt - Date.now()) / 1000) + '</div>' +
        '<button class="btn small danger" data-act="finish-exam">Terminer l\'examen</button></div>';
      foot = '<div class="session-foot">' +
        '<button class="btn ghost" data-act="prev"' + (session.idx ? '' : ' disabled') + '>← Précédente</button>' +
        '<button class="btn ghost' + (item.flag ? ' on' : '') + '" data-act="flag-exam">' + (item.flag ? '⚑ Marquée' : '⚐ Marquer pour relecture') + '</button>' +
        '<button class="btn" data-act="next"' + (last ? ' disabled' : '') + '>Suivante →</button></div>';
      aside = '<aside class="grid-nav"><h3>Navigation</h3><div class="cells">' +
        session.items.map((it, i) => '<button class="cell' + (i === session.idx ? ' current' : '') + (it.picked.length ? ' done' : '') + (it.flag ? ' flag' : '') + '" data-act="goto" data-idx="' + i + '">' + (i + 1) + '</button>').join('') +
        '</div><p class="legend"><span class="cell done"></span>répondue <span class="cell flag"></span>marquée</p></aside>';
    } else {
      const done = session.items.filter((it) => it.checked).length;
      const need = q.answer.length;
      head = '<div class="session-head"><div><strong>Question ' + (session.idx + 1) + ' / ' + n + '</strong><small>' + badges(q) + '</small></div>' +
        '<div class="session-tools"><button class="btn small ghost' + (st.flag ? ' on' : '') + '" data-act="flag">' + (st.flag ? '⚑ Marquée' : '⚐ Marquer') + '</button>' +
        '<button class="btn small ghost" data-act="quit">Terminer</button></div></div>' + bar(done / n, 'thin');
      const verdict = item.checked ? '<span class="verdict ' + (isCorrect(item) ? 'ok' : 'ko') + '">' + (isCorrect(item) ? 'Bonne réponse' : 'Mauvaise réponse') + '</span>' : '<span></span>';
      foot = '<div class="session-foot">' + verdict +
        (item.checked
          ? '<button class="btn" data-act="' + (last ? 'quit' : 'next') + '" id="primary">' + (last ? 'Voir le bilan' : 'Question suivante →') + '</button>'
          : '<button class="btn" data-act="check" id="primary"' + (item.picked.length === need ? '' : ' disabled') + '>Valider</button>') +
        '</div>';
    }
    return '<div class="session' + (exam ? ' exam' : '') + '"><div class="session-main card">' + head + questionHtml(item, !exam && item.checked, exam || !item.checked) + foot + '</div>' + aside + '</div>';
  }

  function viewResult() {
    const r = load(LAST, null);
    if (!r || !r.items.every((it) => Q[it.id])) return '<section class="card"><p>Aucun résultat à afficher.</p></section>';
    const p = pct(r.ok / r.total);
    const exam = r.mode === 'exam';
    const pass = p >= OCP.exam.pass;
    const byTopic = {};
    r.items.forEach((it) => {
      const b = byTopic[Q[it.id].topic] || (byTopic[Q[it.id].topic] = { ok: 0, total: 0 });
      b.total++;
      if (it.ok) b.ok++;
    });
    const topicRows = OCP.topics.filter((t) => byTopic[t.id]).map((t) => {
      const b = byTopic[t.id];
      return '<tr><td>' + esc(t.title) + '</td><td class="col-bar">' + bar(b.ok / b.total, b.ok / b.total >= OCP.exam.pass / 100 ? 'good' : 'bad') + '</td><td>' + b.ok + '/' + b.total + '</td><td><a class="btn small ghost" href="#/cours/' + t.id + '">Cours</a></td></tr>';
    }).join('');
    const review = r.items.map((it, i) => {
      const q = Q[it.id];
      const item = { id: it.id, order: it.order, picked: it.picked };
      return '<details class="review ' + (it.ok ? 'ok' : 'ko') + '"><summary><span class="pill ' + (it.ok ? 'ok' : 'ko') + '">' + (it.ok ? '✓' : it.picked.length ? '✗' : '∅') + '</span>' +
        '<span class="rev-title">' + (i + 1) + '. ' + inline(q.q) + '</span><span class="badge">' + esc(OCP.byId[q.topic].title) + '</span></summary>' +
        questionHtml(item, true, false) + '</details>';
    }).join('');
    const wrong = r.items.filter((it) => !it.ok).length;
    return '<header class="page-head"><div><p class="eyebrow">' + (exam ? 'Examen blanc' : 'Entraînement') + ' · ' + dateLabel(r.at) + '</p><h1>Bilan</h1></div></header>' +
      '<section class="card result ' + (exam ? (pass ? 'pass' : 'fail') : '') + '">' +
        '<div class="score"><strong>' + p + ' %</strong><span>' + r.ok + ' / ' + r.total + ' bonnes réponses · ' + clock(r.sec) + '</span></div>' +
        (exam ? '<p class="outcome">' + (pass ? 'Réussi — au-dessus du seuil de ' + OCP.exam.pass + ' %.' : 'Échoué — il faut ' + OCP.exam.pass + ' % (' + Math.ceil(r.total * OCP.exam.pass / 100) + ' bonnes réponses).') + '</p>' : '') +
        '<div class="actions">' +
          (wrong ? '<button class="btn" data-act="retry-wrong">Retravailler les ' + plural(wrong, 'erreur') + '</button>' : '') +
          '<a class="btn ghost" href="#/' + (exam ? 'examen' : 'entrainement') + '">' + (exam ? 'Nouvel examen' : 'Nouvel entraînement') + '</a>' +
          '<a class="btn ghost" href="#/">Tableau de bord</a></div>' +
      '</section>' +
      '<section class="card"><h2>Par thème</h2><table class="table compact"><tbody>' + topicRows + '</tbody></table></section>' +
      '<section class="card"><h2>Correction détaillée</h2><p class="muted small">Clique sur une question pour voir ta réponse, la bonne réponse et l\'explication.</p>' +
      '<div class="actions tight"><button class="link" data-act="open-wrong">Déplier les erreurs</button> · <button class="link" data-act="close-all">Tout replier</button></div>' + review + '</section>';
  }

  function viewErrors() {
    const failed = failedIds();
    const flagged = flaggedIds();
    function listing(ids) {
      return OCP.topics.map((t) => {
        const qs = ids.filter((id) => Q[id].topic === t.id);
        if (!qs.length) return '';
        return '<h3>' + esc(t.title) + ' <small class="muted">(' + qs.length + ')</small></h3>' +
          qs.map((id) => '<details class="review"><summary><span class="rev-title">' + inline(Q[id].q) + '</span><span class="badge soft">' + stat(id).ok + ' ✓ · ' + stat(id).ko + ' ✗</span></summary>' +
            questionHtml({ id, order: Q[id].options.map((_, i) => i), picked: [] }, true, false) + '</details>').join('');
      }).join('');
    }
    return '<header class="page-head"><div><p class="eyebrow">Répétition ciblée</p><h1>Mes erreurs</h1></div></header>' +
      '<section class="card"><h2>Questions ratées la dernière fois <small class="muted">(' + failed.length + ')</small></h2>' +
        (failed.length
          ? '<div class="actions"><button class="btn" data-act="practice-failed">Les retravailler (' + Math.min(failed.length, 20) + ')</button>' + (failed.length > 20 ? '<button class="btn ghost" data-act="practice-failed-all">Toutes (' + failed.length + ')</button>' : '') + '</div>' + listing(failed)
          : '<p class="muted">Aucune erreur en attente. Une question sort de cette liste dès que tu y réponds correctement.</p>') +
      '</section>' +
      '<section class="card"><h2>Questions marquées <small class="muted">(' + flagged.length + ')</small></h2>' +
        (flagged.length
          ? '<div class="actions"><button class="btn" data-act="practice-flagged">Les retravailler</button></div>' + listing(flagged)
          : '<p class="muted">Marque une question pendant un entraînement (bouton ⚐) pour la retrouver ici.</p>') +
      '</section>';
  }

  function viewSettings() {
    const answered = Object.keys(progress.q).length;
    return '<header class="page-head"><div><p class="eyebrow">Données enregistrées dans ce navigateur uniquement</p><h1>Réglages</h1></div></header>' +
      '<section class="card"><h2>Sauvegarde</h2><p class="muted">Ta progression (' + plural(answered, 'question') + ' suivie' + (answered > 1 ? 's' : '') + ', ' + plural(progress.exams.length, 'examen') + ') est stockée dans le navigateur. Exporte-la pour la conserver ou la transférer.</p>' +
        '<div class="actions"><button class="btn" data-act="export">Exporter (JSON)</button><label class="btn ghost">Importer…<input type="file" id="import-file" accept="application/json,.json" hidden></label></div></section>' +
      '<section class="card"><h2>Réinitialisation</h2><p class="muted">Efface toute la progression, l\'historique des examens et la session en cours.</p>' +
        '<div class="actions"><button class="btn danger" data-act="reset">Tout effacer</button></div></section>' +
      '<section class="card"><h2>Raccourcis clavier</h2><ul class="rules"><li><kbd>A</kbd>–<kbd>G</kbd> ou <kbd>1</kbd>–<kbd>7</kbd> : cocher une réponse</li><li><kbd>Entrée</kbd> : valider / question suivante</li><li><kbd>←</kbd> <kbd>→</kbd> : naviguer (examen blanc)</li></ul></section>';
  }

  // ---------- router ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    return { name: parts[0] || '', arg: parts[1] || '' };
  }
  function render() {
    const r = route();
    clearInterval(timerHandle);
    let html;
    switch (r.name) {
      case 'cours': html = viewCourse(r.arg); break;
      case 'entrainement': html = viewPracticeSetup(OCP.byId[r.arg] ? r.arg : ''); break;
      case 'examen': html = viewExamIntro(); break;
      case 'session': html = viewSession(); break;
      case 'resultat': html = viewResult(); break;
      case 'erreurs': html = viewErrors(); break;
      case 'reglages': html = viewSettings(); break;
      default: html = viewDashboard();
    }
    app.innerHTML = html;
    document.querySelectorAll('#nav a').forEach((a) => {
      const target = a.dataset.route;
      const active = target === r.name || (r.name === 'session' && session && target === (session.mode === 'exam' ? 'examen' : 'entrainement'));
      a.classList.toggle('active', active);
    });
    if (r.name === 'entrainement') updatePracticeCount();
    if (r.name === 'session' && session && session.mode === 'exam') startTimer();
  }
  function startTimer() {
    const tick = () => {
      if (!session || session.mode !== 'exam') return clearInterval(timerHandle);
      const left = (session.endsAt - Date.now()) / 1000;
      const el = document.getElementById('timer');
      if (el) {
        el.textContent = clock(left);
        el.classList.toggle('low', left < 600);
      }
      if (left <= 0) {
        clearInterval(timerHandle);
        alert('Temps écoulé : l\'examen est terminé.');
        finishSession();
      }
    };
    tick();
    timerHandle = setInterval(tick, 1000);
  }
  function rerenderSession() {
    save(SESSION, session);
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  // ---------- actions ----------
  const actions = {
    pick(el) {
      const item = session.items[session.idx];
      const q = Q[item.id];
      const oi = Number(el.dataset.opt);
      if (q.answer.length === 1) item.picked = item.picked[0] === oi && session.mode === 'exam' ? [] : [oi];
      else if (item.picked.includes(oi)) item.picked = item.picked.filter((x) => x !== oi);
      else if (item.picked.length < q.answer.length) item.picked.push(oi);
      rerenderSession();
    },
    check() {
      const item = session.items[session.idx];
      if (item.checked || item.picked.length !== Q[item.id].answer.length) return;
      item.checked = true;
      record(item.id, isCorrect(item));
      save(STORE, progress);
      rerenderSession();
    },
    next() {
      if (session.idx < session.items.length - 1) session.idx++;
      save(SESSION, session);
      render();
      window.scrollTo(0, 0);
    },
    prev() {
      if (session.idx > 0) session.idx--;
      save(SESSION, session);
      render();
      window.scrollTo(0, 0);
    },
    goto(el) {
      session.idx = Number(el.dataset.idx);
      save(SESSION, session);
      render();
      window.scrollTo(0, 0);
    },
    flag() {
      const id = session.items[session.idx].id;
      const s = progress.q[id] || (progress.q[id] = { ok: 0, ko: 0 });
      s.flag = !s.flag;
      save(STORE, progress);
      rerenderSession();
    },
    'flag-exam'() {
      const item = session.items[session.idx];
      item.flag = !item.flag;
      rerenderSession();
    },
    quit() {
      finishSession();
    },
    'finish-exam'() {
      const open = session.items.filter((it) => !it.picked.length).length;
      const msg = open ? 'Il reste ' + plural(open, 'question') + ' sans réponse. Terminer quand même ?' : 'Terminer l\'examen et voir le résultat ?';
      if (confirm(msg)) finishSession();
    },
    'start-exam'() {
      if (session && !confirm('Une session est en cours et sera abandonnée. Continuer ?')) return;
      startExam();
    },
    'retry-wrong'() {
      const r = load(LAST, null);
      if (r) startPractice(r.items.filter((it) => !it.ok).map((it) => it.id));
    },
    'practice-failed'() { startPractice(failedIds(), 20); },
    'practice-failed-all'() { startPractice(failedIds()); },
    'practice-flagged'() { startPractice(flaggedIds()); },
    'open-wrong'() { document.querySelectorAll('details.review').forEach((d) => { d.open = d.classList.contains('ko'); }); },
    'close-all'() { document.querySelectorAll('details.review').forEach((d) => { d.open = false; }); },
    'all-topics'() { document.querySelectorAll('[name=topic]:not(:disabled)').forEach((c) => { c.checked = true; }); updatePracticeCount(); },
    'no-topics'() { document.querySelectorAll('[name=topic]').forEach((c) => { c.checked = false; }); updatePracticeCount(); },
    scroll(el) {
      const target = document.getElementById(el.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    export() {
      const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ocp-java21-progression.json';
      a.click();
      URL.revokeObjectURL(a.href);
    },
    reset() {
      if (!confirm('Effacer définitivement toute la progression ?')) return;
      progress = normalizeProgress(null);
      session = null;
      save(STORE, progress);
      save(SESSION, null);
      save(LAST, null);
      render();
    }
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el);
  });
  app.addEventListener('change', (e) => {
    if (e.target.closest('#practice-form')) updatePracticeCount();
    if (e.target.id === 'import-file' && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || typeof data.q !== 'object' || !Array.isArray(data.exams)) throw new Error('format');
          progress = normalizeProgress(data);
          save(STORE, progress);
          alert('Progression importée.');
          render();
        } catch (err) {
          alert('Fichier invalide : ce n\'est pas une sauvegarde de progression.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  });
  app.addEventListener('submit', (e) => {
    if (e.target.id !== 'practice-form') return;
    e.preventDefault();
    if (session && session.mode === 'exam' && !confirm('Un examen blanc est en cours et sera abandonné. Continuer ?')) return;
    const pool = practicePool(e.target);
    startPractice(pool, Number(new FormData(e.target).get('count')));
  });
  document.addEventListener('keydown', (e) => {
    if (route().name !== 'session' || !session || e.ctrlKey || e.metaKey || e.altKey) return;
    const item = session.items[session.idx];
    const key = e.key.toUpperCase();
    let pos = LETTERS.indexOf(key);
    if (pos < 0 && /^[1-7]$/.test(key)) pos = Number(key) - 1;
    const exam = session.mode === 'exam';
    if (pos >= 0 && pos < item.order.length && key.length === 1) {
      if (exam || !item.checked) actions.pick({ dataset: { opt: item.order[pos] } });
      e.preventDefault();
    } else if (e.key === 'Enter') {
      // A focused button already reacts to Enter with its own click.
      if (e.target.closest && e.target.closest('button, a, input, select')) return;
      e.preventDefault();
      if (exam) actions.next();
      else if (!item.checked) actions.check();
      else if (session.idx === session.items.length - 1) actions.quit();
      else actions.next();
    } else if (exam && e.key === 'ArrowRight') actions.next();
    else if (exam && e.key === 'ArrowLeft') actions.prev();
  });

  // ---------- theme ----------
  const storedTheme = load(THEME, null);
  if (storedTheme) document.documentElement.dataset.theme = storedTheme;
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    save(THEME, document.documentElement.dataset.theme);
  });

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  render();
})();
