const { readCSV, writeCSV, generateId } = require('./csvService');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Constants
const MACHINES_FILE = 'machines.csv';

// Get the data directory path
const getDataDir = () => path.join(app.getPath('userData'), 'data');

// Get all machines
const getAllMachines = async () => {
  const machines = await readCSV(MACHINES_FILE);
  console.log('getAllMachines - Raw machines data:', JSON.stringify(machines));
  return machines;
};

// Get machine by ID
const getMachineById = async (machineId) => {
  const machines = await getAllMachines();
  return machines.find(machine => machine.machine_id === machineId);
};

// Create a new machine
const createMachine = async (machineData) => {
  console.log('createMachine - Input data:', JSON.stringify(machineData));
  
  // First, check if the file exists and has proper headers
  const dataDir = getDataDir();
  const filePath = path.join(dataDir, MACHINES_FILE);
  
  // Force recreate the file to ensure it has proper headers
  const headers = 'machine_id,machine_number,description\n';
  
  try {
    // If file exists, read its content first
    let existingContent = '';
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      // Skip the header line and keep the rest
      if (lines.length > 1) {
        existingContent = lines.slice(1).join('\n');
      }
    }
    
    // Write the header and existing content back
    fs.writeFileSync(filePath, headers + existingContent);
    console.log(`Ensured ${MACHINES_FILE} has proper headers`);
  } catch (error) {
    console.error(`Error ensuring ${MACHINES_FILE} has proper headers:`, error);
  }
  
  const machines = await getAllMachines();
  
  // Check if machine with same number already exists
  const existingMachine = machines.find(
    m => m.machine_number === machineData.machine_number
  );
  
  if (existingMachine) {
    throw new Error(`Machine with number "${machineData.machine_number}" already exists`);
  }
  
  // Generate a new machine ID
  const machineId = await generateId('MCH');
  
  // Create a new machine object
  const newMachine = {
    machine_id: machineId,
    machine_number: machineData.machine_number,
    description: machineData.description || ''
  };
  
  console.log('createMachine - New machine object:', JSON.stringify(newMachine));
  
  // Add to the array
  machines.push(newMachine);
  
  // Write back to the file
  await writeCSV(MACHINES_FILE, machines);
  
  // Verify it was written correctly
  const verifyMachines = await getAllMachines();
  const verifiedMachine = verifyMachines.find(m => m.machine_id === machineId);
  console.log('createMachine - Verified machine in file:', JSON.stringify(verifiedMachine));
  
  return newMachine;
};

// Update a machine
const updateMachine = async (machineId, updatedProperties) => {
  console.log('updateMachine - Updating machine:', machineId, JSON.stringify(updatedProperties));
  
  const machines = await getAllMachines();
  
  // Find the machine to update
  const machineIndex = machines.findIndex(machine => machine.machine_id === machineId);
  
  if (machineIndex === -1) {
    throw new Error(`Machine with ID ${machineId} not found`);
  }
  
  // If machine number is being updated, check for duplicates
  if (updatedProperties.machine_number) {
    const numberExists = machines.some(
      (m, i) => i !== machineIndex && 
      m.machine_number === updatedProperties.machine_number
    );
    
    if (numberExists) {
      throw new Error(`Machine with number "${updatedProperties.machine_number}" already exists`);
    }
  }
  
  // Update the properties
  machines[machineIndex] = {
    ...machines[machineIndex],
    ...updatedProperties
  };
  
  console.log('updateMachine - Updated machine object:', JSON.stringify(machines[machineIndex]));
  
  // Write back to the file
  await writeCSV(MACHINES_FILE, machines);
  
  return machines[machineIndex];
};

// Delete a machine
const deleteMachine = async (machineId) => {
  const machines = await getAllMachines();
  
  // Find the machine to delete
  const machineIndex = machines.findIndex(machine => machine.machine_id === machineId);
  
  if (machineIndex === -1) {
    throw new Error(`Machine with ID ${machineId} not found`);
  }
  
  // Remove the machine
  machines.splice(machineIndex, 1);
  
  // Write back to the file
  await writeCSV(MACHINES_FILE, machines);
  
  return true;
};

module.exports = {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine
}; 