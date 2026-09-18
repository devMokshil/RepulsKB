# RepulsKB # 

Full keybind remapping for repuls.io, plus Hold/Toggle modes for Scope and Sprint.
Rebind any action to any key, right from the extension popup, without touching the game's own keybind menu.

## Features ## 

- Full action remap — every in-game action (movement, weapons, reload, chat, etc.) bindable to any key you want
- Scope: Hold or Toggle — hold the key like a normal shooter, or tap to toggle it open/closed
- Sprint: Hold or Toggle — hold to run as normal, or toggle it on and it auto-runs while you're moving
- Typing protection — all keybinds automatically pause while typing in any text field
- No game-side setup required beyond one reset

## Installation ##
This isn't on the Chrome Web Store — install it directly from this repo instead:

1) Click the green Code button at the top of this repo, then Download ZIP.
2) Extract the ZIP.
3) Go to chrome://extensions (or the equivalent in Edge/Brave).
4) Enable Developer mode (top-right toggle).
5) Click Load unpacked and select the extracted folder.
6) In repuls.io: Settings → Controls → Reset To Default, once. From then on, do all your rebinding through the extension instead.

## Usage ## 

Click the extension icon. Click any key box, then press the key you want to bind — it saves instantly. Scroll down for Scope and Sprint, each with their own Hold/Toggle modes and on/off switch.

## How it works ## 

The extension assumes repuls.io's own keybinds are left at their defaults. When you press your custom key, content.js intercepts it and dispatches a synthetic keyboard event for the game's actual default key instead — so the game behaves exactly as if you'd pressed its own default binding. If an action has been remapped, its old default key is disabled so it can't double-trigger alongside the new one.

## Project structure ## 
.

├── manifest.json     Extension manifest (Manifest V3)

├── common.js         Shared action/keybind metadata used by content.js and popup.js

├── content.js        Injected into repuls.io — does the actual key interception/remapping

├── popup.html        Extension popup UI

├── popup.js          Popup logic (renders the keybind list, saves settings)

├── popup.css         Popup styling

└── icons/            Toolbar/extension icons


## Contributing ##

Issues and pull requests are welcome. New remappable actions go in the ACTIONS array in common.js — both content.js and popup.js read from that shared list.

## Known limitation ## 

Browsers mark script-generated key/mouse events as isTrusted: false. Most sites treat these the same as real input, but if a site specifically checks isTrusted to block simulated input, no browser extension can work around that.

## Built by devMokshil ## 
