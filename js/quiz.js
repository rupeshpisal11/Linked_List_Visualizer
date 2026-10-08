(function (global) {
  'use strict';

  var questions = [
    {
      q: 'What is a linked list?',
      options: [
        'A collection of nodes where each node stores data and a reference to the next node',
        'A group of variables stored next to each other in memory',
        'A tree that can only grow in one direction',
        'A list that can only be read from front to back once'
      ],
      answer: 0,
      why: 'A linked list is a sequence of nodes. Each node holds a value plus a pointer/reference to the next node (and to the previous one in a doubly linked list).'
    },
    {
      q: 'What does the head pointer store?',
      options: [
        'The value of the last node',
        'The address/reference of the first node',
        'How many nodes the list contains',
        'The address of the last node'
      ],
      answer: 1,
      why: 'head always points to the first node. If head is NULL the list is empty. Everything else is reached by following next pointers from head.'
    },
    {
      q: 'What does the next field of a node contain?',
      options: [
        'The value stored in the following node',
        'The position (index) of the following node',
        'The address/reference of the next node, or NULL if there is none',
        'The address of the head'
      ],
      answer: 2,
      why: 'next holds the reference of the next node — never its data or an index. The last node stores NULL to mark the end of the list.'
    },
    {
      q: 'Which statement comparing arrays and linked lists is correct?',
      options: [
        'Arrays allow random access in O(1); linked lists need O(n) to reach the k-th element',
        'Linked lists allow random access in O(1); arrays need O(n)',
        'Both allow O(1) random access',
        'Neither can change size after creation'
      ],
      answer: 0,
      why: 'An array gives you element i directly with base + i × size. A linked list has no indexes — you must follow next pointers i-1 times, so access is O(n).'
    },
    {
      q: 'What is the time complexity of inserting a node at the beginning of a linked list?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      answer: 0,
      why: 'Only two pointer changes are needed (newNode.next = head, head = newNode) — no traversal, so it is constant time, O(1).'
    },
    {
      q: 'Deleting the last node of a SINGLY linked list takes…',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(1) only if the list is sorted'],
      answer: 2,
      why: 'You must walk from the head to find the node BEFORE the last one, because only that node can be changed to NULL. That walk is O(n).'
    },
    {
      q: 'What is the main structural difference between a singly and a doubly linked list?',
      options: [
        'Doubly linked lists store data twice',
        'Each doubly linked node also has a prev pointer to the node before it',
        'Doubly linked lists cannot be circular',
        'Singly linked lists have a tail pointer, doubly ones do not'
      ],
      answer: 1,
      why: 'A doubly linked node has both next and prev. That makes backward traversal and O(1) deletion of a known node possible, at the cost of extra memory.'
    },
    {
      q: 'In a circular linked list…',
      options: [
        'The last node points back to the first node instead of NULL',
        'Every node points to every other node',
        'The list must always contain exactly one node',
        'head points to the last node'
      ],
      answer: 0,
      why: 'Only the ending changes: the tail\'s next points to head, so you can keep looping forever — there is no NULL at the end.'
    },
    {
      q: 'Why must we run newNode.next = head BEFORE head = newNode?',
      options: [
        'Because the compiler requires it',
        'Otherwise the old list would be lost, because head would no longer point anywhere into it',
        'It does not matter — the order is irrelevant',
        'To make the node count correct'
      ],
      answer: 1,
      why: 'head is the only entry point to the list. If you move head first, nothing points to the old first node and the whole chain becomes unreachable.'
    },
    {
      q: 'What is the worst-case time complexity of searching for a value in a linked list?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answer: 2,
      why: 'You may have to compare against every node (or discover the value is missing at the very end), so the worst case is O(n).'
    },
    {
      q: 'Which memory layout usually gives better cache performance?',
      options: [
        'Linked list, because nodes are spread out',
        'Array, because elements are contiguous in memory',
        'Both are always identical',
        'Neither uses the CPU cache'
      ],
      answer: 1,
      why: 'CPUs fetch contiguous blocks of memory. Array elements sit next to each other, so they are loaded together; scattered linked list nodes cause cache misses.'
    },
    {
      q: 'During list reversal, what does the prev variable track?',
      options: [
        'The node that will become the new head when the loop ends',
        'The node that was deleted in the previous step',
        'The tail of the original list only',
        'Nothing — it is always NULL'
      ],
      answer: 0,
      why: 'Each flipped node is stored in prev; when the loop finishes, prev sits on the original last node, which is exactly the new head (head = prev).'
    }
  ];

  var state = { i: 0, score: 0, answered: false, marks: [], answers: [], done: false };
  var handlers = {};
  var started = false;

  function $(id) { return document.getElementById(id); }

  function init(h) {
    handlers = h || {};
    if (started) return;
    started = true;
    state = { i: 0, score: 0, answered: false, marks: [], answers: [], done: false };
    render();
  }

  function render() {
    var body = $('quizBody');
    if (!body) return;
    var bar = $('quizBar');
    var scoreEl = $('quizScore');
    var pct = Math.round((state.done ? questions.length : state.i) / questions.length * 100);
    if (bar) bar.style.width = pct + '%';
    if (scoreEl) scoreEl.textContent = 'Score ' + state.score + ' · Best ' + (handlers.getBest ? handlers.getBest() : 0);

    if (state.done) { renderResult(body); return; }

    var q = questions[state.i];
    var html = '<div class="q-card">' +
      '<div class="q-num">Question ' + (state.i + 1) + ' of ' + questions.length + '</div>' +
      '<div class="q-text">' + q.q + '</div><div class="q-opts">';

    q.options.forEach(function (opt, k) {
      html += '<button class="q-opt" data-k="' + k + '"><span class="key">' +
        String.fromCharCode(65 + k) + '</span><span>' + opt + '</span></button>';
    });

    html += '</div><div class="q-explain" id="qExplain"><b>Explanation:</b> ' + q.why + '</div>' +
      '<div class="q-foot"><div class="q-dots">';
    for (var d = 0; d < questions.length; d++) {
      var cls = state.marks[d] === true ? ' ok' : state.marks[d] === false ? ' no' : (d === state.i ? ' cur' : '');
      html += '<i class="' + cls.trim() + '"></i>';
    }
    html += '</div><div class="btn-row"><button class="btn primary" id="qNext" disabled>' +
      (state.i === questions.length - 1 ? 'See result' : 'Next question') + '</button></div></div></div>';

    body.innerHTML = html;

    Array.prototype.forEach.call(body.querySelectorAll('.q-opt'), function (btn) {
      btn.addEventListener('click', function () { answer(parseInt(btn.getAttribute('data-k'), 10)); });
    });
    var next = $('qNext');
    if (next) next.addEventListener('click', function () {
      if (!state.answered) return;
      state.i++;
      state.answered = false;
      if (state.i >= questions.length) state.done = true;
      render();
    });
  }

  function answer(k) {
    if (state.answered) return;
    state.answered = true;
    var q = questions[state.i];
    var correct = k === q.answer;
    if (correct) state.score++;
    state.marks[state.i] = correct;
    state.answers[state.i] = k;

    var body = $('quizBody');
    Array.prototype.forEach.call(body.querySelectorAll('.q-opt'), function (btn, idx) {
      btn.disabled = true;
      if (idx === q.answer) btn.classList.add('correct');
      else if (idx === k) btn.classList.add('wrong');
    });
    var ex = $('qExplain');
    if (ex) ex.classList.add('show');
    var next = $('qNext');
    if (next) next.disabled = false;

    var scoreEl = $('quizScore');
    if (scoreEl) scoreEl.textContent = 'Score ' + state.score + ' · Best ' + (handlers.getBest ? handlers.getBest() : 0);
    var bar = $('quizBar');
    if (bar) bar.style.width = Math.round((state.i + 1) / questions.length * 100) + '%';
  }

  function renderResult(body) {
    var pct = Math.round(state.score / questions.length * 100);
    var msg = pct >= 90 ? 'Outstanding — you know linked lists inside out.'
      : pct >= 70 ? 'Good work! Review the explanations you missed and try again.'
        : pct >= 50 ? 'You are on the right track — replay a few operations in Step Mode, then retry.'
          : 'Keep going: run each operation in Step Mode first, then come back to the quiz.';

    var review = '<div class="review-list">';
    questions.forEach(function (q, idx) {
      var mark = state.marks[idx];
      var you = typeof state.answers[idx] === 'number' ? q.options[state.answers[idx]] : '—';
      review += '<div class="review-item ' + (mark ? 'ok' : 'no') + '">' +
        '<b>' + (mark ? '✓' : '✕') + ' Q' + (idx + 1) + '. ' + q.q + '</b>' +
        '<span>Your answer: ' + you + '</span>' +
        (mark ? '' : '<span class="fix">Correct: ' + q.options[q.answer] + '</span>') +
        '<em>' + q.why + '</em></div>';
    });
    review += '</div>';

    body.innerHTML = '<div class="q-result">' +
      '<div class="score">' + state.score + '/' + questions.length + '</div>' +
      '<div class="sub">' + pct + '% · ' + msg + '</div>' +
      '<div class="btn-row" style="justify-content:center">' +
      '<button class="btn primary" id="qRetry">Retry quiz</button>' +
      '</div>' + review + '</div>';

    $('qRetry').addEventListener('click', function () {
      state = { i: 0, score: 0, answered: false, marks: [], answers: [], done: false };
      render();
    });

    if (handlers.onComplete) handlers.onComplete(state.score, questions.length);
  }

  global.Quiz = {
    init: init,
    restart: function () {
      state = { i: 0, score: 0, answered: false, marks: [], answers: [], done: false };
      render();
    },
    isDone: function () { return state.done; },
    score: function () { return state.score; },
    count: questions.length
  };
})(typeof window !== 'undefined' ? window : globalThis);
