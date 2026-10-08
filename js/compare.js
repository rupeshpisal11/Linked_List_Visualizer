(function (global) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var rows = [
    ['Memory allocation', 'One contiguous block allocated up front', 'Each node allocated separately, anywhere in memory'],
    ['Random access', 'O(1) — a[i] = base + i × size', 'O(n) — you must follow links from head'],
    ['Insert at front', 'O(n) — every element shifts one cell', 'O(1) — only head changes'],
    ['Delete at front', 'O(n) — every element shifts one cell', 'O(1) — head = head.next'],
    ['Searching', 'O(n); O(log n) possible if sorted + binary search', 'O(n) always — no indexes, no binary search'],
    ['Memory overhead', 'Only the data (plus the array length)', 'Data + next pointer per node (+ prev if doubly)'],
    ['Cache locality', 'Excellent — neighbours sit together in memory', 'Poor — nodes are scattered, each follow is a cache miss'],
    ['Dynamic size', 'Costly — resize means allocate + copy everything', 'Free — just create a node and link it']
  ];

  var arr = [10, 20, 30];
  var addrCounter = 0x3C0;
  var listNodes = [];
  var headId = 0;
  var seeded = false;

  function seed() {
    arr = [10, 20, 30];
    addrCounter = 0x3C0;
    listNodes = [];
    var addrs = [0x100, 0x250, 0x180];
    [10, 20, 30].forEach(function (v, i) {
      listNodes.push({ id: i + 1, value: v, addr: '0x' + addrs[i].toString(16).toUpperCase() });
    });
    headId = 1;
    seeded = true;
  }

  function nextOf(node) {
    if (!node) return null;
    var i = listNodes.indexOf(node);
    return i >= 0 && i < listNodes.length - 1 ? listNodes[i + 1] : null;
  }

  function renderArray(anim) {
    var el = $('cmpArr');
    el.innerHTML = arr.map(function (v, i) {
      return '<div class="arr-cell' + (anim && anim.pop === i ? ' popin' : '') +
        (anim && anim.shift ? ' shifting' : '') + (anim && anim.shiftLeft ? ' shifting-left' : '') +
        '" style="animation-delay:' + (anim && anim.shift ? (i * 0.06) + 's' : '0s') + '">' +
        v + '<span class="idx">index ' + i + '</span></div>';
    }).join('');
  }

  function renderList(anim) {
    var el = $('cmpLl');
    var headNode = listNodes.filter(function (n) { return n.id === headId; })[0];
    var parts = ['<span class="llm-head">HEAD→</span>'];
    var guard = 0, cur = headNode;
    while (cur && guard++ < 10) {
      var nxt = nextOf(cur);
      parts.push('<div class="llm-node' + (anim && anim.pop === cur.id ? ' popin' : '') +
        (anim && anim.pulse ? ' pulse' : '') + '"><span class="d">' + cur.value +
        '</span><span class="n">' + (nxt ? '→' + nxt.addr : '→NULL') + '</span></div>');
      if (nxt) parts.push('<span class="llm-arrow">→</span>');
      cur = nxt;
    }
    if (!headNode) parts.push('<div class="llm-node"><span class="d">∅</span></div>');
    el.innerHTML = parts.join('');
  }

  function renderTable() {
    var t = $('cmpTable');
    t.innerHTML = '<thead><tr><th>Aspect</th><th>Array</th><th>Linked list</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
      }).join('') + '</tbody>';
  }

  function insertFront() {
    arr.unshift(5);
    renderArray({ pop: 0, shift: true });
    $('cmpArrMsg').innerHTML = '<b>Inserted at index 0</b> → every other element had to shift one cell to make room. Cost: <b>O(n)</b>.';

    addrCounter += 0x44;
    var nn = { id: Date.now() % 100000 + addrCounter, value: 5, addr: '0x' + addrCounter.toString(16).toUpperCase() };
    listNodes.unshift(nn);
    headId = nn.id;
    renderList({ pop: nn.id });
    $('cmpLlMsg').innerHTML = '<b>Only the head pointer changed</b> (1 update) — the old head simply became the second node. Cost: <b>O(1)</b>.';
    $('cmpArrCost').textContent = 'shifts: ' + (arr.length - 1) + ' elements';
    $('cmpLlCost').textContent = 'pointer updates: 1';
  }

  function deleteFront() {
    if (!arr.length) {
      $('cmpArrMsg').innerHTML = 'The array is empty — nothing to delete.';
      return;
    }
    arr.shift();
    renderArray({ shiftLeft: true });
    $('cmpArrMsg').innerHTML = '<b>Removed index 0</b> → every remaining element had to shift left. Cost: <b>O(n)</b>.';

    var headNode = listNodes.filter(function (n) { return n.id === headId; })[0];
    if (!headNode) return;
    var i = listNodes.indexOf(headNode);
    listNodes.splice(i, 1);
    headId = listNodes.length ? listNodes[0].id : 0;
    renderList({ pulse: true });
    $('cmpLlMsg').innerHTML = '<b>head = head.next</b> — the old head is simply dropped, no other node moves. Cost: <b>O(1)</b>.';
    $('cmpArrCost').textContent = 'shifts: ' + Math.max(0, arr.length) + ' elements';
    $('cmpLlCost').textContent = 'pointer updates: 1';
  }

  function reset() {
    seed();
    renderArray();
    renderList();
    $('cmpArrMsg').innerHTML = 'Fixed cells side by side — index <b>i</b> is always <b>base + i × size</b>.';
    $('cmpLlMsg').innerHTML = 'Nodes can sit anywhere — each node carries the address of the next one.';
    $('cmpArrCost').textContent = 'contiguous memory';
    $('cmpLlCost').textContent = 'scattered memory';
  }

  function init() {
    if (seeded) return;
    seed();
    renderTable();
    reset();
    $('cmpInsert').addEventListener('click', insertFront);
    $('cmpDelete').addEventListener('click', deleteFront);
    $('cmpReset').addEventListener('click', reset);
  }

  global.Compare = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
