import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";
import { pick, TOBIAS_AT_NOTEBOOK_DWELL } from "../state/messageTemplates";

const DWELL_MS = 3000;
const LONG_DWELL_MS = 60000;

export function NotebookTerminal() {
  const completedChapters = useAppStore((s) => s.completedChapters);
  const markNotebookExplored = useAppStore((s) => s.markNotebookExplored);
  const pushCharacterMessage = useAppStore((s) => s.pushCharacterMessage);
  const triggerChat = useAppStore((s) => s.triggerChat);
  const setView = useAppStore((s) => s.setView);
  const available =
    completedChapters.includes(7) || completedChapters.includes(8);
  const chapterDone = completedChapters.includes(8);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dwellTimer = useRef<number | null>(null);
  const dwellFired = useRef(false);
  const longDwellTimer = useRef<number | null>(null);
  const longDwellFired = useRef(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Empfängt "Tutor fragen"-Buttons aus dem Notebook-iframe und öffnet
  // den Chat mit der vom Notebook gelieferten kontext-spezifischen Frage.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (
        data &&
        typeof data === "object" &&
        data.type === "fno-notebook-tutor" &&
        typeof data.question === "string"
      ) {
        const mode =
          data.mode === "sokrates" || data.mode === "debug"
            ? data.mode
            : "tutor";
        // Wenn Notebook im Fullscreen ist, würde der ChatPanel dahinter rendern
        // und unsichtbar bleiben — also vorher Fullscreen verlassen.
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        triggerChat(mode, data.question);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [triggerChat]);

  useEffect(() => {
    return () => {
      if (dwellTimer.current != null) {
        window.clearTimeout(dwellTimer.current);
      }
      if (longDwellTimer.current != null) {
        window.clearTimeout(longDwellTimer.current);
      }
    };
  }, []);

  function handleIframeLoad() {
    if (!dwellFired.current) {
      if (dwellTimer.current != null) window.clearTimeout(dwellTimer.current);
      dwellTimer.current = window.setTimeout(() => {
        dwellFired.current = true;
        markNotebookExplored();
      }, DWELL_MS);
    }
    if (!longDwellFired.current) {
      if (longDwellTimer.current != null) {
        window.clearTimeout(longDwellTimer.current);
      }
      longDwellTimer.current = window.setTimeout(() => {
        longDwellFired.current = true;
        pushCharacterMessage("tobias", pick(TOBIAS_AT_NOTEBOOK_DWELL));
      }, LONG_DWELL_MS);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  return (
    <div className="notebook-terminal-room">
      <div className="chapter-meta">Notebook Terminal · VS Code Sandbox</div>
      <h1>Notebook Terminal</h1>
      <p>
        Das FNO-Trainings-Notebook in einer VS-Code-ähnlichen Umgebung:
        Setup, Modell, Training und Auswertung – alles vorbereitet, vom
        Browser aus durchklickbar.
      </p>

      {chapterDone && (
        <div className="notebook-terminal-banner">
          <div>
            <div className="notebook-terminal-banner-head">
              Kapitel 8 abgeschlossen · +240 CC
            </div>
            <div className="notebook-terminal-banner-sub">
              Die Akte ist bereit für den Kunden.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "room", id: "archive" })}
          >
            Zum Project Archive
          </button>
        </div>
      )}

      {available ? (
        <div ref={wrapperRef} className="notebook-terminal-wrapper">
          <button
            type="button"
            className="notebook-terminal-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Vollbild verlassen" : "Vollbild umschalten"}
          >
            <span className="notebook-terminal-fullscreen-icon">
              {isFullscreen ? "✕" : "⛶"}
            </span>
            <span>{isFullscreen ? "Schließen" : "Vollbild"}</span>
          </button>
          <iframe
            src="/fno_training_vscode.html"
            title="FNO Training Notebook"
            className="notebook-terminal-iframe"
            onLoad={handleIframeLoad}
          />
        </div>
      ) : (
        <div className="notebook-locked">
          <div className="notebook-locked-head">Noch gesperrt</div>
          <div className="notebook-locked-sub">
            Schließ Kapitel 1 bis 7 ab, dann öffnet sich das Notebook in
            Kapitel 8. Bis dahin bleibt dieser Raum stumm.
          </div>
        </div>
      )}
    </div>
  );
}
