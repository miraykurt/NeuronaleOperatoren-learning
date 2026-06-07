import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

type Dim = 2 | 3;
type Phase = "idle" | "loading" | "done";

const BASE_MS = { 2: 50, 3: 2000 } as const;
const BASE_N = 32;
const MIN_N = 8;
const MAX_N = 4096;
const REAL_WAIT_MS = 2200; // wir simulieren, der echte Solver würde länger brauchen

function predictedMs(dim: Dim, n: number): number {
  return BASE_MS[dim] * Math.pow(n / BASE_N, dim);
}

function formatTime(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)} s`;
  const min = s / 60;
  if (min < 60) return `${min.toFixed(1)} min`;
  const h = min / 60;
  if (h < 24) return `${h.toFixed(1)} h`;
  const d = h / 24;
  if (d < 30) return `${d.toFixed(1)} Tage`;
  return `${(d / 365).toFixed(1)} Jahre`;
}

function commentFor(ms: number): string {
  const s = ms / 1000;
  if (s < 1) return "Geht noch, aber das ist auch eine sehr grobe Auflösung.";
  if (s < 60) return "Spürbar. Bei Live-Anwendungen schon raus.";
  if (s < 3600) return "Nicht mehr interaktiv. Für eine Echtzeit-Simulation tot.";
  if (s < 86400) return "Über eine Stunde für ein Frame. Pro neue Anfrage erneut.";
  if (s < 30 * 86400) return "Tagelang rechnen für ein Ergebnis. Realistisch nicht machbar.";
  return "Auf einem normalen Rechner unrealisierbar.";
}

export function CustomGridSize() {
  const setSlider = useAppStore((s) => s.setSlider);
  const [dim, setDim] = useState<Dim>(2);
  const [input, setInput] = useState("256");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{ n: number; dim: Dim; ms: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const parsed = Number(input);
  const valid = Number.isFinite(parsed) && parsed >= MIN_N && parsed <= MAX_N;

  function start() {
    if (!valid || phase === "loading") return;
    const n = Math.round(parsed);
    setSlider("custom_grid_n", n);
    setSlider("custom_grid_dim", dim);
    setPhase("loading");
    setResult(null);
    timer.current = window.setTimeout(() => {
      setResult({ n, dim, ms: predictedMs(dim, n) });
      setPhase("done");
    }, REAL_WAIT_MS);
  }

  function reset() {
    if (timer.current) window.clearTimeout(timer.current);
    setPhase("idle");
    setResult(null);
  }

  return (
    <div className="custom-grid">
      <div className="custom-grid-form">
        <div className="custom-grid-field">
          <div className="custom-grid-label">Dimension</div>
          <div className="ctable-segments">
            {[2, 3].map((d) => (
              <button
                key={d}
                className={`ctable-segment ${dim === d ? "active" : ""}`}
                onClick={() => {
                  setDim(d as Dim);
                  reset();
                }}
                disabled={phase === "loading"}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        <div className="custom-grid-field">
          <div className="custom-grid-label">Gittergröße N (pro Achse)</div>
          <input
            type="number"
            min={MIN_N}
            max={MAX_N}
            step={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (phase === "done") reset();
            }}
            disabled={phase === "loading"}
            className="custom-grid-input"
          />
          <div className="custom-grid-hint">
            erlaubt: {MIN_N}–{MAX_N}
          </div>
        </div>

        <button
          className="primary-button"
          onClick={start}
          disabled={!valid || phase === "loading"}
        >
          {phase === "loading" ? "Solver rechnet …" : "Solver starten"}
        </button>
      </div>

      {phase === "loading" && (
        <div className="custom-grid-loading">
          <div className="hourglass">
            <div className="hourglass-inner" />
          </div>
          <div className="custom-grid-loading-text">
            <div className="custom-grid-loading-head">
              FEM löst Gleichungssystem für {Math.round(parsed)}
              {dim === 2 ? "²" : "³"} ={" "}
              {Math.pow(Math.round(parsed), dim).toLocaleString("de-DE")} Zellen
            </div>
            <div className="custom-grid-loading-sub">
              In Echt würde das viel länger dauern, wir spulen vor.
            </div>
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="custom-grid-result">
          <div className="custom-grid-result-head">
            Geschätzte Rechenzeit:{" "}
            <span className="custom-grid-result-value">
              {formatTime(result.ms)}
            </span>
          </div>
          <div className="custom-grid-result-detail">
            Für ein {result.n}
            {result.dim === 2 ? "²" : "³"} ={" "}
            {Math.pow(result.n, result.dim).toLocaleString("de-DE")}-Zell-Gitter
            in {result.dim}D. {commentFor(result.ms)}
          </div>
          <button
            className="secondary-button"
            style={{ marginTop: 12 }}
            onClick={reset}
          >
            Neue Größe
          </button>
        </div>
      )}
    </div>
  );
}
