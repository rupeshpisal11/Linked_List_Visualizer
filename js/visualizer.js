(function (global) {
  'use strict';

  var W_SINGLY = 150, W_DOUBLY = 216, H = 74, GAP = 88, NODE_Y = 76;
  var PAD = 96, CONTENT_H = 252;
  var LANE_NEXT = 26, LANE_PREV = 50, ARC_D = 42, ARC_LOOP_D = 74;

  function nodeW(type) { return type === 'doubly' ? W_DOUBLY : W_SINGLY; }

  function walk(list) {
    var out = [], c = list.head, seen = new Set();
    while (c && !seen.has(c)) { seen.add(c); out.push(c); c = c.next; }
    return out;
  }

  function computeOrder(list, prevOrder, opts) {
    var chain = walk(list).map(function (n) { return n.id; });
    var registry = list.allNodes().map(function (n) { return n.id; });
    var prev = prevOrder.filter(function (id) { return registry.indexOf(id) >= 0; });

    var chainSet = {};
    chain.forEach(function (id) { chainSet[id] = 1; });
    var prevChain = prev.filter(function (id) { return chainSet[id]; });
    var same = prevChain.length === chain.length &&
      prevChain.every(function (id, i) { return id === chain[i]; });

    var order = same ? prev.slice() : chain.slice();
    var missing = registry.filter(function (id) { return order.indexOf(id) < 0; });

    var newNodeId = opts && opts.newNodeId;
    var place = opts && opts.placeNew;
    if (newNodeId && missing.indexOf(newNodeId) >= 0) {
      var idx = place && typeof place.index === 'number'
        ? Math.min(Math.max(place.index, 0), order.length) : order.length;
      order.splice(idx, 0, newNodeId);
      missing = missing.filter(function (id) { return id !== newNodeId; });
    }

    missing.sort(function (a, b) {
      var ia = prev.indexOf(a), ib = prev.indexOf(b);
      if (ia < 0 && ib < 0) return 0;
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
    return order.concat(missing);
  }

  function stateClass(node, h) {
    if (!h) return '';
    if (h.deleting != null && h.deleting === node.id) return ' s-deleting';
    if (h.wrong != null && h.wrong === node.id) return ' s-wrong';
    if (h.correct != null && h.correct === node.id) return ' s-correct';
    if (h.selected != null && h.selected === node.id) return ' s-selected';
    if (h.newNode != null && h.newNode === node.id) return ' s-new';
    if (h.found != null && h.found === node.id) return ' s-found';
    if (h.compare != null && h.compare === node.id) return ' s-search';
    if (h.current != null && h.current === node.id) return ' s-current';
    if (h.visited && h.visited.indexOf(node.id) >= 0) return ' s-visited';
    return '';
  }

  function badgeHtml(list, node, regs) {
    var out = '';
    if (list.head === node) out += '<span class="badge b-head">HEAD</span>';
    if (list.tail === node && list.type !== 'singly') out += '<span class="badge b-tail">TAIL</span>';
    if (regs) {
      ['prev', 'current', 'next'].forEach(function (k) {
        if (regs[k] === node.id) out += '<span class="badge b-' + k + '">' + k + '</span>';
      });
    }
    return out ? '<div class="badges">' + out + '</div>' : '';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function nodeHtml(list, node, x, opts) {
    var type = list.type;
    var w = nodeW(type);
    var cls = 'll-node' + stateClass(node, opts.highlights) + (opts.interactive ? ' clickable' : '');
    var cells = '';
    if (type === 'doubly') {
      cells += '<div class="cell ptr-cell prev-cell">' + (node.prev ? '•' : 'NULL') + '</div>';
    }
    cells += '<div class="cell data-cell">' + escapeHtml(node.value) + '</div>';
    cells += '<div class="cell ptr-cell next-cell">' + (node.next ? '•' : 'NULL') + '</div>';
    var addr = opts.memory ? '<div class="addr">' + LL.addrOf(node.id) + '</div>' : '';
    return '<div class="' + cls + '" data-id="' + node.id + '" style="left:' + x +
      'px;top:' + NODE_Y + 'px;width:' + w + 'px">' +
      badgeHtml(list, node, opts.regs) +
      '<div class="tag">#' + node.id + '</div>' +
      '<div class="cells">' + cells + '</div>' + addr +
      '</div>';
  }

  function chip(x, y, text) {
    return '<div class="null-chip" style="left:' + x + 'px;top:' + y + 'px">' + text + '</div>';
  }

  function buildSvg(w, h, paths) {
    var body = paths.map(function (p) {
      return '<path class="link' + (p.cls ? ' ' + p.cls : '') + '" d="' + p.d +
        '" marker-end="url(#' + (p.hot ? 'ahHot' : 'ah') + ')" data-key="' + p.key + '"></path>';
    }).join('');
    return '<svg class="links" width="' + w + '" height="' + h + '">' +
      '<defs>' +
      '<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="var(--arrow)"></path></marker>' +
      '<marker id="ahHot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"></path></marker>' +
      '</defs>' + body + '</svg>';
  }

  function capture(container) {
    var rects = {}, htmls = {};
    Array.prototype.forEach.call(container.querySelectorAll('.ll-node'), function (el) {
      if (el.closest('.ll-ghost')) return;
      var id = el.getAttribute('data-id');
      rects[id] = { x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width) };
      htmls[id] = el.outerHTML;
    });
    return { rects: rects, htmls: htmls };
  }

  function reset(container) {
    container.__order = null;
    container.__links = null;
  }

  function render(container, list, opts) {
    opts = opts || {};
    var h = opts.highlights || {};
    var prev = capture(container);
    var prevOrder = container.__order || [];
    var prevLinks = container.__links || [];
    var type = list.type;
    var W = nodeW(type);

    var order = computeOrder(list, prevOrder, { newNodeId: h.newNode, placeNew: h.placeNew });
    var nodes = order.map(function (id) { return list.getNode(id); }).filter(Boolean);

    var containerW = Math.max(container.clientWidth - 12, 300);
    var total = nodes.length ? nodes.length * W + (nodes.length - 1) * GAP : 0;
    var startX = (total + 2 * PAD < containerW) ? Math.round((containerW - total) / 2) : PAD;
    var contentW = Math.max(containerW, total + 2 * PAD);

    var posMap = {};
    nodes.forEach(function (n, i) { posMap[n.id] = { x: startX + i * (W + GAP), i: i }; });

    var html = '', paths = [], newLinks = [];
    var yNext = NODE_Y + LANE_NEXT, yPrev = NODE_Y + LANE_PREV, bottom = NODE_Y + H;

    if (!nodes.length) {
      html += '<div class="empty-state"><div class="big">HEAD → NULL</div>' +
        '<div>The list is empty. Add a node on the left to get started.</div></div>';
    }

    nodes.forEach(function (n) { html += nodeHtml(list, n, posMap[n.id].x, opts); });

    nodes.forEach(function (n) {
      var s = posMap[n.id];
      var sx = s.x + W;

      if (!n.next) {
        if (type !== 'circular') html += chip(sx + 10, yNext - 13, 'NULL');
      } else {
        var t = posMap[n.next.id];
        if (t) {
          var key = 'n:' + n.id + '->' + n.next.id;
          var hot = isHot(h, n.id, 'next');
          var cls = hot ? 'hot' : '';
          var isLoop = type === 'circular' && t.i === 0 && s.i === nodes.length - 1 && nodes.length > 1;
          if (isLoop || (type === 'circular' && n.id === n.next.id)) {
            var dSelf = n.id === n.next.id;
            var cxs = dSelf ? s.x + W / 2 : sx - 14;
            var cx2 = dSelf ? s.x + W / 2 : t.x + W / 2;
            var loopD = 'M' + cxs + ' ' + bottom +
              ' C' + (cxs + 52) + ' ' + (bottom + ARC_LOOP_D) + ' ' +
              (cx2 - 52) + ' ' + (bottom + ARC_LOOP_D) + ' ' +
              (dSelf ? cxs - 2 : cx2) + ' ' + (bottom + 3);
            pushPath(paths, prevLinks, newLinks, key, loopD, cls, hot);
          } else if (t.x > s.x) {
            var fwd = 'M' + sx + ' ' + yNext + ' L' + (t.x - 4) + ' ' + yNext;
            pushPath(paths, prevLinks, newLinks, key, fwd, cls, hot);
          } else {
            var dd = ARC_D;
            var bwd = 'M' + (sx - 14) + ' ' + bottom +
              ' C' + (sx - 14) + ' ' + (bottom + dd) + ' ' +
              (t.x + W / 2) + ' ' + (bottom + dd) + ' ' +
              (t.x + W / 2) + ' ' + (bottom + 3);
            pushPath(paths, prevLinks, newLinks, key, bwd, cls, hot);
          }
        }
      }

      if (type === 'doubly') {
        if (!n.prev) {
          html += chip(s.x - 62, yPrev - 13, 'NULL');
        } else {
          var pt = posMap[n.prev.id];
          if (pt) {
            var pkey = 'p:' + n.id + '->' + n.prev.id;
            var phot = isHot(h, n.id, 'prev');
            var pcls = phot ? 'hot' : '';
            if (pt.x < s.x) {
              var pd = 'M' + s.x + ' ' + yPrev + ' L' + (pt.x + W + 4) + ' ' + yPrev;
              pushPath(paths, prevLinks, newLinks, pkey, pd, pcls, phot);
            } else {
              var pd2 = 'M' + (s.x + 14) + ' ' + bottom +
                ' C' + (s.x + 14) + ' ' + (bottom + ARC_D + 18) + ' ' +
                (pt.x + W / 2) + ' ' + (bottom + ARC_D + 18) + ' ' +
                (pt.x + W / 2) + ' ' + (bottom + 3);
              pushPath(paths, prevLinks, newLinks, pkey, pd2, pcls, phot);
            }
          }
        }
      }
    });

    if (opts.gaps && nodes.length) {
      for (var g = 1; g <= nodes.length + 1; g++) {
        var gx;
        if (g === 1) gx = startX - GAP / 2 - 15;
        else if (g === nodes.length + 1) {
          gx = posMap[nodes[nodes.length - 1].id].x + W + GAP / 2 - 15;
        } else {
          gx = posMap[nodes[g - 2].id].x + W + GAP / 2 - 15;
        }
        html += '<button class="gap-target' + (opts.selectedGap === g ? ' selected' : '') +
          '" data-gap="' + g + '" style="left:' + gx + 'px;top:' + (NODE_Y + H / 2 - 15) + 'px">+' +
          '<span class="gap-label">position ' + g + '</span></button>';
      }
    }

    var inner = html + buildSvg(contentW, CONTENT_H, paths);
    container.innerHTML = '<div class="stage-inner" style="width:' + contentW +
      'px;height:' + CONTENT_H + 'px">' + inner + '</div>';
    container.__order = order;

    var dur = 650;
    if (container.__speed) dur = Math.max(200, Math.round(650 / container.__speed));

    Array.prototype.forEach.call(container.querySelectorAll('.stage-inner > .ll-node'), function (nodeEl) {
      var id = nodeEl.getAttribute('data-id');
      var old = prev.rects[id];
      if (old && nodeEl.animate) {
        var dx = old.x - parseFloat(nodeEl.style.left);
        var dy = old.y - parseFloat(nodeEl.style.top);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          nodeEl.animate(
            [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
            { duration: dur, easing: 'cubic-bezier(.22,1,.36,1)' }
          );
        }
      } else if (!old && nodeEl.animate && nodeEl.className.indexOf('s-new') < 0) {
        nodeEl.animate([{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: dur, easing: 'cubic-bezier(.2,1.2,.4,1)' });
      }
    });

    Array.prototype.forEach.call(container.querySelectorAll('.stage-inner > .link'), function (p) {
      var key = p.getAttribute('data-key');
      if (key && newLinks.indexOf(key) >= 0 && p.animate) {
        try {
          var len = p.getTotalLength();
          p.style.strokeDasharray = len;
          p.style.setProperty('--len', len + 'px');
          p.classList.add('draw');
        } catch (e) { }
      }
    });

    Object.keys(prev.rects).forEach(function (id) {
      if (container.querySelector('.stage-inner > .ll-node[data-id="' + id + '"]')) return;
      var tpl = document.createElement('div');
      tpl.innerHTML = prev.htmls[id];
      var ghost = tpl.firstChild;
      if (!ghost) return;
      ghost.classList.add('ll-ghost');
      var stageInner = container.querySelector('.stage-inner');
      if (stageInner) stageInner.appendChild(ghost);
      setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, dur * 2.4);
    });

    container.__links = newLinks.length ? allKeys(paths) : allKeys(paths);
  }

  function allKeys(paths) {
    return paths.map(function (p) { return p.key; });
  }

  function isHot(h, id, field) {
    if (!h || !h.linkChanged) return false;
    return h.linkChanged.some(function (c) { return c.id === id && c.field === field; });
  }

  function pushPath(paths, prevLinks, newLinks, key, d, cls, hot) {
    if (prevLinks.indexOf(key) < 0 && newLinks.indexOf(key) < 0) newLinks.push(key);
    paths.push({ d: d, cls: cls, hot: hot, key: key });
  }

  global.Visualizer = {
    render: render,
    reset: reset,
    nodeW: nodeW
  };
})(typeof window !== 'undefined' ? window : globalThis);
