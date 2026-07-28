const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem("adminToken") || "";
let lastChat = 0;
let chatCount = 0;
let currentLog = "";
let allBots = [];
let history = [];
let autoRefresh = true;
let rawLogs = "";
let lastOverview = null;

// ───────────── PIN ─────────────
const pins = [...document.querySelectorAll(".pin")];
pins.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (input.value && index < pins.length - 1) pins[index + 1].focus();
    if (pins.every((p) => p.value)) unlock();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0) pins[index - 1].focus();
  });
});

$("unlockBtn").onclick = unlock;

async function unlock() {
  const password = pins.map((p) => p.value).join("");
  if (password.length !== 4) return;
  try {
    const response = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (!data.success) {
      $("lockError").textContent = data.message || "Accès refusé.";
      pins.forEach((p) => (p.value = ""));
      pins[0].focus();
      return;
    }
    token = data.token;
    sessionStorage.setItem("adminToken", token);
    openConsole();
  } catch (error) {
    $("lockError").textContent = "Erreur réseau.";
  }
}

function openConsole() {
  $("lockScreen").classList.add("hidden");
  $("console").classList.remove("hidden");
  refresh();
  loadChat();
}

function api(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "x-admin-token": token, ...(options.headers || {}) }
  });
}

// ───────────── toasts ─────────────
function toast(message, kind = "") {
  const box = $("toasts");
  const item = document.createElement("div");
  item.className = "toast-item " + kind;
  item.textContent = message;
  box.appendChild(item);
  setTimeout(() => item.remove(), 4000);
}

// ───────────── onglets ─────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    tab.classList.add("active");
    $("view-" + tab.dataset.tab).classList.remove("hidden");
  };
});

$("logoutBtn").onclick = async () => {
  await api("/admin/logout", { method: "POST" }).catch(() => {});
  sessionStorage.removeItem("adminToken");
  location.reload();
};

$("refreshBtn").onclick = refresh;
$("stopAllBtn").onclick = async () => {
  if (!confirm("Arrêter TOUS les bots ?")) return;
  await api("/admin/stopall", { method: "POST" });
  refresh();
};

function uptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m ${seconds % 60}s`;
}

const ACTION_LABEL = { stop: "arrêté", restart: "redémarré", refresh: "profil rafraîchi", delete: "supprimé" };

async function botAction(action, uid) {
  if (action === "delete" && !confirm("Supprimer définitivement cette session ?")) return;
  try {
    const response = await api(`/admin/bot/${action}`, { method: "POST", body: JSON.stringify({ uid }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success !== false) toast(`Bot ${uid} : ${ACTION_LABEL[action] || action}`, "ok");
    else toast(data.message || "Action refusée", "err");
  } catch (error) {
    toast("Erreur réseau", "err");
  }
  refresh();
}

function visibleBots() {
  const query = ($("botSearch").value || "").toLowerCase().trim();
  const filter = $("botFilter").value;
  const sort = $("botSort").value;
  let list = allBots.filter((bot) => {
    if (filter === "online" && !bot.online) return false;
    if (filter === "offline" && bot.online) return false;
    if (!query) return true;
    return `${bot.name} ${bot.userid} ${bot.prefix}`.toLowerCase().includes(query);
  });
  if (sort === "uptime") list = list.sort((a, b) => b.time - a.time);
  if (sort === "name") list = list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (sort === "status") list = list.sort((a, b) => Number(b.online) - Number(a.online));
  return list;
}

function renderBots(bots) {
  const box = $("adminBots");
  box.innerHTML = bots.length ? "" : '<p style="color:#7e93b8">Aucune session correspondante.</p>';
  bots.forEach((bot) => {
    const card = document.createElement("div");
    card.className = "abot";
    card.innerHTML = `
      <div class="abot-head">
        <img src="${bot.thumbSrc}?t=${Date.now()}" alt="${bot.name}" onerror="this.src='logo.png'" />
        <div>
          <div class="abot-name">${bot.name}</div>
          <div class="abot-meta">${bot.userid} · prefix "${bot.prefix}"</div>
          <div class="abot-meta">${bot.commands} cmds · ${bot.handleEvent} events · ${uptime(bot.time)}</div>
          <span class="badge ${bot.online ? "on" : "off"}"><i class="fa-solid fa-circle" style="font-size:7px"></i> ${bot.online ? "En ligne" : "Hors ligne"}</span>
        </div>
      </div>
      <div class="abot-actions">
        <button class="btn danger" data-act="stop"><i class="fa-solid fa-stop"></i> Stop</button>
        <button class="btn ghost" data-act="restart"><i class="fa-solid fa-rotate-right"></i> Restart</button>
        <button class="btn ghost" data-act="refresh"><i class="fa-solid fa-user-pen"></i> Profil</button>
        <button class="btn ghost" data-act="delete"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    card.querySelectorAll("[data-act]").forEach((button) => {
      button.onclick = () => botAction(button.dataset.act, bot.userid);
    });
    box.appendChild(card);
  });

  buildLogSelect();
}

