import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const SAMPLES = 200;
const W = 540;
const H = 220;
const PAD = 14;

// Trainingsbereich aus PDEBench (kanonisch, für Burgers 1D in dieser
// Lerneinheit gewählt).
export const VISC_MIN_TRAIN = 0.05;
export const VISC_MAX_TRAIN = 0.5;
export const T_MIN_TRAIN = 0.1;
export const T_MAX_TRAIN = 1.0;

// Schieberegler-Range (etwas breiter als Trainingsbereich, damit der
// Lerner Out-of-distribution-Verhalten erkunden kann).
export const VISC_MIN_SLIDER = 0.01;
export const VISC_MAX_SLIDER = 1.0;
export const T_MIN_SLIDER = 0.05;
export const T_MAX_SLIDER = 2.0;

export interface QueryResult {
  visc: number;
  t: number;
  meanAbsError: number;
  inTraining: boolean;
  ts: number;
}

function truthField(visc: number, t: number): number[] {
  const arr = new Array(SAMPLES);
  const sharpness = 1 / (visc + 0.02);
  const shift = 0.1 * t;
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    arr[i] = 0.5 + 0.4 * Math.tanh((x - 0.5 - shift) * sharpness);
  }
  return arr;
}

export function distanceToTraining(visc: number, t: number): number {
  const dv =
    visc < VISC_MIN_TRAIN
      ? (VISC_MIN_TRAIN - visc) / VISC_MAX_TRAIN
      : visc > VISC_MAX_TRAIN
        ? (visc - VISC_MAX_TRAIN) / VISC_MAX_TRAIN
        : 0;
  const dt =
    t < T_MIN_TRAIN
      ? (T_MIN_TRAIN - t) / T_MAX_TRAIN
      : t > T_MAX_TRAIN
        ? (t - T_MAX_TRAIN) / T_MAX_TRAIN
        : 0;
  return Math.sqrt(dv * dv + dt * dt);
}

function fnoField(visc: number, t: number): number[] {
  const truth = truthField(visc, t);
  const dist = distanceToTraining(visc, t);
  const errorAmp = 0.015 + 0.45 * Math.min(1, dist);
  const arr = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const phase = i * 0.32 + visc * 13 + t * 7;
    const noise =
      Math.sin(phase) * Math.cos(phase * 0.6) +
      0.3 * Math.sin(phase * 2.1);
    arr[i] = Math.max(0, Math.min(1, truth[i] + errorAmp * noise));
  }
  return arr;
}

function meanAbsErr(visc: number, t: number): number {
  const truth = truthField(visc, t);
  const fno = fnoField(visc, t);
  let s = 0;
  for (let i = 0; i < SAMPLES; i++) s += Math.abs(truth[i] - fno[i]);
  return s / SAMPLES;
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
  fill: string,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.clearRect(0, 0, W, H);

  // Boden-Linie
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();

  // Füllung unter der Kurve
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = PAD + (i / (values.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.lineTo(PAD + usable, PAD + h);
  ctx.lineTo(PAD, PAD + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Kurve selbst
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = PAD + (i / (values.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

interface Props {
  onSnapshot?: (r: QueryResult) => void;
  onChange?: (visc: number, t: number) => void;
}

export function LivePredictionFNO({ onSnapshot, onChange }: Props) {
  const setSlider = useAppStore((s) => s.setSlider);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [visc, setVisc] = useState(0.2);
  const [t, setT] = useState(0.5);

  const inTraining = useMemo(
    () => distanceToTraining(visc, t) === 0,
    [visc, t],
  );

  const field = useMemo(() => fnoField(visc, t), [visc, t]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawCurve(
      ctx,
      field,
      inTraining ? "#22d3ee" : "#fbbf24",
      inTraining ? "rgba(34, 211, 238, 0.10)" : "rgba(251, 191, 36, 0.10)",
    );
  }, [field, inTraining]);

  useEffect(() => {
    onChange?.(visc, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visc, t]);

  function handleViscChange(v: number) {
    setVisc(v);
    setSlider("livepred_visc", v);
  }

  function handleTChange(v: number) {
    setT(v);
    setSlider("livepred_t", v);
  }

  function handleSnapshot() {
    const err = meanAbsErr(visc, t);
    const r: QueryResult = {
      visc,
      t,
      meanAbsError: err,
      inTraining,
      ts: Date.now(),
    };
    onSnapshot?.(r);
  }

  return (
    <div className="livepred">
      <div className="livepred-stage">
        <div className="livepred-head">
          <span className="livepred-title">FNO-Vorhersage u(x, T)</span>
          <span className={`livepred-status ${inTraining ? "in" : "out"}`}>
            {inTraining
              ? "innerhalb des Gelernten"
              : "außerhalb des Gelernten"}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="livepred-canvas"
        />
        <div className="livepred-foot">
          Ein einziger Forward-Pass. Slider drehen, die Kurve reagiert sofort.
        </div>
      </div>

      <div className="livepred-controls">
        <div className="livepred-slider-row">
          <label className="livepred-label">
            Viskosität ν <code>{visc.toFixed(3)}</code>
          </label>
          <input
            type="range"
            min={VISC_MIN_SLIDER}
            max={VISC_MAX_SLIDER}
            step={0.01}
            value={visc}
            onChange={(e) => handleViscChange(Number(e.target.value))}
            className="livepred-slider"
          />
          <div className="livepred-range-hint">
            gelernter Bereich: {VISC_MIN_TRAIN}…{VISC_MAX_TRAIN}
          </div>
        </div>

        <div className="livepred-slider-row">
          <label className="livepred-label">
            Zeitstempel T <code>{t.toFixed(2)}</code>
          </label>
          <input
            type="range"
            min={T_MIN_SLIDER}
            max={T_MAX_SLIDER}
            step={0.05}
            value={t}
            onChange={(e) => handleTChange(Number(e.target.value))}
            className="livepred-slider"
          />
          <div className="livepred-range-hint">
            gelernter Bereich: {T_MIN_TRAIN}…{T_MAX_TRAIN}
          </div>
        </div>

        <div className="livepred-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleSnapshot}
          >
            Konfiguration merken
          </button>
          <span className="livepred-actions-hint">
            Notiert die aktuelle Stellung für die Edge-Case-Akte unten.
          </span>
        </div>
      </div>
    </div>
  );
}
