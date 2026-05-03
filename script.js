let ships = JSON.parse(localStorage.getItem("ships")) || [];
let times = JSON.parse(localStorage.getItem("times")) || [];
let freq = localStorage.getItem("freq") || 1440;

let monitor = null;
let lastTriggerTime = 0;
let COOLDOWN = freq * 60000;

// ---------------- NAVIOS ----------------

function addShip(){
  const name = document.getElementById('ship-name').value.trim();
  const port = document.getElementById('ship-port').value.trim();
  const obs = document.getElementById('ship-obs').value.trim();

  if(!name){
    alert("Digite o nome do navio");
    return;
  }

  ships.push({
    id: Date.now(),
    name,
    port,
    obs,
    concluido:false,
    lastNotified:0
  });

  salvarShips();
  renderShips();
  limparInputs();

  log("Navio adicionado: " + name);
}

function limparInputs(){
  document.getElementById('ship-name').value = "";
  document.getElementById('ship-port').value = "";
  document.getElementById('ship-obs').value = "";
}

function renderShips(){

  const ativos = ships.filter(s => !s.concluido);
  const concluidos = ships.filter(s => s.concluido);

  document.getElementById('ships-list').innerHTML = ativos.map(s => `
    <div class="ship">
      <b>${s.name}</b> - ${s.port || ""}
      <br><small>${s.obs || ""}</small>

      <div class="ship-actions">
        <button onclick="finishShip(${s.id})">✅</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    </div>
  `).join('') || "Nenhum navio";

  document.getElementById('ships-done').innerHTML = concluidos.map(s => `
    <div class="ship" style="opacity:0.6">
      <b>${s.name}</b> - ${s.port || ""}
      <br><small>${s.obs || ""}</small>
    </div>
  `).join('') || "Nenhum concluído";
}

function finishShip(id){
  let s = ships.find(x=>x.id==id);
  s.concluido = true;
  salvarShips();
  renderShips();
  log("Concluído: " + s.name);
}

function removeShip(id){
  ships = ships.filter(s => s.id !== id);
  salvarShips();
  renderShips();
  log("Navio removido");
}

// ---------------- FREQUÊNCIA ----------------

function setFrequency(val){
  freq = parseInt(val);
  COOLDOWN = freq * 60000;
  localStorage.setItem("freq", freq);
  log("Frequência alterada: " + val + " min");
}

// ---------------- MONITOR ----------------

function startMonitor(){

  if(monitor) return;

  if(Notification.permission !== "granted"){
    Notification.requestPermission();
  }

  monitor = setInterval(checkTimes, 1000);
  log("Monitor iniciado");
}

function stopMonitor(){
  clearInterval(monitor);
  monitor = null;
  log("Monitor parado");
}

// ---------------- CHECK ----------------

function checkTimes(){

  if(!monitor) return;

  const now = Date.now();

  if(now - lastTriggerTime < COOLDOWN) return;

  const ativos = ships.filter(s => !s.concluido);

  if(ativos.length === 0) return;

  ativos.forEach(s => notify(s));

  lastTriggerTime = now;

  log("Disparo executado");
}

// ---------------- NOTIFICAÇÃO ----------------

function notify(ship){

  if(ship.lastNotified && (Date.now() - ship.lastNotified < COOLDOWN)){
    return;
  }

  ship.lastNotified = Date.now();
  salvarShips();

  const msg = `
Porto: ${ship.port || "-"}
Obs: ${ship.obs || "-"}
  `;

  showToast(ship.name, msg);

  if(Notification.permission === "granted"){
    new Notification(ship.name, {
      body: msg,
      icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png"
    });
  }
}

// ---------------- TOAST ----------------

function showToast(title,msg){
  const c = document.getElementById('toasts');

  const t = document.createElement('div');
  t.className = "toast";
  t.innerHTML = `<b>${title}</b><br>${msg}`;

  c.appendChild(t);

  setTimeout(()=>t.remove(),5000);
}

// ---------------- LOG ----------------

function log(msg){
  let logs = JSON.parse(localStorage.getItem("logs")) || [];

  logs.push(new Date().toLocaleString()+" - "+msg);

  localStorage.setItem("logs", JSON.stringify(logs));

  renderLogs();
}

function renderLogs(){
  const el = document.getElementById('log');
  const logs = JSON.parse(localStorage.getItem("logs")) || [];

  el.innerHTML = logs.reverse().map(l=>`<div>${l}</div>`).join('');
}

function clearLogs(){
  localStorage.removeItem("logs");
  renderLogs();
}

// ---------------- STORAGE ----------------

function salvarShips(){
  localStorage.setItem("ships", JSON.stringify(ships));
}

// ---------------- INIT ----------------

renderShips();
renderLogs();
