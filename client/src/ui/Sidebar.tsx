import { useAppStore, LEVELS, nextLevelInfo } from "../state/store";
import { characters, type CharacterId } from "../chatbot/characters";

interface ChapterDef {
  id: number;
  label: string;
}

const CHAPTERS: ChapterDef[] = [
  { id: 1, label: "1: Einführung" },
  { id: 2, label: "2: Rechenzeit" },
  { id: 3, label: "3: Operator" },
  { id: 4, label: "4: FNO" },
  { id: 5, label: "5: PDEBench" },
  { id: 6, label: "6: Live-Vergleich" },
  { id: 7, label: "7: Fehleranalyse" },
  { id: 8, label: "8: Code & Notebook" },
];

const CHARACTER_ORDER: CharacterId[] = [
  "priya",
  "tobias",
  "amara",
  "lena",
];

export function Sidebar() {
  const currentView = useAppStore((s) => s.currentView);
  const completedChapters = useAppStore((s) => s.completedChapters);
  const ccBalance = useAppStore((s) => s.ccBalance);
  const level = useAppStore((s) => s.level);
  const characterMessages = useAppStore((s) => s.characterMessages);
  const metCharacters = useAppStore((s) => s.metCharacters);
  const clearCharacterMessage = useAppStore((s) => s.clearCharacterMessage);
  const setView = useAppStore((s) => s.setView);

  const isChapterUnlocked = (c: ChapterDef): boolean =>
    c.id === 1 || completedChapters.includes(c.id - 1);

  const levelLabel = LEVELS.find((l) => l.id === level)?.label ?? level;
  const progress = nextLevelInfo(ccBalance);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">FieldSolve Engineering</div>
        <div className="sidebar-subtitle">Neuronale Operatoren</div>
        <div className="sidebar-status">
          <span className="badge level">{levelLabel}</span>
          <span className="badge cc">{ccBalance} CC</span>
        </div>
        {progress.next && (
          <div className="sidebar-progress">
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${Math.min(100, progress.progress * 100)}%` }}
              />
            </div>
            <div className="sidebar-progress-label">
              {progress.remaining} CC bis {progress.next.label}
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-section">
        <div className="sidebar-heading">Team</div>
        <div className="team-list">
          {CHARACTER_ORDER.map((id) => {
            const c = characters[id];
            const bubble = characterMessages[id];
            const met = metCharacters.includes(id);
            return (
              <div
                key={id}
                className={`team-character ${met ? "met" : "unmet"} ${bubble ? "active" : ""}`}
              >
                <div className="team-avatar-wrap">
                  <img
                    className="team-avatar"
                    src={c.avatarUrl}
                    alt={c.shortName}
                    loading="lazy"
                  />
                  <span
                    className={`team-status ${bubble ? "online" : met ? "idle" : "offline"}`}
                    aria-hidden
                  />
                </div>
                <div className="team-info">
                  <div className="team-name">{c.shortName}</div>
                  <div className="team-role">{c.role}</div>
                  {bubble && (
                    <div className="team-bubble">
                      {bubble.text}
                      <button
                        className="team-bubble-dismiss"
                        onClick={() => clearCharacterMessage(id)}
                        aria-label="Nachricht schließen"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <nav className="sidebar-section">
        <div className="sidebar-heading">Lernpfad</div>
        <div className="sidebar-hint">
          {completedChapters.length} / {CHAPTERS.length} Kapitel abgeschlossen
        </div>
        {CHAPTERS.map((c) => {
          const unlocked = isChapterUnlocked(c);
          const done = completedChapters.includes(c.id);
          const active =
            currentView.type === "chapter" && currentView.id === c.id;
          const cls = `sidebar-item ${active ? "active" : ""} ${unlocked ? "" : "locked"} ${done ? "done" : ""}`;
          return (
            <button
              key={c.id}
              className={cls}
              disabled={!unlocked}
              onClick={() => setView({ type: "chapter", id: c.id })}
            >
              {c.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
