import { useEffect, useRef } from "react";

const SIZE = 160;
const N = 48;

type ErrorModel = "fno" | "cnn" | "mlp";

interface ModelDef {
  id: ErrorModel;
  name: string;
  description: string;
  meanError: string;
  worst: string;
  notes: string;
}

const MODELS: ModelDef[] = [
  {
    id: "fno",
    name: "FNO",
    description: "Globale Frequenz-Operationen, gitterunabhängig.",
    meanError: "≈ 0.011",
    worst: "Hohe Frequenzen abgeschnitten",
    notes:
      "Niedriger Fehler verteilt, keine Hotspots. Versagt nur, wenn die Lösung scharfe Kanten hat. Die hohen Frequenzen fehlen dann nach dem Cutoff.",
  },
  {
    id: "cnn",
    name: "CNN",
    description: "Lokale Faltungen, fester Receptive Field.",
    meanError: "≈ 0.043",
    worst: "Lange Reichweite & Auflösungswechsel",
    notes:
      "Sieht nur die direkte Nachbarschaft. Sobald eine Lösung weiträumige Effekte hat, fehlt der Überblick. Bei anderer Gitterauflösung muss neu trainiert werden.",
  },
  {
    id: "mlp",
    name: "MLP",
    description: "Vollvernetzt, Gitter → Gitter als Vektor.",
    meanError: "≈ 0.087",
    worst: "Jede neue Auflösung = neues Modell",
    notes:
      "Hat zwar globale Sicht, aber jeder Gitterpunkt wird einzeln gelernt. Das skaliert nicht und bricht bei jeder Auflösungsänderung zusammen.",
  },
];

function errorField(model: ErrorModel, i: number, j: number): number {
  const x = i / N;
  const y = j / N;
  switch (model) {
    case "fno": {
      const edge = Math.exp(-Math.pow((x - 0.5) * 9, 2)) * 0.3;
      const noise = 0.04 + 0.03 * Math.sin(i * 0.5) * Math.cos(j * 0.4);
      return Math.max(0, Math.min(1, edge + noise));
    }
    case "cnn": {
      const center = Math.exp(-(Math.pow(x - 0.3, 2) + Math.pow(y - 0.7, 2)) * 4);
      const other = Math.exp(-(Math.pow(x - 0.8, 2) + Math.pow(y - 0.3, 2)) * 5);
      const noise = 0.1 + 0.05 * Math.sin(i * 0.7 + j * 0.3);
      return Math.max(0, Math.min(1, center * 0.6 + other * 0.55 + noise));
    }
    case "mlp": {
      const a = Math.exp(-(Math.pow(x - 0.4, 2) + Math.pow(y - 0.4, 2)) * 3);
      const b = Math.exp(-(Math.pow(x - 0.7, 2) + Math.pow(y - 0.8, 2)) * 4);
      const stripe = 0.5 + 0.5 * Math.sin(i * 0.4 + j * 0.6);
      return Math.max(0, Math.min(1, a * 0.9 + b * 0.7 + 0.2 * stripe));
    }
  }
}

function colorFor(v: number): string {
  if (v < 0.15) return `rgb(${20 + v * 200}, ${60 + v * 400}, ${120 + v * 200})`;
  if (v < 0.4) return `rgb(${50 + v * 300}, ${180 + (1 - v) * 80}, ${100})`;
  if (v < 0.7) return `rgb(${200 + v * 80}, ${180 - v * 100}, ${60})`;
  return `rgb(${240}, ${100 - v * 50}, ${60 + v * 30})`;
}

function ModelCard({ model }: { model: ModelDef }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const cell = SIZE / N;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const v = errorField(model.id, i, j);
        ctx.fillStyle = colorFor(v);
        ctx.fillRect(i * cell, j * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }, [model.id]);

  return (
    <div className="threemodels-card">
      <div className="threemodels-head">
        <div className="threemodels-name">{model.name}</div>
        <div className="threemodels-desc">{model.description}</div>
      </div>
      <canvas
        ref={ref}
        width={SIZE}
        height={SIZE}
        className="threemodels-heatmap"
      />
      <div className="threemodels-stats">
        <div>
          <span className="threemodels-stat-label">Ø Fehler:</span>{" "}
          <code>{model.meanError}</code>
        </div>
        <div className="threemodels-worst">{model.worst}</div>
      </div>
      <div className="threemodels-notes">{model.notes}</div>
    </div>
  );
}

export function ThreeModels() {
  return (
    <div className="threemodels">
      <div className="threemodels-grid">
        {MODELS.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>
      <div className="threemodels-legend">
        <span className="threemodels-legend-label">Fehler-Heatmap:</span>
        <div className="threemodels-legend-bar" />
        <div className="threemodels-legend-ends">
          <span>klein</span>
          <span>groß</span>
        </div>
      </div>
    </div>
  );
}
