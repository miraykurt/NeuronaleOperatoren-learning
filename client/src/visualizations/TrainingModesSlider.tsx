import { useEffect, useMemo, useRef, useState } from "react";

const W = 460;
const H = 180;
const PAD = 14;
const N = 256;

// Wahrheit: Schockfront, exakt der harte Fall aus Kapitel 4 und 7.
function truth(): number[] {
  const arr = new Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    arr[i] = 0.5 - 0.42 * Math.tanh((x - 0.42) * 26);
  }
  return arr;
}

function dft(s: number[]): { re: number[]; im: number[] } {
  const n = s.length;
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    let sr = 0;
    let si = 0;
    for (let j = 0; j < n; j++) {
      const ang = (-2 * Math.PI * k * j) / n;
      sr += s[j] * Math.cos(ang);
      si += s[j] * Math.sin(ang);
    }
    re[k] = sr / n;
    im[k] = si / n;
  }
  return { re, im };
}

function recon(re: number[], im: number[], cutoff: number): number[] {
  const n = re.length;
  const out = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = re[0];
    for (let k = 1; k <= cutoff && k < n / 2; k++) {
      const ang = (2 * Math.PI * k * j) / n;
      s += 2 * (re[k] * Math.cos(ang) - im[k] * Math.sin(ang));
    }
    out[j] = s;
  }
  return out;
}

function rmse(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s / a.length);
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  t: number[],
  pred: number[],
) {
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();

  // Wahrheit gestrichelt
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  t.forEach((v, i) => {
    const px = PAD + (i / (t.length - 1)) * usable;
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
  pred.forEach((v, i) => {
    const px = PAD + (i / (pred.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

export function TrainingModesSlider() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [modes, setModes] = useState(4);

  const t = useMemo(() => truth(), []);
  const freq = useMemo(() => dft(t), [t]);
  const pred = useMemo(() => recon(freq.re, freq.im, modes), [freq, modes]);
  const err = useMemo(() => rmse(t, pred), [t, pred]);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawScene(ctx, t, pred);
  }, [t, pred]);

  let verdict: string;
  let verdictCls: string;
  if (modes <= 4) {
    verdict =
      "Wenige Moden: die Schockfront bleibt verwaschen. Egal wie viele Epochen du trainierst, der Fehler bleibt sitzen. Architektur-Grenze, nicht Trainings-Grenze.";
    verdictCls = "bad";
  } else if (modes <= 10) {
    verdict =
      "Front sitzt grob, Rest sauber. Solider Sweet-Spot für kleine FNOs.";
    verdictCls = "ok";
  } else {
    verdict =
      "Viele Moden, sehr feine Auflösung der Front. Mehr Parameter, mehr Trainingsbedarf, lohnt sich nur bei genug Daten.";
    verdictCls = "ok";
  }

  return (
    <div className="trainmodes">
      <canvas
        ref={ref}
        width={W}
        height={H}
        className="trainmodes-canvas"
      />
      <div className="trainmodes-controls">
        <label className="trainmodes-label">
          Behaltene Moden <code>{modes}</code>
        </label>
        <input
          type="range"
          min={1}
          max={32}
          step={1}
          value={modes}
          onChange={(e) => setModes(Number(e.target.value))}
          className="trainmodes-slider"
        />
        <span className="trainmodes-stat">
          RMSE: <code>{(err * 100).toFixed(2)} %</code>
        </span>
      </div>
      <div className={`trainmodes-verdict trainmodes-${verdictCls}`}>
        {verdict}
      </div>
    </div>
  );
}
