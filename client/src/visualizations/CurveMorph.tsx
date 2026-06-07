import { useEffect, useRef, useState } from "react";

const W = 540;
const H = 200;
const PAD = 16;

function gaussian(x: number): number {
  return Math.exp(-Math.pow((x - 0.5) * 6, 2));
}

function sawtooth(x: number): number {
  return Math.max(0, 1 - 2 * Math.abs(x - 0.5));
}

function sine(x: number): number {
  return 0.5 + 0.5 * Math.sin(x * Math.PI * 2);
}

function bump(x: number): number {
  const a = Math.exp(-Math.pow((x - 0.3) * 10, 2));
  const b = 0.7 * Math.exp(-Math.pow((x - 0.7) * 12, 2));
  return Math.min(1, a + b);
}

const SHAPES = [gaussian, sawtooth, sine, bump];

function interpolate(a: (x: number) => number, b: (x: number) => number, t: number) {
  return (x: number) => (1 - t) * a(x) + t * b(x);
}

function operatorSmooth(fn: (x: number) => number, samples: number[]): number[] {
  return samples.map((x) => {
    const win = 0.06;
    let sum = 0;
    let count = 0;
    for (let dx = -win; dx <= win; dx += win / 4) {
      const xx = Math.max(0, Math.min(1, x + dx));
      sum += fn(xx);
      count++;
    }
    return sum / count;
  });
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  samples: number[],
  values: number[],
  color: string,
  fill?: string,
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.beginPath();
  samples.forEach((x, i) => {
    const px = PAD + x * usable;
    const py = PAD + (1 - values[i]) * h;
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
    ctx.lineWidth = 2;
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

export function CurveMorph() {
  const inRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef<number>(performance.now());

  useEffect(() => {
    const inCtx = inRef.current?.getContext("2d");
    const outCtx = outRef.current?.getContext("2d");
    if (!inCtx || !outCtx) return;

    const samples = Array.from({ length: 200 }, (_, i) => i / 199);

    const draw = (now: number) => {
      const elapsed = (now - startedAt.current) / 1000;
      const phase = (elapsed / 3) % SHAPES.length;
      const idx = Math.floor(phase);
      const t = phase - idx;
      const fn = interpolate(SHAPES[idx], SHAPES[(idx + 1) % SHAPES.length], t);

      inCtx.clearRect(0, 0, W, H);
      drawAxis(inCtx, "Eingabe u(x)");
      drawCurve(
        inCtx,
        samples,
        samples.map(fn),
        "#22d3ee",
        "rgba(34, 211, 238, 0.12)",
      );

      const opValues = operatorSmooth(fn, samples);
      outCtx.clearRect(0, 0, W, H);
      drawAxis(outCtx, "Ausgabe G(u)(x): derselbe Operator, jede Eingabe");
      drawCurve(
        outCtx,
        samples,
        opValues,
        "#34d399",
        "rgba(52, 211, 153, 0.12)",
      );

      if (playing) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <div className="curve-morph">
      <canvas ref={inRef} width={W} height={H} className="curve-morph-canvas" />
      <canvas ref={outRef} width={W} height={H} className="curve-morph-canvas" />
      <div className="curve-morph-controls">
        <button
          className="secondary-button"
          onClick={() => {
            setPlaying((p) => !p);
            startedAt.current = performance.now();
          }}
        >
          {playing ? "Pause" : "Weiter"}
        </button>
        <span className="curve-morph-hint">
          Die Eingabe ändert ihre Form fortlaufend. Der Operator G ist
          derselbe. Er arbeitet auf der Funktion, nicht auf einem fixen
          Gitter.
        </span>
      </div>
    </div>
  );
}
