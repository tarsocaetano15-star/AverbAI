let ships = JSON.parse(localStorage.getItem("ships")) || [];
let futureShips = JSON.parse(localStorage.getItem("futureShips")) || [];
let historyLog = JSON.parse(localStorage.getItem("historyLog")) || [];
let isMonitoring = localStorage.getItem("isMonitoring") === "true";

let freq = 1440;
let monitor = null;
let lastGlobalTrigger = 0;
let lastFixedTrigger = "";

window.onload = () => {
    // Configura data atual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('ship-date-input').value = today;
    
    renderShips(); 
    renderFuture(); 
    renderHistory();

    // AUTO-INÍCIO
    if (isMonitoring) {
        startMonitor(true);
    }
};

/* --- ALERTA VISUAL (TOAST) --- */
function showToast(msg){
  const c = document.getElementById("toast-container");
  if(!c) return; // Evita erro se o elemento não existir
  const t = document.createElement("div");
  t.className="toast";
  t.innerHTML = `<b>🚢 Aviso:</b> ${msg}`;
  c.appendChild(t);
  setTimeout(()=>t.remove(), 6000); // Toast fica por 6 segundos
}

/* --- ALERTA NATIVO (POP-UP) --- */
function pushNotify(title, body){
  showToast(title + ": " + body); // Mostra o toast sempre

  if("Notification" in window){
    if(Notification.permission === "granted"){
      new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png" });
    }
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
    if(!container) return;
    if(historyLog.length === 0) {
        container.innerHTML = '<small style="color:var(--muted)">Vazio</small>';
        return;
    }
    container.innerHTML = historyLog.map(h => `
        <div class="log-entry">
            <span><small style="color:var(--accent)">[${h.time.split(', ')[1]}]</small> ${h.text}</span>
            <button class="btn-danger btn-small" onclick="deleteHistoryItem(${h.id})">✕</button>
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
  const diff = new Date() - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calcDplus6(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + 6);
    return d.toLocaleDateString('pt-BR');
}

function renderShips(){
  updateDashboard();
  
  document.getElementById('ships-list').innerHTML = ships.filter(s=>!s.concluido).map(s=>{
      const d = calcDplus(s.createdAt);
      return `
      <div class="ship">
        <b>${s.name}</b> - ${s.port}
        <span class="badge ${d>=6?'red':d>=5?'yellow':'green'}">D+${d}</span>
        <br><small>${s.obs||""}</small>
        <br><small style="color:var(--yellow); font-size:10px;">📅 LIMITE (D+6): ${calcDplus6(s.rawDate)}</small>
        <div class="ship-actions">
          <button onclick="finishShip(${s.id})">✔</button>
          <button style="background:var(--red)" onclick="removeShip(${s.id})">🗑</button>
        </div>
      </div>`;
  }).join('');

  document.getElementById('ships-done').innerHTML = ships.filter(s=>s.concluido).map(s=> 
      `<div class="ship">
        <b>${s.name}</b>
        <div class="ship-actions">
            <button style="background:var(--red)" class="btn-small" onclick="removeShip(${s.id})">🗑</button>
        </div>
        <br><small>${s.obs||""}</small>
        <br><small style="color:var(--green)">Concluído em: ${s.finishedAt}</small>
      </div>`
  ).join('');
}

function renderFuture(){
  document.getElementById('future-list').innerHTML = futureShips.map(f=> 
      `<div class="ship"><b>${f.name}</b> - ${f.port}<br><small>Alvo: ${f.date}</small>
       <div class="ship-actions"><button style="background:var(--red)" onclick="removeFuture(${f.id})">🗑</button></div></div>`
  ).join('');
}

/* --- AÇÕES --- */
function addShip(){
  const nameInput = document.getElementById("ship-name");
  const portInput = document.getElementById("ship-port");
  const obsInput = document.getElementById("ship-obs");
  const dateInput = document.getElementById("ship-date-input");

  if(!nameInput.value || !dateInput.value) return alert("Preencha Nome e Data!");

  ships.push({ 
    id: Date.now(), 
    name: nameInput.value, 
    port: portInput.value, 
    obs: obsInput.value, 
    createdAt: new Date(dateInput.value + "T00:00:00"), 
    rawDate: dateInput.value,
    concluido: false 
  });

  addHistory(`Monitorando: ${nameInput.value}`);
  save();
  nameInput.value = ""; portInput.value = ""; obsInput.value = "";
}

function addFutureShip(){
  const name = document.getElementById('future-name').value;
  const date = document.getElementById('future-date').value;
  if(!name || !date) return alert("Preencha Nome e Data!");
  futureShips.push({ id:Date.now(), name, port:document.getElementById('future-port').value, obs:document.getElementById('future-obs').value, date:date });
  addHistory(`Agendado: ${name}`);
  save();
  document.getElementById('future-name').value = "";
  document.getElementById('future-date').value = "";
}

function finishShip(id){
  let s = ships.find(x => x.id == id);
  if(s){
    s.concluido = true; 
    s.finishedAt = new Date().toLocaleString();
    addHistory(`Concluído: ${s.name}`);
    save();
  }
}

function removeShip(id){
  ships = ships.filter(s => s.id != id);
  save();
}

function removeFuture(id){
  futureShips = futureShips.filter(f => f.id != id);
  save();
}

function clearAllDone() {
    if(confirm("Apagar todos os concluídos?")) {
        ships = ships.filter(s => !s.concluido);
        save();
    }
}

/* --- CONTROLE DO MONITORAMENTO --- */
function startMonitor(isAuto = false){
  if(monitor) return;
  
  if("Notification" in window){
      Notification.requestPermission().then(permission => {
          if(permission === "granted" && !isAuto) showToast("Notificações Autorizadas!");
      });
  }
  
  monitor = setInterval(() => { 
      checkFuture(); 
      checkTimes(); 
      renderShips(); 
  }, 1000);
  
  localStorage.setItem("isMonitoring", "true");
  
  const btn = document.getElementById("btn-master-start");
  if(btn){
      btn.innerHTML = "🟢 MONITORANDO...";
      btn.style.background = "#10b981";
  }

  if(!isAuto) {
      showToast("Monitoramento Iniciado e Ativo!");
      addHistory("Sistema Iniciado");
  }
}

function stopMonitor(){
  clearInterval(monitor); 
  monitor = null;
  localStorage.setItem("isMonitoring", "false");
  
  const btn = document.getElementById("btn-master-start");
  if(btn){
      btn.innerHTML = "▶ Iniciar";
      btn.style.background = "var(--accent)";
  }
  
  showToast("Monitoramento Pausado.");
  addHistory("Sistema Pausado");
}

function checkFuture(){
  const today = new Date().toISOString().split("T")[0];
  futureShips.forEach(f => {
    if(f.date <= today){
      ships.push({...f, createdAt: new Date(f.date + "T00:00:00"), rawDate: f.date, concluido: false});
      addHistory(`Auto-Iniciado: ${f.name}`);
    }
  });
  futureShips = futureShips.filter(f => f.date > today);
  save();
}

function setFrequency(val) {
    freq = parseInt(val);
    showToast(`Intervalo de alerta: ${val} min`);
}

function checkTimes(){
  const now = new Date();
  // Alerta por frequência
  if(now.getTime() - lastGlobalTrigger >= freq*60000){
    const active = ships.filter(s=>!s.concluido);
    if(active.length > 0) pushNotify("Monitoramento Ativo", `${active.length} navios em aberto.`);
    lastGlobalTrigger = now.getTime();
  }
  // Alerta fixo
  const currentHour = now.toTimeString().slice(0,5);
  const fixedHour = document.getElementById("fixed-time").value;
  if(currentHour === fixedHour && lastFixedTrigger !== now.toDateString()){
    const active = ships.filter(s=>!s.concluido);
    if(active.length > 0) pushNotify("ALERTA DIÁRIO", `Existem ${active.length} navios ativos para revisão.`);
    lastFixedTrigger = now.toDateString();
  }
}

function save(){
  localStorage.setItem("ships", JSON.stringify(ships));
  localStorage.setItem("futureShips", JSON.stringify(futureShips));
  renderShips(); renderFuture();
}
