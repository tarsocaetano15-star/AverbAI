if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

let monitoredShips = [];
let lastFreqCheck = Date.now();

// Inicializa o motor de verificação global
setInterval(engine, 1000);

async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    if (p === "granted") {
        document.getElementById('btn-perm').style.display = "none";
        document.getElementById('diag-text').innerHTML = "✅ Notificações Ativas";
    }
}

function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    const time = document.getElementById('alarm-time').value;

    if (!name || !time) return alert("Preencha Nome e Horário");

    const target = new Date();
    target.setDate(target.getDate() + 6); // Regra D+6

    const newShip = {
        id: Date.now(),
        name: name.toUpperCase(),
        port: port || "Não informado",
        alarmTime: time,
        deadlineDate: target.toDateString(),
        deadlineDisplay: target.toLocaleDateString('pt-BR'),
        active: true
    };

    monitoredShips.push(newShip);
    renderList();
    showToast(`Monitoramento iniciado: ${newShip.name}`);
    
    document.getElementById('ship-name').value = "";
    document.getElementById('ship-port').value = "";
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = monitoredShips.map(s => `
        <div class="ship-card" id="card-${s.id}">
            <div class="ship-info">
                <b>NAVIO:</b> ${s.name} <br>
                <b>PORTO:</b> ${s.port}
                <span class="deadline-tag">📅 DEADLINE (D+6): ${s.deadlineDisplay} às ${s.alarmTime}</span>
            </div>
            <div class="btn-row">
                <button class="btn-stop" onclick="removeShip(${s.id})">PARAR MONITORAMENTO</button>
                <button class="btn-done" onclick="removeShip(${s.id}, true)">CONCLUIR</button>
            </div>
        </div>
    `).join('');
}

function removeShip(id, isDone = false) {
    monitoredShips = monitoredShips.filter(s => s.id !== id);
    renderList();
    showToast(isDone ? "Monitoramento Concluído!" : "Monitoramento Removido");
}

function setFreq(min, btn) {
    document.getElementById('freq-val').value = min;
    document.querySelectorAll('.fq-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

// Motor de busca e alerta
function engine() {
    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + agora.getMinutes().toString().padStart(2, '0');

    // 1. Verificação de Alertas Individuais (D+6)
    monitoredShips.forEach(s => {
        if (s.active && agora.toDateString() === s.deadlineDate && horaAtual === s.alarmTime) {
            enviarNotificacao(`⚠️ DEADLINE ATINGIDO`, `Navio: ${s.name} - Prazo D+6 encerrado.`);
            s.active = false; // Desativa para não repetir no mesmo minuto
        }
    });

    // 2. Verificação de Frequência do Sistema (Manter SW vivo)
    const freqMin = parseInt(document.getElementById('freq-val').value);
    if (agora.getTime() - lastFreqCheck >= freqMin * 60000) {
        lastFreqCheck = agora.getTime();
        if (monitoredShips.length > 0) {
            enviarNotificacao("Monitor Ativo", `${monitoredShips.length} navio(s) em observação.`);
        }
    }
}

function enviarNotificacao(titulo, corpo) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(titulo, {
                body: corpo,
                icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png",
                requireInteraction: true,
                tag: 'ship-alert'
            });
        });
    }
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 4000);
}
