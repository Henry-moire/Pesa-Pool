const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ExcelJS = require('exceljs');

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
        icon: path.join(__dirname, 'assets', 'icon.ico'),
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
            try {
                const fullPath = path.join(dir, filename);
                const content = fs.readFileSync(fullPath, 'utf8');
                const event = JSON.parse(content);
                return { id: event.id, name: event.name, date: event.date };
            } catch {
                return null;
            }
        })
        .filter(event => event !== null);
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

function addDonation(eventId, donorId, donorName, amount) {
    const event = loadEvent(eventId);
    
    // add donor if they don't exist yet
    const existingDonor = event.donors.find(d => d.id === donorId);
    if (!existingDonor) {
        event.donors.push({ id: donorId, name: donorName });
    }

    const donation = {
        id: 'd_' + randomUUID(),
        donorId: donorId,
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
ipcMain.handle('add-donation', (_e, eventId, donorId, donorName, amount) => {
    return addDonation(eventId, donorId, donorName, amount);
});
ipcMain.handle('export', async (e, format, eventData) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const { filePath } = await dialog.showSaveDialog(win, {
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
            const formattedDate = new Date(donation.timestamp).toLocaleString('en-KE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            lines.push(`${donor.name},${donation.amount.toFixed(2)},"${formattedDate}"`);
        });
        const total = eventData.donations.reduce((sum, d) => sum + d.amount, 0);
        lines.push(`,,`);
        lines.push(`Total,${total.toFixed(2)},`);
        fs.writeFileSync(filePath, lines.join('\n'));
    } else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Donations');
        worksheet.columns = [
            { header: 'Donor Name', key: 'name', width: 30 },
            { header: 'Amount (KES)', key: 'amount', width: 15 },
            { header: 'Date', key: 'date', width: 30 },
        ];
        eventData.donations.forEach(donation => {
            const donor = eventData.donors.find(d => d.id === donation.donorId);
            worksheet.addRow({
                name: donor.name,
                amount: donation.amount,
                date: new Date(donation.timestamp).toLocaleString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
        });
        await workbook.xlsx.writeFile(filePath);
    }
    return { success: true, filePath };
});

ipcMain.handle('save-buffer', async (e, { buffer, defaultName, extension }) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const { filePath } = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    });
    if (win) win.focus();
    if (!filePath) return { success: false };
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true, filePath };
});

ipcMain.handle('delete-event', (_e, id) => {
    const filePath = path.join(getDataDir(), `${id}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Event file not found: ${id}`);
    }
    fs.unlinkSync(filePath);
    return { success: true };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});