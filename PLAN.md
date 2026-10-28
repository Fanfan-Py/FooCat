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
- [x] Niveau 8 un peu plus difficile : plus de monstres et d'obstacles.

## Étape 8 : niveau 10, le poisson squelette de la mort (faite le 27 octobre 2026)

- [x] Phase 1, avec armure : lance des arêtes, charge pour mordre, souffle des bulles soporifiques.
- [x] Jauge vidée : l'armure vole en éclats et la jauge se remplit à nouveau.
- [x] Phase 2, sans armure : plus rapide, escorté de mini-poissons squelettes de plus en plus nombreux.
- [x] Le niveau 10 « La salle du trône » : une courte traversée (herses, algues, derniers gardes), puis le boss.
- [x] La charge est annoncée : le poisson tremble et une ligne rouge montre où il va foncer.
- [x] Nouveau succès : « Arêtes en miettes » (vaincre le poisson squelette).

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

## Étape 9 : mode infini et défi du jour (faite le 27 octobre 2026)

- [x] **Mode infini** : on enchaîne les vagues aussi longtemps que possible.
      Des « zones » d'environ 1 min 30 (les 8 niveaux sans boss, en boucle), chacune un peu plus dure ;
      les cœurs se remplissent à chaque zone ; tableau des scores à part (avec la zone atteinte).
