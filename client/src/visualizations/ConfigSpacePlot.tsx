import { useEffect, useMemo, useRef } from "react";
import type { QueryResult } from "./LivePredictionFNO";
import {
  VISC_MIN_SLIDER,
  VISC_MAX_SLIDER,
  T_MIN_SLIDER,
  T_MAX_SLIDER,
  VISC_MIN_TRAIN,
  VISC_MAX_TRAIN,
  T_MIN_TRAIN,
  T_MAX_TRAIN,
} from "./LivePredictionFNO";

const SIZE = 380;
const PAD = 32;

function viscToPx(v: number): number {
  return (
    PAD +
    ((v - VISC_MIN_SLIDER) / (VISC_MAX_SLIDER - VISC_MIN_SLIDER)) *
      (SIZE - PAD * 2)
  );
}
function tToPx(t: number): number {
  return (
    SIZE -
    PAD -
    ((t - T_MIN_SLIDER) / (T_MAX_SLIDER - T_MIN_SLIDER)) * (SIZE - PAD * 2)
  );
}

// Deterministische Pseudo-Zufallszahl, damit die Trainings-Cloud bei
// jedem Render gleich aussieht.
function seeded(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// 80 Trainings-Konfigurationen innerhalb des Trainingsbereichs (Cloud).
const TRAINING_POINTS: { visc: number; t: number }[] = Array.from(
  { length: 80 },
  (_, i) => {
    const u = seeded(i * 2 + 1);
    const v = seeded(i * 2 + 7);
    return {
      visc: VISC_MIN_TRAIN + u * (VISC_MAX_TRAIN - VISC_MIN_TRAIN),
      t: T_MIN_TRAIN + v * (T_MAX_TRAIN - T_MIN_TRAIN),
    };
  },
);

interface Props {
  history: QueryResult[];
  currentVisc: number;
  currentT: number;
}

export function ConfigSpacePlot({ history, currentVisc, currentT }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  const insideTrain = useMemo(() => {
    return (
      currentVisc >= VISC_MIN_TRAIN &&
      currentVisc <= VISC_MAX_TRAIN &&
      currentT >= T_MIN_TRAIN &&
      currentT <= T_MAX_TRAIN
    );
  }, [currentVisc, currentT]);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Hintergrund: Trainingsbereich-Rechteck
    const tx0 = viscToPx(VISC_MIN_TRAIN);
    const tx1 = viscToPx(VISC_MAX_TRAIN);
    const ty1 = tToPx(T_MIN_TRAIN);
    const ty0 = tToPx(T_MAX_TRAIN);
    ctx.fillStyle = "rgba(52, 211, 153, 0.08)";
    ctx.fillRect(tx0, ty0, tx1 - tx0, ty1 - ty0);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.5)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tx0, ty0, tx1 - tx0, ty1 - ty0);
    ctx.setLineDash([]);

    // Trainings-Konfigurationen als kleine Punkte (PDEBench-Cloud)
    TRAINING_POINTS.forEach((p) => {
      const px = viscToPx(p.visc);
      const py = tToPx(p.t);
      ctx.fillStyle = "rgba(52, 211, 153, 0.55)";
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Achsen
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, SIZE - PAD);
    ctx.lineTo(SIZE - PAD, SIZE - PAD);
    ctx.stroke();

    // Achsen-Labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("Viskosität ν", SIZE / 2 - 30, SIZE - 8);
    ctx.save();
    ctx.translate(12, SIZE / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Zeit T", 0, 0);
    ctx.restore();

    // Beschriftung des Trainingsbereichs
    ctx.fillStyle = "rgba(52, 211, 153, 0.85)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("Trainingsbereich", tx0 + 6, ty0 + 14);

    // Gemerkte Konfigurationen (Snapshots vom Lerner)
    history.forEach((q) => {
      const px = viscToPx(q.visc);
      const py = tToPx(q.t);
      ctx.fillStyle = q.inTraining
        ? "rgba(34, 211, 238, 0.85)"
        : "rgba(251, 191, 36, 0.85)";
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(15, 23, 41, 0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Aktueller Reglerpunkt als Crosshair
    const cx = viscToPx(currentVisc);
    const cy = tToPx(currentT);
    const cur = insideTrain ? "#22d3ee" : "#fbbf24";
    ctx.strokeStyle = cur;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.strokeStyle = cur;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = insideTrain
      ? "rgba(34, 211, 238, 0.2)"
      : "rgba(251, 191, 36, 0.2)";
    ctx.fill();
  }, [history, currentVisc, currentT, insideTrain]);

  return (
    <div className="configspace">
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        className="configspace-canvas"
      />
      <div className="configspace-legend">
        <div className="configspace-legend-row">
          <span
            className="configspace-legend-swatch"
            style={{ background: "rgba(52, 211, 153, 0.4)" }}
          />
          <span>Trainingsbereich</span>
        </div>
        <div className="configspace-legend-row">
          <span
            className="configspace-legend-dot"
            style={{ background: "rgba(52, 211, 153, 0.85)" }}
          />
          <span>Trainings-Konfigurationen aus PDEBench</span>
        </div>
        <div className="configspace-legend-row">
          <span className="configspace-legend-cross" />
          <span>Aktuelle Reglerstellung</span>
        </div>
        <div className="configspace-legend-row">
          <span
            className="configspace-legend-dot"
            style={{ background: "rgba(34, 211, 238, 0.85)" }}
          />
          <span>Gemerkte Konfiguration</span>
        </div>
        <div className="configspace-summary">
          {history.length}{" "}
          {history.length === 1 ? "Konfiguration" : "Konfigurationen"} gemerkt
        </div>
      </div>
    </div>
  );
}
