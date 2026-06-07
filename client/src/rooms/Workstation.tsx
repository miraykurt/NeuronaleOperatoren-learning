import { useMemo, useState } from "react";
import {
  useAppStore,
  LEVELS,
  nextLevelInfo,
  type CharacterFeedItem,
} from "../state/store";
import { characters, CHARACTER_IDS, type CharacterId } from "../chatbot/characters";

const CHAPTER_TITLES: Record<number, string> = {
  1: "Numerische Solver vs. Neuronale Netze",
  2: "Rechenzeit-Problem",
  3: "Grundlagen & Konzept",
  4: "Fourier Neural Operator",
  5: "PDEBench",
  6: "Parameter-Einstellung & Live-Vergleich",
  7: "Fehleranalyse",
  8: "Code & Notebook",
};

interface PhaseDef {
  id: string;
  label: string;
  range: [number, number];
  description: string;
}

const PHASES: PhaseDef[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    range: [0, 1],
    description: "Du bekommst den Auftrag und das Problem präsentiert.",
  },
  {
    id: "analyse",
    label: "Analyse",
    range: [2, 3],
    description: "Klassische Verfahren gegen Operator-Ansatz abwägen.",
  },
  {
    id: "training",
    label: "Training",
    range: [4, 5],
    description: "FNO-Architektur, Datensatz, erste Trainingsläufe.",
  },
  {
    id: "validierung",
    label: "Validierung",
    range: [6, 7],
    description: "Vergleich mit Solver, Fehleranalyse, Grenzen ausloten.",
  },
  {
    id: "uebergabe",
    label: "Übergabe",
    range: [8, 8],
    description: "Notebook fertigstellen, Akte an den Kunden.",
  },
];

const DEADLINES: Record<number, string> = {
  1: "Kick-off: erstes Verständnis demonstrieren",
  2: "Rechenzeit-Bericht für das Engineering-Team",
  3: "Konzeptpapier: Operator vs. klassisches NN",
  4: "FNO-Architektur erklären können",
  5: "Trainingsdaten-Plan mit PDEBench",
  6: "Live-Vergleich beim Kunden",
  7: "Fehleranalyse: Schwächen ehrlich benennen",
  8: "Notebook + Doku-Übergabe an FieldSolve",
};

function currentPhase(completed: number[]): PhaseDef {
  const max = completed.length ? Math.max(...completed) : 0;
  return (
    PHASES.find((p) => max >= p.range[0] && max <= p.range[1]) ?? PHASES[0]
  );
}

