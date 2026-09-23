import type { Message, Session } from "../types";

export const API_BASE_URL = "http://localhost:8000";

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}.`);
  }

  return res.json() as Promise<T>;
}

const isMessage = (value: unknown): value is Message => {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string"
  );
};

export const normalizeMessages = (value: unknown): Message[] => {
  if (Array.isArray(value)) return value.filter(isMessage);

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    if (Array.isArray(data.messages)) return data.messages.filter(isMessage);
    if (Array.isArray(data.history)) return data.history.filter(isMessage);
  }

  return [];
};

export const makeChatTitle = (value: string) => {
  const title = value.trim().replace(/\s+/g, " ");
  if (!title) return "New Chat";
  return title.length > 42 ? `${title.slice(0, 39)}...` : title;
};

export const getSessions = () => fetchJson<Session[]>(`${API_BASE_URL}/sessions`);

export const getHistory = (id: string) => fetchJson<unknown>(`${API_BASE_URL}/history/${id}`);

export const renameSessionRequest = (id: string, title: string) =>
  fetchJson<Session>(`${API_BASE_URL}/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });

export const deleteSessionRequest = (id: string) =>
  fetchJson(`${API_BASE_URL}/sessions/${id}`, { method: "DELETE" });

export const clearAllSessionsRequest = () =>
  fetchJson(`${API_BASE_URL}/sessions`, { method: "DELETE" });

export const checkHealth = () => fetchJson(`${API_BASE_URL}/health`);
