// Charakter-Nachrichten-Pools.
// Regeln aus dem Konzept:
//   Priya: nach Kapitelabschluss / Fachfragen. NIE: motivieren, Smalltalk.
//   Tobias: nur bei technischen Problemen + Kapitel 8. NIE: Inhalt erklären.
//   Amara: bei Achievements, nach Fehlern (ermutigen). NIE: fachlich tief gehen.
//   Lena: Deadlines, Deliverables, Finale. NIE: Technik kommentieren.
// Wichtig: Charaktere sagen nie das gleiche, Pools sind charakter-spezifisch.

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const PRIYA_AT_CHAPTER_DONE: Record<number, readonly string[]> = {
  1: [
    "Solide Beobachtung. Auf zu Kapitel 2.",
    "Zeitvergleich gesehen. Weiter.",
    "Erster Schock verarbeitet. Sehr gut.",
  ],
  2: [
    "Bestätigt. Das war der einfachste Teil.",
    "Komplexität klar. Weiter zum Operator.",
  ],
  3: [
    "Operator-Konzept sitzt. Weiter.",
    "Funktion-zu-Funktion. Notiert.",
  ],
  4: [
    "FNO verstanden. Akzeptabel.",
    "Frequenzraum verinnerlicht. Sehr gut.",
  ],
  5: [
    "Datenbasis ist klar. Weiter.",
    "PDEBench-Auswahl ist solide.",
  ],
  6: [
    "Live-Vergleich gesehen. Notiert.",
    "Inferenz vs. Solver verstanden.",
  ],
  7: [
    "Fehlerbild sauber gelesen. Letzte Phase.",
    "Modell-Vertrauen kalibriert. Gut.",
  ],
  8: [
    "Abschluss. Gute Arbeit.",
    "Projekt abgeschlossen. Saubere Doku.",
    "Notebook läuft, Code verstanden. Ausgezeichnet.",
  ],
};

export const AMARA_AT_ACHIEVEMENT: Record<string, readonly string[]> = {
  first_step: [
    "Erster Schritt! Sehr cool, ich hab Kapitel 1 damals zweimal gemacht.",
    "Ja! Erstes Kapitel im Sack. Der härteste Schritt ist immer der erste.",
  ],
  first_contact: [
    "Du hast den Tutor angeschrieben, gut so, frag wirklich immer alles.",
  ],
  grid_master: [
    "128er Auflösung. Du gehst aufs Ganze. Mag ich.",
  ],
  character_collector: [
    "Alle vier abgehakt. Wir sind jetzt ein Team.",
  ],
  room_explorer: [
    "Du hast überall reingeschaut. Das mag ich.",
  ],
  quick_streak: [
    "Drei am Stück, du bist on fire!",
  ],
  spectral_diver: [
    "Du hast wirklich tief in den Frequenzraum geschaut. Respekt.",
  ],
  config_builder: [
    "Eigene Konfiguration gebaut, nicht nur abgespielt. Das ist Engineering.",
  ],
  quick_thinker: [
    "Erste Antwort, erster Treffer. Da war jemand wach.",
    "Direkt richtig, beeindruckend.",
  ],
  sokrates: [
    "Sokrates-Modus ist mein Favorit. Bereit, dich fragen zu lassen?",
  ],
  __fallback: [
    "Sauber, das geht ja gleich los!",
    "Top, sammel die alle ein.",
    "Du machst das wirklich super.",
  ],
};

export const AMARA_AT_QUIZ_WRONG: readonly string[] = [
  "Halb so wild, mir ging's am Anfang auch so. Versuch's nochmal.",
  "Kein Drama. Eine Antwort ist näher dran, lies sie nochmal in Ruhe.",
  "Beim zweiten Mal sitzt's. Geh einfach nochmal durch die Optionen.",
];

