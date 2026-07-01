import { VERSION } from "./release.js";

// Non-local data, the calm/client-only way: a portable backup file. No server,
// no account — the learner owns a JSON they can save anywhere and restore on a
// new device. The schema stamp guards against importing a file from a future
// app version; chapter-count drift is absorbed by the store's load() (`fitLen`).

const KEYS = ["hk-progress-v2", "hk-profile-v1", "hk-theme"];
export function exportData() {
  const data = {};
  KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v != null) data[k] = v; });
  return JSON.stringify(
    { app: "herokana", schema: 1, version: VERSION, exportedAt: new Date().toISOString(), data },
    null, 2
  );
}

export function downloadBackup() {
  const blob = new Blob([exportData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `herokana-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Validate without writing — lets the UI confirm before overwriting current
// progress. Returns { ok, meta } or { ok:false, error }.
export function inspectBackup(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { return { ok: false, error: "That file isn't a valid backup." }; }
  if (!parsed || parsed.app !== "herokana" || !parsed.data || typeof parsed.data !== "object")
    return { ok: false, error: "That doesn't look like a HeroKana backup." };
  if ((parsed.schema || 1) > 1)
    return { ok: false, error: "This backup is from a newer version of HeroKana. Update the app first." };
  try {
    const prog = parsed.data["hk-progress-v2"];
    if (prog) { const o = JSON.parse(prog); if (!o || !Array.isArray(o.done)) throw 0; }
  } catch (e) { return { ok: false, error: "This backup's progress data looks corrupted." }; }
  return { ok: true, parsed, exportedAt: parsed.exportedAt, version: parsed.version };
}

// Overwrite local state from an already-inspected backup. Caller reloads after.
export function applyBackup(parsed) {
  KEYS.forEach((k) => { if (parsed.data[k] != null) localStorage.setItem(k, parsed.data[k]); });
}
