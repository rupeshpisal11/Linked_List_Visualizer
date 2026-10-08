(function (global) {
  'use strict';

  var challenges = [
    {
      id: 1,
      tab: '1 · Insert',
      type: 'gap',
      listType: 'singly',
      values: [10, 20, 30],
      task: 'Given <span class="given">10 → 20 → 30</span>, insert <b>15</b> at <b>position 2</b>. Click the gap where the new node belongs.',
      expectedGap: 2,
      hint: 'Position 2 means 15 becomes the SECOND node: 10 → 15 → 20 → 30. Look for the gap between 10 and 20.',
      success: 'Correct! [10] must point to the new node, and the new node must point to [20] — that is exactly what insert-at-position does.',
      wrong: 'Not quite. Position 2 sits between [10] and [20]. Positions are counted from the head: 1 → 10, 2 → the new slot, 3 → 20.',
      resultValues: [10, 15, 20, 30],
      resultHighlight: 15
    },
    {
      id: 2,
      tab: '2 · Delete',
      type: 'node',
      listType: 'singly',
      values: [10, 20, 30],
      task: 'Delete the node containing <b>20</b>. Click that node.',
      expectedValue: 20,
      hint: '20 is in the middle, so its predecessor [10] must skip over it: 10.next → 30. Click the node that carries 20.',
      success: 'Correct! After deletion [10].next points straight to [30] — the middle node is unlinked and freed.',
      wrong: 'That node should stay. The node to delete is the one whose DATA is 20 — look at the middle cell of each card.',
      resultValues: [10, 30],
      resultHighlight: 30
    },
    {
      id: 3,
      tab: '3 · Search',
      type: 'node',
      listType: 'singly',
      values: [10, 20, 30],
      task: 'Find the value <b>30</b>. Click the node that contains it.',
      expectedValue: 30,
      hint: 'Search always starts at head: compare 30 with 10 (no), then 20 (no), then 30 (yes).',
      success: 'Correct! The search needed 3 comparisons and found 30 at position 3 — that is O(n) work.',
      wrong: 'Not that one. Keep comparing from the head until the values match: 30 == 10? no. 30 == 20? no. 30 == 30? yes.',
      resultValues: [10, 20, 30],
      resultHighlight: 30
    },
    {
      id: 4,
      tab: '4 · Reverse',
      type: 'sequence',
      listType: 'singly',
      values: [10, 20, 30],
      task: 'Reverse <span class="given">10 → 20 → 30</span>. Click the nodes in their NEW order — your first click becomes the new head.',
      expectedSequence: [30, 20, 10],
      hint: 'Reversal turns the list around: the ORIGINAL last node becomes the new head. Read the list backwards.',
      success: 'Correct! 30 → 20 → 10 is the reversed order. head now points at 30 and 10.next finally becomes NULL.',
      wrong: 'Not the right order. The reversed list reads from the original tail to the original head.',
      resultValues: [30, 20, 10],
      resultHighlight: 30
    }
  ];

  var handlers = {};
  var started = false;
  var state = {
    idx: 0,
    selectedGap: null,
    selectedNode: null,
    sequence: [],
    feedback: null,
    done: {},
    solved: false
  };

  function $(id) { return document.getElementById(id); }

  function init(h) {
    handlers = h || {};
    if (started) return;
    started = true;
    state.done = (handlers.getDone && handlers.getDone()) || {};
    renderTabs();
    loadChallenge(0);
    $('btnCheck').addEventListener('click', check);
    $('btnHint').addEventListener('click', hint);
    $('btnResetPractice').addEventListener('click', function () { loadChallenge(state.idx); });
    $('practiceStage').addEventListener('click', onStageClick);
  }

  function current() { return challenges[state.idx]; }

  function renderTabs() {
    var el = $('practiceTabs');
    el.innerHTML = challenges.map(function (c, i) {
      return '<button class="chip' + (i === state.idx ? ' active' : '') +
        (state.done[c.id] ? ' done' : '') + '" data-i="' + i + '">' + c.tab + '</button>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.chip'), function (b) {
      b.addEventListener('click', function () { loadChallenge(parseInt(b.getAttribute('data-i'), 10)); });
    });
    var n = Object.keys(state.done).filter(function (k) { return state.done[k]; }).length;
    $('practiceScore').textContent = n + ' / ' + challenges.length + ' completed';
    renderProgress();
  }

  function renderProgress() {
    var el = $('challengeProgress');
    if (!el) return;
    el.innerHTML = '<h4 style="font-size:.8rem;margin-bottom:4px">Your challenges</h4>' +
      challenges.map(function (c) {
        return '<div class="cp-item' + (state.done[c.id] ? ' done' : '') + '">' +
          '<span class="tick">✓</span>' + c.tab + '</div>';
      }).join('');
  }

  function loadChallenge(i) {
    state.idx = i;
    state.selectedGap = null;
    state.selectedNode = null;
    state.wrongNode = null;
    state.sequence = [];
    state.feedback = null;
    state.solved = false;
    state.list = buildList();
    var c = current();
    $('practiceTask').innerHTML = c.task;
    renderTabs();
    renderFeedback();
    renderAnswerRow();
    draw(true);
  }

  function buildList() {
    var c = current();
    var list = new LL.LinkedList(c.listType);
    list.build(c.values.slice(), c.listType);
    return list;
  }

  function draw(rebuildOrder) {
    var stage = $('practiceStage');
    var c = current();
    var list = state.list;
    if (rebuildOrder) Visualizer.reset(stage);
    stage.__speed = 1;
    var h = { selected: state.selectedNode, wrong: state.wrongNode };
    if (state.solved) {
      h.correct = solvedHighlightId(list);
      h.selected = null;
      h.wrong = null;
    }
    Visualizer.render(stage, list, {
      highlights: h,
      interactive: true,
      gaps: c.type === 'gap' && !state.solved,
      selectedGap: state.selectedGap,
      regs: null
    });
    stage.__list = list;
  }

  function solvedHighlightId(list) {
    var c = current();
    if (!c.resultHighlight) return null;
    var n = list.findFirst(c.resultHighlight);
    return n ? n.id : null;
  }

  function onStageClick(e) {
    var c = current();
    if (state.solved) return;
    var gap = e.target.closest ? e.target.closest('.gap-target') : null;
    var nodeEl = e.target.closest ? e.target.closest('.ll-node') : null;

    if (c.type === 'gap' && gap) {
      state.selectedGap = parseInt(gap.getAttribute('data-gap'), 10);
      state.feedback = null;
      draw(false);
      renderFeedback();
      return;
    }
    if (c.type === 'node' && nodeEl) {
      var id = parseInt(nodeEl.getAttribute('data-id'), 10);
      var list = state.list;
      var node = list.getNode(id);
      state.selectedNode = id;
      state.feedback = null;
      draw(false);
      renderFeedback();
      return;
    }
    if (c.type === 'sequence' && nodeEl) {
      var nid = parseInt(nodeEl.getAttribute('data-id'), 10);
      var lst = state.list;
      var nd = lst.getNode(nid);
      if (!nd) return;
      if (state.sequence.indexOf(nid) < 0) state.sequence.push(nid);
      state.feedback = null;
      draw(false);
      renderAnswerRow();
      renderFeedback();
    }
  }

  function renderAnswerRow() {
    var c = current();
    var row = $('answerRow');
    if (c.type !== 'sequence') { row.innerHTML = ''; return; }
    var list = state.list;
    if (!state.sequence.length) {
      row.innerHTML = '<span>Click nodes to build the reversed list…</span>';
      return;
    }
    row.innerHTML = '<span>Your order:</span>' + state.sequence.map(function (id, i) {
      var n = list.getNode(id);
      return '<span class="answer-chip">' + (n ? n.value : '?') + '</span>' +
        (i < state.sequence.length - 1 ? '<span>→</span>' : '');
    }).join('') + '<button class="btn ghost" id="seqClear" style="padding:4px 10px">clear</button>';
    var sc = $('seqClear');
    if (sc) sc.addEventListener('click', function () {
      state.sequence = [];
      renderAnswerRow();
      draw(false);
    });
  }

  function check() {
    var c = current();
    if (state.solved) {
      setFeedback('hint', 'Already solved — press <b>Reset</b> to try it again.');
      return;
    }
    if (c.type === 'gap') {
      if (state.selectedGap == null) {
        setFeedback('hint', 'Click one of the <b>+</b> gaps in the visualization first, then check your answer.');
        return;
      }
      if (state.selectedGap === c.expectedGap) succeed();
      else setFeedback('bad', '<b>✗ Not that gap.</b> ' + c.wrong);
    } else if (c.type === 'node') {
      if (state.selectedNode == null) {
        setFeedback('hint', 'Click a node in the visualization first.');
        return;
      }
      var list = state.list;
      var node = list.getNode(state.selectedNode);
      if (node && node.value === c.expectedValue) succeed();
      else {
        state.wrongNode = state.selectedNode;
        draw(false);
        setTimeout(function () { state.wrongNode = null; draw(false); }, 900);
        setFeedback('bad', '<b>✗ Wrong node.</b> ' + c.wrong);
      }
    } else if (c.type === 'sequence') {
      if (!state.sequence.length) {
        setFeedback('hint', 'Click the nodes in order to build your answer first.');
        return;
      }
      var chosen = state.sequence.map(function (id) {
        var n = state.list.getNode(id);
        return n ? n.value : null;
      });
      var expected = c.expectedSequence;
      var ok = chosen.length === expected.length && chosen.every(function (v, i) { return v === expected[i]; });
      if (ok) succeed();
      else setFeedback('bad', '<b>✗ Wrong order: ' + chosen.join(' → ') + '.</b> ' + c.wrong);
    }
  }

  function succeed() {
    var c = current();
    state.solved = true;
    state.wrongNode = null;
    state.done[c.id] = true;
    if (c.resultValues) state.list.build(c.resultValues.slice(), c.listType);
    draw(false);
    setFeedback('good', '<b>✓ Correct!</b> ' + c.success);
    renderTabs();
    if (handlers.onDone) handlers.onDone(c.id);
  }

  function hint() {
    setFeedback('hint', '<b>Hint:</b> ' + current().hint);
  }

  function setFeedback(kind, html) {
    state.feedback = { kind: kind, html: html };
    renderFeedback();
  }

  function renderFeedback() {
    var el = $('practiceFeedback');
    if (!state.feedback) {
      el.className = 'feedback';
      el.innerHTML = '';
      return;
    }
    el.className = 'feedback show ' + state.feedback.kind;
    el.innerHTML = state.feedback.html;
  }

  global.Practice = {
    init: init,
    refresh: function () { if (started) { renderTabs(); renderFeedback(); renderAnswerRow(); draw(true); } },
    doneCount: function () {
      return Object.keys(state.done).filter(function (k) { return state.done[k]; }).length;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
