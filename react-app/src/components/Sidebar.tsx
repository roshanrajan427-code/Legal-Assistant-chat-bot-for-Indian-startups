import type { Session } from "../types";
import { formatSessionDate, groupSessions } from "../lib/sessions";

type Props = {
  activeSessionId: string;
  editingSessionId: string | null;
  editingTitle: string;
  historyLoading: boolean;
  openMenuSessionId: string | null;
  onClose: () => void;
  onDelete: (session: Session) => void;
  onEditTitle: (title: string) => void;
  onExport: () => void;
  onNewChat: () => void;
  onOpenSession: (id: string) => void;
  onRename: (id: string) => void;
  onSearch: (value: string) => void;
  onSetOpenMenu: (id: string | null) => void;
  onStartRename: (session: Session) => void;
  search: string;
  sessions: Session[];
};

export function Sidebar({
  activeSessionId,
  editingSessionId,
  editingTitle,
  historyLoading,
  openMenuSessionId,
  onClose,
  onDelete,
  onEditTitle,
  onExport,
  onNewChat,
  onOpenSession,
  onRename,
  onSearch,
  onSetOpenMenu,
  onStartRename,
  search,
  sessions
}: Props) {
  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const groups = groupSessions(filteredSessions);

  return (
    <aside className="sidebar" aria-label="Chat history">
      <div className="sidebar-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">LA</div>
          <div>
            <div className="sidebar-title">Legal Assistant</div>
            <div className="sidebar-subtitle">Chat history</div>
          </div>
        </div>
        <button className="icon-button" onClick={onClose} type="button" aria-label="Close sidebar">
          Close
        </button>
      </div>

      <div className="sidebar-actions">
        <button className="button primary" onClick={onNewChat} type="button">
          New Chat
        </button>
        <button className="button secondary" onClick={onExport} type="button">
          Export Chat
        </button>
      </div>

      <label className="search-wrap">
        <span>Search saved chats</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search history..."
        />
      </label>

      <div className="session-list">
        {filteredSessions.length === 0 ? (
          <div className="empty-state small">{sessions.length === 0 ? "No saved chats yet" : "No chats found"}</div>
        ) : (
          groups.map((group) => (
            <section className="session-group" key={group.label}>
              <div className="session-group-title">{group.label}</div>
              {group.sessions.map((session) => {
                const isActive = activeSessionId === session.session_id;
                const isEditing = editingSessionId === session.session_id;

                return (
                  <div className={`session-row ${isActive ? "active" : ""}`} key={session.session_id}>
                    {isEditing ? (
                      <form
                        className="rename-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          onRename(session.session_id);
                        }}
                      >
                        <input
                          className="rename-input"
                          value={editingTitle}
                          onChange={(event) => onEditTitle(event.target.value)}
                          autoFocus
                        />
                        <button className="mini-button" type="submit">Save</button>
                      </form>
                    ) : (
                      <>
                        <button className="session-main" onClick={() => onOpenSession(session.session_id)} type="button">
                          <span className="session-title">{session.title}</span>
                          <span className="session-meta">
                            {isActive && historyLoading ? "Opening..." : formatSessionDate(session.updated_at)}
                          </span>
                        </button>
                        <div className="session-menu-wrap">
                          <button
                            className="session-menu-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetOpenMenu(openMenuSessionId === session.session_id ? null : session.session_id);
                            }}
                            type="button"
                            aria-label={`Open menu for ${session.title}`}
                            aria-expanded={openMenuSessionId === session.session_id}
                          >
                            ...
                          </button>
                          {openMenuSessionId === session.session_id && (
                            <div className="session-menu" role="menu">
                              <button
                                onClick={() => {
                                  onSetOpenMenu(null);
                                  onStartRename(session);
                                }}
                                role="menuitem"
                                type="button"
                              >
                                Rename
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  onSetOpenMenu(null);
                                  onDelete(session);
                                }}
                                role="menuitem"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </aside>
  );
}
