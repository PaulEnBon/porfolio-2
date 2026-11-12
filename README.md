# Portfolio — Paul Bourdareau Launay

Portfolio orienté cybersécurité. Site statique (`public/`) servi par un petit serveur Node sans dépendance (`server.js`) qui ajoute une CSP stricte et les en-têtes de sécurité.

## En local

```bash
npm start        # http://localhost:3000
npm test         # en-têtes, traversée de répertoire, méthodes HTTP
```

## Déploiement Scalingo

Le dépôt est prêt : `package.json` déclenche le buildpack Node.js, le `Procfile` lance `node server.js`, le serveur écoute sur `$PORT`.

```bash
scalingo create mon-portfolio
git push scalingo main
```

Ou, depuis le tableau de bord Scalingo : lier le dépôt GitHub et activer le déploiement automatique de `main`.

## Modifier le contenu

Le texte français est dans `public/index.html` ; chaque élément traduisible porte une clé `data-i18n`. Les autres langues sont dans `public/lang/<code>.json` (mêmes clés), chargées à la demande par le sélecteur de la barre de navigation. `en-GB.json` ne contient que ses écarts avec `en-US.json`.

Après une modification du texte français, reporter le changement sous la même clé dans chaque fichier de `public/lang/`. Pour ajouter une langue : un fichier `public/lang/<code>.json` et une ligne `<option>` dans le sélecteur ; `npm test` signale toute clé manquante. Les effets (pluie de caractères, glitch, terminal) sont dans `public/script.js` et `public/style.css`, et se coupent seuls si le visiteur a activé « réduire les animations ».
