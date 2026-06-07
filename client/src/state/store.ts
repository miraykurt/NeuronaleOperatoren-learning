import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterId } from "../chatbot/characters";
import type { ChatMode } from "../chatbot/modes";
import {
  pick,
  PRIYA_AT_CHAPTER_DONE,
  PRIYA_AT_QUIZ_CORRECT,
  PRIYA_AT_MODES_HIGH,
  AMARA_AT_ACHIEVEMENT,
  AMARA_AT_QUIZ_WRONG,
  AMARA_AT_QUIZ_STUCK,
  TOBIAS_AT_KAPITEL_8,
  TOBIAS_AT_NOTEBOOK_ERROR,
  TOBIAS_AT_GRID_HIGH,
  TOBIAS_AT_GRID_LOW,
  LENA_AT_CHAPTER_ENTRY,
  LENA_AT_RETURN,
  LENA_AT_NOTEBOOK_DONE,
} from "./messageTemplates";

export type Level =
  | "praktikant"
  | "junior"
  | "engineer"
  | "senior"
  | "lead"
  | "fellow";

export interface LevelDef {
  id: Level;
  label: string;
  threshold: number;
}

export const LEVELS: LevelDef[] = [
  { id: "praktikant", label: "Praktikant:in", threshold: 0 },
  { id: "junior", label: "Junior Engineer", threshold: 200 },
  { id: "engineer", label: "Simulation Engineer", threshold: 500 },
  { id: "senior", label: "Senior Engineer", threshold: 900 },
  { id: "lead", label: "Lead Engineer", threshold: 1300 },
  { id: "fellow", label: "FieldSolve Fellow", threshold: 1800 },
];

export function levelForCC(cc: number): Level {
  let result: Level = "praktikant";
  for (const l of LEVELS) {
    if (cc >= l.threshold) result = l.id;
  }
  return result;
}

export function nextLevelInfo(cc: number): {
  current: LevelDef;
  next: LevelDef | null;
  progress: number;
  remaining: number;
} {
  const currentId = levelForCC(cc);
  const idx = LEVELS.findIndex((l) => l.id === currentId);
  const current = LEVELS[idx];
  if (idx === LEVELS.length - 1) {
    return { current, next: null, progress: 1, remaining: 0 };
  }
  const next = LEVELS[idx + 1];
  const progress = (cc - current.threshold) / (next.threshold - current.threshold);
  return { current, next, progress, remaining: next.threshold - cc };
}

export type AchievementCategory =
  | "milestone"
  | "engagement"
  | "depth"
  | "speed"
  | "secret";

export type AchievementTier = "bronze" | "silver" | "gold";

export interface AchievementProgress {
  current: number;
  total: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  hint: string;
  cc: number;
  category: AchievementCategory;
  tier: AchievementTier;
  secret?: boolean;
  progress?: (state: AppState) => AchievementProgress | null;
}

