import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { Sidebar } from "./ui/Sidebar";
import { TopBar } from "./ui/TopBar";
import { ToastContainer } from "./ui/ToastContainer";
import { useAppStore } from "./state/store";
import { Workstation } from "./rooms/Workstation";
import { SimulationLab } from "./rooms/SimulationLab";
import { Library } from "./rooms/Library";
import { NotebookTerminal } from "./rooms/NotebookTerminal";
import { TrophyRoom } from "./rooms/TrophyRoom";
import { ProjectArchive } from "./rooms/ProjectArchive";
import { Kapitel1 } from "./chapters/Kapitel1";
import { Kapitel2 } from "./chapters/Kapitel2";
import { Kapitel3 } from "./chapters/Kapitel3";
import { Kapitel4 } from "./chapters/Kapitel4";
import { Kapitel5 } from "./chapters/Kapitel5";
import { Kapitel6 } from "./chapters/Kapitel6";
import { Kapitel7 } from "./chapters/Kapitel7";
import { Kapitel8 } from "./chapters/Kapitel8";
import { Landing } from "./landing/Landing";
import { ChatPanel } from "./chatbot/ChatPanel";

const ROOMS: Record<string, ComponentType> = {
  workstation: Workstation,
  lab: SimulationLab,
  library: Library,
  notebook: NotebookTerminal,
  trophy: TrophyRoom,
  archive: ProjectArchive,
};

const CHAPTERS: Record<number, ComponentType> = {
  1: Kapitel1,
  2: Kapitel2,
  3: Kapitel3,
  4: Kapitel4,
  5: Kapitel5,
  6: Kapitel6,
  7: Kapitel7,
  8: Kapitel8,
};

export function App() {
  const hasStarted = useAppStore((s) => s.hasStarted);
  const view = useAppStore((s) => s.currentView);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [hasStarted, view.type, view.id]);

  if (!hasStarted) return <Landing />;

  const Component =
    view.type === "room"
      ? ROOMS[view.id]
      : view.type === "chapter"
        ? CHAPTERS[view.id as number]
        : undefined;

  return (
    <div className="app">
      <Sidebar />
      <main
        ref={mainRef}
        className={`app-main ${view.type === "room" ? "room-mode" : "chapter-mode"}`}
      >
        <TopBar />
        <div className="app-content">
          {Component ? (
            <Component />
          ) : (
            <div className="placeholder">
              <h1>In Arbeit</h1>
              <p>Dieser Bereich ist noch nicht implementiert.</p>
            </div>
          )}
        </div>
      </main>
      <ChatPanel />
      <ToastContainer />
    </div>
  );
}
