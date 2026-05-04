let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];
let historyLog = JSON.parse(localStorage.getItem("historyLog")) || [];

let freq = 1440;
let monitor = null;
let lastGlobalTrigger = 0;
let lastFixedTrigger = "";

function showToast(msg){
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className="toast";
  t.innerText = msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(),4000);
}

function pushNotify(title, body){
  showToast(title);
  if("Notification" in window && Notification.permission==="granted"){
      new Notification(title,{body});
  }
}

/* --- HISTÓRICO --- */
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
    if(confirm("Deseja apagar todo o histórico?")) {
        historyLog = [];
        saveHistory();
    }
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if(historyLog.length === 0) {
        container.innerHTML = '<small style="color:var(--muted)">Vazio</small>';
        return;
    }
    container.innerHTML = historyLog.map(h => `
        <div class="log-entry">
            <span><small style="color:var(--accent)">[${h.time.split(', ')[1]}]</small> ${h.text}</span>
            <button class="btn-danger btn-small" style="width:auto; padding:2px 6px;" onclick="deleteHistoryItem(${h.id})">✕</button>
        </div>
    `).join('');
}

function saveHistory() {
    localStorage.setItem("historyLog", JSON.stringify(historyLog));
    renderHistory();
}

/* --- DASHBOARD E RENDER --- */
function updateDashboard(){
  document.getElementById('dash-active').innerText = "Ativos: " + ships.filter(s=>!s.concluido).length;
  document.getElementById('dash-future').innerText = "Futuros: " + futureShips.length;
  document.getElementById('dash-done').innerText = "Concluídos: " + ships.filter(s=>s.concluido).length;
}

function calcDplus(date){
  return Math.floor((new Date()-new Date(date))/(1000*60*60*24));
}

// Função para calcular D+6 a partir de uma data específica
function calcDplus6(dateStr) {
    const finishDate = new Date(dateStr);
    const targetDate = new Date(finishDate);
    targetDate.setDate(finishDate.getDate() + 6);
    return targetDate.toLocaleDateString('pt-BR');
}

function renderShips(){
  updateDashboard();
  
  // Monitorando
  document.getElementById('ships-list').innerHTML = ships.filter(s=>!s.concluido).map(s=>{
      const d=calcDplus(s.createdAt);
      return `<div class="ship"><b>${s.name}</b> - ${s.port}<span class="badge ${d>=6?'red':d>=5?'yellow':'green'}">D+${d}</span><br><small>${s.obs||""}</small><div class="ship-actions"><button onclick="finishShip(${s.id})">✔</button><button style="background:var(--red)" onclick="removeShip(${s.id})">🗑</button></div></div>`;
  }).join('');

  // Concluídos (Com lógica D+6)
  document.getElementById('ships-done').innerHTML = ships.filter(s=>s.concluido).map(s=> 
      `<div class="ship">
        <b>${s.name}</b>
        <div class="ship-actions">
            <button style="background:var(--red)" class="btn-small" onclick="removeShip(${s.id})">🗑</button>
        </div>
        <br><small>${s.obs||""}</small>
        <br><small style="color:var(--muted)">Concluído em: ${s.finishedAt.split(' ')[0]}</small>
        <br><b style="color:var(--yellow); font-size: 11px;">PROX. ALERTA (D+6): ${calcDplus6(s.finishedAtDate)}</b>
      </div>`
  ).join('');
}

function renderFuture(){
  document.getElementById('future-list').innerHTML = futureShips.map(f=> 
      `<div class="ship"><b>${f.name}</b> - ${f.port}<br><small>Data Alvo: ${f.date}</small>
       <div class="ship-actions"><button style="background:var(--red)" onclick="removeFuture(${f.id})">🗑</button></div></div>`
  ).join('');
}

/* --- AÇÕES --- */
function addShip(){
  const name=document.getElementById("ship-name").value;
  const port=document.getElementById("ship-port").value;
  if(!name) return;
  ships.push({ id:Date.now(), name, port, obs:document.getElementById("ship-obs").value, createdAt:new Date(), concluido:false });
  addHistory(`Monitorando: ${name}`);
  save();
  document.getElementById("ship-name").value = "";
  document.getElementById("ship-port").value = "";
  document.getElementById("ship-obs").value = "";
}

function addFutureShip(){
  const name = document.getElementById('future-name').value;
  const date = document.getElementById('future-date').value;
  if(!name || !date) return;
  futureShips.push({ id:Date.now(), name, port:document.getElementById('future-port').value, obs:document.getElementById('future-obs').value, date:date });
  addHistory(`Agendado: ${name}`);
  save();
  document.getElementById('future-name').value = "";
  document.getElementById('future-date').value = "";
}

function finishShip(id){
  let s=ships.find(x=>x.id==id);
  if(s){
    const now = new Date();
    s.concluido=true; 
    s.finishedAt=now.toLocaleString();
    s.finishedAtDate = now.toISOString(); // Data ISO para cálculo preciso
    addHistory(`Concluído: ${s.name}`);
    save();
  }
}

function removeShip(id){
  ships=ships.filter(s=>s.id!=id);
  save();
}

function removeFuture(id){
  futureShips=futureShips.filter(f=>f.id!=id);
  save();
}

function clearAllDone() {
    if(confirm("Excluir permanentemente todos os concluídos?")) {
        ships = ships.filter(s => !s.concluido);
        addHistory("Limpeza de concluídos realizada");
        save();
    }
}

function startMonitor(){
  if(monitor) return;
  if("Notification" in window) Notification.requestPermission();
  monitor=setInterval(()=>{ checkFuture(); checkTimes(); renderShips(); },1000);
  showToast("Iniciado");
}

function stopMonitor(){
  clearInterval(monitor); monitor=null;
  showToast("Parado");
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

renderShips(); renderFuture(); renderHistory();
