# OCP Java SE Trainer

Site d'entraînement à la certification **Oracle Certified Professional, Java SE 21 Developer (1Z0-830)** :
50 questions, 120 minutes, 68 % pour réussir.

## Utilisation

Aucune installation : ouvrir `index.html` dans un navigateur.
La progression est enregistrée dans le navigateur (`localStorage`) ; elle s'exporte et s'importe depuis **Réglages**.

| Page | Rôle |
| --- | --- |
| Tableau de bord | Pourcentage « prêt », progression par thème, historique des examens blancs |
| Cours | Fiche de révision de chaque thème de l'examen (règles, tableaux, pièges) |
| Entraînement | Séries par thème, filtre (jamais vues, ratées, marquées), correction immédiate et expliquée |
| Examen blanc | 50 questions tirées au hasard, chronomètre de 120 minutes, correction détaillée à la fin |
| Mes erreurs | Questions ratées la dernière fois et questions marquées, à retravailler |

Les questions et les réponses sont en anglais, comme à l'examen ; les cours et les explications sont en français.

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
