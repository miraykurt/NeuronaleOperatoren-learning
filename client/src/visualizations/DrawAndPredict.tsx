import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const W = 540;
const H = 200;
const PAD = 16;

const NN_TRAINED_RES = 16;
const RESOLUTIONS = [16, 32, 64, 128];

interface Point {
  x: number;
  y: number;
}

function resampleToGrid(points: Point[], n: number): number[] {
  if (points.length === 0) return new Array(n).fill(0.5);
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let prev = sorted[0];
    let next = sorted[sorted.length - 1];
    for (const p of sorted) {
      if (p.x <= x) prev = p;
      if (p.x >= x) {
        next = p;
        break;
      }
    }
    if (prev === next) {
      result[i] = prev.y;
    } else {
      const t = (x - prev.x) / Math.max(1e-6, next.x - prev.x);
      result[i] = prev.y * (1 - t) + next.y * t;
    }
  }
  return result;
}

function operatorSmooth(points: Point[], n: number): number[] {
  const samples = resampleToGrid(points, n * 3);
  const result = new Array(n);
  const win = Math.max(2, Math.floor(samples.length / 20));
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (samples.length - 1));
    let sum = 0;
    let count = 0;
    for (let k = -win; k <= win; k++) {
      const j = idx + k;
      if (j >= 0 && j < samples.length) {
        sum += samples[j];
        count++;
      }
    }
    result[i] = sum / count;
  }
  return result;
}

function drawValues(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
  fill?: string,
  thick = 2,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const px = PAD + (i / (values.length - 1)) * usable;
    const py = PAD + (1 - v) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  if (fill) {
    ctx.lineTo(PAD + usable, PAD + h);
    ctx.lineTo(PAD, PAD + h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = thick;
    ctx.stroke();
  }
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  values.forEach((v, i) => {
    const px = PAD + (i / (values.length - 1)) * usable;
    const py = PAD + (1 - v) * h;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawGrid(ctx: CanvasRenderingContext2D, n: number) {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1;
  const usable = W - PAD * 2;
  for (let i = 0; i < n; i++) {
    const px = PAD + (i / (n - 1)) * usable;
    ctx.beginPath();
    ctx.moveTo(px, PAD);
    ctx.lineTo(px, H - PAD);
    ctx.stroke();
  }
}

function drawAxis(ctx: CanvasRenderingContext2D, label: string) {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(label, PAD, PAD - 4);
}

export function DrawAndPredict() {
  const setSlider = useAppStore((s) => s.setSlider);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const nnRef = useRef<HTMLCanvasElement>(null);
  const opRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [resolution, setResolution] = useState(64);
  const drawing = useRef(false);

  function pxToNorm(e: React.PointerEvent<HTMLCanvasElement>): Point | null {
    const c = drawRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const p = pxToNorm(e);
    if (p) setPoints([p]);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = pxToNorm(e);
    if (p) setPoints((prev) => [...prev, p]);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    setPoints([]);
  }

  useEffect(() => {
    const ctx = drawRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawAxis(ctx, "Hier zeichnen: beliebige Anfangsbedingung u(x)");
    if (points.length > 1) {
      const usable = W - PAD * 2;
      const h = H - PAD * 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const px = PAD + p.x * usable;
        const py = PAD + (1 - p.y) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (points.length === 0) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText("Klick und zieh die Maus über die Fläche", PAD, H / 2);
    }
  }, [points]);

  useEffect(() => {
    const nn = nnRef.current?.getContext("2d");
    const op = opRef.current?.getContext("2d");
    if (!nn || !op) return;
    nn.clearRect(0, 0, W, H);
    op.clearRect(0, 0, W, H);

    if (points.length < 2) {
      drawAxis(nn, "Vorhersage Neuronales Netz: auf 16 Punkten trainiert");
      drawAxis(op, "Vorhersage Neuronaler Operator: gitterunabhängig");
      return;
    }

    const nnInput = resampleToGrid(points, NN_TRAINED_RES);
    const nnDisplay: number[] = new Array(resolution);
    for (let i = 0; i < resolution; i++) {
      const idx = (i / (resolution - 1)) * (NN_TRAINED_RES - 1);
      const lo = Math.floor(idx);
      const hi = Math.min(NN_TRAINED_RES - 1, lo + 1);
      const t = idx - lo;
      nnDisplay[i] = nnInput[lo] * (1 - t) + nnInput[hi] * t;
    }
    if (resolution > NN_TRAINED_RES) {
      const noiseAmp = 0.1 * Math.log2(resolution / NN_TRAINED_RES);
      for (let i = 0; i < nnDisplay.length; i++) {
        const phase = i * 0.7 + resolution * 0.13;
        nnDisplay[i] += noiseAmp * Math.sin(phase) * Math.sin(phase * 1.3 + 1);
        nnDisplay[i] = Math.max(0, Math.min(1, nnDisplay[i]));
      }
    }

    const opOut = operatorSmooth(points, resolution);

    drawAxis(nn, `Vorhersage Neuronales Netz: Anzeige bei ${resolution} Punkten`);
    if (resolution !== NN_TRAINED_RES) drawGrid(nn, NN_TRAINED_RES);
    drawValues(nn, nnDisplay, "#f87171", "rgba(248, 113, 113, 0.12)");
    drawDots(nn, resampleToGrid(points, NN_TRAINED_RES), "#f87171");

    drawAxis(op, `Vorhersage Neuronaler Operator: Anzeige bei ${resolution} Punkten`);
    drawValues(op, opOut, "#34d399", "rgba(52, 211, 153, 0.12)");
  }, [points, resolution]);

  return (
    <div className="draw-predict">
      <canvas
        ref={drawRef}
        width={W}
        height={H}
        className="draw-predict-canvas draw-predict-drawable"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />

      <div className="draw-predict-controls">
        <div className="draw-predict-res">
          <span className="draw-predict-label">Anzeige-Auflösung:</span>
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              className={`gridzoom-step ${resolution === r ? "active" : ""}`}
              onClick={() => {
                setResolution(r);
                setSlider("draw_predict_res", r);
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="secondary-button" onClick={clear}>
          Zeichnung löschen
        </button>
      </div>

      <canvas ref={nnRef} width={W} height={H} className="draw-predict-canvas" />
      <canvas ref={opRef} width={W} height={H} className="draw-predict-canvas" />

      <p className="draw-predict-note">
        Das Neuronale Netz wurde auf <code>{NN_TRAINED_RES}</code> Punkten
        trainiert. Bei einer anderen Anzeige-Auflösung interpoliert es, und
        je weiter weg, desto sichtbarer das Rauschen. Der Neuronale Operator
        arbeitet auf der ganzen Funktion und liefert eine saubere Ausgabe
        bei jeder Auflösung.
      </p>
    </div>
  );
}
