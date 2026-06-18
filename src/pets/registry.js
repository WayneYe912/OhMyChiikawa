/*
 * Minimal pet registry shared across the renderer.
 * Pet definition files (e.g. usagi.js) call PetRegistry.register(...).
 * To add a new pet: create src/pets/<id>.js that registers itself,
 * then include it in index.html after this file.
 */
(function () {
  'use strict';
  var api = (typeof window !== 'undefined') ? window : globalThis;
  if (!api.PetRegistry) {
    api.PetRegistry = {
      _pets: {},
      register: function (p) { this._pets[p.id] = p; return p; },
      get: function (id) { return this._pets[id]; },
      ids: function () { return Object.keys(this._pets); }
    };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = api.PetRegistry; }
})();
