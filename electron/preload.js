const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ------------------------------
  // Billing Core APIs
  // ------------------------------
  fetchItem: (barcode) => ipcRenderer.invoke("fetch-item", barcode),
  saveBill: (billData) => ipcRenderer.invoke("save-bill", billData),
  generatePDF: (data) => ipcRenderer.invoke("generatePDF", data),
  getAllBills: () => ipcRenderer.invoke("get-all-bills"),
  getBillById: (billId) => ipcRenderer.invoke("get-bill-by-id", billId),


  // ------------------------------
  // Dashboard APIs
  // ------------------------------
  getDashboardStats: (range, customRange) =>
    ipcRenderer.invoke("getDashboardStats", range, customRange),

  // ------------------------------
  // Item Search Modal
  // ------------------------------
  searchItems: (keyword) => ipcRenderer.invoke("search-items", keyword),

  // ------------------------------
  // Hold Bill System (UPDATED)
  // ------------------------------
  saveHoldBill: (data) => ipcRenderer.invoke("saveHoldBill", data),
  getHoldBills: () => ipcRenderer.invoke("get-hold-bills"),
  resumeHoldBill: (id) => ipcRenderer.invoke("resume-hold-bill", id),

  // ------------------------------
  // Quick Add Item & Add New Item
  // ------------------------------
  quickAddItem: (itemData) => ipcRenderer.invoke("quick-add-item", itemData),
  addNewItem: (data) => ipcRenderer.invoke("add-new-item", data),
  
    // ------------------------------
  // Edit Item
  // ------------------------------
  getAllItems: () => ipcRenderer.invoke("get-all-items"),
updateItem: (data) => ipcRenderer.invoke("update-item", data),
deleteItem: (id) => ipcRenderer.invoke("delete-item", id),


  // ------------------------------
  // Return Billing
  // ------------------------------
  getBillForReturn: (billId) =>
    ipcRenderer.invoke("get-bill-for-return", billId),
});