function buildLogSelect() {
  const bots = allBots;
  const select = $("adminLogSelect");
  const previous = select.value || currentLog;
  select.innerHTML = '<option value="">— choisir un bot —</option>';
  bots.forEach((bot) => {
    const option = document.createElement("option");
    option.value = bot.userid;
    option.textContent = `${bot.name} (${bot.userid})`;
    select.appendChild(option);
  });
  if (bots.some((bot) => bot.userid === previous)) select.value = previous;
}

$("adminLogSelect").onchange = (event) => {
  currentLog = event.target.value;
  loadLogs();
};

async function loadLogs() {
  if (!currentLog) { $("adminLogs").textContent = "Sélectionne un bot."; return; }
  const data = await (await fetch("/logs?uid=" + encodeURIComponent(currentLog))).json();
  rawLogs = (data.logs || []).join("\n");
  paintLogs();
}

function paintLogs() {
  const filter = ($("logFilter").value || "").toLowerCase();
  const lines = rawLogs.split("\n").filter((line) => !filter || line.toLowerCase().includes(filter));
  const box = $("adminLogs");
  const stick = $("logAuto").checked;
  box.textContent = lines.join("\n") || "Aucun log.";
  if (stick) box.scrollTop = box.scrollHeight;
}

// ───────────── sparkline ─────────────
function drawSpark() {
  const canvas = $("sparkline");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const width = canvas.width, height = canvas.height;
  context.clearRect(0, 0, width, height);
  if (history.length < 2) return;
  const max = Math.max(2, ...history);
  const step = width / (history.length - 1);
  const point = (index) => [index * step, height - 12 - (history[index] / max) * (height - 30)];

  context.strokeStyle = "rgba(80,170,255,.16)";
  context.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i;
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(0,229,255,.45)");
  gradient.addColorStop(1, "rgba(0,229,255,0)");
  context.beginPath();
  context.moveTo(0, height);
  history.forEach((_, index) => context.lineTo(...point(index)));
  context.lineTo(width, height);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  history.forEach((_, index) => { const [x, y] = point(index); index ? context.lineTo(x, y) : context.moveTo(x, y); });
  context.strokeStyle = "#00e5ff";
  context.lineWidth = 2.5;
  context.shadowColor = "rgba(0,229,255,.8)";
  context.shadowBlur = 12;
  context.stroke();
  context.shadowBlur = 0;
}

async function refresh() {
  if (!token) return;
  const started = Date.now();
  try {
    const response = await api("/admin/overview");
    if (response.status === 401) {
      sessionStorage.removeItem("adminToken");
      return location.reload();
    }
    const data = await response.json();
    $("statOnline").textContent = data.online;
    $("statTotal").textContent = data.total;
    $("statHistory").textContent = data.history;
    $("statHeap").textContent = data.server.heap;
    $("sysRam").textContent = data.server.rss;
    $("sysUptime").textContent = uptime(data.server.uptime);
    allBots = data.bots || [];
    lastOverview = data;
    $("statCmds").textContent = allBots.reduce((total, bot) => total + (bot.commands || 0), 0);
    history.push(data.online);
    if (history.length > 60) history.shift();
    drawSpark();
    renderBots(visibleBots());
    $("eventList").innerHTML = (data.events || [])
      .map((event) => `<li><time>${new Date(event.at).toLocaleString()}</time>${event.message}</li>`)
      .join("") || "<li>Aucun évènement.</li>";
    loadLogs();
    $("sysPing").textContent = Date.now() - started;
  } catch (error) { /* ignore */ }
}

