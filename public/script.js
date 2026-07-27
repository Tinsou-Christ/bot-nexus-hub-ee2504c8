let Commands = [{ commands: [] }, { handleEvent: [] }];
let stopTargetUid = null;
let currentLogUid = "";

const $ = (id) => document.getElementById(id);

// ───────────── horloge + ping ─────────────
function updateTime() { $("time").textContent = new Date().toLocaleTimeString(); }
updateTime();
setInterval(updateTime, 1000);

async function measurePing() {
  const start = Date.now();
  try {
    await fetch("/info?t=" + start);
    $("ping").textContent = Date.now() - start + " ms";
  } catch (e) { $("ping").textContent = "—"; }
}
measurePing();
setInterval(measurePing, 5000);

// ───────────── résultat ─────────────
function showResult(message, ok) {
  const el = $("result");
  el.textContent = message;
  el.className = "result " + (ok ? "ok" : "ko");
  el.style.display = "block";
}

// ───────────── commandes ─────────────
function makeChip(name, list) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.textContent = name;
  chip.onclick = () => {
    const index = list.indexOf(name);
    if (index === -1) { list.push(name); chip.classList.add("active"); }
    else { list.splice(index, 1); chip.classList.remove("active"); }
  };
  return chip;
}

async function loadCommands() {
  try {
    const data = await (await fetch("/commands")).json();
    const cmdBox = $("listOfCommands");
    const evtBox = $("listOfCommandsEvent");
    cmdBox.innerHTML = "";
    evtBox.innerHTML = "";
    (data.commands || []).forEach((name) => cmdBox.appendChild(makeChip(name, Commands[0].commands)));
    (data.handleEvent || []).forEach((name) => evtBox.appendChild(makeChip(name, Commands[1].handleEvent)));
  } catch (error) {
    showResult("Impossible de charger la liste des commandes.", false);
  }
}

function selectAllCommands() {
  Commands[0].commands = [];
  $("listOfCommands").querySelectorAll(".chip").forEach((chip) => {
    chip.classList.add("active");
    Commands[0].commands.push(chip.textContent);
  });
}

function selectAllEvents() {
  Commands[1].handleEvent = [];
  $("listOfCommandsEvent").querySelectorAll(".chip").forEach((chip) => {
    chip.classList.add("active");
    Commands[1].handleEvent.push(chip.textContent);
  });
}

// ───────────── déploiement ─────────────
$("agreeCheckbox").addEventListener("change", function () {
  $("submitButton").disabled = !this.checked;
});

async function State() {
  const button = $("submitButton");
  const password = $("inputOfPassword").value.trim();
  if (!Commands[0].commands.length) return showResult("Sélectionne au moins une commande.", false);
  if (!$("inputOfPrefix").value.trim()) return showResult("Le prefix est obligatoire.", false);
  if (!/^\d{4}$/.test(password)) return showResult("Choisis un mot de passe de 4 chiffres.", false);

  let appState;
  try {
    appState = JSON.parse($("json-data").value);
  } catch (error) {
    return showResult("Appstate invalide, vérifie ton JSON.", false);
  }

  button.disabled = true;
  showResult("Déploiement en cours...", true);
  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: appState,
        commands: Commands,
        prefix: $("inputOfPrefix").value.trim(),
        admin: $("inputOfAdmin").value.trim(),
        password
      })
    });
    const data = await response.json();
    showResult(data.message, Boolean(data.success));
    if (data.success) {
      $("json-data").value = "";
      $("inputOfPassword").value = "";
      refreshStatus();
    }
  } catch (error) {
    showResult("Erreur réseau pendant le déploiement.", false);
  } finally {
    setTimeout(() => { button.disabled = !$("agreeCheckbox").checked; }, 2000);
  }
}

// ───────────── arrêt protégé par mot de passe ─────────────
function openStopModal(uid, name) {
  stopTargetUid = uid;
  $("stopTarget").textContent = `Entre le code à 4 chiffres choisi lors du déploiement de ${name}.`;
  $("stopPassword").value = "";
  $("stopModal").classList.add("open");
}

function closeStopModal() {
  stopTargetUid = null;
  $("stopModal").classList.remove("open");
}

async function confirmStop() {
  const password = $("stopPassword").value.trim();
  if (!/^\d{4}$/.test(password)) return;
  try {
    const response = await fetch("/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: stopTargetUid, password })
    });
    const data = await response.json();
    showResult(data.message, Boolean(data.success));
    if (data.success) { closeStopModal(); refreshStatus(); }
  } catch (error) {
    showResult("Erreur réseau.", false);
  }
}

// ───────────── liste des bots ─────────────
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

function renderBots(info) {
  $("onlineCount").textContent = info.online;
  const box = $("botList");
  if (!info.bots.length) {
    box.innerHTML = '<p class="empty">Aucun bot déployé pour le moment.</p>';
  } else {
    box.innerHTML = "";
    info.bots.forEach((bot) => {
      const card = document.createElement("div");
      card.className = "bot-card";
      card.innerHTML = `
        <img src="${bot.thumbSrc}" alt="${bot.name}" onerror="this.src='https://i.imgur.com/BNKq0fl.jpeg'" />
        <div class="bot-info">
          <div class="bot-name">${bot.name}</div>
          <div class="bot-meta">prefix "${bot.prefix}" · ${bot.commands} cmds · ${bot.handleEvent} events</div>
          <div class="bot-meta">${formatUptime(bot.time)}</div>
          <span class="badge ${bot.online ? "on" : "off"}">
            <i class="fa-solid fa-circle" style="font-size:7px"></i> ${bot.online ? "En ligne" : "Hors ligne"}
          </span>
        </div>
        <button class="icon-btn" title="Arrêter"><i class="fa-solid fa-power-off"></i></button>`;
      card.querySelector(".icon-btn").onclick = () => openStopModal(bot.userid, bot.name);
      box.appendChild(card);
    });
  }

  const select = $("logSelect");
  const previous = select.value || currentLogUid;
  select.innerHTML = '<option value="">— choisir un bot —</option>';
  info.bots.forEach((bot) => {
    const option = document.createElement("option");
    option.value = bot.userid;
    option.textContent = `${bot.name} (${bot.userid})`;
    select.appendChild(option);
  });
  if (info.bots.some((bot) => bot.userid === previous)) select.value = previous;
}

$("logSelect").addEventListener("change", (event) => {
  currentLogUid = event.target.value;
  refreshLogs();
});

async function refreshLogs() {
  const box = $("logs");
  if (!currentLogUid) { box.textContent = "Sélectionne un bot pour voir ses logs."; return; }
  try {
    const data = await (await fetch("/logs?uid=" + encodeURIComponent(currentLogUid))).json();
    box.textContent = (data.logs || []).join("\n") || "Aucun log pour le moment.";
    box.scrollTop = box.scrollHeight;
  } catch (error) { /* ignore */ }
}

async function refreshStatus() {
  try {
    const info = await (await fetch("/info")).json();
    renderBots(info);
    refreshLogs();
  } catch (error) { /* ignore */ }
}

loadCommands();
refreshStatus();
setInterval(refreshStatus, 4000);
