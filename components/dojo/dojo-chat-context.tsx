"use client";

import * as React from "react";
import { nanoid } from "nanoid";
import type { DojoChatSidebarChat, DojoChatProject } from "@/components/dojo/dojo-chat-sidebar";
import { messagesToMarkdown } from "@/components/ai-elements/conversation";

const DOJO_CHATS_STORAGE_KEY = "dojo-chats";
const DOJO_MESSAGES_STORAGE_KEY = "dojo-chat-messages";
const DOJO_DEFAULT_MODEL_STORAGE_KEY = "dojo-default-chat-model";
const DOJO_PROJECTS_STORAGE_KEY = "dojo-projects";

export interface ChatMessageRecord {
  role: "user" | "assistant";
  content: string;
}

export type DojoChatContextValue = {
  chats: DojoChatSidebarChat[];
  activeChatId: string | null;
  projects: DojoChatProject[];
  newChat: () => string;
  selectChat: (id: string | null) => void;
  setMessagesForChat: (chatId: string, messages: ChatMessageRecord[]) => void;
  getMessagesForChat: (chatId: string) => ChatMessageRecord[];
  updateChatTitle: (chatId: string, title: string) => void;
  pinChat: (chatId: string, pinned: boolean) => void;
  archiveChat: (chatId: string, archived: boolean) => void;
  deleteChat: (chatId: string) => void;
  downloadChat: (chatId: string) => void;
  addProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  moveChatToProject: (chatId: string, projectId: string | null) => void;
  defaultChatModel: string | null;
  setDefaultChatModel: (model: string | null) => void;
};

const DojoChatContext = React.createContext<DojoChatContextValue | null>(null);

export function useDojoChat(): DojoChatContextValue {
  const ctx = React.useContext(DojoChatContext);
  if (!ctx) {
    throw new Error("useDojoChat must be used within DojoChatProvider");
  }
  return ctx;
}

export function useDojoChatOptional(): DojoChatContextValue | null {
  return React.useContext(DojoChatContext);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function DojoChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = React.useState<DojoChatSidebarChat[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [messagesByChatId, setMessagesByChatId] = React.useState<Record<string, ChatMessageRecord[]>>({});
  const [projects, setProjects] = React.useState<DojoChatProject[]>([]);
  const [defaultChatModel, setDefaultChatModelState] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const savedChats = loadFromStorage<DojoChatSidebarChat[]>(DOJO_CHATS_STORAGE_KEY, []);
    const savedMessages = loadFromStorage<Record<string, ChatMessageRecord[]>>(DOJO_MESSAGES_STORAGE_KEY, {});
    const savedModel = loadFromStorage<string | null>(DOJO_DEFAULT_MODEL_STORAGE_KEY, null);
    const savedProjects = loadFromStorage<DojoChatProject[]>(DOJO_PROJECTS_STORAGE_KEY, []);
    if (savedChats.length > 0) {
      setChats(
        savedChats.map((c) => ({ ...c, archived: c.archived ?? false }))
      );
    }
    if (Object.keys(savedMessages).length > 0) setMessagesByChatId(savedMessages);
    if (savedModel) setDefaultChatModelState(savedModel);
    if (savedProjects.length > 0) setProjects(savedProjects);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    saveToStorage(DOJO_CHATS_STORAGE_KEY, chats);
  }, [chats, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveToStorage(DOJO_MESSAGES_STORAGE_KEY, messagesByChatId);
  }, [messagesByChatId, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveToStorage(DOJO_PROJECTS_STORAGE_KEY, projects);
  }, [projects, hydrated]);

  const setDefaultChatModel = React.useCallback((model: string | null) => {
    setDefaultChatModelState(model);
    saveToStorage(DOJO_DEFAULT_MODEL_STORAGE_KEY, model);
  }, []);

  const newChat = React.useCallback(() => {
    const id = nanoid();
    const now = new Date().toISOString();
    const chat: DojoChatSidebarChat = {
      id,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
      pinned: false,
      archived: false,
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    setMessagesByChatId((prev) => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const selectChat = React.useCallback((id: string | null) => {
    setActiveChatId(id);
  }, []);

  const setMessagesForChat = React.useCallback((chatId: string, messages: ChatMessageRecord[]) => {
    setMessagesByChatId((prev) => ({ ...prev, [chatId]: messages }));
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const getMessagesForChat = React.useCallback(
    (chatId: string): ChatMessageRecord[] => {
      return messagesByChatId[chatId] ?? [];
    },
    [messagesByChatId]
  );

  const updateChatTitle = React.useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: title || "Untitled", updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  const pinChat = React.useCallback((chatId: string, pinned: boolean) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, pinned } : c))
    );
  }, []);

  const archiveChat = React.useCallback((chatId: string, archived: boolean) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, archived } : c))
    );
  }, []);

  const deleteChat = React.useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessagesByChatId((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    setActiveChatId((current) => (current === chatId ? null : current));
  }, []);

  const addProject = React.useCallback((name: string) => {
    const id = nanoid();
    setProjects((prev) => [...prev, { id, name: name || "New project" }]);
    return id;
  }, []);

  const renameProject = React.useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name || p.name } : p))
    );
  }, []);

  const deleteProject = React.useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setChats((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c))
    );
  }, []);

  const moveChatToProject = React.useCallback((chatId: string, projectId: string | null) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, folderId: projectId, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  const downloadChat = React.useCallback(
    (chatId: string) => {
      const messages = messagesByChatId[chatId] ?? [];
      const conv = messages.map((m) => ({ role: m.role, content: m.content }));
      const markdown = messagesToMarkdown(conv);
      const chat = chats.find((c) => c.id === chatId);
      const name = (chat?.title ?? "chat").replace(/[^a-z0-9-_]/gi, "_");
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}_${chatId.slice(0, 8)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [messagesByChatId, chats]
  );

  const value = React.useMemo<DojoChatContextValue>(
    () => ({
      chats,
      activeChatId,
      projects,
      newChat,
      selectChat,
      setMessagesForChat,
      getMessagesForChat,
      updateChatTitle,
      pinChat,
      archiveChat,
      deleteChat,
      downloadChat,
      addProject,
      renameProject,
      deleteProject,
      moveChatToProject,
      defaultChatModel,
      setDefaultChatModel,
    }),
    [
      chats,
      activeChatId,
      projects,
      newChat,
      selectChat,
      setMessagesForChat,
      getMessagesForChat,
      updateChatTitle,
      pinChat,
      archiveChat,
      deleteChat,
      downloadChat,
      addProject,
      renameProject,
      deleteProject,
      moveChatToProject,
      defaultChatModel,
      setDefaultChatModel,
    ]
  );

  return (
    <DojoChatContext.Provider value={value}>{children}</DojoChatContext.Provider>
  );
}
