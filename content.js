if (typeof browser !== "undefined" && typeof chrome === "undefined") {
  var chrome = browser;
}


const DISTRACTING_HOSTS = [
  "youtube.com", "youtu.be", "reddit.com", "twitter.com", "x.com",
  "facebook.com", "instagram.com", "tiktok.com", "twitch.tv",
  "9gag.com", "imgur.com", "pinterest.com", "tumblr.com",
  "discord.com", "netflix.com", "primevideo.com",
];

function isDistractingPage() {
  const host = location.hostname.replace(/^www\./, "");
  return DISTRACTING_HOSTS.some(s => host === s || host.endsWith("." + s));
}


let overlayEl    = null;
let bannerEl     = null;
let shakeInterval= null;
let currentLevel = -1;



(function checkOnLoad() {
  chrome.storage.local.get(["gauntletDeadline", "jailEndTime"], (data) => {
    const now = Date.now();
    if (data.jailEndTime && now < data.jailEndTime) {
      showJail(data.jailEndTime);
    } else if (data.gauntletDeadline && now < data.gauntletDeadline) {
      showGauntlet(data.gauntletDeadline);
    }
  });
})();



chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case "ESCALATE":
      if (!isDistractingPage()) return;
      currentLevel = msg.level;
      showBanner(msg.message, msg.level);
      if (msg.level >= 2) showOverlay(msg.message, msg.level, msg.elapsed);
      if (msg.level >= 3) startScreenShake();
      if (msg.level >= 4) goNuclear(msg.message);
      break;
    case "NUDGE":
      showBanner(msg.message, msg.level);
      break;
    case "CLEANUP":
      cleanup();
      break;
    case "SHOW_GAUNTLET":
      showGauntlet(msg.deadline);
      break;
    case "HIDE_GAUNTLET":
      hideGauntlet();
      break;
    case "UPDATE_GAUNTLET_TIMER":
      updateGauntletTimer(msg.remaining);
      break;
    case "SHOW_JAIL":
      showJail(msg.jailEndTime);
      break;
    case "HIDE_JAIL":
      hideJail();
      break;
    case "UPDATE_JAIL_TIMER":
      updateJailTimer(msg.remaining);
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
  bannerEl.style.cssText = [
    "all:initial",
    "position:fixed !important",
    "top:0 !important",
    "left:0 !important",
    "right:0 !important",
    "z-index:2147483647 !important",
    "background:" + c.bg + " !important",
    "border-bottom:2px solid " + c.border + " !important",
    "color:" + c.text + " !important",
    "font-family:'Segoe UI',system-ui,sans-serif !important",
    "font-size:" + fontSize + " !important",
    "font-weight:" + (level >= 3 ? 700 : 500) + " !important",
    "padding:10px 50px 10px 16px !important",
    "text-align:center !important",
    "line-height:1.5 !important",
    "white-space:pre-line !important",
    "box-shadow:0 2px 20px " + c.border + "66 !important",
    "animation:" + (level >= 3 ? "procrastino-flash 0.5s ease infinite alternate" : "procrastino-slidein 0.3s ease") + " !important",
  ].join(";");
  bannerEl.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = [
    "all:initial",
    "position:absolute !important",
    "right:10px !important",
    "top:50% !important",
    "transform:translateY(-50%) !important",
    "background:transparent !important",
    "border:1px solid " + c.border + " !important",
    "color:" + c.text + " !important",
    "font-size:12px !important",
    "padding:2px 7px !important",
    "cursor:pointer !important",
    "border-radius:3px !important",
    "font-family:system-ui !important",
  ].join(";");
  closeBtn.textContent = level >= 3 ? "🙄 ok ok" : "✕";
  closeBtn.onclick = removeBanner;
  bannerEl.appendChild(closeBtn);

  injectStyles();
  document.documentElement.appendChild(bannerEl);
  if (level === 0) setTimeout(removeBanner, 8000);
}

function removeBanner() {
  if (bannerEl) { bannerEl.remove(); bannerEl = null; }
}



