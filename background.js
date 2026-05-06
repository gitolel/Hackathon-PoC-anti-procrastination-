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

const LIMITS = {
  PASS_DURATION:   30 * 60 * 1000,
  GAUNTLET_WINDOW: 30 * 60 * 1000,
  JAIL_DURATION:   30 * 60 * 1000,
};

let enabled          = false;
let workTask         = "";
let userName         = "champion(ne)";
let procrastinoMode  = "soft";

let passEndTime       = 0;
let gauntletDeadline  = 0;
let jailEndTime       = 0;
let gauntletTriggered = false;

const trackedTabs = {};



api.storage.local.get([
  "enabled", "userName", "workTask", "procrastinoMode",
  "passEndTime", "gauntletDeadline", "jailEndTime"
], (data) => {
  enabled           = data.enabled           || false;
  workTask          = data.workTask          || "";
  userName          = data.userName          || "champion(ne)";
  procrastinoMode   = data.procrastinoMode   || "soft";
  passEndTime       = data.passEndTime       || 0;
  gauntletDeadline  = data.gauntletDeadline  || 0;
  jailEndTime       = data.jailEndTime       || 0;
  gauntletTriggered = gauntletDeadline > 0;
  console.log("[ProcrastiNO] Init. enabled=", enabled, "mode=", procrastinoMode);
});

api.storage.onChanged.addListener((changes) => {
  if (changes.enabled         !== undefined) enabled          = changes.enabled.newValue;
  if (changes.workTask        !== undefined) workTask         = changes.workTask.newValue         || "";
  if (changes.userName        !== undefined) userName         = changes.userName.newValue         || "champion(ne)";
  if (changes.procrastinoMode !== undefined) procrastinoMode  = changes.procrastinoMode.newValue  || "soft";
  if (changes.passEndTime     !== undefined) passEndTime      = changes.passEndTime.newValue      || 0;
  if (changes.gauntletDeadline!== undefined) gauntletDeadline = changes.gauntletDeadline.newValue || 0;
  if (changes.jailEndTime     !== undefined) jailEndTime      = changes.jailEndTime.newValue      || 0;
});

setInterval(checkGlobalState, 1000);



function checkGlobalState() {
  if (!enabled) return;
  const now = Date.now();

  if (jailEndTime > 0 && now > jailEndTime) {
    clearJail();
    return;
  }

  if (gauntletDeadline > 0 && now > gauntletDeadline) {
    clearGauntlet(true);
    return;
  }

  if (jailEndTime > 0) {
    broadcastToDistracting({ type: "UPDATE_JAIL_TIMER", remaining: Math.max(0, jailEndTime - now) });
  } else if (gauntletDeadline > 0) {
    broadcastToDistracting({ type: "UPDATE_GAUNTLET_TIMER", remaining: Math.max(0, gauntletDeadline - now) });
  }
}



function triggerGauntlet() {
  if (gauntletTriggered) return;
  gauntletTriggered = true;
  const deadline = Date.now() + LIMITS.GAUNTLET_WINDOW;
  gauntletDeadline = deadline;
  api.storage.local.set({ gauntletDeadline: deadline });
  broadcastToDistracting({ type: "SHOW_GAUNTLET", deadline });
  console.log("[ProcrastiNO] Gauntlet triggered");
}

function clearGauntlet(timeout) {
  gauntletDeadline  = 0;
  gauntletTriggered = false;
  api.storage.local.set({ gauntletDeadline: 0 });
  broadcastToDistracting({ type: "HIDE_GAUNTLET" });
  if (timeout) {
    Object.keys(trackedTabs).forEach(id => { trackedTabs[id].level = -1; });
    console.log("[ProcrastiNO] Gauntlet timed out — clean slate");
  }
}

function startPass() {
  const end = Date.now() + LIMITS.PASS_DURATION;
  passEndTime       = end;
  gauntletDeadline  = 0;
  gauntletTriggered = false;
  jailEndTime       = 0;
  api.storage.local.set({ passEndTime: end, gauntletDeadline: 0, jailEndTime: 0 });
  broadcastToDistracting({ type: "HIDE_GAUNTLET" });
  broadcastToDistracting({ type: "HIDE_JAIL" });
  console.log("[ProcrastiNO] Pass started for 30 min");
}

