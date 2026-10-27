import type { BackendStatus } from "../types";
import { BackendBadge } from "./BackendBadge";

type Props = {
  backendStatus: BackendStatus;
  currentTitle: string;
  onOpenSettings: () => void;
  onRetryStatus: () => void;
  onToggleSidebar: () => void;
};

export function TopBar({
  backendStatus,
  currentTitle,
  onOpenSettings,
  onRetryStatus,
  onToggleSidebar
}: Props) {
  return (
    <header className="top-bar">
      <button className="menu-button" onClick={onToggleSidebar} type="button" aria-label="Open sidebar">
        Menu
      </button>
      <div className="top-title-block">
        <div className="current-title">{currentTitle}</div>
        <div className="current-subtitle">Startup Legal Assistant</div>
      </div>
      <BackendBadge status={backendStatus} onRetry={onRetryStatus} />
      <button className="settings-button" onClick={onOpenSettings} type="button">
        Settings
      </button>
    </header>
  );
}
