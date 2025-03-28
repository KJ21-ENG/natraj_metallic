const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const ROLLS_FILE = 'rolls.csv';

// Get all rolls
const getAllRolls = async () => {
  return await readCSV(ROLLS_FILE);
};

// Get rolls by status
const getRollsByStatus = async (status) => {
  const rolls = await getAllRolls();
  return rolls.filter(roll => roll.status === status);
};

// Get roll by ID
const getRollById = async (rollId) => {
  const rolls = await getAllRolls();
  return rolls.find(roll => roll.roll_id === rollId);
};

// Create a new roll
const createRoll = async (rollData) => {
  const rolls = await getAllRolls();
  
  // Generate a new roll ID
  const rollId = await generateId('ROLL');
  
  // Create a new roll object
  const newRoll = {
    roll_id: rollId,
    customer_name: rollData.customer_name,
    color_or_type: rollData.color_or_type,
    weight: rollData.weight,
    status: rollData.status || 'in_stock',
    date_received: rollData.date_received || new Date().toISOString().split('T')[0],
    lot_no: rollData.lot_no || ''
  };
  
  // Add to the array
  rolls.push(newRoll);
  
  // Write back to the file
  await writeCSV(ROLLS_FILE, rolls);
  
  return newRoll;
};

// Create a new roll with a specific ID (used by lot service)
const createRollWithId = async (rollData) => {
  const rolls = await getAllRolls();
  
  // Check if roll with this ID already exists
  const existingRoll = rolls.find(roll => roll.roll_id === rollData.roll_id);
  
  if (existingRoll) {
    throw new Error(`Roll with ID ${rollData.roll_id} already exists`);
  }
  
  // Create a new roll object
  const newRoll = {
    roll_id: rollData.roll_id,
    customer_name: rollData.customer_name,
    color_or_type: rollData.color_or_type,
    weight: rollData.weight,
    status: rollData.status || 'in_stock',
    date_received: rollData.date_received || new Date().toISOString().split('T')[0],
    lot_no: rollData.lot_no || rollData.roll_id.split('-')[0] // Extract lot number from roll_id
  };
  
  // Add to the array
  rolls.push(newRoll);
  
  // Write back to the file
  await writeCSV(ROLLS_FILE, rolls);
  
  return newRoll;
};

// Update a roll's status
const updateRollStatus = async (rollId, status) => {
  const rolls = await getAllRolls();
  
  // Find the roll to update
  const rollIndex = rolls.findIndex(roll => roll.roll_id === rollId);
  
  if (rollIndex === -1) {
    throw new Error(`Roll with ID ${rollId} not found`);
  }
  
  // Update the status
  rolls[rollIndex].status = status;
  
  // Write back to the file
  await writeCSV(ROLLS_FILE, rolls);
  
  return rolls[rollIndex];
};

// Update a roll's properties
const updateRoll = async (rollId, updatedProperties) => {
  const rolls = await getAllRolls();
  
  // Find the roll to update
  const rollIndex = rolls.findIndex(roll => roll.roll_id === rollId);
  
  if (rollIndex === -1) {
    throw new Error(`Roll with ID ${rollId} not found`);
  }
  
  // Update the properties
  rolls[rollIndex] = {
    ...rolls[rollIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(ROLLS_FILE, rolls);
  
  return rolls[rollIndex];
};

// Delete a roll
const deleteRoll = async (rollId) => {
  const rolls = await getAllRolls();
  
  // Find the roll to delete
  const rollIndex = rolls.findIndex(roll => roll.roll_id === rollId);
  
  if (rollIndex === -1) {
    throw new Error(`Roll with ID ${rollId} not found`);
  }
  
  // Remove the roll
  rolls.splice(rollIndex, 1);
  
  // Write back to the file
  await writeCSV(ROLLS_FILE, rolls);
  
  return true;
};

module.exports = {
  getAllRolls,
  getRollsByStatus,
  getRollById,
  createRoll,
  createRollWithId,
  updateRollStatus,
  updateRoll,
  deleteRoll
}; 