function nextChapter(completed: number[]): number | null {
  for (let i = 1; i <= 8; i++) {
    if (!completed.includes(i)) return i;
  }
  return null;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "gerade eben";
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `vor ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `vor ${day} ${day === 1 ? "Tag" : "Tagen"}`;
  const week = Math.floor(day / 7);
  return `vor ${week} ${week === 1 ? "Woche" : "Wochen"}`;
}

interface FeedRowProps {
  item: CharacterFeedItem;
}

function FeedRow({ item }: FeedRowProps) {
  const c = characters[item.characterId];
  return (
    <div className={`ws-feed-row ${item.firstMeet ? "first-meet" : ""}`}>
      <img className="ws-feed-avatar" src={c.avatarUrl} alt={c.shortName} loading="lazy" />
      <div className="ws-feed-body">
        <div className="ws-feed-head">
          <span className="ws-feed-name">{c.shortName}</span>
          <span className="ws-feed-role">{c.role}</span>
          <span className="ws-feed-time">{formatRelative(item.ts)}</span>
        </div>
        {item.firstMeet && (
          <div className="ws-feed-firstmeet">
            Erster Kontakt, {c.name} stellt sich vor.
          </div>
        )}
        <div className="ws-feed-text">{item.text}</div>
      </div>
    </div>
  );
}

export function Workstation() {
  const ccBalance = useAppStore((s) => s.ccBalance);
  const level = useAppStore((s) => s.level);
  const completedChapters = useAppStore((s) => s.completedChapters);
  const characterFeed = useAppStore((s) => s.characterFeed);
  const clearCharacterFeed = useAppStore((s) => s.clearCharacterFeed);
  const setView = useAppStore((s) => s.setView);
  const reset = useAppStore((s) => s.reset);

  const levelLabel = LEVELS.find((l) => l.id === level)?.label ?? level;
  const progressInfo = nextLevelInfo(ccBalance);
  const phase = currentPhase(completedChapters);
  const next = nextChapter(completedChapters);

  const [feedFilter, setFeedFilter] = useState<CharacterId | "all">("all");

  const filteredFeed = useMemo(
    () =>
      feedFilter === "all"
        ? characterFeed
        : characterFeed.filter((i) => i.characterId === feedFilter),
    [characterFeed, feedFilter],
  );

  const sortedFeed = useMemo(
    () => [...filteredFeed].reverse().slice(0, 8),
    [filteredFeed],
  );

  const feedCounts = useMemo(() => {
    const counts: Record<string, number> = { all: characterFeed.length };
    for (const cid of CHARACTER_IDS) counts[cid] = 0;
    for (const item of characterFeed) counts[item.characterId]++;
    return counts;
  }, [characterFeed]);

  return (
    <div>
      <div className="chapter-meta">Workstation · Dein Schreibtisch</div>
      <h1>Willkommen zurück, {levelLabel}</h1>
      <p>
        Hier liegt alles, was du gerade brauchst: die aktuelle Mission, dein
        Projekt-Kontext und was deine Kolleg:innen zuletzt zu sagen hatten.
      </p>

      <div className="ws-mission">
        {next ? (
          <>
            <div className="ws-mission-label">Aktuelle Mission</div>
            <div className="ws-mission-title">
              Kapitel {next} · {CHAPTER_TITLES[next]}
            </div>
            <div className="ws-mission-task">{DEADLINES[next]}</div>
            <button
              className="primary-button ws-mission-cta"
              onClick={() => setView({ type: "chapter", id: next })}
            >
              Kapitel {next} öffnen
            </button>
          </>
        ) : (
          <>
            <div className="ws-mission-label">Projekt abgeschlossen</div>
            <div className="ws-mission-title">
              Alle acht Kapitel durch. Die Akte ist bereit.
            </div>
            <div className="ws-mission-task">
              Project Archive enthält die fertige Übergabe. Du kannst sie
              als PDF exportieren.
            </div>
            <button
              className="primary-button ws-mission-cta"
              onClick={() => setView({ type: "room", id: "archive" })}
            >
              Zum Project Archive
            </button>
          </>
        )}
      </div>

      <h2>Projekt-Phase</h2>
      <div className="ws-phase-strip">
        {PHASES.map((p) => {
          const active = p.id === phase.id;
          const passed =
            PHASES.findIndex((x) => x.id === p.id) <
            PHASES.findIndex((x) => x.id === phase.id);
          return (
            <div
              key={p.id}
              className={`ws-phase-step ${active ? "active" : ""} ${passed ? "passed" : ""}`}
            >
              <div className="ws-phase-dot" />
              <div className="ws-phase-name">{p.label}</div>
            </div>
          );
        })}
      </div>
      <p className="ws-phase-desc">{phase.description}</p>

      <h2>Kunden-Auftrag</h2>
      <div className="ws-letter">
        <div className="ws-letter-from">
          Von: AeroDyn GmbH, Abt. CFD-Engineering
          <br />
          An: FieldSolve Engineering · z. Hd. neue:r Engineer:in
        </div>
        <div className="ws-letter-body">
          „Wir simulieren Strömungen über Tragflächenprofile. Unsere
          FEM-Pipeline frisst pro Konfiguration vier Stunden, bei mehreren
          hundert Geometrien pro Designzyklus ist das tot. Wir haben gehört,
          dass <em>neuronale Operatoren</em> hier Größenordnungen schneller
          sein können. Bitte zeigt uns: Geht das? Wo sind die Grenzen?
          Bauen wir das ein?"
        </div>
        <div className="ws-letter-sig">- Dr. K. Volkmann, Lead CFD</div>
      </div>

      <h2>Team-Feed</h2>
      {characterFeed.length === 0 ? (
        <p className="ws-feed-empty">
          Noch keine Nachrichten. Deine Kolleg:innen melden sich
          automatisch, sobald sie zu deinem aktuellen Stand etwas zu sagen
          haben.
        </p>
      ) : (
        <>
          <div className="ws-feed-tabs">
            <button
              className={`ws-feed-tab ${feedFilter === "all" ? "active" : ""}`}
              onClick={() => setFeedFilter("all")}
            >
              Alle
              <span className="ws-feed-tab-count">{feedCounts.all}</span>
            </button>
            {CHARACTER_IDS.map((cid) => {
              const c = characters[cid];
              const count = feedCounts[cid] ?? 0;
              return (
                <button
                  key={cid}
                  className={`ws-feed-tab ${feedFilter === cid ? "active" : ""} ${count === 0 ? "muted" : ""}`}
                  onClick={() => setFeedFilter(cid)}
                  disabled={count === 0}
                  title={c.role}
                >
                  <img
                    className="ws-feed-tab-avatar"
                    src={c.avatarUrl}
                    alt={c.shortName}
                    loading="lazy"
                  />
                  {c.shortName}
                  <span className="ws-feed-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {sortedFeed.length === 0 ? (
            <p className="ws-feed-empty">
              Von {characters[feedFilter as CharacterId]?.shortName ?? "diesem Filter"} liegt
              hier nichts. Wechsel den Filter oder lass die Geschichte weiterlaufen.
            </p>
          ) : (
            <div className="ws-feed">
              {sortedFeed.map((item) => (
                <FeedRow key={item.id} item={item} />
              ))}
            </div>
          )}

          <button
            className="ws-feed-clear"
            onClick={() => {
              if (confirm("Team-Feed leeren?")) clearCharacterFeed();
            }}
          >
            Feed leeren
          </button>
        </>
      )}

      <h2>Karriere</h2>
      <div className="ws-career">
        <div className="ws-career-row">
          <div className="ws-career-label">Level</div>
          <div className="ws-career-value">{levelLabel}</div>
        </div>
        <div className="ws-career-row">
          <div className="ws-career-label">Compute Credits</div>
          <div className="ws-career-value ws-career-cc">{ccBalance} CC</div>
        </div>
        {progressInfo.next && (
          <div className="ws-career-progress">
            <div className="ws-career-progress-bar">
              <div
                className="ws-career-progress-fill"
                style={{ width: `${Math.min(100, progressInfo.progress * 100)}%` }}
              />
            </div>
            <div className="ws-career-progress-label">
              {progressInfo.remaining} CC bis {progressInfo.next.label}
            </div>
          </div>
        )}
        <div className="ws-career-row">
          <div className="ws-career-label">Kapitel durch</div>
          <div className="ws-career-value">{completedChapters.length} / 8</div>
        </div>
      </div>

      <div className="ws-devtools">
        <span className="ws-devtools-hint">
          Kurs zurücksetzen:
        </span>
        <button
          className="secondary-button"
          onClick={() => {
            if (confirm("Fortschritt komplett zurücksetzen?")) reset();
          }}
        >
          State zurücksetzen
        </button>
      </div>
    </div>
  );
}
