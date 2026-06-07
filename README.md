# Lerneinheit 3 — Neuronale Operatoren

Interaktive Lernumgebung zu **Fourier Neural Operators (FNO)** und **PDEBench**,
eingebettet ins Szenario „FieldSolve Engineering". Teil einer Bachelor-Arbeit.

## Setup

```bash
npm install
echo "OPENAI_API_KEY=sk-DEIN-KEY" > .env   # oder Platzhalter → Fake-Antworten
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend:  <http://localhost:3000>

Vite proxyt `/api/*` automatisch an Express.

## Production-Build

```bash
npm install --omit=dev
npm run build         # → ./dist/
npm start             # Express liefert API + dist/ unter :3000
```

## Stand

**Kapitel 1–5 fertig.** Kapitel 6–8 werden noch überarbeitet (Inhalte,
Decisions, Notebook-Anbindung).

## Stack

Vite · React 18 · TypeScript · zustand · Express · OpenAI `gpt-4o-mini`
