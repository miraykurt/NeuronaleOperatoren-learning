export type CharacterId = "priya" | "tobias" | "amara" | "lena";

export const CHARACTER_IDS: readonly CharacterId[] = [
  "priya",
  "tobias",
  "amara",
  "lena",
];

export interface Character {
  id: CharacterId;
  name: string;
  shortName: string;
  role: string;
  personality: string;
  avatarUrl: string;
  appearsFromChapter: number;
}

const AVATAR_STYLE = "notionists";

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${seed}&backgroundColor=243156&radius=50`;
}

export const characters: Record<CharacterId, Character> = {
  priya: {
    id: "priya",
    name: "Dr. Priya Nair",
    shortName: "Priya",
    role: "Leiterin Simulation",
    personality:
      "Präzise, kurz, trocken. Lobt selten, aber wenn, dann ehrlich.",
    avatarUrl: avatarUrl("priya-nair-engineering"),
    appearsFromChapter: 1,
  },
  tobias: {
    id: "tobias",
    name: "Tobias Brenner",
    shortName: "Tobias",
    role: "IT & DevOps",
    personality:
      "Knapp, leicht sarkastisch. Schreibt Befehle direkt in den Chat.",
    avatarUrl: avatarUrl("tobias-brenner-devops"),
    appearsFromChapter: 8,
  },
  amara: {
    id: "amara",
    name: "Amara Diallo",
    shortName: "Amara",
    role: "Junior Engineer",
    personality:
      "Locker, ermutigend. Teilt eigene frühere Fehler und Aha-Momente.",
    avatarUrl: avatarUrl("amara-diallo-junior"),
    appearsFromChapter: 2,
  },
  lena: {
    id: "lena",
    name: "Lena Kaufmann",
    shortName: "Lena",
    role: "Project Manager",
    personality: "Freundlich aber direkt. Denkt in Deliverables und Deadlines.",
    avatarUrl: avatarUrl("lena-kaufmann-pm"),
    appearsFromChapter: 5,
  },
};
