# FooCat

Jeu de tir à défilement horizontal : un chat licorne dans une soucoupe donut.
Marche dans le navigateur sur PC, Mac, iPhone et Android.

## Jouer pendant le développement

    npm install
    npm run dev

Ouvre l'adresse affichée. Sur un téléphone connecté au même Wi-Fi, ouvre l'adresse « Network ».
Ajoute `?touch` à l'adresse pour voir les commandes tactiles sur ordinateur.

## Installer le jeu sur un téléphone

Le jeu est une « application web » : une fois mis en ligne sur un site en `https`, on peut
l'ajouter à l'écran d'accueil du téléphone, il s'ouvre en plein écran et marche sans connexion.

1. `npm run build` crée le dossier `dist/` : c'est le site complet.
2. Mettre ce dossier en ligne sur un hébergement gratuit (par exemple Netlify ou GitHub Pages).
3. Sur le téléphone, ouvrir l'adresse du site, puis :
   - iPhone (Safari) : bouton Partager, puis « Sur l'écran d'accueil » ;
   - Android (Chrome) : menu ⋮, puis « Installer l'application ».

Les icônes se refont avec `npm run icons`.

## Autres commandes

- `npm test` : un robot joue 12 parties pour vérifier que rien ne plante et mesurer la difficulté.
- `npm run single` : crée `dist-single/foocat.html`, le jeu complet dans un seul fichier.

## Mode développeur

Le choix du niveau à l'accueil n'apparaît qu'en mode développeur :
- automatiquement avec `npm run dev` ;
- sur le site en ligne : ajouter `#dev` à la fin de l'adresse (`#nodev` pour le couper),
  ou toucher (ou cliquer) 5 fois le logo FOOCAT en moins de 3 secondes.

Les parties lancées depuis le choix du niveau ne modifient pas la sauvegarde « Continuer ».

## Où régler le jeu

Tous les réglages (vies, cœurs, dégâts, armes, ennemis, points pour finir un niveau)
sont dans `src/game/config.ts`.

## Les niveaux

1. Espace profond : planètes, mouches, araignées, ceinture de donuts au milieu.
2. Nébuleuse sucrée : guêpes en piqué, pluie de bonbons, atterrissage sur la grosse planète.
3. Planète pâtisserie : sol en gâteau, sucettes et barbe à papa, fourmis, toiles géantes.
4. Terres de fer : clôtures électriques qui s'allument et s'éteignent, tourelles, drones-araignées.
5. La forteresse : piliers, mini-araignées de métal, puis le boss, l'Araignée de Fer
   (seul son cœur rose est fragile ; 3 phases : toiles, mini-araignées, laser des yeux).
6. Retour dans l'espace : comètes, jets de paillettes (piège qui peut cacher des monstres),
   crevettes chauve-souris. Une histoire en 4 cases le précède.
7. Vers la planète aquatique : blocs de glace, gouttes géantes, poissons guitare et leurs notes de feu.

Chaque niveau est décrit dans la liste `LEVELS` de `src/game/config.ts` : son nom, ses points
à gagner, son décor, la présence d'un sol, et ses étapes (quels ennemis et obstacles, à quelle
fréquence, avec quel message). Ajouter un niveau = ajouter une entrée à cette liste ; un
nouveau décor ou un nouvel ennemi demande en plus un peu de dessin et de code.

`npm test` fait jouer un robot sur chaque niveau et indique ce qui le touche le plus
(`CAUSES=1 npm test`), pour régler la difficulté.

## Commandes

- Clavier : flèches ou ZQSD pour bouger, Espace pour tirer, X (ou 1 à 4) pour changer d'arme,
  C pour lancer un casse-dents, Échap ou P pour la pause (reprendre, recommencer, quitter),
  M pour couper le son. À l'accueil : gauche/droite pour le niveau, haut/bas pour le mode.
- Manette : stick ou croix, A pour tirer, B pour le casse-dents, Y pour changer d'arme.
- Téléphone : joystick sous le pouce gauche ; à droite, TIR, ARME et CASSE.
