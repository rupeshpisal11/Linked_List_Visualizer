(function (global) {
  'use strict';

  var MAX = 12;

  var META = {
    insertBegin: {
      name: 'Insert at beginning',
      what: 'We are adding a brand-new node in front of the list, so it becomes the new first node.',
      why: 'The new node must be connected to the old list (newNode.next = head) BEFORE we move head. If we moved head first, every existing node would be lost.'
    },
    insertEnd: {
      name: 'Insert at end',
      what: 'We are adding a new node after the last node, extending the list at the back.',
      why: 'A linked list only knows where it starts, so to reach the end we must walk node by node — unless a tail pointer is kept (doubly linked list).'
    },
    insertPos: {
      name: 'Insert at position',
      what: 'We are placing a new node so it ends up at a position you choose.',
      why: 'The node BEFORE the position must point to the new node, and the new node must point to the node that used to follow — in that order, or the rest of the chain is lost.'
    },
    deleteBegin: {
      name: 'Delete at beginning',
      what: 'We are removing the first node so the second node becomes the new head.',
      why: 'head = head.next simply jumps over the first node. No traversal is needed, which is why this operation is O(1).'
    },
    deleteEnd: {
      name: 'Delete at end',
      what: 'We are removing the very last node of the list.',
      why: 'A previous node must be told to point to NULL, so we first have to walk to the node just before the last one — links can only be changed from the node before.'
    },
    deletePos: {
      name: 'Delete at position',
      what: 'We are deleting the node that sits at a position you choose.',
      why: 'The previous node must skip over the deleted node (prev.next = target.next). Forget that link and every node behind it becomes unreachable.'
    },
    search: {
      name: 'Search',
      what: 'We are looking for a value by walking from the head and comparing node by node.',
      why: 'A linked list has no indexes, so the only way to reach the k-th node is to follow next pointers k-1 times. That is why search is O(n).'
    },
    traverse: {
      name: 'Forward traversal',
      what: 'We are visiting every node once, from head to the end, collecting the values in order.',
      why: 'Almost every linked list algorithm is built on traversal: keep a temporary pointer, print / use the node, then move it forward until it becomes NULL.'
    },
    traverseReverse: {
      name: 'Reverse traversal',
      what: 'We are walking the list backwards, from tail to head, using the prev pointers.',
      why: 'Only a doubly linked list can do this: every node stores a prev pointer to the node before it, so we never have to start again from the head.'
    },
    reverse: {
      name: 'Reverse linked list',
      what: 'We are turning the whole list around so the last node becomes the head.',
      why: 'Every node must point to the node that came BEFORE it instead of the one after. We do it one node at a time with prev / current / next so no link is ever lost.'
    },
    clear: {
      name: 'Clear list',
      what: 'We are deleting every node, one by one, until the list is empty.',
      why: 'Each node must be unlinked before it is freed — otherwise the remaining nodes would become unreachable and leak memory.'
    }
  };

  function capError() {
    return 'That would push the list past ' + MAX + ' nodes. The visualizer keeps lists at ' + MAX +
      ' or fewer so every node and pointer stays readable — delete a node first.';
  }

  function fmtList(list) {
    var vals = list.values();
    if (!vals.length) return 'empty list';
    var s = vals.join('  →  ');
    if (list.type === 'circular') s += '  →  (back to head)';
    return s;
  }

  function Runner(list, key) {
    this.list = list;
    this.key = key;
    this.meta = META[key];
    this.steps = [];
  }

  Runner.prototype.step = function (s) {
    s = s || {};
    var meta = this.meta;
    this.steps.push({
      op: this.key,
      title: s.title || '',
      what: s.what || meta.what,
      happening: s.happening || '',
      why: s.why || meta.why,
      status: s.status || '',
      codeTag: s.codeTag || null,
      comparisons: s.comparisons != null ? s.comparisons : null,
      result: s.result != null ? s.result : null,
      highlights: Object.assign({
        current: null, visited: [], newNode: null, deleting: null,
        found: null, compare: null, linkChanged: [], placeNew: null
      }, s.highlights || {}),
      regs: s.regs || null,
      state: LL.serialize(this.list)
    });
  };

  function intro(run, over) {
    run.step(Object.assign({
      title: 'Start · ' + run.meta.name,
      happening: run.meta.what + ' The list below is the real data structure — every step you see changes it.',
      codeTag: 'sig',
      status: 'Current list: ' + fmtList(run.list)
    }, over || {}));
  }

  function outro(run, over) {
    run.step(Object.assign({
      title: 'Done · ' + run.meta.name,
      happening: 'The operation is complete. The list is now: ' + fmtList(run.list) + '. Press Prev to replay any step.',
      codeTag: null,
      status: 'Result: ' + fmtList(run.list)
    }, over || {}));
  }

  function walkTo(run, targetIndex, opts) {
    opts = opts || {};
    var list = run.list, c = list.head, i = 0, seen = new Set(), visited = [];
    while (c && !seen.has(c)) {
      seen.add(c);
      visited.push(c.id);
      var reached = i === targetIndex;
      run.step({
        title: i === 0 ? (opts.firstTitle || '1. Start at head') : ('Traverse · step ' + (i + 1)),
        codeTag: i === 0 ? 'init' : 'advance',
        status: 'temp → [' + c.value + ']   · position ' + (i + 1) +
          (reached ? (opts.stopNote || '  · stop here') : ''),
        happening: i === 0
          ? 'A temporary pointer starts at head and looks at node 1 (value ' + c.value + ').'
          : 'temp moves forward one link to node ' + (i + 1) + ' (value ' + c.value + ').',
        highlights: { current: c.id, visited: visited.slice() },
        regs: { temp: c.id }
      });
      if (reached) return c;
      c = c.next;
      i++;
      if (i > 64) break;
    }
    return null;
  }

  function walkLast(run, firstTitle) {
    var list = run.list, c = list.head, seen = new Set(), visited = [], first = true;
    while (c && !seen.has(c)) {
      seen.add(c);
      visited.push(c.id);
      var isLast = list.type === 'circular' ? (c.next === list.head) : (c.next === null);
      run.step({
        title: first ? (firstTitle || '2. Start at head') : 'Traverse · temp = [' + c.value + ']',
        codeTag: first ? 'init' : 'advance',
        status: 'temp → [' + c.value + ']' + (isLast ? '   · this is the last node' : ''),
        happening: isLast
          ? 'temp->next is ' + (list.type === 'circular' ? 'head' : 'NULL') + ', so temp is the last node — this is where we attach the new one.'
          : 'temp is not the end yet, so we follow its next pointer.',
        highlights: { current: c.id, visited: visited.slice() },
        regs: { temp: c.id }
      });
      if (isLast) return c;
      c = c.next;
      first = false;
      if (i64Guard()) return null;
    }
    return null;
    function i64Guard() { return visited.length > 64; }
  }

  function pushInsertEnd(run, value) {
    var list = run.list;

    if (!list.head) {
      var n0 = list.createNode(value);
      run.step({
        title: '1. Create new node',
        codeTag: 'create',
        status: 'newNode = new Node(' + value + ')',
        happening: 'The list is empty, so we create a node with value ' + value + '. It is not connected to anything yet.',
        highlights: { newNode: n0.id, placeNew: { index: 0 } }
      });
      list.head = n0;
      list.tail = n0;
      if (list.type === 'circular') n0.next = n0;
      run.step({
        title: '2. head = newNode (list was empty)',
        codeTag: 'init',
        status: 'head = tail = [' + value + ']',
        happening: 'Because the list was empty, the new node becomes both head and tail' +
          (list.type === 'circular' ? ' — and it points to itself, so the circle stays closed.' : '.'),
        highlights: { current: n0.id, linkChanged: [{ id: n0.id, field: 'next' }] }
      });
      return;
    }

    var n = list.createNode(value);
    run.step({
      title: '1. Create new node',
      codeTag: 'create',
      status: 'newNode = new Node(' + value + ')',
      happening: 'A brand-new node holding ' + value + ' is created. Its next pointer is still empty.',
      highlights: { newNode: n.id, placeNew: { index: 999 } }
    });

    if (list.type === 'doubly') {
      var t = list.tail;
      run.step({
        title: '2. Use the tail pointer',
        codeTag: 'link',
        status: 'temp = tail [' + t.value + ']',
        happening: 'A doubly linked list always knows its last node, so we can skip the walk entirely — this is what makes insert-at-end O(1).',
        highlights: { current: t.id, visited: [t.id] },
        regs: { temp: t.id }
      });
    } else {
      walkLast(run);
    }

    var last = list.tail && list.type === 'doubly' ? list.tail : walkLastTail(list);
    last.next = n;
    run.step({
      title: list.type === 'doubly' ? '3. tail.next = newNode' : '3. last.next = newNode',
      codeTag: 'link',
      status: '[' + last.value + '].next → [' + value + ']',
      happening: 'The last node, which used to point to NULL, now points to the new node — the chain is joined.',
      highlights: { newNode: n.id, linkChanged: [{ id: last.id, field: 'next' }] }
    });

    if (list.type === 'doubly') {
      n.prev = last;
      run.step({
        title: '4. newNode.prev = tail',
        codeTag: 'dll',
        status: 'newNode.prev ← [' + last.value + ']',
        happening: 'We also fill the prev pointer of the new node so it can point backwards.',
        highlights: { newNode: n.id, linkChanged: [{ id: n.id, field: 'prev' }] }
      });
    }

    if (list.type === 'circular') {
      n.next = list.head;
      run.step({
        title: '4. newNode.next = head (keep the circle)',
        codeTag: 'circle',
        status: 'newNode.next → head [' + list.head.value + ']',
        happening: 'In a circular list the last node must never point to NULL — it points back to head instead.',
        highlights: { newNode: n.id, linkChanged: [{ id: n.id, field: 'next' }] }
      });
    }

    list.tail = n;
    run.step({
      title: list.type === 'circular' ? '5. tail = newNode' : (list.type === 'doubly' ? '5. tail = newNode' : '4. tail = newNode'),
      codeTag: 'settail',
      status: 'tail → [' + value + ']',
      happening: 'The tail pointer is moved so the list remembers its new last node.',
      highlights: { current: n.id }
    });
  }

  function walkLastTail(list) {
    var c = list.head, seen = new Set();
    while (c && !seen.has(c)) {
      seen.add(c);
      if (list.type === 'circular' ? c.next === list.head : c.next === null) return c;
      c = c.next;
    }
    return list.tail || c;
  }

  function insertBegin(list, value) {
    if (list.allNodes().length >= MAX) return { error: capError() };
    var run = new Runner(list, 'insertBegin');
    intro(run);

    var n = list.createNode(value);
    run.step({
      title: '1. Create new node',
      codeTag: 'create',
      status: 'newNode = new Node(' + value + ')',
      happening: 'A new node holding ' + value + ' is created. For now it floats alone — nothing points to it.',
      highlights: { newNode: n.id, placeNew: { index: 0 } }
    });

    var oldHead = list.head;
    n.next = list.head;
    run.step({
      title: '2. newNode.next = head',
      codeTag: 'link',
      status: oldHead ? 'newNode.next → [' + oldHead.value + ']' : 'newNode.next → NULL',
      happening: oldHead
        ? 'The new node is connected to the old first node, so nothing in the list is lost.'
        : 'The list was empty, so the new node points to NULL for now.',
      highlights: { newNode: n.id, linkChanged: [{ id: n.id, field: 'next' }] }
    });

    if (list.type === 'circular' && oldHead) {
      var tailNode = list.tail;
      tailNode.next = n;
      run.step({
        title: '3. tail.next = newNode (reconnect the circle)',
        codeTag: 'circle',
        status: '[' + tailNode.value + '].next → [' + value + ']',
        happening: 'In a circular list the old last node must point to the new head, otherwise the circle breaks.',
        highlights: { newNode: n.id, linkChanged: [{ id: tailNode.id, field: 'next' }] }
      });
    }

    list.head = n;
    if (!list.tail) list.tail = n;
    run.step({
      title: list.type === 'circular' && oldHead ? '4. head = newNode' : '3. head = newNode',
      codeTag: 'sethead',
      status: 'head → [' + value + ']',
      happening: 'head now points at the new node — it is officially the first node of the list.',
      highlights: { current: n.id }
    });

    if (list.type === 'doubly' && oldHead) {
      oldHead.prev = n;
      run.step({
        title: '4. old head.prev = newNode',
        codeTag: 'dll',
        status: '[' + oldHead.value + '].prev → [' + value + ']',
        happening: 'The old first node gets its prev pointer filled in, so it can point back to the new head.',
        highlights: { linkChanged: [{ id: oldHead.id, field: 'prev' }] }
      });
      n.prev = null;
      run.step({
        title: '5. newNode.prev = NULL',
        codeTag: 'dll2',
        status: 'newNode.prev → NULL',
        happening: 'The first node has nothing before it, so its prev pointer stays NULL.',
        highlights: { current: n.id }
      });
    }

    outro(run);
    return { steps: run.steps };
  }

  function insertEnd(list, value, opts) {
    opts = opts || {};
    if (list.allNodes().length >= MAX) return { error: capError() };
    var run = new Runner(list, 'insertEnd');
    if (!opts.quiet) intro(run);
    pushInsertEnd(run, value);
    if (!opts.quiet) outro(run);
    return { steps: run.steps };
  }

  function addMany(list, values) {
    if (!values.length) return { error: 'Enter at least one value, for example: 15 or 5,8,13' };
    if (list.allNodes().length + values.length > MAX) {
      return { error: 'Adding ' + values.length + ' node(s) would pass the ' + MAX + '-node limit. ' +
        'The list currently has ' + list.allNodes().length + ' node(s).' };
    }
    var run = new Runner(list, 'insertEnd');
    intro(run, {
      happening: 'We will append ' + values.length + ' node(s) one after another: ' +
        values.join(', ') + '. Watch the tail walk forward every time.',
      status: 'Adding: ' + values.join(', ')
    });
    values.forEach(function (v) { pushInsertEnd(run, v); });
    outro(run);
    return { steps: run.steps };
  }

  function insertPos(list, value, pos) {
    if (list.allNodes().length >= MAX) return { error: capError() };
    var n = list.size();
    if (!Number.isInteger(pos) || pos < 1 || pos > n + 1) {
      return { error: 'Position ' + pos + ' is out of range. This list has ' + n +
        ' node(s), so valid positions are 1 to ' + (n + 1) + ' (' + (n + 1) + ' = at the end).' };
    }
    if (pos === 1) return insertBegin(list, value);
    if (pos === n + 1) return insertEnd(list, value);

    var run = new Runner(list, 'insertPos');
    intro(run, { status: 'List: ' + fmtList(list) + '   ·   insert ' + value + ' at position ' + pos });

    var nn = list.createNode(value);
    run.step({
      title: '1. Create new node',
      codeTag: 'create',
      status: 'newNode = new Node(' + value + ')',
      happening: 'We create the node first. It will end up between positions ' + (pos - 1) + ' and ' + (pos + 1) + '.',
      highlights: { newNode: nn.id, placeNew: { index: pos - 1 } }
    });

    var temp = walkTo(run, pos - 2, {
      firstTitle: '2. Start at head',
      stopNote: '· temp is the node before position ' + pos,
      stopNoteIsDefault: true
    });
    if (!temp) return { error: 'Could not reach position ' + pos + ' — the list changed unexpectedly.' };

    run.step({
      title: '3. temp is the previous node',
      codeTag: 'loop',
      status: 'temp → [' + temp.value + ']  (node before position ' + pos + ')',
      happening: 'temp now sits exactly one node before where the new node must go. Insertion happens between temp and temp.next.',
      highlights: { current: temp.id },
      regs: { temp: temp.id }
    });

    var after = temp.next;
    nn.next = after;
    run.step({
      title: '4. newNode.next = temp.next',
      codeTag: 'link1',
      status: 'newNode.next → ' + (after ? '[' + after.value + ']' : 'NULL'),
      happening: 'The new node first grabs the rest of the list. Doing this before touching temp means nothing can be lost.',
      highlights: { newNode: nn.id, linkChanged: [{ id: nn.id, field: 'next' }] }
    });

    if (list.type === 'doubly' && after) {
      nn.prev = temp;
      run.step({
        title: '5. newNode.prev = temp',
        codeTag: 'dll',
        status: 'newNode.prev → [' + temp.value + ']',
        happening: 'The new node remembers the node that will sit in front of it.',
        highlights: { newNode: nn.id, linkChanged: [{ id: nn.id, field: 'prev' }] }
      });
      after.prev = nn;
      run.step({
        title: '6. after.prev = newNode',
        codeTag: 'dll2',
        status: '[' + after.value + '].prev → [' + value + ']',
        happening: 'The node that used to follow temp now points back to the new node.',
        highlights: { linkChanged: [{ id: after.id, field: 'prev' }] }
      });
    }

    temp.next = nn;
    run.step({
      title: list.type === 'doubly' ? '7. temp.next = newNode' : '5. temp.next = newNode',
      codeTag: 'link2',
      status: '[' + temp.value + '].next → [' + value + ']',
      happening: 'Finally temp points forward to the new node — the insertion is complete.',
      highlights: { linkChanged: [{ id: temp.id, field: 'next' }], newNode: nn.id }
    });

    outro(run, { happening: 'Done — the list is now ' + fmtList(list) + '. ' + value + ' sits at position ' + pos + '.' });
    return { steps: run.steps };
  }

  function deleteBegin(list) {
    if (!list.head) return { error: 'The list is empty, so there is no first node to delete. Add a node first — empty-list mistakes are the most common bug in linked list code.' };
    var run = new Runner(list, 'deleteBegin');
    intro(run);

    var old = list.head;
    run.step({
      title: '1. Look at the head node',
      codeTag: 'init',
      status: 'temp → [' + old.value + ']',
      happening: 'The node we are about to remove is the current head — the only node the list knows about directly.',
      highlights: { current: old.id, deleting: old.id },
      regs: { temp: old.id }
    });

    if (list.size() === 1) {
      var only = old;
      only.next = null;
      only.prev = null;
      list.head = null;
      list.tail = null;
      list.unregister(only);
      run.step({
        title: '2. head = head.next → NULL',
        codeTag: 'sethead',
        status: 'head → NULL  · list is now empty',
        happening: 'There was only one node, so following its next pointer leads to NULL. The list is empty now.',
        highlights: { deleting: only.id }
      });
      outro(run, { happening: 'The list is now empty. Every operation you run next will start from head = NULL.' });
      return { steps: run.steps };
    }

    var newHead = old.next;
    list.head = newHead;
    run.step({
      title: '2. head = head.next',
      codeTag: 'sethead',
      status: 'head → [' + newHead.value + ']',
      happening: 'head skips the first node and lands on the second one. The old head is no longer part of the list.',
      highlights: { deleting: old.id, linkChanged: [] }
    });

    if (list.type === 'circular') {
      var tailNode = list.tail;
      tailNode.next = newHead;
      run.step({
        title: '3. tail.next = head (reconnect the circle)',
        codeTag: 'circle',
        status: '[' + tailNode.value + '].next → [' + newHead.value + ']',
        happening: 'The circle is stitched back together so the last node points to the new head instead of the deleted node.',
        highlights: { deleting: old.id, linkChanged: [{ id: tailNode.id, field: 'next' }] }
      });
    }

    if (list.type === 'doubly') {
      newHead.prev = null;
      run.step({
        title: '3. new head.prev = NULL',
        codeTag: 'dll',
        status: '[' + newHead.value + '].prev → NULL',
        happening: 'The new first node has nothing before it, so its prev pointer becomes NULL.',
        highlights: { deleting: old.id, linkChanged: [{ id: newHead.id, field: 'prev' }] }
      });
    }

    list.unregister(old);
    run.step({
      title: list.type === 'doubly' ? '4. free the old node' : '3. free the old node',
      codeTag: 'free',
      status: 'deleted [' + old.value + ']',
      happening: 'The detached node is freed (in Java/Python it is simply garbage collected). Watch it fade away.',
      highlights: { deleting: old.id }
    });

    outro(run);
    return { steps: run.steps };
  }

  function deleteEnd(list) {
    if (!list.head) return { error: 'The list is empty — there is nothing at the end to delete. Add a node first.' };
    var run = new Runner(list, 'deleteEnd');
    intro(run);

    if (list.size() === 1) {
      var only = list.head;
      run.step({
        title: '1. Only one node in the list',
        codeTag: 'init',
        status: 'temp → [' + only.value + ']',
        happening: 'With a single node, deleting the end is the same as deleting the beginning.',
        highlights: { current: only.id, deleting: only.id },
        regs: { temp: only.id }
      });
      only.next = null;
      list.head = null;
      list.tail = null;
      list.unregister(only);
      run.step({
        title: '2. head = NULL',
        codeTag: 'free',
        status: 'list is now empty',
        happening: 'The node is removed and head becomes NULL.',
        highlights: { deleting: only.id }
      });
      outro(run);
      return { steps: run.steps };
    }

    if (list.type === 'doubly') {
      var t = list.tail;
      run.step({
        title: '1. Read the tail pointer',
        codeTag: 'init',
        status: 'target = tail [' + t.value + ']',
        happening: 'The tail pointer tells us the last node immediately — no walking required.',
        highlights: { current: t.id, deleting: t.id },
        regs: { temp: t.id }
      });
      var prevNode = t.prev;
      prevNode.next = null;
      run.step({
        title: '2. previous.next = NULL',
        codeTag: 'link',
        status: '[' + prevNode.value + '].next → NULL',
        happening: 'The second-to-last node stops pointing at the node we are removing.',
        highlights: { deleting: t.id, linkChanged: [{ id: prevNode.id, field: 'next' }] }
      });
      t.prev = null;
      list.tail = prevNode;
      run.step({
        title: '3. tail = previous node',
        codeTag: 'settail',
        status: 'tail → [' + prevNode.value + ']',
        happening: 'The tail pointer now marks the new last node.',
        highlights: { current: prevNode.id, deleting: t.id }
      });
      list.unregister(t);
      run.step({
        title: '4. free the old tail',
        codeTag: 'free',
        status: 'deleted [' + t.value + ']',
        happening: 'The old tail is detached and freed — watch it fade away.',
        highlights: { deleting: t.id }
      });
      outro(run);
      return { steps: run.steps };
    }

    var seen = new Set(), visited = [], first = true;
    var temp = list.head;
    for (;;) {
      var nx = temp.next;
      var nextIsLast = nx ? (list.type === 'circular' ? nx.next === list.head : nx.next === null) : false;
      seen.add(temp.id); visited.push(temp.id);
      run.step({
        title: first ? '1. Start at head' : (nextIsLast ? 'temp is one node before the end' : 'Traverse · temp = [' + temp.value + ']'),
        codeTag: first ? 'init' : 'advance',
        status: 'temp → [' + temp.value + ']' + (nextIsLast ? '   · temp.next is the last node' : ''),
        happening: first
          ? 'We walk forward until temp->next->next is ' + (list.type === 'circular' ? 'head' : 'NULL') +
            ', which leaves temp sitting exactly one node before the last one.'
          : (nextIsLast
            ? 'temp->next->next is ' + (list.type === 'circular' ? 'head' : 'NULL') + ', so temp is the node right before the end.'
            : 'temp is not close enough to the end yet, so we follow its next pointer.'),
        highlights: { current: temp.id, visited: visited.slice() },
        regs: { temp: temp.id }
      });
      if (nextIsLast || !nx) break;
      temp = nx;
      first = false;
      if (visited.length > 64) break;
    }
    var target = temp.next;
    if (!target) return { error: 'Could not reach the end of the list.' };
    run.step({
      title: '2. target = temp.next',
      codeTag: 'target',
      status: 'target = [' + target.value + ']',
      happening: 'temp sits one node before the end. Its next pointer holds the node we are about to delete.',
      highlights: { current: target.id, deleting: target.id },
      regs: { temp: temp.id, target: target.id }
    });

    if (list.type === 'circular') {
      temp.next = list.head;
      list.tail = temp;
      run.step({
        title: '3. tail = temp (circle skips the old tail)',
        codeTag: 'settail',
        status: 'tail → [' + temp.value + ']',
        happening: 'In a circular list the last node points to head, so after the removal temp becomes the new tail.',
        highlights: { deleting: target.id, linkChanged: [{ id: temp.id, field: 'next' }] }
      });
    } else {
      temp.next = null;
      list.tail = temp;
      run.step({
        title: '3. temp.next = NULL',
        codeTag: 'link',
        status: '[' + temp.value + '].next → NULL',
        happening: 'The previous node now points to NULL — the list ends here.',
        highlights: { deleting: target.id, linkChanged: [{ id: temp.id, field: 'next' }] }
      });
      run.step({
        title: '4. tail = temp',
        codeTag: 'settail',
        status: 'tail → [' + temp.value + ']',
        happening: 'The tail pointer is moved to the new last node.',
        highlights: { deleting: target.id }
      });
    }

    list.unregister(target);
    run.step({
      title: list.type === 'circular' ? '4. free the old tail' : '5. free the old tail',
      codeTag: 'free',
      status: 'deleted [' + target.value + ']',
      happening: 'The removed node is freed. Notice how every other node stayed exactly where it was.',
      highlights: { deleting: target.id }
    });

    outro(run);
    return { steps: run.steps };
  }

  function deletePos(list, pos) {
    if (!list.head) return { error: 'The list is empty — there is nothing to delete. Add a node first.' };
    var n = list.size();
    if (!Number.isInteger(pos) || pos < 1 || pos > n) {
      return { error: 'Position ' + pos + ' is out of range. This list has ' + n +
        ' node(s), so valid positions are 1 to ' + n + '.' };
    }
    if (pos === 1) return deleteBegin(list);
    if (pos === n) return deleteEnd(list);

    var run = new Runner(list, 'deletePos');
    intro(run, { status: 'List: ' + fmtList(list) + '   ·   delete position ' + pos });

    var temp = walkTo(run, pos - 2, { firstTitle: '1. Start at head', stopNote: '· temp is the previous node' });
    if (!temp) return { error: 'Could not reach position ' + pos + '.' };

    var target = temp.next;
    run.step({
      title: '3. target = temp.next',
      codeTag: 'target',
      status: 'target = [' + target.value + ']  (position ' + pos + ')',
      happening: 'We found the node to delete: position ' + pos + ', value ' + target.value +
        '. temp is the node in front of it — the only one that can change the link.',
      highlights: { current: target.id, deleting: target.id },
      regs: { temp: temp.id }
    });

    temp.next = target.next;
    run.step({
      title: '4. temp.next = target.next',
      codeTag: 'link',
      status: '[' + temp.value + '].next → ' + (target.next ? '[' + target.next.value + ']' : 'NULL'),
      happening: 'temp skips over the deleted node and connects to whatever came after it. The chain stays complete.',
      highlights: { deleting: target.id, linkChanged: [{ id: temp.id, field: 'next' }] }
    });

    if (list.type === 'doubly' && target.next) {
      target.next.prev = temp;
      run.step({
        title: '5. after.prev = temp',
        codeTag: 'dll',
        status: '[' + target.next.value + '].prev → [' + temp.value + ']',
        happening: 'The node behind the deleted one gets its prev pointer fixed as well.',
        highlights: { deleting: target.id, linkChanged: [{ id: target.next.id, field: 'prev' }] }
      });
    }

    if (list.tail === target) list.tail = temp;

    list.unregister(target);
    run.step({
      title: list.type === 'doubly' ? '6. free the target node' : '5. free the target node',
      codeTag: 'free',
      status: 'deleted [' + target.value + ']',
      happening: 'The node is detached from the chain and freed — it slides away, while the rest of the list snaps together.',
      highlights: { deleting: target.id }
    });

    outro(run);
    return { steps: run.steps };
  }

  function search(list, value) {
    if (!list.head) {
      return { error: 'The list is empty: head is NULL, so there is no node to compare with. Add a node before searching.' };
    }
    var run = new Runner(list, 'search');
    intro(run, { status: 'Looking for ' + value + ' in: ' + fmtList(list) });

    var temp = list.head;
    run.step({
      title: '1. temp = head, position = 1',
      codeTag: 'init',
      status: 'temp → [' + temp.value + ']  · position 1',
      happening: 'We start at the head with a position counter, ready to compare.',
      highlights: { current: temp.id },
      regs: { temp: temp.id }
    });

    var comparisons = 0, found = null, i = 0, seen = new Set(), visited = [];
    while (temp && !seen.has(temp)) {
      seen.add(temp);
      comparisons++;
      var match = temp.value === value;
      run.step({
        title: '2. Compare: ' + value + ' == ' + temp.value + ' ?',
        codeTag: 'compare',
        status: 'Searching: ' + value + ' == ' + temp.value + ' ?  ' + (match ? 'Yes' : 'No'),
        happening: match
          ? 'The values match — this is the node we were looking for.'
          : 'The values are different, so the search continues along the next pointer.',
        highlights: { compare: temp.id, current: temp.id, visited: visited.slice() },
        comparisons: comparisons,
        regs: { temp: temp.id }
      });
      if (match) { found = temp; break; }
      visited.push(temp.id);
      temp = temp.next;
      i++;
      if (i > 64) break;
      if (temp) {
        run.step({
          title: '3. temp = temp.next',
          codeTag: 'advance',
          status: 'temp → [' + temp.value + ']  · position ' + (i + 1),
          happening: 'No match yet, so we follow the next pointer to node ' + (i + 1) + '.',
          highlights: { current: temp.id, visited: visited.slice() },
          comparisons: comparisons,
          regs: { temp: temp.id }
        });
      }
    }

    if (found) {
      var pos = list.positionOf(found);
      var dupes = list.countValue(value);
      run.step({
        title: '✓ Value ' + value + ' found at position ' + pos,
        codeTag: 'found',
        status: '<span class="ok">✓ Value ' + value + ' found at position ' + pos + '</span>',
        happening: 'The comparison succeeded, so we return position ' + pos + ' immediately and stop traversing.',
        highlights: { found: found.id, visited: visited },
        comparisons: comparisons,
        result: 'found at position ' + pos,
        why: dupes > 1
          ? 'This value appears ' + dupes + ' times — a plain search always stops at the FIRST match, which is why duplicates matter when you compare results.'
          : META.search.why,
        regs: { temp: found.id }
      });
    } else {
      run.step({
        title: '✕ Value not found',
        codeTag: 'notfound',
        status: '<span class="no">✕ Value ' + value + ' not found</span>',
        happening: 'temp became NULL — we walked past the end without a match, so the value is not in this list.',
        highlights: { visited: visited },
        comparisons: comparisons,
        result: 'not found'
      });
    }

    run.step({
      title: 'Search finished · ' + comparisons + ' comparison' + (comparisons === 1 ? '' : 's'),
      codeTag: null,
      status: comparisons + ' comparison' + (comparisons === 1 ? '' : 's') + ' performed · ' +
        (found ? 'found at position ' + list.positionOf(found) : 'value not present'),
      happening: found
        ? 'Total cost: ' + comparisons + ' comparison' + (comparisons === 1 ? '' : 's') + ' — in the worst case (value at the end or missing) it is one comparison per node, i.e. O(n).'
        : 'Total cost: ' + comparisons + ' comparison' + (comparisons === 1 ? '' : 's') + ' — proving a value is missing always costs a full walk, i.e. O(n).',
      comparisons: comparisons,
      highlights: { found: found ? found.id : null, visited: visited }
    });

    return { steps: run.steps };
  }

  function traverse(list, reverse) {
    var key = reverse ? 'traverseReverse' : 'traverse';
    if (reverse && list.type !== 'doubly') {
      return { error: reverse && list.type === 'circular'
        ? 'A circular list here stores only next pointers, so we cannot walk backwards. Switch to a Doubly linked list to use reverse traversal.'
        : 'A singly linked list has no prev pointers — there is no way to go back. Switch to a Doubly linked list to see reverse traversal.' };
    }
    var run = new Runner(list, key);
    intro(run, { status: reverse ? 'Start at tail' : 'Start at head' });

    if (!list.head) {
      run.step({
        title: 'head is NULL',
        codeTag: 'loop',
        status: 'Traversal: nothing to visit',
        happening: 'head is NULL, so the loop condition fails immediately and no node is ever visited. An empty list simply produces no output.',
        result: '(empty)'
      });
      return { steps: run.steps };
    }

    var nodes = list.chain();
    if (reverse) nodes = nodes.slice().reverse();
    var start = nodes[0];
    var out = [];

    run.step({
      title: reverse ? '1. temp = tail' : '1. temp = head',
      codeTag: 'init',
      status: (reverse ? 'temp → [' : 'temp → [') + start.value + ']',
      happening: reverse
        ? 'The walk starts at the tail, thanks to the tail pointer, and will follow prev backwards.'
        : 'A temporary pointer is placed at head — this is where every traversal begins.',
      highlights: { current: start.id },
      regs: { temp: start.id }
    });

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      out.push(node.value);
      run.step({
        title: '2. Visit node [' + node.value + ']',
        codeTag: 'visit',
        status: 'Output: ' + out.join(' → '),
        happening: 'We use the current node (value ' + node.value + ') and add it to the result. The node itself never moves.',
        highlights: { current: node.id, visited: nodes.slice(0, i).map(function (x) { return x.id; }) },
        result: out.join(' → '),
        regs: { temp: node.id }
      });
      if (i < nodes.length - 1) {
        var nextNode = nodes[i + 1];
        run.step({
          title: reverse ? '3. temp = temp.prev' : '3. temp = temp.next',
          codeTag: 'advance',
          status: 'temp → [' + nextNode.value + ']',
          happening: reverse
            ? 'Following the prev pointer takes us one node backwards.'
            : 'Following the next pointer takes us one node forwards.',
          highlights: { current: nextNode.id, visited: nodes.slice(0, i + 1).map(function (x) { return x.id; }) },
          result: out.join(' → '),
          regs: { temp: nextNode.id }
        });
      }
    }

    run.step({
      title: 'Traversal complete',
      codeTag: 'end',
      status: 'Result: ' + out.join(' → '),
      happening: 'temp is now ' + (reverse ? 'NULL (we passed the head)' : 'NULL (we passed the end)') +
        ', so the loop stops. We visited ' + nodes.length + ' node(s) exactly once — that is O(n) time and O(1) extra space.',
      result: out.join(' → '),
      highlights: { visited: nodes.map(function (x) { return x.id; }) }
    });

    return { steps: run.steps };
  }

  function reverse(list) {
    if (!list.head) return { error: 'The list is empty — there is nothing to reverse. Add at least one node first.' };
    var run = new Runner(list, 'reverse');
    var isDoubly = list.type === 'doubly';
    var isCircular = list.type === 'circular';
    var oldHead = list.head;

    intro(run, { status: 'List: ' + fmtList(list) + '   ·   reversing…' });

    if (isCircular) {
      var tailNode = list.tail || walkLastTail(list);
      tailNode.next = null;
      run.step({
        title: '0. Break the circle',
        codeTag: 'break',
        status: '[' + tailNode.value + '].next → NULL',
        happening: 'A circular list never reaches NULL, so the loop below would run forever. We temporarily open the circle at the tail.',
        highlights: { linkChanged: [{ id: tailNode.id, field: 'next' }], current: tailNode.id }
      });
    }

    var prev = null;
    var cur = list.head;
    var nxt = null;

    run.step({
      title: '1. prev ← NULL',
      codeTag: 'prev0',
      status: 'prev = NULL  ·  current = [' + cur.value + ']',
      happening: 'prev starts as NULL because the new last node must end with next = NULL.',
      regs: { prev: null, current: cur.id },
      highlights: { current: cur.id }
    });

    run.step({
      title: '2. current ← head',
      codeTag: 'curr0',
      status: 'current → [' + cur.value + ']',
      happening: 'current walks the list; it begins at the head.',
      regs: { prev: null, current: cur.id },
      highlights: { current: cur.id }
    });

    var guard = 0;
    while (cur && guard++ < 64) {
      nxt = cur.next;
      run.step({
        title: '3. next ← current.next',
        codeTag: 'getnext',
        status: 'next → ' + (nxt ? '[' + nxt.value + ']' : 'NULL'),
        happening: 'We save where to go next BEFORE breaking the link — if we forgot this line, the rest of the list would be lost forever.',
        regs: { prev: prev ? prev.id : null, current: cur.id, next: nxt ? nxt.id : null },
        highlights: { current: cur.id }
      });

      cur.next = prev;
      run.step({
        title: '4. current.next ← prev',
        codeTag: 'flip',
        status: '[' + cur.value + '].next → ' + (prev ? '[' + prev.value + ']' : 'NULL'),
        happening: 'The pointer is flipped: instead of pointing forward it now points to the node that came before it.',
        regs: { prev: prev ? prev.id : null, current: cur.id, next: nxt ? nxt.id : null },
        highlights: { current: cur.id, linkChanged: [{ id: cur.id, field: 'next' }] }
      });

      if (isDoubly) {
        cur.prev = nxt;
        run.step({
          title: '5. current.prev ← next',
          codeTag: 'dll',
          status: '[' + cur.value + '].prev → ' + (nxt ? '[' + nxt.value + ']' : 'NULL'),
          happening: 'In a doubly linked list the prev pointer is swapped too, so both directions stay consistent.',
          regs: { prev: prev ? prev.id : null, current: cur.id, next: nxt ? nxt.id : null },
          highlights: { current: cur.id, linkChanged: [{ id: cur.id, field: 'prev' }] }
        });
      }

      prev = cur;
      run.step({
        title: isDoubly ? '6. prev ← current' : '5. prev ← current',
        codeTag: 'moveprev',
        status: 'prev → [' + prev.value + ']',
        happening: 'prev advances — it now holds the most recently reversed node.',
        regs: { prev: prev.id, current: cur.id, next: nxt ? nxt.id : null },
        highlights: { current: cur.id }
      });

      cur = nxt;
      run.step({
        title: isDoubly ? '7. current ← next' : '6. current ← next',
        codeTag: 'movecur',
        status: 'current → ' + (cur ? '[' + cur.value + ']' : 'NULL'),
        happening: cur ? 'current steps forward to the next original node and the loop repeats.' : 'current is NULL — we have walked past the end, so the loop ends.',
        regs: { prev: prev.id, current: cur ? cur.id : null, next: null },
        highlights: { current: cur ? cur.id : null, visited: [] }
      });
    }

    run.step({
      title: '7. End of loop',
      codeTag: 'endloop',
      status: 'current = NULL  ·  prev = [' + prev.value + ']',
      happening: 'Every node has been flipped. prev is sitting on what used to be the last node — the new head.',
      regs: { prev: prev.id, current: null },
      highlights: { current: prev.id }
    });

    list.head = prev;
    if (isDoubly) list.tail = oldHead;
    run.step({
      title: '8. head ← prev',
      codeTag: 'sethead',
      status: 'head → [' + prev.value + ']' + (isDoubly ? '   ·   tail → [' + oldHead.value + ']' : ''),
      happening: isDoubly
        ? 'head moves to the former last node, and the former head becomes the new tail — both ends are updated.'
        : 'head moves to the node that used to be last. The list now reads in the opposite direction.',
      highlights: { current: prev.id },
      regs: { prev: prev.id, current: null }
    });

    if (isCircular) {
      oldHead.next = list.head;
      list.tail = oldHead;
      run.step({
        title: '9. Reconnect the circle',
        codeTag: 'reconnect',
        status: '[' + oldHead.value + '].next → [' + list.head.value + ']',
        happening: 'The circle is closed again: the new tail (the old head) points back to the new head.',
        highlights: { linkChanged: [{ id: oldHead.id, field: 'next' }] }
      });
    }

    outro(run, {
      happening: 'Reversed! The list now reads ' + fmtList(list) + '. Press Prev a few times to watch each pointer flip again.',
      status: 'Reversed list: ' + fmtList(list)
    });
    return { steps: run.steps };
  }

  function clear(list) {
    if (!list.head) return { error: 'The list is already empty — there are no nodes to clear.' };
    var run = new Runner(list, 'clear');
    intro(run, { status: 'Clearing: ' + fmtList(list) });

    var guard = 0;
    while (list.head && guard++ < 64) {
      var old = list.head;
      var newHead = old.next;
      if (list.size() === 1) newHead = null;

      if (list.type === 'circular' && newHead && list.tail && list.tail !== old) {
        list.tail.next = newHead;
      }

      list.head = newHead;
      if (!newHead) {
        list.tail = null;
        if (list.type === 'circular') old.next = null;
      }
      list.unregister(old);

      run.step({
        title: 'Free head [' + old.value + ']',
        codeTag: 'sethead',
        status: 'head = ' + (newHead ? '[' + newHead.value + ']' : 'NULL'),
        happening: newHead
          ? 'We remember the next node, free the current head, then move head one step forward. ' + (list.allNodes().length) + ' node(s) left.'
          : 'The last node is freed and head becomes NULL — the list is now empty.',
        highlights: { deleting: old.id }
      });
    }

    outro(run, {
      happening: 'The list is empty: head = NULL. Every node has been unlinked first, then freed — exactly how you are supposed to destroy a linked list.',
      status: 'Result: empty list'
    });
    return { steps: run.steps };
  }

  function run(key, list, params) {
    params = params || {};
    switch (key) {
      case 'insertBegin': return insertBegin(list, params.value);
      case 'insertEnd': return insertEnd(list, params.value);
      case 'addMany': return addMany(list, params.values);
      case 'insertPos': return insertPos(list, params.value, params.pos);
      case 'deleteBegin': return deleteBegin(list);
      case 'deleteEnd': return deleteEnd(list);
      case 'deletePos': return deletePos(list, params.pos);
      case 'search': return search(list, params.value);
      case 'traverse': return traverse(list, false);
      case 'traverseReverse': return traverse(list, true);
      case 'reverse': return reverse(list);
      case 'clear': return clear(list);
      default: return { error: 'Unknown operation: ' + key };
    }
  }

  global.Operations = {
    META: META,
    MAX: MAX,
    run: run,
    fmtList: fmtList
  };
})(typeof window !== 'undefined' ? window : globalThis);
