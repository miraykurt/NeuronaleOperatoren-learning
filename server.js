import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const PLACEHOLDER_KEY = "sk-PLATZHALTER";
const hasRealKey =
  !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== PLACEHOLDER_KEY;

const MAX_HISTORY = 20;

const app = express();

// Hinter Reverse-Proxy (nginx etc.) korrekte Client-IPs für Rate-Limit
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const client = hasRealKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const modes = {
  tutor:
    "Beantworte Fragen mit Rückbezug auf vorherige Einheiten und die aktuelle Visualisierung. Sei klar und konkret.",
  debug:
    "Der Nutzer hat eine Fehlermeldung. Analysiere sie spezifisch für den vorbereiteten PyTorch/JupyterLite-Stack und gib konkrete Lösungsschritte.",
  sokrates:
    "Stelle Gegenfragen statt direkter Antworten. Führe den Nutzer durch eigenes Nachdenken zur Erkenntnis.",
  evaluate:
    "Du erhältst eine offene Frage und die Antwort eines Lernenden. Bewerte wohlwollend, aber präzise. Strukturiere die Rückmeldung in drei kurze Absätze: (1) was sitzt schon, nenne ein konkretes Detail. (2) was fehlt oder ist unscharf, höchstens zwei Punkte. (3) ein knapper Tipp zur Vertiefung. Halte dich an 4 bis 6 Sätze insgesamt. Sprich den Lernenden direkt an. Keine Punkte- oder Notenvergabe.",
};

const chapterTopics = {
  1: "Einführung: Numerische Solver vs. Neuronale Netze. Erster Zeitvergleich.",
  2: "Rechenzeit-Problem: Gitter vs. Operator. Komplexität klassischer Verfahren.",
  3: "Operator-Konzept: Klassisches NN vs. Neuronaler Operator (gitterunabhängig).",
  4: "Fourier Neural Operator: Architektur, Frequenz-Cutoff, Vergleich mit CNN/MLP.",
  5: "PDEBench: Standardisierte Trainingsdaten für neuronale Operatoren.",
  6: "Parameter-Einstellung & Live-Vergleich FNO vs. klassischer Solver.",
  7: "Fehleranalyse: Genauigkeit, Extrapolation, PINNs-Ausblick.",
  8: "Code & JupyterLite: PyTorch-Implementierung, Docker-Verbindung, Notebook-Aufgaben.",
};

function buildSystemPrompt({ chapter, mode, state }) {
  const modeInstr = modes[mode] ?? modes.tutor;
  const topic = chapterTopics[chapter] ?? "Allgemeiner Lernkontext.";

  const stateParts = [];
  if (state?.completedChapters?.length)
    stateParts.push(`Abgeschlossene Kapitel: ${state.completedChapters.join(", ")}`);
  if (state?.level) stateParts.push(`Level: ${state.level}`);
  if (state?.ccBalance != null) stateParts.push(`CC-Saldo: ${state.ccBalance}`);
  if (state?.lastSliders && Object.keys(state.lastSliders).length)
    stateParts.push(`Letzte Slider: ${JSON.stringify(state.lastSliders)}`);
  if (state?.lastError) stateParts.push(`Letzte Fehlermeldung: ${state.lastError}`);

  const stateBlock = stateParts.length
    ? `\n\nAktueller Zustand des Lernenden:\n${stateParts.join("\n")}`
    : "";

  return `Du bist der KI-Tutor in einer interaktiven Lerneinheit zu Neuronalen Operatoren und Fourier Neural Operators (FNO) im Kontext des fiktiven Ingenieurbüros "FieldSolve Engineering".

AUFTRAG
${modeInstr}

KAPITEL ${chapter}: ${topic}${stateBlock}

Antworte auf Deutsch. Halte die Antwort knapp und konkret (2 bis 5 Sätze), außer der Modus verlangt mehr. Du bist keine bestimmte Figur. Die vier Kolleg:innen (Priya, Tobias, Amara, Lena) sind separate Charaktere in der Seitenleiste und nicht Teil dieses Chats.`;
}

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Anfragen — bitte 1 Minute warten." },
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages-Array fehlt oder leer" });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user" || !lastMessage.content) {
      return res
        .status(400)
        .json({ error: "Letzte Nachricht muss role=user mit content sein" });
    }

    const { chapter = 1, mode = "tutor", state } = context;

    if (!hasRealKey) {
      const reply = `[Platzhalter-Tutor-Antwort] Der OPENAI_API_KEY in .env ist noch nicht gesetzt. Deine Nachricht war: "${lastMessage.content}"`;
      return res.json({ reply, placeholder: true });
    }

    const trimmedHistory = messages
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt({ chapter, mode, state }),
        },
        ...trimmedHistory,
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Chat-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: hasRealKey });
});

// In Production: gebauten Frontend ausliefern (npm run build → dist/)
const distPath = path.join(__dirname, "dist");
const hasDist = fs.existsSync(distPath);

if (hasDist) {
  app.use(express.static(distPath));
  // SPA-Fallback: alle Nicht-API GET-Requests bekommen index.html
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api/") &&
      req.accepts("html")
    ) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      next();
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(
    `OpenAI-Key: ${hasRealKey ? "geladen" : "Platzhalter (Fake-Antworten)"}`,
  );
  if (hasDist) {
    console.log(`Frontend wird aus ./dist/ ausgeliefert`);
  } else {
    console.log(
      `Hinweis: ./dist/ nicht gefunden — für Production zuerst \`npm run build\` ausführen.`,
    );
  }
});
