let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let monitor = null;
let freq = 1440;
let lastTrigger = 0;
let lastFixed = "";

/* ADD NAVIO */
function addShip(){

  const name = document.getElementById("shipName").value.trim();
  const port = document.getElementById("shipPort").value.trim();
  const obs = document.getElementById("shipObs").value.trim();

  if(!name){
    alert("Digite o nome");
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

  clearInputs();
  save();
}

/* ADD FUTURO */
function addFutureShip(){

  const name = document.getElementById("futureName").value.trim();
  const port = document.getElementById("futurePort").value.trim();
  const obs = document.getElementById("futureObs").value.trim();
  const date = document.getElementById("futureDate").value;

  if(!name || !date){
    alert("Nome e data obrigatórios");
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

/* RENDER */
function render(){

  // ativos
  const ativos = ships.filter(s=>!s.concluido);

  document.getElementById("ships-list").innerHTML = ativos.map(s=>`
    <div class="ship">
      <b>${s.name}</b> - ${s.port}
      <br><small>${s.obs||""}</small>

      <div class="ship-actions">
        <button onclick="finishShip(${s.id})">✔</button>
        <button onclick="removeShip(${s.id})">🗑</button>
      </div>
    </div>
  `).join('') || "Nenhum ativo";

  // concluídos
  document.getElementById("ships-done").innerHTML = ships.filter(s=>s.concluido).map(s=>`
    <div class="ship" style="opacity:0.5">
      ${s.name}
      <br><small>${s.finishedAt}</small>
    </div>
  `).join('');

  // futuros
  document.getElementById("future-list").innerHTML = futureShips.map(f=>`
    <div class="ship">
      ${f.name} - ${f.date}
    </div>
  `).join('');
}

/* SALVAR */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  render();
}

/* LIMPAR INPUT */
function clearInputs(){
  shipName.value="";
  shipPort.value="";
  shipObs.value="";
}

/* AÇÕES */
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

/* FUTURO → ATIVO */
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
function notify(s){
  if(Notification.permission==="granted"){
    new Notification(s.name,{body:s.obs||""});
  }
}

/* FREQUÊNCIA */
function setFrequency(v){
  freq = parseInt(v);
}

/* CHECK */
function check(){

  const now = Date.now();

  // frequência
  if(now - lastTrigger >= freq*60000){
    ships.filter(s=>!s.concluido).forEach(notify);
    lastTrigger = now;
  }

  // horário fixo
  const current = new Date().toTimeString().slice(0,5);
  const fixed = document.getElementById("fixed-time").value;

  if(current===fixed && lastFixed !== new Date().toDateString()){
    ships.filter(s=>!s.concluido).forEach(notify);
    lastFixed = new Date().toDateString();
  }
}

/* CONTROLE */
function startMonitor(){

  if(monitor) return;

  Notification.requestPermission();

  monitor = setInterval(()=>{
    checkFuture();
    check();
  },1000);

  alert("Monitor iniciado");
}

function stopMonitor(){
  clearInterval(monitor);
  monitor = null;
  alert("Monitor parado");
}

/* INIT */
render();
