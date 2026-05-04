let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];
let historyLog = JSON.parse(localStorage.getItem("historyLog")) || [];

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

/* NOTIFICAÇÃO NATIVA */
function pushNotify(title, body){
  showToast(title);
  if("Notification" in window && Notification.permission==="granted"){
      new Notification(title,{body});
  }
}

/* --- ADIÇÃO: LÓGICA DE HISTÓRICO --- */
function addHistory(action) {
    const entry = { id: Date.now(), text: action, time: new Date().toLocaleString() };
    historyLog.unshift(entry);
    if(historyLog.length > 100) historyLog.pop(); 
    saveHistory();
}

function deleteHistoryItem(id) {
    historyLog = historyLog.filter(h => h.id !== id);
    saveHistory();
}

function clearFullHistory() {
    if(confirm("Deseja apagar todo o histórico de atividades?")) {
        historyLog = [];
        saveHistory();
    }
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if(historyLog.length === 0) {
        container.innerHTML = '<small style="color:var(--muted)">Nenhum registro encontrado.</small>';
        return;
    }
    container.innerHTML = historyLog.map(h => `
        <div class="log-entry">
            <span><small style="color:var(--accent)">[${h.time}]</small> ${h.text}</span>
            <button class="btn-danger btn-small" style="width:auto; padding:2px 6px;" onclick="deleteHistoryItem(${h.id})">✕</button>
        </div>
    `).join('');
}

function saveHistory() {
    localStorage.setItem("historyLog", JSON.stringify(historyLog));
    renderHistory();
}

/* --- LÓGICA ORIGINAL MANTIDA --- */
function updateDashboard(){
  document.getElementById('dash-active').innerText = "Ativos: " + ships.filter(s=>!s.concluido).length;
  document.getElementById('dash-future').innerText = "Futuros: " + futureShips.length;
  document.getElementById('dash-done').innerText = "Concluídos: " + ships.filter(s=>s.concluido).length;
}

function calcDplus(date){
  return Math.floor((new Date()-new Date(date))/(1000*60*60*24));
}

function renderShips(){
  updateDashboard();
  document.getElementById('ships-list').innerHTML = ships.filter(s=>!s.concluido).map(s=>{
      const d=calcDplus(s.createdAt);
      return `<div class="ship"><b>${s.name}</b> - ${s.port}<span class="badge ${d>=6?'red':d>=5?'yellow':'green'}">D+${d}</span><br><small>${s.obs||""}</small><div class="ship-actions"><button onclick="finishShip(${s.id})">✔</button><button style="background:var(--red)" onclick="removeShip(${s.id})">🗑</button></div></div>`;
  }).join('');

  document.getElementById('ships-done').innerHTML = ships.filter(s=>s.concluido).map(s=> 
      `<div class="ship"><b>${s.name}</b><br><small>${s.obs||""}</small><br><small style="color:var(--green)">Concluído: ${s.finishedAt}</small></div>`
  ).join('');
}

function renderFuture(){
  document.getElementById('future-list').innerHTML = futureShips.map(f=> 
      `<div class="ship"><b>${f.name}</b> - ${f.port}<br><small>Data: ${f.date}</small></div>`
  ).join('');
}

function addShip(){
  const name=document.getElementById("ship-name").value;
  const port=document.getElementById("ship-port").value;
  if(!name) return;
  ships.push({ id:Date.now(), name, port, obs:document.getElementById("ship-obs").value, createdAt:new Date(), concluido:false });
  addHistory(`Monitorando: ${name}`); // Registro no histórico
  pushNotify("Monitorando "+name, port);
  save();
}

function addFutureShip(){
  const name = document.getElementById('future-name').value;
  futureShips.push({ id:Date.now(), name, port:document.getElementById('future-port').value, obs:document.getElementById('future-obs').value, date:document.getElementById('future-date').value });
  addHistory(`Agendado: ${name}`); // Registro no histórico
  save();
}

function finishShip(id){
  let s=ships.find(x=>x.id==id);
  if(s){
    s.concluido=true; s.finishedAt=new Date().toLocaleString();
    addHistory(`Concluído: ${s.name}`); // Registro no histórico
    save();
  }
}

function removeShip(id){
  let s=ships.find(x=>x.id==id);
  if(s) addHistory(`Removido: ${s.name}`); // Registro no histórico
  ships=ships.filter(s=>s.id!=id);
  save();
}

function startMonitor(){
  if(monitor) return;
  if("Notification" in window) Notification.requestPermission();
  monitor=setInterval(()=>{ checkFuture(); checkTimes(); renderShips(); },1000);
  showToast("Monitoramento iniciado");
  addHistory("Sistema Iniciado"); // Registro no histórico
}

function stopMonitor(){
  clearInterval(monitor); monitor=null;
  showToast("Monitoramento parado");
  addHistory("Sistema Pausado"); // Registro no histórico
}

function checkFuture(){
  const today=new Date().toISOString().split("T")[0];
  futureShips.forEach(f=>{
    if(f.date<=today){
      ships.push({...f,createdAt:new Date(),concluido:false});
      addHistory(`Auto-Iniciado: ${f.name}`);
    }
  });
  futureShips=futureShips.filter(f=>f.date>today);
  save();
}

function checkTimes(){
  const now=new Date();
  if(now.getTime() - lastGlobalTrigger >= freq*60000){
    ships.filter(s=>!s.concluido).forEach(s=>pushNotify(s.name, s.port));
    lastGlobalTrigger=now.getTime();
  }
  if(now.toTimeString().slice(0,5)===document.getElementById("fixed-time").value && lastFixedTrigger!==now.toDateString()){
    ships.filter(s=>!s.concluido).forEach(s=>pushNotify(s.name, s.port));
    lastFixedTrigger=now.toDateString();
  }
}

function save(){
  localStorage.setItem("ships",JSON.stringify(ships));
  localStorage.setItem("futureShips",JSON.stringify(futureShips));
  renderShips(); renderFuture();
}

/* INIT */
renderShips(); renderFuture(); renderHistory();
