import { useState } from "react";

interface Annotation {
  title: string;
  body: string;
}

const CODE_LINES: string[] = [
  "import torch",
  "import torch.nn as nn",
  "import torch.nn.functional as F",
  "",
  "",
  "class SpectralConv1d(nn.Module):",
  "    def __init__(self, in_channels, out_channels, modes):",
  "        super().__init__()",
  "        self.in_channels = in_channels",
  "        self.out_channels = out_channels",
  "        self.modes = modes",
  "        scale = 1 / (in_channels * out_channels)",
  "        self.weights = nn.Parameter(",
  "            scale * torch.rand(in_channels, out_channels, modes,",
  "                               dtype=torch.cfloat)",
  "        )",
  "",
  "    def forward(self, x):",
  "        batchsize = x.shape[0]",
  "        x_ft = torch.fft.rfft(x)",
  "        out_ft = torch.zeros(batchsize, self.out_channels,",
  "                             x.size(-1) // 2 + 1,",
  "                             device=x.device, dtype=torch.cfloat)",
  "        out_ft[:, :, :self.modes] = torch.einsum(",
  "            'bix,iox->box',",
  "            x_ft[:, :, :self.modes],",
  "            self.weights,",
  "        )",
  "        return torch.fft.irfft(out_ft, n=x.size(-1))",
  "",
  "",
  "class FNO1d(nn.Module):",
  "    def __init__(self, modes=16, width=64):",
  "        super().__init__()",
  "        self.fc0 = nn.Linear(2, width)",
  "        self.conv0 = SpectralConv1d(width, width, modes)",
  "        self.conv1 = SpectralConv1d(width, width, modes)",
  "        self.conv2 = SpectralConv1d(width, width, modes)",
  "        self.conv3 = SpectralConv1d(width, width, modes)",
  "        self.w0 = nn.Conv1d(width, width, 1)",
  "        self.w1 = nn.Conv1d(width, width, 1)",
  "        self.w2 = nn.Conv1d(width, width, 1)",
  "        self.w3 = nn.Conv1d(width, width, 1)",
  "        self.fc1 = nn.Linear(width, 128)",
  "        self.fc2 = nn.Linear(128, 1)",
  "",
  "    def forward(self, x):",
  "        grid = self.get_grid(x.shape, x.device)",
  "        x = torch.cat((x, grid), dim=-1)",
  "        x = self.fc0(x).permute(0, 2, 1)",
  "        x = F.gelu(self.conv0(x) + self.w0(x))",
  "        x = F.gelu(self.conv1(x) + self.w1(x))",
  "        x = F.gelu(self.conv2(x) + self.w2(x))",
  "        x = self.conv3(x) + self.w3(x)",
  "        x = x.permute(0, 2, 1)",
  "        x = F.gelu(self.fc1(x))",
  "        return self.fc2(x)",
];

