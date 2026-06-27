import { useMemo, useState } from "react";
import { useAppStore } from "../state/store";
import { TimeComparison } from "../visualizations/TimeComparison";
import { GridZoom } from "../visualizations/GridZoom";
import { ComplexityTable } from "../visualizations/ComplexityTable";
import { CustomGridSize } from "../visualizations/CustomGridSize";
import { CurveMorph } from "../visualizations/CurveMorph";
import { DrawAndPredict } from "../visualizations/DrawAndPredict";
import { LexiconVsGrammar } from "../visualizations/LexiconVsGrammar";
import { FourierDecomposition } from "../visualizations/FourierDecomposition";
import { FrequencyCutoff } from "../visualizations/FrequencyCutoff";
import { FNOLayerFlow } from "../visualizations/FNOLayerFlow";
import { ThreeModels } from "../visualizations/ThreeModels";
import { PDEBenchMap } from "../visualizations/PDEBenchMap";
import { TrainingPointAnimation } from "../visualizations/TrainingPointAnimation";
import { LiveTrainingView } from "../visualizations/LiveTrainingView";
import { LivePredictionFNO } from "../visualizations/LivePredictionFNO";
import { ErrorHeatmap } from "../visualizations/ErrorHeatmap";

type Category =
  | "kosten"
  | "operator"
  | "fourier"
  | "vergleich"
  | "daten"
  | "training"
  | "praxis"
  | "fehler";

interface PlotDef {
  id: string;
  title: string;
  subtitle: string;
  fromChapter: number;
  category: Category;
  render: () => JSX.Element;
}

const CATEGORY_LABEL: Record<Category, string> = {
  kosten: "Rechenkosten",
  operator: "Operator-Konzept",
  fourier: "Fourier & FNO",
  vergleich: "Vergleich",
  daten: "Daten",
  training: "Training",
  praxis: "Live-Praxis",
  fehler: "Fehleranalyse",
};

