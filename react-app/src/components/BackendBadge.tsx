import type { BackendStatus } from "../types";

type Props = {
  status: BackendStatus;
  onRetry: () => void;
};

export function BackendBadge({ status, onRetry }: Props) {
  const label = {
    checking: "Checking",
    online: "Connected",
    offline: "Backend offline"
  }[status];

  return (
    <button className={`status-pill ${status}`} onClick={onRetry} type="button">
      <span className="status-dot" />
      {label}
    </button>
  );
}
