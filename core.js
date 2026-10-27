(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.BulletCore = api; })(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function parse(text) {
    return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const cut = line.indexOf('|');
      if (cut > 0 && cut <= 16 && line.slice(cut + 1).trim()) return { name: line.slice(0, cut).trim(), text: line.slice(cut + 1).trim() };
      return { name: '', text: line };
    });
  }
  function shuffle(items, random) {
    const values = items.slice();
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor((random || Math.random)() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    return values;
  }
  class Playlist {
    constructor(items, order, loop, random) { this.items = items; this.order = order; this.loop = loop; this.random = random; this.cursor = 0; this.round = 1; this.queue = this.makeQueue(); }
    makeQueue() { return this.order === 'random' ? shuffle(this.items, this.random) : this.items.slice(); }
    next() {
      if (!this.queue.length) return null;
      if (this.cursor >= this.queue.length) { if (!this.loop) return null; this.cursor = 0; this.round++; this.queue = this.makeQueue(); }
      return { ...this.queue[this.cursor++], position: this.cursor, round: this.round, length: this.queue.length };
    }
  }
  function interval(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(0.5, Math.min(15, number)) : 3; }
  return { parse, shuffle, Playlist, interval };
});
