import { useAppStore } from "../state/store";
import { LivePredictionFNO } from "../visualizations/LivePredictionFNO";
import { ErrorHeatmap } from "../visualizations/ErrorHeatmap";
import { ChatTrigger } from "../ui/ChatTrigger";
import { ChapterIntro } from "../ui/ChapterIntro";
import { OpenQuestion } from "../ui/OpenQuestion";

const LIMITS_TUTOR_PROMPT =
  "Bereite mich auf den Abschluss von Kapitel 7 vor: ich soll dem Kunden " +
  "AeroDyn im Übergabe-Bericht die methodischen Grenzen unseres FNO-Modells " +
  "dokumentieren. Erklär mir kompakt, welche Klassen von Limitationen IMMER " +
  "kommuniziert werden müssen, wenn ein FNO an einen Kunden übergeben wird " +
  "(Stichworte Trainingsbereich, Cutoff-bedingte Genauigkeitsgrenze, " +
  "Dimensions-Übertragung, Out-of-Distribution-Verhalten). Und sag mir " +
  "auch: was wäre KEINE faire Limitation, sondern eine bewusste " +
  "Designentscheidung? Halte es knapp genug, dass ich drei Sätze davon im " +
  "Bericht zitieren kann.";

const ABSCHLUSS_FRAGE =
  "Du formulierst einen kurzen Abschnitt für den Übergabe-Bericht an " +
  "AeroDyn: welche Grenzen unseres trainierten FNO-Modells müssen explizit " +
  "dokumentiert werden, damit der Kunde weiß, wo das Modell verlässlich " +
  "gilt und wo nicht? Schreib zwei bis drei eigene Sätze, die so im " +
  "Bericht stehen könnten.";

