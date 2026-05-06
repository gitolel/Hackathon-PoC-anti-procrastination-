const api = typeof browser !== "undefined" ? browser : chrome;

const enabledToggle      = document.getElementById("enabledToggle");
const statusDot          = document.getElementById("statusDot");
const statusLabel        = document.getElementById("statusLabel");
const taskInput          = document.getElementById("taskInput");
const nameInput          = document.getElementById("nameInput");
const saveBtn            = document.getElementById("saveBtn");
const savedNotice        = document.getElementById("savedNotice");
const statTabs           = document.getElementById("statTabs");
const activeTabsBox      = document.getElementById("activeTabsBox");
const activeTabsList     = document.getElementById("activeTabsList");
const sitesToggle        = document.getElementById("sitesToggle");
const sitesList          = document.getElementById("sitesList");
const activeTaskControls = document.getElementById("activeTaskControls");
const activeTaskHeader   = document.getElementById("activeTaskHeader");
const completeTaskBtn    = document.getElementById("completeTaskBtn");
const modeSoftBtn        = document.getElementById("modeSoftBtn");
const modeHardBtn        = document.getElementById("modeHardBtn");
const modeDesc           = document.getElementById("modeDesc");
const gauntletCard       = document.getElementById("gauntletCard");
const gauntletTimerEl    = document.getElementById("gauntletTimer");
const jailCard           = document.getElementById("jailCard");
const jailTimerEl        = document.getElementById("jailTimer");
const passCard           = document.getElementById("passCard");
const passTimerEl        = document.getElementById("passTimer");

// ── Init ──────────────────────────────────────────────────────────────────────

api.storage.local.get(["enabled", "userName", "workTask", "procrastinoMode"], (data) => {
  enabledToggle.checked = data.enabled || false;
  taskInput.value  = data.workTask || "";
  nameInput.value  = data.userName || "";
  updateToggleUI(data.enabled || false);
  setMode(data.procrastinoMode || "soft", false);
});

refreshState();
setInterval(refreshState, 1000);

// ── State polling ─────────────────────────────────────────────────────────────

function refreshState() {
  api.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
    if (api.runtime.lastError || !res) return;

    // Active tabs
    const count = res.activeTabs || 0;
    statTabs.textContent = count;
    if (count > 0 && res.enabled) {
      activeTabsBox.classList.add("visible");
      const tabs = res.tabs || {};
      const lines = Object.values(tabs).map(t => {
        try {
          const host = new URL(t.url).hostname.replace("www.", "");
          const elapsed = Math.floor((Date.now() - t.startTime) / 1000);
          const mins = Math.floor(elapsed / 60);
          const secs  = elapsed % 60;
          return "• " + host + " — " + (mins > 0 ? (mins + "m" + secs + "s") : (secs + "s"));
        } catch { return ""; }
      }).filter(Boolean);
      activeTabsList.innerHTML = lines.join("<br>");
    } else {
      activeTabsBox.classList.remove("visible");
    }

    // Escalation bar
    const tabs = res.tabs || {};
    const maxLevel = Object.values(tabs).reduce((max, t) => Math.max(max, t.level || 0), -1);
    document.querySelectorAll(".step").forEach(el => {
      const l = parseInt(el.dataset.level);
      el.classList.toggle("active", l <= maxLevel && maxLevel >= 0);
    });

    // Status cards
    const gauntletRemaining = res.gauntletRemaining || 0;
    const jailRemaining     = res.jailRemaining     || 0;
    const passRemaining     = res.passRemaining     || 0;

    gauntletCard.classList.toggle("visible", gauntletRemaining > 0);
    jailCard.classList.toggle("visible", jailRemaining > 0);
    passCard.classList.toggle("visible", passRemaining > 0 && jailRemaining === 0 && gauntletRemaining === 0);

    if (gauntletRemaining > 0) gauntletTimerEl.textContent = formatMs(gauntletRemaining);
    if (jailRemaining > 0)     jailTimerEl.textContent     = formatMs(jailRemaining);
    if (passRemaining > 0)     passTimerEl.textContent     = formatMs(passRemaining);

    // Active task panel
    api.storage.local.get(["workTask"], (data) => {
      if (data.workTask) {
        activeTaskControls.style.display = "block";
        if (jailRemaining > 0) {
          activeTaskHeader.textContent = "⛓️ En prison — attends";
        } else if (gauntletRemaining > 0) {
          activeTaskHeader.textContent = "🔮 Gauntlet en cours";
        } else if (passRemaining > 0) {
          activeTaskHeader.textContent = "✅ Pass actif";
        } else {
          activeTaskHeader.textContent = "⏳ Tâche en cours";
        }
      } else {
        activeTaskControls.style.display = "none";
      }
    });
  });
}