function showOverlay(message, level, elapsed) {
  removeOverlay();
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? (minutes + "min " + seconds + "s") : (seconds + "s");

  const gradients = [
    "", "",
    "linear-gradient(135deg,#1a0000 0%,#2d0000 100%)",
    "linear-gradient(135deg,#0d001a 0%,#1a0033 100%)",
    "linear-gradient(135deg,#000000 0%,#1a0000 50%,#000000 100%)",
  ];
  const emojis = ["","","😤","😡🔥","💀☠️💀"];

  overlayEl = document.createElement("div");
  overlayEl.id = "__procrastino_overlay__";
  overlayEl.style.cssText = [
    "all:initial",
    "position:fixed !important",
    "top:50% !important",
    "left:50% !important",
    "transform:translate(-50%,-50%) !important",
    "z-index:2147483646 !important",
    "background:" + gradients[level] + " !important",
    "border:2px solid " + (level >= 4 ? "#ff0000" : "#ff3b30") + " !important",
    "border-radius:12px !important",
    "padding:28px 32px !important",
    "max-width:420px !important",
    "width:90vw !important",
    "box-shadow:0 0 60px " + (level >= 4 ? "#ff000088" : "#ff3b3055") + ",0 8px 32px rgba(0,0,0,.8) !important",
    "font-family:'Segoe UI',system-ui,sans-serif !important",
    "color:white !important",
    "text-align:center !important",
    "animation:" + (level >= 4 ? "procrastino-pulse 0.3s ease infinite alternate" : "procrastino-popin 0.2s ease") + " !important",
  ].join(";");

  overlayEl.innerHTML =
    '<div style="all:initial;display:block;font-size:32px;margin-bottom:12px;">' + emojis[level] + '</div>' +
    '<div style="all:initial;display:block;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#ff6b6b;margin-bottom:8px;">⏱ PROCRASTINATION : ' + timeStr + '</div>' +
    '<div style="all:initial;display:block;font-size:15px;font-weight:600;color:white;white-space:pre-line;line-height:1.6;margin-bottom:20px;">' + message + '</div>' +
    '<button id="__procrastino_dismiss__" style="all:initial;display:inline-block;background:#ff3b30;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:system-ui;">OK OK je travaille 😤</button>' +
    '<div style="all:initial;display:block;margin-top:12px;font-size:11px;color:#666;">(ou continue à procrastiner pour débloquer le niveau suivant...)</div>';

  document.documentElement.appendChild(overlayEl);
  document.getElementById("__procrastino_dismiss__").onclick = () => {
    removeOverlay();
    stopScreenShake();
  };
  if (level === 2) setTimeout(removeOverlay, 10000);
}

function removeOverlay() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
}



function goNuclear(message) {
  const backdrop = document.createElement("div");
  backdrop.id = "__procrastino_backdrop__";
  backdrop.style.cssText = "all:initial;position:fixed !important;inset:0 !important;background:rgba(0,0,0,.85) !important;z-index:2147483645 !important;animation:procrastino-darken 0.5s ease forwards !important;";
  document.documentElement.appendChild(backdrop);

  for (let i = 0; i < 12; i++) {
    const emoji = document.createElement("div");
    emoji.textContent = ["💀","🔥","😡","⛔","🚨"][Math.floor(Math.random() * 5)];
    emoji.style.cssText = [
      "all:initial",
      "position:fixed !important",
      "z-index:2147483644 !important",
      "font-size:" + (24 + Math.random() * 32) + "px !important",
      "left:" + (Math.random() * 90) + "vw !important",
      "top:-50px !important",
      "animation:procrastino-rain " + (1.5 + Math.random() * 2) + "s " + (Math.random() * 1) + "s ease-in infinite !important",
    ].join(";");
    document.documentElement.appendChild(emoji);
  }
}



function startScreenShake() {
  if (shakeInterval) return;
  injectStyles();
  shakeInterval = setInterval(() => {
    if (document.body) {
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 8;
      document.body.style.transform = "translate(" + x + "px," + y + "px)";
      setTimeout(() => { if (document.body) document.body.style.transform = ""; }, 50);
    }
  }, 100);
}

