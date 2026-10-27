export type Message = {
  role: "user" | "assistant";
  content: string;
  created_at?: string | null;
};

export type Session = {
  session_id: string;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackendStatus = "checking" | "online" | "offline";

export type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
} | null;
