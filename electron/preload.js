const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ------------------------------
  // Billing Core APIs
  // ------------------------------
  fetchItem: (barcode) => ipcRenderer.invoke("fetch-item", barcode),
  saveBill: (billData) => ipcRenderer.invoke("save-bill", billData),
  generatePDF: (data) => ipcRenderer.invoke("generatePDF", data),

  // ------------------------------
  // Dashboard APIs
  // ------------------------------
  getDashboardStats: (range, customRange) =>
    ipcRenderer.invoke("getDashboardStats", range, customRange),

  // ------------------------------
  // NEW: Item Search Modal
  // ------------------------------
  searchItems: (keyword) => ipcRenderer.invoke("search-items", keyword),

  // ------------------------------
  // NEW: Hold Bill System
  // ------------------------------
  holdBill: (data) => ipcRenderer.invoke("hold-bill", data),
  getHoldBills: () => ipcRenderer.invoke("get-hold-bills"),
  resumeHoldBill: (id) => ipcRenderer.invoke("resume-hold-bill", id),

  // ------------------------------
  // NEW: Quick Add Item
  // ------------------------------
  quickAddItem: (itemData) => ipcRenderer.invoke("quick-add-item", itemData),

  // ------------------------------
  // NEW: Return Billing
  // ------------------------------
  getBillForReturn: (billId) =>
    ipcRenderer.invoke("get-bill-for-return", billId),
});
