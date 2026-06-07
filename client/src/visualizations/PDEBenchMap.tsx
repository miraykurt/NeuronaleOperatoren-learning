import { useEffect, useRef, useState } from "react";

interface PDEDef {
  id: string;
  name: string;
  family: "fluss" | "diffusion" | "welle" | "reaktion";
  dimension: "1D" | "2D" | "3D";
  short: string;
  details: string;
  drawSample: (ctx: CanvasRenderingContext2D, size: number, t: number) => void;
}

const PDES: PDEDef[] = [
  {
    id: "advection-1d",
    name: "Advection",
    family: "fluss",
    dimension: "1D",
    short: "Reine Wellenausbreitung mit konstanter Geschwindigkeit.",
    details:
      "Die einfachste PDE: ein Profil wird mit fester Geschwindigkeit verschoben, ohne sich zu verändern. Gute Sandbox für jedes neue Operator-Modell.",
    drawSample: drawShifted,
  },
  {
    id: "burgers-1d",
    name: "Burgers 1D",
    family: "fluss",
    dimension: "1D",
    short: "Nichtlineare Stoßwellen, klassisches PDE-Benchmark.",
    details:
      "Burgers' Gleichung mischt Advektion und Diffusion. Aus glatten Profilen entstehen scharfe Schock-Kanten, die jeden Solver fordern.",
    drawSample: drawShock,
  },
  {
    id: "diffusion-1d",
    name: "Diffusion 1D",
    family: "diffusion",
    dimension: "1D",
    short: "Wärmeleitung, Konzentrations-Diffusion.",
    details:
      "Die Wärmegleichung glättet Profile mit der Zeit. Gradient-Spitzen werden niedriger, das System strebt einen Gleichgewichtszustand an.",
    drawSample: drawDiffused,
  },
  {
    id: "reaction-diffusion-1d",
    name: "Reaktion-Diffusion 1D",
    family: "reaktion",
    dimension: "1D",
    short: "Reaktive Spezies, die gleichzeitig diffundiert.",
    details:
      "Klassiker der mathematischen Biologie. Reaktionsterm erzeugt Strukturen, Diffusion verteilt sie.",
    drawSample: drawDiffused,
  },
  {
    id: "shallow-1d",
    name: "Shallow Water 1D",
    family: "welle",
    dimension: "1D",
    short: "Wasserwellen mit flachem Boden.",
    details:
      "Beschreibt Tsunamis, Dammbrüche, Flusswellen. Schock-ähnliche Fronten möglich, je nach Anfangsprofil.",
    drawSample: drawWave,
  },
  {
    id: "compressible-ns-1d",
    name: "Kompressible NS 1D",
    family: "fluss",
    dimension: "1D",
    short: "Eindimensionale kompressible Navier-Stokes-Gleichung.",
    details:
      "Modelliert Schockwellen in Gasen. Kombination aus Dichte-, Geschwindigkeits- und Druckfeld.",
    drawSample: drawShock,
  },
  {
    id: "darcy-2d",
    name: "Darcy Flow 2D",
    family: "fluss",
    dimension: "2D",
    short: "Strömung in porösem Medium, z. B. Grundwasser.",
    details:
      "Heterogene Permeabilität gibt Hotspots in der Flussgeschwindigkeit. Beliebter Testfall für FNO, weil Eingabe und Ausgabe beide ganze Felder sind.",
    drawSample: drawHeatmap,
  },
  {
    id: "shallow-2d",
    name: "Shallow Water 2D",
    family: "welle",
    dimension: "2D",
    short: "Tsunami- und Sturmflut-Simulation.",
    details:
      "Wasserhöhe + Strömungskomponenten. Radial ausbreitende Wellen sind ein klassischer Initial-Condition-Setup.",
    drawSample: drawRadialWave,
  },
  {
    id: "reaction-diffusion-2d",
    name: "Reaktion-Diffusion 2D",
    family: "reaktion",
    dimension: "2D",
    short: "Musterbildung wie Turing-Patterns oder Belousov-Zhabotinsky.",
    details:
      "Spannender Sandbox-Datensatz: das Modell muss lernen, wie aus Rauschen Streifen, Spiralen oder Punkte werden.",
    drawSample: drawPattern,
  },
  {
    id: "compressible-ns-2d",
    name: "Kompressible NS 2D",
    family: "fluss",
    dimension: "2D",
    short: "Strömung um Hindernisse, Schock-Wechselwirkungen.",
    details:
      "Realitätsnahester Datensatz im 2D-Bereich. Anspruchsvoll für Operator-Modelle, weil viele physikalische Größen gekoppelt sind.",
    drawSample: drawHeatmap,
  },
  {
    id: "incompressible-ns-2d",
    name: "Inkompressible NS 2D",
    family: "fluss",
    dimension: "2D",
    short: "Wirbel und Geschwindigkeitsfelder ohne Dichteänderung.",
    details:
      "Kármán-Wirbelstraßen und Turbulenz. Die Inkompressibilitäts-Bedingung ist hart zu erfüllen, ohne sie zu erzwingen.",
    drawSample: drawVortex,
  },
  {
    id: "compressible-ns-3d",
    name: "Kompressible NS 3D",
    family: "fluss",
    dimension: "3D",
    short: "Voll-3D-Strömung, der schwerste Datensatz.",
    details:
      "Hier zahlt sich der Operator-Ansatz am deutlichsten aus: klassische Solver brauchen für 3D-Strömungen Stunden bis Tage pro Konfiguration.",
    drawSample: drawHeatmap,
  },
];

