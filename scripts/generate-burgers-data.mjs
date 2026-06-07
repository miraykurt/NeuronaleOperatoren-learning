// Generiert einen kleinen Burgers-1D-Trainingsdatensatz im Stil von PDEBench.
//
// Burgers-Gleichung (viskos, periodisch):
//   ∂u/∂t + u · ∂u/∂x = ν · ∂²u/∂x²,   x ∈ [0, 1],  u(0) = u(1)
//
// Numerisch gelöst per expliziter RK4-Integration auf einem 128-Punkte-Gitter
// mit zentralen Differenzen. Die Ausgabe ist ein JSON mit ~25 Samples,
// jeweils Anfangsbedingung u(x, 0) und Lösung u(x, T) zu unterschiedlichen
// Viskositäten ν und Endzeiten T.
//
// Aufruf:
//   node scripts/generate-burgers-data.mjs
//
// Output:
//   client/public/data/burgers-small.json

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(
  __dirname,
  "..",
  "client",
  "public",
  "data",
  "burgers-small.json",
);

const N = 128; // räumliche Auflösung
const DX = 1 / N;
const SAMPLES = 25;

// Periodische Differenzenoperatoren
function dudx(u) {
  const n = u.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const im = (i - 1 + n) % n;
    const ip = (i + 1) % n;
    out[i] = (u[ip] - u[im]) / (2 * DX);
  }
  return out;
}

function d2udx2(u) {
  const n = u.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const im = (i - 1 + n) % n;
    const ip = (i + 1) % n;
    out[i] = (u[ip] - 2 * u[i] + u[im]) / (DX * DX);
  }
  return out;
}

function rhs(u, nu) {
  const ux = dudx(u);
  const uxx = d2udx2(u);
  const r = new Float64Array(u.length);
  for (let i = 0; i < u.length; i++) {
    r[i] = -u[i] * ux[i] + nu * uxx[i];
  }
  return r;
}

function addScaled(a, b, scale) {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + scale * b[i];
  return out;
}

// RK4-Schritt
function step(u, nu, dt) {
  const k1 = rhs(u, nu);
  const k2 = rhs(addScaled(u, k1, dt / 2), nu);
  const k3 = rhs(addScaled(u, k2, dt / 2), nu);
  const k4 = rhs(addScaled(u, k3, dt), nu);
  const out = new Float64Array(u.length);
  for (let i = 0; i < u.length; i++) {
    out[i] = u[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return out;
}

// Zeitschrittwahl mit Sicherheitsabstand zu CFL und Diffusionsgrenze
function pickDt(nu, uMax) {
  const diff = (DX * DX) / (2 * nu);
  const advec = DX / Math.max(0.1, uMax);
  return 0.4 * Math.min(diff, advec);
}

function integrate(u0, nu, T) {
  let u = Float64Array.from(u0);
  let t = 0;
  while (t < T) {
    const uMax = Math.max(...u.map(Math.abs));
    const dt = Math.min(pickDt(nu, uMax), T - t);
    u = step(u, nu, dt);
    t += dt;
  }
  return Array.from(u, (v) => Number(v.toFixed(5)));
}

// Initialbedingungen aus parametrisierten Sinus-/Cosinus-Mischungen
// (deterministisch, damit der Datensatz reproduzierbar ist)
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function initialCondition(seed) {
  const r = rng(seed);
  const modes = 3 + Math.floor(r() * 3); // 3..5 Moden
  const ic = new Float64Array(N);
  const amps = [];
  const phases = [];
  let totalAmp = 0;
  for (let k = 1; k <= modes; k++) {
    const a = (r() - 0.5) * (1 / k); // höhere Moden schwächer
    amps.push(a);
    phases.push(r() * 2 * Math.PI);
    totalAmp += Math.abs(a);
  }
  // normalisieren auf u_max ≈ 0.8
  const norm = totalAmp > 0 ? 0.8 / totalAmp : 1;
  for (let i = 0; i < N; i++) {
    const x = i / N;
    let v = 0;
    for (let k = 1; k <= modes; k++) {
      v += amps[k - 1] * Math.sin(2 * Math.PI * k * x + phases[k - 1]);
    }
    ic[i] = norm * v;
  }
  return Array.from(ic, (v) => Number(v.toFixed(5)));
}

function generate() {
  const samples = [];
  // Viskositäts-Grid (log-spaced) und Endzeiten kreuz und quer
  const viscList = [0.005, 0.01, 0.02, 0.05, 0.1];
  const tList = [0.1, 0.25, 0.5, 1.0, 1.5];

  let id = 0;
  for (let s = 0; s < SAMPLES; s++) {
    const seed = 1234 + s * 7919;
    const visc = viscList[s % viscList.length];
    const T = tList[Math.floor(s / viscList.length) % tList.length];
    const ic = initialCondition(seed);
    const solution = integrate(ic, visc, T);
    samples.push({
      id: `burgers-${String(id).padStart(3, "0")}`,
      seed,
      visc,
      T,
      N,
      ic,
      solution,
    });
    id += 1;
    process.stdout.write(
      `  generated ${samples.length}/${SAMPLES} (ν=${visc}, T=${T})\n`,
    );
  }

  return {
    name: "burgers-small",
    description:
      "Kleiner viskoser Burgers-1D-Datensatz im PDEBench-Stil. Erzeugt mit RK4 auf 128 Gitterpunkten, periodische Randbedingungen.",
    equation: "du/dt + u * du/dx = nu * d^2u/dx^2",
    spatialResolution: N,
    domain: [0, 1],
    boundaryConditions: "periodisch",
    solver: "Explizites Runge-Kutta vierter Ordnung",
    generatedAt: new Date().toISOString(),
    count: samples.length,
    samples,
  };
}

console.log(`Generiere ${SAMPLES} Burgers-Samples ...`);
const data = generate();

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));

const sizeKb = (JSON.stringify(data).length / 1024).toFixed(1);
console.log(`\nFertig. Geschrieben nach:`);
console.log(`  ${OUT_PATH}`);
console.log(`  ${data.count} Samples, ${sizeKb} KB JSON`);
