let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let freq = 1440;
let monitor = null;

let lastTriggerTime = 0;
let lastFixedTrigger = "";

/* TOAST */
function showToast(msg){
  const container = document.getElementById("toast-container");

  const t = document.createElement("div");
  t.style.background="#1e293b";
  t.style.color="white";
  t.style.padding="12px";
  t.style.marginTop="10px";
  t.style.borderRadius="8px";
  t.style.boxShadow="0 0 10px rgba(0,0,0,0.5)";
  t.innerText = msg;

  container.appendChild(t);

  setTimeout(()=>t.remove(),4000);
}

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

    return `
    <div class="ship">
      <b>${s.name}</b> - ${s.port}
      <span class="badge">D+${d}</span>
      <br><small>${s.obs||""}</small>

      <div class="ship-actions">
        <button onclick="finishShip(${s.id})">✔</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('ships-done').innerHTML = concluidos.map(s=>`
    <div class="ship">
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
  const name = document.getElementById("ship-name").value;
  const port = document.getElementById("ship-port").value;
  const obs  = document.getElementById("ship-obs").value;

  if (!name) return alert("Informe o nome");

  ships.push({
    id:Date.now(),
    name,
    port,
    obs,
    createdAt:new Date(),
    concluido:false,
    lastNotified:null
  });

  save();
}

/* FUTUROS */
function addFutureShip(){
  const name = document.getElementById("future-name").value;
  const port = document.getElementById("future-port").value;
  const obs  = document.getElementById("future-obs").value;
  const date = document.getElementById("future-date").value;

  if (!name || !date) return alert("Nome e data obrigatórios");

  futureShips.push({ id:Date.now(), name, port, obs, date });

  save();
}

/* MOVE FUTUROS */
function checkFuture(){
  const today = new Date().toISOString().split("T")[0];

  futureShips.forEach(f=>{
    if(f.date <= today){
      ships.push({
        ...f,
        createdAt:new Date(),
        concluido:false,
        lastNotified:null
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

/* 🔔 NOTIFICAÇÃO */
function notify(s){

  // TOAST
  showToast(`🚢 ${s.name} - ${s.port}`);

  // SISTEMA
  if(Notification.permission==="granted"){
    new Notification(s.name,{
      body:`${s.port}\n${s.obs||""}`
    });
  }
}

/* ANTI-SPAM */
function shouldNotify(ship){
  const today = new Date().toDateString();
  if(ship.lastNotified === today) return false;
  ship.lastNotified = today;
  return true;
}

/* CHECK */
function checkTimes(){

  const now = new Date();
  const nowMs = now.getTime();

  if(nowMs - lastTriggerTime >= freq * 60000){

    ships.filter(s=>!s.concluido).forEach(s=>{
      if(shouldNotify(s)) notify(s);
    });

    lastTriggerTime = nowMs;
  }

  const current = now.toTimeString().slice(0,5);
  const fixed = document.getElementById('fixed-time').value;

  if(current===fixed && lastFixedTrigger!==now.toDateString()){

    ships.filter(s=>!s.concluido).forEach(s=>{
      if(shouldNotify(s)) notify(s);
    });

    lastFixedTrigger = now.toDateString();
  }
}

/* CONTROL */
async function startMonitor(){

  showToast("🚀 Monitor iniciado");

  await Notification.requestPermission();

  if(monitor) return;

  monitor=setInterval(()=>{
    checkFuture();
    checkTimes();
    renderShips();
  },1000);
}

function stopMonitor(){
  clearInterval(monitor);
  monitor=null;
  showToast("⛔ Monitor parado");
}

/* SAVE */
function save(){
  localStorage.setItem("ships
