const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  login: (credentials) => ipcRenderer.invoke('db:login', credentials),
  register: (credentials) => ipcRenderer.invoke('db:register', credentials),
  readPdfData: async () => {
    return await ipcRenderer.invoke('read-pdf-data');
  },
  consultaRuc: async (ruc) => ipcRenderer.invoke('sunat:consulta-ruc', { ruc }),
  getSunatByRuc: async (ruc) => ipcRenderer.invoke('sunat:get-by-ruc', { ruc }),
  saveSunatData: async (data) => ipcRenderer.invoke('sunat:save', data),
  // Clients
  getAllClients: async () => ipcRenderer.invoke('clients:get-all'),
  getClientByRuc: async (ruc) => ipcRenderer.invoke('clients:get-by-ruc', { ruc }),
  addClient: async (client) => ipcRenderer.invoke('clients:add', client),
  removeClient: async (rucOrId) => ipcRenderer.invoke('clients:remove', { rucOrId }),
  getAccounts: async (query, limit = 50, offset = 0) => {
    return await ipcRenderer.invoke('pcge:getAccounts', { query, limit, offset });
  },
  exportToCsv: (invoiceData) => ipcRenderer.invoke('export-to-csv', invoiceData),
  // Invoices
  addInvoice: async (invoice) => ipcRenderer.invoke('invoices:add', invoice),
  // Purchases
  addPurchase: async (purchase) => ipcRenderer.invoke('purchases:add', purchase),
  // App config (persisted in userData/config.json)
  getAppConfig: async () => ipcRenderer.invoke('app:get-config'),
  setAppConfig: async (cfg) => ipcRenderer.invoke('app:set-config', { config: cfg }),
});

// API para suscribirse a progreso de extracción/parseo
contextBridge.exposeInMainWorld('electronProgress', {
  subscribe: (cb) => {
    const listener = (event, payload) => cb(payload);
    ipcRenderer.on('read-pdf-progress', listener);
    return () => ipcRenderer.removeListener('read-pdf-progress', listener);
  }
});