function triggerJail() {
  const end = Date.now() + LIMITS.JAIL_DURATION;
  jailEndTime       = end;
  gauntletDeadline  = 0;
  gauntletTriggered = false;
  api.storage.local.set({ jailEndTime: end, gauntletDeadline: 0 });
  broadcastToDistracting({ type: "SHOW_JAIL", jailEndTime: end });
  console.log("[ProcrastiNO] Jail triggered for 30 min");
}

function clearJail() {
  jailEndTime = 0;
  api.storage.local.set({ jailEndTime: 0 });
  broadcastToDistracting({ type: "HIDE_JAIL" });
  Object.keys(trackedTabs).forEach(id => { trackedTabs[id].level = -1; });
  console.log("[ProcrastiNO] Jail ended — clean slate");
}



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
  if (workTask) msg += "\n📋 Tu devais faire : \"" + workTask + "\"";
  return msg;
}

function sendNotif(level, message) {
  api.notifications.create("procrastino_" + Date.now(), {
    type: "basic",
    iconUrl: api.runtime.getURL("icons/icon128.png"),
    title: "⚠️ ProcrastiNO — Niveau " + (level + 1) + "/5",
    message: message,
    priority: level >= 3 ? 2 : 1,
  });
}

function broadcastToDistracting(message) {
  api.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (isDistracting(tab.url)) {
        api.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  });
}

function syncState() {
  const snapshot = {};
  for (const [id, d] of Object.entries(trackedTabs)) {
    snapshot[id] = { url: d.url, startTime: d.startTime, level: d.level };
  }
  api.storage.local.set({ activeTabs: snapshot });
}



function startTracking(tabId, url) {
  if (trackedTabs[tabId]) return;
  console.log("[ProcrastiNO] Tracking tab", tabId, url);
  trackedTabs[tabId] = { url, startTime: Date.now(), level: -1, timerHandle: null };

  const now = Date.now();
  if (jailEndTime > 0 && now < jailEndTime) {
    api.tabs.sendMessage(tabId, { type: "SHOW_JAIL", jailEndTime }).catch(() => {});
  } else if (gauntletDeadline > 0 && now < gauntletDeadline) {
    api.tabs.sendMessage(tabId, { type: "SHOW_GAUNTLET", deadline: gauntletDeadline }).catch(() => {});
  } else {
    scheduleNext(tabId, 0);
  }
  syncState();
}

function scheduleNext(tabId, idx) {
  if (!trackedTabs[tabId]) return;

  if (idx >= ESCALATION.length) {
    trackedTabs[tabId].timerHandle = setTimeout(() => {
      if (trackedTabs[tabId]) { triggerLevel(tabId, 4); scheduleNext(tabId, idx); }
    }, 30000);
    return;
  }

  const { afterSecs, level } = ESCALATION[idx];
  const elapsed = (Date.now() - trackedTabs[tabId].startTime) / 1000;
  const wait = Math.max(500, (afterSecs - elapsed) * 1000);

  trackedTabs[tabId].timerHandle = setTimeout(() => {
    if (!trackedTabs[tabId]) return;
    triggerLevel(tabId, level);
    scheduleNext(tabId, idx + 1);
  }, wait);
}

function triggerLevel(tabId, level) {
  if (!trackedTabs[tabId]) return;
  if (jailEndTime > 0 || gauntletDeadline > 0) return;
  if (passEndTime > 0 && Date.now() < passEndTime) return;

  trackedTabs[tabId].level = level;
  const msg = randomMsg(level);
  console.log("[ProcrastiNO] 🔔 Level", level, "tab", tabId, "mode=", procrastinoMode);

  sendNotif(level, msg);
  api.tabs.sendMessage(tabId, {
    type: "ESCALATE", level, message: msg,
    elapsed: Math.floor((Date.now() - trackedTabs[tabId].startTime) / 1000),
  }).catch(err => console.log("[ProcrastiNO] sendMessage err:", err.message));

  if (procrastinoMode === "hard" && level === 3) {
    triggerGauntlet();
  }

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



api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!enabled) return;
  if (changeInfo.status !== "complete") return;
  if (isDistracting(tab.url)) startTracking(tabId, tab.url);
  else stopTracking(tabId);
});