function stopScreenShake() {
  if (shakeInterval) { clearInterval(shakeInterval); shakeInterval = null; }
  if (document.body) document.body.style.transform = "";
}



function cleanup() {
  removeBanner();
  removeOverlay();
  hideGauntlet();
  hideJail();
  stopScreenShake();
  document.getElementById("__procrastino_backdrop__") && document.getElementById("__procrastino_backdrop__").remove();
  document.getElementById("__procrastino_styles__") && document.getElementById("__procrastino_styles__").remove();
}




const QUESTION_BANK = [

  { q: "Combien font 12 × 7 ?",               a: "84",   difficulty: "facile" },
  { q: "Combien font 2 + 2 ?",                a: "4",    difficulty: "facile" },
  { q: "Combien font 15 × 4 ?",               a: "60",   difficulty: "facile" },
  { q: "Combien font 144 ÷ 12 ?",             a: "12",   difficulty: "facile" },
  { q: "Combien font 9 × 9 ?",                a: "81",   difficulty: "facile" },
  { q: "Combien font 7 × 8 ?",                a: "56",   difficulty: "facile" },
  { q: "Combien font 100 - 37 ?",             a: "63",   difficulty: "facile" },
  { q: "Combien font 6 × 7 ?",                a: "42",   difficulty: "facile" },
  { q: "Quel est la racine carrée de 64 ?",   a: "8",    difficulty: "facile" },
  { q: "Combien font 250 + 375 ?",            a: "625",  difficulty: "facile" },

  { q: "Un train roule à 80 km/h. En 2h30, quelle distance parcourt-il ?", a: "200", difficulty: "moyen" },
  { q: "Si 3x + 7 = 22, quelle est la valeur de x ?",          a: "5",   difficulty: "moyen" },
  { q: "Quel est 15% de 200 ?",                                  a: "30",  difficulty: "moyen" },
  { q: "Si un article coûte 80€ après -20%, quel était le prix initial ?", a: "100", difficulty: "moyen" },
  { q: "Combien font 2³ + 3² ?",                                 a: "17",  difficulty: "moyen" },
  { q: "Quel est le PGCD de 24 et 36 ?",                         a: "12",  difficulty: "moyen" },
  { q: "Si 5x - 3 = 17, quelle est la valeur de x ?",            a: "4",   difficulty: "moyen" },
  { q: "Quel est 30% de 150 ?",                                   a: "45",  difficulty: "moyen" },
  { q: "Combien de secondes dans 2 heures ?",                     a: "7200", difficulty: "moyen" },
  { q: "Un rectangle a un périmètre de 28. Sa largeur est 6. Quelle est sa longueur ?", a: "8", difficulty: "moyen" },

  { q: "Quel est le 7ème mois de l'année ?",                     a: "juillet",  difficulty: "facile" },
  { q: "Combien de côtés a un octogone ?",                       a: "8",        difficulty: "facile" },
  { q: "Combien de jours dans une année bissextile ?",           a: "366",      difficulty: "facile" },
  { q: "Combien de lettres dans l'alphabet français ?",          a: "26",       difficulty: "facile" },
  { q: "Dans quelle ville se trouve la Tour Eiffel ?",           a: "paris",    difficulty: "facile" },
  { q: "Quel est le résultat de (4 + 6) × (3 - 1) ?",           a: "20",       difficulty: "moyen" },
  { q: "Si tu as 3 paires de chaussettes, combien en as-tu ?",   a: "6",        difficulty: "facile" },
  { q: "Quel animal dit 'miaou' ?",                              a: "chat",     difficulty: "facile" },
  { q: "Combien font 17 × 3 ?",                                  a: "51",       difficulty: "facile" },
  { q: "Quel est le carré de 13 ?",                              a: "169",      difficulty: "moyen" },

  { q: "Combien de nombres premiers y a-t-il entre 1 et 20 ?",  a: "8",        difficulty: "difficile" },
  { q: "Si f(x) = 2x² - 3x + 1, quel est f(3) ?",              a: "10",       difficulty: "difficile" },
  { q: "Quel est le reste de 247 ÷ 7 ?",                        a: "2",        difficulty: "difficile" },
  { q: "Combien font (2 + 3)² - (4 × 3) ?",                    a: "13",       difficulty: "difficile" },
];