export const ACHIEVEMENT_CATEGORY_LABEL: Record<AchievementCategory, string> = {
  milestone: "Meilensteine",
  engagement: "Engagement",
  depth: "Tiefe",
  speed: "Lerntempo",
  secret: "Geheim",
};

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  first_step: {
    id: "first_step",
    name: "Erster Schritt",
    description: "Kapitel 1 abgeschlossen.",
    hint: "Schließe Kapitel 1 ab.",
    cc: 30,
    category: "milestone",
    tier: "bronze",
  },
  halftime: {
    id: "halftime",
    name: "Halbzeit",
    description: "Vier von acht Kapiteln abgeschlossen.",
    hint: "Komm bis Kapitel 4.",
    cc: 100,
    category: "milestone",
    tier: "silver",
    progress: (s) => ({
      current: Math.min(4, s.completedChapters.length),
      total: 4,
    }),
  },
  complete: {
    id: "complete",
    name: "Projekt übergeben",
    description: "Alle acht Kapitel abgeschlossen. Projekt an den Kunden übergeben.",
    hint: "Erst sichtbar, wenn alle Kapitel durch sind.",
    cc: 250,
    category: "milestone",
    tier: "gold",
    secret: true,
  },
  first_contact: {
    id: "first_contact",
    name: "Erstkontakt",
    description: "Erste Nachricht an den Tutor gestellt.",
    hint: "Stelle dem Tutor unten rechts deine erste Frage.",
    cc: 20,
    category: "engagement",
    tier: "bronze",
  },
  sokrates: {
    id: "sokrates",
    name: "Sokratischer Geist",
    description: "Sokrates-Modus im Chat aktiviert.",
    hint: "Wechsle den Chat-Modus auf Sokrates.",
    cc: 20,
    category: "engagement",
    tier: "bronze",
  },
  character_collector: {
    id: "character_collector",
    name: "Vollständiges Team",
    description: "Alle vier Kolleg:innen haben sich mindestens einmal gemeldet.",
    hint: "Arbeite dich durch die Kapitel, alle Kolleg:innen melden sich kontextsensitiv.",
    cc: 80,
    category: "engagement",
    tier: "gold",
    progress: (s) => ({
      current: s.metCharacters.length,
      total: 4,
    }),
  },
  grid_master: {
    id: "grid_master",
    name: "Grid-Master:in",
    description: "Simulation bei 128×128 Auflösung gestartet.",
    hint: "Schieb den Slider in der Zeitvergleichs-Demo auf 128.",
    cc: 30,
    category: "depth",
    tier: "silver",
  },
  spectral_diver: {
    id: "spectral_diver",
    name: "Spektral-Taucher:in",
    description:
      "Alle drei Cutoff-Slider (Fourier-Moden, FNO-Cutoff, Mode-Lens) mindestens einmal bedient.",
    hint:
      "Spiel an den Frequenz-Cutoffs in Kapitel 4 und in der Mode-Lens-Visualisierung.",
    cc: 50,
    category: "depth",
    tier: "silver",
    progress: (s) => {
      const targets = ["fourier_modes", "fno_cutoff", "modelens_cutoff"];
      const hits = targets.filter((k) =>
        Object.prototype.hasOwnProperty.call(s.lastSliders, k),
      ).length;
      return { current: hits, total: targets.length };
    },
  },
  config_builder: {
    id: "config_builder",
    name: "Setup-Architekt:in",
    description:
      "Eigene Gitter-Konfiguration zusammengestellt: Größe und Dimension selbst gewählt.",
    hint: "Stell in 'Eigene Gittergröße' (Kapitel 2) beide Slider ein.",
    cc: 40,
    category: "depth",
    tier: "silver",
    progress: (s) => {
      const targets = ["custom_grid_n", "custom_grid_dim"];
      const hits = targets.filter((k) =>
        Object.prototype.hasOwnProperty.call(s.lastSliders, k),
      ).length;
      return { current: hits, total: targets.length };
    },
  },
  quick_thinker: {
    id: "quick_thinker",
    name: "Schnelldenker:in",
    description: "Abschluss-Quiz beim ersten Versuch korrekt beantwortet.",
    hint: "Beantworte ein Quiz beim ersten Klick richtig.",
    cc: 50,
    category: "speed",
    tier: "silver",
  },
  quick_streak: {
    id: "quick_streak",
    name: "Drei in Serie",
    description: "Drei Quizze hintereinander beim ersten Versuch korrekt.",
    hint: "Beantworte drei Quizze ohne Fehlklick in Folge.",
    cc: 60,
    category: "speed",
    tier: "silver",
    progress: (s) => ({
      current: Math.min(3, s.firstTryStreak),
      total: 3,
    }),
  },
  room_explorer: {
    id: "room_explorer",
    name: "Erkundungsdrang",
    description:
      "Simulation Lab, Library, Notebook Terminal und Trophy Room besucht.",
    hint: "Schau dich in den vier Nebenräumen um.",
    cc: 80,
    category: "engagement",
    tier: "silver",
    progress: (s) => {
      const targets = ["lab", "library", "notebook", "trophy"];
      const hits = targets.filter((r) => s.visitedRooms.includes(r)).length;
      return { current: hits, total: targets.length };
    },
  },
};

