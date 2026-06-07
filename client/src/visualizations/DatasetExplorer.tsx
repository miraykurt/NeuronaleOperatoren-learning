import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";

type Family = "fluss" | "diffusion" | "welle" | "reaktion";
type Dimension = "1D" | "2D" | "3D";
type Size = "small" | "medium" | "large";

interface Dataset {
  id: string;
  name: string;
  family: Family;
  dimension: Dimension;
  size: Size;
  samples: number;
  notes: string;
  preview: "shock" | "diffusion" | "wave" | "vortex" | "pattern" | "darcy";
}

const FAMILY_LABEL: Record<Family, string> = {
  fluss: "Strömung",
  diffusion: "Diffusion",
  welle: "Welle",
  reaktion: "Reaktion",
};

const SIZE_LABEL: Record<Size, string> = {
  small: "Klein (< 5k)",
  medium: "Mittel (5–50k)",
  large: "Groß (> 50k)",
};

const SIZE_FILTER: Record<Size, [number, number]> = {
  small: [0, 5000],
  medium: [5000, 50000],
  large: [50000, Number.POSITIVE_INFINITY],
};

const DATASETS: Dataset[] = [
  {
    id: "burgers-1d",
    name: "Burgers 1D",
    family: "fluss",
    dimension: "1D",
    size: "large",
    samples: 80000,
    notes: "Nichtlineare Stoßwellen, Standard-Benchmark.",
    preview: "shock",
  },
  {
    id: "advection-1d",
    name: "Advection 1D",
    family: "fluss",
    dimension: "1D",
    size: "medium",
    samples: 10000,
    notes: "Reine Wellenausbreitung, gut zum Einstieg.",
    preview: "wave",
  },
  {
    id: "diffusion-1d",
    name: "Diffusion 1D",
    family: "diffusion",
    dimension: "1D",
    size: "small",
    samples: 3000,
    notes: "Wärmegleichung, glatte Verteilungen.",
    preview: "diffusion",
  },
  {
    id: "react-diff-1d",
    name: "Reaktion-Diffusion 1D",
    family: "reaktion",
    dimension: "1D",
    size: "medium",
    samples: 15000,
    notes: "Reaktive Spezies mit Diffusion gekoppelt.",
    preview: "diffusion",
  },
  {
    id: "shallow-1d",
    name: "Shallow Water 1D",
    family: "welle",
    dimension: "1D",
    size: "small",
    samples: 4000,
    notes: "Wasserwellen mit flachem Boden.",
    preview: "wave",
  },
  {
    id: "darcy-2d",
    name: "Darcy Flow 2D",
    family: "fluss",
    dimension: "2D",
    size: "medium",
    samples: 12000,
    notes: "Strömung im porösen Medium, heterogene Permeabilität.",
    preview: "darcy",
  },
  {
    id: "shallow-2d",
    name: "Shallow Water 2D",
    family: "welle",
    dimension: "2D",
    size: "large",
    samples: 60000,
    notes: "Radiale Wellen, Tsunami-typische Profile.",
    preview: "wave",
  },
  {
    id: "react-diff-2d",
    name: "Reaktion-Diffusion 2D",
    family: "reaktion",
    dimension: "2D",
    size: "medium",
    samples: 20000,
    notes: "Turing-Patterns, Spiralen, Punkte.",
    preview: "pattern",
  },
  {
    id: "ns-comp-2d",
    name: "Kompressible NS 2D",
    family: "fluss",
    dimension: "2D",
    size: "large",
    samples: 75000,
    notes: "Realistische Strömung, gekoppelte Felder.",
    preview: "vortex",
  },
  {
    id: "ns-incomp-2d",
    name: "Inkompressible NS 2D",
    family: "fluss",
    dimension: "2D",
    size: "large",
    samples: 90000,
    notes: "Wirbelfelder, Kármán-Straßen, Turbulenz.",
    preview: "vortex",
  },
  {
    id: "ns-comp-3d",
    name: "Kompressible NS 3D",
    family: "fluss",
    dimension: "3D",
    size: "large",
    samples: 55000,
    notes: "Voll 3D, der schwerste Datensatz.",
    preview: "vortex",
  },
];

