// REGISTRO DO SERVICE WORKER (Essencial para GitHub Pages)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
        console.log('Service Worker ativo!');
    }).catch(err => console.log('Erro ao registrar SW:', err));
}

let monitoredShips = [];
let lastFreqCheck = Date.now();

// Motor de verificação (Roda sempre que o site estiver aberto)
setInterval(monitorEngine, 1000);

async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    if (p === "granted") {
        document.getElementById('diag-text').innerHTML = "✅ Notificações Ativas";
        document.getElementById('btn-perm').style.display = "none";
        dispararAlertaNativa("Sistema Pronto", "As notificações aparecerão fora do navegador.");
    }
}

function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    const alarm = document.getElementById('alarm-time').value;

    if (!name || !alarm) return alert("Preencha Nome e Horário!");

    const target = new Date();
    target.setDate(target.getDate() + 6); // Lógica D+6

    const ship = {
        id: Date.now(),
        name: name.toUpperCase(),
        port: port || "Não informado",
        alarmTime: alarm,
        targetDate: target.toDateString(),
        displayDate: target.toLocaleDateString('pt-BR'),
        active: true
    };

    monitoredShips.push(ship);
    renderList();
    dispararAlertaNativa("Monitoramento Iniciado", `Navio ${ship.name} agendado para ${ship.displayDate}`);
    
    document.getElementById('ship-name').value = "";
    document.getElementById('ship-port').value = "";
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = monitoredShips.map(s => `
      <div class="ship-monitor-card">
        <b>NAVIO: ${s.name}</b><br>
        <small>PORTO: ${s.port}</small>
        <span class="deadline-info">🔔 ALERTA EM: ${s.displayDate} às ${s.alarmTime}</span>
        <button class="btn-stop" onclick="removeShip(${s.id})">PARAR MONITORAMENTO</button>
      </div>
    `).join('');
}

function removeShip(id) {
    monitoredShips = monitoredShips.filter(s => s.id !== id);
    renderList();
}

function setFreq(min, btn) {
    document.getElementById('freq-val').value = min;
    // Feedback visual dos botões
    document.querySelectorAll('.fq-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function monitorEngine() {
    const agora = new Date();
    const horaAgora = agora.getHours().toString().padStart(2, '0') + ":" + agora.getMinutes().toString().padStart(2, '0');

    // 1. Verificar prazos individuais
    monitoredShips.forEach(s => {
        if (s.active && agora.toDateString() === s.targetDate && horaAgora === s.alarmTime) {
            dispararAlertaNativa(`🚢 PRAZO ATINGIDO: ${s.name}`, `O prazo D+6 para ${s.port} venceu.`);
            s.active = false; 
        }
    });

    // 2. Verificação de Frequência Global
    const fMin = parseInt(document.getElementById('freq-val').value);
    if (agora.getTime() - lastFreqCheck >= fMin * 60000) {
        lastFreqCheck = agora.getTime();
        if (monitoredShips.length > 0) {
            dispararAlertaNativa("Monitor Ativo", `Acompanhando ${monitoredShips.length} navios.`);
        }
    }
}

function dispararAlertaNativa(titulo, corpo) {
    // Toast Interno
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${titulo}</b><br>${corpo}`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 6000);

    // Notificação de Sistema (Para fora da aba)
    if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ALERTA_SISTEMA',
            titulo: titulo,
            corpo: corpo
        });
    } else if (Notification.permission === 'granted') {
        // Fallback caso o SW ainda não tenha assumido o controle total
        new Notification(titulo, { body: corpo, requireInteraction: true });
    }
}