const EXPLORATION_ROOMS = ["lab", "library", "notebook", "trophy"] as const;

interface SliderReactionRule {
  direction: "high" | "low";
  threshold: number;
  character: CharacterId;
  pool: readonly string[];
}

const SLIDER_REACTIONS: Record<string, SliderReactionRule[]> = {
  gridzoom_n: [
    { direction: "high", threshold: 128, character: "tobias", pool: TOBIAS_AT_GRID_HIGH },
    { direction: "low", threshold: 16, character: "tobias", pool: TOBIAS_AT_GRID_LOW },
  ],
  timecompare_grid: [
    { direction: "high", threshold: 128, character: "tobias", pool: TOBIAS_AT_GRID_HIGH },
  ],
  custom_grid_n: [
    { direction: "high", threshold: 128, character: "tobias", pool: TOBIAS_AT_GRID_HIGH },
  ],
  draw_predict_res: [
    { direction: "high", threshold: 128, character: "tobias", pool: TOBIAS_AT_GRID_HIGH },
  ],
  fourier_modes: [
    { direction: "high", threshold: 8, character: "priya", pool: PRIYA_AT_MODES_HIGH },
  ],
  fno_cutoff: [
    { direction: "high", threshold: 16, character: "priya", pool: PRIYA_AT_MODES_HIGH },
  ],
  modelens_cutoff: [
    { direction: "high", threshold: 16, character: "priya", pool: PRIYA_AT_MODES_HIGH },
  ],
};

const INACTIVITY_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 Tage

export type Toast =
  | { id: string; type: "cc"; amount: number; reason?: string }
  | { id: string; type: "achievement"; achievementId: string }
  | { id: string; type: "level"; levelId: Level };

let toastSeq = 0;
function makeToastId(): string {
  return `t-${Date.now()}-${++toastSeq}`;
}

export type View =
  | { type: "room"; id: string }
  | { type: "chapter"; id: number };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  character?: CharacterId;
  ts: number;
}

export interface CharacterBubble {
  text: string;
  ts: number;
}

export interface CharacterFeedItem {
  id: string;
  characterId: CharacterId;
  text: string;
  ts: number;
  firstMeet: boolean;
}

export interface AppState {
  hasStarted: boolean;
  currentView: View;
  completedChapters: number[];
  ccBalance: number;
  level: Level;
  achievements: string[];

  lastSliders: Record<string, number>;
  lastNotebookError: string | null;
  visitedRooms: string[];
  firstTryStreak: number;
  triggeredSliderReactions: string[];
  lastSessionAt: number | null;
  userNotes: string;
  projectDecisions: Record<string, string[]>;
  projectRetro: Record<string, string>;

  chatOpen: boolean;
  chatMaximized: boolean;
  chatMode: ChatMode;
  chatMessages: ChatMessage[];
  chatPendingMessage: string | null;

  characterMessages: Partial<Record<CharacterId, CharacterBubble>>;
  characterFeed: CharacterFeedItem[];
  metCharacters: CharacterId[];

  toasts: Toast[];

  start: () => void;
  setView: (view: View) => void;
  completeChapter: (n: number) => void;
  earnCC: (amount: number, reason?: string) => void;
  markNotebookExplored: () => void;
  unlockAchievement: (id: string) => void;
  setSlider: (key: string, value: number) => void;
  setNotebookError: (err: string | null) => void;
  setUserNotes: (text: string) => void;
  clearUserNotes: () => void;
  setProjectDecision: (id: string, picks: string[]) => void;
  setRetroAnswer: (key: string, value: string) => void;
  reportQuizWrong: () => void;
  reportQuizCorrect: (firstTry: boolean) => void;
  reportQuizStuck: () => void;

  toggleChat: () => void;
  toggleChatMaximized: () => void;
  setChatMode: (m: ChatMode) => void;
  appendChatMessage: (m: ChatMessage) => void;
  clearChatMessages: () => void;
  triggerChat: (mode: ChatMode, question: string) => void;
  consumePendingMessage: () => void;

  pushCharacterMessage: (c: CharacterId, text: string) => void;
  clearCharacterMessage: (c: CharacterId) => void;
  clearCharacterFeed: () => void;