- [x] **Défi du jour** : le même parcours pour tout le monde pendant une journée.
      La date choisit le niveau, le hasard et une règle : TURBO, FRAGILE (2 cœurs, 5 vies),
      PLUIE DE BONUS ou LA HORDE. Essais illimités, tableau des scores du jour (sur l'appareil).

## Étape 10 : finitions (faite le 27 octobre 2026, sauf les essais sur téléphone)

- [x] Nouvelles musiques : océan, château, boss squelette (et une musique de victoire pour l'écran de fin).
- [x] Réglage de la difficulté avec le robot de test : l'Araignée de Fer était plus dure que le boss final
      (adoucie), les niveaux 6 et 7 trop faciles (un peu plus d'ennemis et d'obstacles).
- [ ] Essais sur téléphone (par toi).

---

# Suite : couleurs du chat et vraie difficulté (plan du 28 octobre 2026)

Décisions (28 octobre) : les 6 couleurs et leurs succès sont **validés** ; un nouveau joueur commence
en mode **NORMAL** ; les scores de l'ancien mode difficile passent dans le nouveau mode NORMAL.

## Étape 11 : maquette des couleurs du chat licorne

Nouveaux **succès plus durs**, qui débloquent chacun une **couleur du chat** (en plus des soucoupes).
On peut changer la fourrure, l'intérieur des oreilles et les joues, la crinière, la corne et les yeux.

Proposition (à valider sur la maquette) :

| Couleur du chat | Succès pour la gagner |
|---|---|
| Roux (crinière rouge et jaune) | **SANS FAUTE** : finir un niveau sans être touché une seule fois |
| Noir (crinière violette, corne argent) | **NUIT NOIRE** : finir le jeu en mode difficile |
| Doré (corne et crinière blanches) | **COLLECTIONNEUR** : 3 étoiles sur les 10 niveaux |
| Galaxie (fourrure bleu nuit étoilée) | **MARATHON** : atteindre la zone 15 en mode infini |
| Fantôme (fourrure transparente) | **FIDÈLE** : réussir 7 défis du jour |
| Squelette (os blancs, yeux verts) | **CHASSEUR DE BOSS** : vaincre les deux boss sans perdre de vie |

- [x] Maquette sur la page des maquettes : les 6 chats en grand, avec leur succès.
- [x] Maquette de l'écran « Apparence » (remplace « Soucoupes ») : on choisit la soucoupe ET le chat.
- [x] Maquette de l'écran des succès sur 2 pages (on passera de 14 à 20 succès).
- [x] Maquette de la nouvelle pluie de météorites (niveau 6).
- [x] Validation de la maquette par toi (28 octobre ; couleurs du petit chat renforcées).

## Étape 12 : trois modes de difficulté

- [x] Le jeu actuel devient le mode **FACILE**, sans rien changer.
      Ce qui est enregistré en « normal » (Continuer, scores, étoiles) passe en « facile » : rien n'est perdu.
- [x] Nouveau mode **NORMAL**, plus dur, et vrai mode **DIFFICILE**.
- [x] Choix sur la ligne MODE de l'accueil : FACILE, NORMAL, DIFFICILE, INFINI, DÉFI DU JOUR.
- [x] Le mode infini et le défi du jour se basent sur le nouveau mode NORMAL.

Valeurs retenues après les essais du robot (28 octobre) :

| | Facile | Normal | Difficile |
|---|---|---|---|
| Vies | 3 | 3 | 2 |
| Monstres : résistance | normale | x 1,3 | x 1,45 |
| Nombre de monstres | normal | + 15 % | + 25 % |
| Obstacles | normal | + 20 % | + 30 % |
| Vitesse des monstres et des tirs | normale | + 5 % | + 10 % |
| Tirs ennemis | normaux | + 15 % | + 25 % |
| Vie des boss | normale | x 1,2 | x 1,3 |
| Bonus | normaux | normaux | - 10 % |

Parties gagnées par le robot (qui joue moins bien qu'un humain) : environ 2 sur 3 en facile,
1 sur 3 en normal, 1 sur 13 en difficile. Les premières valeurs du tableau du dessus étaient
bien trop dures (le robot perdait tout en difficile en une à deux minutes).

Ce qui change d'un mode à l'autre (valeurs de départ, à ajuster avec le robot) :

| | Facile (actuel) | Normal | Difficile |
|---|---|---|---|
| Vies | 3 | 3 | 2 |
| Monstres : résistance | normale | x 1,5 | x 2 |
| Nombre de monstres | normal | + 25 % | + 50 % |
| Obstacles | normal | + 30 % | + 60 % |
| Vitesse des monstres et des tirs | normale | + 10 % | + 20 % |
| Tirs ennemis | normaux | + 25 % | + 50 % |
| Vie des boss | normale | x 1,3 | x 1,6 |
| Bonus | normaux | normaux | - 20 % |

Objectif mesuré avec le robot (qui joue moins bien qu'un humain) : en facile, comme aujourd'hui ;
en normal, environ moitié moins de victoires ; en difficile, le robot ne gagne qu'une à deux parties sur dix.

## Étape 13 : pas de planque en haut ou en bas de l'écran

Premier test (28 octobre) : deux robots tricheurs restent collés en haut ou en bas et tirent sans
esquiver. Ils perdent sur les 10 niveaux (4 à 16 coups reçus par minute). Mais ils n'esquivent pas,
le test doit donc être plus malin :

- [x] Ajouter au test automatique deux robots « planqués » qui esquivent, mais seulement dans une bande
      en haut (ou en bas) de l'écran. Règle : sur chaque niveau et dans chaque mode, ils doivent faire
      **nettement moins bien** que le robot normal.
- [ ] Là où une planque marche encore, ajouter du danger dans les bords :
  - des vagues de monstres qui passent tout en haut et tout en bas, ou qui visent la hauteur du chat ;
  - dans les niveaux sans sol ni plafond (1, 2, 6, 7), des obstacles qui touchent aussi les bords ;
  - si le chat reste plus de 5 secondes collé à un bord, la vague suivante arrive par ce bord. **Fait.**
- [x] Résultat (mode normal) : sur les 10 niveaux, un robot planqué reçoit 1,5 à 4 fois plus de coups que le
      robot normal. Il a quand même gagné une partie sur 3 au niveau 1 (en bas) et au niveau 3 (en haut).
- [x] **Pluie de comètes** (niveau 6) : aujourd'hui elles partent toutes du haut à droite et descendent
      vers la gauche, donc le coin en haut à gauche est toujours à l'abri. Elles arriveront aussi
      d'en bas (en remontant) et à des hauteurs variées, pour couvrir tout l'écran.
- [x] **Nouvelle apparence des comètes** : un vrai rocher qui brûle, avec une traînée de feu
      dans le sens de sa course (aujourd'hui la traînée reste à l'horizontale).
- [ ] Vérifier en mode facile, normal et difficile, puis captures d'écran des endroits modifiés.

## Retouches du 28 octobre
- [x] Niveau 1, ceinture de donuts : des mouches arrivent aussi dans le passage du chat (7 colonnes sur 10 environ).
- [x] Niveau 3 : plus de toiles d'araignée et plus d'araignées suspendues, qui descendent plus bas.

## Ordre proposé

1. Étape 11 (maquette) : je la fais en premier pour que tu puisses la regarder pendant la suite.
   La nouvelle apparence des comètes sera aussi sur la maquette.
2. Étapes 12 et 13 ensemble, car elles se règlent avec le même robot.
3. Après ta validation de la maquette : les couleurs du chat dans le jeu (nouvelle étape 14).
4. Nouveaux niveaux : idées à venir de ta part.

---

# Le monde Vulcano : niveaux 11 à 16 (idées du 28 octobre 2026)

Avis : très bonne suite. Après l'eau, le feu change complètement les couleurs. Et plusieurs idées
occupent tout l'écran (lianes qui tombent du haut, coulées de lave verticales qui obligent à bouger
de gauche à droite, mini-scorpions partout) : parfait contre les planques en haut ou en bas.
Points d'attention :
- Le niveau 11 est le 3e niveau dans l'espace : il lui faut sa propre identité
  (la nouvelle pluie de météorites et de nouveaux ennemis).
- Le chat ne tire que vers l'avant : quand le scorpion se retourne et passe derrière lui,
  ce sera un moment pour esquiver, court et annoncé, puis il revient devant.
- Niveau 16 (les 3 boss à la suite) : en cas de game over, on reprend au boss en cours,
  pas au premier. Une petite pause avec des bonus entre deux boss.
- C'est un gros morceau (6 niveaux, un boss à 3 formes, 2 histoires en BD) : maquettes d'abord.
- La difficulté continue de monter jusqu'au niveau 16, dans tous les modes.

## Histoires en BD
- Avant le niveau 11 : « Nouvel appel à l'aide » (la fête sur la planète aquatique, un petit
  phénix arrive avec un message, le Scorpion volant de feu sur le volcan, départ pour Vulcano).
- Avant le niveau 16 : les 3 boss s'allient et construisent un vaisseau ; le chat s'y glisse.

## Les niveaux
- **11. Retour dans l'espace** : pluie de météorites (nouvelle version), sorbets volants,
  éclaireurs du Scorpion.
- **12. Approche de Vulcano** : le ciel passe du bleu au jaune, orange et rouge à mesure qu'on
  approche ; chauves-souris de braise, dragonnets, rochers de feu flottants.
- **13. Sur la planète Vulcano** : arbres en feu de plusieurs tailles ; lianes qui pendent du ciel,
  s'allongent, rétrécissent ou se détachent ; salamandres ; serpents de magma ; lucioles de feu.
- **14. Dans l'antre du volcan** : coulées de lave verticales de quelques secondes (annoncées) ;
  boules de feu ; mini-scorpions volants partout ; phénix-poussins ; golems de lave.
- **15. La salle du trône du volcan** : le **Scorpion volant de feu**, plus petit et rapide,
  vole et se retourne, crache du feu et des boules de feu. À vaincre 3 fois :
  armure de fer, puis carapace de feu, puis scorpion squelette, chaque fois avec une escorte.
- **16. Le vaisseau des boss** : les 3 boss l'un après l'autre dans une grande salle.

## Ennemis proposés (à valider sur les maquettes)
| Ennemi | Niveaux | Ce qu'il fait |
|---|---|---|
| Sorbet volant | 11 | soucoupe en cornet de glace, lance des boules de sorbet qui ralentissent |
| Éclaireur du Scorpion | 11, 12 | petit drone rouge en formation, plonge vers le chat |
| Chauve-souris de braise | 12, 13 | en nuée ; vaincue, elle éclate en 3 étincelles qui tombent |
| Dragonnet | 12, 14 | s'arrête, puis souffle un jet de feu horizontal (annoncé) |
| Salamandre | 13 | marche au sol, saute, crache des gouttes de feu en cloche |
| Serpent de magma | 13, 14 | jaillit de la lave en bas de l'écran et retombe en arc |
| Luciole de feu | 13 à 15 | remplace les mouches dans le monde Vulcano |
| Mini-scorpion volant | 14, 15 | partout sur l'écran : s'arrête, vise, puis fonce |
| Phénix-poussin | 14 | renaît de ses cendres une fois, sauf si on tire sur les cendres |
| Golem de lave | 14 | lent et très solide ; seules ses fissures brillantes sont fragiles |

## Étapes
- [x] Maquettes : niveaux 11 à 16, personnages de Vulcano, le Scorpion sous ses 3 formes, les 2 BD.
- [ ] Validation des maquettes de Vulcano par toi.
- [ ] Niveaux 11 et 12, et la BD « Nouvel appel à l'aide ».
- [ ] Niveaux 13 et 14.
- [ ] Niveau 15 : le Scorpion volant de feu.
- [ ] Niveau 16 : la BD et les 3 boss à la suite.
- [ ] Musiques de Vulcano et du Scorpion.
