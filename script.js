// REGISTRO DO SERVICE WORKER (Para funcionar com aba fechada)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("SW Ativo."));
}

let ships = [];
let monitorInt = null;
let lastAlarmDate = '';

// PERMISSÕES
async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    updateDiag();
    if(p === 'granted') {
        dispararAlerta("Monitor Ativado", "As notificações nativas estão prontas.");
    }
}

function updateDiag() {
    const el = document.getElementById('d-perm');
    const p = Notification.permission;
    el.textContent = p === 'granted' ? '✅ Concedida' : '⚠️ Pendente';
    el.style.color = p === 'granted' ? 'var(--green)' : 'var(--accent2)';
}

// NAVIOS
function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    const type = document.getElementById('ship-port-type').value;
    
    if(!name) return alert("Digite o nome do navio.");
    
    const navio = { id: Date.now(), name, port, type };
    ships.push(navio);
    addLog(`Navio Adicionado: ${name}`);
    renderShips();
    
    document.getElementById('ship-name').value = '';
    document.getElementById('ship-port').value = '';
}

function renderShips() {
    const container = document.getElementById('ships-list');
    container.innerHTML = ships.map(s => `
        <div style="background:var(--surface2); padding:8px; border-radius:6px; margin-top:5px; font-size:12px; display:flex; justify-content:space-between;">
            <span><b>${s.name}</b> (${s.type === 'origin' ? 'Origem' : 'Destino'}: ${s.port || '?'})</span>
            <span style="color:var(--red); cursor:pointer" onclick="removeShip(${s.id})">Remover</span>
        </div>
    `).join('');
}

function removeShip(id) {
    ships = ships.filter(s => s.id !== id);
    renderShips();
    addLog("Navio removido.");
}

// MONITORAMENTO
function startMonitor() {
    if(ships.length === 0) return alert("Adicione navios para iniciar.");
    
    document.getElementById('sdot').classList.add('on');
    document.getElementById('stxt').textContent = "Monitoramento Ativo";
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    addLog("Monitoramento Iniciado.");

    monitorInt = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2,'0') + ":" + agora.getMinutes().toString().padStart(2,'0');
        const horaAlarme = document.getElementById('alarm-time').value;

        // Verifica Alarme Fixo
        if(horaAtual === horaAlarme && lastAlarmDate !== agora.toDateString()) {
            ships.forEach(s => dispararAlerta(`Alerta de Navio: ${s.name}`, `Verificar ${s.type === 'origin' ? 'Saída' : 'Chegada'} em ${s.port}`));
            lastAlarmDate = agora.toDateString();
            addLog("Alarme diário disparado.");
        }
        updateCountdown();
    }, 1000);
}

function stopMonitor() {
    clearInterval(monitorInt);
    document.getElementById('sdot').classList.remove('on');
    document.getElementById('stxt').textContent = "Monitoramento Inativo";
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    addLog("Monitoramento Parado.");
}

// DISPARO E NOTIFICAÇÕES
function dispararAlerta(titulo, corpo) {
    // Toast na página
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${titulo}</b><br>${corpo}`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 8000);

    // Notificação Nativa (Via SW)
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.active.postMessage({ type: 'ALERTA', titulo, corpo });
        });
    }
}

// UTILITÁRIOS
function setFreq(v, btn) {
    document.getElementById('freq-slider').value = v;
    updateFreqLabel(v);
    document.querySelectorAll('.fq').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function updateFreqLabel(v) {
    let txt = v + " min";
    if(v >= 60 && v < 1440) txt = Math.floor(v/60) + " hora(s)";
    if(v == 1440) txt = "1× ao dia";
    document.getElementById('freq-label').textContent = `Frequência: ${txt}`;
}

function updateCountdown() {
    const time = document.getElementById('alarm-time').value;
    const now = new Date();
    const target = new Date();
    const [h, m] = time.split(':');
    target.setHours(h, m, 0);
    if(target <= now) target.setDate(target.getDate() + 1);
    
    const diff = target - now;
    const hh = Math.floor(diff/3600000).toString().padStart(2,'0');
    const mm = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
    const ss = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
    document.getElementById('timer-display').textContent = `${hh}:${mm}:${ss}`;
}

function addLog(msg) {
    const container = document.getElementById('log-container');
    const now = new Date().toLocaleTimeString('pt-BR');
    const item = document.createElement('div');
    item.className = 'log-item';
    item.textContent = `${now} - ${msg}`;
    container.prepend(item);
}

function testarTudo() {
    dispararAlerta("Teste Geral", "Verificando Toasts e Notificações do Sistema.");
    addLog("Teste geral executado.");
}

function testarNotificacao() {
    dispararAlerta("Teste Único", "Apenas uma notificação de teste.");
}

window.onload = () => { updateDiag(); setInterval(updateCountdown, 1000); };
