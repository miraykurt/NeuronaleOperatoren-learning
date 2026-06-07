import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadBurgersDataset,
  nearestSample,
  type BurgersDataset,
} from "../data/burgersDataset";

interface Props {
  onAllCompleted: () => void;
  embedded?: boolean;
}

interface TaskState {
  done: boolean;
}

const W = 420;
const H = 130;
const PAD = 8;

function drawCurves(
  ctx: CanvasRenderingContext2D,
  series: Array<{ values: number[]; color: string; dashed?: boolean }>,
  yRange: [number, number] = [-1, 1],
) {
  ctx.clearRect(0, 0, W, H);
  const usable = W - PAD * 2;
  const h = H - PAD * 2;
  const [yLo, yHi] = yRange;
  const zeroY = PAD + ((yHi - 0) / (yHi - yLo)) * h;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, zeroY);
  ctx.lineTo(W - PAD, zeroY);
  ctx.stroke();

  for (const { values, color, dashed } of series) {
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const px = PAD + (i / (values.length - 1)) * usable;
      const py = PAD + ((yHi - v) / (yHi - yLo)) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function rangeOf(values: number[]): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo;
  return [lo - 0.1 * span, hi + 0.1 * span];
}

function rmse(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s / a.length);
}

// DFT für die Mode-Rekonstruktion in Task 2.
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