function formatMs(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

// ── Toggle ────────────────────────────────────────────────────────────────────

enabledToggle.addEventListener("change", () => {
  const enabled = enabledToggle.checked;
  api.storage.local.set({ enabled });
  api.runtime.sendMessage({ type: "TOGGLE", enabled });
  updateToggleUI(enabled);
});

function updateToggleUI(enabled) {
  statusDot.classList.toggle("active", enabled);
  statusLabel.textContent = enabled ? "Actif — Surveillance ON" : "Désactivé";
}

// ── Mode selector ─────────────────────────────────────────────────────────────

const MODE_DESCS = {
  soft: "😊 Notifications et bannières uniquement. Aucun blocage.",
  hard: "💀 Escalade complète + Gauntlet à 3 min. Réponds ou va en prison.",
};

modeSoftBtn.addEventListener("click", () => setMode("soft", true));
modeHardBtn.addEventListener("click", () => setMode("hard", true));

function setMode(mode, save) {
  modeSoftBtn.className = "mode-btn" + (mode === "soft" ? " active-soft" : "");
  modeHardBtn.className = "mode-btn" + (mode === "hard" ? " active-hard" : "");
  modeDesc.textContent  = MODE_DESCS[mode] || "";
  if (save) {
    api.runtime.sendMessage({ type: "SET_MODE", mode });
  }
}

// ── Save / Start task ─────────────────────────────────────────────────────────

saveBtn.addEventListener("click", () => {
  const workTask = taskInput.value.trim();
  const userName = nameInput.value.trim();
  if (workTask) {
    api.runtime.sendMessage({ type: "START_TASK", task: workTask, name: userName }, () => {
      notify("✓ Tâche démarrée ! 🚀");
    });
  } else {
    api.storage.local.set({ workTask, userName }, () => {
      notify("✓ Paramètres enregistrés !");
    });
  }
});

// ── Complete task ─────────────────────────────────────────────────────────────

completeTaskBtn.addEventListener("click", () => {
  api.runtime.sendMessage({ type: "COMPLETE_TASK" }, () => {
    taskInput.value = "";
    activeTaskControls.style.display = "none";
    notify("🎉 Tâche terminée ! Tous les blocages levés.");
  });
});

// ── Test button ───────────────────────────────────────────────────────────────

document.getElementById("testBtn").addEventListener("click", () => {
  api.runtime.sendMessage({ type: "TEST" });
  api.storage.local.get(["procrastinoMode"], (data) => {
    notify(data.procrastinoMode === "hard" ? "🔮 Gauntlet déclenché !" : "🧪 Test soft envoyé !");
  });
});

// ── Sites toggle ──────────────────────────────────────────────────────────────

sitesToggle.addEventListener("click", () => {
  const open = sitesList.classList.toggle("open");
  sitesToggle.textContent = (open ? "▼" : "▶") + " Sites surveillés";
});

// ── Helper ────────────────────────────────────────────────────────────────────

function notify(msg) {
  savedNotice.textContent = msg;
  setTimeout(() => { savedNotice.textContent = ""; }, 2500);
}