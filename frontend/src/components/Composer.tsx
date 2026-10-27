import { useEffect, useRef } from "react";
import type { BackendStatus } from "../types";

type Props = {
  backendStatus: BackendStatus;
  input: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

export function Composer({ backendStatus, input, loading, onChange, onSend, onStop }: Props) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const disabled = backendStatus === "offline" || (!input.trim() && !loading);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
  }, [input]);

  return (
    <footer className="composer-wrap">
      <div className="composer">
        <textarea
          ref={inputRef}
          className="composer-input"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={backendStatus === "offline" ? "Start the backend on port 8000..." : "Ask something..."}
          rows={1}
        />
        <button
          className={`send-button ${loading ? "stop" : ""}`}
          disabled={disabled}
          onClick={loading ? onStop : onSend}
          type="button"
        >
          {loading ? "Stop" : "Send"}
        </button>
      </div>
      <div className="composer-hint">Enter to send. Shift + Enter for a new line. Ctrl + K focuses here.</div>
    </footer>
  );
}