const ANNOTATIONS: Record<number, Annotation> = {
  0: {
    title: "PyTorch importieren",
    body: "PyTorch ist das Standard-Framework für neuronale Netze in Python. Wir brauchen die Haupt-Bibliothek plus zwei Sub-Module für Layer-Definitionen und Aktivierungs-/Hilfsfunktionen.",
  },
  5: {
    title: "Spektrale Faltungs-Schicht",
    body: "Diese Klasse ist das Herzstück des FNO. Sie führt die Fourier-Transformation aus, multipliziert komplexwertig mit gelernten Gewichten in den ersten k Moden und transformiert zurück. Das entspricht dem 'globalen Pfad' aus Kapitel 4.",
  },
  6: {
    title: "Konstruktor",
    body: "Drei Hyperparameter: Eingangs-Kanäle, Ausgangs-Kanäle und Anzahl behaltener Moden. Die Moden-Anzahl ist der Frequenz-Cutoff aus Kapitel 4 — der Knopf, an dem Genauigkeit und Robustheit gegen Rauschen abgewogen werden.",
  },
  11: {
    title: "Skalierung",
    body: "Glorot/He-artige Initialisierung. Ohne diese Normalisierung würden frische Layer mit zu großen oder zu kleinen Aktivierungen starten, was das Training instabil macht.",
  },
  12: {
    title: "Lernbare komplexe Gewichte",
    body: "Pro Frequenz, pro Eingangs- und Ausgangs-Kanal ein komplexwertiges Gewicht. Genau diese Werte werden im Training optimiert. Anzahl: in_channels × out_channels × modes — und davon zwei Werte (Real- und Imaginärteil).",
  },
  17: {
    title: "Forward-Pass: Vorwärtsdurchlauf",
    body: "Die Methode, die bei jedem Inferenz-Aufruf läuft. Eingabe x hat Shape (Batch, Kanäle, Punkte). Ergebnis hat dieselbe räumliche Auflösung — eine wichtige Eigenschaft, die Auflösungsunabhängigkeit erst ermöglicht.",
  },
  19: {
    title: "FFT (rfft)",
    body: "Reelle FFT, weil das Eingangssignal reell ist. Reduziert die Ausgabe-Größe um den Faktor 2 und ist signifikant schneller als die komplexe FFT.",
  },
  20: {
    title: "Output-Puffer im Frequenzraum",
    body: "Wir füllen nur die ersten k Moden mit gelernten Werten. Alle höheren Frequenzen bleiben null — das ist der Cutoff aus Kapitel 4.",
  },
  23: {
    title: "Einstein-Summation",
    body: "Kompakte Notation für die komplexwertige lineare Schicht im Frequenzraum. Pro Frequenz wird eine eigene komplexe Matrix-Vektor-Multiplikation ausgeführt. Über die `bix,iox->box`-Notation läuft die Kanal-Multiplikation für alle Batch-Elemente und Frequenzen gleichzeitig.",
  },
  28: {
    title: "Inverse FFT",
    body: "Zurück in den Ortsraum. Wichtig: `n=x.size(-1)` erzwingt dieselbe Auflösung wie die Eingabe — auch wenn das Modell auf einer anderen Auflösung trainiert wurde, kann es nun auf der neuen Auflösung arbeiten.",
  },
  31: {
    title: "Komplettes FNO-Modell",
    body: "Mehrere Fourier-Layer hintereinander, jeweils mit dem 1×1-Convolution-Bypass aus Kapitel 4. Hier vier Stück. Mehr Schichten = mehr Ausdruckskraft, aber auch mehr Trainingsaufwand.",
  },
  33: {
    title: "Input-Projektion",
    body: "fc0 nimmt die zwei Eingangs-Kanäle (u(x) und x selbst als Positionscodierung) und projiziert sie hoch auf die Arbeitsbreite, üblicherweise 32 oder 64 Kanäle.",
  },
  34: {
    title: "Fourier-Layer-Stapel",
    body: "Vier identische Spektral-Layer hintereinander. Jeder transformiert das Signal in den Frequenzraum, multipliziert mit gelernten Gewichten in den ersten k Moden und transformiert zurück.",
  },
  39: {
    title: "Lokale 1×1-Convolutions",
    body: "Parallel zum globalen Fourier-Pfad. Jeder dieser Layer arbeitet rein punktweise — Beitrag wird zum Fourier-Output addiert. Dieses Zusammenspiel zwischen globalem und lokalem Pfad ist das, was den FNO so effektiv macht.",
  },
  43: {
    title: "Output-Projektion",
    body: "Zwei vollverbundene Schichten am Ende reduzieren die hohe Kanal-Dimension wieder auf einen einzelnen Wert pro Gitterpunkt — die vorhergesagte Lösung u(x, T).",
  },
  46: {
    title: "Forward-Pass des Gesamtmodells",
    body: "Hier wird die komplette Architektur durchlaufen. Eingabe ist u(x, 0). Ausgabe ist u(x, T). Dazwischen vier Fourier-Layer mit nichtlinearer GeLU-Aktivierung.",
  },
  47: {
    title: "Positionscodierung",
    body: "Das Netz bekommt nicht nur die Werte u(x), sondern auch die Koordinaten x selbst als zusätzlichen Kanal mitgegeben. Ohne diese Info wäre das Modell translationsinvariant in unerwünschter Weise.",
  },
  51: {
    title: "GeLU-Aktivierung",
    body: "Glatte, monoton steigende Aktivierungsfunktion. Etwas weicher als ReLU, in der Praxis bei FNOs üblich. Bringt die Nichtlinearität ein, ohne die Spektralstruktur kaputt zu machen.",
  },
  54: {
    title: "Letzter Layer ohne Aktivierung",
    body: "Der vierte Spektral-Layer ohne nachfolgendes GeLU. So kann das Modell beliebige Werte ausgeben, nicht nur positive.",
  },
};

