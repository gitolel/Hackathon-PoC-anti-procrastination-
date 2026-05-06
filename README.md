# ProcrastiNO — Hackathon PoC Anti-Procrastination

## 📝 Description du Projet
**ProcrastiNO** est une extension de navigateur développée dans le cadre du **Hackathon PoC (Proof of Concept) sur le thème de l'Anti-Procrastination**.

L'objectif principal de ce projet est de combattre la procrastination de manière agressive et humoristique. L'extension surveille l'activité de l'utilisateur et détecte le temps passé sur des sites considérés comme des sources de distraction (YouTube, Reddit, Twitter, Netflix, etc.). Plus l'utilisateur passe de temps sur ces sites au lieu de travailler, plus l'extension devient intrusive et agressive pour le forcer à retourner à sa tâche.

---

## 🚀 Fonctionnalités Principales

### Détection & Paramétrage
- **Détection Automatique :** Surveille en arrière-plan le temps passé sur une liste prédéfinie de sites chronophages.
- **Paramétrage Personnalisé :** L'utilisateur peut définir la tâche sur laquelle il est censé travailler ainsi que son prénom via le popup de l'extension.

### Deux Modes de Surveillance

Depuis le popup, l'utilisateur choisit son mode avant de commencer :

#### 😊 Mode Soft
Notifications et bannières escaladées uniquement (niveaux 0 à 4). Aucun blocage de page, aucun gauntlet, aucune prison. Idéal pour une surveillance légère.

#### 💀 Mode Hard
Escalade complète (niveaux 0 à 4) **et** déclenchement automatique du **Gauntlet des Procrastinateurs** à 3 minutes. C'est le seul point de monétisation de l'extension.

---

### Escalade de l'Agressivité (5 Niveaux — commun aux deux modes)

| Niveau | Délai | Comportement |
|--------|-------|--------------|
| 0 | 30s | Bannière discrète — rappel amical |
| 1 | 1min | Bannière plus visible, ton qui change |
| 2 | 2min | Overlay bloquant au centre de l'écran |
| 3 | 3min | Screen shake + alerte rouge — **déclenche le Gauntlet en mode Hard** |
| 4 | 5min | Option nucléaire 💀 : écran sombre, pluie d'emojis, messages d'une agressivité maximale |

---

### 🔮 Le Gauntlet des Procrastinateurs *(Mode Hard uniquement)*

Au niveau 3, tous les onglets distrayants sont immédiatement bloqués par un overlay plein écran. L'utilisateur a **30 minutes** pour compléter le gauntlet.

**Déroulement — 4 questions progressives :**

1. **Q1 — Facile** : Calcul mental simple (ex. 12 × 7)
2. **Q2 — Moyen** : Problème arithmétique en plusieurs étapes
3. **Q3 — Difficile** : Algèbre ou logique (ex. résoudre 3x + 7 = 22)
4. **Q4 — Facile… mais payante** : Question simple (ex. 2 + 2), mais la soumission coûte **10 €** (simulé via un faux formulaire bancaire). Affiché clairement : *"La réponse est gratuite à penser — mais coûte 10 € à soumettre."*

**Règles :**
- Les questions s'affichent une par une avec une barre de progression (Question X / 4).
- Une mauvaise réponse sur Q1–Q3 déclenche immédiatement la **Prison**.
- Q4 nécessite un paiement simulé avant d'accepter la réponse.
- Si le gauntlet n'est pas complété avant les 30 minutes, il expire : tous les onglets sont débloqués et l'escalade repart à zéro. Aucune pénalité.
- Si l'utilisateur recharge ou ferme un onglet distrayant pendant le gauntlet, l'overlay est restauré immédiatement au chargement de la page (le countdown continue).

**Issue favorable :** Réponse correcte à Q4 + paiement → gauntlet résolu, **30 minutes de navigation libre** accordées.

---

### ⛓️ La Prison *(Mode Hard — conséquence d'une mauvaise réponse)*

Une mauvaise réponse sur Q1–Q3 déclenche immédiatement la prison sur **tous** les onglets distrayants.

- Overlay plein écran, fond quasi-noir, compte à rebours monospace bien visible.
- Durée : **30 minutes fixes**. Aucun moyen de sortir avant la fin.
- Après expiration : tous les onglets sont débloqués, l'escalade repart à zéro.
- Persistant : recharger un onglet distrayant pendant la prison affiche à nouveau le blocage.

---

### ✅ Pass de Navigation Libre

Après avoir réussi le gauntlet (Q4 correcte + paiement simulé), l'utilisateur dispose de **30 minutes de navigation libre** sur tous les sites surveillés. Un countdown est affiché dans le popup.

---

### Notifications & Tableau de Bord

- **Notifications Système :** Notifications natives du navigateur en parallèle des alertes visuelles.
- **Popup intégré :** Sélecteur de mode Soft/Hard, toggle d'activation, compteur de sites distrayants ouverts, barre des niveaux d'alerte, et cartes de statut en temps réel (Gauntlet / Prison / Pass actif).

---

## 🛠️ Stack Technique

- **Technologies Web Standards :** HTML, CSS (Vanilla), JavaScript.
- **WebExtensions API :** Compatible Chrome et Firefox (`chrome.*` / `browser.*`).
- **Composants de l'extension :**
  - `manifest.json` : Configuration (Manifest V3).
  - `background.js` : Service worker gérant la détection des URLs, l'escalade, les cycles gauntlet/prison/pass et les timers globaux.
  - `content.js` : Script injecté dans les pages web pour afficher bannières, overlays, gauntlet, prison, screen shake et animations. Restaure les overlays actifs au rechargement de la page.
  - `popup.html` & `popup.js` : Interface utilisateur avec sélecteur de mode, statuts en temps réel et contrôles de tâche.

### Clés de stockage (`chrome.storage.local`)

| Clé | Type | Rôle |
|-----|------|------|
| `procrastinoMode` | `"soft"` \| `"hard"` | Mode de surveillance actif |
| `gauntletDeadline` | `number` (ms Unix) | Présent pendant un gauntlet actif |
| `jailEndTime` | `number` (ms Unix) | Présent pendant une session de prison |
| `passEndTime` | `number` (ms Unix) | Fin du pass de navigation libre |
| `workTask` | `string` | Tâche en cours |
| `userName` | `string` | Prénom de l'utilisateur |

---

## ⚙️ Comment tester le PoC

1. Cloner ou télécharger ce dépôt.
2. Ouvrir le navigateur (Chrome ou un navigateur basé sur Chromium).
3. Aller dans les paramètres des extensions (`chrome://extensions/`).
4. Activer le **"Mode développeur"** en haut à droite.
5. Cliquer sur **"Charger l'extension non empaquetée"** (Load unpacked) et sélectionner le dossier du projet.
6. Cliquer sur l'icône de l'extension, entrer une tâche, choisir le mode **Hard**, activer la surveillance.
7. Ouvrir YouTube ou Reddit — l'escalade démarre. À 3 minutes, le **Gauntlet** s'ouvre !
8. Pour tester sans attendre : utiliser le bouton **"🧪 Tester l'extension maintenant"** dans le popup.