export const TOBIAS_AT_KAPITEL_8: readonly string[] = [
  "Notebook ist hoch. Falls was kracht: `docker logs fno-container`.",
  "Container läuft. Bei Fehler erst Stack-Trace, dann fragen.",
  "Hinweis: Pyodide-Build dauert beim ersten Laden ~10s.",
];

export const TOBIAS_AT_NOTEBOOK_ERROR: readonly string[] = [
  "Wieder kaputt. Stack-Trace bitte.",
  "Logs:  `docker logs fno-container --tail 30`.",
];

export const LENA_AT_CHAPTER_ENTRY: Record<number, readonly string[]> = {
  5: [
    "Halbzeit. Der Datensatz ist deine erste echte Entscheidung gegenüber dem Kunden.",
  ],
  7: [
    "Letzte Validierung vor der Übergabe. Kunde wartet auf einen ehrlichen Bericht.",
  ],
  8: [
    "Wir gehen Richtung Präsentation. Bereit?",
  ],
};

// Priya kommentiert richtige Quiz-Antworten knapp und fachlich.
export const PRIYA_AT_QUIZ_CORRECT: readonly string[] = [
  "Korrekt. Genau so steht's in der Originalpublikation.",
  "Sitzt. Notier dir das für den Kundenbericht.",
  "Richtig. Diese Intuition trägt durch die nächsten Kapitel.",
  "Sauber argumentiert.",
];

// Priya zu hoher Modenzahl / tiefer Spektrum-Auswahl (fachlich).
export const PRIYA_AT_MODES_HIGH: readonly string[] = [
  "Viele Moden. Mehr Detail, aber auch mehr Trainingsbedarf.",
  "Hoher Cutoff. Genau die Stelle, an der Speicher zum Engpass wird.",
];

// Tobias zu hoher Gitterauflösung (technisch).
export const TOBIAS_AT_GRID_HIGH: readonly string[] = [
  "256er Grid. Lüfter brennt, aber genau dafür sind wir hier.",
  "Hohe Auflösung. Der Solver fängt jetzt richtig an zu leiden.",
];

// Tobias zu sehr niedrigem Gitter (technisch).
export const TOBIAS_AT_GRID_LOW: readonly string[] = [
  "16er Gitter. Effizient, aber da fehlt jede Hochfrequenz.",
];

// Tobias meldet sich, wenn das Notebook lange offen ist.
export const TOBIAS_AT_NOTEBOOK_DWELL: readonly string[] = [
  "Du bist schon eine Weile drin. Probier mal `DEMO = False`, wenn du Mut hast.",
  "Tipp: Zellen einzeln ausführen, dann siehst du wo's hakt.",
];

// Amara nach zweiter falscher Antwort im selben Quiz (konkreter Hinweis).
export const AMARA_AT_QUIZ_STUCK: readonly string[] = [
  "Geh nochmal kurz raus, atmen. Die Erklärung im Kapitel hilft.",
  "Lies die Frage Wort für Wort. Eine Option ist näher dran als die anderen.",
  "Schlimmer wird's nicht. Falls du blockierst, frag den Tutor unten rechts.",
];

// Lena beim Wiedereinstieg nach Inaktivität.
export const LENA_AT_RETURN: readonly string[] = [
  "Schön, dass du wieder reinschaust. Wo waren wir stehengeblieben?",
  "Willkommen zurück. Wir haben das Projekt nicht vergessen.",
];

// Lena, wenn das Notebook tatsächlich geladen wurde.
export const LENA_AT_NOTEBOOK_DONE: readonly string[] = [
  "Notebook gesichtet, sehr gut. Letzter Schritt: Übergabe ins Archive.",
  "Bereit für die Präsentation. Das Archive ist der nächste Stop.",
];

// Lena, wenn das Retro fertig ist und das Projekt offiziell abgeschlossen.
export const LENA_AT_PROJECT_DONE: readonly string[] = [
  "Retro durch, Akte versandt. Sauber abgeschlossen.",
  "Projekt formal beendet. Ich nehm das in die nächste Lead-Runde mit.",
];
