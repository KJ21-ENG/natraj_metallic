const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { parse, unparse } = require('papaparse');
const { promisify } = require('util');

// Convert callbacks to promises
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Get the data directory path
const getDataDir = () => path.join(app.getPath('userData'), 'data');

// Ensure the CSV file exists
const ensureFileExists = (filePath) => {
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create with appropriate headers
    const headers = getHeadersForFile(path.basename(filePath));
    fs.writeFileSync(filePath, headers);
  }
  return filePath;
};

// Get default headers for each CSV type
const getHeadersForFile = (fileName) => {
  switch (fileName) {
    case 'rolls.csv':
      return 'roll_id,customer_name,color_or_type,weight,status,date_received,lot_no\n';
    case 'goods_on_machine.csv':
      return 'roll_id,issued_date,operator,machine_id,machine_number,cut,bobbin_quantity,bobbin_type,initial_weight,weight_received_so_far,wastage_marked\n';
    case 'boxes.csv':
      return 'box_id,roll_id,date_created,gross_weight,tare_weight,net_weight,bobbin_count,bobbin_type,status\n';
    case 'dispatches.csv':
      return 'dispatch_id,dispatch_date,customer_name,box_ids,total_weight,total_bobbins\n';
    case 'customers.csv':
      return 'customer_id,customer_name,contact_person,contact_number,address,email,notes\n';
    case 'bobbin_types.csv':
      return 'bobbin_type_id,type_name,description,weight,notes\n';
    case 'box_types.csv':
      return 'box_type_id,type_name,description,dimensions,tare_weight,notes\n';
    case 'lots.csv':
      return 'lot_number,date_received,total_rolls,total_weight\n';
    case 'inbound_bobbins.csv':
      return 'inbound_bobbin_id,lot_no,customer_name,bobbin_type,quantity,date_received,status\n';
    case 'machines.csv':
      return 'machine_id,machine_number,description\n';
    default:
      return '';
  }
};

// Read a CSV file and parse it into an array of objects
const readCSV = async (fileName) => {
  try {
    const filePath = ensureFileExists(path.join(getDataDir(), fileName));
    console.log(`Reading file: ${fileName} from ${filePath}`);
    
    const fileContent = await readFileAsync(filePath, 'utf8');
    console.log(`Raw content for ${fileName}:`, fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : ''));
    
    const result = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    console.log(`Parsed ${fileName} headers:`, result.meta.fields);
    console.log(`Parsed ${fileName} data (first 2 records):`, result.data.slice(0, 2));
    
    return result.data;
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    throw error;
  }
};

// Write an array of objects to a CSV file
const writeCSV = async (fileName, data) => {
  try {
    const filePath = path.join(getDataDir(), fileName);
    
    // Log info about what we're writing
    console.log(`Writing to ${fileName}:`, data.length, 'records');
    if (data.length > 0) {
      console.log(`Sample record:`, data[0]);
    }
    
    // Special handling for machines.csv
    if (fileName === 'machines.csv') {
      console.log('Ensuring proper field names for machines.csv');
      // Make sure each record has the correct field names
      data = data.map(machine => ({
        machine_id: machine.machine_id,
        machine_number: machine.machine_number || machine.machineNumber || 'Unknown',
        description: machine.description || ''
      }));
    }
    
    const csvContent = unparse(data, {
      header: true
    });
    
    await writeFileAsync(filePath, csvContent);
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error);
    throw error;
  }
};

// Generate a unique ID with a given prefix
const generateId = async (prefix) => {
  let fileName;
  let idField;
  
  switch (prefix) {
    case 'ROLL':
      fileName = 'rolls.csv';
      idField = 'roll_id';
      break;
    case 'BOX':
      fileName = 'boxes.csv';
      idField = 'box_id';
      break;
    case 'DISP':
      fileName = 'dispatches.csv';
      idField = 'dispatch_id';
      break;
    case 'CUST':
      fileName = 'customers.csv';
      idField = 'customer_id';
      break;
    case 'BT':
      fileName = 'bobbin_types.csv';
      idField = 'bobbin_type_id';
      break;
    case 'BX':
      fileName = 'box_types.csv';
      idField = 'box_type_id';
      break;
    case 'IB':
      fileName = 'inbound_bobbins.csv';
      idField = 'inbound_bobbin_id';
      break;
    case 'MCH':
      fileName = 'machines.csv';
      idField = 'machine_id';
      break;
    default:
      throw new Error(`Unknown ID prefix: ${prefix}`);
  }
  
  try {
    const records = await readCSV(fileName);
    
    // Find the highest existing ID
    let maxId = 0;
    if (records.length > 0) {
      records.forEach(record => {
        if (record[idField]) {
          const idParts = record[idField].split('-');
          if (idParts.length === 2) {
            const idNum = parseInt(idParts[1]);
            if (!isNaN(idNum) && idNum > maxId) {
              maxId = idNum;
            }
          }
        }
      });
    }
    
    // Generate new ID with padding
    const nextId = maxId + 1;
    return `${prefix}-${String(nextId).padStart(4, '0')}`;
  } catch (error) {
    console.error(`Error generating ID for ${prefix}:`, error);
    // Fallback to timestamp-based ID if file doesn't exist yet
    return `${prefix}-${Date.now().toString().substr(-4)}`;
  }
};

// Create a backup of all CSV files
const createBackup = async () => {
  const dataDir = getDataDir();
  const backupDir = path.join(dataDir, 'backups', new Date().toISOString().split('T')[0]);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const files = [
    'rolls.csv', 
    'goods_on_machine.csv', 
    'boxes.csv', 
    'dispatches.csv',
    'customers.csv',
    'bobbin_types.csv',
    'box_types.csv',
    'lots.csv',
    'machines.csv',
    'inbound_bobbins.csv'
  ];
  
  try {
    for (const file of files) {
      const sourceFile = path.join(dataDir, file);
      if (fs.existsSync(sourceFile)) {
        const backupFile = path.join(backupDir, file);
        fs.copyFileSync(sourceFile, backupFile);
      }
    }
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

module.exports = {
  readCSV,
  writeCSV,
  generateId,
  createBackup,
  getDataDir
}; 