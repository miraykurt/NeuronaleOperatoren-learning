import { useMemo } from "react";
import {
  useAppStore,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORY_LABEL,
  type AchievementCategory,
  type AchievementDef,
} from "../state/store";

const CATEGORY_ORDER: AchievementCategory[] = [
  "milestone",
  "engagement",
  "depth",
  "speed",
  "secret",
];

const TIER_LABEL = {
  bronze: "Bronze",
  silver: "Silber",
  gold: "Gold",
} as const;

const TIER_MEDAL = {
  bronze: "●",
  silver: "★",
  gold: "✦",
} as const;

interface CardProps {
  ach: AchievementDef;
  earned: boolean;
  progress: { current: number; total: number } | null;
  hideSecret: boolean;
}

function AchievementCard({ ach, earned, progress, hideSecret }: CardProps) {
  const showSilhouette = !earned && hideSecret;
  const pct = progress
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 0;

  return (
    <div
      className={`trophy-card trophy-${ach.tier} ${earned ? "earned" : "locked"} ${showSilhouette ? "silhouette" : ""}`}
    >
      <div className="trophy-tier-label">{TIER_LABEL[ach.tier]}</div>
      <div className="trophy-medal" aria-hidden>
        {showSilhouette ? "?" : TIER_MEDAL[ach.tier]}
      </div>
      <div className="trophy-name">
        {showSilhouette ? "Geheim" : ach.name}
      </div>
      <div className="trophy-desc">
        {showSilhouette
          ? "Findest du beim Spielen heraus."
          : earned
            ? ach.description
            : ach.hint}
      </div>

      {!earned && progress && !showSilhouette && (
        <div className="trophy-progress">
          <div className="trophy-progress-bar">
            <div
              className="trophy-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="trophy-progress-label">
            {progress.current} / {progress.total}
          </div>
        </div>
      )}

      <div className="trophy-cc">+{ach.cc} CC</div>
    </div>
  );
}

export function TrophyRoom() {
  const achievements = useAppStore((s) => s.achievements);
  const state = useAppStore((s) => s);

  const all = useMemo(() => Object.values(ACHIEVEMENTS), []);
  const earnedSet = new Set(achievements);

  const earnedCount = all.filter((a) => earnedSet.has(a.id)).length;
  const totalCount = all.length;
  const earnedCC = all
    .filter((a) => earnedSet.has(a.id))
    .reduce((sum, a) => sum + a.cc, 0);
  const possibleCC = all.reduce((sum, a) => sum + a.cc, 0);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: all
      .filter((a) => (a.secret ? "secret" : a.category) === cat)
      .sort((a, b) => {
        const ea = earnedSet.has(a.id) ? 0 : 1;
        const eb = earnedSet.has(b.id) ? 0 : 1;
        if (ea !== eb) return ea - eb;
        const tierRank = { bronze: 0, silver: 1, gold: 2 };
        return tierRank[a.tier] - tierRank[b.tier];
      }),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="chapter-meta">Trophy Room · Vitrine</div>
      <h1>Trophy Room</h1>
      <p>
        Alle Auszeichnungen, die du dir bisher verdient hast, und ein
        Blick darauf, was noch möglich ist. Geheime Trophäen findest du
        nur durchs Spielen.
      </p>

      <div className="trophy-overall">
        <div className="trophy-overall-stat">
          <div className="trophy-overall-num">
            {earnedCount} <span className="trophy-overall-of">/ {totalCount}</span>
          </div>
          <div className="trophy-overall-label">Trophäen freigeschaltet</div>
        </div>
        <div className="trophy-overall-bar">
          <div
            className="trophy-overall-fill"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="trophy-overall-cc">
          <span className="trophy-overall-cc-current">{earnedCC} CC</span>
          <span className="trophy-overall-cc-sep">aus möglichen</span>
          <span>{possibleCC} CC</span>
        </div>
      </div>

      {grouped.map(({ cat, items }) => (
        <section key={cat} className="trophy-section">
          <div className="trophy-section-head">
            <h2 className="trophy-section-title">
              {ACHIEVEMENT_CATEGORY_LABEL[cat]}
            </h2>
            <span className="trophy-section-count">
              {items.filter((a) => earnedSet.has(a.id)).length} / {items.length}
            </span>
          </div>
          <div className="trophy-grid">
            {items.map((a) => {
              const earned = earnedSet.has(a.id);
              const prog = a.progress ? a.progress(state) : null;
              return (
                <AchievementCard
                  key={a.id}
                  ach={a}
                  earned={earned}
                  progress={prog}
                  hideSecret={!!a.secret && !earned}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
