// --- REGISTRO DO SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("Service Worker Registrado"));
}

let ships = [];
let monitorInterval = null;
let lastFixedAlarmDate = '';
let lastFreqExecutionTime = 0;

// --- 1. GESTÃO DE PERMISSÕES ---
async function solicitarPermissao() {
    if (!("Notification" in window)) {
        alert("Este navegador não suporta notificações de desktop.");
        return;
    }

    const permissao = await Notification.requestPermission();
    
    if (permissao === "granted") {
        new Notification("🚢 Sistema Autorizado", {
            body: "Agora os alertas aparecerão mesmo com o Excel aberto!",
            icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png"
        });
    }
    atualizarStatus();
}

function atualizarStatus() {
    const diag = document.getElementById('diag-text');
    const btn = document.getElementById('btn-perm');
    if (Notification.permission === "granted") {
        diag.innerHTML = "✅ Notificações Ativadas no Sistema.";
        btn.style.display = "none";
    } else if (Notification.permission === "denied") {
        diag.innerHTML = "❌ Notificações Bloqueadas no Navegador. Clique no cadeado da barra de endereço para desbloquear.";
    }
}

// --- 2. GESTÃO DE NAVIOS ---
function addShip() {
    const nameInput = document.getElementById('ship-name');
    const portInput = document.getElementById('ship-port');
    if (!nameInput.value) { alert("Por favor, digite o nome do navio."); return; }

    ships.push({
        id: Date.now(),
        name: nameInput.value.toUpperCase(),
        port: portInput.value || "Não especificado"
    });

    nameInput.value = ""; portInput.value = ""; renderList();
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = ships.map(s => `
        <div style="background:var(--surface2); padding:10px; margin-top:5px; border-radius:8px; display:flex; justify-content:space-between;">
            <span><b>${s.name}</b> - ${s.port}</span>
        </div>`).join('');
}

function setFreq(val) {
    document.getElementById('freq-slider').value = val;
    updateSliderLabel(val);
}

// --- 3. MOTOR DE MONITORAMENTO ---
function startMonitor() {
    if (ships.length === 0) { alert("Adicione pelo menos um navio."); return; }
    if (Notification.permission !== "granted") { alert("Libere as notificações primeiro."); return; }

    document.getElementById('btn-start').innerText = "🟢 MONITORANDO ATIVAMENTE";
    document.getElementById('btn-start').style.background = "#10b981";

    monitorInterval = setInterval(() => {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + 
                          agora.getMinutes().toString().padStart(2, '0');
        
        const horaFixa = document.getElementById('alarm-time').value;
        if (horaAtual === horaFixa && lastFixedAlarmDate !== agora.toDateString()) {
            dispararAlerta("HORÁRIO AGENDADO");
            lastFixedAlarmDate = agora.toDateString();
        }

        const freqMinutos = parseInt(document.getElementById('freq-slider').value);
        const agoraMs = agora.getTime();
        if (agoraMs - lastFreqExecutionTime >= freqMinutos * 60000) {
            if (lastFreqExecutionTime !== 0) dispararAlerta("VERIFICAÇÃO PERIÓDICA");
            lastFreqExecutionTime = agoraMs;
        }
    }, 1000);
}

// --- 4. DISPARO DO POP-UP ---
function dispararAlerta(tipoContexto) {
    ships.forEach(s => {
        const n = new Notification(`🚢 ${tipoContexto}`, {
            body: `NAVIO: ${s.name}\nPORTO: ${s.port}\nVerificado agora.`,
            icon: "https://cdn-icons-png.flaticon.com/512/2040/2040061.png",
            requireInteraction: true,
            tag: s.id 
        });
        n.onclick = () => { window.focus(); n.close(); };
    });
    showToast(`Alerta disparado para ${ships.length} navios.`);
}

function showToast(msg) {
    const container = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<b>Aviso:</b> ${msg}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 5000);
}

function updateSliderLabel(val) {
    document.getElementById('slider-label').innerText = `Frequência: ${val} minutos`;
}

window.onload = atualizarStatus;
