# Forge Orbitale

Prototype (nom provisoire) d'un « engine builder » SF mobile : on pose des cartes-composants
sur une grille 5×5, les ressources circulent de case en case et sont vendues au Terminal
pour atteindre les quotas de contrat. Ce prototype ne sert qu'à valider la boucle
**placer / orienter / lancer**.

- Règles : [docs/GDD.md](docs/GDD.md)
- Choix faits sur les règles ambiguës : [docs/QUESTIONS.md](docs/QUESTIONS.md)
- Conventions pour les contributeurs / sessions futures : [CLAUDE.md](CLAUDE.md)

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173/IdleSF/
npm test         # tests du moteur (Vitest)
npm run build    # typecheck + build dans dist/
npm run preview  # sert dist/ (http://localhost:4173/IdleSF/)
```

Pour tester sur téléphone : `npm run dev -- --host`, puis ouvrir l'URL réseau affichée
(en conservant le chemin `/IdleSF/`).

## Déployer sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` teste, construit et publie `dist/` à chaque push
sur `main` (ou à la main via *Actions → Run workflow*).

1. Dans le dépôt GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. Pousser sur `main`.
3. Le jeu est servi sur `https://<utilisateur>.github.io/IdleSF/`.

La base Vite est `/IdleSF/` (nom du dépôt). Si le dépôt est renommé, changer `base` dans
`vite.config.ts` ou définir la variable d'environnement `VITE_BASE` (ex. `VITE_BASE=/autre-nom/`).
