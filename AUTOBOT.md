# Autobot Deploy (base H-h-h / Goat-Bot V2)

Le bot fonctionne maintenant comme Aryauto : on le déploie depuis une page web
en collant simplement le cookie (appstate) d'un compte Facebook.

## Démarrage
```
npm install
npm start        # ouvre http://localhost:3000 (ou $PORT)
```

## Utilisation
1. Ouvrir la page.
2. Coller l'appstate JSON du compte Facebook.
3. Cocher les commandes et les events voulus (bouton "Tout sélectionner" possible).
4. Entrer le prefix et l'UID admin.
5. Cocher les conditions puis "Déployer".

Le panneau écrit `account.dev.txt` (cookie), met à jour `config.dev.json`
(prefix + admin) et `configCommands.dev.json` (les commandes non cochées sont
mises dans `commandUnload` / `commandEventUnload`), puis lance `Goat.js`.
Statut, uptime, logs en direct et bouton "Arrêter le bot" sont sur la page.

## Fichiers
- `index.js` : lance et surveille le panneau.
- `auto.js`  : serveur de déploiement (API /commands, /login, /info, /logs, /stop).
- `public/`  : interface web.
- `Goat.js` + `bot/` + `scripts/` : moteur du bot (inchangé).

## Commandes supprimées
`scripts/cmds/cmd.js`, `scripts/cmds/system.js`, `scripts/cmds/file.js` ont été
supprimées et sont aussi forcées dans la liste `commandUnload`.