// ───────────── chat ─────────────
function renderMessages(messages) {
  const box = $("adminChat");
  messages.forEach((message) => {
    const div = document.createElement("div");
    div.className = "msg " + (message.admin ? "me" : "them");
    div.innerHTML = `<span class="who">${message.author} · ${new Date(message.at).toLocaleTimeString()}</span>${message.text.replace(/</g, "&lt;")}`;
    box.appendChild(div);
    chatCount += 1;
    $("statChat").textContent = chatCount;
    lastChat = Math.max(lastChat, message.at);
  });
  box.scrollTop = box.scrollHeight;
}

async function loadChat() {
  try {
    const data = await (await fetch("/chat?since=" + lastChat)).json();
    renderMessages(data.messages || []);
  } catch (error) { /* ignore */ }
}

$("adminChatForm").onsubmit = async (event) => {
  event.preventDefault();
  const text = $("adminChatInput").value.trim();
  if (!text) return;
  $("adminChatInput").value = "";
  await api("/chat", { method: "POST", body: JSON.stringify({ message: text }) });
  loadChat();
};

$("clearChat").onclick = async () => {
  if (!confirm("Vider le chat ?")) return;
  await api("/chat", { method: "DELETE" });
  $("adminChat").innerHTML = "";
  lastChat = 0;
};

["botSearch", "botSort", "botFilter"].forEach((id) => {
  $(id).addEventListener("input", () => renderBots(visibleBots()));
  $(id).addEventListener("change", () => renderBots(visibleBots()));
});

$("logFilter").addEventListener("input", paintLogs);

$("logCopy").onclick = async () => {
  try { await navigator.clipboard.writeText(rawLogs); toast("Logs copiés", "ok"); }
  catch (error) { toast("Copie impossible", "err"); }
};

$("logDownload").onclick = () => {
  const blob = new Blob([rawLogs], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `logs-${currentLog || "bot"}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
};

$("refreshAllProfiles").onclick = async () => {
  for (const bot of allBots) await api("/admin/bot/refresh", { method: "POST", body: JSON.stringify({ uid: bot.userid }) });
  toast("Profils rafraîchis", "ok");
  refresh();
};

$("exportBtn").onclick = () => {
  const report = JSON.stringify({ generatedAt: new Date().toISOString(), overview: lastOverview }, null, 2);
  const blob = new Blob([report], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `autobot-rapport-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Rapport exporté", "ok");
};

$("autoBtn").onclick = () => {
  autoRefresh = !autoRefresh;
  $("autoBtn").innerHTML = `<i class="fa-solid fa-bolt"></i> Auto-refresh : ${autoRefresh ? "ON" : "OFF"}`;
  toast(`Auto-refresh ${autoRefresh ? "activé" : "désactivé"}`);
};

// raccourcis clavier
document.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  const tabs = [...document.querySelectorAll(".tab")];
  if (/^[1-5]$/.test(event.key) && tabs[Number(event.key) - 1]) tabs[Number(event.key) - 1].click();
  if (event.key.toLowerCase() === "r") { refresh(); toast("Rafraîchi"); }
});

setInterval(() => {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString();
}, 1000);

setInterval(() => { if (autoRefresh && token && !$("console").classList.contains("hidden")) refresh(); }, 5000);
setInterval(() => { if (token && !$("console").classList.contains("hidden")) loadChat(); }, 3000);

if (token) {
  api("/admin/overview").then((response) => {
    if (response.ok) openConsole();
    else sessionStorage.removeItem("adminToken");
  }).catch(() => {});
} else {
  pins[0].focus();
}
