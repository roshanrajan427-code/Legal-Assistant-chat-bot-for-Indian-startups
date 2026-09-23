type Props = {
  apiBaseUrl: string;
  isOpen: boolean;
  onClearAll: () => void;
  onClose: () => void;
  onExport: () => void;
  onNewChat: () => void;
};

export function SettingsMenu({ apiBaseUrl, isOpen, onClearAll, onClose, onExport, onNewChat }: Props) {
  if (!isOpen) return null;

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div>
          <h2>Settings</h2>
          <p>Workspace preferences</p>
        </div>
        <button className="icon-button" onClick={onClose} type="button">Close</button>
      </div>

      <div className="settings-section">
        <label>
          Backend URL
          <input value={apiBaseUrl} readOnly />
        </label>
      </div>

      <div className="settings-actions">
        <button className="button secondary" onClick={onNewChat} type="button">Start New Chat</button>
        <button className="button secondary" onClick={onExport} type="button">Export Current Chat</button>
        <button className="button danger-solid" onClick={onClearAll} type="button">Clear All Chats</button>
      </div>
    </div>
  );
}
