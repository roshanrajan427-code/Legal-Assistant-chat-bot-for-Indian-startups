import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ChatMessages } from "./components/ChatMessages";
import { Composer } from "./components/Composer";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EmptyChat } from "./components/EmptyChat";
import { LegalDisclaimer } from "./components/LegalDisclaimer";
import { SettingsMenu } from "./components/SettingsMenu";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import {
  API_BASE_URL,
  checkHealth,
  clearAllSessionsRequest,
  deleteSessionRequest,
  getHistory,
  getSessions,
  makeChatTitle,
  normalizeMessages,
  renameSessionRequest
} from "./lib/api";
import type { BackendStatus, ConfirmState, Message, Session } from "./types";

const DRAFT_KEY = "legal_assistant_draft";
const SIDEBAR_KEY = "sidebar_open";

export default function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>(() => localStorage.getItem(DRAFT_KEY) ?? "");
  const [loading, setLoading] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const currentTitle = useMemo(() => {
    return sessions.find((session) => session.session_id === sessionId)?.title ?? "New Chat";
  }, [sessionId, sessions]);

  const refreshStatus = async () => {
    try {
      await checkHealth();
      setBackendStatus("online");
      setError("");
    } catch {
      setBackendStatus("offline");
      setError("Backend offline. Start the FastAPI server on port 8000.");
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(Array.isArray(data) ? data : []);
      setBackendStatus("online");
    } catch {
      setSessions([]);
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, input);
  }, [input]);

  useEffect(() => {
    checkHealth()
      .then(() => {
        setBackendStatus("online");
        setError("");
      })
      .catch(() => {
        setBackendStatus("offline");
        setError("Backend offline. Start the FastAPI server on port 8000.");
      });

    getSessions()
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setBackendStatus("online");
      })
      .catch(() => {
        setSessions([]);
        setBackendStatus("offline");
      });

    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, historyLoading]);

  const copy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  };

  const exportChat = () => {
    if (messages.length === 0) {
      setError("There is no chat to export yet.");
      return;
    }

    const text = messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${makeChatTitle(currentTitle)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startNewChat = () => {
    abortControllerRef.current?.abort();
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setInput("");
    setCopiedIndex(null);
    setError("");
    setHistoryLoading(false);
    setLoading(false);
    setOpenMenuSessionId(null);
  };

  const openSession = async (id: string) => {
    abortControllerRef.current?.abort();
    setOpenMenuSessionId(null);
    setSessionId(id);
    setInput("");
    setCopiedIndex(null);
    setError("");
    setHistoryLoading(true);

    try {
      const data = await getHistory(id);
      const history = normalizeMessages(data);
      setMessages(
        history.length > 0
          ? history
          : [
              {
                role: "assistant",
                content: "This saved chat does not have any messages yet."
              }
            ]
      );
      setBackendStatus("online");
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "I could not load this saved chat. Make sure the backend is running and try again."
        }
      ]);
      setError("Could not load chat history. Make sure the backend is running.");
      setBackendStatus("offline");
    } finally {
      setHistoryLoading(false);
    }
  };

  const renameSession = async (id: string) => {
    const title = editingTitle.trim();
    if (!title) {
      setError("Chat title cannot be empty.");
      return;
    }

    try {
      const updated = await renameSessionRequest(id, title);
      setSessions((prev) =>
        prev.map((session) => (session.session_id === id ? { ...session, ...updated } : session))
      );
      setEditingSessionId(null);
      setEditingTitle("");
      setOpenMenuSessionId(null);
      setError("");
      setBackendStatus("online");
    } catch {
      setError("Could not rename this chat. Check the backend connection.");
      setBackendStatus("offline");
    }
  };

  const requestDeleteSession = (session: Session) => {
    setConfirm({
      title: "Delete saved chat?",
      description: `This will permanently delete "${session.title}".`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        void deleteSession(session);
      }
    });
  };

  const deleteSession = async (session: Session) => {
    try {
      await deleteSessionRequest(session.session_id);
      setSessions((prev) => prev.filter((item) => item.session_id !== session.session_id));
      if (sessionId === session.session_id) startNewChat();
      setError("");
      setBackendStatus("online");
    } catch {
      setError("Could not delete this chat. Check the backend connection.");
      setBackendStatus("offline");
    }
  };

  const requestClearAll = () => {
    setConfirm({
      title: "Clear all saved chats?",
      description: "This permanently deletes every saved conversation in this workspace.",
      confirmLabel: "Clear All",
      danger: true,
      onConfirm: () => {
        void clearAllSessions();
      }
    });
  };

  const clearAllSessions = async () => {
    try {
      await clearAllSessionsRequest();
      setSessions([]);
      startNewChat();
      setSettingsOpen(false);
      setError("");
      setBackendStatus("online");
    } catch {
      setError("Could not clear saved chats. Check the backend connection.");
      setBackendStatus("offline");
    }
  };

  const startRename = (session: Session) => {
    setOpenMenuSessionId(null);
    setEditingSessionId(session.session_id);
    setEditingTitle(session.title);
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "b") {
        event.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      if ((event.ctrlKey || event.metaKey) && key === "n") {
        event.preventDefault();
        startNewChat();
      }

      if (event.key === "Escape") {
        setOpenMenuSessionId(null);
        setEditingSessionId(null);
        setSettingsOpen(false);
        setConfirm(null);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const sendMessage = async (customInput?: string) => {
    const question = (customInput ?? input).trim();
    if (!question || loading || historyLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question,
          history: newMessages,
          session_id: sessionId
        })
      });

      if (!res.ok) throw new Error("Backend returned an error while answering.");
      if (!res.body) throw new Error("The backend returned an empty response.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `${lastMessage.content}${chunk}`
          };
          return updated;
        });
      }

      await loadSessions();
      setBackendStatus("online");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];

          if (lastMessage?.role === "assistant") {
            updated[updated.length - 1] = {
              role: "assistant",
              content: lastMessage.content || "Response stopped."
            };
            return updated;
          }

          return [...updated, { role: "assistant", content: "Response stopped." }];
        });
      } else {
        setError("Could not get a response. Make sure the backend is running on port 8000.");
        setBackendStatus("offline");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I could not reach the backend. Start the server on port 8000 and try again."
          }
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <AppErrorBoundary>
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <div className="mobile-scrim" onClick={() => setSidebarOpen(false)} />

      <Sidebar
        activeSessionId={sessionId}
        editingSessionId={editingSessionId}
        editingTitle={editingTitle}
        historyLoading={historyLoading}
        openMenuSessionId={openMenuSessionId}
        onClose={() => setSidebarOpen(false)}
        onDelete={requestDeleteSession}
        onEditTitle={setEditingTitle}
        onExport={exportChat}
        onNewChat={startNewChat}
        onOpenSession={openSession}
        onRename={renameSession}
        onSearch={setSearch}
        onSetOpenMenu={setOpenMenuSessionId}
        onStartRename={startRename}
        search={search}
        sessions={sessions}
      />

      <main className="main-panel">
        <TopBar
          backendStatus={backendStatus}
          currentTitle={currentTitle}
          onOpenSettings={() => setSettingsOpen((prev) => !prev)}
          onRetryStatus={() => {
            setBackendStatus("checking");
            void refreshStatus();
          }}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <SettingsMenu
          apiBaseUrl={API_BASE_URL}
          isOpen={settingsOpen}
          onClearAll={requestClearAll}
          onClose={() => setSettingsOpen(false)}
          onExport={exportChat}
          onNewChat={startNewChat}
        />

        {error && (
          <div className="notice" role="status">
            {error}
          </div>
        )}

        <div className="chat-wrapper">
          <div className="chat">
            {historyLoading ? (
              <div className="loading-panel">Opening chat...</div>
            ) : messages.length === 0 ? (
              <EmptyChat onPrompt={sendMessage} />
            ) : (
              <ChatMessages copiedIndex={copiedIndex} loading={loading} messages={messages} onCopy={copy} />
            )}

            <div ref={endRef} />
          </div>
        </div>

        <LegalDisclaimer />

        <Composer
          backendStatus={backendStatus}
          input={input}
          loading={loading}
          onChange={setInput}
          onSend={() => void sendMessage()}
          onStop={stopGeneration}
        />
      </main>

      <ConfirmDialog confirm={confirm} onCancel={() => setConfirm(null)} />
    </div>
    </AppErrorBoundary>
  );
}