const FAMILY_LABEL: Record<PDEDef["family"], string> = {
  fluss: "Strömung",
  diffusion: "Diffusion",
  welle: "Welle",
  reaktion: "Reaktion",
};

const FAMILY_COLOR: Record<PDEDef["family"], string> = {
  fluss: "#22d3ee",
  diffusion: "#34d399",
  welle: "#a78bfa",
  reaktion: "#fb7185",
};

// ---------- Mini-Skizzen für die Karten und das Detail-Panel ----------

function drawShifted(ctx: CanvasRenderingContext2D, size: number, t: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const shift = (t * 0.0005) % 1;
  for (let i = 0; i < 50; i++) {
    const x = i / 49;
    const xx = (x + shift) % 1;
    const peak = Math.exp(-Math.pow((xx - 0.5) * 6, 2));
    const px = x * size;
    const py = size - 8 - peak * (size - 16);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawShock(ctx: CanvasRenderingContext2D, size: number, t: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const phase = (t * 0.0003) % 1;
  for (let i = 0; i < 60; i++) {
    const x = i / 59;
    const sharpness = 12 + phase * 12;
    const y = 0.5 + 0.4 * Math.tanh((x - 0.4 - phase * 0.4) * -sharpness);
    const px = x * size;
    const py = size - 8 - y * (size - 16);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawDiffused(ctx: CanvasRenderingContext2D, size: number, t: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const width = 4 + (t * 0.0008) % 10;
  for (let i = 0; i < 60; i++) {
    const x = i / 59;
    const y = Math.exp(-Math.pow((x - 0.5) * width, 2));
    const px = x * size;
    const py = size - 8 - y * (size - 16);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawWave(ctx: CanvasRenderingContext2D, size: number, t: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#a78bfa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 60; i++) {
    const x = i / 59;
    const y = 0.5 + 0.35 * Math.sin(x * Math.PI * 4 - t * 0.002);
    const px = x * size;
    const py = size - 8 - y * (size - 16);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawHeatmap(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const n = 18;
  const cell = size / n;
  const phase = t * 0.0005;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      const y = j / (n - 1);
      const v =
        0.5 +
        0.4 *
          Math.sin(x * 4 + phase) *
          Math.cos(y * 4 + phase * 1.3);
      const r = 30 + v * 200;
      const g = 80 + v * 100;
      const b = 200 - v * 120;
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function drawRadialWave(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const n = 18;
  const cell = size / n;
  const phase = t * 0.002;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1) - 0.5) * 2;
      const y = (j / (n - 1) - 0.5) * 2;
      const r = Math.sqrt(x * x + y * y);
      const v = 0.5 + 0.35 * Math.cos(r * 8 - phase) * Math.exp(-r * 1.5);
      const rr = 30 + v * 180;
      const g = 80 + v * 90;
      const b = 220 - v * 80;
      ctx.fillStyle = `rgb(${rr | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function drawPattern(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const n = 18;
  const cell = size / n;
  const phase = t * 0.0003;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      const y = j / (n - 1);
      const v =
        0.5 +
        0.45 *
          Math.tanh(
            3 * Math.sin(x * 8 + Math.cos(y * 6 + phase) * 2) *
              Math.cos(y * 7 + phase),
          );
      const r = 240 - v * 90;
      const g = 120 - v * 30;
      const b = 60 + v * 100;
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

function drawVortex(ctx: CanvasRenderingContext2D, size: number, t: number) {
  const n = 18;
  const cell = size / n;
  const phase = t * 0.001;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1) - 0.5) * 2;
      const y = (j / (n - 1) - 0.5) * 2;
      const ang = Math.atan2(y, x);
      const r = Math.sqrt(x * x + y * y);
      const v = 0.5 + 0.35 * Math.sin(ang * 3 + r * 4 - phase) * Math.exp(-r);
      const rr = 30 + v * 180;
      const g = 100 + v * 90;
      const b = 200 - v * 90;
      ctx.fillStyle = `rgb(${rr | 0}, ${g | 0}, ${b | 0})`;
      ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

// ---------- Komponenten ----------

interface MiniProps {
  pde: PDEDef;
  size: number;
}

function MiniCanvas({ pde, size }: MiniProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      pde.drawSample(ctx, size, now - last);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pde, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="pdebench-mini"
    />
  );
}

const DIMENSION_GROUPS: { dims: PDEDef["dimension"][]; label: string }[] = [
  { dims: ["1D"], label: "1 Dimension" },
  { dims: ["2D", "3D"], label: "2 und 3 Dimensionen" },
];

const FAMILY_ORDER: Record<PDEDef["family"], number> = {
  fluss: 0,
  diffusion: 1,
  welle: 2,
  reaktion: 3,
};

const DIMENSION_ORDER: Record<PDEDef["dimension"], number> = {
  "1D": 0,
  "2D": 1,
  "3D": 2,
};

export function PDEBenchMap() {
  const [activeId, setActiveId] = useState<string>("burgers-1d");
  const active = PDES.find((p) => p.id === activeId) ?? PDES[0];

  return (
    <div className="pdebench">
      <div className="pdebench-groups">
        {DIMENSION_GROUPS.map((group) => {
          const pdesInGroup = PDES.filter((p) =>
            group.dims.includes(p.dimension),
          ).sort((a, b) => {
            const famDiff = FAMILY_ORDER[a.family] - FAMILY_ORDER[b.family];
            if (famDiff !== 0) return famDiff;
            return DIMENSION_ORDER[a.dimension] - DIMENSION_ORDER[b.dimension];
          });
          if (pdesInGroup.length === 0) return null;
          const groupKey = group.dims.join("-");
          return (
            <div key={groupKey} className="pdebench-group">
              <div className="pdebench-group-head">
                <span className="pdebench-group-title">{group.label}</span>
                <span className="pdebench-group-count">
                  {pdesInGroup.length}{" "}
                  {pdesInGroup.length === 1 ? "Datensatz" : "Datensätze"}
                </span>
              </div>
              <div className="pdebench-grid">
                {pdesInGroup.map((p) => {
                  const isActive = p.id === activeId;
                  return (
                    <button
                      key={p.id}
                      className={`pdebench-card ${isActive ? "active" : ""}`}
                      style={{
                        borderColor: isActive
                          ? FAMILY_COLOR[p.family]
                          : undefined,
                      }}
                      onClick={() => setActiveId(p.id)}
                    >
                      <div className="pdebench-card-thumb">
                        <MiniCanvas pde={p} size={40} />
                      </div>
                      <div className="pdebench-card-text">
                        <div className="pdebench-card-name">{p.name}</div>
                        <div className="pdebench-card-tags">
                          <span
                            className="pdebench-tag pdebench-tag-family"
                            style={{
                              color: FAMILY_COLOR[p.family],
                              borderColor: FAMILY_COLOR[p.family],
                            }}
                          >
                            {FAMILY_LABEL[p.family]}
                          </span>
                          {group.dims.length > 1 && (
                            <span className="pdebench-tag">{p.dimension}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="pdebench-detail"
        style={{ borderLeftColor: FAMILY_COLOR[active.family] }}
      >
        <div className="pdebench-detail-head">
          <div>
            <div className="pdebench-detail-name">{active.name}</div>
            <div className="pdebench-detail-meta">
              {FAMILY_LABEL[active.family]} · {active.dimension}
            </div>
          </div>
          <div className="pdebench-detail-thumb">
            <MiniCanvas pde={active} size={120} />
          </div>
        </div>
        <div className="pdebench-detail-short">{active.short}</div>
        <div className="pdebench-detail-body">{active.details}</div>
      </div>
    </div>
  );
}
