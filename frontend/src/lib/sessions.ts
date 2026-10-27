import type { Session } from "../types";

export const formatSessionDate = (value?: string | null) => {
  if (!value) return "Saved chat";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved chat";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(date);
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const getSessionGroupLabel = (session: Session) => {
  const rawDate = session.updated_at ?? session.created_at;
  if (!rawDate) return "Older";

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Older";

  const today = startOfDay(new Date());
  const sessionDay = startOfDay(date);
  const diffDays = Math.round((today - sessionDay) / 86_400_000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 Days";
  return "Older";
};

export const groupSessions = (sessions: Session[]) => {
  const order = ["Today", "Yesterday", "Previous 7 Days", "Older"];
  const groups = new Map<string, Session[]>();

  for (const session of sessions) {
    const label = getSessionGroupLabel(session);
    groups.set(label, [...(groups.get(label) ?? []), session]);
  }

  return order
    .map((label) => ({ label, sessions: groups.get(label) ?? [] }))
    .filter((group) => group.sessions.length > 0);
};