export function Kapitel7() {
  const completeChapter = useAppStore((s) => s.completeChapter);
  const earnCC = useAppStore((s) => s.earnCC);
  const setView = useAppStore((s) => s.setView);
  const done = useAppStore((s) => s.completedChapters.includes(7));

  function handleDecisionAccepted() {
    if (!done) {
      completeChapter(7);
      earnCC(200, "Kapitel 7 abgeschlossen");
    }
  }

  return (
    <div>
      <ChapterIntro chapter={7} meta="Kapitel 7 · Ergebnis verstehen" title="Den trainierten FNO erkunden und seine Grenzen lesen" />
      <p>
        Das Modell ist jetzt trainiert. Zwei Fragen bleiben: Wie
        reagiert es auf neue Konfigurationen, und wo darf man ihm
        wirklich trauen? Genau diese beiden Fragen klären wir hier in
        einem Kapitel zusammen.
      </p>

      <h2>Parameter erkunden</h2>
      <p>
        Eine gelernte Abbildung auszuwerten ist genau ein Durchlauf des
        Modells, deshalb reagiert die Kurve unten sofort, wenn du an
        einem Regler drehst. Innerhalb des gelernten Bereichs ist die
        Vorhersage cyan, am Rand und außerhalb färbt sie sich
        gelb-orange, weil das Modell dort raten muss.
      </p>
      <LivePredictionFNO
        onSnapshot={() => {}}
        onChange={() => {}}
      />

      <aside className="def-box">
        <strong>Interpolation</strong>
        Wenn der Reglerpunkt zwischen bekannten Trainings-Konfigurationen
        liegt, füllt das Modell Lücken. Ergebnis: meistens kleiner,
        stabiler Fehler.
      </aside>

      <aside className="def-box">
        <strong>Extrapolation</strong>
        Wenn der Reglerpunkt außerhalb der Trainings-Cloud liegt, rät
        das Modell über den gelernten Bereich hinaus. Die Ausgabe sieht
        weiter plausibel aus, ist aber nicht mehr verlässlich.
      </aside>

      <h2>Den Fehler lesen, zwei Ursachen</h2>
      <p>
        Ein hoher Fehler ist kein Zufall. Er hat zwei Quellen.
      </p>
      <p>
        <strong>Ursache 1: außerhalb des Gelernten.</strong> Innerhalb
        des Trainingsbereichs interpoliert das Modell, der Fehler
        bleibt klein und stabil. Außerhalb wechselt es unbemerkt in den
        Extrapolations-Modus. Die Fehlerkarte unten zeigt das räumlich:
        schieb die Slider und beobachte, wo es rot wird.
      </p>
      <ErrorHeatmap />
      <p>
        <strong>Ursache 2: zu wenige Moden.</strong> Der FNO behält nur
        die ersten <code>k</code> Fourier-Moden (siehe Kapitel 4 und 6).
        Funktionen mit scharfen Schockfronten brauchen gerade diese
        hohen Frequenzen. Was nicht im Frequenzraum darstellbar ist,
        kann der FNO nicht vorhersagen, egal wie lange trainiert wird.
      </p>

      <aside className="def-box">
        <strong>Cutoff-Maske</strong>
        Die Architektur-Stelle im FNO, an der hohe Frequenzen
        abgeschnitten werden. Drüber hinaus kann das Modell prinzipiell
        nichts mehr darstellen.
      </aside>

      <h2>Was sich in 2D ändert</h2>
      <p>
        Bisher hast du nur 1D gesehen. In zwei Dimensionen kommt
        einiges dazu, das die Grenzen aus dem letzten Abschnitt
        verstärkt.
      </p>
      <ul className="dim-jump">
        <li>
          <strong>Mehrere Felder gleichzeitig.</strong> Eine
          2D-Strömung hat nicht nur eine Größe, sondern z. B. Dichte,
          Druck und zwei Geschwindigkeits-Komponenten. Vier gekoppelte
          Felder müssen gemeinsam vorhergesagt werden.
        </li>
        <li>
          <strong>Speicher wird knapp.</strong> Ein 128 × 128-Gitter
          hat 16-mal so viele Punkte wie ein 1D-Gitter mit 1024
          Punkten. Bei 512 × 512 (turbulente Strömung) muss der Batch
          auf 1 reduziert werden, damit es überhaupt rechnet.
        </li>
        <li>
          <strong>Mehr Modes hilft nicht immer.</strong> In komplexen
          2D-Strömungen kann eine höhere Modenzahl sogar schlechter
          werden, weil die Modes auf Frequenzbänder verteilt werden, in
          denen kaum Information liegt. Die Modenzahl muss zur
          Frequenz-Verteilung des Problems passen.
        </li>
      </ul>
      <p>
        Genau diese Überraschungen siehst du gleich im Notebook als
        Vergleich der vier Datensatz-Familien: eine in 1D (sauber),
        drei in 2D (komplizierter, mit Anomalie).
      </p>

      <h2>Limitationen mit dem Tutor durchgehen</h2>
      <p>
        Lass dir vom Tutor erklären, welche Klassen von Grenzen in einen
        seriösen Übergabe-Bericht gehören, damit deine Auswahl im
        Abschluss methodisch sitzt.
      </p>
      <ChatTrigger
        mode="tutor"
        question={LIMITS_TUTOR_PROMPT}
        label="Übergabe-Limitationen erklären lassen"
      />

      <h2>Abschluss · Deine Notiz für AeroDyn</h2>
      <p>
        Schreib in eigenen Worten. Der Tutor wertet deine Antwort
        individuell aus, du kannst sie überarbeiten und erneut einreichen.
        Die akzeptierte Notiz landet im Project Archive als Teil des
        Übergabe-Berichts.
      </p>
      <OpenQuestion
        question={ABSCHLUSS_FRAGE}
        chapter={7}
        decisionId="k7-handover"
        onAccepted={handleDecisionAccepted}
      />

      {done && (
        <div className="chapter-done">
          <div>
            <div className="chapter-done-headline">
              Kapitel 7 abgeschlossen · +200 CC
            </div>
            <div className="chapter-done-sub">
              Kapitel 8 ist in der Seitenleiste freigeschaltet.
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => setView({ type: "chapter", id: 8 })}
          >
            Weiter zu Kapitel 8
          </button>
        </div>
      )}
    </div>
  );
}