function reconstructModes(
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

// ---------- Task 1: nur ausführen und eine Vorhersage machen ----------

function Task1({
  data,
  onDone,
}: {
  data: BurgersDataset;
  onDone: () => void;
}) {
  const [executed, setExecuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default-Konfiguration aus dem Datensatz.
  const sample = useMemo(() => nearestSample(data, 0.05, 0.5), [data]);
  const truth = sample.solution;

  // Simulierte FNO-Vorhersage: Wahrheit plus kleines, deterministisches
  // Rauschen. Stellvertretend für eine echte Modell-Inferenz.
  const pred = useMemo(() => {
    const out = new Array(truth.length);
    for (let i = 0; i < truth.length; i++) {
      const phase = i * 0.4 + sample.visc * 19 + sample.T * 7;
      const noise = 0.02 * Math.sin(phase) * Math.cos(phase * 0.7);
      out[i] = truth[i] + noise;
    }
    return out;
  }, [truth, sample]);

  useEffect(() => {
    if (!executed) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const yRange = rangeOf([...truth, ...pred]);
    drawCurves(
      ctx,
      [
        { values: truth, color: "#34d399", dashed: true },
        { values: pred, color: "#22d3ee" },
      ],
      yRange,
    );
  }, [executed, truth, pred]);

  function run() {
    setExecuted(true);
    onDone();
  }

  const err = rmse(truth, pred);

  return (
    <>
      <pre className="nb-code">
        {`# Aufgabe 1: Modell laden und eine Vorhersage machen
model = FNO1d(modes=12, width=32)
model.load_state_dict(torch.load("fno_burgers.pt"))
sample = dataset.sample(visc=${sample.visc}, T=${sample.T})
pred = model(sample.ic)            # ein einziger Forward-Pass`}
      </pre>
      <div className="nb-controls">
        <button className="nb-run" onClick={run}>
          ▶ Ausführen
        </button>
        <span className="nb-controls-hint">
          Klick reicht. Keine Eingabe nötig, einfach laufen lassen.
        </span>
      </div>
      {executed && (
        <div className="nb-output">
          <div className="nb-output-head">Output</div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="nb-canvas"
          />
          <div className="nb-legend">
            <span>
              <span className="nb-legend-dash success" /> echte Lösung
            </span>
            <span>
              <span className="nb-legend-line" /> FNO-Vorhersage
            </span>
          </div>
          <div className="nb-text">
            Inferenz fertig. RMSE: <code>{(err * 100).toFixed(2)} %</code>.
            Das ist eine typische Vorhersage im Trainingsbereich, ein
            einziger Forward-Pass des Modells.
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Task 2: Hyperparameter ändern (Anzahl Moden) ----------

function Task2({
  data,
  onDone,
}: {
  data: BurgersDataset;
  onDone: () => void;
}) {
  const sample = useMemo(() => nearestSample(data, 0.01, 0.5), [data]);
  const truth = sample.solution;
  const freq = useMemo(() => dft(truth), [truth]);

  const [modes, setModes] = useState(12);
  const [observation, setObservation] = useState("");
  const [executed, setExecuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pred = useMemo(
    () => reconstructModes(freq.re, freq.im, modes),
    [freq, modes],
  );

  useEffect(() => {
    if (!executed) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const yRange = rangeOf([...truth, ...pred]);
    drawCurves(
      ctx,
      [
        { values: truth, color: "#34d399", dashed: true },
        { values: pred, color: "#22d3ee" },
      ],
      yRange,
    );
  }, [executed, truth, pred]);

  function run() {
    setExecuted(true);
  }

  const err = rmse(truth, pred);
  const enoughObservation = observation.trim().length >= 30;

  return (
    <>
      <pre className="nb-code">
        {`# Aufgabe 2: Anzahl Moden variieren, Wirkung beobachten
# 👉 Hier darfst du die Zahl ändern
modes = ${modes}

model = FNO1d(modes=modes, width=32)
pred = model(sample.ic)
print("RMSE:", rmse(pred, sample.solution))`}
      </pre>
      <div className="nb-controls">
        <label className="nb-edit-label">
          modes = <code className="nb-editable">{modes}</code>
        </label>
        <input
          type="range"
          min={2}
          max={32}
          step={1}
          value={modes}
          onChange={(e) => {
            setModes(Number(e.target.value));
            setExecuted(false);
          }}
          className="nb-slider"
        />
        <button className="nb-run" onClick={run}>
          ▶ Ausführen
        </button>
      </div>
      {executed && (
        <div className="nb-output">
          <div className="nb-output-head">Output</div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="nb-canvas"
          />
          <div className="nb-text">
            RMSE mit <code>modes = {modes}</code>:{" "}
            <code>{(err * 100).toFixed(2)} %</code>.{" "}
            {modes <= 6
              ? "Wenige Moden, scharfe Strukturen fehlen, der Fehler ist hoch."
              : modes <= 16
                ? "Solider Bereich, viele Strukturen sitzen, Restfehler klein."
                : "Viele Moden, beinahe perfekte Rekonstruktion. Mehr Parameter sind aber teurer."}
          </div>
          <div className="nb-text">
            Probier mehrere Werte, dann notiere kurz, was du beobachtest:
          </div>
          <textarea
            className="nb-notes"
            rows={3}
            placeholder="Mindestens ein, zwei Sätze. Wann wird's gut, wann nicht?"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
          <button
            className="nb-submit"
            onClick={onDone}
            disabled={!enoughObservation}
          >
            Beobachtung speichern
          </button>
        </div>
      )}
    </>
  );
}

// ---------- Task 3: eigene Anfangs-/Randbedingung testen ----------

function Task3({
  onDone,
}: {
  data: BurgersDataset;
  onDone: () => void;
}) {
  const [amp, setAmp] = useState(0.5);
  const [phase, setPhase] = useState(0);
  const [shape, setShape] = useState<"sinus" | "gauss" | "schock">("sinus");
  const [visc, setVisc] = useState(0.05);
  const [executed, setExecuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const N = 128;

  // Eigene Anfangsbedingung, parametrisiert.
  const customIC = useMemo(() => {
    const arr = new Array(N);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      if (shape === "sinus") {
        arr[i] = amp * Math.sin(2 * Math.PI * x + phase);
      } else if (shape === "gauss") {
        arr[i] = amp * Math.exp(-Math.pow((x - 0.5 + phase / 6.28) * 6, 2));
      } else {
        arr[i] =
          amp * Math.tanh((x - 0.5 + phase / 6.28) * 12) * 0.6;
      }
    }
    return arr;
  }, [amp, phase, shape]);

  // Simulierte FNO-Lösung. Burgers-typisch: glättet die IC, verschiebt
  // sie leicht, Diffusion proportional zur Viskosität.
  const customSolution = useMemo(() => {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      // einfache "Lösung": IC durch einen Mittelwert-Filter, abhängig
      // von der Viskosität, plus kleine Verschiebung
      const win = Math.max(2, Math.floor(N * (visc * 8 + 0.02)));
      let s = 0;
      let count = 0;
      for (let k = -win; k <= win; k++) {
        const j = (i + k + N) % N;
        s += customIC[j];
        count++;
      }
      const meanShifted = s / count;
      // leichte Drift nach rechts
      const shifted = Math.floor(x * N - 4);
      const src = (shifted + N) % N;
      out[i] = 0.65 * meanShifted + 0.35 * customIC[src];
    }
    return out;
  }, [customIC, visc]);

  useEffect(() => {
    if (!executed) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const yRange = rangeOf([...customIC, ...customSolution]);
    drawCurves(
      ctx,
      [
        { values: customIC, color: "#22d3ee", dashed: true },
        { values: customSolution, color: "#34d399" },
      ],
      yRange,
    );
  }, [executed, customIC, customSolution]);

  function run() {
    setExecuted(true);
    onDone();
  }

  return (
    <>
      <pre className="nb-code">
        {`# Aufgabe 3: eigene Anfangsbedingung definieren und vorhersagen
# 👉 Hier darfst du Form und Parameter ändern
shape = "${shape}"
amp   = ${amp.toFixed(2)}
phase = ${phase.toFixed(2)}
visc  = ${visc.toFixed(3)}

ic   = make_ic(shape, amp, phase)
pred = model(ic, visc=visc)        # FNO sagt die Lösung voraus`}
      </pre>
      <div className="nb-controls nb-controls-grid">
        <label>
          shape
          <select
            value={shape}
            onChange={(e) => {
              setShape(e.target.value as typeof shape);
              setExecuted(false);
            }}
          >
            <option value="sinus">sinus</option>
            <option value="gauss">gauss</option>
            <option value="schock">schock</option>
          </select>
        </label>
        <label>
          amp <code>{amp.toFixed(2)}</code>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={amp}
            onChange={(e) => {
              setAmp(Number(e.target.value));
              setExecuted(false);
            }}
          />
        </label>
        <label>
          phase <code>{phase.toFixed(2)}</code>
          <input
            type="range"
            min={0}
            max={6.28}
            step={0.05}
            value={phase}
            onChange={(e) => {
              setPhase(Number(e.target.value));
              setExecuted(false);
            }}
          />
        </label>
        <label>
          visc <code>{visc.toFixed(3)}</code>
          <input
            type="range"
            min={0.005}
            max={0.2}
            step={0.005}
            value={visc}
            onChange={(e) => {
              setVisc(Number(e.target.value));
              setExecuted(false);
            }}
          />
        </label>
        <button className="nb-run" onClick={run}>
          ▶ Ausführen
        </button>
      </div>
      {executed && (
        <div className="nb-output">
          <div className="nb-output-head">Output</div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="nb-canvas"
          />
          <div className="nb-legend">
            <span>
              <span className="nb-legend-dash" /> deine IC
            </span>
            <span>
              <span className="nb-legend-line success" /> FNO-Lösung
            </span>
          </div>
          <div className="nb-text">
            Beobachte: die FNO-Vorhersage glättet scharfe Übergänge mit
            steigender Viskosität, schockartige Strukturen verschwinden
            schneller. Damit hast du eine eigene Konfiguration durch das
            Modell geschickt.
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Komponenten-Wrapper ----------

export function DemoNotebook({ onAllCompleted, embedded }: Props) {
  const [data, setData] = useState<BurgersDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Record<number, TaskState>>({
    1: { done: false },
    2: { done: false },
    3: { done: false },
  });

  useEffect(() => {
    loadBurgersDataset()
      .then(setData)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Unbekannter Fehler"),
      );
  }, []);

  function markDone(n: number) {
    setTasks((t) => {
      if (t[n].done) return t;
      const next = { ...t, [n]: { done: true } };
      if (Object.values(next).every((x) => x.done)) {
        onAllCompleted();
      }
      return next;
    });
  }

  if (loadError) {
    return (
      <div className="nb-error">
        Datensatz konnte nicht geladen werden: {loadError}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="nb-loading">
        Lade <code>burgers-small.json</code> …
      </div>
    );
  }

  const doneCount = Object.values(tasks).filter((t) => t.done).length;

  return (
    <div className={`demo-nb ${embedded ? "embedded" : ""}`}>
      <div className="demo-nb-head">
        <div className="demo-nb-title">FNO-Burgers · Demo-Notebook</div>
        <div className="demo-nb-info">
          Kernel: Python 3 (simuliert) · Daten: {data.count} Burgers-Samples
        </div>
        <div className="demo-nb-progress">
          {doneCount} / 3 Aufgaben abgeschlossen
        </div>
      </div>

      <section className={`demo-nb-task ${tasks[1].done ? "done" : ""}`}>
        <div className="demo-nb-task-head">
          <span className="demo-nb-task-num">1</span>
          <span className="demo-nb-task-title">
            Ausführen und eine Vorhersage machen
          </span>
          <span className="demo-nb-task-difficulty easy">leicht</span>
        </div>
        <pre className="nb-md">
          {`## Aufgabe 1
Lade das vortrainierte FNO-Modell und mach eine Vorhersage
zu einer Standard-Konfiguration. Nichts zu editieren,
einfach den Ausführen-Knopf drücken.`}
        </pre>
        <Task1 data={data} onDone={() => markDone(1)} />
      </section>

      <section className={`demo-nb-task ${tasks[2].done ? "done" : ""}`}>
        <div className="demo-nb-task-head">
          <span className="demo-nb-task-num">2</span>
          <span className="demo-nb-task-title">
            Anzahl Moden ändern, Wirkung beobachten
          </span>
          <span className="demo-nb-task-difficulty medium">mittel</span>
        </div>
        <pre className="nb-md">
          {`## Aufgabe 2
Verändere die Anzahl behaltener Moden und schau, wie sich der
Fehler bewegt. Wenige Moden, glatte Vorhersage. Viele Moden,
feine Strukturen kommen wieder. Probier mindestens drei Werte.`}
        </pre>
        <Task2 data={data} onDone={() => markDone(2)} />
      </section>

      <section className={`demo-nb-task ${tasks[3].done ? "done" : ""}`}>
        <div className="demo-nb-task-head">
          <span className="demo-nb-task-num">3</span>
          <span className="demo-nb-task-title">
            Eigene Anfangs-/Randbedingung testen
          </span>
          <span className="demo-nb-task-difficulty hard">schwer</span>
        </div>
        <pre className="nb-md">
          {`## Aufgabe 3
Definiere eine eigene Anfangsbedingung (Form, Amplitude,
Phase) und lass den FNO die Lösung vorhersagen. Das ist
der Schritt, den du in einer echten Engineering-Anfrage
machen würdest.`}
        </pre>
        <Task3 data={data} onDone={() => markDone(3)} />
      </section>

      {doneCount === 3 && (
        <div className="demo-nb-finale">
          <div className="demo-nb-finale-head">
            Alle Aufgaben abgeschlossen
          </div>
          <div className="demo-nb-finale-body">
            Du hast den vollen Pfad durchlaufen: Inferenz, Hyperparameter,
            eigene Konfiguration. Das Notebook ist jetzt bereit für deine
            eigenen Experimente. Im echten Setup würdest du jetzt den
            Container herunterladen und denselben Code lokal weiterlaufen
            lassen.
          </div>
        </div>
      )}
    </div>
  );
}
