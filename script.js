let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let monitor = null;
let lastTrigger = 0;
let lastFixed = "";

/* TOAST */
function showToast(msg){
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");

  t.style.background="#1e293b";
  t.style.color="white";
  t.style.padding="10px";
  t.style.marginTop="10px";
  t.style.borderRadius="8px";

  t.innerText = msg;
  c.appendChild(t);

  setTimeout(()=>t.remove(),4000);
}

/* ADD NAVIO */
function addShip(){
  const name = document.getElementById("ship-name").value;
  const port = document.getElementById("ship-port").value;
  const obs = document.getElementById("ship-obs").value;

  if(!name) return alert("Digite o nome");

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
  const obs = document.getElementById("future-obs").value;
  const date = document.getElementById("future-date").value;

  if(!name || !date) return alert("Preencha nome e data");

  futureShips.push({
    id:Date.now(),
    name,
    port,
    obs,
    date
  });

  save();
}

/* RENDER */
function render(){
  document.getElementById("ships-list").innerHTML =
    ships.filter(s=>!s.concluido).map(s=>`
      <div class="ship">
        ${s.name} - ${s.port}
        <br><small>${s.obs||""}</small>
        <br>
        <button onclick="finishShip(${s.id})">✔</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    `).join("");

  document.getElementById("ships-done").innerHTML =
    ships.filter(s=>s.concluido).map(s=>`
      <div class="ship">
        ${s.name}
        <br><small>${s.finishedAt}</small>
      </div>
    `).join("");

  document.getElementById("future-list").innerHTML =
    futureShips.map(f=>`
      <div class="ship">${f.name} - ${f.date}</div>
    `).join("");
}

/* SAVE */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  render();
}

/* FINALIZAR */
function finishShip(id){
  const s = ships.find(x=>x.id==id);
  s.concluido = true;
  s.finishedAt = new Date().toLocaleString();
  save();
}

/* REMOVER */
function removeShip(id){
  ships = ships.filter(s=>s.id!=id);
  save();
}

/* FUTUROS → ATIVOS */
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

/* NOTIFICAÇÃO */
function notify(ship){

  showToast(`🚢 ${ship.name}`);

  if(Notification.permission==="granted"){
    new Notification(ship.name,{
      body:ship.port + " - " + (ship.obs||"")
    });
  }
}

/* ANTI-SPAM */
function shouldNotify(ship){
  const now = Date.now();
  const freq = document.getElementById("freq").value * 60000;

  if(!ship.lastNotified || now - ship.lastNotified > freq){
    ship.lastNotified = now;
    return true;
  }
  return false;
}

/* CHECK */
function check(){

  const now = new Date();

  // frequência
  ships.filter(s=>!s.concluido).forEach(s=>{
    if(shouldNotify(s)) notify(s);
  });

  // horário fixo
  const current = now.toTimeString().slice(0,5);
  const fixed = document.getElementById("fixed-time").value;

  if(current===fixed && lastFixed!==now.toDateString()){
    ships.filter(s=>!s.concluido).forEach(notify);
    lastFixed = now.toDateString();
  }
}

/* START */
async function startMonitor(){

  showToast("Monitor iniciado");

  await Notification.requestPermission();

  if(monitor) return;

  monitor = setInterval(()=>{
    checkFuture();
    check();
    render();
  },1000);
}

/* STOP */
function stopMonitor(){
  clearInterval(monitor);
  monitor = null;
  showToast("Monitor parado");
}

/* INIT */
render();
