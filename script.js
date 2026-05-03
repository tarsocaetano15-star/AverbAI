let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let freq = 1440;
let monitor = null;

let lastTriggerTime = 0;
let lastFixedTrigger = "";
let COOLDOWN = freq * 60000;

/* DASHBOARD */
function updateDashboard(){
  document.getElementById('dash-active').innerText = "Ativos: " + ships.filter(s=>!s.concluido).length;
  document.getElementById('dash-future').innerText = "Futuros: " + futureShips.length;
  document.getElementById('dash-done').innerText = "Concluídos: " + ships.filter(s=>s.concluido).length;
}

/* D+ */
function calcDplus(date){
  const start = new Date(date);
  const now = new Date();
  return Math.floor((now - start) / (1000*60*60*24));
}

/* RENDER */
function renderShips(){

  updateDashboard();

  const ativos = ships.filter(s=>!s.concluido);
  const concluidos = ships.filter(s=>s.concluido);

  document.getElementById('ships-list').innerHTML = ativos.map(s=>{

    const d = calcDplus(s.createdAt);
    let cls="green";
    if(d>=5) cls="yellow";
    if(d>=6) cls="red";

    return `
    <div class="ship ${d>=6 ? 'pulse':''}">
      <b>${s.name}</b> - ${s.port}
      <span class="badge ${cls}">D+${d}</span>
      <br><small>${s.obs||""}</small>

      <div class="ship-actions">
        <button onclick="finishShip(${s.id})">✔</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    </div>`;
  }).join('') || "Nenhum ativo";

  document.getElementById('ships-done').innerHTML = concluidos.map(s=>`
    <div class="ship" style="opacity:0.6">
      <b>${s.name}</b>
      <br><small>${s.obs||""}</small>
      <br><small>${s.finishedAt}</small>
    </div>
  `).join('');
}

/* FUTUROS */
function renderFuture(){
  document.getElementById('future-list').innerHTML = futureShips.map(f=>`
    <div class="ship">
      <b>${f.name}</b> - ${f.port}
      <br><small>${f.date}</small>
    </div>
  `).join('');
}

/* ADD */
function addShip(){

  const name = document.getElementById("shipName").value.trim();
  const port = document.getElementById("shipPort").value.trim();
  const obs = document.getElementById("shipObs").value.trim();

  if(!name){
    alert("Digite o nome do navio");
    return;
  }

  ships.push({
    id:Date.now(),
    name,
    port,
    obs,
    createdAt:new Date(),
    concluido:false
  });

  document.getElementById("shipName").value="";
  document.getElementById("shipPort").value="";
  document.getElementById("shipObs").value="";

  save();
}

function addFutureShip(){

  const name = document.getElementById("futureName").value.trim();
  const port = document.getElementById("futurePort").value.trim();
  const obs = document.getElementById("futureObs").value.trim();
  const date = document.getElementById("futureDate").value;

  if(!name || !date){
    alert("Nome e data são obrigatórios");
    return;
  }

  futureShips.push({
    id:Date.now(),
    name,
    port,
    obs,
    date
  });

  save();
}

/* MOVE FUTURO → ATIVO */
function checkFuture(){
  const today = new Date().toISOString().split("T")[0];

  futureShips.forEach(f=>{
    if(f.date <= today){
      ships.push({
        ...f,
        createdAt:new Date(),
        concluido:false
      });
    }
  });

  futureShips = futureShips.filter(f=>f.date > today);
}

/* ACTIONS */
function finishShip(id){
  let s = ships.find(x=>x.id==id);
  s.concluido=true;
  s.finishedAt=new Date().toLocaleString();
  save();
}

function removeShip(id){
  ships = ships.filter(s=>s.id!=id);
  save();
}

/* NOTIFICAÇÃO */
function notify(s){
  if(Notification.permission==="granted"){
    new Notification(s.name,{body:s.obs||""});
  }
}

/* CHECK */
function checkTimes(){

  const now = new Date();
  const nowMs = now.getTime();

  if(nowMs - lastTriggerTime >= COOLDOWN){
    ships.filter(s=>!s.concluido).forEach(notify);
    lastTriggerTime = nowMs;
  }

  const current = now.toTimeString().slice(0,5);
  const fixed = document.getElementById('fixed-time').value;

  if(current===fixed && lastFixedTrigger!==now.toDateString()){
    ships.filter(s=>!s.concluido).forEach(notify);
    lastFixedTrigger = now.toDateString();
  }
}

/* CONTROLE */
function startMonitor(){

  if(monitor) return;

  Notification.requestPermission();

  monitor=setInterval(()=>{
    checkFuture();
    checkTimes();
    renderShips();
  },1000);

  alert("Monitoramento iniciado");
}

function stopMonitor(){
  clearInterval(monitor);
  monitor=null;
  alert("Monitoramento parado");
}

/* SAVE */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  renderShips();
  renderFuture();
  updateDashboard();
}

/* INIT */
renderShips();
renderFuture();
updateDashboard();
