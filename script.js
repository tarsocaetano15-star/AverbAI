// 1. Registo do Service Worker (Essencial para aba fechada)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log("Operário de segundo plano pronto!");
    });
}

let ships = [];

async function solicitarPermissao() {
    const p = await Notification.requestPermission();
    document.getElementById('p-status').textContent = p === 'granted' ? '✔ Concedida' : '✖ Negada';
    document.getElementById('p-status').style.color = p === 'granted' ? '#10b981' : '#ef4444';
}

function addShip() {
    const name = document.getElementById('ship-name').value;
    if (name) {
        ships.push(name);
        document.getElementById('list').innerHTML = ships.join(', ');
        document.getElementById('ship-name').value = '';
    }
}

function startMonitor() {
    alert("Monitorização iniciada! Pode minimizar o navegador.");
    
    setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                          agora.getMinutes().toString().padStart(2, '0');
        const horaAlarme = document.getElementById('alarm-time').value;

        if (horaAtual === horaAlarme) {
            // Enviamos mensagem para o Service Worker disparar o alerta
            navigator.serviceWorker.ready.then(reg => {
                reg.active.postMessage({
                    type: 'ALERTA',
                    msg: `Verificação concluída: ${ships.length} navios monitorados.`
                });
            });
        }
    }, 60000); // Verifica a cada minuto
}
