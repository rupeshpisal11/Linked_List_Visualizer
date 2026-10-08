(function (global) {
  'use strict';

  function StepPlayer(handlers) {
    this.handlers = handlers || {};
    this.steps = [];
    this.index = -1;
    this.timer = null;
    this.playing = false;
    this.speed = 1;
  }

  StepPlayer.prototype.load = function (steps, opts) {
    opts = opts || {};
    this.pause();
    this.steps = steps || [];
    this.index = this.steps.length ? 0 : -1;
    this.emit();
    if (opts.autoplay && this.steps.length > 1) this.play();
  };

  StepPlayer.prototype.clear = function () {
    this.pause();
    this.steps = [];
    this.index = -1;
    this.emit();
  };

  StepPlayer.prototype.current = function () {
    return this.index >= 0 ? this.steps[this.index] : null;
  };

  StepPlayer.prototype.isFirst = function () { return this.index <= 0; };
  StepPlayer.prototype.isLast = function () { return this.index >= this.steps.length - 1; };
  StepPlayer.prototype.hasSteps = function () { return this.steps.length > 0; };

  StepPlayer.prototype.emit = function () {
    if (this.handlers.onStep) {
      this.handlers.onStep(this.current(), this.index, this.steps.length, this);
    }
    if (this.handlers.onState) this.handlers.onState(this);
  };

  StepPlayer.prototype.next = function () {
    if (!this.hasSteps() || this.isLast()) { this.pause(); return false; }
    this.index++;
    this.emit();
    if (this.isLast()) this.pause();
    return true;
  };

  StepPlayer.prototype.prev = function () {
    if (!this.hasSteps() || this.isFirst()) return false;
    this.index--;
    this.emit();
    return true;
  };

  StepPlayer.prototype.goto = function (i) {
    if (!this.hasSteps()) return;
    this.index = Math.max(0, Math.min(i, this.steps.length - 1));
    this.emit();
  };

  StepPlayer.prototype.restart = function () {
    if (!this.hasSteps()) return;
    this.pause();
    this.index = 0;
    this.emit();
  };

  StepPlayer.prototype.skipToEnd = function () {
    if (!this.hasSteps()) return;
    this.pause();
    this.index = this.steps.length - 1;
    this.emit();
  };

  StepPlayer.prototype.play = function () {
    if (!this.hasSteps()) return;
    if (this.isLast()) this.index = 0;
    this.playing = true;
    this.emit();
    this.schedule();
  };

  StepPlayer.prototype.schedule = function () {
    var self = this;
    clearTimeout(this.timer);
    if (!this.playing) return;
    var base = 1500;
    var delay = Math.max(300, base / this.speed);
    this.timer = setTimeout(function () {
      if (!self.playing) return;
      var moved = self.next();
      if (moved) self.schedule();
      else self.pause();
    }, delay);
  };

  StepPlayer.prototype.pause = function () {
    this.playing = false;
    clearTimeout(this.timer);
    if (this.handlers.onState) this.handlers.onState(this);
  };

  StepPlayer.prototype.toggle = function () {
    if (this.playing) this.pause();
    else this.play();
  };

  StepPlayer.prototype.setSpeed = function (s) {
    this.speed = s;
    if (this.playing) this.schedule();
  };

  global.StepPlayer = StepPlayer;
})(typeof window !== 'undefined' ? window : globalThis);
