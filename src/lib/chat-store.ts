import { useEffect, useState, useCallback } from "react";

export type Role = "user" | "assistant";
export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  reaction?: "up" | "down";
  bookmarked?: boolean;
  attachments?: { name: string; preview: string }[];
  imageUrl?: string;
}
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  pinned?: boolean;
}

const KEY = "dksai.conversations.v1";

function read(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}
function write(c: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const c = read();
    setConversations(c);
    setActiveId(c[0]?.id ?? null);
  }, []);

  const persist = useCallback((next: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
    setConversations((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      write(resolved);
      return resolved;
    });
  }, []);

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: "New chat",
      createdAt: Date.now(),
      messages: [],
    };
    persist((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv;
  }, [persist]);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      persist(next);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
    },
    [conversations, activeId, persist],
  );

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      persist((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    },
    [persist],
  );

  const renameConversation = useCallback(
    (id: string, title: string) =>
      updateConversation(id, (c) => ({ ...c, title: title.slice(0, 60) })),
    [updateConversation],
  );

  const togglePin = useCallback(
    (id: string) =>
      updateConversation(id, (c) => ({ ...c, pinned: !c.pinned })),
    [updateConversation],
  );

  const clearAll = useCallback(() => {
    persist([]);
    setActiveId(null);
  }, [persist]);

  const importConversations = useCallback(
    (incoming: Conversation[]) => {
      const merged = [...incoming, ...conversations];
      persist(merged);
    },
    [conversations, persist],
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeId,
    setActiveId,
    active,
    newConversation,
    deleteConversation,
    updateConversation,
    renameConversation,
    togglePin,
    clearAll,
    importConversations,
  };
}