let settings = buildDefaultSettings();
let listeningFor = null;

const listEl = document.getElementById("keybindList");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

let statusTimer = null;
function showStatus(text) {
  statusEl.textContent = text;
  statusEl.classList.add("visible");
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.classList.remove("visible");
  }, 900);
}

function save() {
  chrome.storage.sync.set({ repulsSettings: settings }, () => showStatus("Saved"));
}

function currentKeyFor(kind, id) {
  return (kind === "special" ? settings.special[id] : settings.actions[id]).key;
}

function cancelListening() {
  if (listeningFor && listeningFor.buttonEl) {
    listeningFor.buttonEl.classList.remove("listening");
    listeningFor.buttonEl.textContent = displayKeyName(
      currentKeyFor(listeningFor.kind, listeningFor.id)
    );
  }
  listeningFor = null;
}

function makeKeyButton(kind, meta) {
  const keyBtn = document.createElement("button");
  keyBtn.className = "key-btn";
  keyBtn.type = "button";
  keyBtn.textContent = displayKeyName(currentKeyFor(kind, meta.id));

  keyBtn.addEventListener("click", () => {
    cancelListening();
    listeningFor = { kind, id: meta.id, buttonEl: keyBtn };
    keyBtn.classList.add("listening");
    keyBtn.textContent = "Press any key";
  });

  return keyBtn;
}

function makeActionRow(meta) {
  const row = document.createElement("div");
  row.className = "row";

  const textWrap = document.createElement("div");
  textWrap.className = "row-text";
  const title = document.createElement("strong");
  title.textContent = meta.label;
  textWrap.appendChild(title);

  row.appendChild(textWrap);
  row.appendChild(makeKeyButton("action", meta));
  return row;
}

function makeSpecialRow(meta) {
  const cfg = settings.special[meta.id];
  const row = document.createElement("div");
  row.className = "row";

  const switchLabel = document.createElement("label");
  switchLabel.className = "switch";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !!cfg.enabled;
  const slider = document.createElement("span");
  slider.className = "slider";
  switchLabel.appendChild(checkbox);
  switchLabel.appendChild(slider);

  checkbox.addEventListener("change", () => {
    cfg.enabled = checkbox.checked;
    save();
  });

  const textWrap = document.createElement("div");
  textWrap.className = "row-text";
  const title = document.createElement("strong");
  title.textContent = meta.label;
  textWrap.appendChild(title);
  if (meta.desc) {
    const desc = document.createElement("span");
    desc.className = "row-desc";
    desc.textContent = meta.desc;
    textWrap.appendChild(desc);
  }

  row.appendChild(switchLabel);
  row.appendChild(textWrap);
  row.appendChild(makeKeyButton("special", meta));
  return row;
}

const GROUP_ICONS = {
  Scope: '<svg viewBox="0 0 16 16" width="11" height="11"><circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="1.1" fill="currentColor"/><line x1="8" y1="0.5" x2="8" y2="2.6" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="13.4" x2="8" y2="15.5" stroke="currentColor" stroke-width="1.4"/><line x1="0.5" y1="8" x2="2.6" y2="8" stroke="currentColor" stroke-width="1.4"/><line x1="13.4" y1="8" x2="15.5" y2="8" stroke="currentColor" stroke-width="1.4"/></svg>',
  Sprint: '<svg viewBox="0 0 16 16" width="11" height="11"><path d="M1 4 L7 8 L1 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 4 L14 8 L8 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function makeDivider(text) {
  const div = document.createElement("div");
  div.className = "divider";
  const icon = document.createElement("span");
  icon.className = "divider-icon";
  icon.innerHTML = GROUP_ICONS[text] || "";
  const label = document.createElement("span");
  label.textContent = text;
  div.appendChild(icon);
  div.appendChild(label);
  return div;
}

function render() {
  listEl.innerHTML = "";
  let rowIndex = 0;

  const stampIndex = (el) => {
    el.style.setProperty("--row-index", rowIndex);
    rowIndex++;
    return el;
  };

  ACTIONS.forEach((meta) => listEl.appendChild(stampIndex(makeActionRow(meta))));

  let lastGroup = null;
  SPECIAL_FEATURES.forEach((meta) => {
    if (meta.group !== lastGroup) {
      listEl.appendChild(stampIndex(makeDivider(meta.group)));
      lastGroup = meta.group;
    }
    listEl.appendChild(stampIndex(makeSpecialRow(meta)));
  });
}

document.addEventListener("keydown", (e) => {
  if (!listeningFor) return;
  e.preventDefault();
  e.stopPropagation();

  if (e.key === "Escape") {
    cancelListening();
    return;
  }

  const key = normalizeKey(e);
  const cfg =
    listeningFor.kind === "special" ? settings.special[listeningFor.id] : settings.actions[listeningFor.id];
  cfg.key = key;

  listeningFor.buttonEl.classList.remove("listening");
  listeningFor.buttonEl.textContent = displayKeyName(key);
  listeningFor = null;
  save();
});

resetBtn.addEventListener("click", () => {
  settings = buildDefaultSettings();
  save();
  render();
});

chrome.storage.sync.get({ repulsSettings: buildDefaultSettings() }, (stored) => {
  settings = mergeSettings(stored.repulsSettings);
  render();
});