const KEYWORDS = new Set([
  "import", "from", "as", "class", "def", "return", "if", "else", "elif",
  "for", "while", "in", "is", "not", "and", "or", "self", "super", "None",
  "True", "False", "pass", "lambda",
]);

function tokenize(line: string): Array<{ text: string; cls: string }> {
  const tokens: Array<{ text: string; cls: string }> = [];
  // Kommentar
  const commentIdx = line.indexOf("#");
  if (commentIdx >= 0) {
    const before = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    tokens.push(...tokenize(before));
    tokens.push({ text: comment, cls: "code-comment" });
    return tokens;
  }
  const regex =
    /(\s+)|('[^']*'|"[^"]*")|(\b[0-9]+\.?[0-9]*\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)|([(){}\[\],.:;=+\-*/%<>])/g;
  let m;
  while ((m = regex.exec(line)) !== null) {
    const text = m[0];
    let cls = "code-other";
    if (m[1]) cls = "code-ws";
    else if (m[2]) cls = "code-string";
    else if (m[3]) cls = "code-number";
    else if (m[4]) cls = KEYWORDS.has(text) ? "code-kw" : "code-ident";
    else if (m[5]) cls = "code-punct";
    tokens.push({ text, cls });
  }
  return tokens;
}

export function AnnotatedCode() {
  const [active, setActive] = useState<number | null>(null);

  const annotation = active !== null ? ANNOTATIONS[active] : null;

  return (
    <div className="anncode">
      <div className="anncode-frame">
        <div className="anncode-header">
          <span className="anncode-filename">models/fno_1d.py</span>
          <span className="anncode-info">
            {Object.keys(ANNOTATIONS).length} Zeilen mit Erklärung
          </span>
        </div>
        <pre className="anncode-pre">
          {CODE_LINES.map((line, i) => {
            const hasNote = ANNOTATIONS[i] !== undefined;
            const isActive = i === active;
            return (
              <button
                key={i}
                className={`anncode-line ${hasNote ? "annotated" : ""} ${isActive ? "active" : ""}`}
                onClick={() => hasNote && setActive(isActive ? null : i)}
                disabled={!hasNote}
                title={hasNote ? "Klicken für Erklärung" : undefined}
              >
                <span className="anncode-lineno">{i + 1}</span>
                <span className="anncode-content">
                  {line === ""
                    ? " "
                    : tokenize(line).map((tok, j) => (
                        <span key={j} className={tok.cls}>
                          {tok.text}
                        </span>
                      ))}
                </span>
                {hasNote && <span className="anncode-marker" aria-hidden>i</span>}
              </button>
            );
          })}
        </pre>
      </div>

      <div className="anncode-panel">
        {annotation ? (
          <>
            <div className="anncode-panel-head">
              Zeile {(active ?? 0) + 1}
            </div>
            <div className="anncode-panel-title">{annotation.title}</div>
            <div className="anncode-panel-body">{annotation.body}</div>
            <button
              className="secondary-button anncode-panel-close"
              onClick={() => setActive(null)}
            >
              Schließen
            </button>
          </>
        ) : (
          <div className="anncode-panel-empty">
            Klick auf eine markierte Zeile (mit dem <code>i</code>-Symbol
            rechts). Die Erklärung erscheint hier.
          </div>
        )}
      </div>
    </div>
  );
}
