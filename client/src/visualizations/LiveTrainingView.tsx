import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLES = 200;
const W_FIELD = 360;
const H_FIELD = 160;
const W_LOSS = 360;
const H_LOSS = 160;
const PAD = 14;

// Wahrheits-Funktion: Burgers-typische Schockfront. Bewusst eine
// scharfe Kante drin, damit man am Ende sieht, wie das Modell sie
// trifft (oder nicht).
function truth(): number[] {
  const arr = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    arr[i] = 0.5 - 0.42 * Math.tanh((x - 0.4) * 22) + 0.06 * Math.sin(x * 11);
  }
  return arr;
}

// Vorhersage zu einem gegebenen Trainingsfortschritt p in [0, 1].
// Bei p=0: viel strukturiertes Rauschen (Zufallsgewichte).
// Bei p=1: praktisch die Wahrheit, kleiner Restfehler.
function predictionAt(t: number[], p: number, seed: number): number[] {
  const noiseAmp = 0.45 * (1 - p) + 0.015;
  const arr = new Array(SAMPLES);
  for (let i = 0; i < SAMPLES; i++) {
    const phase = i * 0.37 + seed * 0.013;
    const n =
      Math.sin(phase) * Math.cos(phase * 0.7) +
      0.4 * Math.sin(phase * 2.3) +
      0.2 * Math.cos(phase * 4.1);
    arr[i] = Math.max(0, Math.min(1, t[i] + noiseAmp * n));
  }
  return arr;
}

function relL2(a: number[], b: number[]): number {
  let n = 0;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const e = a[i] - b[i];
    n += e * e;
    d += b[i] * b[i];
  }
  return Math.sqrt(n / Math.max(1e-9, d));
}

function drawField(
  ctx: CanvasRenderingContext2D,
  truthVals: number[],
  predVals: number[],
) {
  const usable = W_FIELD - PAD * 2;
  const h = H_FIELD - PAD * 2;
  ctx.clearRect(0, 0, W_FIELD, H_FIELD);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H_FIELD - PAD);
  ctx.lineTo(W_FIELD - PAD, H_FIELD - PAD);
  ctx.stroke();
  // Wahrheit gestrichelt
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  truthVals.forEach((v, i) => {
    const px = PAD + (i / (truthVals.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  // Vorhersage
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  predVals.forEach((v, i) => {
    const px = PAD + (i / (predVals.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function drawLoss(ctx: CanvasRenderingContext2D, losses: number[]) {
  const usable = W_LOSS - PAD * 2;
  const h = H_LOSS - PAD * 2;
  ctx.clearRect(0, 0, W_LOSS, H_LOSS);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H_LOSS - PAD);
  ctx.lineTo(W_LOSS - PAD, H_LOSS - PAD);
  ctx.stroke();
  if (losses.length < 2) return;
  const maxL = Math.max(...losses, 0.01);
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  losses.forEach((l, i) => {
    const px = PAD + (i / Math.max(1, losses.length - 1)) * usable;
    const py = PAD + (l / maxL) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

const TOTAL_EPOCHS = 30;
const STEP_MS = 220;

export function LiveTrainingView() {
  const fieldRef = useRef<HTMLCanvasElement>(null);
  const lossRef = useRef<HTMLCanvasElement>(null);

  const [epoch, setEpoch] = useState(0);
  const [running, setRunning] = useState(false);
  const [losses, setLosses] = useState<number[]>([]);
  const timer = useRef<number | null>(null);

  const truthVals = useMemo(() => truth(), []);
  const progress = epoch / TOTAL_EPOCHS;
  const pred = useMemo(
    () => predictionAt(truthVals, progress, epoch),
    [truthVals, progress, epoch],
  );
  const currentLoss = useMemo(() => relL2(pred, truthVals), [pred, truthVals]);

  useEffect(() => {
    const c = fieldRef.current?.getContext("2d");
    if (c) drawField(c, truthVals, pred);
  }, [truthVals, pred]);

  useEffect(() => {
    const c = lossRef.current?.getContext("2d");
    if (c) drawLoss(c, losses);
  }, [losses]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function start() {
    if (running) return;
    if (epoch >= TOTAL_EPOCHS) reset();
    setRunning(true);
    timer.current = window.setInterval(() => {
      setEpoch((e) => {
        if (e >= TOTAL_EPOCHS) {
          if (timer.current) window.clearInterval(timer.current);
          setRunning(false);
          return e;
        }
        const next = e + 1;
        const p = next / TOTAL_EPOCHS;
        const newPred = predictionAt(truthVals, p, next);
        setLosses((ls) => [...ls, relL2(newPred, truthVals)]);
        return next;
      });
    }, STEP_MS);
  }

  function pause() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  }

  function reset() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
    setEpoch(0);
    setLosses([]);
  }

  return (
    <div className="trainview">
      <div className="trainview-panels">
        <div className="trainview-panel">
          <div className="trainview-head">
            <span className="trainview-title">
              Vorhersage gegen Wahrheit
            </span>
            <span className="trainview-meta">
              Epoche <code>{epoch}</code> / {TOTAL_EPOCHS}
            </span>
          </div>
          <canvas
            ref={fieldRef}
            width={W_FIELD}
            height={H_FIELD}
            className="trainview-canvas"
          />
          <div className="trainview-foot">
            Gestrichelt: Wahrheit aus PDEBench. Cyan: aktuelle Vorhersage
            des Modells. Bei Epoche 0 sind die Gewichte zufällig, daher
            der Matsch.
          </div>
        </div>

        <div className="trainview-panel">
          <div className="trainview-head">
            <span className="trainview-title">Trainings-Verlust</span>
            <span className="trainview-meta">
              rel. L2: <code>{(currentLoss * 100).toFixed(1)} %</code>
            </span>
          </div>
          <canvas
            ref={lossRef}
            width={W_LOSS}
            height={H_LOSS}
            className="trainview-canvas"
          />
          <div className="trainview-foot">
            Je weiter unten die Kurve, desto besser passt die Vorhersage.
            Bei stabilem Training fällt sie monoton.
          </div>
        </div>
      </div>

      <div className="trainview-controls">
        {!running ? (
          <button className="primary-button" onClick={start}>
            {epoch === 0 ? "Trainieren starten" : epoch >= TOTAL_EPOCHS ? "Erneut trainieren" : "Weiter"}
          </button>
        ) : (
          <button className="secondary-button" onClick={pause}>
            Pause
          </button>
        )}
        <button
          className="secondary-button"
          onClick={reset}
          disabled={running}
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
