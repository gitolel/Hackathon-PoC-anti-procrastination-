
if (typeof browser !== "undefined" && typeof chrome === "undefined") {
  var chrome = browser;
}

let overlayEl = null;
let bannerEl = null;
let shakeInterval = null;
let currentLevel = -1;


chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case "NUDGE":
      showBanner(msg.message, msg.level);
      break;
    case "ESCALATE":
      currentLevel = msg.level;
      showBanner(msg.message, msg.level);
      if (msg.level >= 2) showOverlay(msg.message, msg.level, msg.elapsed);
      if (msg.level >= 3) startScreenShake();
      if (msg.level >= 4) goNuclear(msg.message);
      break;
    case "CLEANUP":
      cleanup();
      break;
  }
});


function showBanner(message, level) {
  removeBanner();

  const colors = [
    { bg: "#1a1a2e", border: "#4cc9f0", text: "#e0e0e0" },
    { bg: "#2d1b00", border: "#ff9500", text: "#ffe0a0" },
    { bg: "#2d0000", border: "#ff3b30", text: "#ffb3ae" },
    { bg: "#1a0020", border: "#bf5af2", text: "#e8b8ff" },
    { bg: "#000000", border: "#ff0000", text: "#ffffff" },
  ];

  const c = colors[Math.min(level, 4)];
  const fontSize = level <= 1 ? "13px" : level === 2 ? "14px" : level === 3 ? "15px" : "16px";

  bannerEl = document.createElement("div");
  bannerEl.id = "__procrastino_banner__";
  bannerEl.style.cssText = `
    all: initial;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 2147483647 !important;
    background: ${c.bg} !important;
    border-bottom: 2px solid ${c.border} !important;
    color: ${c.text} !important;
    font-family: 'Segoe UI', system-ui, sans-serif !important;
    font-size: ${fontSize} !important;
    font-weight: ${level >= 3 ? 700 : 500} !important;
    padding: 10px 50px 10px 16px !important;
    text-align: center !important;
    line-height: 1.5 !important;
    white-space: pre-line !important;
    box-shadow: 0 2px 20px ${c.border}66 !important;
    transition: all 0.3s ease !important;
    animation: ${level >= 3 ? "procrastino-flash 0.5s ease infinite alternate" : "procrastino-slidein 0.3s ease"} !important;
  `;
  bannerEl.textContent = message;


  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = `
    all: initial;
    position: absolute !important;
    right: 10px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    background: transparent !important;
    border: 1px solid ${c.border} !important;
    color: ${c.text} !important;
    font-size: 12px !important;
    padding: 2px 7px !important;
    cursor: pointer !important;
    border-radius: 3px !important;
    font-family: system-ui !important;
  `;
  closeBtn.textContent = level >= 3 ? "🙄 ok ok" : "✕";
  closeBtn.onclick = removeBanner;
  bannerEl.appendChild(closeBtn);

  injectStyles();
  document.documentElement.appendChild(bannerEl);


  if (level === 0) {
    setTimeout(removeBanner, 8000);
  }
}

function removeBanner() {
  if (bannerEl) {
    bannerEl.remove();
    bannerEl = null;
  }
}


