const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import our services
const rollService = require('./src/services/rollService');
const goodsOnMachineService = require('./src/services/goodsOnMachineService');
const boxService = require('./src/services/boxService');
const dispatchService = require('./src/services/dispatchService');
const csvService = require('./src/services/csvService');
const printService = require('./src/services/printService');
const customerService = require('./src/services/customerService');
const bobbinTypeService = require('./src/services/bobbinTypeService');
const boxTypeService = require('./src/services/boxTypeService');
const lotService = require('./src/services/lotService');
const machineService = require('./src/services/machineService');
const inboundBobbinService = require('./src/services/inboundBobbinService');
const printerSettingsService = require('./src/services/printerSettingsService');

// Check if data directory exists, if not create it
const dataDir = path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize CSV files if they don't exist
function initializeCSVFiles() {
  const dataDir = csvService.getDataDir();
  
  // Ensure the data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create backup folder if it doesn't exist
  const backupDir = path.join(dataDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Define the CSV files and their headers
  const files = {
    'rolls.csv': ['roll_id', 'lot_no', 'customer_name', 'color_or_type', 'weight', 'date_received', 'status'],
    'goods_on_machine.csv': ['roll_id', 'issued_date', 'operator', 'machine_id', 'machine_number', 'cut', 'bobbin_quantity', 'bobbin_type', 'initial_weight', 'weight_received_so_far', 'wastage_marked'],
    'boxes.csv': ['box_id', 'roll_id', 'date_created', 'gross_weight', 'tare_weight', 'net_weight', 'bobbin_count', 'bobbin_type', 'box_type', 'status'],
    'dispatches.csv': ['dispatch_id', 'dispatch_date', 'customer_name', 'box_ids', 'total_weight', 'total_bobbins'],
    'customers.csv': ['customer_id', 'customer_name', 'contact_person', 'contact_number', 'email', 'address', 'notes'],
    'bobbin_types.csv': ['bobbin_type_id', 'type_name', 'description', 'weight', 'notes'],
    'box_types.csv': ['box_type_id', 'type_name', 'description', 'dimensions', 'tare_weight', 'notes'],
    'machines.csv': ['machine_id', 'machine_number', 'description'],
    'inbound_bobbins.csv': ['inbound_bobbin_id', 'lot_no', 'customer_name', 'bobbin_type', 'quantity', 'date_received', 'status']
  };
  
  // Create the files if they don't exist
  Object.entries(files).forEach(([file, headers]) => {
    const filePath = path.join(dataDir, file);
    
    // Forcibly recreate the machines.csv file with proper headers
    if (file === 'machines.csv') {
      const headerRow = headers.join(',');
      fs.writeFileSync(filePath, headerRow + '\n');
      console.log(`Created ${file} with headers`);
    } 
    // For other files, only create if they don't exist
    else if (!fs.existsSync(filePath)) {
      const headerRow = headers.join(',');
      fs.writeFileSync(filePath, headerRow + '\n');
      console.log(`Created ${file} with headers`);
    }
  });
  
  // Create a backup of all files when the app starts
  try {
    csvService.createBackup();
    console.log('Backup created successfully');
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Initialize CSV files
  initializeCSVFiles();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Create a nightly backup when app starts
  csvService.createBackup()
    .then(() => console.log('Backup created successfully'))
    .catch(err => console.error('Error creating backup:', err));
    
  // Check if we have any machines and if not, create some sample machines
  machineService.getAllMachines()
    .then(machines => {
      if (machines.length === 0) {
        console.log('No machines found, creating sample machines...');
        return Promise.all([
          machineService.createMachine({ machine_number: '101', description: 'Default machine' }),
          machineService.createMachine({ machine_number: '102', description: 'New machine' })
        ]);
      }
    })
    .then(() => console.log('Sample machines created successfully'))
    .catch(err => console.error('Error checking/creating sample machines:', err));
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for Roll operations
ipcMain.handle('get-rolls', async () => {
  try {
    return await rollService.getAllRolls();
  } catch (error) {
    console.error('Error in get-rolls:', error);
    throw error;
  }
});

ipcMain.handle('create-roll', async (event, rollData) => {
  try {
    return await rollService.createRoll(rollData);
  } catch (error) {
    console.error('Error in create-roll:', error);
    throw error;
  }
});

ipcMain.handle('update-roll-status', async (event, rollId, status) => {
  try {
    return await rollService.updateRollStatus(rollId, status);
  } catch (error) {
    console.error('Error in update-roll-status:', error);
    throw error;
  }
});

// IPC handlers for Goods on Machine operations
ipcMain.handle('get-goods-on-machine', async () => {
  try {
    return await goodsOnMachineService.getAllGoodsOnMachine();
  } catch (error) {
    console.error('Error in get-goods-on-machine:', error);
    throw error;
  }
});

ipcMain.handle('issue-to-machine', async (event, issueData) => {
  try {
    // Get the roll to get its weight
    const roll = await rollService.getRollById(issueData.roll_id);
    
    // Add initial weight from the roll
    issueData.initial_weight = roll.weight;
    
    return await goodsOnMachineService.issueToMachine(issueData);
  } catch (error) {
    console.error('Error in issue-to-machine:', error);
    throw error;
  }
});

ipcMain.handle('update-goods-on-machine', async (event, rollId, updatedData) => {
  try {
    return await goodsOnMachineService.updateGoodsOnMachine(rollId, updatedData);
  } catch (error) {
    console.error('Error in update-goods-on-machine:', error);
    throw error;
  }
});

// IPC handlers for Box operations
ipcMain.handle('get-boxes', async () => {
  try {
    return await boxService.getAllBoxes();
  } catch (error) {
    console.error('Error in get-boxes:', error);
    throw error;
  }
});

ipcMain.handle('create-box', async (event, boxData) => {
  try {
    return await boxService.createBox(boxData);
  } catch (error) {
    console.error('Error in create-box:', error);
    throw error;
  }
});

ipcMain.handle('update-box-status', async (event, boxId, status) => {
  try {
    return await boxService.updateBoxStatus(boxId, status);
  } catch (error) {
    console.error('Error in update-box-status:', error);
    throw error;
  }
});

// IPC handlers for Dispatch operations
ipcMain.handle('get-dispatches', async () => {
  try {
    return await dispatchService.getAllDispatches();
  } catch (error) {
    console.error('Error in get-dispatches:', error);
    throw error;
  }
});

ipcMain.handle('create-dispatch', async (event, dispatchData) => {
  try {
    return await dispatchService.createDispatch(dispatchData);
  } catch (error) {
    console.error('Error in create-dispatch:', error);
    throw error;
  }
});

// IPC handlers for utility functions
ipcMain.handle('generate-id', async (event, prefix) => {
  try {
    return await csvService.generateId(prefix);
  } catch (error) {
    console.error('Error in generate-id:', error);
    throw error;
  }
});

ipcMain.handle('print-label', async (event, labelData) => {
  try {
    return await printService.printLabel(labelData);
  } catch (error) {
    console.error('Error in print-label:', error);
    throw error;
  }
});

// IPC handlers for system functions
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// IPC handlers for Customer operations
ipcMain.handle('get-customers', async () => {
  try {
    return await customerService.getAllCustomers();
  } catch (error) {
    console.error('Error in get-customers:', error);
    throw error;
  }
});

ipcMain.handle('create-customer', async (event, customerData) => {
  try {
    return await customerService.createCustomer(customerData);
  } catch (error) {
    console.error('Error in create-customer:', error);
    throw error;
  }
});

ipcMain.handle('update-customer', async (event, customerId, updatedData) => {
  try {
    return await customerService.updateCustomer(customerId, updatedData);
  } catch (error) {
    console.error('Error in update-customer:', error);
    throw error;
  }
});

ipcMain.handle('delete-customer', async (event, customerId) => {
  try {
    return await customerService.deleteCustomer(customerId);
  } catch (error) {
    console.error('Error in delete-customer:', error);
    throw error;
  }
});

// IPC handlers for Bobbin Type operations
ipcMain.handle('get-bobbin-types', async () => {
  try {
    return await bobbinTypeService.getAllBobbinTypes();
  } catch (error) {
    console.error('Error in get-bobbin-types:', error);
    throw error;
  }
});

ipcMain.handle('create-bobbin-type', async (event, bobbinTypeData) => {
  try {
    return await bobbinTypeService.createBobbinType(bobbinTypeData);
  } catch (error) {
    console.error('Error in create-bobbin-type:', error);
    throw error;
  }
});

ipcMain.handle('update-bobbin-type', async (event, bobbinTypeId, updatedData) => {
  try {
    return await bobbinTypeService.updateBobbinType(bobbinTypeId, updatedData);
  } catch (error) {
    console.error('Error in update-bobbin-type:', error);
    throw error;
  }
});

ipcMain.handle('delete-bobbin-type', async (event, bobbinTypeId) => {
  try {
    return await bobbinTypeService.deleteBobbinType(bobbinTypeId);
  } catch (error) {
    console.error('Error in delete-bobbin-type:', error);
    throw error;
  }
});

// IPC handlers for Box Type operations
ipcMain.handle('get-box-types', async () => {
  try {
    return await boxTypeService.getAllBoxTypes();
  } catch (error) {
    console.error('Error in get-box-types:', error);
    throw error;
  }
});

ipcMain.handle('create-box-type', async (event, boxTypeData) => {
  try {
    return await boxTypeService.createBoxType(boxTypeData);
  } catch (error) {
    console.error('Error in create-box-type:', error);
    throw error;
  }
});

ipcMain.handle('update-box-type', async (event, boxTypeId, updatedData) => {
  try {
    return await boxTypeService.updateBoxType(boxTypeId, updatedData);
  } catch (error) {
    console.error('Error in update-box-type:', error);
    throw error;
  }
});

ipcMain.handle('delete-box-type', async (event, boxTypeId) => {
  try {
    return await boxTypeService.deleteBoxType(boxTypeId);
  } catch (error) {
    console.error('Error in delete-box-type:', error);
    throw error;
  }
});

// Add new IPC handlers for Lot operations
ipcMain.handle('get-lots', async () => {
  try {
    return await lotService.getAllLots();
  } catch (error) {
    console.error('Error in get-lots:', error);
    throw error;
  }
});

ipcMain.handle('get-next-lot-number', async () => {
  try {
    return await lotService.getNextLotNumber();
  } catch (error) {
    console.error('Error in get-next-lot-number:', error);
    throw error;
  }
});

ipcMain.handle('create-lot', async (event, lotData, rollsData) => {
  try {
    return await lotService.createLot(lotData, rollsData);
  } catch (error) {
    console.error('Error in create-lot:', error);
    throw error;
  }
});

ipcMain.handle('get-lot-by-id', async (event, lotNumber) => {
  try {
    return await lotService.getLotById(lotNumber);
  } catch (error) {
    console.error('Error in get-lot-by-id:', error);
    throw error;
  }
});

ipcMain.handle('get-rolls-by-lot', async (event, lotNumber) => {
  try {
    return await lotService.getRollsByLotNumber(lotNumber);
  } catch (error) {
    console.error('Error in get-rolls-by-lot:', error);
    throw error;
  }
});

ipcMain.handle('delete-lot', async (event, lotNumber) => {
  try {
    return await lotService.deleteLot(lotNumber);
  } catch (error) {
    console.error('Error in delete-lot:', error);
    throw error;
  }
});

// IPC handlers for Machine operations
ipcMain.handle('get-machines', async () => {
  try {
    return await machineService.getAllMachines();
  } catch (error) {
    console.error('Error in get-machines:', error);
    throw error;
  }
});

ipcMain.handle('get-machine-by-id', async (event, machineId) => {
  try {
    return await machineService.getMachineById(machineId);
  } catch (error) {
    console.error('Error in get-machine-by-id:', error);
    throw error;
  }
});

ipcMain.handle('create-machine', async (event, machineData) => {
  try {
    return await machineService.createMachine(machineData);
  } catch (error) {
    console.error('Error in create-machine:', error);
    throw error;
  }
});

ipcMain.handle('update-machine', async (event, machineId, updatedData) => {
  try {
    return await machineService.updateMachine(machineId, updatedData);
  } catch (error) {
    console.error('Error in update-machine:', error);
    throw error;
  }
});

ipcMain.handle('delete-machine', async (event, machineId) => {
  try {
    return await machineService.deleteMachine(machineId);
  } catch (error) {
    console.error('Error in delete-machine:', error);
    throw error;
  }
});

// Add new IPC handlers for Inbound Bobbin operations
ipcMain.handle('get-inbound-bobbins', async () => {
  try {
    return await inboundBobbinService.getAllInboundBobbins();
  } catch (error) {
    console.error('Error in get-inbound-bobbins:', error);
    throw error;
  }
});

ipcMain.handle('create-inbound-bobbin', async (event, data) => {
  console.log('Create inbound bobbin called with:', data);
  
  try {
    // Verify data
    if (!data || !data.lotData || !data.bobbins || !Array.isArray(data.bobbins)) {
      throw new Error('Invalid data format for inbound bobbins');
    }
    
    const { lotData, bobbins } = data;
    
    // Create new bobbin entries
    const newBobbins = [];
    
    for (let i = 0; i < bobbins.length; i++) {
      const bobbin = bobbins[i];
      const bobbinId = await csvService.generateId('IB');
      const newBobbin = {
        inbound_bobbin_id: bobbinId,
        lot_no: lotData.lot_number,
        customer_name: bobbin.customer_name,
        bobbin_type: bobbin.bobbin_type,
        quantity: bobbin.quantity,
        date_received: lotData.date_received,
        status: 'in_stock'
      };
      
      await inboundBobbinService.createInboundBobbin(newBobbin);
      newBobbins.push(newBobbin);
    }
    
    return { success: true, count: newBobbins.length };
  } catch (error) {
    console.error('Error in create-inbound-bobbin:', error);
    throw error;
  }
});

ipcMain.handle('update-inbound-bobbin-status', async (event, bobbinId, status) => {
  try {
    await inboundBobbinService.updateInboundBobbinStatus(bobbinId, status);
    return true;
  } catch (error) {
    console.error('Error in update-inbound-bobbin-status:', error);
    throw error;
  }
});

ipcMain.handle('delete-inbound-bobbin', async (event, lotNumber) => {
  try {
    await inboundBobbinService.deleteInboundBobbinsByLot(lotNumber);
    return true;
  } catch (error) {
    console.error('Error in delete-inbound-bobbin:', error);
    throw error;
  }
});

// Printer Settings IPC Handlers
ipcMain.handle('get-printer-settings', () => {
  try {
    return printerSettingsService.getSettings();
  } catch (error) {
    console.error('Error in get-printer-settings:', error);
    throw error;
  }
});

ipcMain.handle('update-printer-settings', (event, settings) => {
  try {
    return printerSettingsService.updateSettings(settings);
  } catch (error) {
    console.error('Error in update-printer-settings:', error);
    throw error;
  }
});

ipcMain.handle('get-available-printers', async () => {
  try {
    return await printerSettingsService.getAvailablePrinters();
  } catch (error) {
    console.error('Error in get-available-printers:', error);
    throw error;
  }
}); 