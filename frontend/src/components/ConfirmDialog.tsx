import { useEffect, useRef } from "react";
import type { ConfirmState } from "../types";

type Props = {
  confirm: ConfirmState;
  onCancel: () => void;
};

export function ConfirmDialog({ confirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!confirm) return;
    cancelRef.current?.focus();
  }, [confirm]);

  if (!confirm) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{confirm.title}</h2>
        <p>{confirm.description}</p>
        <div className="modal-actions">
          <button ref={cancelRef} className="button secondary" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={`button ${confirm.danger ? "danger-solid" : "primary"}`}
            onClick={() => {
              confirm.onConfirm();
              onCancel();
            }}
            type="button"
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
