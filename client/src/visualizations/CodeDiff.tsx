interface DiffLine {
  v1?: string;
  v2?: string;
  kind: "same" | "added" | "removed" | "changed";
}

// Kapitel 8: Zwei FNO-Versionen, die sich nur in der Modenzahl
// unterscheiden. Knüpft direkt an die Moden-Erkenntnis aus Kapitel 7 an.

const DIFF: DiffLine[] = [
  { v1: "class FNO1d(nn.Module):", v2: "class FNO1d(nn.Module):", kind: "same" },
  {
    v1: "    def __init__(self, modes=4, width=32):",
    v2: "    def __init__(self, modes=20, width=32):",
    kind: "changed",
  },
  { v1: "        super().__init__()", v2: "        super().__init__()", kind: "same" },
  { v1: "        self.modes = modes", v2: "        self.modes = modes", kind: "same" },
  { v1: "        self.fc0 = nn.Linear(2, width)", v2: "        self.fc0 = nn.Linear(2, width)", kind: "same" },
  { v1: "        self.conv0 = SpectralConv1d(width, width, modes)", v2: "        self.conv0 = SpectralConv1d(width, width, modes)", kind: "same" },
  { v1: "        self.conv1 = SpectralConv1d(width, width, modes)", v2: "        self.conv1 = SpectralConv1d(width, width, modes)", kind: "same" },
  { v1: "        self.conv2 = SpectralConv1d(width, width, modes)", v2: "        self.conv2 = SpectralConv1d(width, width, modes)", kind: "same" },
  { v1: "        self.conv3 = SpectralConv1d(width, width, modes)", v2: "        self.conv3 = SpectralConv1d(width, width, modes)", kind: "same" },
  { v1: "        self.w0 = nn.Conv1d(width, width, 1)", v2: "        self.w0 = nn.Conv1d(width, width, 1)", kind: "same" },
  { v1: "        self.w1 = nn.Conv1d(width, width, 1)", v2: "        self.w1 = nn.Conv1d(width, width, 1)", kind: "same" },
  { v1: "        self.w2 = nn.Conv1d(width, width, 1)", v2: "        self.w2 = nn.Conv1d(width, width, 1)", kind: "same" },
  { v1: "        self.w3 = nn.Conv1d(width, width, 1)", v2: "        self.w3 = nn.Conv1d(width, width, 1)", kind: "same" },
  { v1: "        self.fc1 = nn.Linear(width, 128)", v2: "        self.fc1 = nn.Linear(width, 128)", kind: "same" },
  { v1: "        self.fc2 = nn.Linear(128, 1)", v2: "        self.fc2 = nn.Linear(128, 1)", kind: "same" },
];

interface MetricRow {
  label: string;
  v1: string;
  v2: string;
  improved: boolean;
}

const METRICS: MetricRow[] = [
  {
    label: "Modenzahl k",
    v1: "4",
    v2: "20",
    improved: true,
  },
  {
    label: "Spektrale Parameter",
    v1: "~ 4 k",
    v2: "~ 20 k",
    improved: false,
  },
  {
    label: "Inferenz-Zeit (CPU)",
    v1: "4 ms",
    v2: "6 ms",
    improved: false,
  },
  {
    label: "Test-Loss (RMSE)",
    v1: "0.082",
    v2: "0.012",
    improved: true,
  },
  {
    label: "Scharfe Strukturen",
    v1: "fehlen",
    v2: "abgebildet",
    improved: true,
  },
  {
    label: "Restfehler-Quelle",
    v1: "Mode-Limit",
    v2: "kaum mehr",
    improved: true,
  },
];

export function CodeDiff() {
  return (
    <div className="codediff">
      <div className="codediff-head">
        <div className="codediff-col-head v1">v1 — wenige Moden (k = 4)</div>
        <div className="codediff-col-head v2">v2 — viele Moden (k = 20)</div>
      </div>

      <div className="codediff-body">
        {DIFF.map((row, i) => (
          <div key={i} className={`codediff-row codediff-${row.kind}`}>
            <pre className="codediff-cell codediff-v1">
              {row.kind === "added" ? (
                <span className="codediff-empty">+</span>
              ) : (
                <>
                  <span className="codediff-marker">
                    {row.kind === "removed" || row.kind === "changed" ? "−" : " "}
                  </span>
                  {row.v1 ?? ""}
                </>
              )}
            </pre>
            <pre className="codediff-cell codediff-v2">
              {row.kind === "removed" ? (
                <span className="codediff-empty">−</span>
              ) : (
                <>
                  <span className="codediff-marker">
                    {row.kind === "added" || row.kind === "changed" ? "+" : " "}
                  </span>
                  {row.v2 ?? ""}
                </>
              )}
            </pre>
          </div>
        ))}
      </div>

      <table className="codediff-metrics">
        <thead>
          <tr>
            <th>Metrik</th>
            <th>v1</th>
            <th>v2</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m) => (
            <tr key={m.label}>
              <td>{m.label}</td>
              <td className="codediff-metric-v1">{m.v1}</td>
              <td className="codediff-metric-v2">{m.v2}</td>
              <td
                className={`codediff-metric-delta ${m.improved ? "improved" : "worse"}`}
              >
                {m.improved ? "besser" : "teurer"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="codediff-summary">
        Genau eine Zahl ist geändert: <code>modes</code> von 4 auf 20.
        Die Mehrheit der Genauigkeit liegt in diesen wenigen Moden. Das
        ist die Moden-Erkenntnis aus Kapitel 7 in echtem Code. Mehr
        Moden kosten Parameter und Inferenz-Zeit, geben aber dem Modell
        die Frequenzen, die scharfe Strukturen brauchen.
      </div>
    </div>
  );
}
