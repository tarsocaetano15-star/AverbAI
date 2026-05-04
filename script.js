let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let freq = 1440;
let monitor = null;

let lastGlobalTrigger = 0;
let lastFixedTrigger = "";

/* TOAST */
function showToast(msg){
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className="toast";
  t.innerText = msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

/* PUSH */
function pushNotify(title, body){
  showToast("🚢 " + title);

  if("Notification" in window){
    if(Notification.permission==="granted"){
      new Notification(title,{body});
    }
  }
}

/* DASH */
function updateDashboard(){
  document.getElementById('dash-active').innerText = "Ativos: " + ships.filter(s=>!s.concluido).length;
  document.getElementById('dash-future').innerText = "Futuros: " + futureShips.length;
  document.getElementById('dash-done').innerText = "Concluídos: " + ships.filter(s=>s.concluido).length;
}

/* ADD */
function addShip(){
  const name=document.getElementById("ship-name").value;
  const port=document.getElementById("ship-port").value;
  const obs=document.getElementById("ship-obs").value;

  ships.push({
    id:Date.now(),
    name,port,obs,
    createdAt:new Date(),
    concluido:false
  });

  pushNotify("Monitorando "+name, port);
  save();
}

function addFutureShip(){
  const futureName=document.getElementById("future-name").value;
  const futurePort=document.getElementById("future-port").value;
  const futureObs=document.getElementById("future-obs").value;
  const futureDate=document.getElementById("future-date").value;

  futureShips.push({
    id:Date.now(),
    name:futureName,
    port:futurePort,
    obs:futureObs,
    date:futureDate
  });

  save();
}

/* SAVE */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
}

/* =========================
   🔥 HISTÓRICO (SOMENTE ADIÇÃO)
========================= */

function addHistorico(texto){
  const h = document.getElementById("historico");
  if(!h) return;

  const item = document.createElement("div");
  item.className = "ship";
  item.innerHTML = texto + " <button onclick='this.parentElement.remove()'>🗑</button>";
  h.prepend(item);
}

/* CHAMADA SIMPLES SEM INTERFERIR NO SISTEMA */
const _originalAddShip = addShip;

addShip = function(){
  _originalAddShip();

  const name = document.getElementById("ship-name").value;
  addHistorico("Navio " + name + " entrou em monitoramento");
};
