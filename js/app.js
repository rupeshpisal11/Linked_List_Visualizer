(function () {
  'use strict';

  var KEY = 'llv.progress.v1';
  var THEME_KEY = 'llv.theme';
  var OPS_KEYS = Object.keys(Operations.META);

  var state = {
    list: null,
    lang: 'cpp',
    memory: false,
    speed: 1,
    opKey: null,
    codeTag: null,
    undoStack: [],
    redoStack: [],
    progress: null
  };

  var player, stage;

  function $(id) { return document.getElementById(id); }

  /* ---------- toasts ---------- */
  function toast(title, msg, kind) {
    var box = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = '<b></b><span></span>';
    el.firstChild.textContent = title;
    el.lastChild.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 4600);
    while (box.children.length > 4) box.removeChild(box.firstChild);
  }

  /* ---------- progress ---------- */
  function loadProgress() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return { learned: [], completed: {}, quizBest: 0, challenges: [] };
  }

  function saveProgress() {
    try { localStorage.setItem(KEY, JSON.stringify(state.progress)); } catch (e) { }
  }

  function progressPct() {
    var p = state.progress;
    var learned = p.learned.filter(function (k) { return OPS_KEYS.indexOf(k) >= 0; }).length;
    var chal = p.challenges.length;
    return Math.round(learned / OPS_KEYS.length * 50 + chal / 4 * 30 + Math.min(100, p.quizBest) / 100 * 20);
  }

  function markLearned(op) {
    if (!Operations.META[op]) return;
    if (state.progress.learned.indexOf(op) < 0) {
      state.progress.learned.push(op);
      saveProgress();
      updateProgressUi();
    }
  }

  function markCompleted(op) {
    if (!Operations.META[op]) return;
    state.progress.completed[op] = (state.progress.completed[op] || 0) + 1;
    saveProgress();
    updateProgressUi();
  }

  function updateProgressUi() {
    var pct = progressPct();
    $('progressPct').textContent = pct + '%';
    $('progressMiniBar').style.width = pct + '%';
    if (!$('progressModal').classList.contains('hidden')) renderProgressModal();
  }

  function renderProgressModal() {
    var p = state.progress;
    var pct = progressPct();
    $('progressBigBar').style.width = pct + '%';
    $('progressBigPct').textContent = pct + '%';

    var doneChal = p.challenges.length;
    $('progressStats').innerHTML =
      '<div class="stat"><b>' + p.learned.length + '/' + OPS_KEYS.length + '</b><span>Operations run</span></div>' +
      '<div class="stat"><b>' + doneChal + '/4</b><span>Challenges</span></div>' +
      '<div class="stat"><b>' + p.quizBest + '%</b><span>Quiz best</span></div>';

    $('progressOps').innerHTML = OPS_KEYS.map(function (k) {
      var done = p.learned.indexOf(k) >= 0;
      return '<div class="op-item' + (done ? ' done' : '') + '"><span class="tick">✓</span>' +
        Operations.META[k].name + '</div>';
    }).join('') + [1, 2, 3, 4].map(function (n) {
      var done = p.challenges.indexOf(n) >= 0;
      return '<div class="op-item' + (done ? ' done' : '') + '"><span class="tick">✓</span>Challenge ' + n + '</div>';
    }).join('') +
      '<div class="op-item' + (p.quizBest > 0 ? ' done' : '') + '"><span class="tick">✓</span>Quiz attempted</div>';
  }

  /* ---------- rendering ---------- */
  function typeName(t) {
    return t === 'doubly' ? 'Doubly Linked List' : t === 'circular' ? 'Circular Linked List' : 'Singly Linked List';
  }

  function renderStage(step) {
    stage.__speed = state.speed;
    stage.style.setProperty('--dur', (0.8 / state.speed) + 's');
    Visualizer.render(stage, state.list, {
      highlights: step ? step.highlights : null,
      regs: step ? step.regs : null,
      memory: state.memory,
      interactive: false
    });
    var n = state.list.size();
    $('listInfo').textContent = typeName(state.list.type);
    $('nodeCount').textContent = n + (n === 1 ? ' node' : ' nodes');
  }

  function renderRegs(step) {
    var el = $('regs');
    if (!step || !step.regs) { el.innerHTML = ''; return; }
    el.innerHTML = Object.keys(step.regs).map(function (k) {
      var v = step.regs[k];
      var txt;
      if (v == null) txt = 'null';
      else {
        var node = state.list.getNode(v);
        txt = node ? '[' + node.value + ']' : '[?]';
      }
      var cls = v == null ? 'reg null' : 'reg';
      return '<span class="' + cls + '">' + k + ' = <b>' + txt + '</b></span>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightLine(text) {
    var s = escapeHtml(text);
    var comment = '';
    var ci = s.indexOf('//');
    if (ci >= 0) { comment = s.slice(ci); s = s.slice(0, ci); }
    s = s.replace(/(&quot;|&#39;|'|")[^'"]*\1/g, function (m) { return '<span class="str">' + m + '</span>'; });
    s = s.replace(/\b(void|int|if|else|while|for|return|new|nullptr|null|None|True|False|def|self|class|Node|PROCEDURE|END|WHILE|FOR|IF|THEN|RETURN|CREATE|FUNCTION|OUTPUT|FREE|TO|DO|NOT|NULL)\b/g,
      '<span class="kw">$1</span>');
    if (comment) s += '<span class="cm">' + comment + '</span>';
    return s;
  }

  function renderCode() {
    var block = $('codeBlock');
    var op = state.opKey;
    var snip = op ? LLCode.snippets[op] : null;
    if (!snip) {
      block.innerHTML = '<code>Choose an operation — the line that matches the animation will light up here.</code>';
      return;
    }
    var lines = snip[state.lang] || snip.cpp;
    block.innerHTML = lines.map(function (l, i) {
      var hot = state.codeTag && l[0] === state.codeTag;
      return '<span class="ln' + (hot ? ' hot' : '') + '"><span class="no">' + (i + 1) + '</span>' +
        highlightLine(l[1]) + '</span>';
    }).join('');
  }

  function cxKey(op) {
    if (op === 'traverseReverse') return 'traverse';
    if (op === 'addMany') return 'insertEnd';
    if (op === 'clear' || !op) return null;
    return op;
  }

  function renderComplexityTable() {
    $('cxBody').innerHTML = LLCode.complexityRows.map(function (r) {
      return '<tr data-key="' + r[0] + '"><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>';
    }).join('');
    $('cxNote').innerHTML = LLCode.complexityNote;
  }

  function highlightComplexity(op) {
    var key = cxKey(op);
    Array.prototype.forEach.call($('cxBody').querySelectorAll('tr'), function (tr) {
      tr.classList.toggle('active', key != null && tr.getAttribute('data-key') === key);
    });
  }

  function renderMemory() {
    var card = $('memoryCard');
    if (!state.memory) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    var nodes = state.list.allNodes().slice().sort(function (a, b) {
      return parseInt(LL.addrOf(a.id), 16) - parseInt(LL.addrOf(b.id), 16);
    });
    if (!nodes.length) {
      $('memoryBody').innerHTML = '<tr><td colspan="4">No nodes allocated.</td></tr>';
      return;
    }
    $('memoryBody').innerHTML = nodes.map(function (n) {
      var next = n.next ? LL.addrOf(n.next.id) : 'NULL';
      var prev = state.list.type === 'doubly' ? (n.prev ? LL.addrOf(n.prev.id) : 'NULL') : '—';
      return '<tr><td>' + LL.addrOf(n.id) + '</td><td>' + escapeHtml(n.value) + '</td><td>' +
        next + '</td><td>' + prev + '</td></tr>';
    }).join('');
  }

  function clearPanels() {
    state.codeTag = null;
    renderCode();
    renderRegs(null);
    $('statusLine').textContent = 'Pick an operation on the left to watch it happen, one step at a time.';
    $('stepCounter').textContent = 'Ready';
    $('exWhat').textContent = 'Build a linked list and run operations on it to see how nodes and pointers behave.';
    $('exDoing').textContent = 'Nothing is running yet — press an operation button, then use Next / Play.';
    $('exWhy').textContent = 'Pointers must always be updated in the right order, otherwise part of the list is lost.';
    highlightComplexity(null);
  }

  /* ---------- player ---------- */
  function onStep(step, index, total) {
    if (!step) return;
    state.list = LL.deserialize(step.state);
    state.codeTag = step.codeTag;
    renderStage(step);
    renderRegs(step);
    $('exWhat').textContent = step.what;
    $('exDoing').textContent = step.happening;
    $('exWhy').textContent = step.why;
    $('statusLine').innerHTML = step.status || step.title;
    $('stepCounter').textContent = 'Step ' + (index + 1) + ' / ' + total;
    renderCode();
    highlightComplexity(step.op);
    renderMemory();
    markLearned(step.op);
    if (index === total - 1) markCompleted(step.op);
  }

  function onPlayerState(pl) {
    var play = $('btnPlay');
    play.innerHTML = pl.playing ? '⏸ <span>Pause</span>' : '▶ <span>Play</span>';
    $('btnPrev').disabled = !pl.hasSteps() || pl.isFirst();
    $('btnNext').disabled = !pl.hasSteps() || pl.isLast();
    $('btnRestart').disabled = !pl.hasSteps();
    $('btnSkip').disabled = !pl.hasSteps() || pl.isLast();
    play.disabled = !pl.hasSteps();
  }

  /* ---------- operations ---------- */
  function runOp(key, params) {
    var clone = LL.clone(state.list);
    var res = Operations.run(key, clone, params || {});
    if (res.error) {
      toast('Nothing to run yet', res.error, 'err');
      return false;
    }
    if (!res.steps || !res.steps.length) {
      toast('No steps', 'This operation produced no steps.', 'warn');
      return false;
    }
    state.undoStack.push(LL.serialize(state.list));
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
    state.opKey = key === 'addMany' ? 'insertEnd' : key;
    player.load(res.steps, { autoplay: true });
    return true;
  }

  function parseValue(raw) {
    var v = (raw || '').trim();
    if (!/^-?\d+$/.test(v)) return null;
    return parseInt(v, 10);
  }

  function parseValues(raw) {
    var parts = (raw || '').split(/[\s,;]+/).filter(Boolean);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^-?\d+$/.test(parts[i])) return null;
      out.push(parseInt(parts[i], 10));
    }
    return out.length ? out : null;
  }

  function needValue() {
    toast('Enter a value first',
      'Type a whole number in the Value box (for example 15). You can also type a list like 5,8,13 to add several nodes at once.', 'warn');
    $('inpValue').focus();
    return null;
  }

  function needPos() {
    toast('Enter a position first',
      'Type the position in the Pos box — 1 is the first node. You can also insert at length + 1 to place a node at the end.', 'warn');
    $('inpPos').focus();
    return null;
  }

  /* ---------- history ---------- */
  function undo() {
    if (!state.undoStack.length) {
      toast('Nothing to undo', 'Every operation you run is added to history — try one first.', 'warn');
      return;
    }
    var midOp = player.hasSteps() && !player.isLast();
    var current = LL.serialize(state.list);
    state.list = LL.deserialize(state.undoStack.pop());
    if (midOp) state.redoStack = [];
    else state.redoStack.push(current);
    player.clear();
    state.opKey = null;
    Visualizer.reset(stage);
    renderStage(null);
    clearPanels();
    renderMemory();
    $('stepCounter').textContent = 'Undone';
  }

  function redo() {
    if (!state.redoStack.length) {
      toast('Nothing to redo', 'Undo something first, then redo will bring it back.', 'warn');
      return;
    }
    state.undoStack.push(LL.serialize(state.list));
    state.list = LL.deserialize(state.redoStack.pop());
    player.clear();
    state.opKey = null;
    Visualizer.reset(stage);
    renderStage(null);
    clearPanels();
    renderMemory();
    $('stepCounter').textContent = 'Redone';
  }

  /* ---------- list helpers ---------- */
  function setType(type) {
    if (state.list.type === type) return;
    if (player.hasSteps()) {
      state.undoStack.push(LL.serialize(state.list));
      state.redoStack = [];
      player.clear();
    }
    state.opKey = null;
    state.list.setType(type);
    Visualizer.reset(stage);
    renderStage(null);
    clearPanels();
    renderMemory();
    updateTypeNote(type);
    toast('Switched to ' + typeName(type), typeNoteText(type), 'ok');
  }

  function typeNoteText(t) {
    if (t === 'doubly') return 'Every node now has a prev pointer, head and tail are shown, and both ends end in NULL.';
    if (t === 'circular') return 'The last node points back to head — watch the curved arrow instead of a NULL chip.';
    return 'Each node stores Data | Next and the final node points to NULL.';
  }

  function updateTypeNote(t) {
    $('typeNote').innerHTML = typeNoteText(t);
  }

  function randomList() {
    var n = 4 + Math.floor(Math.random() * 4);
    var vals = [], used = {};
    while (vals.length < n) {
      var v = 5 + Math.floor(Math.random() * 95);
      if (used[v]) continue;
      used[v] = 1;
      vals.push(v);
    }
    state.undoStack.push(LL.serialize(state.list));
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
    player.clear();
    state.opKey = null;
    state.list.build(vals, state.list.type);
    Visualizer.reset(stage);
    renderStage(null);
    clearPanels();
    renderMemory();
    toast('Random list created', vals.join(' → ') + ' — now try an operation on it.', 'ok');
  }

  /* ---------- views ---------- */
  function showView(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.classList.toggle('active', v.id === 'view-' + name);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.nav-btn'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === name);
    });
    if (name === 'visualizer') {
      requestAnimationFrame(function () { renderStage(player.current()); });
    } else if (name === 'practice') {
      Practice.init({
        getDone: function () {
          var o = {};
          state.progress.challenges.forEach(function (id) { o[id] = true; });
          return o;
        },
        onDone: function (id) {
          if (state.progress.challenges.indexOf(id) < 0) {
            state.progress.challenges.push(id);
            saveProgress();
            updateProgressUi();
            toast('Challenge ' + id + ' complete!', 'Nice work — check your learning progress in the top bar.', 'ok');
          }
        }
      });
      requestAnimationFrame(function () { Practice.refresh(); });
    } else if (name === 'quiz') {
      Quiz.init({
        getBest: function () { return state.progress.quizBest; },
        onComplete: function (score, total) {
          var pct = Math.round(score / total * 100);
          if (pct > state.progress.quizBest) {
            state.progress.quizBest = pct;
            saveProgress();
            updateProgressUi();
            toast('New best score!', 'Quiz: ' + pct + '% — progress saved locally.', 'ok');
          } else {
            toast('Quiz finished', 'Score ' + score + '/' + total + ' (' + pct + '%). Best: ' + state.progress.quizBest + '%.', 'ok');
          }
        }
      });
    } else if (name === 'compare') {
      Compare.init();
    }
  }

  /* ---------- wiring ---------- */
  function init() {
    stage = $('stage');
    state.list = new LL.LinkedList('singly');
    state.list.build([10, 20, 30], 'singly');
    state.progress = loadProgress();

    var savedTheme = null;
    try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { }
    document.documentElement.setAttribute('data-theme', savedTheme || 'light');
    updateThemeIcon();

    player = new StepPlayer({ onStep: onStep, onState: onPlayerState });

    renderComplexityTable();
    updateTypeNote('singly');
    Visualizer.reset(stage);
    renderStage(null);
    clearPanels();
    renderMemory();
    updateProgressUi();

    Array.prototype.forEach.call(document.querySelectorAll('.nav-btn, .brand'), function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        showView(el.getAttribute('data-view'));
      });
    });

    Array.prototype.forEach.call($('typeSeg').querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call($('typeSeg').querySelectorAll('button'), function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        setType(b.getAttribute('data-type'));
      });
    });

    $('btnAdd').addEventListener('click', function () {
      var vals = parseValues($('inpValue').value);
      if (!vals) return needValue();
      if (vals.length === 1) runOp('insertEnd', { value: vals[0] });
      else runOp('addMany', { values: vals });
    });

    $('btnInsBegin').addEventListener('click', function () {
      var v = parseValue($('inpValue').value);
      if (v == null) return needValue();
      runOp('insertBegin', { value: v });
    });

    $('btnInsEnd').addEventListener('click', function () {
      var v = parseValue($('inpValue').value);
      if (v == null) return needValue();
      runOp('insertEnd', { value: v });
    });

    $('btnInsPos').addEventListener('click', insertAtPos);

    $('btnDelBegin').addEventListener('click', function () { runOp('deleteBegin', {}); });
    $('btnDelEnd').addEventListener('click', function () { runOp('deleteEnd', {}); });
    $('btnDelPos').addEventListener('click', function () {
      var p = parseValue($('inpPos').value);
      if (p == null) return needPos();
      runOp('deletePos', { pos: p });
    });

    $('btnSearch').addEventListener('click', doSearch);
    $('btnTraverse').addEventListener('click', function () { runOp('traverse', {}); });
    $('btnTraverseRev').addEventListener('click', function () { runOp('traverseReverse', {}); });
    $('btnReverse').addEventListener('click', function () { runOp('reverse', {}); });

    $('btnRandom').addEventListener('click', randomList);
    $('btnClear').addEventListener('click', function () { runOp('clear', {}); });
    $('btnUndo').addEventListener('click', undo);
    $('btnRedo').addEventListener('click', redo);

    $('btnMemory').addEventListener('click', function () {
      state.memory = !state.memory;
      $('btnMemory').classList.toggle('primary', state.memory);
      renderStage(player.current());
      renderMemory();
      toast(state.memory ? 'Memory view on' : 'Memory view off',
        state.memory ? 'Addresses are pseudo-random on purpose: linked list nodes never need to sit next to each other.' : 'Back to the plain visualization.', 'ok');
    });

    $('btnPrev').addEventListener('click', function () { player.pause(); player.prev(); });
    $('btnNext').addEventListener('click', function () { player.pause(); player.next(); });
    $('btnPlay').addEventListener('click', function () { player.toggle(); });
    $('btnRestart').addEventListener('click', function () { player.restart(); });
    $('btnSkip').addEventListener('click', function () {
      player.skipToEnd();
      toast('Skipped to the result', 'Press Restart if you want to watch the steps again.', 'ok');
    });

    $('speed').addEventListener('input', function () {
      state.speed = parseFloat($('speed').value);
      $('speedVal').textContent = (state.speed % 1 === 0 ? state.speed : state.speed.toFixed(2).replace(/0$/, '')) + '×';
      player.setSpeed(state.speed);
      stage.__speed = state.speed;
      stage.style.setProperty('--dur', (0.8 / state.speed) + 's');
    });

    Array.prototype.forEach.call($('codeTabs').querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () {
        Array.prototype.forEach.call($('codeTabs').querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        state.lang = t.getAttribute('data-lang');
        renderCode();
      });
    });

    $('themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { }
      updateThemeIcon();
    });

    $('progressBtn').addEventListener('click', function () {
      $('progressModal').classList.remove('hidden');
      renderProgressModal();
    });
    $('btnCloseProgress').addEventListener('click', function () { $('progressModal').classList.add('hidden'); });
    $('progressModal').addEventListener('click', function (e) {
      if (e.target === $('progressModal')) $('progressModal').classList.add('hidden');
    });
    $('btnResetProgress').addEventListener('click', function () {
      state.progress = { learned: [], completed: {}, quizBest: 0, challenges: [] };
      saveProgress();
      updateProgressUi();
      renderProgressModal();
      toast('Progress reset', 'Your learning progress was cleared from this browser.', 'ok');
    });

    $('inpValue').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btnAdd').click(); });
    $('inpPos').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btnInsPos').click(); });
    $('inpSearch').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (!$('view-visualizer').classList.contains('active')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); player.pause(); player.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); player.pause(); player.prev(); }
      else if (e.key === ' ' || e.key === 'p') { e.preventDefault(); player.toggle(); }
    });

    window.addEventListener('resize', function () {
      if ($('view-visualizer').classList.contains('active')) renderStage(player.current());
    });

    setTimeout(function () {
      toast('Welcome!', 'Pick an operation on the left — every one plays step by step with live pointer changes.', 'ok');
    }, 700);
  }

  function insertAtPos() {
    var v = parseValue($('inpValue').value);
    if (v == null) return needValue();
    var p = parseValue($('inpPos').value);
    if (p == null) return needPos();
    runOp('insertPos', { value: v, pos: p });
  }

  function doSearch() {
    var v = parseValue($('inpSearch').value);
    if (v == null) {
      toast('Enter a value to search', 'Type a whole number (for example 30) and press Search.', 'warn');
      $('inpSearch').focus();
      return;
    }
    runOp('search', { value: v });
  }

  function updateThemeIcon() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('themeIcon').textContent = dark ? '☀' : '◐';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
