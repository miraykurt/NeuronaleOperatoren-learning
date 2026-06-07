import { BlockMath } from "react-katex";
import { useAppStore, LEVELS, ACHIEVEMENTS } from "../state/store";
import { ChatTrigger } from "../ui/ChatTrigger";

interface SummarySection {
  heading: string;
  bullets: string[];
  formula?: string;
}

const SUMMARY: SummarySection[] = [
  {
    heading: "Was ist ein neuronaler Operator?",
    bullets: [
      "Ein Operator ist eine mathematische Abbildung G : A → B zwischen zwei Funktionenräumen.",
      "Eingabe ist eine ganze Funktion (z. B. die Anfangsbedingung), Ausgabe ist eine ganze Funktion (z. B. die Lösung zum Zeitpunkt t).",
      "Ein klassisches neuronales Netz lernt Zahl-zu-Zahl, ein neuronaler Operator lernt Funktion-zu-Funktion.",
      "Konsequenz: Ein einmal trainierter Operator ist auflösungsunabhängig auswertbar — Lexikon vs. Grammatik.",
    ],
  },
  {
    heading: "Warum klassische Solver an Grenzen kommen",
    bullets: [
      "FEM, FDM und FVM diskretisieren das Gebiet in ein Gitter und lösen ein großes Gleichungssystem.",
      "Genauigkeit ist gut verstanden, Rechenzeit wächst aber polynomial mit der Auflösung (2D ~ N², 3D ~ N³ pro Achse).",
      "Sobald viele Konfigurationen gerechnet werden müssen, wird das wirtschaftlich unmöglich.",
      "Genau hier setzt der Operator-Ansatz an: einmal teuer trainieren, danach billig auswerten.",
    ],
    formula:
      "\\frac{\\partial u}{\\partial t} + u\\,\\frac{\\partial u}{\\partial x} = \\nu\\,\\frac{\\partial^2 u}{\\partial x^2}",
  },
  {
    heading: "Architektur des Fourier Neural Operator",
    bullets: [
      "Pro Layer zwei Pfade: ein lokaler (1×1-Convolution) und ein globaler (FFT → Filter im Frequenzraum → inverse FFT).",
      "Cutoff-Maske k: nur die niedrigsten k Frequenzmoden werden gelernt, höhere werden bewusst verworfen.",
      "Die Auflösungsunabhängigkeit folgt direkt aus der FFT-Struktur — das Modell arbeitet auf der Funktion, nicht auf einem festen Gitter.",
      "Trade-off: mehr Moden bedeutet feinere Details, aber mehr Trainingsbedarf und Speicher.",
    ],
    formula:
      "\\big(\\mathcal{K}(v)\\big)(x) = \\mathcal{F}^{-1}\\!\\big(R \\cdot \\mathcal{F}(v)\\big)(x)",
  },
  {
    heading: "Training und Daten",
    bullets: [
      "Datensätze aus PDEBench, geordnet nach PDE-Familie: hyperbolisch (Wellen), parabolisch (Diffusion), Navier-Stokes (Strömung).",
      "Trainings-Pipeline: Daten laden, Modell + Loss + Optimierer definieren, Epochen-Schleife durchlaufen.",
      "Die Lernrate ist der wichtigste Hyperparameter — Zonen: zu hoch (divergiert), passend (konvergiert), zu niedrig (kriecht).",
      "Overfitting erkennt man am Auseinanderlaufen von Train- und Val-Loss; Inferenz ist nach dem Training in Millisekunden möglich.",
    ],
  },
  {
    heading: "Fehleranalyse und Validierung",
    bullets: [
      "Der Restfehler ist nicht zufällig: er konzentriert sich an Hochfrequenzen und an Diskontinuitäten.",
      "Mode-Lens-Analyse zeigt, welche Frequenzbänder das Modell systematisch unterschätzt.",
      "Extrapolation außerhalb des Trainingsbereichs ist riskant und muss explizit dokumentiert werden.",
      "Für die Übergabe an Kunden: ehrlich kommunizieren, wo das Modell verlässlich ist und wo nicht.",
    ],
  },
  {
    heading: "Einordnung im Engineering-Alltag",
    bullets: [
      "Klassisch: jedes Mal neu rechnen, hohe garantierte Genauigkeit, langsam.",
      "Neuronaler Operator: einmal trainieren, danach viele schnelle Inferenzen, nachweisbare aber begrenzte Genauigkeit.",
      "Hybrid: Operator liefert einen Startwert, klassischer Solver verfeinert nur noch — beste aus beiden Welten.",
      "Wirtschaftlich lohnt sich der Operator-Ansatz, sobald genug ähnliche Anfragen kommen — die Schwelle ist projektabhängig.",
    ],
  },
];

const NOTES_PROMPT =
  "Hilf mir bei meinen Lern-Notizen zu neuronalen Operatoren. " +
  "Gib mir eine kompakte Stichpunkt-Liste mit den vier bis sechs zentralen " +
  "Ideen aus dieser Lerneinheit, in einer Sprache, die ich direkt in mein " +
  "Lernheft übernehmen kann. Halte es präzise und kurz.";

interface DecisionLogEntry {
  id: string;
  outcomeLabel: string;
  chapter: number;
}

const DECISION_LOG: DecisionLogEntry[] = [
  { id: "k5-dataset", outcomeLabel: "Datensatz · Burgers 1D", chapter: 5 },
  {
    id: "k6-training",
    outcomeLabel: "Training · Standard-FNO-Setup",
    chapter: 6,
  },
  {
    id: "k7-handover",
    outcomeLabel: "Übergabe · Drei methodische Grenzen",
    chapter: 7,
  },
];

