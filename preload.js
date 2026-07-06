const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
    createEvent: (name, date) => ipcRenderer.invoke('create-event', name, date),
    listEvents: () => ipcRenderer.invoke('list-events'),
    loadEvent: (id) => ipcRenderer.invoke('load-event', id),
    saveEvent: (event) => ipcRenderer.invoke('save-event', event),
    addDonation: (eventId, donorName, amount) => ipcRenderer.invoke('add-donation', eventId, donorName, amount),
    exportAs: (format, eventData) => ipcRenderer.invoke('export', format, eventData),
    saveBuffer: (payload) => ipcRenderer.invoke('save-buffer', payload),
});