

const api = typeof browser !== "undefined" ? browser : chrome;

const DISTRACTING_SITES = [
  "youtube.com", "youtu.be",
  "reddit.com",
  "twitter.com", "x.com",
  "facebook.com", "instagram.com",
  "tiktok.com", "twitch.tv",
  "9gag.com", "imgur.com",
  "pinterest.com", "tumblr.com",
  "discord.com",
  "netflix.com", "primevideo.com",
];

const MESSAGES = {
  0: [
    "👋 Hey, t'es sûr(e) que c'est le bon moment pour ça ?",
    "😊 Petit rappel amical : tu avais quelque chose à faire non ?",
    "⏳ Le temps passe... et toi t'es encore là ?",
  ],
  1: [
    "😤 Sérieusement ? Tu procrastines ENCORE ?",
    "⚠️ 1 minute sur un site de distraction. T'as vraiment rien à faire ?",
    "🔔 RAPPEL : tu es censé(e) TRAVAILLER.",
  ],
  2: [
    "😡 2 MINUTES ! T'ES SÉRIEUX(SE) LÀ ?!",
    "🚨 ALERTE PROCRASTINATION NIVEAU 3",
    "💀 Ta productivité est en train de mourir. En direct.",
  ],
  3: [
    "🔥🔥🔥 3 MINUTES DE PROCRASTINATION !!!",
    "💣 TON FUTUR TOI TE DÉTESTE EN CE MOMENT MÊME",
    "⛔ NON. NON NON NON. FERME. CET. ONGLET.",
  ],
  4: [
    "💀💀💀 5 MINUTES !!! T'ES EN MODE SABOTAGE TOTAL",
    "🤯 TES AMBITIONS PLEURENT. TES RÊVES SAIGNENT. TRAVAILLE.",
    "👿 FERME YOUTUBE. FERME REDDIT. TRAVAILLE. MAINTENANT.",
  ],
};


const ESCALATION = [
  { afterSecs: 30,  level: 0 },
  { afterSecs: 60,  level: 1 },
  { afterSecs: 120, level: 2 },
  { afterSecs: 180, level: 3 },
  { afterSecs: 300, level: 4 },
];

let enabled = false;
let workTask = "";
let userName = "champion(ne)";
const trackedTabs = {};


api.storage.local.get(["enabled", "userName", "workTask"], (data) => {
  enabled = data.enabled || false;
  workTask = data.workTask || "";
  userName = data.userName || "champion(ne)";
  console.log("[ProcrastiNO] Init. enabled=", enabled);
});

api.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) enabled = changes.enabled.newValue;
  if (changes.workTask !== undefined) workTask = changes.workTask.newValue || "";
  if (changes.userName !== undefined) userName = changes.userName.newValue || "champion(ne)";
});


function isDistracting(url) {
  if (!url || url.startsWith("about:") || url.startsWith("moz-extension:") || url.startsWith("chrome-extension:")) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return DISTRACTING_SITES.some(site => host === site || host.endsWith("." + site));
  } catch { return false; }
}

function randomMsg(level) {
  const pool = MESSAGES[Math.min(level, 4)];
  let msg = pool[Math.floor(Math.random() * pool.length)];
  if (workTask) msg += `\n📋 Tu devais faire : "${workTask}"`;
  return msg;
}

function sendNotif(level, message) {
  api.notifications.create("procrastino_" + Date.now(), {
    type: "basic",
    iconUrl: api.runtime.getURL("icons/icon128.png"),
    title: `⚠️ ProcrastiNO — Niveau ${level + 1}/5`,
    message: message,
    priority: level >= 3 ? 2 : 1,
  });
}


function startTracking(tabId, url) {
  if (trackedTabs[tabId]) return;
  console.log("[ProcrastiNO] Tracking tab", tabId, url);
  trackedTabs[tabId] = { url, startTime: Date.now(), level: -1, timerHandle: null };
  scheduleNext(tabId, 0);
  syncState();
}

function scheduleNext(tabId, idx) {
  if (!trackedTabs[tabId]) return;

  if (idx >= ESCALATION.length) {

    trackedTabs[tabId].timerHandle = setTimeout(() => {
      if (trackedTabs[tabId]) {
        triggerLevel(tabId, 4);
        scheduleNext(tabId, idx);
      }
    }, 30000);
    return;
  }

  const { afterSecs, level } = ESCALATION[idx];
  const elapsed = (Date.now() - trackedTabs[tabId].startTime) / 1000;
  const wait = Math.max(500, (afterSecs - elapsed) * 1000);

  console.log(`[ProcrastiNO] Tab ${tabId} → level ${level} in ${Math.round(wait/1000)}s`);

  trackedTabs[tabId].timerHandle = setTimeout(() => {
    if (!trackedTabs[tabId]) return;
    triggerLevel(tabId, level);
    scheduleNext(tabId, idx + 1);
  }, wait);
}

function triggerLevel(tabId, level) {
  if (!trackedTabs[tabId]) return;
  trackedTabs[tabId].level = level;
  const msg = randomMsg(level);
  console.log(`[ProcrastiNO] 🔔 Level ${level} on tab ${tabId}`);

  sendNotif(level, msg);

  api.tabs.sendMessage(tabId, {
    type: "ESCALATE",
    level,
    message: msg,
    elapsed: Math.floor((Date.now() - trackedTabs[tabId].startTime) / 1000),
  }).catch(err => console.log("[ProcrastiNO] sendMessage err:", err.message));

  syncState();
}

function stopTracking(tabId) {
  if (!trackedTabs[tabId]) return;
  clearTimeout(trackedTabs[tabId].timerHandle);
  delete trackedTabs[tabId];
  api.tabs.sendMessage(tabId, { type: "CLEANUP" }).catch(() => {});
  syncState();
}

function stopAll() {
  Object.keys(trackedTabs).forEach(id => stopTracking(parseInt(id)));
}

function syncState() {
  const snapshot = {};
  for (const [id, d] of Object.entries(trackedTabs)) {
    snapshot[id] = { url: d.url, startTime: d.startTime, level: d.level };
  }
  api.storage.local.set({ activeTabs: snapshot });
}


api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!enabled) return;
  if (changeInfo.status !== "complete") return;
  console.log("[ProcrastiNO] Tab updated:", tab.url);
  if (isDistracting(tab.url)) {
    startTracking(tabId, tab.url);
  } else {
    stopTracking(tabId);
  }
});

api.tabs.onRemoved.addListener((tabId) => stopTracking(tabId));

api.tabs.onActivated.addListener(({ tabId }) => {
  if (!enabled) return;
  api.tabs.get(tabId, (tab) => {
    if (api.runtime.lastError || !tab?.url) return;
    if (isDistracting(tab.url) && !trackedTabs[tabId]) {
      startTracking(tabId, tab.url);
    }
  });
});


api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    const out = {};
    for (const [id, d] of Object.entries(trackedTabs)) {
      out[id] = { url: d.url, startTime: d.startTime, level: d.level };
    }
    sendResponse({ enabled, activeTabs: Object.keys(trackedTabs).length, tabs: out });
    return true;
  }
  if (msg.type === "TOGGLE") {
    enabled = msg.enabled;
    if (!enabled) stopAll();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === "TEST") {
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      const testMsg = "🧪 TEST — L'extension fonctionne !\n📋 Retourne bosser maintenant !";
      sendNotif(3, testMsg);
      api.tabs.sendMessage(tabs[0].id, {
        type: "ESCALATE", level: 5, message: testMsg, elapsed: 180,
      }).catch(console.log);
    });
    return true;
  }
});
