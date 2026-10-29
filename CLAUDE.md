# Règles pour Claude dans ce dépôt

Ce dépôt est **public** (GitHub Pages). À chaque modification du code :

1. **Ne rien publier de privé.** Pas de nom ni d'e-mail de la personne qui gère le jeu, pas de chemin de son
   ordinateur (`/Users/…`), pas de clé, de jeton ni de mot de passe, pas de fichier `.env` ou de clé.
   Avant chaque commit :
   - relire `git status` et n'ajouter que les fichiers qu'on a soi-même créés ou modifiés
     (pas de `git add -A` sans avoir regardé la liste ; les exports comme `out/`, `dist/` restent hors du dépôt) ;
   - lancer `npm run privacy` (tout le dépôt) ; le crochet `.githooks/pre-commit` vérifie aussi les fichiers
     commités. Les mots privés à chercher sont dans `.git/private-patterns`, qui n'est jamais publié :
     ne jamais les recopier dans un fichier du dépôt.
2. **Toujours commiter avec l'identité anonyme du dépôt** : `FooCat <foocat@noreply.invalid>`
   (configurée localement), jamais avec l'identité globale de l'ordinateur.
3. **Ne pas pousser** : c'est la personne qui gère le dépôt qui synchronise depuis VS Code.
4. **Tenir à jour `README.md` et `PLAN.md`** quand le jeu change (niveaux, armes, modes, commandes, tests).
5. Vérifier avec `npx tsc --noEmit` et le robot (`npm test`, voir le README) avant de commiter.
