import type { Message } from "../types";

type Props = {
  copiedIndex: number | null;
  loading: boolean;
  messages: Message[];
  onCopy: (text: string, index: number) => void;
};

const formatMessageTime = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function ChatMessages({ copiedIndex, loading, messages, onCopy }: Props) {
  return (
    <>
      {messages.map((message, index) => (
        <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}>
          <div className={`message-bubble ${message.role}`}>
            <div className="message-text">{message.content}</div>
            {(message.created_at || (message.role === "assistant" && message.content.trim())) && (
              <div className="message-footer">
                <span>{formatMessageTime(message.created_at)}</span>
                {message.role === "assistant" && message.content.trim() && (
                <button className="copy-button" onClick={() => onCopy(message.content, index)} type="button">
                  {copiedIndex === index ? "Copied" : "Copy"}
                </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="message-row assistant">
          <div className="thinking-bubble" aria-label="Assistant is responding">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </>
  );
}
