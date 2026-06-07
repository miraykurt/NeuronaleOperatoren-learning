import { useState } from "react";

type Dim = 1 | 2 | 3;

interface FinenessLevel {
  id: string;
  label: string;
  n: number;
}

const FINENESS: FinenessLevel[] = [
  { id: "grob", label: "Grob", n: 32 },
  { id: "mittel", label: "Mittel", n: 128 },
  { id: "fein", label: "Fein", n: 512 },
  { id: "sehrfein", label: "Sehr fein", n: 2048 },
  { id: "ultra", label: "Ultrafein", n: 8192 },
];

const BASE_MS = { 1: 0.05, 2: 50, 3: 2000 } as const;
const BASE_N = 32;

function computeMs(dim: Dim, n: number): number {
  const factor = Math.pow(n / BASE_N, dim);
  return BASE_MS[dim] * factor;
}

function formatTime(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)} s`;
  const min = s / 60;
  if (min < 60) return `${min.toFixed(1)} min`;
  const h = min / 60;
  if (h < 24) return `${h.toFixed(1)} h`;
  const d = h / 24;
  if (d < 30) return `${d.toFixed(1)} Tage`;
  const month = d / 30;
  if (month < 12) return `${month.toFixed(1)} Monate`;
  const y = d / 365;
  return `${y.toFixed(1)} Jahre`;
}

function alltagsvergleich(ms: number): string {
  const s = ms / 1000;
  if (s < 0.01) return "ein Wimpernschlag";
  if (s < 0.2) return "ein Tastendruck";
  if (s < 2) return "ein kurzer Augenblick";
  if (s < 15) return "ein Tee aufgegossen";
  if (s < 90) return "schnell aufs Klo";
  if (s < 600) return "ein Kaffee gekocht";
  if (s < 3600) return "ein Spielfilm gestartet";
  if (s < 6 * 3600) return "ein Arbeitstag halb rum";
  if (s < 86400) return "eine Nacht durchgeschlafen";
  if (s < 7 * 86400) return "ein langes Wochenende";
  if (s < 30 * 86400) return "ein Urlaub";
  if (s < 180 * 86400) return "ein Semester";
  if (s < 365 * 86400) return "ein Studium durchgezogen";
  return "länger als ein ganzes Studienjahr";
}

function severity(ms: number): "ok" | "warn" | "bad" | "doom" {
  if (ms < 1000) return "ok";
  if (ms < 60_000) return "warn";
  if (ms < 3600_000) return "bad";
  return "doom";
}

export function ComplexityTable() {
  const [dim, setDim] = useState<Dim>(2);
  const [selected, setSelected] = useState<string>("mittel");

  const totalCells = (n: number) => Math.pow(n, dim);

  return (
    <div className="ctable">
      <div className="ctable-controls">
        <div className="ctable-control-group">
          <div className="ctable-control-label">Dimension</div>
          <div className="ctable-segments">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                className={`ctable-segment ${dim === d ? "active" : ""}`}
                onClick={() => setDim(d as Dim)}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
        <div className="ctable-control-group">
          <div className="ctable-control-label">Feinheit</div>
          <div className="ctable-segments">
            {FINENESS.map((f) => (
              <button
                key={f.id}
                className={`ctable-segment ${selected === f.id ? "active" : ""}`}
                onClick={() => setSelected(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <table className="ctable-table">
        <thead>
          <tr>
            <th>Stufe</th>
            <th>N pro Achse</th>
            <th>Zellen gesamt</th>
            <th>Rechenzeit</th>
            <th>So lange wie …</th>
          </tr>
        </thead>
        <tbody>
          {FINENESS.map((f) => {
            const ms = computeMs(dim, f.n);
            const sev = severity(ms);
            const active = f.id === selected;
            const cells = totalCells(f.n);
            return (
              <tr
                key={f.id}
                className={`ctable-row ctable-row-${sev} ${active ? "active" : ""}`}
                onClick={() => setSelected(f.id)}
              >
                <td>{f.label}</td>
                <td>
                  <code>{f.n}</code>
                </td>
                <td>
                  {cells >= 1e9
                    ? `${(cells / 1e9).toFixed(1)} Mrd`
                    : cells >= 1e6
                      ? `${(cells / 1e6).toFixed(1)} Mio`
                      : cells.toLocaleString("de-DE")}
                </td>
                <td className="ctable-time">{formatTime(ms)}</td>
                <td className="ctable-vergleich">{alltagsvergleich(ms)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="ctable-note">
        Wechsel zwischen 1D, 2D und 3D. In 3D explodiert die Rechenzeit
        kubisch. Eine 3D-Strömung mit 2048 Zellen pro Achse ist mit
        klassischen Solvern auf einem normalen Rechner nicht mehr greifbar.
      </p>
    </div>
  );
}
