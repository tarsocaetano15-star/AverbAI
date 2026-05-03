let ships = JSON.parse(localStorage.getItem("ships")) || [];
let times = JSON.parse(localStorage.getItem("times")) || [];
let monitor = null;

// 🔒 CONTROLE ANTI-SPAM GLOBAL
let lastTriggerTime = 0;
const COOLDOWN = 60000; // 1 minuto

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
    ativo:false,
    concluido:false,
    lastNotified: 0
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
  const el = document.getElementById('ships-list');

  if(!ships.length){
    el.innerHTML = "<div>Nenhum navio cadastrado</div>";
    return;
  }

  el.innerHTML = ships.map(s => `
    <div class="ship" style="border-left:4px solid ${
      s.concluido ? '#10b981' : s.ativo ? '#00d4ff' : '#64748b'
    }">

      <b>${s.name}</b> - ${s.port || ""}
      <br>
      <small>${s.obs || ""}</small>

      <div class="ship-actions">
        <button onclick="startShip(${s.id})">▶</button>
        <button onclick="stopShip(${s.id})">⏹</button>
        <button onclick="finishShip(${s.id})">✅</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

function startShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = true;
  salvarShips();
  renderShips();
  log("Monitorando: " + s.name);
}

function stopShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = false;
  salvarShips();
  renderShips();
  log("Parado: " + s.name);
}

function finishShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = false;
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

// ---------------- HORÁRIOS ----------------

function addTime(){
  const t = document.getElementById('alarm-time').value;

  if(!t){
    alert("Escolha um horário");
    return;
  }

  if(times.includes(t)){
    alert("Horário já existe");
    return;
  }

  times.push(t);
  salvarTimes();
  renderTimes();
  log("Horário adicionado: " + t);
}

function removeTime(t){
  times = times.filter(x => x !== t);
  salvarTimes();
  renderTimes();
  log("Horário removido: " + t);
}

function renderTimes(){
  const el = document.getElementById('time-list');

  if(!times.length){
    el.innerHTML = "<div>Nenhum horário definido</div>";
    return;
  }

  el.innerHTML = times.map(t => `
    <div>
      ${t}
      <button onclick="removeTime('${t}')">❌</button>
    </div>
  `).join('');
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

// ---------------- ANTI-SPAM DEFINITIVO ----------------

function checkTimes(){

  if(!monitor) return;

  const now = new Date();
  const current = now.toTimeString().slice(0,5);
  const nowMs = now.getTime();

  // 🔒 trava global (1 minuto)
  if(nowMs - lastTriggerTime < COOLDOWN) return;

  if(times.includes(current)){

    const ativos = ships.filter(s => s.ativo && !s.concluido);

    if(ativos.length === 0) return;

    ativos.forEach(s => notify(s));

    lastTriggerTime = nowMs;

    log("Alerta disparado: " + current);
  }
}

// ---------------- NOTIFICAÇÃO ----------------

function notify(ship){

  // 🔒 trava individual por navio
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

// ---------------- STORAGE ----------------

function salvarShips(){
  localStorage.setItem("ships", JSON.stringify(ships));
}

function salvarTimes(){
  localStorage.setItem("times", JSON.stringify(times));
}

// ---------------- INIT ----------------

renderShips();
renderTimes();
renderLogs();
