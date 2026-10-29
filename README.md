# Dead Horizon — Hazebrouck en ligne

Dead Horizon remplace l’ancien projet Dead County dans ce dépôt. L’historique Git conserve les anciennes versions.

**Site :** https://dead-horizon-coop-291026.keentoad34.chatgpt.site/

**Version PC :** https://github.com/akirasenzu/dead-horizon/releases/latest

## Jouer

Téléchargez `DeadHorizon.exe`, ouvrez le lanceur, connectez-vous à votre compte, créez votre personnage puis cliquez sur **Rejoindre le serveur**. Tous les joueurs rejoignent le même monde Hazebrouck, sans code ni salon. Internet est nécessaire pour ce mode ; le solo reste disponible hors connexion.

Le lanceur Windows x64 embarque .NET et les fichiers du jeu. Il utilise le composant Microsoft WebView2 Evergreen, déjà installé sur la plupart des PC Windows récents. Le lien officiel pour l’installer si nécessaire : https://developer.microsoft.com/microsoft-edge/webview2/.

## Cette version alpha

- Serveur commun jusqu’à **16 joueurs simultanés**.
- Chaque PC contrôle son propre personnage ; aucun duo sur le même clavier.
- Positions, santé, inventaires, tirs, zombies, caisses et voiture calculés par le serveur.
- Une voiture partagée (quatre places) ; catalogue de 174 modèles. Le premier joueur d’un nouveau monde définit son modèle. Le choix du véhicule en solo reste libre.
- Près de 14 000 bâtiments, rues réelles et six lieux à découvrir. Plan agrandi de 30 % pour le jeu ; hauteurs rehaussées, portes de 2,65 m, plafonds de 3,4 m. Plus de 9 500 bâtiments disposent d’un rez-de-chaussée accessible, avec pièces, mobilier et collisions. Les étages restent visuels. Les plans intérieurs sont générés et ne représentent pas les domiciles réels.
- Sauvegarde du monde en base D1. Les mises à jour peuvent imposer une remise à zéro.
- Munitions et ressources renouvelables. Les commandes sont synchronisées par requêtes HTTP périodiques avec interpolation côté client : ce prototype ne vise pas les latences d’un FPS compétitif.
- Comptes avec identifiant et mot de passe, connexion mémorisée au choix pendant 30 jours. Un seul personnage vivant par compte ; nom, apparence, inventaire et progression conservés sur le serveur. Mort définitive : création d’un nouveau personnage. Pas de chat ni de serveur privé.

## Commandes

ZQSD / WASD : marcher ou conduire · E : ouvrir ou fermer une porte / fouiller / monter / descendre · Espace : tirer · R : recharger · F : mêlée · X : arme secondaire · T : munition · I : inventaire · M : carte · F5 : vue.

Échap libère la souris et ouvre le menu ; le monde continue en ligne. F11 ou Alt + Entrée change le plein écran dans le lanceur. Alt + F4 ferme le jeu et revient au lanceur.

## Construire

Node.js 24+, pnpm 11.25.0. Pour la version Windows : SDK .NET 10 sur Windows.

