// Keeps the console's work in this browser (localStorage), so a reload does not lose it and the Rules and
// Review pages see the same rules. There is no backend yet: this is per browser, not shared with the team.
const KEY = 'ddm.console.v1';

export function loadStore() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function saveStore(patch) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...loadStore(), ...patch })); } catch { /* private window: keep working unsaved */ }
}

export function resetStore() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to reset */ }
}
