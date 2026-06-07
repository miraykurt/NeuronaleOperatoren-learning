import { useState } from "react";
import { useAppStore } from "../state/store";

interface Props {
  question: string;
  chapter: number;
  onAccepted: () => void;
}

interface EvalResponse {
  reply: string;
  placeholder?: boolean;
}

async function evaluateAnswer(
  question: string,
  answer: string,
  chapter: number,
): Promise<EvalResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `Frage:\n${question}\n\nAntwort des Lernenden:\n${answer}`,
        },
      ],
      context: { chapter, mode: "evaluate" },
    }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      if (data?.error) detail = `: ${data.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(`Bewertung fehlgeschlagen ${res.status}${detail}`);
  }
  return res.json();
}

export function OpenQuestion({ question, chapter, onAccepted }: Props) {
  const ccBalance = useAppStore((s) => s.ccBalance);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function submit() {
    const trimmed = answer.trim();
    if (trimmed.length < 20) {
      setError("Bitte schreib mindestens zwei bis drei Sätze.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await evaluateAnswer(question, trimmed, chapter);
      setFeedback(res.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  function accept() {
    if (accepted) return;
    setAccepted(true);
    onAccepted();
  }

  return (
    <div className="open-question">
      <div className="open-question-prompt">{question}</div>

      <textarea
        className="open-question-input"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Deine Antwort, zwei bis drei Sätze reichen."
        rows={5}
        disabled={busy || accepted}
      />

      <div className="open-question-actions">
        <button
          className="primary-button"
          onClick={submit}
          disabled={busy || accepted || !answer.trim()}
        >
          {busy
            ? "Wird ausgewertet …"
            : feedback
              ? "Erneut bewerten lassen"
              : "Antwort bewerten lassen"}
        </button>
        {feedback && !accepted && (
          <button
            className="secondary-button"
            onClick={accept}
            style={{ marginLeft: 12 }}
          >
            Antwort einreichen & Kapitel abschließen
          </button>
        )}
      </div>

      {error && <div className="open-question-error">{error}</div>}

      {feedback && (
        <div className="open-question-feedback">
          <div className="open-question-feedback-head">Rückmeldung</div>
          <div className="open-question-feedback-body">{feedback}</div>
          {!accepted && (
            <div className="open-question-feedback-hint">
              Du kannst deine Antwort überarbeiten und erneut bewerten lassen
              oder direkt einreichen.
            </div>
          )}
        </div>
      )}

      {accepted && (
        <div className="open-question-accepted">
          Antwort eingereicht · CC-Saldo aktualisiert ({ccBalance} CC).
        </div>
      )}
    </div>
  );
}
