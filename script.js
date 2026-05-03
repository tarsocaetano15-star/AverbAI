let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let freq = localStorage.getItem("freq") || 1440;
let monitor = null;

let lastTriggerTime = 0;
let lastFixedTrigger = "";

let COOLDOWN = freq * 60000;

// ---------------- FUTUROS ----------------

function addFutureShip(){

  const name = document.getElementById('future-name').value.trim();
  const port = document.getElementById('future-port').value.trim();
  const obs = document.getElementById('future-obs').value.trim();
  const date = document.getElementById('future-date').value;

  if(!name || !date){
    alert("Nome e data obrigatórios");
    return;
  }

  futureShips.push({
    id: Date.now(),
    name,
    port,
    obs,
    date
  });

  salvarFuture();
  renderFuture();

  log("Agendado: " + name + " para " + date);
}

function checkFutureShips(){

  const today = new Date().toISOString().split("T")[0];

  futureShips.forEach(f => {
    if(f.date <= today){

      ships.push({
        id: Date.now(),
        name: f.name,
        port: f.port,
        obs: f.obs,
        concluido:false,
        lastNotified:0
      });

      log("Navio ativado automaticamente: " + f.name);
    }
  });

  futureShips = futureShips.filter(f => f.date > today);

  salvarFuture();
  salvarShips();
  renderFuture();
  renderShips();
}

function renderFuture(){

  const el = document.getElementById('future-list');

  el.innerHTML = futureShips.map(f => `
    <div class="ship">
      <b>${f.name}</b> - ${f.port || ""}
      <br><small>${f.obs || ""}</small>
      <br><small>Data: ${f.date}</small>
    </div>
  `).join('') || "Nenhum agendado";
}

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
  log("Navio adicionado: " + name);
}

function renderShips(){

  const ativos = ships.filter(s => !s.concluido);
  const concluidos = ships.filter(s => s.concluido);

  document.getElementById('ships-list').innerHTML = ativos.map(s => `
    <div class="ship">
      <b>${s.name}</b> - ${s.port || ""}
      <br><small>${s.obs || ""}</small>

      <button onclick="finishShip(${s.id})">✅</button>
      <button onclick="removeShip(${s.id})">🗑</button>
    </div>
  `).join('') || "Nenhum ativo";

  document.getElementById('ships-done').innerHTML = concluidos.map(s => `
    <div class="ship" style="opacity:0.6">
      <b>${s.name}</b> - ${s.port || ""}
      <br><small>${s.obs || ""}</small>
      <br><small>Finalizado em: ${s.finishedAt}</small>
    </div>
  `).join('') || "Nenhum concluído";
}

function finishShip(id){
  let s = ships.find(x=>x.id==id);
  s.concluido = true;
  s.finishedAt = new Date().toLocaleString();
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
}

// ---------------- MONITOR ----------------

function startMonitor(){

  if(monitor) return;

  if(Notification.permission !== "granted"){
    Notification.requestPermission();
  }

  monitor = setInterval(()=>{
    checkFutureShips();
    checkTimes();
  },1000);

  log("Monitor iniciado");
}

function stopMonitor(){
  clearInterval(monitor);
  monitor = null;
  log("Monitor parado");
}

// ---------------- ALERTAS ----------------

function checkTimes(){

  const now = new Date();
  const nowMs = now.getTime();

  // 🔁 INTERVALO
  if(nowMs - lastTriggerTime >= COOLDOWN){

    const ativos = ships.filter(s => !s.concluido);

    if(ativos.length > 0){
      ativos.forEach(s => notify(s));
      lastTriggerTime = nowMs;
      log("Disparo por frequência");
    }
  }

  // ⏰ HORÁRIO FIXO
  const current = now.toTimeString().slice(0,5);
  const fixed = document.getElementById('fixed-time')?.value;

  if(fixed && current === fixed && lastFixedTrigger !== now.toDateString()){

    const ativos = ships.filter(s => !s.concluido);

    if(ativos.length > 0){
      ativos.forEach(s => notify(s));
      lastFixedTrigger = now.toDateString();
      log("Disparo por horário fixo: " + fixed);
    }
  }
}

function notify(ship){

  if(ship.lastNotified && (Date.now() - ship.lastNotified < COOLDOWN)){
    return;
  }

  ship.lastNotified = Date.now();
  salvarShips();

  const msg = `Porto: ${ship.port || "-"} | Obs: ${ship.obs || "-"}`;

  showToast(ship.name, msg);

  if(Notification.permission === "granted"){
    new Notification(ship.name, { body: msg });
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

function salvarFuture(){
  localStorage.setItem("futureShips", JSON.stringify(futureShips));
}

// ---------------- INIT ----------------

renderShips();
renderFuture();
renderLogs();
