let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];

let monitor = null;

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
function pushNotify(title){
  showToast("🚢 " + title);
}

/* DASH */
function updateDashboard(){
  document.getElementById('dash-active').innerText = "Ativos: " + ships.filter(s=>!s.concluido).length;
  document.getElementById('dash-future').innerText = "Futuros: " + futureShips.length;
  document.getElementById('dash-done').innerText = "Concluídos: " + ships.filter(s=>s.concluido).length;
}

/* RENDER SIMPLES (GARANTIDO FUNCIONAR) */
function render(){
  updateDashboard();

  document.getElementById("ships-list").innerHTML =
    ships.filter(s=>!s.concluido).map(s=>`
      <div class="ship">
        <b>${s.name}</b> - ${s.port}
      </div>
    `).join("");

  document.getElementById("ships-done").innerHTML =
    ships.filter(s=>s.concluido).map(s=>`
      <div class="ship">
        <b>${s.name}</b>
      </div>
    `).join("");

  document.getElementById("future-list").innerHTML =
    futureShips.map(f=>`
      <div class="ship">
        <b>${f.name}</b>
      </div>
    `).join("");
}

/* ADD */
function addShip(){
  const name=document.getElementById("ship-name").value;
  const port=document.getElementById("ship-port").value;
  const obs=document.getElementById("ship-obs").value;

  ships.push({
    id:Date.now(),
    name,port,obs,
    concluido:false
  });

  pushNotify("Monitorando "+name);
  addHistorico("Navio " + name + " entrou em monitoramento");
  save();
}

function addFutureShip(){
  futureShips.push({
    id:Date.now(),
    name:document.getElementById("future-name").value,
    port:document.getElementById("future-port").value,
    obs:document.getElementById("future-obs").value,
    date:document.getElementById("future-date").value
  });

  save();
}

/* SAVE */
function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  render();
}

/* HISTÓRICO (ISOLADO E SEGURO) */
function addHistorico(texto){
  const h = document.getElementById("historico");
  if(!h) return;

  const item = document.createElement("div");
  item.className = "ship";

  const btn = document.createElement("button");
  btn.innerText = "🗑";
  btn.onclick = () => item.remove();

  item.innerText = texto + " ";
  item.appendChild(btn);

  h.prepend(item);
}

/* INIT */
render();