function pickQuestions() {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

let QUESTIONS = pickQuestions();

let gauntletEl       = null;
let gauntletStep     = 0;
let gauntletTimerInterval = null;

function showGauntlet(deadline) {
  if (!isDistractingPage()) return;
  if (gauntletEl) { updateGauntletTimer(Math.max(0, deadline - Date.now())); return; }
  cleanup();
  injectStyles();

  gauntletStep = 0;
  QUESTIONS = pickQuestions();
  gauntletEl   = document.createElement("div");
  gauntletEl.id = "__procrastino_gauntlet__";
  gauntletEl.style.cssText = "all:initial;position:fixed !important;inset:0 !important;z-index:2147483647 !important;background:#0d0d12 !important;display:flex !important;align-items:center !important;justify-content:center !important;font-family:'Segoe UI',system-ui,sans-serif !important;color:white !important;";

  document.documentElement.appendChild(gauntletEl);
  renderGauntletStep(deadline);
}

function renderGauntletStep(deadline) {
  if (!gauntletEl) return;
  clearInterval(gauntletTimerInterval);

  const q   = QUESTIONS[gauntletStep];
  const isLast = gauntletStep === QUESTIONS.length - 1;
  const remaining = Math.max(0, deadline - Date.now());

  const inner = document.createElement("div");
  inner.style.cssText = "all:initial;display:block;background:#1a1a24;border:1px solid #333;border-radius:16px;padding:36px 40px;max-width:500px;width:100%;box-sizing:border-box;box-shadow:0 20px 40px rgba(0,0,0,.5);text-align:center;";


  const diffColor = q.difficulty === "facile" ? "#30d158" : q.difficulty === "moyen" ? "#ff9500" : "#ff3b5c";

  inner.innerHTML =

    '<div style="font-size:36px;margin-bottom:10px;">🔒</div>' +
    '<div style="all:initial;display:block;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px;">Gauntlet des Procrastinateurs</div>' +

    '<div style="all:initial;display:block;font-size:11px;color:#555;margin-bottom:16px;">Temps restant : <span id="__pcg_timer__" style="color:#ff6b35;font-family:monospace;font-weight:700;">' + formatMs(remaining) + '</span></div>' +

    '<div style="all:initial;display:flex;gap:6px;justify-content:center;margin-bottom:20px;">' +
      [0,1,2,3].map(i =>
        '<div style="all:initial;width:48px;height:6px;border-radius:3px;background:' + (i <= gauntletStep ? '#ff3b5c' : '#222') + ';display:block;"></div>'
      ).join('') +
    '</div>' +

    '<div style="all:initial;display:inline-block;background:' + diffColor + '22;border:1px solid ' + diffColor + '55;border-radius:20px;padding:3px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:' + diffColor + ';margin-bottom:12px;">Question ' + (gauntletStep + 1) + ' / 4 — ' + q.difficulty + '</div>' +

    '<div style="all:initial;display:block;font-size:18px;font-weight:700;color:#f0f0f5;margin-bottom:20px;line-height:1.5;">' + q.q + '</div>' +

    '<input id="__pcg_answer__" type="text" placeholder="Ta réponse..." ' +
      'style="all:initial;display:block;width:100%;box-sizing:border-box;background:#111;border:1px solid #333;border-radius:8px;padding:12px 14px;color:white;font-family:monospace;font-size:16px;text-align:center;margin-bottom:14px;">' +

    (isLast
      ? '<div style="all:initial;display:block;font-size:12px;color:#ff9500;margin-bottom:14px;background:#2d1b0022;border:1px solid #ff950044;border-radius:6px;padding:8px;">💳 La réponse est gratuite à penser — mais coûte <strong style="color:#ff9500;">10 €</strong> à soumettre.</div>'
      : '') +

    (isLast
      ? buildPaymentForm()
      : '<button id="__pcg_submit__" style="all:initial;display:block;width:100%;box-sizing:border-box;background:linear-gradient(135deg,#ff3b5c,#ff6b35);border:none;border-radius:8px;color:white;font-weight:700;font-size:15px;padding:14px;cursor:pointer;text-align:center;">Valider la réponse →</button>') +

    '<div id="__pcg_feedback__" style="all:initial;display:block;min-height:18px;text-align:center;font-size:12px;margin-top:10px;"></div>';

  gauntletEl.innerHTML = "";
  gauntletEl.appendChild(inner);


  gauntletTimerInterval = setInterval(() => {
    const el = document.getElementById("__pcg_timer__");
    if (el) el.textContent = formatMs(Math.max(0, deadline - Date.now()));
  }, 1000);


  if (!isLast) {
    const submitBtn = document.getElementById("__pcg_submit__");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => handleGauntletSubmit(deadline));
    }
    const answerInput = document.getElementById("__pcg_answer__");
    if (answerInput) {
      answerInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleGauntletSubmit(deadline);
      });
    }
  } else {
    wirePaymentForm(deadline);
  }
}

