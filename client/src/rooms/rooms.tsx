import type { ReactNode } from "react";

export type RoomId =
  | "workstation"
  | "lab"
  | "library"
  | "notebook"
  | "trophy"
  | "archive";

export interface RoomDef {
  id: RoomId;
  label: string;
  blurb: string;
  icon: ReactNode;
  unlockAtChapter?: number;
  unlockOnAchievement?: boolean;
  unlockAtEnd?: boolean;
}

const SVG_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ROOM_ICONS: Record<RoomId, ReactNode> = {
  workstation: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="12" y1="16" x2="12" y2="20" />
    </svg>
  ),
  lab: (
    <svg {...SVG_PROPS}>
      <path d="M9 3v6L4.2 17.5A1.7 1.7 0 005.7 20h12.6a1.7 1.7 0 001.5-2.5L15 9V3" />
      <line x1="8" y1="3" x2="16" y2="3" />
      <circle cx="11" cy="15" r="0.8" fill="currentColor" />
      <circle cx="14" cy="17" r="0.6" fill="currentColor" />
    </svg>
  ),
  library: (
    <svg {...SVG_PROPS}>
      <path d="M4 4h5a2 2 0 012 2v14a2 2 0 00-2-2H4z" />
      <path d="M20 4h-5a2 2 0 00-2 2v14a2 2 0 012-2h5z" />
    </svg>
  ),
  notebook: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <polyline points="7,10 10,12 7,14" />
      <line x1="13" y1="14" x2="17" y2="14" />
    </svg>
  ),
  trophy: (
    <svg {...SVG_PROPS}>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
      <path d="M10 21h4M12 17v4" />
      <path d="M8 6H4v2a3 3 0 003 3M16 6h4v2a3 3 0 01-3 3" />
    </svg>
  ),
  archive: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="5" width="18" height="4" rx="0.5" />
      <path d="M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  ),
};

export const ROOMS: RoomDef[] = [
  {
    id: "workstation",
    label: "Workstation",
    blurb: "Mission, Auftrag, Team-Feed und Karriere: dein Schreibtisch",
    icon: ROOM_ICONS.workstation,
  },
  {
    id: "lab",
    label: "Simulation Lab",
    blurb: "Alle Plots dauerhaft zugänglich · Parameterkarte",
    icon: ROOM_ICONS.lab,
    unlockAtChapter: 2,
  },
  {
    id: "library",
    label: "Library",
    blurb: "Wissensdatenbank: füllt sich pro abgeschlossenem Kapitel",
    icon: ROOM_ICONS.library,
    unlockAtChapter: 3,
  },
  {
    id: "notebook",
    label: "Notebook Terminal",
    blurb: "JupyterLite-Notebook eingebettet",
    icon: ROOM_ICONS.notebook,
    unlockAtChapter: 8,
  },
  {
    id: "trophy",
    label: "Trophy Room",
    blurb: "Freigeschaltete Achievements",
    icon: ROOM_ICONS.trophy,
    unlockOnAchievement: true,
  },
  {
    id: "archive",
    label: "Project Archive",
    blurb: "Fertige Projekt-Akte · PDF-Export",
    icon: ROOM_ICONS.archive,
    unlockAtEnd: true,
  },
];

export interface UnlockInput {
  completedChapters: number[];
  achievements: string[];
}

export function isRoomUnlocked(
  r: RoomDef,
  { completedChapters, achievements }: UnlockInput,
): boolean {
  if (r.unlockAtChapter != null) {
    const maxDone = completedChapters.length
      ? Math.max(...completedChapters)
      : 0;
    return maxDone >= r.unlockAtChapter - 1;
  }
  if (r.unlockOnAchievement) return achievements.length > 0;
  if (r.unlockAtEnd) return completedChapters.length === 8;
  return true;
}

export function roomById(id: string): RoomDef | undefined {
  return ROOMS.find((r) => r.id === id);
}
