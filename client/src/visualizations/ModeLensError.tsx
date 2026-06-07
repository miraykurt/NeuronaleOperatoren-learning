import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const W = 560;
const H = 220;
const PAD = 16;
const N = 256;

// Die Moden-Brille zeigt, was passiert, wenn der FNO nur die ersten k
// Fourier-Moden behält. Scharfe Strukturen, die hohe Frequenzen brauchen,
// können prinzipiell nicht abgebildet werden. Genau dort sitzt der Fehler.

// Wahrheitssignal: ein Burgers-typisches Schock-Profil mit sehr steiler
// Front plus eine kleine zweite scharfe Stufe.
function truthSignal(): number[] {
  const arr = new Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const front = 0.5 - 0.4 * Math.tanh((x - 0.35) * 28);
    const bump = 0.18 * Math.exp(-Math.pow((x - 0.75) * 22, 2));
    arr[i] = front + bump;
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

function reconstruct(
  re: number[],
  im: number[],
  cutoff: number,
): number[] {
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
  truth: number[],
  recon: number[],
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

  // Differenz als gefüllte Fläche zwischen den beiden Kurven
  ctx.beginPath();
  for (let i = 0; i < truth.length; i++) {
    const px = PAD + (i / (truth.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, truth[i]))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = recon.length - 1; i >= 0; i--) {
    const px = PAD + (i / (recon.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, recon[i]))) * h;
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(248, 113, 113, 0.18)";
  ctx.fill();

  // Wahrheit (gestrichelt grau)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  truth.forEach((v, i) => {
    const px = PAD + (i / (truth.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // FNO-Rekonstruktion (cyan)
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  recon.forEach((v, i) => {
    const px = PAD + (i / (recon.length - 1)) * usable;
    const py = PAD + (1 - Math.max(0, Math.min(1, v))) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Mini-Legende oben links
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("─ ─ Wahrheit (PDEBench)", PAD, PAD - 2);
  ctx.fillStyle = "#22d3ee";
  ctx.fillText("──── FNO mit k Moden", PAD + 180, PAD - 2);
  ctx.fillStyle = "rgba(248, 113, 113, 0.9)";
  ctx.fillText("Fehler-Fläche", PAD + 340, PAD - 2);
}

export function ModeLensError() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setSlider = useAppStore((s) => s.setSlider);
  const [cutoff, setCutoff] = useState(8);

  const truth = useMemo(() => truthSignal(), []);
  const freq = useMemo(() => dft(truth), [truth]);
  const recon = useMemo(
    () => reconstruct(freq.re, freq.im, cutoff),
    [freq, cutoff],
  );
  const error = useMemo(() => rmse(truth, recon), [truth, recon]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawScene(ctx, truth, recon);
  }, [truth, recon]);

  let diagnosis: string;
  let diagClass: string;
  if (cutoff <= 4) {
    diagnosis =
      "Viel zu wenige Moden. Die scharfe Schockfront und die kleine zweite Stufe sind nicht darstellbar. Großer Fehler genau dort.";
    diagClass = "bad";
  } else if (cutoff <= 10) {
    diagnosis =
      "Grundform sitzt, aber feine Details fehlen weiterhin. Die Schockkante wird abgerundet, die kleine zweite Struktur verschwindet noch.";
    diagClass = "warn";
  } else if (cutoff <= 24) {
    diagnosis =
      "Solider Bereich. Mit etwa 12 bis 24 Moden lassen sich die wichtigsten Strukturen sauber abbilden, der Restfehler ist klein.";
    diagClass = "ok";
  } else {
    diagnosis =
      "Viele Moden, beinahe perfekte Rekonstruktion. Mehr Moden bedeuten aber mehr Parameter und längere Trainingszeit. Trade-off entscheidet, wie weit man geht.";
    diagClass = "ok";
  }

  return (
    <div className="modelens">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="modelens-canvas"
      />

      <div className="modelens-controls">
        <label className="modelens-label">
          Behaltene Moden k <code>{cutoff}</code>
        </label>
        <input
          type="range"
          min={1}
          max={48}
          step={1}
          value={cutoff}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCutoff(v);
            setSlider("modelens_cutoff", v);
          }}
          className="modelens-slider"
        />
        <div className="modelens-stats">
          <span>
            RMSE: <code>{(error * 100).toFixed(2)} %</code>
          </span>
          <span className="modelens-stats-hint">
            Direkter Bezug zur Cutoff-Maske aus Kapitel 4.
          </span>
        </div>
      </div>

      <div className={`modelens-diagnosis modelens-${diagClass}`}>
        {diagnosis}
      </div>
    </div>
  );
}
