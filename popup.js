
const enabledToggle = document.getElementById("enabledToggle");
const statusDot = document.getElementById("statusDot");
const statusLabel = document.getElementById("statusLabel");
const taskInput = document.getElementById("taskInput");
const nameInput = document.getElementById("nameInput");
const saveBtn = document.getElementById("saveBtn");
const savedNotice = document.getElementById("savedNotice");
const statTabs = document.getElementById("statTabs");
const activeTabsBox = document.getElementById("activeTabsBox");
const activeTabsList = document.getElementById("activeTabsList");
const sitesToggle = document.getElementById("sitesToggle");
const sitesList = document.getElementById("sitesList");


chrome.storage.local.get(["enabled", "userName", "workTask"], (data) => {
  enabledToggle.checked = data.enabled || false;
  taskInput.value = data.workTask || "";
  nameInput.value = data.userName || "";
  updateToggleUI(data.enabled || false);
});


refreshState();
setInterval(refreshState, 2000);

function refreshState() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
    if (chrome.runtime.lastError || !res) return;
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
          const secs = elapsed % 60;
          const timeStr = mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
          return `• ${host} — ${timeStr}`;
        } catch { return ""; }
      }).filter(Boolean);
      activeTabsList.innerHTML = lines.join("<br>");
    } else {
      activeTabsBox.classList.remove("visible");
    }


    const tabs = res.tabs || {};
    const maxLevel = Object.values(tabs).reduce((max, t) => Math.max(max, t.level || 0), -1);
    document.querySelectorAll(".step").forEach(el => {
      const l = parseInt(el.dataset.level);
      el.classList.toggle("active", l <= maxLevel && maxLevel >= 0);
    });
  });
}


enabledToggle.addEventListener("change", () => {
  const enabled = enabledToggle.checked;
  chrome.storage.local.set({ enabled });
  chrome.runtime.sendMessage({ type: "TOGGLE", enabled });
  updateToggleUI(enabled);
});

function updateToggleUI(enabled) {
  statusDot.classList.toggle("active", enabled);
  statusLabel.textContent = enabled ? "Actif — Surveillance ON" : "Désactivé";
}


saveBtn.addEventListener("click", () => {
  const workTask = taskInput.value.trim();
  const userName = nameInput.value.trim();
  chrome.storage.local.set({ workTask, userName }, () => {
    savedNotice.textContent = "✓ Paramètres enregistrés !";
    setTimeout(() => { savedNotice.textContent = ""; }, 2500);
  });
});


document.getElementById("testBtn").addEventListener("click", () => {
  const api = typeof browser !== "undefined" ? browser : chrome;
  api.runtime.sendMessage({ type: "TEST" });
  savedNotice.textContent = "🧪 Test envoyé !";
  setTimeout(() => { savedNotice.textContent = ""; }, 2500);
});


sitesToggle.addEventListener("click", () => {
  const open = sitesList.classList.toggle("open");
  sitesToggle.textContent = (open ? "▼" : "▶") + " Sites surveillés";
});
