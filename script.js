if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("SW Ativo"));
}

let ships = [];
let monitorInterval = null;
let lastFreqExecutionTime = 0;

async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    atualizarStatus();
    if (p === "granted") {
        new Notification("🚢 Monitor de Navios", { body: "Permissão concedida!" });
    }
}

function atualizarStatus() {
    const diag = document.getElementById('diag-text');
    const btn = document.getElementById('btn-perm');
    if (Notification.permission === "granted") {
        diag.innerHTML = "✅ Notificações Ativadas.";
        btn.style.display = "none";
    }
}

function addShip() {
    const nameInput = document.getElementById('ship-name');
    const portInput = document.getElementById('ship-port');
    if (!nameInput.value) return alert("Digite o nome.");

    const dataInclusao = new Date();
    const dataAlarme = new Date();
    dataAlarme.setDate(dataInclusao.getDate() + 6); // Lógica D+6

    ships.push({
        id: Date.now(),
        name: nameInput.value.toUpperCase(),
        port: portInput.value || "Não especificado",
        targetDate: dataAlarme.toDateString(),
        displayDate: dataAlarme.toLocaleDateString()
    });

    nameInput.value = ""; portInput.value = ""; renderList();
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = ships.map(s => `
        <div class="ship-item">
            <b>${s.name}</b> - ${s.port}
            <span class="date-tag">🔔 Alerta em: ${s.displayDate}</span>
        </div>`).join('');
}

function setFreq(min, btn) {
    document.getElementById('freq-val').value = min;
    document.querySelectorAll('.fq-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
}

function startMonitor() {
    if (ships.length === 0) return alert("Adicione navios.");
    
    document.getElementById('btn-start').innerText = "🟢 MONITORANDO...";
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').style.display = "block";

    monitorInterval = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                          agora.getMinutes().toString().padStart(2, '0');
        const horaConfig = document.getElementById('alarm-time').value;

        // Verifica cada navio individualmente (Lógica D+6 no horário marcado)
        ships.forEach(s => {
            if (agora.toDateString() === s.targetDate && horaAtual === horaConfig) {
                if (!s.firedToday) {
                    dispararAlerta("PRAZO D+6 ATINGIDO", s);
                    s.firedToday = true; 
                }
            }
        });

        // Verificação por Frequência Geral
        const freqMinutos = parseInt(document.getElementById('freq-val').value);
        if (agora.getTime() - lastFreqExecutionTime >= freqMinutos * 60000) {
            if (lastFreqExecutionTime !== 0) {
                dispararAlertaNativa("VERIFICAÇÃO DE ROTINA", "O sistema continua monitorando seus prazos.");
            }
            lastFreqExecutionTime = agora.getTime();
        }
    }, 1000);
}

function stopMonitor() {
    clearInterval(monitorInterval);
    document.getElementById('btn-start').innerText = "▶ INICIAR MONITORAMENTO";
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').style.display = "none";
}

function dispararAlerta(tipo, navio) {
    const titulo = `🚢 ${tipo}`;
    const corpo = `Navio: ${navio.name}\nPorto: ${navio.port}\nPrazo de 6 dias concluído!`;
    dispararAlertaNativa(titulo, corpo);
}

function dispararAlertaNativa(titulo, corpo) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(titulo, {
                body: corpo,
                icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png",
                requireInteraction: true,
                tag: 'ship-' + Date.now()
            });
        });
    }
    showToast(titulo);
}

function showToast(msg) {
    const container = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>${msg}</b>`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 5000);
}

window.onload = atualizarStatus;