const PLOTS: PlotDef[] = [
  {
    id: "time",
    title: "Zeitvergleich FEM vs. FNO",
    subtitle: "Balkenrennen: klassischer Solver gegen Forward-Pass",
    fromChapter: 1,
    category: "kosten",
    render: () => <TimeComparison />,
  },
  {
    id: "gridzoom",
    title: "Gitter-Zoom",
    subtitle: "Heatmap, Rechenzeit kippt von grün nach rot",
    fromChapter: 2,
    category: "kosten",
    render: () => <GridZoom />,
  },
  {
    id: "ctable",
    title: "Komplexitätstabelle",
    subtitle: "Dimension × Feinheit, mit Alltagsvergleichen",
    fromChapter: 2,
    category: "kosten",
    render: () => <ComplexityTable />,
  },
  {
    id: "custom",
    title: "Eigene Gittergröße",
    subtitle: "Sanduhr-Simulation für selbstgewählte N",
    fromChapter: 2,
    category: "kosten",
    render: () => <CustomGridSize />,
  },
  {
    id: "morph",
    title: "Kurve morpht, Operator bleibt",
    subtitle: "Eingabe ändert sich, der Operator G ist derselbe",
    fromChapter: 3,
    category: "operator",
    render: () => <CurveMorph />,
  },
  {
    id: "draw",
    title: "Zeichnen & vorhersagen",
    subtitle: "Eigene Anfangsbedingung: NN versus Operator",
    fromChapter: 3,
    category: "operator",
    render: () => <DrawAndPredict />,
  },
  {
    id: "metaphor",
    title: "Lexikon vs. Grammatik",
    subtitle: "Metapher für NN gegenüber neuronalem Operator",
    fromChapter: 3,
    category: "operator",
    render: () => <LexiconVsGrammar />,
  },
  {
    id: "fourier",
    title: "Fourier-Zerlegung",
    subtitle: "Mode für Mode wird die Kurve sauberer",
    fromChapter: 4,
    category: "fourier",
    render: () => <FourierDecomposition />,
  },
  {
    id: "cutoff",
    title: "Frequenz-Cutoff",
    subtitle: "Slider sucht den Sweet-Spot zwischen Glätte und Rauschen",
    fromChapter: 4,
    category: "fourier",
    render: () => <FrequencyCutoff />,
  },
  {
    id: "flow",
    title: "FNO-Layer-Pipeline",
    subtitle: "Anklickbare Schritte: FFT → Cutoff → Linear → IFFT",
    fromChapter: 4,
    category: "fourier",
    render: () => <FNOLayerFlow />,
  },
  {
    id: "models",
    title: "FNO vs. CNN vs. MLP",
    subtitle: "Fehler-Heatmaps auf derselben PDE",
    fromChapter: 4,
    category: "vergleich",
    render: () => <ThreeModels />,
  },
  {
    id: "pdebench-map",
    title: "PDEBench-Karte",
    subtitle: "Alle PDE-Familien als anklickbare Kacheln",
    fromChapter: 5,
    category: "daten",
    render: () => <PDEBenchMap />,
  },
  {
    id: "trainpoint",
    title: "Trainingspunkt-Animation",
    subtitle: "Konfiguration → Solver → Datensatz, Schritt für Schritt",
    fromChapter: 5,
    category: "daten",
    render: () => <TrainingPointAnimation />,
  },
  {
    id: "livetrain",
    title: "Live-Training",
    subtitle: "Trainings-Loop als Animation, Loss-Kurve in Echtzeit",
    fromChapter: 6,
    category: "training",
    render: () => <LiveTrainingView />,
  },
  {
    id: "livepred",
    title: "Parameter erkunden",
    subtitle: "Slider drehen, Vorhersage reagiert sofort. Innerhalb des Trainingsbereichs cyan, außerhalb gelb-orange.",
    fromChapter: 7,
    category: "praxis",
    render: () => (
      <LivePredictionFNO onSnapshot={() => {}} onChange={() => {}} />
    ),
  },
  {
    id: "errheatmap",
    title: "Fehler-Heatmap",
    subtitle: "Wo bricht das Modell ein? Trainingsbereich sichtbar",
    fromChapter: 7,
    category: "fehler",
    render: () => <ErrorHeatmap />,
  },
];

const PARAM_LABELS: Record<string, { label: string; format?: (v: number) => string }> = {
  timecompare_grid: { label: "Zeitvergleich · Gitter", format: (v) => `${v} × ${v}` },
  gridzoom_n: { label: "Gitter-Zoom · Auflösung", format: (v) => `${v} × ${v}` },
  custom_grid_n: { label: "Eigene Größe · N", format: (v) => `${v} pro Achse` },
  custom_grid_dim: { label: "Eigene Größe · Dimension", format: (v) => `${v}D` },
  draw_predict_res: { label: "Zeichnen-Demo · Anzeige", format: (v) => `${v} Punkte` },
  fourier_modes: { label: "Fourier-Zerlegung · aktive Moden", format: (v) => `${v} Moden` },
  fno_cutoff: { label: "Frequenz-Cutoff", format: (v) => `${v} Moden` },
  livepred_visc: { label: "Parameter erkunden · Viskosität ν", format: (v) => v.toFixed(3) },
  livepred_t: { label: "Parameter erkunden · Zeitstempel T", format: (v) => v.toFixed(2) },
  errmap_visc: { label: "Fehler-Heatmap · Viskosität ν", format: (v) => v.toFixed(3) },
  errmap_t: { label: "Fehler-Heatmap · Zeitstempel T", format: (v) => v.toFixed(2) },
};

