const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

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

function loadEvent(id) {
    const filePath = path.join(getDataDir(), `${id}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Event file not found: ${id}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

function saveEvent(event) {
    const filePath = path.join(getDataDir(), `${event.id}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Event file not found: ${event.id}`);
    }
    fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
}

function addDonation(eventId, donorName, amount) {
    const event = loadEvent(eventId);
    let donor = event.donors.find(donor => donor.name.toLowerCase() === donorName.toLowerCase());
    if (!donor) {
        donor = {
            id: 'don_' + randomUUID(),
            name: donorName
        };
        event.donors.push(donor);
    }
    const donation = {
        id: 'd_' + randomUUID(),
        donorId: donor.id,
        amount: amount,
        timestamp: new Date().toISOString()
    };
    event.donations.push(donation);
    saveEvent(event);
    return event;
}

ipcMain.handle('create-event', (_e, name, date) => {
    return createEvent(name, date);
});
ipcMain.handle('list-events', (_e) => {
    return listEvents();
});
ipcMain.handle('load-event', (_e, id) => {
    return loadEvent(id);
});
ipcMain.handle('save-event', (_e, eventData) => {
    return saveEvent(eventData);
});
ipcMain.handle('add-donation', (_e, eventId, donorName, amount) => {
    return addDonation(eventId, donorName, amount);
});
ipcMain.handle('export', async (_e, format, eventData) => {
    const { filePath } = await dialog.showSaveDialog({
        defaultPath: `${eventData.name}_export`,
        filters: [{ name: format.toUpperCase(), extensions: [format === 'excel' ? 'xlsx' : format] }]
    });
    if (!filePath) return { success: false };
    if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(eventData, null, 2));
    } else if (format === 'csv') {
        const lines = ['Donor Name,Amount,Date'];
        eventData.donations.forEach(donation => {
            const donor = eventData.donors.find(d => d.id === donation.donorId);
            lines.push(`${donor.name},${donation.amount.toFixed(2)},${donation.timestamp}`);
        });
        const total = eventData.donations.reduce((sum, d) => sum + d.amount, 0);
        lines.push(`,,`);
        lines.push(`Total,${total.toFixed(2)},`);
        fs.writeFileSync(filePath, lines.join('\n'));
    }
    return { success: true, filePath };
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});