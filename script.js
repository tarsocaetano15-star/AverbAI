let ships = [];
let times = [];
let monitor = null;

// NAVIOS
function addShip(){
  const name = document.getElementById('ship-name').value;
  const port = document.getElementById('ship-port').value;

  ships.push({
    id: Date.now(),
    name,
    port,
    ativo:false
  });

  renderShips();
  log("Navio adicionado: " + name);
}

function renderShips(){
  const el = document.getElementById('ships-list');

  el.innerHTML = ships.map(s => `
    <div class="ship">
      ${s.name} - ${s.port}
      <br>
      <button onclick="startShip(${s.id})">▶</button>
      <button onclick="stopShip(${s.id})">⏹</button>
    </div>
  `).join('');
}

function startShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = true;
  log("Monitorando: " + s.name);
}

function stopShip(id){
  let s = ships.find(x=>x.id==id);
  s.ativo = false;
  log("Parado: " + s.name);
}

// HORÁRIOS
function addTime(){
  const t = document.getElementById('alarm-time').value;

  if(!times.includes(t)){
    times.push(t);
    renderTimes();
    log("Horário adicionado: " + t);
  }
}

function renderTimes(){
  const el = document.getElementById('time-list');
  el.innerHTML = times.map(t => `<div>${t}</div>`).join('');
}

// MONITOR
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

function checkTimes(){
  const now = new Date();
  const current = now.toTimeString().slice(0,5);

  if(times.includes(current)){
    ships.filter(s=>s.ativo).forEach(s=>{
      notify(s);
    });
  }
}

// NOTIFICAÇÃO
function notify(ship){

  showToast("🚢 "+ship.name, ship.port);

  if(Notification.permission === "granted"){
    new Notification(ship.name, {
      body: ship.port,
      icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png"
    });
  }
}

// TOAST
function showToast(title,msg){
  const c = document.getElementById('toasts');

  const t = document.createElement('div');
  t.className = "toast";
  t.innerHTML = `<b>${title}</b><br>${msg}`;

  c.appendChild(t);

  setTimeout(()=>t.remove(),5000);
}

// LOG
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

renderLogs();
