import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const SIZE = 360;
const N = 60;
const PAD = 28;

const X_MIN = 0.01;
const X_MAX = 1.0;
const Y_MIN = 0.05;
const Y_MAX = 2.0;
const TRAIN_X_MIN = 0.05;
const TRAIN_X_MAX = 0.5;
const TRAIN_Y_MIN = 0.1;
const TRAIN_Y_MAX = 1.0;

function distanceToTraining(visc: number, t: number): number {
  const dv =
    visc < TRAIN_X_MIN
      ? (TRAIN_X_MIN - visc) / TRAIN_X_MAX
      : visc > TRAIN_X_MAX
        ? (visc - TRAIN_X_MAX) / TRAIN_X_MAX
        : 0;
  const dt =
    t < TRAIN_Y_MIN
      ? (TRAIN_Y_MIN - t) / TRAIN_Y_MAX
      : t > TRAIN_Y_MAX
        ? (t - TRAIN_Y_MAX) / TRAIN_Y_MAX
        : 0;
  return Math.sqrt(dv * dv + dt * dt);
}

function errorAt(visc: number, t: number): number {
  const dist = distanceToTraining(visc, t);
  const base = 0.015;
  return base + 0.45 * Math.min(1, dist);
}

function colorFor(v: number): string {
  // v: 0…0.5
  const k = Math.min(1, v / 0.3);
  if (k < 0.3) {
    return `rgb(${52 + k * 200}, ${211}, ${153 - k * 100})`;
  }
  if (k < 0.6) {
    return `rgb(${251}, ${191 - (k - 0.3) * 200}, ${36})`;
  }
  return `rgb(${248}, ${100 - (k - 0.6) * 80}, ${100 - (k - 0.6) * 80})`;
}

function viscToPx(v: number): number {
  return PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (SIZE - PAD * 2);
}
function tToPx(t: number): number {
  return SIZE - PAD - ((t - Y_MIN) / (Y_MAX - Y_MIN)) * (SIZE - PAD * 2);
}

export function ErrorHeatmap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const setSlider = useAppStore((s) => s.setSlider);
  const [visc, setVisc] = useState(0.2);
  const [t, setT] = useState(0.5);

  const currentError = errorAt(visc, t);
  const inTraining = distanceToTraining(visc, t) === 0;

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Heatmap rastern
    const usable = SIZE - PAD * 2;
    const cell = usable / N;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const vx = X_MIN + (i / (N - 1)) * (X_MAX - X_MIN);
        const ty = Y_MIN + (1 - j / (N - 1)) * (Y_MAX - Y_MIN);
        const err = errorAt(vx, ty);
        ctx.fillStyle = colorFor(err);
        ctx.fillRect(
          PAD + i * cell,
          PAD + j * cell,
          Math.ceil(cell),
          Math.ceil(cell),
        );
      }
    }

    // Trainingsrahmen
    const tx0 = viscToPx(TRAIN_X_MIN);
    const tx1 = viscToPx(TRAIN_X_MAX);
    const ty1 = tToPx(TRAIN_Y_MIN);
    const ty0 = tToPx(TRAIN_Y_MAX);
    ctx.strokeStyle = "rgba(15, 23, 41, 0.7)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(tx0, ty0, tx1 - tx0, ty1 - ty0);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(15, 23, 41, 0.7)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("Trainingsbereich", tx0 + 4, ty0 + 12);

    // Achsen
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, SIZE - PAD);
    ctx.lineTo(SIZE - PAD, SIZE - PAD);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("ν", SIZE / 2, SIZE - 6);
    ctx.save();
    ctx.translate(12, SIZE / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("T", 0, 0);
    ctx.restore();

    // Crosshair zur aktuellen Auswahl
    const cx = viscToPx(visc);
    const cy = tToPx(t);
    ctx.strokeStyle = "#0f1729";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
  }, [visc, t]);

  return (
    <div className="errheatmap">
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        className="errheatmap-canvas"
      />

      <div className="errheatmap-side">
        <div className={`errheatmap-readout ${inTraining ? "in" : "out"}`}>
          <div className="errheatmap-readout-label">Aktueller Fehler</div>
          <div className="errheatmap-readout-value">
            {(currentError * 100).toFixed(1)} %
          </div>
          <div className="errheatmap-readout-status">
            {inTraining
              ? "innerhalb Trainingsbereich"
              : "Vorsicht: Extrapolation"}
          </div>
        </div>

        <div className="errheatmap-slider-row">
          <label>
            ν <code>{visc.toFixed(3)}</code>
          </label>
          <input
            type="range"
            min={0.01}
            max={1.0}
            step={0.01}
            value={visc}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVisc(v);
              setSlider("errmap_visc", v);
            }}
          />
        </div>

        <div className="errheatmap-slider-row">
          <label>
            T <code>{t.toFixed(2)}</code>
          </label>
          <input
            type="range"
            min={0.05}
            max={2.0}
            step={0.05}
            value={t}
            onChange={(e) => {
              const v = Number(e.target.value);
              setT(v);
              setSlider("errmap_t", v);
            }}
          />
        </div>

        <div className="errheatmap-legend">
          <span>niedrig</span>
          <div className="errheatmap-legend-bar" />
          <span>hoch</span>
        </div>

        <div className="errheatmap-note">
          Schieb die Slider. Innerhalb des markierten Rechtecks bleibt der
          Fehler stabil bei wenigen Prozent. Außerhalb wächst er mit der
          Distanz, die Vorhersage bricht sichtbar ein.
        </div>
      </div>
    </div>
  );
}
