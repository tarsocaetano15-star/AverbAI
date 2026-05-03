let ships = [];

function addShip() {
    const name = document.getElementById('ship-name').value;
    const port = document.getElementById('ship-port').value;

    const ship = {
        id: Date.now(),
        name,
        port,
        ativo: false
    };

    ships.push(ship);
    renderList();
}

function renderList() {
    const container = document.getElementById('list-container');

    container.innerHTML = ships.map(s => `
        <div class="card">
            <b>${s.name}</b> - ${s.port}
            <br>
            <button onclick="startShip(${s.id})">▶ Iniciar</button>
            <button onclick="stopShip(${s.id})">⏹ Concluir</button>
        </div>
    `).join('');
}

function startShip(id) {
    const ship = ships.find(s => s.id === id);
    ship.ativo = true;
    log("Iniciado: " + ship.name);
}

function stopShip(id) {
    const ship = ships.find(s => s.id === id);
    ship.ativo = false;
    log("Finalizado: " + ship.name);
}

async function ativarPush() {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        alert("Permissão negada");
        return;
    }

    const token = await messaging.getToken({
        vapidKey: "SUA_VAPID_KEY"
    });

    console.log("TOKEN:", token);
}

function log(msg) {
    let logs = JSON.parse(localStorage.getItem("logs")) || [];
    logs.push(new Date().toLocaleString() + " - " + msg);

    localStorage.setItem("logs", JSON.stringify(logs));
    renderLogs();
}

function renderLogs() {
    const container = document.getElementById('historico');
    const logs = JSON.parse(localStorage.getItem("logs")) || [];

    container.innerHTML = logs.reverse().map(l => `<div>${l}</div>`).join('');
}

renderLogs();
