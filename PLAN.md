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
- Histoire illustrée entre les mondes : **oui** (4 cases entre le niveau 5 et le niveau 6).

## Étape 1 : corrections et réglages (faite le 27 octobre 2026)

- [x] Affichage sur iPhone 12 et iPhone SE : le jeu se recadre tout seul, sans avoir à tourner le téléphone.
      Sur les petits écrans comme l'iPhone SE, le jeu est un peu réduit pour que les boutons ne cachent rien.
      **À confirmer sur les vrais téléphones.**
- [x] Choix du niveau retiré de l'accueil ; gardé en mode développeur
      (automatique sur l'ordinateur de développement ; sur le site, ajouter **#dev** à la fin de l'adresse, ou **toucher 5 fois le logo** ; #nodev ou 5 touchers pour le couper).
- [x] « Continuer au niveau X » sur l'écran d'accueil (une sauvegarde par mode, au début de chaque niveau).
- [x] Niveau 4 : le courant reste coupé 1,8 s au lieu de 1 s quand un bonus est entre les poteaux,
      avertissement 0,6 s avant, voyants sur les pylônes (vert = coupé, orange = va revenir, rouge = branché).
- [x] Niveau 4 : plus de monstres (vagues plus fréquentes, escadrilles de 3 drones,
      nouveau **scorpion de fer** au sol qui tire 3 balles en éventail).
- [x] Niveau 5 : le boss appelle des renforts, de plus en plus nombreux quand sa vie baisse
      (1 mini-araignée toutes les 6 s au début, jusqu'à 3 toutes les 3 s, avec des drones).

## Étape 2 : nouvelle arme « Piñata » (faite le 27 octobre 2026)

- [x] Gros bonbon papillote, lent, qui éclate en 8 petits bonbons quand il touche un monstre,
      un obstacle, la carapace du boss, ou au bout de sa course.
- [x] Les éclats partent en étoile et touchent d'autres monstres.
- [x] Munitions limitées (10 au départ, 30 au maximum) et bulle bonus rose (+8).
- [x] Barre du haut à 5 cases ; touche 4 du clavier ; rappel dans l'écran de pause.

## Étape 3 : tableau des meilleurs scores (faite le 27 octobre 2026)

- [x] Top 10 sur chaque appareil, un classement pour le mode normal et un pour le mode difficile
      (accueil → « Meilleurs scores » ; flèches gauche/droite pour changer de mode).
- [x] Saisie du pseudonyme en fin de partie (game over, victoire ou « Quitter ») quand le score entre
      dans le top 10 ; clavier du téléphone, 12 lettres au maximum ; le dernier pseudo est proposé.
      Les parties lancées en mode développeur ne comptent pas.
- [x] Filtre des gros mots et des insultes (français et anglais), même déguisés (« C0NNARD »,
      « coooonnard », « p.u.t.e ») ; les mots courts comme « con » ne sont refusés que seuls,
      pour accepter « Constance » ou « Violette ». Liste dans src/game/scores.ts.
- [ ] Plus tard, si on le souhaite : classement partagé en ligne entre tous les joueurs.

## Étape 4 : réglages et récompenses (faite le 27 octobre 2026)

- [x] Écran **Réglages** (accueil et pause) : volume de la musique et des effets, tir automatique,
      commandes inversées pour les gauchers, vibrations (Android).
- [x] **Bilan de fin de niveau** : ennemis vaincus, précision, bonus ramassés, coups reçus, temps,
      et 1 à 3 étoiles (2 étoiles : 4 coups reçus au plus ; 3 étoiles : 1 coup au plus).
- [x] **13 succès** à débloquer (accueil → « Succès »), annoncés pendant le jeu.
- [x] **8 soucoupes** (accueil → « Soucoupes ») : Fraise au départ ; Chocolat, Menthe, Citron, Réglisse,
      Myrtille, Or et Arc-en-ciel se gagnent avec des succès.

## Étape 5 : maquettes du monde aquatique (faite le 27 octobre 2026)

Maquettes : https://claude.ai/artifact/XtWEHV1D6kjwZ7Kc3LLC86 (en bas de la planche).

- [x] Nouveaux décors et monstres ajoutés à la planche de maquettes : niveaux 6 à 10 (le boss en 2 phases)
      et une page des personnages aquatiques. **À valider.** Les dessins sont déjà dans src/art/aqua.js.
- [x] Maquette d'une histoire illustrée en 4 cases entre le niveau 5 et le niveau 6. **À décider.**

## Étape 6 : niveaux 6 et 7, retour dans l'espace (faite le 27 octobre 2026)

| Niveau | Décor | Obstacles | Monstres | Fin |
|---|---|---|---|---|
| 6. Retour dans l'espace | espace, comètes | pluie de comètes, astéroïdes-bonbons, jets de paillettes | crevettes chauve-souris, et les anciens | — |
| 7. Vers la planète aquatique | la planète bleue grossit | blocs de glace, gouttes géantes, jets de paillettes | poissons guitare, crevettes chauve-souris | plongeon dans l'océan |

- [x] Niveaux 6 et 7 jouables (avec les comètes, les jets de paillettes et les poissons guitare).
- [x] Histoire illustrée en 4 cases entre le niveau 5 et le niveau 6 (Échap pour la passer).
- [x] Ailes de la crevette chauve-souris agrandies.

## Étape 7 : niveaux 8 et 9, la planète aquatique (faite le 27 octobre 2026)

| Niveau | Décor | Obstacles | Monstres | Fin |
|---|---|---|---|---|
| 8. La planète sous-marine | fonds marins, sable, coraux, rayons de lumière | algues au sol et au plafond, bulles soporifiques | crabes, méduses, poissons guitare | entrée du château |
| 9. Le château marin | couloirs de corail et de pierre | algues, bulles soporifiques, herses | méduses, crabes gardes, crevettes accrochées au plafond | salle du trône |

Ajouts demandés après les maquettes :
- [x] Les **crabes sautent** (comme les fourmis).
- [x] Les **maracas des crabes rebondissent** sur le sol (deux fois).
- [x] Les **algues s'allongent** (elles poussent pendant qu'on avance).
- [x] Niveaux 8 et 9 jouables : bulles soporifiques, méduses, crabes, herses, crevettes accrochées au plafond,
      bancs de petits poissons à la place des mouches sous l'eau.

Corrections après le premier essai :
- [x] Niveau 8 : les **petites algues et les coraux sont des obstacles** (on ne passe plus au travers).
- [x] Niveau 8 : la forêt d'algues a des **grandes algues en haut ET en bas**, en alternance.
- [x] Niveau 9 : **herses et algues en même temps**, en haut et en bas, pour obliger le chat à faire du slalom.

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
