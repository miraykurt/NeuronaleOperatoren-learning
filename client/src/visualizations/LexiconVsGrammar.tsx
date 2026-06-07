import { useEffect, useState } from "react";

interface Word {
  word: string;
  meaning: string;
}

const LEXICON: Word[] = [
  { word: "Gitterpunkt x₁", meaning: "y₁ = 0.83" },
  { word: "Gitterpunkt x₂", meaning: "y₂ = 0.72" },
  { word: "Gitterpunkt x₃", meaning: "y₃ = 0.55" },
  { word: "Gitterpunkt x₄", meaning: "y₄ = 0.41" },
  { word: "Gitterpunkt x₅", meaning: "y₅ = 0.39" },
  { word: "Gitterpunkt x₆", meaning: "y₆ = 0.45" },
];

const RULES = [
  "G nimmt eine Funktion u",
  "wendet die Regel an",
  "liefert eine Funktion v",
  "für jedes u, jede Auflösung",
];

export function LexiconVsGrammar() {
  const [hl, setHl] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHl((i) => (i + 1) % LEXICON.length), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="metaphor">
      <div className="metaphor-card metaphor-nn">
        <div className="metaphor-icon" aria-hidden>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="1.5" />
            <line x1="7" y1="9" x2="17" y2="9" />
            <line x1="7" y1="13" x2="17" y2="13" />
            <line x1="7" y1="17" x2="13" y2="17" />
          </svg>
        </div>
        <div className="metaphor-title">Klassisches Neuronales Netz, wie ein Lexikon</div>
        <div className="metaphor-sub">
          Der Vektor hat eine feste Anzahl Einträge, einen pro Gitterpunkt.
          Andere Auflösung? Andere Vektorlänge, das Modell passt nicht
          mehr.
        </div>
        <div className="metaphor-lexicon">
          {LEXICON.map((w, i) => (
            <div
              key={i}
              className={`metaphor-lex-row ${i === hl ? "highlight" : ""}`}
            >
              <code>{w.word}</code>
              <span className="metaphor-arrow">→</span>
              <code>{w.meaning}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="metaphor-card metaphor-no">
        <div className="metaphor-icon" aria-hidden>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M4 9c4 2 12 2 16 0" />
            <path d="M4 15c4-2 12-2 16 0" />
          </svg>
        </div>
        <div className="metaphor-title">Neuronaler Operator, wie eine Grammatik</div>
        <div className="metaphor-sub">
          Lernt die Regel, nicht die Einträge. Liefert für jede Funktion u
          eine Antwort, unabhängig vom Gitter.
        </div>
        <div className="metaphor-grammar">
          {RULES.map((r, i) => (
            <div
              key={i}
              className="metaphor-rule"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <span className="metaphor-rule-bullet">▸</span>
              <span>{r}</span>
            </div>
          ))}
          <div className="metaphor-formula">
            <code>G : u(x) ↦ v(x)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
