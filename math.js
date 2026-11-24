(function (root) {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  function smooth(a, b, value) { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); }
  function geometry(progress, pageWidth, reveal = 1) {
    const p = clamp(progress), angle = 158 * smooth(.12, .83, p);
    const lift = pageWidth * .22 * smooth(.39, .92, p) * clamp(reveal);
    // The intersection of the two lifted paper planes: x = d*cot(theta/2).
    const seam = angle > .1 ? lift / Math.tan(angle * Math.PI / 360) : 0;
    return { angle, lift, seam, popup: smooth(.38, .62, p) * clamp(reveal), greeting: smooth(.82, 1, p), glow: smooth(0, .12, p) * (1 - smooth(.35, .85, p)), scale: 1.32 - .32 * smooth(.12, .85, p), shift: -.5 * pageWidth * (1 - smooth(.12, .85, p)) };
  }
  class BookState {
    constructor({duration = 2900, turnDuration = 850} = {}) { this.duration = duration; this.turnDuration = turnDuration; this.progress = 0; this.target = 0; this.page = 0; this.flip = null; this.reveal = 1; }
    get moving() { return this.progress !== this.target || !!this.flip || this.reveal < 1; }
    toggle() { this.setOpen(!this.target); }
    setOpen(open) {
      if (this.flip) { this.page = this.flip.t >= .5 ? this.flip.to : this.flip.from; this.flip = null; }
      this.reveal = 1; this.target = open ? 1 : 0;
    }
    turn(direction) {
      const to = this.page + Math.sign(direction);
      if (this.progress !== 1 || this.target !== 1 || this.flip || to < 0 || to > 3) return false;
      this.flip = {from:this.page, to, t:0, leaf:direction > 0 ? this.page : to}; this.reveal = 0; return true;
    }
    tick(milliseconds) {
      const dt = clamp(milliseconds, 0, 80);
      if (this.progress !== this.target) this.progress = this.target > this.progress ? Math.min(this.target, this.progress + dt / this.duration) : Math.max(this.target, this.progress - dt / this.duration);
      if (this.flip) { this.flip.t = Math.min(1, this.flip.t + dt / this.turnDuration); if (this.flip.t === 1) { this.page = this.flip.to; this.flip = null; } }
      else this.reveal = Math.min(1, this.reveal + dt / 420);
      return this;
    }
    reset() { this.progress = this.target = this.page = 0; this.flip = null; this.reveal = 1; }
  }
  const api = {clamp, smooth, geometry, BookState};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CardMath = api;
})(globalThis);