const RETRO_LABELS: { key: string; label: string }[] = [
  { key: "aha", label: "Wichtigster Aha-Moment" },
  { key: "open", label: "Offene Frage" },
  { key: "next", label: "Nächstes Projekt anders angehen" },
];

export function ProjectArchive() {
  const completedChapters = useAppStore((s) => s.completedChapters);
  const ccBalance = useAppStore((s) => s.ccBalance);
  const level = useAppStore((s) => s.level);
  const achievements = useAppStore((s) => s.achievements);
  const userNotes = useAppStore((s) => s.userNotes);
  const setUserNotes = useAppStore((s) => s.setUserNotes);
  const clearUserNotes = useAppStore((s) => s.clearUserNotes);
  const projectDecisions = useAppStore((s) => s.projectDecisions);
  const projectRetro = useAppStore((s) => s.projectRetro);

  const committedDecisions = DECISION_LOG.filter(
    (d) => projectDecisions[d.id] != null,
  );

  const retroEntries = RETRO_LABELS.map((r) => ({
    label: r.label,
    answer: (projectRetro[r.key] ?? "").trim(),
  })).filter((r) => r.answer.length > 0);

  const levelLabel = LEVELS.find((l) => l.id === level)?.label ?? level;
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;

  function handleClearNotes() {
    if (userNotes.trim().length === 0) return;
    if (window.confirm("Eigene Notizen wirklich verwerfen?")) {
      clearUserNotes();
    }
  }

  return (
    <div className="archive">
      <div className="chapter-meta">Project Archive · Lernzusammenfassung</div>
      <h1>Project Archive</h1>
      <p>
        Hier landet deine Lern-Akte: die inhaltliche Zusammenfassung zu
        neuronalen Operatoren plus deine eigenen Notizen. Die
        Zusammenfassung selbst siehst du erst im PDF-Export — der
        Druck-Dialog deines Browsers liefert eine Seite, die du in dein
        Lernheft einheften kannst.
      </p>

      <div className="archive-actions">
        <button className="primary-button" onClick={() => window.print()}>
          Als PDF exportieren
        </button>
        <button className="secondary-button" onClick={handleClearNotes}>
          Notizen leeren
        </button>
      </div>

      <div className="archive-sheet">
        <div className="archive-sheet-head">
          <div className="archive-sheet-title">FieldSolve Engineering</div>
          <div className="archive-sheet-sub">
            Lern-Akte · Neuronale Operatoren für PDE-Beschleunigung
          </div>
        </div>

        <section className="archive-section archive-meta-section">
          <h3>Engineer:in</h3>
          <ul>
            <li>
              Level: <code>{levelLabel}</code>
            </li>
            <li>
              Compute Credits: <code>{ccBalance}</code>
            </li>
            <li>
              Fortschritt: <code>{completedChapters.length} / 8 Kapitel</code>
            </li>
            <li>
              Achievements:{" "}
              <code>
                {achievements.length} / {totalAchievements}
              </code>
            </li>
          </ul>
        </section>

        {committedDecisions.length > 0 && (
          <section className="archive-section">
            <h3>Deine Entscheidungen im Projekt</h3>
            <div className="archive-decisions">
              {committedDecisions.map((d) => {
                const picks = projectDecisions[d.id] ?? [];
                return (
                  <article key={d.id} className="archive-decision">
                    <div className="archive-decision-head">
                      <span className="archive-decision-chapter">
                        Kapitel {d.chapter}
                      </span>
                      <span className="archive-decision-outcome">
                        {d.outcomeLabel}
                      </span>
                    </div>
                    <div className="archive-decision-label">
                      Begründet mit:
                    </div>
                    <ul className="archive-decision-list">
                      {picks.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {retroEntries.length > 0 && (
          <section className="archive-section">
            <h3>Projekt-Retro</h3>
            <div className="archive-retro">
              {retroEntries.map((r) => (
                <article key={r.label} className="archive-retro-item">
                  <div className="archive-retro-label">{r.label}</div>
                  <div className="archive-retro-answer">
                    {r.answer.split("\n").map((line, i) => (
                      <div key={i}>{line || " "}</div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="archive-section archive-print-only">
          <h3>Lernzusammenfassung — Neuronale Operatoren</h3>
          <div className="archive-summary">
            {SUMMARY.map((s) => (
              <article key={s.heading} className="archive-summary-block">
                <h4>{s.heading}</h4>
                <ul>
                  {s.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {s.formula && (
                  <div className="archive-summary-formula">
                    <BlockMath math={s.formula} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="archive-section">
          <h3>Eigene Notizen</h3>
          <p className="archive-notes-hint">
            Was war für dich wichtig? Eigene Beispiele, offene Fragen,
            Verknüpfungen zu deinem Studium. Die Notizen erscheinen unten
            im PDF-Export direkt unter der Zusammenfassung.
          </p>
          <textarea
            className="archive-notes-input"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Hier deine eigenen Notizen …"
            rows={10}
          />
          <div className="archive-notes-actions">
            <ChatTrigger
              mode="tutor"
              question={NOTES_PROMPT}
              label="Tutor um Notiz-Hilfe bitten"
            />
          </div>
          <div className="archive-notes-print">
            {userNotes.trim().length > 0 ? (
              userNotes.split("\n").map((line, i) => (
                <div key={i} className="archive-notes-line-text">
                  {line || " "}
                </div>
              ))
            ) : (
              <>
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
                <div className="archive-notes-line" />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
