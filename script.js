// --- 1. REGISTO DO SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('Service Worker Registado!', reg))
    .catch(err => console.error('Erro ao registar SW', err));
}

let ships = [];
let monitorInterval = null;

// --- 2. PERMISSÕES ---
async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    const permEl = document.getElementById('d-perm');
    permEl.textContent = p === 'granted' ? 'Concedida' : 'Negada';
    permEl.style.color = p === 'granted' ? '#10b981' : '#ef4444';
}

// --- 3. LÓGICA DE DISPARO (COM SERVICE WORKER) ---
function dispararAlertaNativo(titulo, corpo) {
    if (Notification.permission === 'granted') {
        // Se o Service Worker estiver ativo, enviamos a mensagem para ele disparar
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                type: 'DISPARAR_ALERTA',
                title: titulo,
                body: corpo,
                tag: 'navio-' + Date.now()
            });
        });
    }
}

function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;
    if(!name) return alert("Nome do navio é obrigatório!");
    ships.push({ name, port });
    console.log("Navio adicionado:", name);
}

function startMonitor() {
    if(ships.length === 0) return alert("Adicione um navio!");
    document.getElementById('btn-start').innerHTML = "🟢 Ativo";
    
    // Simulação de disparo para teste
    dispararAlertaNativo("Monitor Ativo", "A monitorização começou com sucesso!");
    
    // Intervalo de verificação de alarme diário (lógica simplificada)
    setInterval(() => {
        const agora = new Date();
        const horaAlarme = document.getElementById('alarm-time').value;
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                          agora.getMinutes().toString().padStart(2, '0');
        
        if (horaAtual === horaAlarme) {
            ships.forEach(s => dispararAlertaNativo(`Navio: ${s.name}`, `Saída prevista de ${s.port}`));
        }
    }, 60000); // Verifica a cada minuto
}

function testarNotificacao() {
    dispararAlertaNativo("Teste de Sistema", "O Service Worker está a funcionar!");
}
