const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Data operations
    getRolls: () => ipcRenderer.invoke('get-rolls'),
    createRoll: (rollData) => ipcRenderer.invoke('create-roll', rollData),
    updateRollStatus: (rollId, status) => ipcRenderer.invoke('update-roll-status', rollId, status),
    
    getGoodsOnMachine: () => ipcRenderer.invoke('get-goods-on-machine'),
    issueToMachine: (issueData) => ipcRenderer.invoke('issue-to-machine', issueData),
    updateGoodsOnMachine: (rollId, updatedData) => ipcRenderer.invoke('update-goods-on-machine', rollId, updatedData),
    
    getBoxes: () => ipcRenderer.invoke('get-boxes'),
    createBox: (boxData) => ipcRenderer.invoke('create-box', boxData),
    updateBoxStatus: (boxId, status) => ipcRenderer.invoke('update-box-status', boxId, status),
    
    getDispatches: () => ipcRenderer.invoke('get-dispatches'),
    createDispatch: (dispatchData) => ipcRenderer.invoke('create-dispatch', dispatchData),
    
    // Inbound bobbins operations
    getInboundBobbins: () => ipcRenderer.invoke('get-inbound-bobbins'),
    createInboundBobbin: (data) => {
      console.log('Sending to main process:', data);
      return ipcRenderer.invoke('create-inbound-bobbin', data);
    },
    updateInboundBobbinStatus: (bobbinId, status) => ipcRenderer.invoke('update-inbound-bobbin-status', bobbinId, status),
    
    // Master data operations
    getCustomers: () => ipcRenderer.invoke('get-customers'),
    createCustomer: (customerData) => ipcRenderer.invoke('create-customer', customerData),
    updateCustomer: (customerId, customerData) => ipcRenderer.invoke('update-customer', customerId, customerData),
    deleteCustomer: (customerId) => ipcRenderer.invoke('delete-customer', customerId),
    
    getBobbinTypes: () => ipcRenderer.invoke('get-bobbin-types'),
    createBobbinType: (bobbinTypeData) => ipcRenderer.invoke('create-bobbin-type', bobbinTypeData),
    updateBobbinType: (bobbinTypeId, bobbinTypeData) => ipcRenderer.invoke('update-bobbin-type', bobbinTypeId, bobbinTypeData),
    deleteBobbinType: (bobbinTypeId) => ipcRenderer.invoke('delete-bobbin-type', bobbinTypeId),
    
    getBoxTypes: () => ipcRenderer.invoke('get-box-types'),
    createBoxType: (boxTypeData) => ipcRenderer.invoke('create-box-type', boxTypeData),
    updateBoxType: (boxTypeId, boxTypeData) => ipcRenderer.invoke('update-box-type', boxTypeId, boxTypeData),
    deleteBoxType: (boxTypeId) => ipcRenderer.invoke('delete-box-type', boxTypeId),
    
    // Utility functions
    generateId: (prefix) => ipcRenderer.invoke('generate-id', prefix),
    printLabel: (labelData) => ipcRenderer.invoke('print-label', labelData),
    
    // System functions
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Lot operations
    getLots: () => ipcRenderer.invoke('get-lots'),
    getNextLotNumber: () => ipcRenderer.invoke('get-next-lot-number'),
    createLot: (lotData, rollsData) => ipcRenderer.invoke('create-lot', lotData, rollsData),
    getLotById: (lotNumber) => ipcRenderer.invoke('get-lot-by-id', lotNumber),
    getRollsByLot: (lotNumber) => ipcRenderer.invoke('get-rolls-by-lot', lotNumber),
    deleteLot: (lotNumber) => ipcRenderer.invoke('delete-lot', lotNumber),
    
    // Machine operations
    getMachines: () => ipcRenderer.invoke('get-machines'),
    getMachineById: (machineId) => ipcRenderer.invoke('get-machine-by-id', machineId),
    createMachine: (machineData) => ipcRenderer.invoke('create-machine', machineData),
    updateMachine: (machineId, updatedData) => ipcRenderer.invoke('update-machine', machineId, updatedData),
    deleteMachine: (machineId) => ipcRenderer.invoke('delete-machine', machineId),

    // Printer settings operations
    getPrinterSettings: () => ipcRenderer.invoke('get-printer-settings'),
    updatePrinterSettings: (settings) => ipcRenderer.invoke('update-printer-settings', settings),
    getAvailablePrinters: () => ipcRenderer.invoke('get-available-printers'),

    // Weight Scale API
    connectWeightScale: (options) => ipcRenderer.invoke('connect-weight-scale', options),
    autoDetectWeightScale: () => ipcRenderer.invoke('auto-detect-weight-scale'),
    disconnectWeightScale: () => ipcRenderer.invoke('disconnect-weight-scale'),
    captureWeight: () => ipcRenderer.invoke('capture-weight'),
    getAvailablePorts: () => ipcRenderer.invoke('get-available-ports'),
    weightScaleStatus: () => ipcRenderer.invoke('weight-scale-status'),
  }
); 