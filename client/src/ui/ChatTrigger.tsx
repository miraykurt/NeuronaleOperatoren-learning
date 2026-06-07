import { useAppStore } from "../state/store";
import type { ChatMode } from "../chatbot/modes";

interface Props {
  mode: ChatMode;
  question: string;
  label: string;
}

// Kleiner Inline-Button, der eine konkrete Frage an den Tutor stellt.
// Öffnet das Chat-Panel, setzt den gewünschten Modus und sendet die
// Frage direkt ab. Der Lerner sieht sofort eine Antwort.
export function ChatTrigger({ mode, question, label }: Props) {
  const trigger = useAppStore((s) => s.triggerChat);
  return (
    <button
      type="button"
      className="chat-trigger"
      onClick={() => trigger(mode, question)}
    >
      <svg
        className="chat-trigger-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />
      </svg>
      <span className="chat-trigger-label">{label}</span>
    </button>
  );
}