```sh
node scripts/prepare-assets.mjs
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Les ressources volumineuses (carte, moteur Three.js, illustration et icône) sont téléchargées par `prepare-assets.mjs` depuis les URL déclarées dans `scripts/asset-sources.json`. Leurs empreintes SHA-256 sont vérifiées. Elles sont ensuite embarquées : le jeu solo ne dépend pas d’un CDN.

Prévisualisation avec SQLite locale, distincte de la base de production :

```sh
node scripts/preview-online.mjs
```

Ouvrez http://127.0.0.1:4318/. Pour le lanceur, depuis PowerShell :

```powershell
./scripts/build-desktop.ps1
```

## Publication

- `web/` : page publique et jeu.
- `server/` : monde persistant et routes `/api/world/join`, `/api/world/input`, `/api/world/leave`, `/api/status`.
- `.openai/hosting.json` : projet Sites existant et liaison D1 `DB`.
- `drizzle/` : migrations de schéma, appliquées par Sites avant publication.
- `desktop/` : lanceur natif Windows avec moteur WebView2 embarqué.
- `docs/` : page GitHub Pages du dépôt, liée au site et au téléchargement du lanceur.
- GitHub Actions construit les sources et publie une version PC lors des mises à jour de `main`.

Les intérieurs sont préparés lors de la construction, puis chargés à proximité du joueur. Les portes sont persistantes et partagées. La mise à l’échelle migre les positions et conserve les inventaires du monde existant.

Le protocole transmet des commandes, pas une copie arbitraire du monde du client. Le serveur vérifie les sessions, déduplique les commandes et arbitre les prises de ressources avec une mise à jour atomique du monde. La limite actuelle et la synchronisation HTTP imposent des essais de charge avant d’augmenter le nombre de joueurs.

## Attributions

Carte : © OpenStreetMap contributors, ODbL — voir `web/game/MAP-LICENSE.txt` et https://www.openstreetmap.org/copyright.

Three.js : MIT — voir le fichier récupéré `web/game/vendor/THREE-LICENSE.txt`.

.NET : https://github.com/dotnet/runtime/blob/main/LICENSE.TXT. Microsoft WebView2 : licence Microsoft dans son paquet NuGet officiel.

Les bâtiments, véhicules et équipements sont des modèles procéduraux simplifiés.

## Mises à jour automatiques du lanceur (2.2+)

Une dernière installation du lanceur 2.2 est nécessaire pour les anciennes versions. Ensuite, ouvrez le même fichier ou raccourci : il recherche la dernière version officielle au démarrage, télécharge automatiquement le jeu et le lanceur, vérifie la taille et l’empreinte SHA-256, puis redémarre. Les réglages, le profil local et la progression serveur sont conservés.

Les versions sont installées sans droits administrateur dans `%LOCALAPPDATA%/DeadHorizon/Versions`. Le fichier téléchargé à l’origine reste le point d’entrée : il lance la version vérifiée en cache même hors connexion. Aucun fichier exécutable en cours d’utilisation n’est remplacé. Une panne réseau ou un téléchargement incomplet laisse la version installée disponible ; le bouton Réessayer relance la vérification. La mise à jour se fait avant de jouer.

Le workflow construit une version unique (`major.minor.GITHUB_RUN_NUMBER`), prépare `update.json` et publie les fichiers dans une release brouillon. Elle devient publique seulement une fois tous les fichiers chargés. Le lanceur accepte uniquement l’URL du fichier `DeadHorizon.exe` de cette release GitHub officielle et refuse les versions plus anciennes. La source et les empreintes restent dans le même dépôt de confiance ; les exécutables ne sont pas signés Authenticode.

Tests du système de mise à jour : `dotnet run --project test/updater/Updater.Tests.csproj -c Release`.

## Comptes et personnages (3.0+)

Les comptes utilisent D1 : identifiant unique, mot de passe protégé par scrypt (N=32768, r=8, p=3, sel aléatoire unique) et jetons de connexion aléatoires de 256 bits dont seule l’empreinte est stockée. Limitation des tentatives par compte et adresse, corps de requêtes bornés, autorisation côté serveur et origine contrôlée. Le client ne conserve jamais le mot de passe. La session peut être mémorisée pendant 30 jours ; la déconnexion la révoque.

Les personnages font partie de la sauvegarde atomique du monde. Reconnexion ou autre PC : le compte retrouve le même personnage, sa position, sa santé et ses stocks. Le serveur refuse la recréation d’un personnage vivant et la résurrection d’un personnage mort. Après décès, un nouveau nom, une nouvelle apparence et un nouvel équipement peuvent être choisis. Le mode solo hors connexion reste indépendant, sans compte.

Les niveaux de travail de scrypt suivent la recommandation équivalente à mémoire de 32 Mio de l’[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt), avec la bibliothèque [noble-hashes](https://github.com/paulmillr/noble-hashes). Les calculs sont sérialisés par instance pour limiter la mémoire de l’hébergement. Aucune récupération de mot de passe par e-mail n’est implémentée.