function buildPaymentForm() {
  return (
    '<div id="__procrastino_payment_form__" style="all:initial;display:block;background:#1e1e2e;border:1px solid #444;border-radius:12px;padding:16px;text-align:left;margin-bottom:10px;">' +
      '<h2 style="all:initial;display:block;font-size:13px;font-weight:600;color:#ccc;margin-bottom:3px;">🏦 ProcrastiBank — Paiement Express</h2>' +
      '<p style="all:initial;display:block;font-size:10px;color:#555;margin-bottom:12px;">Données 100 % fictives — aucun vrai paiement</p>' +
      '<div style="margin-bottom:8px;">' +
        '<label style="all:initial;display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Numéro de carte</label>' +
        '<input id="__pcn_card__" type="text" maxlength="19" placeholder="1234 5678 9012 3456" ' +
          'style="all:initial;display:block;width:100%;box-sizing:border-box;background:#111;border:1px solid #333;border-radius:6px;padding:9px;color:white;font-family:monospace;font-size:13px;letter-spacing:1px;">' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<div style="flex:1;">' +
          '<label style="all:initial;display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Expiration</label>' +
          '<input id="__pcn_exp__" type="text" maxlength="5" placeholder="MM/AA" ' +
            'style="all:initial;display:block;width:100%;box-sizing:border-box;background:#111;border:1px solid #333;border-radius:6px;padding:9px;color:white;font-family:monospace;font-size:13px;">' +
        '</div>' +
        '<div style="flex:1;">' +
          '<label style="all:initial;display:block;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">CVC</label>' +
          '<input id="__pcn_cvc__" type="text" maxlength="3" placeholder="123" ' +
            'style="all:initial;display:block;width:100%;box-sizing:border-box;background:#111;border:1px solid #333;border-radius:6px;padding:9px;color:white;font-family:monospace;font-size:13px;">' +
        '</div>' +
      '</div>' +
      '<button id="__procrastino_pay_btn__" ' +
        'style="all:initial;display:block;width:100%;box-sizing:border-box;background:linear-gradient(135deg,#ff3b5c,#ff6b35);border:none;border-radius:8px;color:white;font-weight:700;font-size:14px;padding:12px;text-align:center;cursor:pointer;">' +
        '💳 Payer 10,00 € et soumettre la réponse' +
      '</button>' +
    '</div>'
  );
}

