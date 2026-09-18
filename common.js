const ACTIONS = [
  { id: "moveForward", label: "Move Forward", defaultKey: "w" },
  { id: "moveBackward", label: "Move Backward", defaultKey: "s" },
  { id: "moveLeft", label: "Move Left", defaultKey: "a" },
  { id: "moveRight", label: "Move Right", defaultKey: "d" },
  { id: "jump", label: "Jump", defaultKey: "space" },
  { id: "cycleWeapon", label: "Cycle Weapon", defaultKey: "1" },
  { id: "useEquipment", label: "Use Equipment", defaultKey: "2" },
  { id: "useAbility", label: "Use Ability", defaultKey: "3" },
  { id: "useItem", label: "Use Item", defaultKey: "4" },
  { id: "reload", label: "Reload", defaultKey: "r" },
  { id: "melee", label: "Melee", defaultKey: "q" },
  { id: "use", label: "Use", defaultKey: "e" },
  { id: "matchOptions", label: "Match Options", defaultKey: "tab" },
  { id: "chat", label: "Chat", defaultKey: "enter" },
  { id: "teamChat", label: "Team Chat", defaultKey: "backspace" },
  { id: "doEmote", label: "Do Emote", defaultKey: "b" },
];

const SPECIAL_FEATURES = [
  {
    id: "holdScope",
    group: "Scope",
    label: "Hold",
    defaultKey: "z",
    desc: "Hold the key down to look through your scope. Let go and it closes.",
  },
  {
    id: "toggleScope",
    group: "Scope",
    label: "Toggle",
    defaultKey: "p",
    desc: "Tap once to open your scope, tap again to close it. No need to hold.",
  },
  {
    id: "holdSprint",
    group: "Sprint",
    label: "Hold",
    defaultKey: "shift",
    desc: "Hold the key down to run. Let go and you walk again — the normal way sprint works.",
  },
  {
    id: "toggleSprint",
    group: "Sprint",
    label: "Toggle",
    defaultKey: "m",
    desc: "Tap once and you'll auto-run whenever you're moving, until you tap it again to turn it off.",
  },
];

const KEY_INFO = {
  w: { key: "w", code: "KeyW", keyCode: 87 },
  s: { key: "s", code: "KeyS", keyCode: 83 },
  a: { key: "a", code: "KeyA", keyCode: 65 },
  d: { key: "d", code: "KeyD", keyCode: 68 },
  q: { key: "q", code: "KeyQ", keyCode: 81 },
  e: { key: "e", code: "KeyE", keyCode: 69 },
  r: { key: "r", code: "KeyR", keyCode: 82 },
  b: { key: "b", code: "KeyB", keyCode: 66 },
  "1": { key: "1", code: "Digit1", keyCode: 49 },
  "2": { key: "2", code: "Digit2", keyCode: 50 },
  "3": { key: "3", code: "Digit3", keyCode: 51 },
  "4": { key: "4", code: "Digit4", keyCode: 52 },
  space: { key: " ", code: "Space", keyCode: 32 },
  shift: { key: "Shift", code: "ShiftLeft", keyCode: 16, shiftKey: true },
  tab: { key: "Tab", code: "Tab", keyCode: 9 },
  enter: { key: "Enter", code: "Enter", keyCode: 13 },
  backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
};

const KEY_DISPLAY_NAMES = {
  space: "Space",
  shift: "Shift",
  tab: "Tab",
  enter: "Enter",
  backspace: "Backspace",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  control: "Ctrl",
  alt: "Alt",
  capslock: "Caps Lock",
  escape: "Esc",
};

function normalizeKey(e) {
  if (e.key === " ") return "space";
  return e.key.toLowerCase();
}

function displayKeyName(canonical) {
  if (!canonical) return "?";
  if (KEY_DISPLAY_NAMES[canonical]) return KEY_DISPLAY_NAMES[canonical];
  return canonical.length === 1 ? canonical.toUpperCase() : canonical;
}

function buildDefaultSettings() {
  const actions = {};
  ACTIONS.forEach((a) => {
    actions[a.id] = { enabled: true, key: a.defaultKey };
  });
  const special = {};
  SPECIAL_FEATURES.forEach((f) => {
    special[f.id] = { enabled: true, key: f.defaultKey };
  });
  return { actions, special };
}

function mergeSettings(stored) {
  const defaults = buildDefaultSettings();
  const merged = { actions: {}, special: {} };
  ACTIONS.forEach((a) => {
    merged.actions[a.id] = {
      ...defaults.actions[a.id],
      ...((stored && stored.actions && stored.actions[a.id]) || {}),
    };
  });
  SPECIAL_FEATURES.forEach((f) => {
    merged.special[f.id] = {
      ...defaults.special[f.id],
      ...((stored && stored.special && stored.special[f.id]) || {}),
    };
  });
  return merged;
}
