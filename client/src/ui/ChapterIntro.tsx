interface PhaseDef {
  label: string;
  description: string;
}

const PHASE_BY_CHAPTER: Record<number, PhaseDef> = {
  1: {
    label: "Onboarding",
    description:
      "Du nimmst den Auftrag von AeroDyn an: dreihundert Tragflächen-Konfigurationen, vier Stunden Solver pro Stück. Frage heute: muss das überhaupt so sein?",
  },
  2: {
    label: "Analyse",
    description:
      "Du baust die Geschäftsgrundlage: zeig dem Engineering-Team, warum klassische Solver bei hoher Auflösung ökonomisch nicht skalieren.",
  },
  3: {
    label: "Analyse",
    description:
      "Du klärst, was ein neuronaler Operator eigentlich ist und warum er sich von einem klassischen NN unterscheidet — Sprache für das Konzeptpapier.",
  },
  4: {
    label: "Training",
    description:
      "Du schaust dir die Architektur an, die AeroDyn am Ende ausgeliefert bekommen soll: Fourier-Layer, Cutoff, Modenwahl.",
  },
  5: {
    label: "Training",
    description:
      "Du triffst die erste echte Engineering-Entscheidung: Welcher Datensatz passt zum Tragflächen-Profil des Kunden?",
  },
  6: {
    label: "Training",
    description:
      "Du fährst das Training und beobachtest live, wie Lernrate und Modi das Ergebnis formen. Hier zeigt sich, ob das Setup aus Kapitel 5 trägt.",
  },
  7: {
    label: "Validierung",
    description:
      "Du gehst den Fehlern auf den Grund: wo ist der Operator verlässlich, wo extrapoliert er — und was kommunizierst du dem Kunden?",
  },
  8: {
    label: "Übergabe",
    description:
      "Du übergibst: Notebook fertig, Infrastruktur reproduzierbar. Die Akte muss bei AeroDyn ankommen.",
  },
};

interface Props {
  chapter: number;
  meta: string;
  title: string;
}

export function ChapterIntro({ chapter, meta, title }: Props) {
  const phase = PHASE_BY_CHAPTER[chapter];
  return (
    <>
      <div className="chapter-meta">{meta}</div>
      {phase && (
        <div className="chapter-intro">
          <div className="chapter-intro-tag">
            Phase · {phase.label} · Kapitel {chapter} / 8
          </div>
          <div className="chapter-intro-text">{phase.description}</div>
        </div>
      )}
      <h1>{title}</h1>
    </>
  );
}
