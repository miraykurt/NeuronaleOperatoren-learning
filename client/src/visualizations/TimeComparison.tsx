import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const MIN_GRID = 32;
const MAX_GRID = 128;
const GRID_STEP = 32;

const FNO_DURATION_MS = 80;
const FNO_SIMULATED_SECONDS = 0.008;

function femDurationMs(gridSize: number): number {
  return Math.pow(gridSize / 32, 2) * 600;
}

type Phase = "idle" | "running" | "done";

export function TimeComparison() {
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const setSlider = useAppStore((s) => s.setSlider);
  const [gridSize, setGridSize] = useState(64);
  const [phase, setPhase] = useState<Phase>("idle");
  const [femProgress, setFemProgress] = useState(0);
  const [fnoProgress, setFnoProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef(0);
  const rafId = useRef<number | null>(null);

  const femTotalMs = femDurationMs(gridSize);
  const femSimulatedSeconds = femTotalMs / 1000;
  const speedup = Math.round(femSimulatedSeconds / FNO_SIMULATED_SECONDS);

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  function reset() {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    setPhase("idle");
    setFemProgress(0);
    setFnoProgress(0);
    setElapsedMs(0);
  }

  function start() {
    reset();
    setPhase("running");
    startedAt.current = performance.now();

    if (gridSize >= 128) {
      unlockAchievement("grid_master");
    }

    const tick = (now: number) => {
      const dt = now - startedAt.current;
      const fnoP = Math.min(1, dt / FNO_DURATION_MS);
      const femP = Math.min(1, dt / femTotalMs);
      setFnoProgress(fnoP);
      setFemProgress(femP);
      setElapsedMs(dt);

      if (femP < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        rafId.current = null;
        setPhase("done");
      }
    };

    rafId.current = requestAnimationFrame(tick);
  }

  const elapsedSec = (elapsedMs / 1000).toFixed(2);
  const showFemTime = phase === "idle" ? "-" : `${elapsedSec}s`;
  const showFnoTime =
    fnoProgress >= 1 ? `${FNO_SIMULATED_SECONDS}s` : "-";

  return (
    <div className="time-comparison">
      <div className="tc-row">
        <div className="tc-label">
          <div className="tc-method">Klassischer Solver (FEM)</div>
          <div className="tc-sublabel">iterativ, gitterbasiert</div>
        </div>
        <div className="tc-bar-container">
          <div
            className="tc-bar tc-bar-fem"
            style={{ width: `${femProgress * 100}%` }}
          />
        </div>
        <div className="tc-time">{showFemTime}</div>
      </div>

      <div className="tc-row">
        <div className="tc-label">
          <div className="tc-method">Neuronaler Operator (FNO)</div>
          <div className="tc-sublabel">trainiert, ein Forward-Pass</div>
        </div>
        <div className="tc-bar-container">
          <div
            className="tc-bar tc-bar-fno"
            style={{ width: `${fnoProgress * 100}%` }}
          />
        </div>
        <div className="tc-time">{showFnoTime}</div>
      </div>

      <div className="tc-controls">
        <div className="tc-slider-row">
          <label className="tc-slider-label">
            Gitterauflösung:{" "}
            <code>
              {gridSize} × {gridSize}
            </code>
          </label>
          <input
            type="range"
            min={MIN_GRID}
            max={MAX_GRID}
            step={GRID_STEP}
            value={gridSize}
            onChange={(e) => {
              const v = Number(e.target.value);
              setGridSize(v);
              setSlider("timecompare_grid", v);
              reset();
            }}
            disabled={phase === "running"}
          />
        </div>
        <div className="tc-buttons">
          <button
            className="primary-button"
            onClick={start}
            disabled={phase === "running"}
          >
            {phase === "running" ? "Simulation läuft …" : "Simulation starten"}
          </button>
          {phase === "done" && (
            <button
              className="secondary-button"
              onClick={reset}
              style={{ marginLeft: "12px" }}
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {phase === "done" && (
        <div className="tc-result">
          <div className="tc-result-headline">
            FNO war ≈ {speedup.toLocaleString("de-DE")}× schneller
          </div>
          <div className="tc-result-detail">
            Gleicher Output, bei{" "}
            <code>
              {gridSize}×{gridSize}
            </code>{" "}
            Auflösung. Der klassische Solver brauchte {femSimulatedSeconds.toFixed(2)}s,
            der neuronale Operator {FNO_SIMULATED_SECONDS}s. Probier eine höhere
            Auflösung. Der Abstand wächst quadratisch.
          </div>
        </div>
      )}
    </div>
  );
}
