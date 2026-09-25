import type { ReactNode } from "react";
import { SaveIndicator, type SaveState } from "./save-indicator";

/** The row above every editor: status, whether changes are saved, notices, then the actions. */
export function EditorStatusBar({ status, saveState, notices, children }: { status: ReactNode; saveState: SaveState | null; notices?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
      {status}
      <SaveIndicator state={saveState} />
      {notices}
      <div className="ms-auto flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
