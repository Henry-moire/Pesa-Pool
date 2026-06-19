const { app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');

function getDataDir() {
    const dir = path.join(app.getPath('documents'), 'Pesa Pool');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

function createEvent(name, date) {
    const event = {
        id: 'evt_' + Date.now(),
        name: name,
        date: date,
        createdAt: new Date().toISOString(),
        donors: [],
        donations: []
    };
    fs.writeFileSync(
        path.join(getDataDir(), `${event.id}.json`),
        JSON.stringify(event, null, 2)
    );
    return event;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        },
    });
    win.loadFile('index.html');
}

console.log(createEvent('Test Event', '2026-06-20'));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});