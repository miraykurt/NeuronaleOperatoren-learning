export type ChatMode = "tutor" | "debug" | "sokrates";

export const modes: Record<ChatMode, { label: string; description: string }> = {
  tutor: {
    label: "Tutor",
    description:
      "Beantwortet Fragen mit Rückbezug auf vorherige Einheiten und die aktuelle Visualisierung.",
  },
  debug: {
    label: "Debug-Helfer",
    description:
      "Fehlermeldung einfügen → spezifische Lösung für den vorbereiteten Stack.",
  },
  sokrates: {
    label: "Sokrates",
    description: "Stellt Gegenfragen statt direkter Antworten.",
  },
};

// Vorschläge für einen Sokrates-Einstieg pro Kapitel. Werden im leeren Chat
// als anklickbarer Chip angezeigt, damit klar ist, wie man den Modus
// sinnvoll benutzt.
export const sokratesSuggestions: Record<number, string> = {
  1: "Warum reicht ein klassischer Solver für unseren Auftrag eigentlich nicht?",
  2: "Warum wird ein klassischer Solver bei feinerem Gitter so viel langsamer?",
  3: "Was unterscheidet einen Operator von einem normalen neuronalen Netz?",
  4: "Wieso ausgerechnet Fourier? Was bringt der Frequenzraum hier?",
  5: "Was macht einen guten Trainingsdatensatz für einen neuronalen Operator aus?",
  6: "Woran erkenne ich, wann ich dem Modell trauen darf?",
  7: "Was sagt mir eine Fehler-Heatmap über das Modell?",
  8: "Was passiert eigentlich in einer Fourier-Layer im Code?",
};
