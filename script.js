let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];
let historyLog = localStorage.getItem("historyLog") || "";

let monitor = null;
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

/* HISTÓRICO */
function addHistory(msg){
  const time = new Date().toLocaleString();
  historyLog = `[${time}] ${msg}\n` + historyLog;
  localStorage.setItem("historyLog", historyLog);
  document.getElementById("history").value = historyLog;
}

function clearHistory(){
  historyLog = "";
  localStorage.setItem("historyLog", "");
  document.getElementById("history").value = "";
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

  showToast(`🚢 ${name} entrou em monitoramento`);
  addHistory(`Navio iniciado: ${name}`);

  save();
}

/* FUTUROS */
function addFutureShip(){
  const name = document.getElementById("future-name").value;
  const port = document.getElementById("future-port").value;
  const obs = document.getElementById("future-obs").value;
  const date = document.getElementById("future-date").value;

  if(!name || !date) return alert("Preencha nome e data");

  futureShips.push({id:Date.now(), name, port, obs, date});
  addHistory(`Navio agendado: ${name} (${date})`);
  save();
}

/* REMOVER FUTURO */
function removeFuture(id){
  futureShips = futureShips.filter(f=>f.id!=id);
  addHistory("Navio futuro removido");
  save();
}

/* RENDER */
function render(){

  document.getElementById("history").value = historyLog;

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
        <br>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    `).join("");

  document.getElementById("future-list").innerHTML =
    futureShips.map(f=>`
      <div class="ship">
        ${f.name} - ${f.date}
        <br>
        <button onclick="removeFuture(${f.id})">🗑</button>
      </div>
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
  addHistory(`Navio concluído: ${s.name}`);
  save();
}

/* REMOVER */
function removeShip(id){
  ships = ships.filter(s=>s.id!=id);
  addHistory("Navio removido");
  save();
}

/* FUTUROS → ATIVOS */
function checkFuture(){
  const today = new Date().toISOString().split("T")[0];

  futureShips.forEach(f=>{
    if(f.date <= today){
      ships.push({...f, createdAt:new Date(), concluido:false});
      addHistory(`Navio iniciado automaticamente: ${f.name}`);
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

/* CHECK */
function check(){
  ships.filter(s=>!s.concluido).forEach(notify);

  const now = new Date();
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
  addHistory("Monitor iniciado");

  await Notification.requestPermission();

  if(monitor) return;

  monitor = setInterval(()=>{
    checkFuture();
    check();
    render();
  },60000);
}

/* STOP */
function stopMonitor(){
  clearInterval(monitor);
  monitor = null;
  showToast("Monitor parado");
  addHistory("Monitor parado");
}

/* INIT */
render();
