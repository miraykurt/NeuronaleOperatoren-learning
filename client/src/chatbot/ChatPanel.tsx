import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../state/store";
import { modes, sokratesSuggestions, type ChatMode } from "./modes";
import { sendChatMessage } from "./chatClient";

const TUTOR_ICON = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9 10c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.4-1 2.2-2 2.7-.6.3-1 .7-1 1.3" />
    <line x1="12" y1="17" x2="12" y2="17.5" />
  </svg>
);

export function ChatPanel() {
  const chatOpen = useAppStore((s) => s.chatOpen);
  const mode = useAppStore((s) => s.chatMode);
  const messages = useAppStore((s) => s.chatMessages);
  const currentView = useAppStore((s) => s.currentView);
  const completedChapters = useAppStore((s) => s.completedChapters);
  const level = useAppStore((s) => s.level);
  const ccBalance = useAppStore((s) => s.ccBalance);
  const lastSliders = useAppStore((s) => s.lastSliders);
  const lastError = useAppStore((s) => s.lastNotebookError);

  const toggleChat = useAppStore((s) => s.toggleChat);
  const toggleChatMaximized = useAppStore((s) => s.toggleChatMaximized);
  const maximized = useAppStore((s) => s.chatMaximized);
  const setChatMode = useAppStore((s) => s.setChatMode);
  const appendChatMessage = useAppStore((s) => s.appendChatMessage);
  const clearChatMessages = useAppStore((s) => s.clearChatMessages);
  const pendingMessage = useAppStore((s) => s.chatPendingMessage);
  const consumePendingMessage = useAppStore((s) => s.consumePendingMessage);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentChapter =
    currentView.type === "chapter" ? (currentView.id as number) : 1;

  // Fallback, falls aus altem LocalStorage ein ungültiger Mode (z. B. "quiz") kommt.
  const safeMode: ChatMode = modes[mode] ? mode : "tutor";
  const safeModeInfo = modes[safeMode];

  const sokratesSuggestion =
    safeMode === "sokrates" ? sokratesSuggestions[currentChapter] : undefined;

  function useSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  // Eine via triggerChat angeforderte Frage wird direkt gesendet.
  useEffect(() => {
    if (pendingMessage && !busy) {
      const q = pendingMessage;
      consumePendingMessage();
      handleSend(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage, busy]);

  async function handleSend(override?: string) {
    const trimmed = (override ?? input).trim();
    if (!trimmed || busy) return;

    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: trimmed },
    ];

    appendChatMessage({ role: "user", content: trimmed, ts: Date.now() });
    if (!override) setInput("");
    setBusy(true);
    setError(null);

    try {
      const res = await sendChatMessage({
        messages: apiMessages,
        context: {
          chapter: currentChapter,
          mode,
          state: {
            completedChapters,
            level,
            ccBalance,
            lastSliders,
            lastError,
          },
        },
      });
      appendChatMessage({
        role: "assistant",
        content: res.reply,
        ts: Date.now(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!chatOpen) {
    return (
      <button
        className="chat-fab"
        onClick={toggleChat}
        aria-label="Tutor öffnen"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />
        </svg>
        <span>Tutor</span>
      </button>
    );
  }

  return (
    <div className={`chat-panel ${maximized ? "maximized" : ""}`}>
      <div className="chat-header">
        <div className="chat-character">
          <div className="chat-avatar">{TUTOR_ICON}</div>
          <div>
            <div className="chat-character-name">Tutor</div>
            <div className="chat-character-role">
              KI-Assistenz · {safeModeInfo.label}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="chat-iconbtn"
            onClick={toggleChatMaximized}
            aria-label={maximized ? "Chat verkleinern" : "Chat vergrößern"}
            title={maximized ? "Verkleinern" : "Vergrößern"}
          >
            {maximized ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14h6v6" />
                <path d="M20 10h-6V4" />
                <path d="M14 10l7-7" />
                <path d="M3 21l7-7" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            )}
          </button>
          <button
            className="chat-close"
            onClick={toggleChat}
            aria-label="Chat schließen"
          >
            ×
          </button>
        </div>
      </div>

      <div className="chat-controls">
        <div className="chat-modes">
          {(Object.keys(modes) as ChatMode[]).map((m) => (
            <button
              key={m}
              className={`chat-mode ${mode === m ? "active" : ""}`}
              onClick={() => setChatMode(m)}
              title={modes[m].description}
            >
              {modes[m].label}
            </button>
          ))}
        </div>
        {messages.length > 0 && (
          <button
            className="chat-clear-row"
            onClick={() => {
              if (confirm("Verlauf in diesem Fenster löschen?"))
                clearChatMessages();
            }}
          >
            Verlauf löschen
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-headline">Frag den Tutor.</div>
            <div className="chat-empty-hint">
              <strong>{safeModeInfo.label}:</strong> {safeModeInfo.description}
            </div>
            {sokratesSuggestion && (
              <div className="chat-suggestion-block">
                <div className="chat-suggestion-label">
                  Einstieg für dieses Kapitel
                </div>
                <button
                  className="chat-suggestion"
                  onClick={() => useSuggestion(sokratesSuggestion)}
                >
                  {sokratesSuggestion}
                </button>
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            {m.role === "assistant" && (
              <div className="chat-msg-avatar">{TUTOR_ICON}</div>
            )}
            <div className="chat-msg-bubble">
              {m.role === "assistant" ? (
                <div className="chat-msg-markdown">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="chat-message assistant">
            <div className="chat-msg-avatar">{TUTOR_ICON}</div>
            <div className="chat-msg-bubble chat-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Frag mich was. Enter zum Senden, Shift+Enter für Zeilenumbruch"
          rows={2}
          disabled={busy}
        />
        <button
          className="chat-send"
          onClick={() => handleSend()}
          disabled={!input.trim() || busy}
          aria-label="Senden"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22,2 15,22 11,13 2,9 22,2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