  pushToast: (t: Omit<Toast, "id"> & { id?: string }) => void;
  dismissToast: (id: string) => void;

  reset: () => void;
}

const initialState = {
  hasStarted: false,
  currentView: { type: "room", id: "workstation" } as View,
  completedChapters: [] as number[],
  ccBalance: 0,
  level: "praktikant" as Level,
  achievements: [] as string[],
  lastSliders: {} as Record<string, number>,
  lastNotebookError: null as string | null,
  visitedRooms: [] as string[],
  firstTryStreak: 0,
  triggeredSliderReactions: [] as string[],
  lastSessionAt: null as number | null,
  userNotes: "",
  projectDecisions: {} as Record<string, string[]>,
  projectRetro: {} as Record<string, string>,
  chatOpen: false,
  chatMaximized: false,
  chatMode: "tutor" as ChatMode,
  chatMessages: [] as ChatMessage[],
  chatPendingMessage: null as string | null,
  characterMessages: {} as Partial<Record<CharacterId, CharacterBubble>>,
  characterFeed: [] as CharacterFeedItem[],
  metCharacters: [] as CharacterId[],
  toasts: [] as Toast[],
};

const MAX_FEED = 40;
let feedSeq = 0;
function makeFeedId(): string {
  return `cf-${Date.now()}-${++feedSeq}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: () => {
        const prev = get().lastSessionAt;
        const now = Date.now();
        set({ hasStarted: true, lastSessionAt: now });
        if (prev != null && now - prev > INACTIVITY_THRESHOLD_MS) {
          get().pushCharacterMessage("lena", pick(LENA_AT_RETURN));
        }
      },

      setView: (view) => {
        set({ currentView: view });
        if (view.type === "chapter") {
          // Lena meldet sich bei Deadlines / Deliverable-Phasen (Kap 5, 7, 8)
          const lena = LENA_AT_CHAPTER_ENTRY[view.id];
          if (lena) get().pushCharacterMessage("lena", pick(lena));
          // Tobias meldet sich bei Notebook-Einstieg (Kap 8)
          if (view.id === 8) {
            get().pushCharacterMessage("tobias", pick(TOBIAS_AT_KAPITEL_8));
          }
        }
        if (view.type === "room") {
          const s = get();
          const roomId = view.id;
          const isExploration = (EXPLORATION_ROOMS as readonly string[]).includes(
            roomId,
          );
          if (isExploration && !s.visitedRooms.includes(roomId)) {
            set({ visitedRooms: [...s.visitedRooms, roomId] });
            get().earnCC(10, `${roomId} zum ersten Mal besucht`);
            const visited = get().visitedRooms.filter((r) =>
              (EXPLORATION_ROOMS as readonly string[]).includes(r),
            ).length;
            if (visited >= EXPLORATION_ROOMS.length) {
              get().unlockAchievement("room_explorer");
            }
          }
        }
      },

      completeChapter: (n) => {
        set((s) =>
          s.completedChapters.includes(n)
            ? s
            : {
                completedChapters: [...s.completedChapters, n].sort(
                  (a, b) => a - b,
                ),
              },
        );
        if (n === 1) get().unlockAchievement("first_step");
        const total = get().completedChapters.length;
        if (total >= 4) get().unlockAchievement("halftime");
        if (total >= 8) get().unlockAchievement("complete");
        // Priya quittiert jeden Kapitelabschluss
        const pool = PRIYA_AT_CHAPTER_DONE[n];
        if (pool) get().pushCharacterMessage("priya", pick(pool));
      },

      markNotebookExplored: () => {
        // Signal nur als Story-Bubble — Kapitel-Abschluss läuft über das
        // Decision Panel in Kapitel 8.
        get().pushCharacterMessage("lena", pick(LENA_AT_NOTEBOOK_DONE));
      },

      earnCC: (amount, reason) => {
        const s = get();
        const newCC = s.ccBalance + amount;
        const newLevel = levelForCC(newCC);
        const updates: Partial<AppState> = { ccBalance: newCC };
        const newToasts: Toast[] = [
          ...s.toasts,
          { id: makeToastId(), type: "cc", amount, reason },
        ];
        if (newLevel !== s.level) {
          updates.level = newLevel;
          newToasts.push({
            id: makeToastId(),
            type: "level",
            levelId: newLevel,
          });
        }
        updates.toasts = newToasts;
        set(updates);
      },

      unlockAchievement: (id) => {
        const s = get();
        if (s.achievements.includes(id)) return;
        const ach = ACHIEVEMENTS[id];
        if (!ach) return;
        set({
          achievements: [...s.achievements, id],
          toasts: [
            ...s.toasts,
            { id: makeToastId(), type: "achievement", achievementId: id },
          ],
        });
        if (ach.cc > 0) {
          get().earnCC(ach.cc, ach.name);
        }
        // Amara feiert jedes Achievement (ohne fachlich tief zu gehen)
        const pool =
          AMARA_AT_ACHIEVEMENT[id] ?? AMARA_AT_ACHIEVEMENT.__fallback;
        get().pushCharacterMessage("amara", pick(pool));
      },

      setSlider: (key, value) => {
        set((s) => ({ lastSliders: { ...s.lastSliders, [key]: value } }));
        // Depth-Achievements: prüfen, ob durch diesen Slider-Touch eines
        // der Sets jetzt komplett ist.
        const cur = get();
        const spectralTargets = ["fourier_modes", "fno_cutoff", "modelens_cutoff"];
        if (
          spectralTargets.every((k) =>
            Object.prototype.hasOwnProperty.call(cur.lastSliders, k),
          )
        ) {
          get().unlockAchievement("spectral_diver");
        }
        const configTargets = ["custom_grid_n", "custom_grid_dim"];
        if (
          configTargets.every((k) =>
            Object.prototype.hasOwnProperty.call(cur.lastSliders, k),
          )
        ) {
          get().unlockAchievement("config_builder");
        }
        // Character-Reaktionen pro Slider-Extrem.
        const rules = SLIDER_REACTIONS[key];
        if (!rules) return;
        for (const rule of rules) {
          const dedupKey = `${key}:${rule.direction}`;
          if (cur.triggeredSliderReactions.includes(dedupKey)) continue;
          const hit =
            rule.direction === "high"
              ? value >= rule.threshold
              : value <= rule.threshold;
          if (!hit) continue;
          set((s) => ({
            triggeredSliderReactions: [...s.triggeredSliderReactions, dedupKey],
          }));
          get().pushCharacterMessage(rule.character, pick(rule.pool));
        }
      },

      setUserNotes: (text) => set({ userNotes: text }),

      clearUserNotes: () => set({ userNotes: "" }),

      setProjectDecision: (id, picks) =>
        set((s) => ({
          projectDecisions: { ...s.projectDecisions, [id]: picks },
        })),

      setRetroAnswer: (key, value) =>
        set((s) => ({
          projectRetro: { ...s.projectRetro, [key]: value },
        })),

      setNotebookError: (err) => {
        set({ lastNotebookError: err });
        if (err) {
          get().pushCharacterMessage("tobias", pick(TOBIAS_AT_NOTEBOOK_ERROR));
        }
      },

      reportQuizWrong: () => {
        set({ firstTryStreak: 0 });
        get().pushCharacterMessage("amara", pick(AMARA_AT_QUIZ_WRONG));
      },

      reportQuizCorrect: (firstTry) => {
        // Priya streut knappe Fach-Bestätigung (nicht bei jedem Quiz).
        if (Math.random() < 0.5) {
          get().pushCharacterMessage("priya", pick(PRIYA_AT_QUIZ_CORRECT));
        }
        if (firstTry) {
          const next = get().firstTryStreak + 1;
          set({ firstTryStreak: next });
          if (next >= 3) {
            get().unlockAchievement("quick_streak");
          }
        } else {
          set({ firstTryStreak: 0 });
        }
      },

      reportQuizStuck: () => {
        get().pushCharacterMessage("amara", pick(AMARA_AT_QUIZ_STUCK));
      },

      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

      toggleChatMaximized: () =>
        set((s) => ({ chatMaximized: !s.chatMaximized })),

      setChatMode: (m) => {
        set({ chatMode: m });
        if (m === "sokrates") get().unlockAchievement("sokrates");
      },

      appendChatMessage: (m) => {
        const s = get();
        set({ chatMessages: [...s.chatMessages, m] });
        if (m.role === "user") {
          get().unlockAchievement("first_contact");
        }
      },

      clearChatMessages: () => set({ chatMessages: [] }),

      triggerChat: (mode, question) => {
        set({
          chatMode: mode,
          chatOpen: true,
          chatPendingMessage: question,
        });
        if (mode === "sokrates") get().unlockAchievement("sokrates");
      },

      consumePendingMessage: () => set({ chatPendingMessage: null }),

      pushCharacterMessage: (c, text) => {
        const ts = Date.now();
        set((s) => {
          const firstMeet = !s.metCharacters.includes(c);
          const item: CharacterFeedItem = {
            id: makeFeedId(),
            characterId: c,
            text,
            ts,
            firstMeet,
          };
          return {
            characterMessages: {
              ...s.characterMessages,
              [c]: { text, ts },
            },
            characterFeed: [...s.characterFeed, item].slice(-MAX_FEED),
            metCharacters: firstMeet ? [...s.metCharacters, c] : s.metCharacters,
          };
        });
        if (get().metCharacters.length === 4) {
          get().unlockAchievement("character_collector");
        }
      },

      clearCharacterMessage: (c) =>
        set((s) => {
          const next = { ...s.characterMessages };
          delete next[c];
          return { characterMessages: next };
        }),

      clearCharacterFeed: () => set({ characterFeed: [] }),

      pushToast: (t) =>
        set((s) => ({
          toasts: [...s.toasts, { ...t, id: t.id ?? makeToastId() } as Toast],
        })),

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      reset: () => set(initialState),
    }),
    {
      name: "fieldsolve-state",
      version: 8,
      migrate: (persistedState, _version) => {
        const s = persistedState as
          | {
              chatMode?: string;
              visitedRooms?: string[];
              firstTryStreak?: number;
              triggeredSliderReactions?: string[];
              lastSessionAt?: number | null;
              chapterNotes?: Record<number, string>;
              userNotes?: string;
              projectDecisions?: Record<string, string[]>;
              projectRetro?: Record<string, string>;
            }
          | null;
        if (s && typeof s === "object") {
          if (s.chatMode) {
            const valid = ["tutor", "debug", "sokrates"];
            if (!valid.includes(s.chatMode)) {
              s.chatMode = "tutor";
            }
          }
          if (!Array.isArray(s.visitedRooms)) s.visitedRooms = [];
          if (typeof s.firstTryStreak !== "number") s.firstTryStreak = 0;
          if (!Array.isArray(s.triggeredSliderReactions)) {
            s.triggeredSliderReactions = [];
          }
          if (typeof s.lastSessionAt !== "number") s.lastSessionAt = null;
          if (typeof s.userNotes !== "string") {
            // Alte per-Kapitel-Notizen in eine einzige Notiz zusammenführen,
            // damit nichts verloren geht.
            const old = s.chapterNotes;
            if (old && typeof old === "object") {
              const merged = Object.entries(old)
                .filter(([, v]) => typeof v === "string" && v.trim().length > 0)
                .map(([k, v]) => `Kapitel ${k}:\n${v}`)
                .join("\n\n");
              s.userNotes = merged;
            } else {
              s.userNotes = "";
            }
          }
          delete s.chapterNotes;
          if (s.projectDecisions == null || typeof s.projectDecisions !== "object") {
            s.projectDecisions = {};
          }
          if (s.projectRetro == null || typeof s.projectRetro !== "object") {
            s.projectRetro = {};
          }
        }
        return s as AppState;
      },
      partialize: (state) => {
        const {
          toasts: _toasts,
          hasStarted: _hasStarted,
          characterMessages: _cm,
          ...rest
        } = state;
        return rest;
      },
    },
  ),
);
