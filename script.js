let ships = JSON.parse(localStorage.getItem("ships")) || [];
let times = JSON.parse(localStorage.getItem("times")) || [];
let monitor = null;

// CONTROLE DE DISPARO (evita spam)
let lastTriggerMinute = "";

// -------- NAVIOS --------

function addShip(){
  const name = document.getElementById('ship-name').value;
  const port = document.getElementById('ship-port').value;
  const obs = document.getElementById('ship-obs').value;

  ships.push({
    id: Date.now(),
    name,
    port,
    obs,
    ativo: false,
    concluido: false
  });

  salvarShips();
  renderShips();
  log("Navio adicionado: " + name);
}

function renderShips(){
  const el = document.getElementById('ships-list');

  el.innerHTML = ships.map(s => `
    <div class="ship">
      <b>${s.name}</b> - ${s.port || ""}
      <br>
      <small>${s.obs || ""}</small>

      <div class="ship-actions">
        <button onclick="startShip(${s.id})">▶</button>
        <button onclick="stopShip(${s.id})">⏹</button>
        <button onclick="finishShip(${s.id})">✅</button>
      </div>
    </div>
  `).join('');
}

function startShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = true;
  salvarShips();
  log("Monitorando: " + s.name);
}

function stopShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = false;
  salvarShips();
  log("Parado: " + s.name);
}

function finishShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = false;
  s.concluido = true;
  salvarShips();
  log("Concluído: " + s.name);
}

// -------- HORÁRIOS --------

function addTime(){
  const t = document.getElementById('alarm-time').value;

  if(!times.includes(t)){
    times.push(t);
    salvarTimes();
    renderTimes();
    log("Horário adicionado: " + t);
  }
}

function renderTimes(){
  const el = document.getElementById('time-list');
  el.innerHTML = times.map(t => `<div>${t}</div>`).join('');
}

// -------- MONITOR --------

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

// -------- CONTROLE INTELIGENTE (ANTI-SPAM) --------

function checkTimes(){

  if(!monitor) return; // PARA INSTANTÂNEO

  const now = new Date();
  const current = now.toTimeString().slice(0,5);

  // EVITA REPETIR NO MESMO MINUTO
  if(current === lastTriggerMinute) return;

  if(times.includes(current)){

    ships
      .filter(s => s.ativo && !s.concluido)
      .forEach(s => notify(s));

    lastTriggerMinute = current;
    log("Alerta disparado às " + current);
  }
}

// -------- NOTIFICAÇÃO --------

function notify(ship){

  const msg = `${ship.port || ""} ${ship.obs || ""}`;

  showToast("🚢 "+ship.name, msg);

  if(Notification.permission === "granted"){
    new Notification(ship.name, {
      body: msg,
      icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png"
    });
  }
}

// -------- TOAST --------

function showToast(title,msg){
  const c = document.getElementById('toasts');

  const t = document.createElement('div');
  t.className = "toast";
  t.innerHTML = `<b>${title}</b><br>${msg}`;

  c.appendChild(t);

  setTimeout(()=>t.remove(),5000);
}

// -------- LOG --------

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

// -------- STORAGE --------

function salvarShips(){
  localStorage.setItem("ships", JSON.stringify(ships));
}

function salvarTimes(){
  localStorage.setItem("times", JSON.stringify(times));
}

// -------- INIT --------

renderShips();
renderTimes();
renderLogs();
