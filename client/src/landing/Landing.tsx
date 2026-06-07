import { useAppStore } from "../state/store";

interface Colleague {
  name: string;
  role: string;
  blurb: string;
}

const COLLEAGUES: Colleague[] = [
  {
    name: "Dr. Priya Nair",
    role: "Leiterin Simulation",
    blurb: "Quittiert deine abgeschlossenen Kapitel mit einem kurzen Kommentar.",
  },
  {
    name: "Lena Kaufmann",
    role: "Project Manager",
    blurb: "Erinnert dich beim Einstieg in ein neues Kapitel an die anstehende Deadline.",
  },
  {
    name: "Amara Diallo",
    role: "Junior Engineer",
    blurb: "Gratuliert zu jedem Achievement und baut dich nach falschen Antworten wieder auf.",
  },
  {
    name: "Tobias Brenner",
    role: "IT & DevOps",
    blurb: "Schaltet sich ein, wenn dein Notebook streikt.",
  },
];

export function Landing() {
  const start = useAppStore((s) => s.start);
  const hasProgress = useAppStore(
    (s) => s.completedChapters.length > 0 || s.ccBalance > 0,
  );
  const ctaLabel = hasProgress ? "Weitermachen" : "Loslegen";

  return (
    <div className="landing">
      <div className="landing-inner">
        <header className="landing-hero">
          <div className="landing-eyebrow">FieldSolve Engineering</div>
          <h1 className="landing-title">Neuronale Operatoren</h1>
          <p className="landing-welcome">Willkommen bei FieldSolve.</p>
          <p className="landing-leadin">
            Lern neuronale Operatoren am echten Projektauftrag kennen
          </p>
          <p className="landing-time">8 Kapitel · ca. 90 Minuten</p>
        </header>

        <section className="landing-section">
          <h2>So navigierst du</h2>
          <p>
            Drei Bereiche stehen dir zur Verfügung:
          </p>

          
          <div className="guide-grid">
            <div className="guide-block">
              <div className="guide-block-eyebrow">Links · Sidebar</div>
              <div className="guide-block-title">Lernpfad & Team</div>
              <p>
                8 Kapitel werden nacheinander freigeschaltet. 
                Neue Kapitel öffnen sich nach dem Abschluss-Check des vorherigen.
              </p>
              <p>
                Unter anderem begleiten dich vier Kolleg:innen kontextabhängig durch den Lernpfad.
              </p>
            </div>
            <div className="guide-block">
              <div className="guide-block-eyebrow">Oben · Toolbar</div>
              <div className="guide-block-title">Räume</div>
              <ul className="guide-rooms">
                <li>
                  <strong>Workstation</strong>: Missionen
                </li>
                <li>
                  <strong>Simulation Lab</strong>: Experimente 
                </li>
                <li>
                  <strong>Library</strong>: Wissensdatenbank 
                </li>
                <li>
                  <strong>Notebook</strong>: Live-Notebook 
                </li>
                <li>
                  <strong>Trophy Room</strong>: Achievements
                </li>
                <li>
                  <strong>Archive</strong>: Projekt-Akte 
                </li>
              </ul>
            </div>
            <div className="guide-block">
              <div className="guide-block-eyebrow">Unten rechts · Chat</div>
              <div className="guide-block-title">Tutor-Bot</div>
              <p>
                Klick auf den Tutor-Button öffnet ein Chat-Fenster mit{" "}
                <strong>drei Modi</strong>: Tutor, Debug, Sokrates. Der Bot kennt dein aktuelles
                Kapitel und deinen CC-Stand.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <h2>Dein Auftrag</h2>
          <p>
            Du bist neu als <strong>Junior Simulation Engineer</strong> bei
            FieldSolve Engineering, einem Ingenieurbüro für numerische
            Strömungs- und Struktursimulationen. Als erster KI-Ingenieur im Team sollst du prüfen, ob neuronale Operatoren klassische Simulationen sinnvoll ergänzen oder teilweise ersetzen können.
          </p>
          <p>
            <strong>Die Aufgabe:</strong> Einen neuronalen Operator trainieren,
            validieren und am Ende dem Kunden übergeben. Jedes Kapitel begleitet einen weiteren Projektschritt und schließt mit einer praktischen Aufgabe ab.
          </p>
        </section>

        <section className="landing-section">
          <h2>Wie es funktioniert</h2>
          <ul className="landing-mechanics">
            <li>
              <strong>Workstation</strong>: Hier siehst du deinen aktuellen
              Projektstand, die aktive Projektphase, offene Aufgaben und
              deine verfügbaren Compute Credits.
            </li>
            <li>
              <strong>Interaktive Visualisierungen</strong>: Jedes Kapitel hat
              Schieberegler, Heatmaps, animierte Zerlegungen oder eigene
              Eingaben. Erst selbst experimentieren, dann erklären lassen.
            </li>
            <li>
              <strong>Compute Credits</strong>: Credits erhältst du durch
              abgeschlossene Kapitel oder besondere Leistungen. Für bestimmte
              Aktionen und Projektfortschritte werden sie benötigt.
            </li>
            <li>
              <strong>Chatbot</strong>: Nutze den Tutor-Bot
              aktiv während des Projekts. Wenn dir Definitionen, Zusammenhänge
              oder mathematische Konzepte fehlen, frag nach. Der Bot ist auf
              den Lernpfad und deine aktuelle Situation abgestimmt.
            </li>
            <li>
              <strong>Projektverantwortung</strong>: Du bist nicht allein
              unterwegs. Trotzdem liegt der Erfolg des Projekts am Ende bei dir.
            </li>
          </ul>
        </section>

        <section className="landing-section">
          <h2>Deine Kolleg:innen</h2>
          <p>
            Die vier Kolleg:innen treten nicht in Gesprächen auf, sondern
            melden sich mit kurzen Kommentaren, wenn etwas Bestimmtes
            passiert.
          </p>

          <div className="landing-people">
            {COLLEAGUES.map((p) => (
              <div key={p.name} className="person-card">
                <div className="person-name">{p.name}</div>
                <div className="person-role">{p.role}</div>
                <div className="person-blurb">{p.blurb}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section landing-final">
          <h2>Bereit?</h2>
          <p>
            Du kannst jederzeit zurück, deinen Fortschritt zurücksetzen oder
            durch fertige Kapitel re-navigieren. Dein Stand bleibt automatisch
            erhalten.
          </p>
          <button className="landing-cta landing-cta-large" onClick={start}>
            {ctaLabel}
          </button>
        </section>
      </div>
    </div>
  );
}
