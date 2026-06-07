import { useAppStore } from "../state/store";
import { ROOMS, isRoomUnlocked } from "../rooms/rooms";

export function TopBar() {
  const currentView = useAppStore((s) => s.currentView);
  const completedChapters = useAppStore((s) => s.completedChapters);
  const achievements = useAppStore((s) => s.achievements);
  const setView = useAppStore((s) => s.setView);

  return (
    <nav className="topbar" aria-label="Räume">
      {ROOMS.map((r) => {
        const unlocked = isRoomUnlocked(r, { completedChapters, achievements });
        const active =
          currentView.type === "room" && currentView.id === r.id;
        const cls = `topbar-item ${active ? "active" : ""} ${unlocked ? "" : "locked"}`;
        return (
          <button
            key={r.id}
            className={cls}
            disabled={!unlocked}
            onClick={() => setView({ type: "room", id: r.id })}
            title={unlocked ? r.label : `${r.label}: gesperrt`}
          >
            <span className="topbar-icon">{r.icon}</span>
            <span className="topbar-label">{r.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
