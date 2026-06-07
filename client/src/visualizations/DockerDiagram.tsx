import { useEffect, useRef, useState } from "react";

interface Stage {
  id: string;
  label: string;
  sublabel: string;
  body: string;
}

const STAGES: Stage[] = [
  {
    id: "browser",
    label: "Browser",
    sublabel: "Vite + React",
    body: "Hier sitzt du. Die Visualisierungen laufen lokal im Browser, der KI-Tutor wird über das HTTP-API erreicht. Eingaben aus Slidern und Aufgaben werden zur weiteren Verarbeitung gesendet.",
  },
  {
    id: "container",
    label: "Docker-Container",
    sublabel: "Node + Express + OpenAI",
    body: "Aus Einheit 1 bekannt: derselbe Container, der dort schon den Reverse-Proxy und die OpenAI-Brücke gestellt hat. In dieser Einheit kommt PyTorch dazu, läuft hier im Hintergrund als Inferenz-Service. Reproduzierbar, isoliert, auf jedem System gleich.",
  },
  {
    id: "output",
    label: "Ergebnis",
    sublabel: "Vorhersage / Erklärung",
    body: "Die Antwort wandert zurück in den Browser. Bei reinen Visualisierungen sind das Zahlenarrays für Canvas-Plots, bei Chat-Anfragen kommt der Antworttext zurück und wird in das Chat-Fenster gerendert.",
  },
];

const PARTICLES = 6;

export function DockerDiagram() {
  const [active, setActive] = useState<string>("container");
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const loop = (now: number) => {
      setTick((now - start) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stage = STAGES.find((s) => s.id === active) ?? STAGES[1];

  return (
    <div className="dockerdiag">
      <svg
        viewBox="0 0 600 200"
        className="dockerdiag-svg"
        aria-label="Datenfluss Browser zu Container zu Ergebnis"
      >
        {/* Stations */}
        <g>
          {STAGES.map((s, i) => {
            const x = 50 + i * 230;
            const isActive = s.id === active;
            return (
              <g
                key={s.id}
                className={`dockerdiag-station ${isActive ? "active" : ""}`}
                onClick={() => setActive(s.id)}
              >
                <rect
                  x={x}
                  y={60}
                  width={120}
                  height={80}
                  rx={8}
                  className="dockerdiag-box"
                />
                <text
                  x={x + 60}
                  y={95}
                  textAnchor="middle"
                  className="dockerdiag-label"
                >
                  {s.label}
                </text>
                <text
                  x={x + 60}
                  y={115}
                  textAnchor="middle"
                  className="dockerdiag-sublabel"
                >
                  {s.sublabel}
                </text>
              </g>
            );
          })}
        </g>

        {/* Verbindungen */}
        <line
          x1={170}
          y1={100}
          x2={280}
          y2={100}
          className="dockerdiag-line"
        />
        <line
          x1={400}
          y1={100}
          x2={510}
          y2={100}
          className="dockerdiag-line"
        />

        {/* Animierte Teilchen */}
        {Array.from({ length: PARTICLES }).map((_, i) => {
          const phase = (tick * 0.4 + i / PARTICLES) % 1;
          const segment = phase < 0.5 ? 0 : 1;
          const localPhase = (phase % 0.5) * 2;
          const startX = segment === 0 ? 170 : 400;
          const endX = segment === 0 ? 280 : 510;
          const x = startX + (endX - startX) * localPhase;
          return (
            <circle
              key={i}
              cx={x}
              cy={100}
              r={3}
              className="dockerdiag-particle"
            />
          );
        })}

        {/* Beschriftungen */}
        <text x={225} y={50} textAnchor="middle" className="dockerdiag-edge-label">
          Anfrage
        </text>
        <text x={455} y={50} textAnchor="middle" className="dockerdiag-edge-label">
          Antwort
        </text>
      </svg>

      <div className="dockerdiag-detail">
        <div className="dockerdiag-detail-tabs">
          {STAGES.map((s) => (
            <button
              key={s.id}
              className={`dockerdiag-tab ${s.id === active ? "active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="dockerdiag-detail-head">{stage.label}</div>
        <div className="dockerdiag-detail-sub">{stage.sublabel}</div>
        <div className="dockerdiag-detail-body">{stage.body}</div>
      </div>

      <div className="dockerdiag-note">
        Die Container-Infrastruktur stammt aus Einheit 1 der BA-Lernreihe.
        Dort hast du sie aufgesetzt, hier nutzt du sie produktiv. Das
        Setup ist identisch, nur die Inhalte im Container haben sich
        weiterentwickelt.
      </div>
    </div>
  );
}
