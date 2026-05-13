import { useEffect, useState, useCallback } from "react";

export type Role = "user" | "assistant";
export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
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

  const persist = useCallback((c: Conversation[]) => {
    setConversations(c);
    write(c);
  }, []);

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: "New chat",
      createdAt: Date.now(),
      messages: [],
    };
    const next = [conv, ...conversations];
    persist(next);
    setActiveId(conv.id);
    return conv;
  }, [conversations, persist]);

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
      const next = conversations.map((c) => (c.id === id ? updater(c) : c));
      persist(next);
    },
    [conversations, persist],
  );

  const renameConversation = useCallback(
    (id: string, title: string) =>
      updateConversation(id, (c) => ({ ...c, title: title.slice(0, 60) })),
    [updateConversation],
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
  };
}