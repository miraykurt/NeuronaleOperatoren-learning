import { useMemo, useState } from "react";
import { useAppStore } from "../state/store";

type Category = "konzept" | "methode" | "architektur" | "daten";

interface KnowledgeEntry {
  term: string;
  category: Category;
  short: string;
  details: string;
  seeAlso?: string[];
}

const CATEGORY_LABEL: Record<Category, string> = {
  konzept: "Konzept",
  methode: "Methode",
  architektur: "Architektur",
  daten: "Daten",
};

const KNOWLEDGE: Record<number, KnowledgeEntry[]> = {
  1: [
    {
      term: "Numerischer Solver",
      category: "methode",
      short:
        "Klassisches Verfahren, das eine PDE auf einem Gitter Schritt für Schritt löst.",
      details:
        "Solver wie FEM oder FDM zerlegen das Gebiet in viele kleine Zellen und lösen ein großes Gleichungssystem. Genau diese Berechnung will der neuronale Operator durch eine gelernte Abbildung ersetzen.",
      seeAlso: ["Neuronaler Operator", "Diskretisierung"],
    },
    {
      term: "Neuronaler Operator",
      category: "konzept",
      short:
        "Modell, das eine ganze Lösungsregel lernt: Anfangsbedingung rein, Lösung raus.",
      details:
        "Statt für jeden Fall neu zu rechnen, lernt der Operator aus Beispiel-Lösungen die zugrundeliegende Regel. Nach dem Training liefert er in Millisekunden eine Antwort.",
      seeAlso: ["Operator", "Numerischer Solver"],
    },
  ],
  2: [
    {
      term: "Diskretisierung",
      category: "methode",
      short:
        "Zerlegung des kontinuierlichen Gebiets in ein Gitter.",
      details:
        "Klassische Solver brauchen sie zum Rechnen, neuronale Operatoren brauchen sie zum Erzeugen der Trainingsdaten. Je feiner das Gitter, desto genauer, aber auch desto teurer.",
      seeAlso: ["Komplexitätswachstum"],
    },
    {
      term: "Komplexitätswachstum",
      category: "konzept",
      short:
        "Solver-Rechenzeit wächst stark mit der Auflösung — in 2D quadratisch, in 3D kubisch pro Achse.",
      details:
        "Sobald viele ähnliche Konfigurationen gerechnet werden müssen, wird der klassische Weg unwirtschaftlich. Genau hier setzt der Operator-Ansatz an: einmal teuer trainieren, danach billig auswerten.",
    },
  ],
  3: [
    {
      term: "Operator",
      category: "konzept",
      short:
        "Mathematische Abbildung zwischen Funktionen — Eingabe ist eine ganze Funktion, Ausgabe auch.",
      details:
        "Anders als eine normale Funktion, die einer Zahl eine Zahl zuordnet, ordnet ein Operator einer ganzen Eingabefunktion eine ganze Ausgabefunktion zu. Beispiel: Anfangsbedingung u(x, 0) → Lösung u(x, T).",
      seeAlso: ["Neuronaler Operator"],
    },
    {
      term: "Gitterunabhängigkeit",
      category: "konzept",
      short:
        "Ein neuronaler Operator liefert bei verschiedenen Auflösungen dieselbe Lösung, nur feiner abgetastet.",
      details:
        "Ein klassisches NN, das auf 16 Punkten trainiert wurde, versagt bei 64. Der Operator lernt die Regel, nicht die Werte — das macht ihn auflösungsunabhängig.",
    },
  ],
  4: [
    {
      term: "Mode",
      category: "konzept",
      short:
        "Einzelne Frequenzkomponente im Fourier-Spektrum.",
      details:
        "Niedrige Moden beschreiben grobe Strukturen, hohe Moden feine Details und meist Rauschen. Der FNO arbeitet bewusst nur mit den niedrigsten k Moden, alles darüber wird verworfen.",
      seeAlso: ["Frequenz-Cutoff", "FNO-Layer"],
    },
    {
      term: "Frequenz-Cutoff",
      category: "architektur",
      short:
        "Anzahl k der niedrigsten Moden, die der FNO behält. Wichtigster Architektur-Hyperparameter.",
      details:
        "Hoher Cutoff: mehr Detail, mehr Speicher, mehr Trainingsbedarf. Niedriger Cutoff: glatt und billig, aber feine Strukturen gehen verloren. Der Sweet-Spot hängt vom Problem ab.",
      seeAlso: ["Mode", "FNO-Layer"],
    },
    {
      term: "FNO-Layer",
      category: "architektur",
      short:
        "Baustein des FNO: FFT, Filter im Frequenzraum, inverse FFT — plus ein lokaler Pfad.",
      details:
        "Pro Layer wird die Eingabe in den Frequenzraum transformiert, dort mit gelernten Gewichten multipliziert (nur auf den ersten k Moden), zurücktransformiert und mit dem lokalen Pfad addiert. Mehrere Layer hintereinander ergeben den FNO.",
      seeAlso: ["Mode", "Frequenz-Cutoff"],
    },
  ],
  5: [
    {
      term: "PDEBench",
      category: "daten",
      short:
        "Standardisierte Sammlung von Trainings- und Testdaten für neuronale Operatoren auf PDEs.",
      details:
        "Enthält viele PDE-Familien (Advection, Diffusion, Navier-Stokes u. a.) mit festen Train/Val/Test-Splits. Macht den fairen Vergleich verschiedener Operator-Architekturen erst möglich.",
      seeAlso: ["Trainingspunkt"],
    },
    {
      term: "Trainingspunkt",
      category: "daten",
      short:
        "Ein Eingabe-Ausgabe-Paar im Datensatz: Anfangsbedingung → Lösung nach T Zeitschritten.",
      details:
        "Jeder Trainingspunkt entsteht durch einen klassischen Solver-Lauf. Beim Training ist das Paar nur noch ein Datenzugriff — der gesamte Solver-Aufwand steckt einmalig im Datensatz.",
    },
  ],
  6: [
    {
      term: "Lernrate",
      category: "methode",
      short:
        "Schrittweite pro Gewichts-Update beim Training.",
      details:
        "Zu groß: der Loss springt herum, das Modell konvergiert nicht. Zu klein: das Training kriecht. Ein Schedule (z. B. Cosine + Warmup) senkt die Lernrate über die Epochen sanft ab.",
    },
    {
      term: "Loss-Funktion",
      category: "methode",
      short:
        "Maß dafür, wie weit die Vorhersage von der Wahrheit abweicht.",
      details:
        "Reines L² vergleicht nur Werte. H1 vergleicht zusätzlich Ableitungen und passt damit besser zu PDE-Lösungen mit scharfen Übergängen. Im Notebook wird H1 als Trainings-Ziel verwendet.",
    },
    {
      term: "Train/Val/Test-Split",
      category: "methode",
      short:
        "Datensatz wird dreigeteilt: Trainieren, Validieren, Testen.",
      details:
        "Auf Trainings-Paaren wird gelernt. Auf Validierungs-Paaren wird nach jeder Epoche gemessen und das beste Modell gespeichert. Der Test-Split bleibt unangetastet bis zur Endbewertung.",
    },
  ],
  7: [
    {
      term: "Trainingsbereich",
      category: "konzept",
      short:
        "Bereich der Eingaben, der durch Trainingsdaten abgedeckt ist. Innerhalb davon ist das Modell verlässlich.",
      details:
        "Außerhalb beginnt Extrapolation, und der Fehler wächst mit der Distanz zum Trainingsbereich. Für die Übergabe an den Kunden muss dieser Bereich explizit dokumentiert sein.",
      seeAlso: ["Extrapolation"],
    },
    {
      term: "Extrapolation",
      category: "konzept",
      short:
        "Vorhersagen außerhalb des Trainingsbereichs. Die echte Grenze neuronaler Operatoren.",
      details:
        "Innerhalb arbeitet das Modell zuverlässig. Sobald die Eingabe deutlich anders aussieht, kollabiert die Genauigkeit — auch wenn die Ausgabe oft plausibel wirkt.",
      seeAlso: ["Trainingsbereich"],
    },
    {
      term: "Cutoff-Maske",
      category: "architektur",
      short:
        "Architektur-Stelle im FNO, an der hohe Frequenzen abgeschnitten werden.",
      details:
        "Was nicht im Frequenzraum darstellbar ist, kann der FNO nicht vorhersagen — egal wie lange trainiert wird. Scharfe Schockfronten brauchen genau diese hohen Frequenzen.",
      seeAlso: ["Frequenz-Cutoff", "Mode"],
    },
  ],
};