function wirePaymentForm(deadline) {
  const cardInput = document.getElementById("__pcn_card__");
  const expInput  = document.getElementById("__pcn_exp__");
  const payBtn    = document.getElementById("__procrastino_pay_btn__");
  const feedback  = document.getElementById("__pcg_feedback__");

  if (cardInput) {
    cardInput.addEventListener("input", () => {
      let v = cardInput.value.replace(/\D/g, "").substring(0, 16);
      cardInput.value = v.replace(/(.{4})/g, "$1 ").trim();
    });
  }
  if (expInput) {
    expInput.addEventListener("input", () => {
      let v = expInput.value.replace(/\D/g, "").substring(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      expInput.value = v;
    });
  }
  if (payBtn) {
    payBtn.addEventListener("click", () => {
      const card = cardInput ? cardInput.value.replace(/\s/g, "") : "";
      const exp  = expInput  ? expInput.value : "";
      const cvc  = document.getElementById("__pcn_cvc__") ? document.getElementById("__pcn_cvc__").value : "";

      if (card.length < 16) { setGauntletFeedback("❌ Numéro de carte invalide", "#ff3b5c"); return; }
      if (exp.length < 5)   { setGauntletFeedback("❌ Date d'expiration invalide", "#ff3b5c"); return; }
      if (cvc.length < 3)   { setGauntletFeedback("❌ CVC invalide", "#ff3b5c"); return; }

      payBtn.textContent = "⏳ Traitement en cours...";
      payBtn.style.opacity = "0.6";
      payBtn.style.pointerEvents = "none";
      setGauntletFeedback("🔐 Connexion à ProcrastiBank...", "#aaa");

      setTimeout(() => {
        setGauntletFeedback("🔄 Vérification de la carte...", "#aaa");
        setTimeout(() => {

          const answerInput = document.getElementById("__pcg_answer__");
          const userAnswer  = answerInput ? answerInput.value.trim() : "";
          if (userAnswer === QUESTIONS[3].a) {
            setGauntletFeedback("✅ Paiement accepté ! Gauntlet passé !", "#30d158");
            payBtn.textContent = "✅ Payé !";
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: "GAUNTLET_PASSED" });
              hideGauntlet();
            }, 800);
          } else {
            setGauntletFeedback("❌ Mauvaise réponse. La pénitence commence...", "#ff3b5c");
            payBtn.textContent = "💀 Perdu";
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: "GAUNTLET_WRONG_ANSWER" });
              hideGauntlet();
            }, 1000);
          }
        }, 1200);
      }, 1000);
    });
  }
}

function handleGauntletSubmit(deadline) {
  const answerInput = document.getElementById("__pcg_answer__");
  if (!answerInput) return;
  const userAnswer = answerInput.value.trim();
  const correct    = QUESTIONS[gauntletStep].a;

  if (userAnswer === correct) {
    gauntletStep++;
    if (gauntletStep < QUESTIONS.length) {
      setGauntletFeedback("✅ Bonne réponse !", "#30d158");
      setTimeout(() => renderGauntletStep(deadline), 600);
    }
  } else {
    setGauntletFeedback("❌ Mauvaise réponse ! Pénitence en route...", "#ff3b5c");
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "GAUNTLET_WRONG_ANSWER" });
      hideGauntlet();
    }, 1000);
  }
}

function setGauntletFeedback(msg, color) {
  const el = document.getElementById("__pcg_feedback__");
  if (el) { el.textContent = msg; el.style.color = color; }
}

function updateGauntletTimer(remaining) {
  const el = document.getElementById("__pcg_timer__");
  if (el) el.textContent = formatMs(remaining);
}

function hideGauntlet() {
  clearInterval(gauntletTimerInterval);
  if (gauntletEl) { gauntletEl.remove(); gauntletEl = null; }
}



let jailEl = null;
let jailTimerInterval = null;

