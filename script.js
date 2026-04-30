if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("SW Ativo."));
}

let ships = [];
let monitorInt = null;
let lastAlarmDate = '';

async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    updateDiag();
    if(p === 'granted') dispararAlerta("Monitor Ativado", "Notificações autorizadas!");
}

function updateDiag() {
    const el = document.getElementById('d-perm');
    el.textContent = Notification.permission === 'granted' ? '✅ Concedida' : '⚠️ Pendente';
    el.style.color = Notification.permission === 'granted' ? 'var(--green)' : 'var(--accent2)';
}

function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    const type = document.getElementById('ship-port-type').value;
    if(!name) return;
    ships.push({ id: Date.now(), name, port, type });
    addLog(`Adicionado: ${name}`);
    renderShips();
    document.getElementById('ship-name').value = '';
}

function renderShips() {
    const container = document.getElementById('ships-list');
    container.innerHTML = ships.map(s => `
        <div style="background:var(--surface2); padding:8px; border-radius:6px; margin-top:5px; font-size:12px; display:flex; justify-content:space-between;">
            <span><b>${s.name}</b> (${s.port})</span>
            <span style="color:var(--red); cursor:pointer" onclick="removeShip(${s.id})">×</span>
        </div>`).join('');
}

function removeShip(id) {
    ships = ships.filter(s => s.id !== id);
    renderShips();
}

function startMonitor() {
    if(!ships.length) return alert("Adicione navios!");
    document.getElementById('sdot').classList.add('on');
    document.getElementById('stxt').textContent = "Monitoramento Ativo";
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    addLog("Iniciado.");

    monitorInt = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2,'0') + ":" + agora.getMinutes().toString().padStart(2,'0');
        const horaAlarme = document.getElementById('alarm-time').value;

        if(horaAtual === horaAlarme && lastAlarmDate !== agora.toDateString()) {
            ships.forEach(s => dispararAlerta(`Alerta: ${s.name}`, `Verificar em ${s.port}`));
            lastAlarmDate = agora.toDateString();
            addLog("Alarme disparado.");
        }
        updateCountdown();
    }, 1000);
}

function stopMonitor() {
    clearInterval(monitorInt);
    document.getElementById('sdot').classList.remove('on');
    document.getElementById('stxt').textContent = "Inativo";
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
}

function dispararAlerta(titulo, corpo) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${titulo}</b><br>${corpo}`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 8000);

    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.active.postMessage({ type: 'ALERTA', titulo, corpo });
        });
    }
}

function setFreq(v, btn) {
    document.getElementById('freq-slider').value = v;
    document.getElementById('freq-label').textContent = `Frequência: ${v} min`;
    document.querySelectorAll('.fq').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function updateCountdown() {
    const time = document.getElementById('alarm-time').value;
    const now = new Date();
    const t = new Date();
    const [h, m] = time.split(':');
    t.setHours(h, m, 0);
    if(t <= now) t.setDate(t.getDate() + 1);
    const diff = t - now;
    const hh = Math.floor(diff/3600000).toString().padStart(2,'0');
    const mm = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
    const ss = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
    document.getElementById('timer-display').textContent = `${hh}:${mm}:${ss}`;
}

function addLog(msg) {
    const container = document.getElementById('log-container');
    const item = document.createElement('div');
    item.className = 'log-item';
    item.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
    container.prepend(item);
}

function testarTudo() { dispararAlerta("Teste", "Funcionando!"); }
window.onload = () => { updateDiag(); setInterval(updateCountdown, 1000); };