const CHAPTER_TITLES: Record<number, string> = {
  1: "Einführung",
  2: "Rechenzeit-Problem",
  3: "Grundlagen & Konzept",
  4: "Fourier Neural Operator",
  5: "PDEBench",
  6: "Training",
  7: "Ergebnis verstehen",
  8: "Code & Notebook",
};

interface DisplayEntry {
  chapter: number;
  entry: KnowledgeEntry;
}

function lookupPrompt(term: string, chapter: number): string {
  return (
    `Erklär mir den Begriff "${term}" aus Kapitel ${chapter} so kompakt ` +
    `wie möglich im Kontext neuronaler Operatoren. Drei bis vier Sätze, ` +
    `bitte keine Wiederholungen aus der Library-Karte.`
  );
}

export function Library() {
  const completedChapters = useAppStore((s) => s.completedChapters);
  const setView = useAppStore((s) => s.setView);
  const triggerChat = useAppStore((s) => s.triggerChat);
  const [chapterFilter, setChapterFilter] = useState<number | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const allEntries = useMemo<DisplayEntry[]>(() => {
    const acc: DisplayEntry[] = [];
    for (const ch of Object.keys(KNOWLEDGE).map(Number).sort((a, b) => a - b)) {
      if (!completedChapters.includes(ch)) continue;
      for (const e of KNOWLEDGE[ch] ?? []) {
        acc.push({ chapter: ch, entry: e });
      }
    }
    return acc;
  }, [completedChapters]);

  const filtered = useMemo(() => {
    return allEntries.filter(({ chapter }) => {
      if (chapterFilter !== "all" && chapter !== chapterFilter) return false;
      return true;
    });
  }, [allEntries, chapterFilter]);

  const availableChapters = useMemo(
    () =>
      Object.keys(KNOWLEDGE)
        .map(Number)
        .filter((ch) => completedChapters.includes(ch) && (KNOWLEDGE[ch]?.length ?? 0) > 0)
        .sort((a, b) => a - b),
    [completedChapters],
  );

  const pending = useMemo(
    () =>
      Object.keys(KNOWLEDGE)
        .map(Number)
        .filter(
          (ch) => !completedChapters.includes(ch) && (KNOWLEDGE[ch]?.length ?? 0) > 0,
        )
        .sort((a, b) => a - b),
    [completedChapters],
  );

  function findByTerm(term: string): DisplayEntry | undefined {
    return allEntries.find(
      (e) => e.entry.term.toLowerCase() === term.toLowerCase(),
    );
  }

  return (
    <div>
      <div className="chapter-meta">Library · Wissensdatenbank</div>
      <h1>Library</h1>
      <p>
        Diese Bibliothek füllt sich automatisch: Jedes abgeschlossene
        Kapitel hinterlegt seine Kernbegriffe hier — als Nachschlagewerk,
        zu dem du jederzeit zurückkommen kannst.
      </p>

      {allEntries.length === 0 ? (
        <p className="lib-empty">
          Noch nichts hinterlegt. Schließ Kapitel 1 ab, dann erscheinen die
          ersten Begriffe hier.
        </p>
      ) : (
        <>
          <div className="lib-controls">
            <div className="lib-filters">
              <button
                className={`ctable-segment ${chapterFilter === "all" ? "active" : ""}`}
                onClick={() => setChapterFilter("all")}
              >
                Alle
              </button>
              {availableChapters.map((ch) => (
                <button
                  key={ch}
                  className={`ctable-segment ${chapterFilter === ch ? "active" : ""}`}
                  onClick={() => setChapterFilter(ch)}
                >
                  Kap {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="lib-summary">
            {filtered.length} {filtered.length === 1 ? "Eintrag" : "Einträge"}
            {chapterFilter !== "all" && ` aus Kapitel ${chapterFilter}`}
            <span className="lib-summary-hint">
              · Klick einen Begriff an, der Tutor erklärt ihn dir.
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="lib-empty">
              Keine Einträge im aktuellen Filter.
            </div>
          ) : (
            <div className="lib-grid">
              {filtered.map(({ chapter, entry }) => {
                const key = `${chapter}-${entry.term}`;
                const isOpen = expanded === key;
                return (
                  <div
                    key={key}
                    className={`lib-card ${isOpen ? "open" : ""}`}
                  >
                    <div className="lib-card-top">
                      <div className="lib-card-chapter">
                        Kapitel {chapter}
                      </div>
                      <div className="lib-card-cat">
                        {CATEGORY_LABEL[entry.category]}
                      </div>
                    </div>
                    <div className="lib-card-term">{entry.term}</div>
                    <div className="lib-card-def">{entry.short}</div>

                    {isOpen && (
                      <>
                        <div className="lib-card-details">
                          {entry.details}
                        </div>
                        {entry.seeAlso && entry.seeAlso.length > 0 && (
                          <div className="lib-card-related">
                            <div className="lib-card-related-label">
                              Siehe auch
                            </div>
                            <div className="lib-card-related-list">
                              {entry.seeAlso.map((t) => {
                                const found = findByTerm(t);
                                return (
                                  <button
                                    key={t}
                                    className="lib-related-pill"
                                    onClick={() =>
                                      found
                                        ? setExpanded(
                                            `${found.chapter}-${found.entry.term}`,
                                          )
                                        : undefined
                                    }
                                    disabled={!found}
                                    title={
                                      found
                                        ? "Eintrag öffnen"
                                        : "Eintrag noch nicht freigeschaltet"
                                    }
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="lib-card-actions">
                          <button
                            className="primary-button"
                            onClick={() =>
                              triggerChat(
                                "tutor",
                                lookupPrompt(entry.term, chapter),
                              )
                            }
                          >
                            Tutor fragen
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() =>
                              setView({ type: "chapter", id: chapter })
                            }
                          >
                            ↳ Zu Kapitel {chapter}
                          </button>
                        </div>
                      </>
                    )}

                    <button
                      className="lib-card-toggle"
                      onClick={() => setExpanded(isOpen ? null : key)}
                    >
                      {isOpen ? "Einklappen" : "Mehr lesen"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {pending.length > 0 && (
        <>
          <h2>Noch nicht freigeschaltet</h2>
          <div className="lib-pending">
            {pending.map((ch) => (
              <div key={ch} className="lib-pending-row">
                <span className="lib-pending-chapter">
                  Kapitel {ch} · {CHAPTER_TITLES[ch]}
                </span>
                <span className="lib-pending-count">
                  +{KNOWLEDGE[ch].length} Einträge nach Abschluss
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
