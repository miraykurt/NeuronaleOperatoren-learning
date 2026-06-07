import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const W = 560;
const H = 220;
const PAD = 24;
const SAMPLES = 400;

interface Mode {
  k: number;
  amp: number;
  phase: number;
}

const TARGET: Mode[] = [
  { k: 1, amp: 0.55, phase: 0 },
  { k: 2, amp: 0.32, phase: Math.PI / 3 },
  { k: 3, amp: 0.18, phase: -Math.PI / 4 },
  { k: 5, amp: 0.22, phase: 1.1 },
  { k: 7, amp: 0.12, phase: 0.4 },
  { k: 11, amp: 0.08, phase: -0.8 },
];

const PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#fb7185",
];

function targetValue(x: number): number {
  return 0.5 + TARGET.reduce(
    (s, m) => s + m.amp * Math.sin(2 * Math.PI * m.k * x + m.phase),
    0,
  );
}

function partialValue(x: number, upto: number): number {
  return 0.5 + TARGET.slice(0, upto).reduce(
    (s, m) => s + m.amp * Math.sin(2 * Math.PI * m.k * x + m.phase),
    0,
  );
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  fn: (x: number) => number,
  color: string,
  thick = 2,
  dashed = false,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.beginPath();
  if (dashed) ctx.setLineDash([4, 4]);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    const v = fn(x);
    const px = PAD + x * usable;
    const py = PAD + (1 - v) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.stroke();
  if (dashed) ctx.setLineDash([]);
}

function drawAxis(ctx: CanvasRenderingContext2D, label: string) {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H / 2);
  ctx.lineTo(W - PAD, H / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(label, PAD, PAD - 8);
}

export function FourierDecomposition() {
  const ref = useRef<HTMLCanvasElement>(null);
  const setSlider = useAppStore((s) => s.setSlider);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    drawAxis(
      ctx,
      `Original (gestrichelt) vs. Rekonstruktion mit ${step} von ${TARGET.length} Moden`,
    );
    drawCurve(ctx, targetValue, "rgba(148, 163, 184, 0.55)", 1.5, true);
    drawCurve(ctx, (x) => partialValue(x, step), "#22d3ee", 2.5);
  }, [step]);

  const mse = (() => {
    let s = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const x = i / (SAMPLES - 1);
      const d = targetValue(x) - partialValue(x, step);
      s += d * d;
    }
    return Math.sqrt(s / SAMPLES);
  })();

  return (
    <div className="fourier-decomp">
      <canvas ref={ref} width={W} height={H} className="fourier-canvas" />

      <div className="fourier-modes">
        {TARGET.map((m, i) => {
          const active = i < step;
          return (
            <div
              key={i}
              className={`fourier-mode ${active ? "on" : "off"}`}
              style={{
                borderColor: active ? PALETTE[i % PALETTE.length] : undefined,
              }}
            >
              <div className="fourier-mode-k">k = {m.k}</div>
              <div className="fourier-mode-amp">
                Amplitude: <code>{m.amp.toFixed(2)}</code>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fourier-controls">
        <button
          className="secondary-button"
          onClick={() => {
            const v = Math.max(1, step - 1);
            setStep(v);
            setSlider("fourier_modes", v);
          }}
          disabled={step <= 1}
        >
          ← Mode entfernen
        </button>
        <span className="fourier-mse">
          Rekonstruktionsfehler: <code>{mse.toFixed(4)}</code>
        </span>
        <button
          className="primary-button"
          onClick={() => {
            const v = Math.min(TARGET.length, step + 1);
            setStep(v);
            setSlider("fourier_modes", v);
          }}
          disabled={step >= TARGET.length}
        >
          Nächste Mode +
        </button>
      </div>

      <p className="fourier-note">
        Jede Funktion lässt sich als Summe von Sinuswellen schreiben. Schon
        wenige Moden reichen, um die Grundform sauber wiederzugeben. Die
        höheren Frequenzen fügen nur noch Details hinzu. Genau diese
        Eigenschaft macht sich der FNO zunutze.
      </p>
    </div>
  );
}
