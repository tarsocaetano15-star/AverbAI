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

/* D+ */
function calcDplus(date){
  return Math.floor((new Date()-new Date(date))/(1000*60*60*24));
}

/* RENDER */
function renderShips(){
  updateDashboard();

  document.getElementById('ships-list').innerHTML =
    ships.filter(s=>!s.concluido).map(s=>{
      const d=calcDplus(s.createdAt);
      return `
      <div class="ship">
        <b>${s.name}</b> - ${s.port}
        <span class="badge ${d>=6?'red':d>=5?'yellow':'green'}">D+${d}</span>
        <br><small>${s.obs||""}</small>
        <div class="ship-actions">
          <button onclick="finishShip(${s.id})">✔</button>
          <button onclick="removeShip(${s.id})">🗑</button>
        </div>
      </div>`;
    }).join('');

  document.getElementById('ships-done').innerHTML =
    ships.filter(s=>s.concluido).map(s=>`
      <div class="ship">
        <b>${s.name}</b>
        <br><small>${s.obs||""}</small>
        <br><small>${s.finishedAt}</small>
      </div>
    `).join('');
}

/* FUTUROS */
function renderFuture(){
  document.getElementById('future-list').innerHTML =
    futureShips.map(f=>`
      <div class="ship">
        <b>${f.name}</b> - ${f.port}
        <br><small>${f.date}</small>
      </div>
    `).join('');
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
  futureShips.push({
    id:Date.now(),
    name:futureName.value,
    port:futurePort.value,
    obs:futureObs.value,
    date:futureDate.value
  });
  save();
}

/* MOVE */
function checkFuture(){
  const today=new Date().toISOString().split("T")[0];

  futureShips.forEach(f=>{
    if(f.date<=today){
      ships.push({...f,createdAt:new Date(),concluido:false});
    }
  });

  futureShips=futureShips.filter(f=>f.date>today);
  save();
}

/* ACTIONS */
function finishShip(id){
  let s=ships.find(x=>x.id==id);
  s.concluido=true;
  s.finishedAt=new Date().toLocaleString();
  save();
}

function removeShip(id){
  ships=ships.filter(s=>s.id!=id);
  save();
}

/* ALERT */
function notifyAll(){
  ships.filter(s=>!s.concluido).forEach(s=>{
    pushNotify(s.name, s.port + " - " + (s.obs||""));
  });
}

/* CHECK */
function checkTimes(){
  const now=new Date();
  const nowMs=now.getTime();

  if(nowMs - lastGlobalTrigger >= freq*60000){
    notifyAll();
    lastGlobalTrigger=nowMs;
  }

  const current=now.toTimeString().slice(0,5);
  const fixed=document.getElementById("fixed-time").value;

  if(current===fixed && lastFixedTrigger!==now.toDateString()){
    notifyAll();
    lastFixedTrigger=now.toDateString();
  }
}

/* CONTROL */
function startMonitor(){
  if(monitor) return;

  if("Notification" in window){
    Notification.requestPermission();
  }

  monitor=setInterval(()=>{
    checkFuture();
    checkTimes();
    renderShips();
  },1000);

  showToast("Monitoramento iniciado");
}

function stopMonitor(){
  clearInterval(monitor);
  monitor=null;
  showToast("Monitoramento parado");
}

/* SAVE */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  renderShips();
  renderFuture();
}

/* INIT */
renderShips();
renderFuture();
updateDashboard();

/* =========================
   HISTÓRICO (ÚNICA ADIÇÃO)
========================= */
function addHistorico(texto){
  const h = document.getElementById("historico");
  if(!h) return;

  const item = document.createElement("div");
  item.className = "ship";

  item.innerHTML = `
    ${texto}
    <button onclick="this.parentElement.remove()">🗑</button>
  `;

  h.prepend(item);
}
