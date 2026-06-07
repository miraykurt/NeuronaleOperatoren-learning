import { useEffect, useState } from "react";

interface Aspect {
  label: string;
  fno: { kind: "pro" | "con" | "neutral"; text: string };
  pinn: { kind: "pro" | "con" | "neutral"; text: string };
}

const ASPECTS: Aspect[] = [
  {
    label: "Trainingsbedarf",
    fno: {
      kind: "con",
      text: "Braucht große Mengen vorgelöster Daten aus klassischem Solver.",
    },
    pinn: {
      kind: "pro",
      text: "Lernt aus der PDE selbst, keine teuren Trainingsdaten nötig.",
    },
  },
  {
    label: "Inferenz-Geschwindigkeit",
    fno: {
      kind: "pro",
      text: "Wenige Millisekunden pro Anfrage, einmal trainiert beliebig oft nutzbar.",
    },
    pinn: {
      kind: "con",
      text: "Pro neuer PDE-Instanz neu trainieren, kein Forward-Pass-Vorteil.",
    },
  },
  {
    label: "Generalisierung",
    fno: {
      kind: "neutral",
      text: "Robust innerhalb der Trainingsverteilung, bricht außerhalb ein.",
    },
    pinn: {
      kind: "pro",
      text: "Physik-Constraints im Loss helfen bei Extrapolation.",
    },
  },
  {
    label: "Physik-Konsistenz",
    fno: {
      kind: "con",
      text: "Keine Garantie für Erhaltungsgrößen (Masse, Energie) ohne Zusatzmaßnahmen.",
    },
    pinn: {
      kind: "pro",
      text: "PDE im Loss eingebaut, Lösung erfüllt Physik per Konstruktion.",
    },
  },
  {
    label: "Komplexe Geometrien",
    fno: {
      kind: "neutral",
      text: "Auf strukturierten Gittern stark, irreguläre Gebiete anspruchsvoll.",
    },
    pinn: {
      kind: "pro",
      text: "Punktweise Loss-Auswertung, beliebige Geometrien grundsätzlich möglich.",
    },
  },
  {
    label: "Skalierung",
    fno: {
      kind: "pro",
      text: "Inferenz bleibt schnell bei beliebig vielen Anfragen.",
    },
    pinn: {
      kind: "con",
      text: "Training skaliert schlecht, jede neue Konfiguration kostet erneut.",
    },
  },
];

function badgeFor(kind: "pro" | "con" | "neutral"): string {
  if (kind === "pro") return "+";
  if (kind === "con") return "−";
  return "•";
}

export function PINNsVsFNO() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const id = window.setInterval(() => {
      setVisible((n) => {
        if (n >= ASPECTS.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 350);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pinnvs">
      <div className="pinnvs-head">
        <div className="pinnvs-col-head pinnvs-col-fno">FNO</div>
        <div className="pinnvs-col-aspect">Aspekt</div>
        <div className="pinnvs-col-head pinnvs-col-pinn">PINN</div>
      </div>

      <div className="pinnvs-rows">
        {ASPECTS.map((a, i) => (
          <div
            key={a.label}
            className={`pinnvs-row ${i < visible ? "in" : "out"}`}
          >
            <div className={`pinnvs-cell pinnvs-cell-${a.fno.kind}`}>
              <span className="pinnvs-badge">{badgeFor(a.fno.kind)}</span>
              <span>{a.fno.text}</span>
            </div>
            <div className="pinnvs-aspect">{a.label}</div>
            <div className={`pinnvs-cell pinnvs-cell-${a.pinn.kind}`}>
              <span className="pinnvs-badge">{badgeFor(a.pinn.kind)}</span>
              <span>{a.pinn.text}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="secondary-button pinnvs-replay"
        onClick={() => {
          setVisible(0);
          window.setTimeout(() => setVisible(1), 50);
          let n = 1;
          const id = window.setInterval(() => {
            n += 1;
            setVisible(n);
            if (n >= ASPECTS.length) window.clearInterval(id);
          }, 350);
        }}
      >
        Neu starten
      </button>

      <p className="pinnvs-note">
        Beide Verfahren lösen am Ende dieselbe PDE. FNO setzt auf
        Datenmenge und schnelle Inferenz, PINN auf direkte
        Physik-Integration und freie Geometrie. Für ein produktives
        Engineering-Setup werden zunehmend Mischformen verwendet, die das
        Beste aus beiden Welten kombinieren.
      </p>
    </div>
  );
}
