# Questions ouvertes / choix faits

Règles ambiguës du brief et choix retenus (le plus simple). À réviser après les premiers tests.

1. **Capacité d'inbox des convertisseurs** : appliquée *par ingrédient* (sinon une inbox pleine
   de Minerai bloque définitivement la Fonderie, qui attend de l'Énergie). Pour la logistique
   et le Terminal, la capacité est un total toutes ressources confondues.
2. **Capacité d'inbox du Terminal** : 12 (constante), il vend tout à chaque tick.
3. **Les cartes posées restent sur la grille** (elles ne retournent pas dans la défausse).
   Seules les cartes remplacées et les cartes non jouées de la main vont en défausse.
   Conséquence à surveiller : le deck se vide vite, les mains peuvent devenir < 4 cartes.
4. **« Retirer une carte du deck »** : porte sur les cartes de la pioche et de la défausse
   uniquement (pas sur celles déjà posées sur la grille).
5. **Réussite d'un contrat** vérifiée à la fin du 3ᵉ tour (pas de validation anticipée).
6. **Répartiteur** : alterne par unité envoyée ; si la sortie préférée refuse, il tente l'autre.
   L'alternance repart sur l'autre sortie après un envoi réussi.
7. **Drone cargo** : cible la case à distance 2 ; si elle est hors grille, rien n'est envoyé.
8. **Amplificateur quantique** : une unité n'est traitée que si l'outbox a la place pour les deux
   unités produites (pas de perte partielle).
9. **Cumul des passifs** : plusieurs Relais s'additionnent ; plusieurs Courtiers s'additionnent ;
   plusieurs Contrats d'exportation se multiplient (×2 chacun). Valeur d'une vente =
   `valeur de base × multiplicateurs + bonus fixes`.
10. **Cartes passives** : leur direction n'a pas de sens ; taper dessus ouvre le détail au lieu
    de pivoter.
11. **Production bloquée** : si l'outbox n'a de la place que pour une partie de la production,
    la partie qui rentre est ajoutée, le reste est perdu.
12. **Remplacement** : un remplacement compte comme une pose (max 2 par tour) ; les tampons de
    la carte remplacée sont perdus.
