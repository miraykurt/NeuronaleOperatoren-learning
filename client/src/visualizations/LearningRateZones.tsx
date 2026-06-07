import { useEffect, useMemo, useRef, useState } from "react";

// Drei Zonen der Lernrate:
//   < 1e-4   : zu zaghaft, Loss kriecht
//   1e-3     : guter Bereich, Loss fällt sauber
//   > 5e-2   : explodiert, Loss schwankt oder steigt
// Slider in log-Skala, Achse: log10(lr) von -5 bis -0.5

const W = 460;
const H = 180;
const PAD = 18;
const STEPS = 60;

function lossCurve(lr: number): number[] {
  // Drei Verhaltensregimes als Heuristik:
  // - sehr klein: nahezu konstanter Loss
  // - mittel: schöner exponentieller Abfall
  // - groß: erst Abfall, dann Explosion mit Oszillation
  const out = new Array(STEPS);
  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1);
    if (lr < 5e-4) {
      // zu zaghaft
      out[i] = 0.95 - 0.05 * t + 0.01 * Math.sin(i * 0.8);
    } else if (lr <= 5e-3) {
      // guter Bereich
      const decay = Math.exp(-4 * lr * 1000 * t);
      out[i] = 0.05 + (0.95 - 0.05) * decay + 0.005 * Math.sin(i * 0.9);
    } else if (lr <= 2e-2) {
      // Grenzbereich, ein bisschen wild
      const decay = Math.exp(-2 * t);
      const osc = 0.06 * Math.sin(i * 1.4) * (1 - Math.exp(-i * 0.05));
      out[i] = 0.1 + 0.85 * decay + osc;
    } else {
      // Explosion
      const safe = Math.min(STEPS / 4, i);
      const decay = Math.exp(-1.6 * (safe / STEPS) * 4);
      const explode = i > safe ? 0.5 * Math.sinh(0.18 * (i - safe)) : 0;
      out[i] = Math.min(
        1.2,
        0.1 + 0.85 * decay + 0.1 * Math.sin(i * 2.2) + explode,
      );
    }
  }
  return out;
}

function drawLoss(ctx: CanvasRenderingContext2D, vals: number[]) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.clearRect(0, 0, W, H);
  // Achse
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD);
  ctx.lineTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();
  // Kurve
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  vals.forEach((v, i) => {
    const px = PAD + (i / (vals.length - 1)) * usable;
    const py = PAD + Math.max(0, Math.min(1, v)) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  // Labels
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("Loss", 4, PAD + 4);
  ctx.fillText("Epoche", W - PAD - 36, H - 4);
}

function zoneFor(lr: number): {
  label: string;
  desc: string;
  cls: string;
} {
  if (lr < 5e-4) {
    return {
      label: "zu zaghaft",
      cls: "warn",
      desc: "Lernrate winzig, das Modell bewegt sich kaum. Loss fällt nicht, Training würde ewig dauern.",
    };
  }
  if (lr <= 5e-3) {
    return {
      label: "guter Bereich",
      cls: "ok",
      desc: "Saubere Konvergenz, Loss fällt zügig. Der Sweet-Spot für FNO-Training auf Burgers liegt typischerweise hier.",
    };
  }
  if (lr <= 2e-2) {
    return {
      label: "Grenzbereich",
      cls: "warn",
      desc: "Loss fällt anfangs schnell, fängt aber an zu schwanken. Riskant für längere Trainings.",
    };
  }
  return {
    label: "explodiert",
    cls: "bad",
    desc: "Lernrate zu groß. Loss läuft weg, Gewichte werden instabil. Training unbrauchbar.",
  };
}

const LR_MIN_LOG = -5;
const LR_MAX_LOG = -0.5;

export function LearningRateZones() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [logLr, setLogLr] = useState(-3);
  const lr = useMemo(() => Math.pow(10, logLr), [logLr]);
  const losses = useMemo(() => lossCurve(lr), [lr]);
  const zone = useMemo(() => zoneFor(lr), [lr]);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawLoss(ctx, losses);
  }, [losses]);

  return (
    <div className="lrzones">
      <canvas
        ref={ref}
        width={W}
        height={H}
        className="lrzones-canvas"
      />
      <div className="lrzones-controls">
        <label className="lrzones-label">
          Lernrate <code>{lr.toExponential(1)}</code>
        </label>
        <input
          type="range"
          min={LR_MIN_LOG}
          max={LR_MAX_LOG}
          step={0.1}
          value={logLr}
          onChange={(e) => setLogLr(Number(e.target.value))}
          className="lrzones-slider"
        />
        <div className="lrzones-axis">
          <span>10⁻⁵</span>
          <span>10⁻³</span>
          <span>10⁻¹</span>
        </div>
      </div>
      <div className={`lrzones-zone lrzones-${zone.cls}`}>
        <strong>{zone.label}.</strong> {zone.desc}
      </div>
    </div>
  );
}