api.tabs.onRemoved.addListener((tabId) => stopTracking(tabId));

api.tabs.onActivated.addListener(({ tabId }) => {
  if (!enabled) return;
  api.tabs.get(tabId, (tab) => {
    if (api.runtime.lastError || !tab?.url) return;
    if (isDistracting(tab.url) && !trackedTabs[tabId]) startTracking(tabId, tab.url);
  });
});




api.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (!enabled) return;
  if (details.frameId !== 0) return;
  const tabId = details.tabId;
  const url   = details.url;

  console.log("[ProcrastiNO] SPA nav:", url);

  if (isDistracting(url)) {
    if (trackedTabs[tabId]) {


      console.log("[ProcrastiNO] SPA — tab déjà suivi, URL changée, on continue");
    } else {
      startTracking(tabId, url);
    }
  } else {



    stopTracking(tabId);
  }
});


api.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
  if (!enabled || details.frameId !== 0) return;
  if (isDistracting(details.url) && !trackedTabs[details.tabId]) {
    startTracking(details.tabId, details.url);
  }
});



api.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "GET_STATE") {
    const out = {};
    for (const [id, d] of Object.entries(trackedTabs)) {
      out[id] = { url: d.url, startTime: d.startTime, level: d.level };
    }
    const now = Date.now();
    sendResponse({
      enabled, procrastinoMode,
      activeTabs: Object.keys(trackedTabs).length,
      tabs: out,
      passRemaining:     Math.max(0, passEndTime - now),
      gauntletRemaining: gauntletDeadline > 0 ? Math.max(0, gauntletDeadline - now) : 0,
      jailRemaining:     jailEndTime > 0      ? Math.max(0, jailEndTime - now)      : 0,
    });
    return true;
  }

  if (msg.type === "START_TASK") {
    workTask = msg.task; userName = msg.name;
    gauntletDeadline = 0; gauntletTriggered = false;
    jailEndTime = 0; passEndTime = 0;
    api.storage.local.set({ workTask, userName, gauntletDeadline: 0, jailEndTime: 0, passEndTime: 0 });
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === "COMPLETE_TASK") {
    workTask = ""; gauntletDeadline = 0; gauntletTriggered = false;
    jailEndTime = 0; passEndTime = 0;
    api.storage.local.set({ workTask: "", gauntletDeadline: 0, jailEndTime: 0, passEndTime: 0 });
    broadcastToDistracting({ type: "HIDE_GAUNTLET" });
    broadcastToDistracting({ type: "HIDE_JAIL" });
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === "GAUNTLET_PASSED") {
    startPass(); sendResponse({ ok: true }); return true;
  }

  if (msg.type === "GAUNTLET_WRONG_ANSWER") {
    triggerJail(); sendResponse({ ok: true }); return true;
  }

  if (msg.type === "TOGGLE") {
    enabled = msg.enabled;
    if (!enabled) stopAll();
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === "SET_MODE") {
    procrastinoMode = msg.mode;
    api.storage.local.set({ procrastinoMode: msg.mode });
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === "SPA_NAV") {
    if (!enabled) return true;
    const tabId = sender.tab?.id;
    if (!tabId) return true;
    const url = msg.url;
    console.log("[ProcrastiNO] SPA_NAV from content:", url);
    if (isDistracting(url)) {
      if (!trackedTabs[tabId]) startTracking(tabId, url);

    } else {
      stopTracking(tabId);
    }
    return true;
  }

  if (msg.type === "TEST") {
    if (procrastinoMode === "hard") {
      triggerGauntlet();
    } else {
      const testMsg = "🧪 TEST — Soft mode actif !";
      sendNotif(4, testMsg);
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        api.tabs.sendMessage(tabs[0].id, { type: "ESCALATE", level: 4, message: testMsg, elapsed: 300 }).catch(() => {});
      });
    }
    return true;
  }
});