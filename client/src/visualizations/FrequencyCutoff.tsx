import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";

const W = 560;
const H = 200;
const PAD = 24;
const N = 256;

function buildSignal(seed: number): {
  clean: number[];
  noisy: number[];
} {
  const clean = new Array(N);
  const noisy = new Array(N);
  let rng = seed;
  const rand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const sig =
      0.5 +
      0.35 * Math.sin(2 * Math.PI * 2 * x) +
      0.2 * Math.sin(2 * Math.PI * 5 * x + 0.6);
    clean[i] = sig;
    noisy[i] = sig + (rand() - 0.5) * 0.45;
  }
  return { clean, noisy };
}

function dft(signal: number[]): { re: number[]; im: number[] } {
  const n = signal.length;
  const re = new Array(n).fill(0);
  const im = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    let sr = 0;
    let si = 0;
    for (let j = 0; j < n; j++) {
      const ang = (-2 * Math.PI * k * j) / n;
      sr += signal[j] * Math.cos(ang);
      si += signal[j] * Math.sin(ang);
    }
    re[k] = sr / n;
    im[k] = si / n;
  }
  return { re, im };
}

function idft(
  re: number[],
  im: number[],
  cutoff: number,
): number[] {
  const n = re.length;
  const out = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let k = 0; k <= cutoff; k++) {
      const ang = (2 * Math.PI * k * j) / n;
      const re1 = re[k] * Math.cos(ang) - im[k] * Math.sin(ang);
      s += re1 * (k === 0 ? 1 : 2);
    }
    out[j] = s;
  }
  return out;
}

function drawAxis(ctx: CanvasRenderingContext2D, label: string) {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD);
  ctx.lineTo(W - PAD, H - PAD);
  ctx.stroke();
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(label, PAD, PAD - 6);
}

function drawValues(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
  thick = 2,
  alpha = 1,
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
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = thick;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function FrequencyCutoff() {
  const ref = useRef<HTMLCanvasElement>(null);
  const setSlider = useAppStore((s) => s.setSlider);
  const [cutoff, setCutoff] = useState(8);

  const { clean, noisy, freq } = useMemo(() => {
    const { clean, noisy } = buildSignal(42);
    return { clean, noisy, freq: dft(noisy) };
  }, []);

  const filtered = useMemo(
    () => idft(freq.re, freq.im, cutoff),
    [freq, cutoff],
  );

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    drawAxis(ctx, `FNO-Maske: behält die ersten ${cutoff} Moden`);
    drawValues(ctx, noisy, "rgba(148, 163, 184, 0.6)", 1, 0.7);
    drawValues(ctx, clean, "rgba(52, 211, 153, 0.4)", 2);
    drawValues(ctx, filtered, "#22d3ee", 2.5);
  }, [cutoff, clean, noisy, filtered]);

  let diagnosis: string;
  if (cutoff <= 2) diagnosis = "zu wenige Moden, die Grundform fehlt";
  else if (cutoff <= 6) diagnosis = "zu glatt, Details gehen unter";
  else if (cutoff <= 12) diagnosis = "ungefähr richtig, sauberes Signal";
  else if (cutoff <= 24) diagnosis = "okay, schon etwas Rauschen drin";
  else diagnosis = "zu viele Moden, Rauschen kommt wieder durch";

  return (
    <div className="freq-cutoff">
      <canvas ref={ref} width={W} height={H} className="freq-canvas" />

      <div className="freq-controls">
        <label className="freq-label">
          Frequenz-Cutoff: <code>{cutoff}</code> Moden
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
            setSlider("fno_cutoff", v);
          }}
          className="freq-slider"
        />
      </div>

      <div className={`freq-diagnosis freq-${cutoff <= 6 ? "low" : cutoff <= 12 ? "good" : "high"}`}>
        {diagnosis}
      </div>

      <p className="freq-note">
        Grau = verrauschtes Signal, transparentes Grün = das ursprüngliche
        Signal ohne Rauschen, Cyan = was der FNO mit aktueller Cutoff-Maske
        rekonstruiert. Der Sweet-Spot liegt bei den ersten paar Moden:
        groß genug für die Form, klein genug fürs Rauschen zu unterdrücken.
      </p>
    </div>
  );
}
