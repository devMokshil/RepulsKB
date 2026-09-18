(function () {
  "use strict";

  let settings = buildDefaultSettings();

  function loadSettings() {
    try {
      chrome.storage.sync.get({ repulsSettings: buildDefaultSettings() }, (stored) => {
        settings = mergeSettings(stored.repulsSettings);
      });
    } catch (err) {}
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" || !changes.repulsSettings) return;
      settings = mergeSettings(changes.repulsSettings.newValue);
      if (!settings.special.toggleSprint.enabled && runModeOn) {
        runModeOn = false;
        updateShiftForMovement();
      }
    });
  } catch (err) {}

  let typingActive = false;

  function isTypingInField() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function refreshTypingState() {
    typingActive = isTypingInField();
    if (typingActive) {
      if (shiftInterval) {
        clearInterval(shiftInterval);
        shiftInterval = null;
      }
    } else if (shiftOn && !shiftInterval) {
      shiftInterval = setInterval(pressShiftOnce, 1000);
    }
  }

  document.addEventListener("focusin", refreshTypingState, true);
  document.addEventListener("focusout", refreshTypingState, true);

  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;

  function findTarget() {
    return document.querySelector("canvas") || document.body || document;
  }

  function focusTarget(target) {
    try {
      if (target && target.tabIndex === -1) target.tabIndex = 0;
      if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
    } catch (err) {}
  }

  window.addEventListener(
    "mousemove",
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
    },
    true
  );

  function dispatchAll(target, events) {
    for (const evt of events) target.dispatchEvent(evt);
  }

  function makeKeyEvent(type, canonicalKey) {
    const info = KEY_INFO[canonicalKey];
    if (!info) return null;
    return new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key: info.key,
      code: info.code,
      keyCode: info.keyCode,
      which: info.keyCode,
      shiftKey: !!info.shiftKey,
    });
  }

  function dispatchTargetKey(type, canonicalKey) {
    const evt = makeKeyEvent(type, canonicalKey);
    if (!evt) return;
    const target = findTarget();
    dispatchAll(document, [evt]);
    dispatchAll(window, [makeKeyEvent(type, canonicalKey)]);
    if (target !== document.body) dispatchAll(target, [makeKeyEvent(type, canonicalKey)]);
  }

  function rightClickDown() {
    const target = findTarget();
    focusTarget(target);
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      buttons: 2,
      clientX: lastX,
      clientY: lastY,
      screenX: lastX,
      screenY: lastY,
      pointerType: "mouse",
    };
    dispatchAll(target, [
      new PointerEvent("pointerdown", opts),
      new MouseEvent("mousedown", opts),
      new MouseEvent("contextmenu", opts),
    ]);
  }

  function rightClickUp() {
    const target = findTarget();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      buttons: 0,
      clientX: lastX,
      clientY: lastY,
      screenX: lastX,
      screenY: lastY,
      pointerType: "mouse",
    };
    dispatchAll(target, [new PointerEvent("pointerup", opts), new MouseEvent("mouseup", opts)]);
  }

  function fireRightClick() {
    rightClickDown();
    rightClickUp();
  }

  window.addEventListener(
    "contextmenu",
    (e) => {
      e.preventDefault();
    },
    true
  );

  let shiftOn = false;
  let shiftInterval = null;

  function pressShiftOnce() {
    dispatchTargetKey("keydown", "shift");
  }

  function releaseShiftOnce() {
    dispatchTargetKey("keyup", "shift");
  }

  function turnShiftOn() {
    if (shiftOn) return;
    shiftOn = true;
    focusTarget(findTarget());
    pressShiftOnce();
    if (!typingActive) shiftInterval = setInterval(pressShiftOnce, 1000);
  }

  function turnShiftOff() {
    if (!shiftOn) return;
    shiftOn = false;
    if (shiftInterval) clearInterval(shiftInterval);
    shiftInterval = null;
    releaseShiftOnce();
  }

  let runModeOn = false;
  const movementKeysHeld = new Set();

  const MOVEMENT_ACTION_IDS = ["moveForward", "moveBackward", "moveLeft", "moveRight"];

  function movementCustomKeys() {
    return MOVEMENT_ACTION_IDS.map((id) => settings.actions[id].key);
  }

  function updateShiftForMovement() {
    const shouldBeOn =
      runModeOn && settings.special.toggleSprint.enabled && movementKeysHeld.size > 0;
    if (shouldBeOn && !shiftOn) {
      turnShiftOn();
    } else if (!shouldBeOn && shiftOn) {
      turnShiftOff();
    }
  }

  function activeClaimedKeys() {
    const set = new Set();
    ACTIONS.forEach((a) => set.add(settings.actions[a.id].key));
    if (settings.special.holdScope.enabled) set.add(settings.special.holdScope.key);
    if (settings.special.toggleScope.enabled) set.add(settings.special.toggleScope.key);
    if (settings.special.toggleSprint.enabled) set.add(settings.special.toggleSprint.key);
    if (settings.special.holdSprint.enabled) set.add(settings.special.holdSprint.key);
    return set;
  }

  function orphanedDefaultKeys() {
    const claimed = activeClaimedKeys();
    const orphans = new Set();
    for (const action of ACTIONS) {
      const cfg = settings.actions[action.id];
      if (cfg.key !== action.defaultKey && !claimed.has(action.defaultKey)) {
        orphans.add(action.defaultKey);
      }
    }
    const hsp = settings.special.holdSprint;
    if (hsp.enabled && hsp.key !== "shift" && !claimed.has("shift")) {
      orphans.add("shift");
    }
    return orphans;
  }

  document.addEventListener(
    "keyup",
    (e) => {
      if (!e.isTrusted) return;
      if (e.key === "Shift" && shiftOn && !typingActive) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (!e.isTrusted) return;
      if (typingActive) return;

      const key = normalizeKey(e);

      if (orphanedDefaultKeys().has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (movementCustomKeys().includes(key)) {
        if (!e.repeat) {
          movementKeysHeld.add(key);
          updateShiftForMovement();
        }
      }

      const hs = settings.special.holdScope;
      if (hs.enabled && key === hs.key && !e.repeat) {
        fireRightClick();
      }
      const ts = settings.special.toggleScope;
      if (ts.enabled && key === ts.key && !e.repeat) {
        fireRightClick();
      }
      const tr = settings.special.toggleSprint;
      if (tr.enabled && key === tr.key && !e.repeat) {
        runModeOn = !runModeOn;
        updateShiftForMovement();
      }
      const hsp = settings.special.holdSprint;
      if (hsp.enabled && hsp.key !== "shift" && key === hsp.key && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        dispatchTargetKey("keydown", "shift");
      }

      for (const action of ACTIONS) {
        const cfg = settings.actions[action.id];
        if (cfg.key === action.defaultKey) continue;
        if (key === cfg.key) {
          e.preventDefault();
          e.stopPropagation();
          if (!e.repeat) dispatchTargetKey("keydown", action.defaultKey);
        }
      }
    },
    true
  );

  document.addEventListener(
    "keyup",
    (e) => {
      if (!e.isTrusted) return;
      if (typingActive) return;

      const key = normalizeKey(e);

      if (orphanedDefaultKeys().has(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (movementCustomKeys().includes(key)) {
        movementKeysHeld.delete(key);
        updateShiftForMovement();
      }

      const hs = settings.special.holdScope;
      if (hs.enabled && key === hs.key) {
        fireRightClick();
      }
      const hsp = settings.special.holdSprint;
      if (hsp.enabled && hsp.key !== "shift" && key === hsp.key) {
        e.preventDefault();
        e.stopPropagation();
        dispatchTargetKey("keyup", "shift");
      }

      for (const action of ACTIONS) {
        const cfg = settings.actions[action.id];
        if (cfg.key === action.defaultKey) continue;
        if (key === cfg.key) {
          e.preventDefault();
          e.stopPropagation();
          dispatchTargetKey("keyup", action.defaultKey);
        }
      }
    },
    true
  );

  loadSettings();
})();
