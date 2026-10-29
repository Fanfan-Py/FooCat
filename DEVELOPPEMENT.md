# FooCat : notes de développement

Pour jouer, voir le [README](README.md).

## Lancer le jeu sur son ordinateur

    npm install
    npm run dev

Ouvre l'adresse affichée. Sur un téléphone connecté au même Wi-Fi, ouvre l'adresse « Network ».
Ajoute `?touch` à l'adresse pour voir les commandes tactiles sur ordinateur.
En local, l'accueil propose aussi de choisir le niveau à jouer.

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
