# ProcrastiNO — Hackathon PoC Anti-Procrastination

## 📝 Description du Projet
**ProcrastiNO** est une extension de navigateur développée dans le cadre du **Hackathon PoC (Proof of Concept) sur le thème de l'Anti-Procrastination**. 

L'objectif principal de ce projet est de combattre la procrastination de manière agressive et humoristique. L'extension surveille l'activité de l'utilisateur et détecte le temps passé sur des sites considérés comme des sources de distraction (YouTube, Reddit, Twitter, Netflix, etc.). Plus l'utilisateur passe de temps sur ces sites au lieu de travailler, plus l'extension devient intrusive et agressive pour le forcer à retourner à sa tâche.

## 🚀 Fonctionnalités Principales

- **Détection Automatique :** Surveille en arrière-plan le temps passé sur une liste prédéfinie de sites chronophages.
- **Paramétrage Personnalisé :** L'utilisateur peut définir la tâche sur laquelle il est censé travailler ainsi que son prénom via l'interface (popup) de l'extension.
- **Escalade de l'Agressivité (5 Niveaux) :**
  - **Niveau 0 (30s) - Le rappel amical :** Une petite bannière discrète pour rappeler à l'utilisateur qu'il a du travail.
  - **Niveau 1 (1min) - L'agacement :** La bannière devient plus visible et le ton change.
  - **Niveau 2 (2min) - La colère :** Apparition d'un overlay bloquant au milieu de l'écran avec un message agressif. L'utilisateur doit cliquer sur un bouton pour l'enlever.
  - **Niveau 3 (3min) - L'alerte rouge :** L'écran commence à trembler (Screen Shake) et l'alerte devient très insistante.
  - **Niveau 4 (5min) - L'Option Nucléaire 💀 :** L'écran s'assombrit presque totalement, une pluie d'emojis tombe sur l'écran, l'écran tremble, et les messages sont d'une agressivité maximale ("Tes ambitions pleurent").
- **Notifications Système :** Envoie des notifications natives de navigateur en parallèle des alertes visuelles sur la page.
- **Tableau de Bord Intégré :** Un popup élégant permet d'activer/désactiver l'extension, de voir le nombre de sites distrayants actuellement ouverts, et de tester l'extension.

## 🛠️ Stack Technique
- **Technologies Web Standards :** HTML, CSS (Vanilla), JavaScript.
- **WebExtensions API :** Compatible Chrome et Firefox (`chrome.*` / `browser.*`).
- **Composants de l'extension :**
  - `manifest.json` : Configuration (Manifest V3).
  - `background.js` : Service worker gérant les timers, la détection des URLs et l'envoi des notifications.
  - `content.js` : Script injecté dans les pages web pour afficher les bannières, les popups overlay et les animations (tremblements d'écran, etc.).
  - `popup.html` & `popup.js` : Interface utilisateur accessible via l'icône de l'extension.

## ⚙️ Comment tester le PoC

1. Cloner ou télécharger ce dépôt.
2. Ouvrir le navigateur (Chrome ou un navigateur basé sur Chromium).
3. Aller dans les paramètres des extensions (`chrome://extensions/`).
4. Activer le **"Mode développeur"** en haut à droite.
5. Cliquer sur **"Charger l'extension non empaquetée"** (Load unpacked) et sélectionner le dossier du projet.
6. Cliquer sur l'icône de l'extension, entrer une tâche à accomplir, activer la surveillance et aller sur un site comme YouTube pour voir l'escalade au fil des minutes !
