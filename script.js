// REGISTRO DO SERVICE WORKER
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker ativo."));
}

let ships = [];
let monitorInt = null;
let lastAlarmDate = '';

// SOLICITAR PERMISSÃO
async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    updatePermDisplay();
    if(p === 'granted') {
        dispararAlerta("Monitor de Navios", "Notificações autorizadas com sucesso!");
    }
}

function updatePermDisplay() {
    const el = document.getElementById('d-perm');
    const p = Notification.permission;
    el.textContent = p === 'granted' ? '✅ Concedida' : '⚠️ Aguardando/Bloqueada';
    el.style.color = p === 'granted' ? 'var(--green)' : 'var(--accent2)';
}

// GESTÃO DE NAVIOS
function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    if(!name) return alert("Nome do navio obrigatório.");
    
    ships.push({ id: Date.now(), name, port });
    renderShips();
    document.getElementById('ship-name').value = '';
    document.getElementById('ship-port').value = '';
}

function renderShips() {
    const container = document.getElementById('ships-list');
    container.innerHTML = ships.map(s => `
        <div style="background:var(--surface2); padding:10px; border-radius:8px; margin-top:5px; font-size:12px; display:flex; justify-content:space-between;">
            <span><b>${s.name}</b> (${s.port || 'Porto não definido'})</span>
            <span style="color:var(--red); cursor:pointer" onclick="removeShip(${s.id})">×</span>
        </div>
    `).join('');
}

function removeShip(id) {
    ships = ships.filter(s => s.id !== id);
    renderShips();
}

// MONITORAMENTO
function startMonitor() {
    if(ships.length === 0) return alert("Adicione navios primeiro.");
    document.getElementById('sdot').classList.add('on');
    document.getElementById('stxt').textContent = "Monitoramento ativo (Aba pode ser fechada).";
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;

    monitorInt = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2,'0') + ":" + agora.getMinutes().toString().padStart(2,'0');
        const horaAlarme = document.getElementById('alarm-time').value;

        if(horaAtual === horaAlarme && lastAlarmDate !== agora.toDateString()) {
            ships.forEach(s => dispararAlerta(`Navio: ${s.name}`, `Local: ${s.port}`));
            lastAlarmDate = agora.toDateString();
        }
        updateCountdown();
    }, 1000);
}

function stopMonitor() {
    clearInterval(monitorInt);
    document.getElementById('sdot').classList.remove('on');
    document.getElementById('stxt').textContent = "Monitoramento pausado.";
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
}

// DISPARO NATIVO (VIA SERVICE WORKER)
function dispararAlerta(titulo, corpo) {
    // Mostra Toast na tela
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${titulo}</b><br>${corpo}`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 8000);

    // Envia para o Service Worker (Nativo)
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.active.postMessage({ type: 'ALERTA', titulo, corpo });
        });
    }
}

// INTERFACE
function setFreq(v, btn) {
    document.getElementById('freq-slider').value = v;
    document.getElementById('freq-label').textContent = `Frequência: ${v} min`;
    document.querySelectorAll('.fq').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function updateFreqLabel(v) {
    document.getElementById('freq-label').textContent = `Frequência: ${v} min`;
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

function testarNotificacao() {
    dispararAlerta("Teste do Monitor", "O alerta nativo está funcionando!");
}

window.onload = () => { updatePermDisplay(); setInterval(updateCountdown, 1000); };
