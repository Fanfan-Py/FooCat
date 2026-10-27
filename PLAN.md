# FooCat : le plan

Suivi des prochaines étapes du jeu. Les cases cochées sont faites.

Jeu en ligne : https://fanfan-py.github.io/FooCat/

## Décisions prises

- Le niveau 4 garde son nom : **Terres de fer**.
- Le choix du niveau disparaît de l'écran d'accueil, sauf en **mode développeur**.
- **Continuer au niveau X** : oui.
- **Tableau des scores** : enregistré sur chaque appareil (téléphone, ordinateur), sans compte.
  Pseudonyme de 12 lettres au maximum, avec un **filtre des gros mots et des insultes**.
- **Jus de fraise des méduses** : fait perdre **2 cœurs**.
- **Jets de paillettes** : un **piège du décor**, qui peut **cacher des monstres**.
- Autres idées retenues : écran Réglages, bilan de fin de niveau, succès, apparences de soucoupe,
  mode infini et défi du jour. Pas de tutoriel pour le moment.
- Histoire illustrée entre les mondes : **à voir**, d'abord une maquette.

## Étape 1 : corrections et réglages (faite le 27 octobre 2026)

- [x] Affichage sur iPhone 12 et iPhone SE : le jeu se recadre tout seul, sans avoir à tourner le téléphone.
      Sur les petits écrans comme l'iPhone SE, le jeu est un peu réduit pour que les boutons ne cachent rien.
      **À confirmer sur les vrais téléphones.**
- [x] Choix du niveau retiré de l'accueil ; gardé en mode développeur
      (automatique sur l'ordinateur de développement ; sur le site, **toucher 5 fois le logo** pour l'activer ou le couper).
- [x] « Continuer au niveau X » sur l'écran d'accueil (une sauvegarde par mode, au début de chaque niveau).
- [x] Niveau 4 : le courant reste coupé 1,8 s au lieu de 1 s quand un bonus est entre les poteaux,
      avertissement 0,6 s avant, voyants sur les pylônes (vert = coupé, orange = va revenir, rouge = branché).
- [x] Niveau 4 : plus de monstres (vagues plus fréquentes, escadrilles de 3 drones,
      nouveau **scorpion de fer** au sol qui tire 3 balles en éventail).
- [x] Niveau 5 : le boss appelle des renforts, de plus en plus nombreux quand sa vie baisse
      (1 mini-araignée toutes les 6 s au début, jusqu'à 3 toutes les 3 s, avec des drones).

## Étape 2 : nouvelle arme « Piñata » (nom à confirmer)

- [ ] Gros bonbon lent qui éclate en 6 à 8 petits bonbons quand il touche un monstre.
- [ ] Les éclats peuvent toucher d'autres monstres (réaction en chaîne).
- [ ] Munitions limitées et bonus à ramasser.
- [ ] Barre du haut réorganisée pour une case d'arme de plus.

## Étape 3 : tableau des meilleurs scores

- [ ] Top 10 sur chaque appareil, un classement pour le mode normal et un pour le mode difficile.
- [ ] Saisie du pseudonyme en fin de partie (clavier du téléphone), 12 lettres au maximum.
- [ ] Filtre des gros mots et des insultes.
- [ ] Plus tard, si on le souhaite : classement partagé en ligne entre tous les joueurs.

## Étape 4 : réglages et récompenses

- [ ] Écran **Réglages** : volume de la musique et des effets, tir automatique,
      commandes inversées pour les gauchers, vibrations (Android).
- [ ] **Bilan de fin de niveau** : ennemis vaincus, précision, bonus ramassés, 1 à 3 étoiles.
- [ ] **Succès** à débloquer (finir un niveau sans être touché, vaincre 500 mouches…).
- [ ] **Apparences de soucoupe** à gagner (donut chocolat, fraise, arc-en-ciel…).

## Étape 5 : maquettes du monde aquatique

- [ ] Nouveaux décors et monstres ajoutés à la planche de maquettes, pour validation.
- [ ] Maquette d'une petite histoire illustrée entre les mondes (à décider ensuite).

## Étape 6 : niveaux 6 et 7, retour dans l'espace

| Niveau | Décor | Obstacles | Monstres | Fin |
|---|---|---|---|---|
| 6. Retour dans l'espace | espace, comètes | pluie de comètes, astéroïdes-bonbons, jets de paillettes | crevettes chauve-souris, et les anciens | — |
| 7. Vers la planète aquatique | la planète bleue grossit | blocs de glace, gouttes géantes, jets de paillettes | poissons guitare, crevettes chauve-souris | plongeon dans l'océan |

## Étape 7 : niveaux 8 et 9, la planète aquatique

| Niveau | Décor | Obstacles | Monstres | Fin |
|---|---|---|---|---|
| 8. La planète sous-marine | fonds marins, sable, coraux, rayons de lumière | algues au sol et au plafond, bulles soporifiques | crabes, méduses, poissons guitare | entrée du château |
| 9. Le château marin | couloirs de corail et de pierre | algues, bulles soporifiques, herses | méduses, crabes gardes, crevettes accrochées au plafond | salle du trône |

## Étape 8 : niveau 10, le poisson squelette de la mort

- [ ] Phase 1, avec armure : lance des arêtes, charge pour mordre, souffle des bulles soporifiques.
- [ ] Jauge vidée : l'armure vole en éclats et la jauge se remplit à nouveau.
- [ ] Phase 2, sans armure : plus rapide, escorté de mini-poissons squelettes de plus en plus nombreux.

## Les nouveaux monstres et pièges

- **Poisson guitare** : nage en vagues et lance des notes de musique en feu ; chaque note joue un do dièse.
- **Crabe** : marche au fond et lance des maracas multicolores en cloche.
- **Crevette chauve-souris** : arrive en piqué ; dans le château, elle se suspend au plafond
  et se laisse tomber quand le chat passe dessous.
- **Méduses bleues et roses** : montent et descendent en lançant des jets de jus de fraise (2 cœurs).
- **Jets de paillettes** (piège du décor) : jaillissent par intermittence en travers de l'écran,
  avec un avertissement ; des monstres peuvent s'y cacher.
- **Bulles soporifiques** (niveaux 8 à 10) : le chat s'endort 1,5 seconde, figé.
- **Algues** : plusieurs tailles, au sol et au plafond, elles ondulent ; le casse-dents les coupe.
- Sous l'eau, le dôme du chat devient un **scaphandre** d'où s'échappent des bulles.

## Étape 9 : mode infini et défi du jour

- [ ] **Mode infini** : on enchaîne les vagues aussi longtemps que possible.
- [ ] **Défi du jour** : le même parcours pour tout le monde pendant une journée.

## Étape 10 : finitions

- [ ] Nouvelles musiques : océan, château, boss squelette.
- [ ] Réglage de la difficulté avec le robot de test, puis essais sur téléphone.
