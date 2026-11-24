# OCP Java SE Trainer

Site d'entraînement à la certification **Oracle Certified Professional, Java SE 21 Developer (1Z0-830)** :
50 questions, 120 minutes, 68 % pour réussir.

Le site est statique (HTML, CSS, JavaScript) : rien à installer, aucun serveur, aucune donnée envoyée ailleurs que dans le navigateur.

## Contenu

- **332 questions** au format de l'examen, dont 274 avec du code et 98 à réponses multiples
- **112 sections de cours** réparties sur les 10 thèmes de l'examen
- Questions et réponses en anglais, comme à l'examen ; cours et explications en français

| Thème | Questions |
| --- | --- |
| Dates, texte, nombres et booléens | 35 |
| Contrôle du flux | 30 |
| Programmation orientée objet | 56 |
| Exceptions | 25 |
| Tableaux et collections | 32 |
| Lambdas et streams | 54 |
| Modules et déploiement | 25 |
| Concurrence | 30 |
| Entrées / sorties | 25 |
| Localisation | 20 |

## Utilisation

Cloner le dépôt puis ouvrir `index.html` dans un navigateur.
La progression est enregistrée dans le navigateur (`localStorage`) ; elle s'exporte et s'importe depuis **Réglages**.

| Page | Rôle |
| --- | --- |
| Tableau de bord | Pourcentage « prêt », progression par thème, historique des examens blancs |
| Cours | Fiche de révision de chaque thème de l'examen (règles, tableaux, pièges) |
| Entraînement | Séries par thème, filtre (jamais vues, ratées, marquées), correction immédiate et expliquée |
| Examen blanc | 50 questions tirées au hasard, chronomètre de 120 minutes, correction détaillée à la fin |
| Mes erreurs | Questions ratées la dernière fois et questions marquées, à retravailler |

## Limites

- Projet personnel, sans lien avec Oracle : les questions sont originales, ce ne sont pas des questions de l'examen réel.
- Oracle ne publie pas le poids de chaque thème : la répartition de l'examen blanc est une estimation.
- Le code des questions a été compilé avec `javac --release 21` sur un JDK 25, pas sur un JDK 21.

## Structure

```
index.html
css/style.css
js/registry.js      thèmes de l'examen et registre de contenu
js/app.js           interface, moteur de quiz, progression
js/data/*.js        cours et questions, un fichier par thème
tools/              contrat de contenu et script de contrôle
```

## Ajouter ou corriger du contenu

Le format est décrit dans [tools/CONTENT_GUIDE.md](tools/CONTENT_GUIDE.md). Après toute modification :

```
node tools/validate.js
```

Chaque question contenant du code doit avoir été compilée et exécutée (`javac --release 21`) avant d'être ajoutée.

## Licence

Code et contenu sous licence [MIT](LICENSE).
