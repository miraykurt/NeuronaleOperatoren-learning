# Datensatz: burgers-small.json

Ein kleiner Trainings-/Demo-Datensatz für die viskose Burgers-1D-Gleichung im
PDEBench-Stil. Wird vom Live-Notebook in Kapitel 8 und perspektivisch von
Live-Vergleich und Fehler-Heatmap in Kapitel 6/7 genutzt, um statt
synthetischer Vergleichswerte echte numerische Lösungen zu verwenden.

## Gleichung

Viskose Burgers-1D, periodische Randbedingungen:

```
∂u/∂t + u · ∂u/∂x = ν · ∂²u/∂x²,   x ∈ [0, 1],  u(0, t) = u(1, t)
```

## Erzeugung

- **Solver:** Explizite Runge-Kutta vierter Ordnung (RK4)
- **Raumdiskretisierung:** 128 Punkte, zentrale Differenzen für ∂/∂x und ∂²/∂x²
- **Zeitschritt:** adaptiv, Sicherheitsfaktor 0,4 gegenüber CFL- und Diffusionsgrenze
- **Initialbedingungen:** deterministisch erzeugt aus 3 bis 5 Fourier-Moden
  mit pseudozufälligen Amplituden und Phasen (Seed pro Sample reproduzierbar)

## Inhalt

25 Samples, je Sample:

| Feld        | Typ          | Beschreibung                              |
| ----------- | ------------ | ----------------------------------------- |
| `id`        | string       | eindeutige ID, z. B. `burgers-007`        |
| `seed`      | number       | Seed der Initialbedingung                 |
| `visc`      | number       | Viskosität ν                              |
| `T`         | number       | Endzeit der Integration                   |
| `N`         | number       | räumliche Auflösung (128)                 |
| `ic`        | number[N]    | Anfangsbedingung u(x, 0)                  |
| `solution`  | number[N]    | Lösung u(x, T)                            |

Viskositäten: `0.005, 0.01, 0.02, 0.05, 0.1`
Endzeiten: `0.1, 0.25, 0.5, 1.0, 1.5`

## Reproduzierbarkeit

```bash
node scripts/generate-burgers-data.mjs
```

Das Skript ist deterministisch. Wer den Datensatz neu erzeugt, bekommt
bit-identische Werte. Größe: ~55 KB JSON.

## Verwendung in der App

```ts
import { loadBurgersDataset } from "../data/burgersDataset";

const data = await loadBurgersDataset();
console.log(data.samples[0].ic);       // u(x, 0)
console.log(data.samples[0].solution); // u(x, T)
```

## Verhältnis zu echtem PDEBench

Dies ist **nicht** ein offizielles PDEBench-Asset, sondern ein eigener,
sehr kleiner Mini-Datensatz im selben Stil. Die offizielle Quelle:

- Paper: https://arxiv.org/abs/2210.07182
- Code:  https://github.com/pdebench/PDEBench

Wer mit den echten Daten arbeiten will, lädt sie dort. Die Daten in diesem
Repo sind ausschließlich für die Lerneinheit gedacht.