function showOverlay(message, level, elapsed) {
  removeOverlay();

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;

  const gradients = [
    "",
    "",
    "linear-gradient(135deg, #1a0000 0%, #2d0000 100%)",
    "linear-gradient(135deg, #0d001a 0%, #1a0033 100%)",
    "linear-gradient(135deg, #000000 0%, #1a0000 50%, #000000 100%)",
  ];

  const emojis = ["", "", "😤", "😡🔥", "💀☠️💀"];

  overlayEl = document.createElement("div");
  overlayEl.id = "__procrastino_overlay__";
  overlayEl.style.cssText = `
    all: initial;
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 2147483646 !important;
    background: ${gradients[level]} !important;
    border: 2px solid ${level >= 4 ? "#ff0000" : "#ff3b30"} !important;
    border-radius: 12px !important;
    padding: 28px 32px !important;
    max-width: 420px !important;
    width: 90vw !important;
    box-shadow: 0 0 60px ${level >= 4 ? "#ff000088" : "#ff3b3055"}, 0 8px 32px rgba(0,0,0,0.8) !important;
    font-family: 'Segoe UI', system-ui, sans-serif !important;
    color: white !important;
    text-align: center !important;
    animation: ${level >= 4 ? "procrastino-pulse 0.3s ease infinite alternate" : "procrastino-popin 0.2s ease"} !important;
  `;

  overlayEl.innerHTML = `
    <div style="all:initial; display:block; font-size:32px; margin-bottom:12px;">${emojis[level]}</div>
    <div style="all:initial; display:block; font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#ff6b6b; margin-bottom:8px;">⏱ PROCRASTINATION : ${timeStr}</div>
    <div style="all:initial; display:block; font-size:15px; font-weight:600; color:white; white-space:pre-line; line-height:1.6; margin-bottom:20px;">${message}</div>
    <button id="__procrastino_dismiss__" style="all:initial; display:inline-block; background:#ff3b30; color:white; border:none; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:system-ui;">
      OK OK je travaille 😤
    </button>
    <div style="all:initial; display:block; margin-top:12px; font-size:11px; color:#666;">
      (ou continue à procrastiner pour débloquer le niveau suivant...)
    </div>
  `;

  document.documentElement.appendChild(overlayEl);

  document.getElementById("__procrastino_dismiss__").onclick = () => {
    removeOverlay();
    stopScreenShake();
  };


  if (level === 2) setTimeout(removeOverlay, 10000);
}

function removeOverlay() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}


function goNuclear(message) {

  const backdrop = document.createElement("div");
  backdrop.id = "__procrastino_backdrop__";
  backdrop.style.cssText = `
    all: initial;
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0,0,0,0.85) !important;
    z-index: 2147483645 !important;
    animation: procrastino-darken 0.5s ease forwards !important;
  `;
  document.documentElement.appendChild(backdrop);


  for (let i = 0; i < 12; i++) {
    const emoji = document.createElement("div");
    emoji.textContent = ["💀","🔥","😡","⛔","🚨"][Math.floor(Math.random() * 5)];
    emoji.style.cssText = `
      all: initial;
      position: fixed !important;
      font-size: ${20 + Math.random() * 24}px !important;
      left: ${Math.random() * 95}vw !important;
      top: -50px !important;
      z-index: 2147483644 !important;
      animation: procrastino-rain ${1 + Math.random() * 2}s linear ${Math.random() * 2}s infinite !important;
      pointer-events: none !important;
    `;
    document.documentElement.appendChild(emoji);
    setTimeout(() => emoji.remove(), 8000);
  }


  const origDismiss = document.getElementById("__procrastino_dismiss__");
  if (origDismiss) {
    origDismiss.onclick = () => {
      removeOverlay();
      stopScreenShake();
      backdrop.remove();
    };
  }
}


function startScreenShake() {
  stopScreenShake();
  let count = 0;
  shakeInterval = setInterval(() => {
    document.body.style.transform = `translate(${(Math.random()-0.5)*8}px, ${(Math.random()-0.5)*8}px)`;
    count++;
    if (count > 20) {
      stopScreenShake();
    }
  }, 50);
}

function stopScreenShake() {
  if (shakeInterval) {
    clearInterval(shakeInterval);
    shakeInterval = null;
    if (document.body) document.body.style.transform = "";
  }
}


function cleanup() {
  removeBanner();
  removeOverlay();
  stopScreenShake();
  document.getElementById("__procrastino_backdrop__")?.remove();
  document.getElementById("__procrastino_styles__")?.remove();
}


function injectStyles() {
  if (document.getElementById("__procrastino_styles__")) return;
  const style = document.createElement("style");
  style.id = "__procrastino_styles__";
  style.textContent = `
    @keyframes procrastino-slidein {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes procrastino-popin {
      from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    @keyframes procrastino-flash {
      from { border-color: #ff0000; box-shadow: 0 2px 20px #ff000066; }
      to { border-color: #ff6b6b; box-shadow: 0 2px 40px #ff6b6b88; }
    }
    @keyframes procrastino-pulse {
      from { box-shadow: 0 0 30px #ff000066; }
      to { box-shadow: 0 0 80px #ff0000cc; }
    }
    @keyframes procrastino-darken {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes procrastino-rain {
      from { top: -50px; opacity: 1; }
      to { top: 110vh; opacity: 0.3; }
    }
  `;
  document.documentElement.appendChild(style);
}
