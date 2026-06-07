import type { ChatMode } from "./modes";

export interface ChatStateContext {
  completedChapters: number[];
  level: string;
  ccBalance: number;
  lastSliders?: Record<string, number>;
  lastError?: string | null;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatHistoryMessage[];
  context: {
    chapter: number;
    mode: ChatMode;
    state: ChatStateContext;
  };
}

export interface ChatResponse {
  reply: string;
  placeholder?: boolean;
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Zu viele Anfragen, bitte kurz warten.");
    }
    let detail = "";
    try {
      const data = await res.json();
      if (data?.error) detail = `: ${data.error}`;
    } catch {
      /* ignore parse error */
    }
    throw new Error(`Chat-Fehler ${res.status}${detail}`);
  }
  return res.json();
}
