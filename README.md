# FooCat

Jeu de tir à défilement horizontal : un chat licorne dans une soucoupe donut.
Marche dans le navigateur sur PC, Mac, iPhone et Android (on peut l'installer sur l'écran d'accueil).

Jeu en ligne : https://fanfan-py.github.io/FooCat/

## Les modes

Au choix sur la ligne « MODE » de l'accueil :
- **Facile**, **Normal** (le mode de départ) et **Difficile** : les 16 niveaux et leurs boss.
  Plus le mode est dur, plus les ennemis sont nombreux, rapides et résistants, et les obstacles nombreux
  (réglages dans `MODES`, dans `src/game/config.ts`). En difficile, on n'a que 2 vies.
- **Infini** : des zones sans fin (les niveaux sans boss, en boucle), de plus en plus dures.
- **Défi du jour** : le même niveau, le même hasard et la même règle spéciale (turbo, fragile, pluie de bonus,
  la horde) pour tout le monde pendant une journée, avec un tableau des scores du jour (`src/game/modes.ts`).

« Continuer » reprend au début du dernier niveau atteint (une sauvegarde par mode).

## Les niveaux

**L'espace et la forteresse**
1. Espace profond : planètes, mouches, araignées, ceinture de donuts (des mouches dans le passage).
2. Nébuleuse sucrée : guêpes en piqué, bonbons à la menthe, atterrissage sur la grosse planète.
3. Planète pâtisserie : sol en gâteau, sucettes, barbe à papa, fourmis, toiles géantes (suspendues ou au sol),
   araignées qui descendent du ciel.
4. Terres de fer : clôtures électriques, câbles, tourelles, drones-araignées, scorpions de fer.
5. La forteresse : piliers, toiles, mini-araignées, puis le boss **l'Araignée de Fer**
   (seul son cœur rose est fragile ; 3 phases : toiles, renforts, laser des yeux).

*Une BD de 5 cases : la victoire, la fête, un message « Au secours ! » dans une bouteille.*

**Le monde aquatique**
6. Retour dans l'espace : pluie de météorites (de toutes les directions), jets de paillettes, crevettes chauve-souris.
7. Vers la planète aquatique : blocs de glace, gouttes géantes, poissons guitare et leurs notes de feu.
8. La planète sous-marine : algues qui poussent, coraux, bulles soporifiques, méduses, crabes sauteurs.
9. Le château marin : herses et algues en slalom, crevettes qui se décrochent du plafond.
10. La salle du trône : le boss **le poisson squelette de la mort** (son armure casse, puis il revient sans armure,
    escorté de mini-poissons squelettes).

*Une BD de 4 cases : un petit phénix appelle à l'aide, cap sur Vulcano.*

**Le monde Vulcano**
11. Retour dans l'espace : météorites, sorbets volants, éclaireurs du Scorpion.
12. Approche de Vulcano : le ciel devient orange, chauves-souris de braise, dragonnets, rochers de feu.
13. Sur la planète Vulcano : arbres en feu, lianes, salamandres, serpents de magma, lucioles de feu.
14. Dans l'antre du volcan : coulées de lave verticales, mini-scorpions volants, phénix-poussins, golems de lave.
15. La salle du trône du volcan : le boss **le Scorpion volant de feu**, à vaincre 3 fois
    (armure de fer, carapace de feu, squelette).

*Une BD de 3 cases : les boss s'allient dans un vaisseau.*

16. Le vaisseau des boss : les 3 boss l'un après l'autre (après un game over, on reprend au boss en cours).

*La BD de fin : le vaisseau explose en bonbons, la grande fête, « FIN ».*

## Les armes

| Arme | Ce qu'elle fait |
|---|---|
| Vermicelles | l'arme de départ : rafale rapide en éventail, contre les nuées |
| Dragibus | gros et puissants ; dans l'espace, en diagonale avec des rebonds sur les bords ; avec un sol, ils retombent et rebondissent par terre comme des balles (contre les monstres au sol) |
| Piñata | gros bonbon qui éclate en petits bonbons au milieu des ennemis |
| Arc-en-ciel | infini (la corne prend le relais quand il n'y a plus rien) ; grandit et traverse tout |
| Casse-dents | touche spéciale : fait exploser un obstacle |

## Apparence, succès et scores

- **Apparence** : on choisit la soucoupe (8) et la couleur du chat (7 : licorne, roux, noir, doré, galaxie,
  fantôme, squelette). Les soucoupes et les chats se gagnent avec les **succès** (21, sur 2 pages).
- **Meilleurs scores** : enregistrés sur chaque appareil (pas de compte), avec un pseudonyme filtré
  (pas de gros mots ni d'insultes).
- **Réglages** : volume de la musique et des effets, tir automatique, commandes pour gaucher, vibrations.

## Commandes

- Clavier : flèches ou ZQSD pour bouger, Espace pour tirer, X (ou 1 à 4) pour changer d'arme,
  C pour lancer un casse-dents, Échap ou P pour la pause (reprendre, recommencer, quitter),
  M pour couper le son.
- Manette : stick ou croix, A pour tirer, B pour le casse-dents, Y pour changer d'arme.
- Téléphone : joystick sous le pouce gauche ; à droite, TIR, ARME et CASSE.

## Jouer pendant le développement

    npm install
    npm run dev

Ouvre l'adresse affichée. Sur un téléphone connecté au même Wi-Fi, ouvre l'adresse « Network ».
Ajoute `?touch` à l'adresse pour voir les commandes tactiles sur ordinateur.

### Mode développeur (choix du niveau)

Le choix du niveau à l'accueil n'apparaît qu'en mode développeur :
- automatiquement avec `npm run dev` ;
- sur le site en ligne : ajouter `#dev` à la fin de l'adresse (`#nodev` pour le couper),
  ou toucher (ou cliquer) 5 fois le logo FOOCAT en moins de 3 secondes.

Gauche/droite (ou toucher la ligne orange « DEV ») pour choisir le niveau. Les parties lancées ainsi
ne modifient pas la sauvegarde « Continuer ». Le mode doit être Facile, Normal ou Difficile.

## Mettre en ligne

Chaque envoi sur la branche `main` de GitHub reconstruit le site (GitHub Pages, `.github/workflows/deploy.yml`).
`npm run build` crée le dossier `dist/` (le site complet) ; les icônes se refont avec `npm run icons`.
`npm run single` crée `dist-single/foocat.html`, le jeu complet dans un seul fichier.

## Régler le jeu

Tous les réglages (vies, cœurs, dégâts, armes, ennemis, boss, points pour finir un niveau) sont dans
`src/game/config.ts`. Chaque niveau est une entrée de la liste `LEVELS` : son nom, ses points à gagner,
son décor, son sol et son plafond, et ses étapes (quels ennemis et obstacles, à quelle fréquence,
avec quel message). Les dessins sont faits en code dans `src/art/` (le même moteur que les maquettes).

### Le robot de test

`npm test` fait jouer un robot sur chaque niveau, vérifie que rien ne plante et mesure la difficulté.
Options (à mettre devant la commande, par exemple `MODE=facile RUNS=12 npm test`) :

| Option | Effet |
|---|---|
| `RUNS=12` | nombre de parties par niveau |
| `FROM=12 TO=14` | seulement certains niveaux (numérotés à partir de 0) |
| `MODE=facile\|normal\|difficile` | le mode de difficulté |
| `CAUSES=1` | ce qui touche le plus le robot |
| `VERBOSE=1` | le détail de chaque partie (et l'état du boss) |
| `CAMP=1` | compare le robot normal à deux robots « planqués » tout en haut ou tout en bas |
| `ENDLESS=1` / `DAILY=1` | mode infini / défis des 7 prochains jours |
| `RUSHFROM=1` | niveau 16 : commencer au 2e boss (`2` : au 3e) |
| `DEBUGLAVA=1` | explique chaque brûlure par une coulée de lave |

## Confidentialité (dépôt public)

`npm run privacy` vérifie tout le dépôt : pas de clé, de jeton ou de mot de passe, pas de chemin personnel
de l'ordinateur, pas de fichier sensible (`.env`, clés), et aucun des mots privés listés dans
`.git/private-patterns` (un par ligne : nom, e-mail… ; ce fichier reste sur l'ordinateur, il n'est jamais publié).
La même vérification se lance avant chaque commit, avec celle de l'identité anonyme du dépôt
(`FooCat <foocat@noreply.invalid>`). Après un nouveau clonage, l'activer avec :

    git config core.hooksPath .githooks
    git config user.name FooCat
    git config user.email foocat@noreply.invalid