export function SimulationLab() {
  const completedChapters = useAppStore((s) => s.completedChapters);
  const lastSliders = useAppStore((s) => s.lastSliders);

  const [active, setActive] = useState<string>("gridzoom");
  const [filter, setFilter] = useState<Category | "all">("all");

  // Nur Plots aus tatsächlich abgeschlossenen Kapiteln — kein Spoiler-Vorgriff.
  const unlocked = useMemo(
    () => PLOTS.filter((p) => completedChapters.includes(p.fromChapter)),
    [completedChapters],
  );

  const visible = useMemo(
    () => unlocked.filter((p) => filter === "all" || p.category === filter),
    [unlocked, filter],
  );

  const grouped = useMemo(() => {
    const groups: Record<number, PlotDef[]> = {};
    for (const p of visible) {
      (groups[p.fromChapter] ??= []).push(p);
    }
    return Object.entries(groups)
      .map(([k, v]) => ({ chapter: Number(k), plots: v }))
      .sort((a, b) => a.chapter - b.chapter);
  }, [visible]);

  // Kategorien, die aktuell überhaupt freigeschaltete Plots haben.
  const availableCategories = useMemo(
    () => new Set(unlocked.map((p) => p.category)),
    [unlocked],
  );

  const activePlot = unlocked.find((p) => p.id === active);
  const activeUnlocked = !!activePlot;

  const trackedParams = Object.entries(lastSliders).filter(([k]) =>
    Object.prototype.hasOwnProperty.call(PARAM_LABELS, k),
  );

  return (
    <div>
      <div className="chapter-meta">Simulation Lab · Plot-Sammlung</div>
      <h1>Simulation Lab</h1>
      <p>
        Alle interaktiven Plots aus den Kapiteln, dauerhaft greifbar. Spiel
        mit den Parametern, ohne durch das Kapitel scrollen zu müssen. Die
        Parameterkarte unten merkt sich, mit welchen Werten du zuletzt
        gearbeitet hast.
      </p>

      {unlocked.length === 0 ? (
        <div className="lab-empty">
          Noch keine Simulation freigeschaltet. Schließ Kapitel 1 ab, dann
          erscheint hier die erste.
        </div>
      ) : (
        <>
          <div className="lab-filters">
            <button
              className={`ctable-segment ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Alle
            </button>
            {(Object.keys(CATEGORY_LABEL) as Category[])
              .filter((c) => availableCategories.has(c))
              .map((c) => (
                <button
                  key={c}
                  className={`ctable-segment ${filter === c ? "active" : ""}`}
                  onClick={() => setFilter(c)}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
          </div>

          {grouped.map(({ chapter, plots }) => (
            <div key={chapter} className="lab-group">
              <div className="lab-group-head">
                <span className="lab-group-chapter">Kapitel {chapter}</span>
                <span className="lab-group-count">
                  {plots.length} {plots.length === 1 ? "Plot" : "Plots"}
                </span>
              </div>
              <div className="lab-shelf">
                {plots.map((p) => {
                  const isActive = p.id === active;
                  return (
                    <button
                      key={p.id}
                      className={`lab-tile ${isActive ? "active" : ""}`}
                      onClick={() => setActive(p.id)}
                    >
                      <div className="lab-tile-cat">
                        {CATEGORY_LABEL[p.category]}
                      </div>
                      <div className="lab-tile-title">{p.title}</div>
                      <div className="lab-tile-sub">{p.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="lab-stage">
            {activePlot && activeUnlocked ? (
              activePlot.render()
            ) : (
              <div className="lab-empty">
                Wähl einen Plot oben, er erscheint hier zum direkten
                Ausprobieren.
              </div>
            )}
          </div>
        </>
      )}

      <h2>Persönliche Parameterkarte</h2>
      {trackedParams.length === 0 ? (
        <p className="lab-empty-card">
          Noch keine Parameter gespeichert. Sobald du in einem Plot Werte
          änderst, erscheinen sie hier. Bleiben auch nach einem
          Browser-Neustart erhalten.
        </p>
      ) : (
        <table className="lab-params">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Letzter Wert</th>
            </tr>
          </thead>
          <tbody>
            {trackedParams.map(([k, v]) => {
              const meta = PARAM_LABELS[k];
              return (
                <tr key={k}>
                  <td>{meta.label}</td>
                  <td>
                    <code>{meta.format ? meta.format(v) : v}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
