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

function listEvents() {
    const dir = getDataDir();
    const events = fs.readdirSync(dir)
        .filter(file => file.endsWith('.json'))
        .map(filename => {
            const fullPath = path.join(dir, filename);
            const content = fs.readFileSync(fullPath, 'utf8');
            const event = JSON.parse(content);
            return { id: event.id, name: event.name, date: event.date };
        });
    return events;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});