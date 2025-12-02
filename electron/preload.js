const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  fetchItem: (barcode) => ipcRenderer.invoke("fetch-item", barcode),
   saveBill: (billData) => ipcRenderer.invoke("save-bill", billData),
     generatePDF: (data) => ipcRenderer.invoke("generatePDF", data),
     getDashboardStats: () => ipcRenderer.invoke("getDashboardStats"),
getDashboardStats: (range, customRange) => ipcRenderer.invoke("getDashboardStats", range, customRange),

});
