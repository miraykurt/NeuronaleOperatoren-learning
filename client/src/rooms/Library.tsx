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
        "Klassisches Verfahren (FEM, FDM, FVM), das eine PDE auf einem Gitter Schritt für Schritt löst.",
      details:
        "Solver zerlegen das Gebiet in viele Zellen, formulieren ein großes lineares Gleichungssystem und lösen es iterativ. Genau diese Berechnung will der neuronale Operator durch eine gelernte Abbildung ersetzen.",
      seeAlso: ["Neuronaler Operator", "Diskretisierung"],
    },
    {
      term: "Neuronaler Operator",
      category: "konzept",
      short:
        "Modell, das die Abbildung zwischen Funktionsräumen lernt — z. B. Anfangsbedingung → Lösung — und nach dem Training in einem Forward-Pass antwortet.",
      details:
        "Statt für jede PDE-Instanz neu zu rechnen, lernt ein neuronaler Operator G die zugrundeliegende Regel aus Beispiel-Lösungen. Nach dem Training arbeitet er auflösungsunabhängig und liefert in Millisekunden.",
      seeAlso: ["Operator", "Funktionenraum", "Forward-Pass"],
    },
    {
      term: "Forward-Pass",
      category: "methode",
      short:
        "Einmaliges Durchschicken einer Eingabe durch ein trainiertes Netz — die gesamte Inferenz eines neuronalen Operators.",
      details:
        "Beim FNO kostet ein Forward-Pass pro Layer eine FFT, eine Multiplikation im Frequenzraum und eine inverse FFT. Das Ergebnis steht in Millisekunden — daher die Größenordnungs-Beschleunigung gegenüber dem Solver.",
      seeAlso: ["Inferenz"],
    },
  ],
  2: [
    {
      term: "Diskretisierung",
      category: "methode",
      short:
        "Zerlegung des kontinuierlichen Rechengebiets in ein Gitter. Voraussetzung für jeden Solver und für jeden Trainingspunkt.",
      details:
        "Klassische Solver brauchen die Diskretisierung zum Rechnen, neuronale Operatoren brauchen sie zum Erzeugen der Trainingsdaten. Die Diskretisierungsfeinheit bestimmt Genauigkeit und Trainingsaufwand gleichzeitig.",
      seeAlso: ["Komplexitätswachstum"],
    },
    {
      term: "Komplexitätswachstum",
      category: "konzept",
      short:
        "Solver-Rechenzeit wächst polynomial mit der Auflösung (2D ~ N², 3D ~ N³ pro Achse). Die ökonomische Motivation für neuronale Operatoren.",
      details:
        "Sobald viele ähnliche Konfigurationen gerechnet werden müssen, wird der klassische Weg unwirtschaftlich. Ein neuronaler Operator amortisiert den einmaligen Trainingsaufwand über viele billige Inferenzen.",
      seeAlso: ["Echtzeit-Grenze", "Inferenz"],
    },
    {
      term: "Echtzeit-Grenze",
      category: "konzept",
      short:
        "Schwelle, ab der ein Verfahren zu langsam für interaktive Nutzung wird.",
      details:
        "Für 3D-Strömungen liegt diese Grenze beim klassischen Solver schon bei mittlerer Auflösung. Neuronale Operatoren verschieben sie um Größenordnungen — das ist der Kern ihres praktischen Werts.",
    },
  ],
  3: [
    {
      term: "Operator",
      category: "konzept",
      short:
        "Mathematische Abbildung G : A → B zwischen zwei Funktionenräumen — anders als eine normale Funktion (Zahl → Zahl).",
      details:
        "Beispiele: Ableitungsoperator ∂/∂x, Integraloperator ∫dx, Lösungsoperator einer PDE. Genau diese Klasse von Abbildungen versucht ein neuronaler Operator zu lernen.",
      seeAlso: ["Funktionenraum", "Neuronaler Operator"],
    },
    {
      term: "Funktionenraum",
      category: "konzept",
      short:
        "Menge von Funktionen mit gleichen Eigenschaften — der Eingabe- und Ausgaberaum eines Operators.",
      details:
        "Funktionenräume haben unendliche Dimension. Deshalb ist Operator-Lernen grundlegend anders als klassisches NN-Lernen auf festen Vektoren — und ermöglicht die Auflösungsunabhängigkeit neuronaler Operatoren.",
      seeAlso: ["Gitterunabhängigkeit"],
    },
    {
      term: "Gitterunabhängigkeit",
      category: "konzept",
      short:
        "Eigenschaft eines neuronalen Operators, bei verschiedenen Auflösungen konsistente Ergebnisse zu liefern.",
      details:
        "Ein klassisches NN, das auf 16 Punkten trainiert wurde, versagt bei 64. Ein neuronaler Operator lernt die Regel, nicht die Werte — er liefert bei jeder Auflösung dieselbe Lösung, nur feiner abgetastet.",
      seeAlso: ["Funktionenraum"],
    },
  ],
  4: [
    {
      term: "Mode",
      category: "konzept",
      short:
        "Einzelne Frequenzkomponente im Fourier-Spektrum — die Atome, mit denen ein FNO arbeitet.",
      details:
        "Niedrige Moden beschreiben grobe Strukturen, hohe Moden feine Details und meist Rauschen. Der FNO arbeitet bewusst nur mit den niedrigsten k Moden, alles darüber wird verworfen.",
      seeAlso: ["Frequenz-Cutoff", "FNO-Layer"],
    },
    {
      term: "Frequenz-Cutoff",
      category: "architektur",
      short:
        "Anzahl k der niedrigsten Moden, die ein FNO-Layer lernt. Wichtigster Hyperparameter der Architektur.",
      details:
        "Hoher Cutoff: mehr Detail, mehr Speicher, mehr Trainingsbedarf. Niedriger Cutoff: glatt, billig, oversmooth. Der Sweet-Spot ist datensatz- und problemabhängig und macht den Cutoff zur ersten Stellschraube nach der Datenwahl.",
      seeAlso: ["Mode", "FNO-Layer"],
    },
    {
      term: "FNO-Layer",
      category: "architektur",
      short:
        "Baustein des Fourier Neural Operator: globaler Pfad (FFT → Filter → iFFT) plus lokaler Pfad (1×1-Convolution).",
      details:
        "Pro Layer wird die Eingabe in den Frequenzraum transformiert, dort mit gelernten komplexwertigen Gewichten multipliziert (nur auf den ersten k Moden), zurücktransformiert und mit dem lokalen Pfad addiert. Mehrere Layer hintereinander ergeben den FNO.",
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
        "Enthält viele PDE-Familien (Burgers, Diffusion, Navier-Stokes, Shallow Water) mit festen Train/Test-Splits. Ohne solche Benchmarks wäre der faire Vergleich verschiedener Operator-Architekturen kaum möglich.",
      seeAlso: ["Trainingspunkt", "Out-of-Distribution"],
    },
    {
      term: "Trainingspunkt",
      category: "daten",
      short:
        "Ein Eingabe-Ausgabe-Paar im Datensatz: Anfangsbedingung und Konfiguration → zugehörige Lösung.",
      details:
        "Jeder Trainingspunkt entsteht durch einen klassischen Solver-Lauf. Beim Training ist das Paar (u(x, 0), u(x, T)) nur noch ein Datenzugriff — der gesamte Solver-Aufwand steckt einmalig im Datensatz.",
    },
    {
      term: "Out-of-Distribution",
      category: "konzept",
      short:
        "Eingaben, die deutlich anders aussehen als die Trainingsdaten. Hier kann der Operator nicht verlässlich antworten.",
      details:
        "Ein neuronaler Operator interpoliert innerhalb seines Trainingsbereichs hervorragend, extrapoliert aber unzuverlässig. OOD-Eingaben müssen erkannt und bei der Übergabe an den Kunden explizit dokumentiert werden.",
      seeAlso: ["Extrapolation", "Trainingsbereich"],
    },
  ],
  6: [
    {
      term: "Inferenz",
      category: "konzept",
      short:
        "Anwendung eines trainierten Operators auf neue Eingaben. Bei neuronalen Operatoren ein einziger Forward-Pass.",
      details:
        "Training ist teuer und einmalig, Inferenz ist günstig und beliebig wiederholbar. Genau dieser Asymmetrie verdankt der neuronale Operator seinen Geschwindigkeitsvorteil gegenüber dem klassischen Solver.",
      seeAlso: ["Forward-Pass"],
    },
    {
      term: "Trainingsbereich",
      category: "konzept",
      short:
        "Bereich des Konfigurationsraums, der durch Trainingsdaten abgedeckt ist. Innerhalb davon ist der Operator verlässlich.",
      details:
        "Außerhalb beginnt Extrapolation, und der Fehler wächst mit der Distanz zum Trainingsbereich. Für die Übergabe an den Kunden muss dieser Bereich explizit dokumentiert sein.",
      seeAlso: ["Konfigurationsraum", "Extrapolation"],
    },
    {
      term: "Konfigurationsraum",
      category: "konzept",
      short:
        "Menge aller möglichen Eingaben des Operators, aufgespannt durch die physikalischen Parameter des Problems.",
      details:
        "Realistische Modelle leben in hochdimensionalen Konfigurationsräumen. Der Trainingsbereich ist meist nur ein kleiner Ausschnitt — das macht die Wahl der Trainingsdaten zur zentralen Engineering-Entscheidung.",
      seeAlso: ["Trainingsbereich"],
    },
  ],
  7: [
    {
      term: "Extrapolation",
      category: "konzept",
      short:
        "Vorhersagen außerhalb des Trainingsbereichs. Die echte Grenze neuronaler Operatoren.",
      details:
        "Innerhalb der Trainingsverteilung arbeiten neuronale Operatoren beeindruckend gut. Sobald die Eingabe deutlich anders aussieht, kollabiert die Genauigkeit — auch wenn die Ausgabe oft plausibel wirkt.",
      seeAlso: ["Trainingsbereich", "Out-of-Distribution"],
    },
    {
      term: "Differenz-Plot",
      category: "methode",
      short:
        "Operator-Vorhersage minus Referenzlösung als Heatmap. Macht systematische Fehler sichtbar.",
      details:
        "Wichtigstes Diagnose-Werkzeug nach dem Training. Ist der Fehler räumlich strukturiert oder zufällig? Konzentriert er sich an Hochfrequenzen, an Diskontinuitäten oder am Rand des Trainingsbereichs?",
    },
    {
      term: "Fehler-Budget",
      category: "methode",
      short:
        "Maximal tolerierter Fehler des Operators für einen konkreten Anwendungsfall.",
      details:
        "Macht aus 'wie gut ist das Modell?' eine technische Spezifikation. 5 % reicht oft für Vorerkundungen, 0,5 % für sicherheitskritische Übergaben. Erst zusammen mit dem Fehler-Budget wird klar, ob ein trainierter Operator wirklich einsatzbereit ist.",
      seeAlso: ["Trainingsbereich"],
    },
  ],
  8: [
    {
      term: "SpectralConv1d",
      category: "architektur",
      short:
        "PyTorch-Implementierung des FNO-Layers in rund 25 Zeilen: FFT, komplexe Multiplikation mit gelernten Gewichten, inverse FFT.",
      details:
        "Drei Hyperparameter: Eingangs-Kanäle, Ausgangs-Kanäle, Anzahl behaltener Moden. Die Gewichte sind komplexwertige Tensoren der Shape (in, out, modes) und operieren direkt im Frequenzraum — das macht die Klasse zur Kern-Schicht jedes FNO.",
      seeAlso: ["FNO-Layer", "Frequenz-Cutoff"],
    },
    {
      term: "Inferenz-Service",
      category: "architektur",
      short:
        "Container, in dem das trainierte Operator-Modell live antworten kann.",
      details:
        "Das gespeicherte Modell wird einmal in den Speicher geladen und beantwortet Anfragen über HTTP oder WebSocket. Genau das verwandelt den Geschwindigkeitsvorteil eines neuronalen Operators in eine produktive Anwendung.",
      seeAlso: ["Inferenz"],
    },
    {
      term: "Reproduzierbare Infrastruktur",
      category: "methode",
      short:
        "Docker, Lock-Dateien und Seeds halten Training und Inferenz auf jedem Rechner bit-identisch.",
      details:
        "Für neuronale Operatoren essenziell: Trainingsläufe müssen vergleichbar sein, der erzeugte Datensatz reproduzierbar, das deployte Modell deterministisch. Ohne diese Disziplin wird jedes Übergabeprotokoll wertlos.",
    },
  ],
};

const CHAPTER_TITLES: Record<number, string> = {
  1: "Einführung",
  2: "Rechenzeit-Problem",
  3: "Grundlagen & Konzept",
  4: "Fourier Neural Operator",
  5: "PDEBench",
  6: "Live-Vergleich",
  7: "Fehleranalyse",
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
