// Typsicherer Zugriff auf den kleinen Burgers-1D-Datensatz, der per
// scripts/generate-burgers-data.mjs erzeugt wird.

export interface BurgersSample {
  id: string;
  seed: number;
  visc: number;
  T: number;
  N: number;
  ic: number[];
  solution: number[];
}

export interface BurgersDataset {
  name: string;
  description: string;
  equation: string;
  spatialResolution: number;
  domain: [number, number];
  boundaryConditions: string;
  solver: string;
  generatedAt: string;
  count: number;
  samples: BurgersSample[];
}

let cache: BurgersDataset | null = null;

export async function loadBurgersDataset(): Promise<BurgersDataset> {
  if (cache) return cache;
  const res = await fetch("/data/burgers-small.json");
  if (!res.ok) {
    throw new Error(
      `Burgers-Datensatz konnte nicht geladen werden: ${res.status}`,
    );
  }
  const data = (await res.json()) as BurgersDataset;
  cache = data;
  return data;
}

// Hilfsfunktionen für Konsumenten

export function findSample(
  data: BurgersDataset,
  visc: number,
  T: number,
): BurgersSample | undefined {
  return data.samples.find(
    (s) => Math.abs(s.visc - visc) < 1e-6 && Math.abs(s.T - T) < 1e-6,
  );
}

export function nearestSample(
  data: BurgersDataset,
  visc: number,
  T: number,
): BurgersSample {
  let best = data.samples[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const s of data.samples) {
    const dv = (s.visc - visc) / 0.1;
    const dt = (s.T - T) / 1.0;
    const d = Math.sqrt(dv * dv + dt * dt);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

export function uniqueViscosities(data: BurgersDataset): number[] {
  return Array.from(new Set(data.samples.map((s) => s.visc))).sort(
    (a, b) => a - b,
  );
}

export function uniqueTimes(data: BurgersDataset): number[] {
  return Array.from(new Set(data.samples.map((s) => s.T))).sort(
    (a, b) => a - b,
  );
}
