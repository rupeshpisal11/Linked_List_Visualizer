(function (global) {
  'use strict';

  var _id = 1;
  function genId() { return _id++; }

  function LLNode(value, id) {
    this.id = id != null ? id : genId();
    this.value = value;
    this.next = null;
    this.prev = null;
  }

  function LinkedList(type) {
    this.type = type || 'singly';
    this.head = null;
    this.tail = null;
    this._nodes = new Map();
  }

  LinkedList.prototype.register = function (n) { this._nodes.set(n.id, n); return n; };
  LinkedList.prototype.unregister = function (n) { this._nodes.delete(n.id); };
  LinkedList.prototype.allNodes = function () { return Array.from(this._nodes.values()); };
  LinkedList.prototype.hasNode = function (id) { return this._nodes.has(id); };
  LinkedList.prototype.getNode = function (id) { return this._nodes.get(id) || null; };

  LinkedList.prototype.createNode = function (value) {
    var n = new LLNode(value);
    this.register(n);
    return n;
  };

  LinkedList.prototype.isEmpty = function () { return this.head == null; };

  LinkedList.prototype.chain = function () {
    var out = [], c = this.head, seen = new Set();
    while (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
      c = c.next;
    }
    return out;
  };

  LinkedList.prototype.size = function () { return this.chain().length; };

  LinkedList.prototype.values = function () {
    return this.chain().map(function (n) { return n.value; });
  };

  LinkedList.prototype.toArray = function () { return this.values(); };

  LinkedList.prototype.findFirst = function (value) {
    var ch = this.chain();
    for (var i = 0; i < ch.length; i++) if (ch[i].value === value) return ch[i];
    return null;
  };

  LinkedList.prototype.countValue = function (value) {
    return this.values().filter(function (v) { return v === value; }).length;
  };

  LinkedList.prototype.positionOf = function (node) {
    var ch = this.chain();
    for (var i = 0; i < ch.length; i++) if (ch[i] === node) return i + 1;
    return -1;
  };

  LinkedList.prototype.reset = function (type) {
    if (type) this.type = type;
    this.head = null;
    this.tail = null;
    this._nodes = new Map();
  };

  LinkedList.prototype.build = function (values, type) {
    if (type) this.type = type;
    this.head = null;
    this.tail = null;
    this._nodes = new Map();
    for (var i = 0; i < values.length; i++) this.appendInstant(values[i]);
    return this;
  };

  LinkedList.prototype.appendInstant = function (value) {
    var n = this.createNode(value);
    if (!this.head) {
      this.head = n;
      this.tail = n;
    } else {
      if (this.type === 'circular') {
        var last = this.head;
        while (last.next !== this.head) last = last.next;
        last.next = n;
      } else {
        this.tail.next = n;
      }
      this.tail = n;
    }
    if (this.type === 'doubly') n.prev = this._previousOf(n);
    if (this.type === 'circular') n.next = this.head;
    return n;
  };

  LinkedList.prototype._previousOf = function (node) {
    var c = this.head, seen = new Set();
    while (c && !seen.has(c)) {
      seen.add(c);
      if (c.next === node) return c;
      c = c.next;
    }
    return null;
  };

  LinkedList.prototype.setType = function (type) {
    var vals = this.values();
    var wasCircular = this.type === 'circular';
    this.build(vals, type);
    if (wasCircular && type !== 'circular' && vals.length) {
      /* break nothing: build() already produced a linear list */
    }
    return this;
  };

  LinkedList.prototype.clone = function () {
    return deserialize(serialize(this));
  };

  function serialize(list) {
    var nodes = [];
    list.allNodes().forEach(function (n) {
      nodes.push({
        id: n.id,
        value: n.value,
        next: n.next ? n.next.id : null,
        prev: n.prev ? n.prev.id : null
      });
    });
    return {
      type: list.type,
      head: list.head ? list.head.id : null,
      tail: list.tail ? list.tail.id : null,
      nodes: nodes
    };
  }

  function deserialize(snap) {
    var list = new LinkedList(snap.type);
    var map = {};
    snap.nodes.forEach(function (n) {
      map[n.id] = new LLNode(n.value, n.id);
    });
    snap.nodes.forEach(function (n) {
      map[n.id].next = n.next != null && map[n.next] ? map[n.next] : null;
      map[n.id].prev = n.prev != null && map[n.prev] ? map[n.prev] : null;
    });
    snap.nodes.forEach(function (n) { list.register(map[n.id]); });
    list.head = snap.head != null && map[snap.head] ? map[snap.head] : null;
    list.tail = snap.tail != null && map[snap.tail] ? map[snap.tail] : null;
    return list;
  }

  function addrOf(id) {
    var n = ((id * 911 + 73) % 850) * 3 + 256;
    return '0x' + n.toString(16).toUpperCase();
  }

  global.LL = {
    LLNode: LLNode,
    LinkedList: LinkedList,
    serialize: serialize,
    deserialize: deserialize,
    clone: function (l) { return deserialize(serialize(l)); },
    addrOf: addrOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
