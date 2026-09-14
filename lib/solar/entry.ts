import type { CameraView } from "./view";

// One client-side handoff for same-tab navigation; never persisted in share URLs.
let pending: CameraView | undefined;
export function setExplorerEntry(view: CameraView) {
  pending = { position: [...view.position], target: [...view.target] };
}
export function getExplorerEntry() {
  return pending;
}
export function clearExplorerEntry(view: CameraView) {
  if (pending === view) pending = undefined;
}