function drawPreview(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: Dataset["preview"],
  phase: number,
) {
  ctx.clearRect(0, 0, size, size);
  if (kind === "shock") {
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const x = i / 79;
      const y = 0.5 + 0.4 * Math.tanh((x - 0.4 - phase * 0.3) * -16);
      const px = x * size;
      const py = size - 6 - y * (size - 12);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    return;
  }
  if (kind === "diffusion") {
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const width = 4 + phase * 10;
    for (let i = 0; i < 80; i++) {
      const x = i / 79;
      const y = Math.exp(-Math.pow((x - 0.5) * width, 2));
      const px = x * size;
      const py = size - 6 - y * (size - 12);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    return;
  }
  if (kind === "wave") {
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const x = i / 79;
      const y = 0.5 + 0.35 * Math.sin(x * Math.PI * 4 - phase * 4);
      const px = x * size;
      const py = size - 6 - y * (size - 12);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    return;
  }
  // 2D Heatmaps
  const n = 28;
  const cell = size / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      const y = j / (n - 1);
      let v: number;
      if (kind === "darcy") {
        v =
          0.5 +
          0.4 *
            Math.sin(x * 4 + phase * 2) *
            Math.cos(y * 4 + phase * 2.6);
      } else if (kind === "vortex") {
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        const r = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);
        v =
          0.5 +
          0.35 *
            Math.sin(a * 3 + r * 4 - phase * 2) *
            Math.exp(-r);
      } else {
        v =
          0.5 +
          0.45 *
            Math.tanh(
              3 *
                Math.sin(x * 8 + Math.cos(y * 6 + phase * 0.5) * 2) *
                Math.cos(y * 7 + phase * 0.8),
            );
      }
      const r = 30 + v * 200;
      const g = 80 + v * 100;
      const b = 200 - v * 120;
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

interface PreviewProps {
  kind: Dataset["preview"];
  size: number;
}

function Preview({ kind, size }: PreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let start = performance.now();
    const tick = (now: number) => {
      drawPreview(ctx, size, kind, ((now - start) / 1000) % 10);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kind, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="explorer-preview"
    />
  );
}

type FilterValue<T extends string> = T | "all";

export function DatasetExplorer() {
  const setSlider = useAppStore((s) => s.setSlider);
  const [family, setFamily] = useState<FilterValue<Family>>("all");
  const [dimension, setDimension] = useState<FilterValue<Dimension>>("all");
  const [size, setSize] = useState<FilterValue<Size>>("all");
  const [selectedId, setSelectedId] = useState<string>("darcy-2d");

  const filtered = useMemo(() => {
    return DATASETS.filter((d) => {
      if (family !== "all" && d.family !== family) return false;
      if (dimension !== "all" && d.dimension !== dimension) return false;
      if (size !== "all") {
        const [lo, hi] = SIZE_FILTER[size];
        if (d.samples < lo || d.samples >= hi) return false;
      }
      return true;
    });
  }, [family, dimension, size]);

  // Falls die aktuelle Auswahl rausgefiltert wurde, ersten Treffer wählen
  const effectiveId =
    filtered.find((d) => d.id === selectedId)?.id ?? filtered[0]?.id ?? "";
  const selected = DATASETS.find((d) => d.id === effectiveId);

  function chooseFamily(v: FilterValue<Family>) {
    setFamily(v);
    setSlider("explorer_family", v === "all" ? 0 : 1);
  }
  function chooseDim(v: FilterValue<Dimension>) {
    setDimension(v);
  }
  function chooseSize(v: FilterValue<Size>) {
    setSize(v);
  }

  return (
    <div className="explorer">
      <div className="explorer-filters">
        <div className="explorer-row">
          <div className="explorer-label">Physik</div>
          <div className="ctable-segments">
            <button
              className={`ctable-segment ${family === "all" ? "active" : ""}`}
              onClick={() => chooseFamily("all")}
            >
              Alle
            </button>
            {(Object.keys(FAMILY_LABEL) as Family[]).map((f) => (
              <button
                key={f}
                className={`ctable-segment ${family === f ? "active" : ""}`}
                onClick={() => chooseFamily(f)}
              >
                {FAMILY_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="explorer-row">
          <div className="explorer-label">Dimension</div>
          <div className="ctable-segments">
            <button
              className={`ctable-segment ${dimension === "all" ? "active" : ""}`}
              onClick={() => chooseDim("all")}
            >
              Alle
            </button>
            {(["1D", "2D", "3D"] as Dimension[]).map((d) => (
              <button
                key={d}
                className={`ctable-segment ${dimension === d ? "active" : ""}`}
                onClick={() => chooseDim(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="explorer-row">
          <div className="explorer-label">Probenzahl</div>
          <div className="ctable-segments">
            <button
              className={`ctable-segment ${size === "all" ? "active" : ""}`}
              onClick={() => chooseSize("all")}
            >
              Alle
            </button>
            {(Object.keys(SIZE_LABEL) as Size[]).map((s) => (
              <button
                key={s}
                className={`ctable-segment ${size === s ? "active" : ""}`}
                onClick={() => chooseSize(s)}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="explorer-summary">
        {filtered.length} {filtered.length === 1 ? "Datensatz" : "Datensätze"}{" "}
        passen.
      </div>

      <div className="explorer-body">
        <div className="explorer-list">
          {filtered.length === 0 ? (
            <div className="explorer-empty">
              Kein Datensatz passt zur Auswahl. Filter lockern.
            </div>
          ) : (
            filtered.map((d) => (
              <button
                key={d.id}
                className={`explorer-item ${d.id === effectiveId ? "active" : ""}`}
                onClick={() => setSelectedId(d.id)}
              >
                <div className="explorer-item-head">
                  <span className="explorer-item-name">{d.name}</span>
                  <span className="explorer-item-samples">
                    {d.samples.toLocaleString("de-DE")}
                  </span>
                </div>
                <div className="explorer-item-tags">
                  <span className="explorer-tag">{FAMILY_LABEL[d.family]}</span>
                  <span className="explorer-tag">{d.dimension}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="explorer-detail">
          {selected ? (
            <>
              <div className="explorer-detail-head">
                <div className="explorer-detail-name">{selected.name}</div>
                <div className="explorer-detail-meta">
                  {FAMILY_LABEL[selected.family]} · {selected.dimension} ·{" "}
                  {selected.samples.toLocaleString("de-DE")} Proben
                </div>
              </div>
              <Preview kind={selected.preview} size={200} />
              <div className="explorer-detail-notes">{selected.notes}</div>
            </>
          ) : (
            <div className="explorer-empty">
              Wähl einen Datensatz aus, um eine Vorschau zu sehen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
