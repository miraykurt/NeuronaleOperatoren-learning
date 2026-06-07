import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const GRID_OPTIONS = [8, 16, 32, 64, 128, 256, 512];
const CANVAS_PX = 320;

function femMs(n: number): number {
  // O(N^2), bei N=16 ≈ 50ms, wächst quadratisch
  return (n * n) / 5.12;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

type Severity = "ok" | "warn" | "bad";

function severityFor(ms: number): Severity {
  if (ms < 1000) return "ok";
  if (ms < 10_000) return "warn";
  return "bad";
}

function fieldValue(x: number, y: number): number {
  // Glattes Skalarfeld: gaußscher Peak + leichte Modulation
  const dx = x - 0.5;
  const dy = y - 0.5;
  const peak = Math.exp(-(dx * dx + dy * dy) * 8);
  const wave = 0.25 * Math.sin(x * 7.5) * Math.cos(y * 7.5);
  return Math.max(0, Math.min(1, peak + wave + 0.15));
}

function colorFor(v: number): [number, number, number] {
  // viridis-artig: dunkelblau → türkis → gelb-orange
  const stops: Array<[number, [number, number, number]]> = [
    [0, [20, 30, 70]],
    [0.35, [30, 110, 160]],
    [0.65, [80, 200, 180]],
    [0.85, [240, 200, 80]],
    [1, [240, 120, 40]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (v <= t1) {
      const k = (v - t0) / (t1 - t0);
      return [
        c0[0] + (c1[0] - c0[0]) * k,
        c0[1] + (c1[1] - c0[1]) * k,
        c0[2] + (c1[2] - c0[2]) * k,
      ];
    }
  }
  return stops[stops.length - 1][1];
}

export function GridZoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setSlider = useAppStore((s) => s.setSlider);
  const unlockAchievement = useAppStore((s) => s.unlockAchievement);
  const [n, setN] = useState(32);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellPx = CANVAS_PX / n;
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const v = fieldValue((i + 0.5) / n, (j + 0.5) / n);
        const [r, g, b] = colorFor(v);
        ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
        ctx.fillRect(i * cellPx, j * cellPx, Math.ceil(cellPx), Math.ceil(cellPx));
      }
    }

    if (n <= 128) {
      ctx.strokeStyle = "rgba(15, 23, 41, 0.45)";
      ctx.lineWidth = n <= 32 ? 1 : 0.5;
      for (let i = 0; i <= n; i++) {
        const p = (i * CANVAS_PX) / n;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, CANVAS_PX);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(CANVAS_PX, p);
        ctx.stroke();
      }
    }
  }, [n]);

  const ms = femMs(n);
  const sev = severityFor(ms);

  function handleChange(value: number) {
    setN(value);
    setSlider("gridzoom_n", value);
    if (value >= 128) unlockAchievement("grid_master");
  }

  return (
    <div className="gridzoom">
      <div className="gridzoom-stage">
        <canvas
          ref={canvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          className="gridzoom-canvas"
        />
        <div className={`gridzoom-meter gridzoom-meter-${sev}`}>
          <div className="gridzoom-meter-label">Rechenzeit FEM (2D)</div>
          <div className="gridzoom-meter-value">{formatTime(ms)}</div>
          <div className="gridzoom-meter-bar">
            <div
              className="gridzoom-meter-fill"
              style={{
                width: `${Math.min(100, (Math.log10(ms + 1) / Math.log10(60_000)) * 100)}%`,
              }}
            />
          </div>
          <div className="gridzoom-meter-cells">
            {(n * n).toLocaleString("de-DE")} Zellen
          </div>
        </div>
      </div>

      <div className="gridzoom-controls">
        <label className="gridzoom-slider-label">
          Auflösung: <code>{n} × {n}</code>
        </label>
        <div className="gridzoom-steps">
          {GRID_OPTIONS.map((g) => (
            <button
              key={g}
              className={`gridzoom-step ${g === n ? "active" : ""}`}
              onClick={() => handleChange(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <p className="gridzoom-hint">
        Doppelt so fein in jeder Richtung ⇒ viermal so viele Zellen ⇒
        Rechenzeit wächst quadratisch. In 3D wäre es achtfach pro
        Verdopplung.
      </p>
    </div>
  );
}
