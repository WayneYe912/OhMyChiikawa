'use strict';
/*
 * OhMyChiikawa — renderer. Owns: layout/sizing, pointer interaction (drag vs click),
 * alpha-accurate click-through, and the animation compositor.
 *
 * Supports three image pet kinds:
 *   - 'image'          : a single flat sprite (whole-body motion only)
 *   - 'image-layered'  : body + ear layers + eyelids (blink & ear-wiggle)
 *   - 'image-sequence' : one image swapped through frames; idle holds the rest
 *                        frame and actions play from/to it -> seamless transitions
 *
 * All whole-body motion is folded into ONE transform written to #layer-move
 * each frame, so the channels never fight over the transform property. Part
 * motion (ears, eyelids) is layered on top of that.
 */
(function () {
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (a) { return 1 - Math.pow(1 - a, 3); };
  var now = function () { return performance.now(); };
  // resolve an image path to a decrypted data URL (Electron preload) or, when the
  // vault isn't present (raw dev tree / browser preview), the plain file path.
  var assetURL = function (p) { return (window.petAPI && window.petAPI.asset && window.petAPI.asset(p)) || p; };

  var SCALES = { small: 150, medium: 200, large: 270 };
  var PAD = { top: 0.30, bottom: 0.06, side: 0.24 };

  // ---------- resolve pet ----------
  var params = new URLSearchParams(location.search);
  var petId = params.get('pet') || 'chiikawa';
  var lang = (params.get('lang') === 'en') ? 'en' : 'zh';   // UI / speech language
  var scaleH = SCALES[params.get('scale')] || SCALES.medium;
  var pet = (window.PetRegistry && (window.PetRegistry.get(petId) || window.PetRegistry.get('chiikawa') || window.PetRegistry.get('usagi')));
  if (!pet) { document.body.textContent = 'No pet registered.'; return; }
  var isLayered = pet.kind === 'image-layered';
  var isSeq = pet.kind === 'image-sequence';
  var canBlink = isLayered || isSeq;

  // ---------- DOM ----------
  var moveEl = document.getElementById('layer-move');
  var tiltEl = document.getElementById('layer-tilt');   // head-nod channel (face click)
  var contentEl = document.getElementById('pet-content');
  var speechEl = document.getElementById('speech');
  var speechTextEl = speechEl && speechEl.querySelector('.speech-text');
  document.body.classList.add('kind-image');

  var ears = [];               // layered ear refs {el, sign}
  var seqImg = null, seqFrames = [];   // image-sequence pet (one img, swap src)
  var hitCtx = null, hitOK = false, natW = 1, natH = 1;

  function pct(n) { return (n * 100) + '%'; }

  if (isLayered) {
    natW = pet.natural.w; natH = pet.natural.h;
    var wrap = document.createElement('div'); wrap.className = 'layered';
    var pending = 0, hitImgs = [];
    function mkImg(src, cls, box, origin) {
      var img = document.createElement('img');
      img.className = cls; img.draggable = false; img.src = assetURL(src);
      if (box) {
        img.style.left = pct(box.x); img.style.top = pct(box.y);
        img.style.width = pct(box.w); img.style.height = pct(box.h);
      } else { img.style.left = '0'; img.style.top = '0'; img.style.width = '100%'; img.style.height = '100%'; }
      if (origin) img.style.transformOrigin = pct(origin.x) + ' ' + pct(origin.y);
      pending++; hitImgs.push({ img: img, box: box });
      img.onload = function () { if (--pending === 0) buildHit(); };
      return img;
    }
    wrap.appendChild(mkImg(pet.body, 'part body', null, null));
    pet.ears.forEach(function (e) {
      var el = mkImg(e.src, 'part ear ear-' + e.side, e.box, e.origin);
      ears.push({ el: el, sign: e.side === 'l' ? 1 : -1 });
      wrap.appendChild(el);
    });
    pet.eyes.forEach(function (e, i) {
      var lid = document.createElement('div');
      lid.className = 'lid lid-' + (i === 0 ? 'l' : 'r');
      lid.style.left = pct(e.x); lid.style.top = pct(e.y);
      lid.style.width = pct(e.w); lid.style.height = pct(e.h);
      lid.style.background = pet.lid;
      var lash = document.createElement('span'); lash.className = 'lash';
      lid.appendChild(lash); wrap.appendChild(lid);
    });
    contentEl.appendChild(wrap);
    // compose the silhouette for alpha hit-testing (body + ears)
    function buildHit() {
      try {
        var c = document.createElement('canvas'); c.width = natW; c.height = natH;
        var cx = c.getContext('2d', { willReadFrequently: true });
        hitImgs.forEach(function (h) {
          if (!h.box) cx.drawImage(h.img, 0, 0, natW, natH);
          else cx.drawImage(h.img, h.box.x * natW, h.box.y * natH, h.box.w * natW, h.box.h * natH);
        });
        cx.getImageData(0, 0, 1, 1); hitCtx = cx; hitOK = true;
      } catch (e) { hitOK = false; }
    }
  } else if (isSeq) { // single image, swap src through frames (seamless idle<->action)
    natW = pet.natural.w; natH = pet.natural.h;
    var idleIdx = pet.idle || 0;
    for (var fi = 0; fi < pet.frames.count; fi++) {
      var fim = new Image();
      fim.src = assetURL(pet.frames.base + String(fi + (pet.frames.start || 0)).padStart(pet.frames.pad || 2, '0') + pet.frames.ext);
      seqFrames.push(fim);
    }
    seqImg = document.createElement('img'); seqImg.className = 'pet-main'; seqImg.draggable = false;
    seqImg.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = natW; c.height = natH;
        var cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(seqImg, 0, 0); cx.getImageData(0, 0, 1, 1);
        hitCtx = cx; hitOK = true;
      } catch (e) { hitOK = false; }
    };
    seqImg.src = seqFrames[idleIdx].src;
    contentEl.appendChild(seqImg);
    (pet.eyes || []).forEach(function (e, i) {
      var lid = document.createElement('div');
      lid.className = 'lid lid-' + (i === 0 ? 'l' : 'r');
      lid.style.left = pct(e.x); lid.style.top = pct(e.y);
      lid.style.width = pct(e.w); lid.style.height = pct(e.h);
      lid.style.background = pet.lid;
      var lash = document.createElement('span'); lash.className = 'lash';
      lid.appendChild(lash); contentEl.appendChild(lid);
    });
  } else { // flat image
    var spriteImg = new Image(); spriteImg.draggable = false; spriteImg.className = 'pet-main';
    spriteImg.onload = function () {
      natW = spriteImg.naturalWidth; natH = spriteImg.naturalHeight;
      try {
        var c = document.createElement('canvas'); c.width = natW; c.height = natH;
        var cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(spriteImg, 0, 0); cx.getImageData(0, 0, 1, 1);
        hitCtx = cx; hitOK = true;
      } catch (e) { hitOK = false; }
    };
    spriteImg.src = assetURL(pet.src); contentEl.appendChild(spriteImg);
  }

  // ---------- frame-sequence actions (e.g. roll hands) ----------
  var actionImg = document.createElement('img');
  actionImg.className = 'action-img'; actionImg.draggable = false;
  contentEl.appendChild(actionImg);

  // ---------- run cycle (looping frames shown while the pet walks) ----------
  // A pet may define pet.walk = { base, count, pad, ext, start, fps }. The frames
  // share the action-overlay framing (bottom-anchored, height:100%, width:auto),
  // so they stay the same on-screen height as the standing pose. Left/right facing
  // is handled by the existing #layer-move flip (anim.facing), so the run art only
  // needs one direction.
  var runImg = document.createElement('img');
  runImg.className = 'run-img'; runImg.draggable = false;
  contentEl.appendChild(runImg);
  var runFrames = [];
  if (pet.walk) {
    for (var rf = 0; rf < pet.walk.count; rf++) {
      var rim = new Image();
      rim.src = assetURL(pet.walk.base + String(rf + (pet.walk.start || 0)).padStart(pet.walk.pad || 2, '0') + pet.walk.ext);
      runFrames.push(rim);
    }
  }
  var running = false, runTimer = null, runIdx = 0;
  function startRun() {
    if (!pet.walk || running || acting) return;
    running = true; runIdx = 0; contentEl.classList.add('running');
    var fps = pet.walk.fps || 9;
    (function step() {
      runImg.src = runFrames[runIdx % pet.walk.count].src; runIdx++;
      runTimer = setTimeout(step, 1000 / fps);
    })();
  }
  function stopRun() {
    if (!running) return;
    running = false; clearTimeout(runTimer); contentEl.classList.remove('running');
  }

  var actionFrames = {};
  if (pet.actions && !isSeq) { // overlay-style actions (image-layered); seq uses its own frames
    Object.keys(pet.actions).forEach(function (name) {
      var a = pet.actions[name], arr = [];
      for (var i = 0; i < a.count; i++) {
        var im = new Image();
        im.src = assetURL(a.base + String(i + (a.start || 0)).padStart(a.pad || 2, '0') + a.ext);
        arr.push(im);
      }
      actionFrames[name] = arr;
    });
  }
  var acting = false, actTimer = null;
  function playAction(name) {
    var a = pet.actions && pet.actions[name];
    if (!a || acting || anim.dragging || running) return;
    acting = true; document.body.classList.remove('is-blink');
    if (name === 'roll') say(ROLL_LINE, 2000);   // the rabbit chants while rolling its paws
    if (isSeq) { // play the pet's own frames in place -> seamless (idle frame == frame 0)
      var n = pet.frames.count, total = n * (a.loops || 1), i = 0, fps = a.fps || 10, idleIdx = pet.idle || 0;
      (function step() {
        seqImg.src = seqFrames[i % n].src;
        if (++i >= total) { seqImg.src = seqFrames[idleIdx].src; acting = false; return; }
        actTimer = setTimeout(step, 1000 / fps);
      })();
      return;
    }
    contentEl.classList.add('acting');
    var total2 = a.count * (a.loops || 1), j = 0, fps2 = a.fps || 10;
    (function step() {
      actionImg.src = actionFrames[name][j % a.count].src;
      if (++j >= total2) { acting = false; contentEl.classList.remove('acting'); return; }
      actTimer = setTimeout(step, 1000 / fps2);
    })();
  }

  // ---------- layout / window sizing ----------
  var box = { left: 0, top: 0, w: 0, h: 0, winW: 0, winH: 0 };
  function layout() {
    var petH = Math.round(scaleH * (pet.renderScale || 1)), petW = Math.round(petH * (pet.aspect || 0.66));
    var topPad = Math.round(petH * PAD.top), botPad = Math.round(petH * PAD.bottom), sidePad = Math.round(petW * PAD.side);
    box.w = petW; box.h = petH; box.left = sidePad; box.top = topPad;
    box.winW = petW + sidePad * 2; box.winH = petH + topPad + botPad;
    moveEl.style.left = box.left + 'px'; moveEl.style.top = box.top + 'px';
    moveEl.style.width = box.w + 'px'; moveEl.style.height = box.h + 'px';
    if (window.petAPI) window.petAPI.fit(box.winW, box.winH);
  }
  layout();

  // ---------- hit testing ----------
  function overPet(cx, cy) {
    var u = (cx - box.left) / box.w, v = (cy - box.top) / box.h;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    if (hitOK) {
      var px = clamp(Math.floor(u * natW), 0, natW - 1), py = clamp(Math.floor(v * natH), 0, natH - 1);
      try { return hitCtx.getImageData(px, py, 1, 1).data[3] > 20; } catch (e) { return true; }
    }
    return true;
  }

  // ---------- interaction ----------
  var ignoring = true;
  function setIgnore(ig) { if (ig !== ignoring) { ignoring = ig; window.petAPI && window.petAPI.setIgnore(ig); } }
  var drag = { active: false, moved: false, sx: 0, sy: 0, lastX: 0, lastT: 0, vx: 0 };
  var pendingHop = null;

  window.addEventListener('mousemove', function (e) {
    if (drag.active) {
      if (Math.abs(e.screenX - drag.sx) + Math.abs(e.screenY - drag.sy) > 4) drag.moved = true;
      var t = now(); if (t > drag.lastT) drag.vx = (e.screenX - drag.lastX) / (t - drag.lastT) * 16;
      drag.lastX = e.screenX; drag.lastT = t;
      window.petAPI && window.petAPI.dragMove(e.screenX, e.screenY);
      return;
    }
    setIgnore(!overPet(e.clientX, e.clientY));
  }, true);

  window.addEventListener('mousedown', function (e) {
    if (e.button !== 0 || !overPet(e.clientX, e.clientY)) return;
    drag.active = true; drag.moved = false;
    drag.sx = e.screenX; drag.sy = e.screenY; drag.lastX = e.screenX; drag.lastT = now(); drag.vx = 0;
    anim.dragging = true; window.petAPI && window.petAPI.dragStart(e.screenX, e.screenY);
    e.preventDefault();
  }, true);

  window.addEventListener('mouseup', function (e) {
    if (!drag.active) return;
    drag.active = false; anim.dragging = false; anim.dragRot = 0;
    window.petAPI && window.petAPI.dragEnd();
    if (drag.moved) wobble(0.7 * clamp(Math.abs(drag.vx) / 12, 0.3, 1));
    else { // part-aware single click (a dbl-click cancels this -> roll)
      clearTimeout(pendingHop);
      var reg = regionAt(e.clientX, e.clientY);
      pendingHop = setTimeout(function () { reactRegion(reg); }, 240);
    }
    setIgnore(!overPet(e.clientX, e.clientY));
  }, true);

  window.addEventListener('blur', function () {
    if (drag.active) { drag.active = false; anim.dragging = false; anim.dragRot = 0; window.petAPI && window.petAPI.dragEnd(); }
  });

  window.addEventListener('dblclick', function (e) {
    if (overPet(e.clientX, e.clientY)) { clearTimeout(pendingHop); react('roll'); } // double-click -> roll hands
  }, true);

  window.addEventListener('contextmenu', function (e) {
    if (overPet(e.clientX, e.clientY)) { e.preventDefault(); window.petAPI && window.petAPI.openMenu(); }
  }, true);

  // ---------- reactions ----------
  function react(type) {
    if (acting) return;
    if (type === 'hop') { anim.hopStart = now(); if (canBlink) happy(520); }
    else if (type === 'roll') { playAction('roll'); }
  }
  function wobble(amp) { anim.wobStart = now(); anim.wobAmp = clamp(amp, 0, 1.2); }
  function happy(ms) {
    document.body.classList.add('is-happy');
    clearTimeout(happy._t); happy._t = setTimeout(function () { document.body.classList.remove('is-happy'); }, ms || 500);
  }
  function blink() {
    if (!canBlink) return;
    document.body.classList.add('is-blink');
    setTimeout(function () { document.body.classList.remove('is-blink'); }, 160);
  }

  // ---------- speech bubble ----------
  // Per-language speech. A pet may provide pet.speech as {zh:[],en:[]} (or a plain
  // array = language-neutral); the defaults below are usagi's lines. SPEECH and
  // ROLL_LINE are refreshed by applyLang() on load and on a live language switch.
  var DEFAULT_SPEECH = {
    zh: ['哈？', '呀哈', '乌拉！', '乌拉呀哈呀啦呜哈～', '呀哈呀哈', '哈！'],
    en: ['Ha?', 'Yaha', 'Ura!', 'Ura yaha yara wuha~', 'Yaha yaha', 'Ha!']
  };
  var ROLL_LINES = { zh: '噜噜噜噜噜！', en: 'Rurururu!' };   // fixed line while rolling
  var SPEECH, ROLL_LINE;
  function applyLang() {
    var s = pet.speech || DEFAULT_SPEECH;
    SPEECH = Array.isArray(s) ? s : (s[lang] || s.zh || DEFAULT_SPEECH[lang]);
    ROLL_LINE = ROLL_LINES[lang] || ROLL_LINES.zh;
  }
  applyLang();
  var speechTimer = null;
  function say(text, ms) {
    if (!speechEl) return;
    speechTextEl.textContent = text || SPEECH[(Math.random() * SPEECH.length) | 0];
    speechEl.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(function () { speechEl.classList.remove('show'); }, ms || 1700);
  }

  // ---------- part-aware click reactions ----------
  // Which body part is under (cx,cy)? Only the layered usagi has real part
  // geometry; everything else falls back to a whole-body reaction.
  function regionAt(cx, cy) {
    if (!overPet(cx, cy)) return null;
    if (!isLayered || !pet.ears) return 'body';
    var u = (cx - box.left) / box.w, v = (cy - box.top) / box.h;
    for (var i = 0; i < pet.ears.length; i++) {
      var b = pet.ears[i].box;
      if (u >= b.x && u <= b.x + b.w && v >= b.y && v <= b.y + b.h)
        return pet.ears[i].side === 'l' ? 'ear-l' : 'ear-r';
    }
    if (v >= 0.64 && v <= 0.84) { if (u <= 0.22) return 'hand-l'; if (u >= 0.78) return 'hand-r'; } // arm nubs
    if (v >= 0.34 && v <= 0.62 && u >= 0.20 && u <= 0.80) return 'face';
    return 'body';
  }
  function kickEar(i) { if (i >= 0 && i < anim.earKick.length) anim.earKick[i] = now(); } // wiggle one ear
  function nodHead() { anim.nodStart = now(); }
  function reactRegion(reg) {
    if (acting) return;
    if (reg === 'ear-l') { say(); kickEar(0); }
    else if (reg === 'ear-r') { say(); kickEar(1); }
    else if (reg === 'face') { say(); nodHead(); if (canBlink) { happy(560); blink(); } }
    else if (reg === 'hand-l' || reg === 'hand-r') playAction('roll'); // playAction says the fixed roll line
    else { say(); react('hop'); } // body / feet / fallback
  }

  // ---------- animation ----------
  var anim = {
    dragging: false, dragRot: 0, hopStart: -1, wobStart: -1, wobAmp: 0,
    earKick: [-1, -1], nodStart: -1,
    look: { dx: 0, dy: 0 }, lookCur: { x: 0, y: 0 },
    walking: false, walkDir: 1, walkPhase: 0, facing: 1
  };

  function hopOffset(age, petH) {
    var dur = 640, tn = age / dur; if (tn >= 1) return null;
    var H = petH * 0.20, ty = 0, sx = 1, sy = 1;
    if (tn < 0.18) { var a = tn / 0.18; sy = 1 - 0.12 * a; sx = 1 + 0.10 * a; }
    else if (tn < 0.5) { var b = easeOut((tn - 0.18) / 0.32); ty = -H * b; sy = 1 + 0.07 * b; sx = 1 - 0.05 * b; }
    else if (tn < 0.72) { var c = (tn - 0.5) / 0.22; ty = -H * (1 - c); }
    else { var dd = (tn - 0.72) / 0.28, s = Math.sin(Math.PI * dd); sy = 1 - 0.11 * s; sx = 1 + 0.08 * s; }
    return { ty: ty, sx: sx, sy: sy };
  }

  var happyNow = function () { return document.body.classList.contains('is-happy'); };

  function frame() {
    var t = now() / 1000, petH = box.h;
    var br = (Math.sin(t * (Math.PI * 2) / 3.6) + 1) / 2;
    var sx = 1 + 0.016 * br, sy = 1 - 0.020 * br;
    var ty = Math.sin(t * (Math.PI * 2) / 3.6) * 1.2, rot = 0, txp = 0;

    anim.lookCur.x = lerp(anim.lookCur.x, anim.look.dx, 0.12);
    anim.lookCur.y = lerp(anim.lookCur.y, anim.look.dy, 0.12);
    if (!anim.dragging && !anim.walking) {
      rot += anim.lookCur.x * 3.2; txp += anim.lookCur.x * 3.0; ty += anim.lookCur.y * 2.0;
    }

    if (anim.walking) {
      anim.walkPhase += 0.28;
      ty += -Math.abs(Math.sin(anim.walkPhase)) * (petH * 0.035);
      rot += Math.sin(anim.walkPhase) * 2.2 + anim.walkDir * 1.5;
    }

    if (anim.dragging) {
      anim.dragRot = lerp(anim.dragRot, clamp(-drag.vx * 0.6, -13, 13), 0.25);
      rot += anim.dragRot; sy *= 1.04; sx *= 0.99;
    }

    if (anim.hopStart >= 0) {
      var h = hopOffset(now() - anim.hopStart, petH);
      if (h) { ty += h.ty; sx *= h.sx; sy *= h.sy; } else anim.hopStart = -1;
    }
    if (anim.wobStart >= 0) {
      var age = (now() - anim.wobStart) / 1000;
      if (age > 0.75) anim.wobStart = -1; else rot += Math.exp(-6 * age) * Math.sin(age * 34) * 9 * anim.wobAmp;
    }

    moveEl.style.transform =
      'translate(' + txp.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg) ' +
      'scale(' + (sx * anim.facing).toFixed(3) + ',' + sy.toFixed(3) + ')';

    // head nod (face click): a decaying squash from the feet pivot -> head dips
    if (anim.nodStart >= 0) {
      var ndAge = (now() - anim.nodStart) / 1000;
      if (ndAge > 0.62) { anim.nodStart = -1; tiltEl.style.transform = ''; }
      else {
        var ne = Math.exp(-4.5 * ndAge) * Math.cos(ndAge * 21);
        tiltEl.style.transform = 'scale(' + (1 + 0.045 * ne).toFixed(3) + ',' + (1 - 0.06 * ne).toFixed(3) + ')';
      }
    }

    // layered ear motion: gentle independent sway + outward perk when happy
    if (ears.length) {
      var perk = happyNow() ? 1 : 0, wk = anim.walking ? Math.sin(anim.walkPhase) * 1.5 : 0;
      for (var i = 0; i < ears.length; i++) {
        var s = ears[i].sign;
        var swayDeg = Math.sin(t * 1.7 + i * 0.7) * 2.6 * s;
        var rotE = swayDeg + perk * 7 * s + wk * s;
        var ek = anim.earKick[i];                       // single-ear wiggle on ear click
        if (ek >= 0) {
          var ekAge = (now() - ek) / 1000;
          if (ekAge > 0.7) anim.earKick[i] = -1;
          else rotE += Math.exp(-5 * ekAge) * Math.sin(ekAge * 42) * 18 * s;
        }
        ears[i].el.style.transform = 'rotate(' + rotE.toFixed(2) + 'deg)';
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- idle life ----------
  function idleLoop() {
    var wait = 2600 + Math.random() * 3200;
    setTimeout(function () {
      if (!anim.dragging && !acting) {
        if (pet.actions && pet.actions.roll && Math.random() < 0.12) playAction('roll');
        else if (canBlink && Math.random() < 0.82) blink();
        else if (Math.random() < 0.25) wobble(0.4);
      }
      idleLoop();
    }, wait);
  }
  idleLoop();

  // ---------- random chatter ----------
  function speechLoop() {
    var wait = 8000 + Math.random() * 14000;   // every 8–22s
    setTimeout(function () {
      if (!anim.dragging && !acting && document.visibilityState !== 'hidden') say();
      speechLoop();
    }, wait);
  }
  speechLoop();

  // ---------- IPC ----------
  if (window.petAPI) {
    window.petAPI.onReact(function (type) { react(type); });
    window.petAPI.onLook(function (v) { anim.look.dx = v.dx; anim.look.dy = v.dy; });
    window.petAPI.onWalk(function (v) { anim.walking = true; anim.walkDir = v.dir; anim.facing = v.dir < 0 ? -1 : 1; startRun(); });
    window.petAPI.onWalkStop(function () { anim.walking = false; anim.facing = 1; stopRun(); });
    window.petAPI.onScale(function (h) { scaleH = h; layout(); });
    window.petAPI.onLang(function (l) { lang = (l === 'en') ? 'en' : 'zh'; applyLang(); });
  }
})();