function showJail(jailEndTime) {
  if (!isDistractingPage()) return;
  if (jailEl) { updateJailTimer(Math.max(0, jailEndTime - Date.now())); return; }
  hideGauntlet();
  cleanup();
  injectStyles();

  jailEl = document.createElement("div");
  jailEl.id = "__procrastino_jail__";
  jailEl.style.cssText = "all:initial;position:fixed !important;inset:0 !important;z-index:2147483647 !important;background:#0a0005 !important;display:flex !important;align-items:center !important;justify-content:center !important;font-family:'Segoe UI',system-ui,sans-serif !important;color:white !important;";

  const remaining = Math.max(0, jailEndTime - Date.now());

  const inner = document.createElement("div");
  inner.style.cssText = "all:initial;display:block;text-align:center;";
  inner.innerHTML =
    '<div style="font-size:64px;margin-bottom:16px;animation:procrastino-pulse 1s ease infinite alternate;">⛓️</div>' +
    '<div style="all:initial;display:block;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#ff3b5c;margin-bottom:8px;">PRISON DE LA PROCRASTINATION</div>' +
    '<div style="all:initial;display:block;font-size:14px;color:#888;margin-bottom:28px;line-height:1.6;">Tu as donné une mauvaise réponse.<br>Tu dois maintenant méditer sur tes erreurs.</div>' +
    '<div style="all:initial;display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#555;margin-bottom:8px;">Libération dans</div>' +
    '<div id="__procrastino_jail_timer__" style="all:initial;display:block;font-size:56px;font-weight:700;color:#ff3b5c;font-family:monospace;letter-spacing:4px;animation:procrastino-flash 1s ease infinite alternate;">' + formatMs(remaining) + '</div>' +
    '<div style="all:initial;display:block;font-size:12px;color:#333;margin-top:20px;">Aucun moyen de sortir avant la fin du compte à rebours.</div>';

  jailEl.appendChild(inner);
  document.documentElement.appendChild(jailEl);

  jailTimerInterval = setInterval(() => {
    updateJailTimer(Math.max(0, jailEndTime - Date.now()));
  }, 1000);
}

function updateJailTimer(remaining) {
  const el = document.getElementById("__procrastino_jail_timer__");
  if (el) el.textContent = formatMs(remaining);
}

function hideJail() {
  clearInterval(jailTimerInterval);
  if (jailEl) { jailEl.remove(); jailEl = null; }
}



function injectStyles() {
  if (document.getElementById("__procrastino_styles__")) return;
  const style = document.createElement("style");
  style.id = "__procrastino_styles__";
  style.textContent = [
    "@keyframes procrastino-slidein{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}",
    "@keyframes procrastino-popin{from{transform:translate(-50%,-50%) scale(.8);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}",
    "@keyframes procrastino-flash{from{border-color:#ff0000;box-shadow:0 2px 20px #ff000066}to{border-color:#ff6b6b;box-shadow:0 2px 40px #ff6b6b88}}",
    "@keyframes procrastino-pulse{from{box-shadow:0 0 30px #ff000066}to{box-shadow:0 0 80px #ff0000cc}}",
    "@keyframes procrastino-darken{from{opacity:0}to{opacity:1}}",
    "@keyframes procrastino-rain{from{top:-50px;opacity:1}to{top:110vh;opacity:.3}}",
  ].join("\n");
  document.documentElement.appendChild(style);
}



function formatMs(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");
  return m + ":" + s;
}



(function installSPASpy() {
  if (!isDistractingPage()) return;

  const notifyUrlChange = (url) => {
    chrome.runtime.sendMessage({ type: "SPA_NAV", url }).catch(() => {});
  };


  const origPush    = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);

  history.pushState = function(...args) {
    origPush(...args);
    notifyUrlChange(location.href);
  };
  history.replaceState = function(...args) {
    origReplace(...args);
    notifyUrlChange(location.href);
  };


  window.addEventListener("popstate", () => notifyUrlChange(location.href));


  let lastTitle = document.title;
  const titleObserver = new MutationObserver(() => {
    if (document.title !== lastTitle) {
      lastTitle = document.title;
      notifyUrlChange(location.href);
    }
  });
  const titleEl = document.querySelector("title");
  if (titleEl) titleObserver.observe(titleEl, { childList: true });

  else {
    const headObserver = new MutationObserver(() => {
      const t = document.querySelector("title");
      if (t) { titleObserver.observe(t, { childList: true }); headObserver.disconnect(); }
    });
    headObserver.observe(document.head || document.documentElement, { childList: true });
  }
})();
