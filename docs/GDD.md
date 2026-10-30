# Forge Orbitale — Game Design Document (prototype)

Nom provisoire. Prototype web mobile (portrait, ~380 px), PWA plus tard.

## Objectif du prototype

Valider **uniquement** que la boucle centrale *placer / orienter / lancer* est fun.
Hors périmètre : idle, méta-progression, son, PWA.

## Principe

Un « engine builder » SF. Le joueur pose des cartes-composants sur une grille 5×5.
Les ressources circulent de case en case et sont vendues au Terminal d'export contre des
crédits, pour atteindre le quota de chaque contrat.

## Grille

- 5×5 (25 cases), indexées ligne par ligne (0 = haut-gauche, 24 = bas-droite).
- Un **Terminal d'export** est fixé au centre (case 12). Il n'est ni déplaçable ni remplaçable.
  Il accepte toutes les ressources et les vend.
- Chaque carte posée a une **direction de sortie** (N/E/S/O) et deux tampons :
  - `inbox` (capacité 6 par défaut),
  - `outbox` (capacité 6 par défaut).
- Les cartes posées restent sur la grille d'un tour à l'autre, tampons compris.

## Ressources

| Ressource | Valeur de vente au Terminal |
|-----------|-----------------------------|
| Minerai   | 1  |
| Énergie   | 1  |
| Données   | 3  |
| Alliage   | 6  |
| Module    | 20 |

## Déroulement d'un tick

Dans cet ordre :

1. **Production** — les sources ajoutent leur production à leur outbox (bonus passifs inclus).
   Si l'outbox est pleine, la production est bloquée (perdue).
2. **Conversion** —
   - les convertisseurs consomment leur recette depuis l'inbox (1 conversion max par tick)
     et placent le produit dans l'outbox ;
   - les cartes logistiques déplacent inbox → outbox jusqu'à leur débit ;
   - le Terminal vend tout son inbox.
3. **Transfert** — à partir d'un **instantané** des outbox, chaque carte envoie ses ressources
   vers la case dans sa direction, jusqu'à son débit (3 par défaut). La cible accepte si :
   elle existe, elle accepte ce type de ressource (une recette n'accepte que ses ingrédients ;
   la logistique et le Terminal acceptent tout) et il reste de la place dans son inbox.
   Les conflits sont résolus dans l'ordre des cases (ligne par ligne), de façon déterministe.
   Une ressource ne bouge qu'une fois par tick.

Une carte dont l'outbox est pleine et qui ne peut rien envoyer est **bloquée** (affichée dans l'UI).

## Boucle de jeu

- **Deck de départ (10)** : 3 Foreuse à astéroïdes, 3 Panneau solaire, 3 Convoyeur, 1 Fonderie.
- **Tour** : piocher 4 cartes (la défausse est remélangée si la pioche est vide), poser au
  maximum 2 cartes. Poser sur une carte existante la remplace ; l'ancienne part en défausse.
  La rotation des cartes posées est libre et illimitée.
- **Lancer** : exécute 10 ticks. Les cartes non jouées de la main partent en défausse.
- **Contrat** = 3 tours. Les crédits gagnés pendant le contrat doivent atteindre le quota :
  40, 100, 220, 450, 900, puis ×2 à chaque contrat suivant.
- **Contrat réussi** : choisir 1 carte parmi 3 (tirage pondéré par rareté : commune 60 %,
  peu commune 30 %, rare 10 %) **ou** retirer une carte du deck.
- **Contrat raté** : fin de partie.

## Cartes (15)

Tags : Minage, Énergie, Logistique, Industrie, Tech, Commerce. Les tags servent à l'affichage
et aux passifs ; le modèle permet des bonus de set plus tard (ex. « 3 cartes [Industrie] → … »).

### Communes
- **Foreuse à astéroïdes** [Minage] — source, +1 Minerai/tick.
- **Panneau solaire** [Énergie] — source, +1 Énergie/tick.
- **Convoyeur** [Logistique] — débit 3.
- **Fonderie** [Industrie] — 2 Minerai + 1 Énergie → 1 Alliage.
- **Silo tampon** [Logistique] — inbox 12, débit 2.

### Peu communes
- **Foreuse profonde** [Minage] — 1 Énergie → 3 Minerai.
- **Laboratoire** [Tech] — 2 Énergie → 1 Données.
- **Répartiteur** [Logistique] — envoie alternativement vers sa direction et vers sa direction
  tournée de 90° dans le sens horaire.
- **Relais de contrôle** [Tech] — passif, +1 production aux sources orthogonalement adjacentes.
- **Courtier** [Commerce] — passif, s'il est adjacent au Terminal, +1 crédit par unité vendue.

### Rares
- **Réacteur à fusion** [Énergie] — source, +3 Énergie/tick.
- **Assembleur de modules** [Industrie, Tech] — 2 Alliage + 1 Données → 1 Module.
- **Amplificateur quantique** [Tech] — chaque ressource reçue ressort en double, 2 entrées max par tick.
- **Drone cargo** [Logistique] — envoie à 2 cases de distance dans sa direction (saute la voisine).
- **Contrat d'exportation** [Commerce] — passif, les Alliages vendus valent ×2.

## Comportements génériques

Les cartes sont décrites en données (`src/data/cards.ts`) avec un petit nombre de comportements :

| Comportement | Paramètres |
|--------------|-----------|
| `source`     | ressource, quantité par tick |
| `converter`  | recette (entrées → sorties) |
| `logistics`  | débit interne, multiplicateur, portée d'envoi, répartition alternée |
| `passive`    | liste d'effets (bonus de source adjacente, bonus de vente, multiplicateur de vente) |
| `terminal`   | — |

Ajouter une carte ne doit pas nécessiter de toucher au moteur.

## UI (mobile portrait d'abord)

- **En-tête** : n° de contrat, tour x/3, crédits du contrat / quota (barre de progression).
- **Grille** carrée pleine largeur. Chaque carte posée : icône (emoji provisoire), flèche de
  direction, petits compteurs de tampons, contour rouge si bloquée.
- **Main** en bas : cartes compactes (icône, nom, tags, effet en une ligne).
- **Interactions** : taper une carte de la main la sélectionne et surligne les cases valides ;
  taper une case la pose (direction par défaut : vers le Terminal si adjacente, sinon Nord) ;
  taper une carte posée la fait pivoter de 90° ; ⓘ ou appui long = détail. Pas de glisser-déposer.
- **Lancer** : ~250 ms par tick, « +X » flottant sur le Terminal, bouton « Passer ».
- **Mode debug** : avancer tick par tick, tampons en détail.
- **Écrans** : récompense (3 cartes ou retrait), fin de partie (stats + Recommencer).
- **Thème** sombre SF, une couleur par ressource. Sauvegarde auto dans `localStorage`.

## Équilibrage

Tout chiffre de gameplay vit dans `src/data/` (jamais en dur dans le moteur).

## Précisions d'implémentation

Les règles ambiguës et le choix retenu sont listés dans [QUESTIONS.md](QUESTIONS.md).
