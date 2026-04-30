let ships = [];
let monitorInterval = null;
let lastFixedAlarmDate = '';
let lastFreqExecutionTime = 0;

// Notificações Nativas
async function solicitarPermissao() {
    if (!("Notification" in window)) return alert("Navegador não suporta notificações.");
    const p = await Notification.requestPermission();
    atualizarStatus();
}

function atualizarStatus() {
    const diag = document.getElementById('diag-text');
    const btn = document.getElementById('btn-perm');
    if (Notification.permission === "granted") {
        diag.innerHTML = "✅ Notificações Ativadas.";
        btn.style.display = "none";
    }
}

// Lógica de Navios
function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    if (!name) return;
    ships.push({ id: Date.now(), name, port });
    renderList();
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = ships.map(s => `
        <div style="background:var(--surface2); padding:10px; margin-top:5px; border-radius:8px;">
            <b>${s.name}</b> - ${s.port}
        </div>`).join('');
}

// Motor de Monitoramento
function startMonitor() {
    if (ships.length === 0) return alert("Adicione navios!");
    document.getElementById('btn-start').innerText = "🟢 MONITORANDO...";
    
    monitorInterval = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + agora.getMinutes().toString().padStart(2, '0');
        
        // Alarme Fixo
        const horaFixa = document.getElementById('alarm-time').value;
        if (horaAtual === horaFixa && lastFixedAlarmDate !== agora.toDateString()) {
            dispararAlerta("ALERTA AGENDADO");
            lastFixedAlarmDate = agora.toDateString();
        }

        // Frequência (Slider)
        const freqMinutos = parseInt(document.getElementById('freq-slider').value);
        if (agora.getTime() - lastFreqExecutionTime >= freqMinutos * 60000) {
            if (lastFreqExecutionTime !== 0) dispararAlerta("VERIFICAÇÃO PERIÓDICA");
            lastFreqExecutionTime = agora.getTime();
        }
    }, 1000);
}

function dispararAlerta(tipo) {
    ships.forEach(s => {
        if (Notification.permission === "granted") {
            new Notification(`🚢 ${tipo}`, { 
                body: `${s.name} no porto ${s.port}`,
                requireInteraction: true 
            });
        }
    });
}

function updateSliderLabel(val) {
    document.getElementById('slider-label').innerText = `Frequência: ${val} minutos`;
}
