const { readCSV, writeCSV } = require('./csvService');
const rollService = require('./rollService');

// Constants
const LOTS_FILE = 'lots.csv';

// Get all lots
const getAllLots = async () => {
  return await readCSV(LOTS_FILE);
};

// Get lot by ID
const getLotById = async (lotNumber) => {
  const lots = await getAllLots();
  return lots.find(lot => lot.lot_number === lotNumber);
};

// Get the next lot number
const getNextLotNumber = async () => {
  const lots = await getAllLots();
  
  if (lots.length === 0) {
    return '1001'; // Starting lot number
  }
  
  // Find the highest lot number and increment by 1
  const lotNumbers = lots.map(lot => parseInt(lot.lot_number));
  const maxLotNumber = Math.max(...lotNumbers);
  return (maxLotNumber + 1).toString();
};

// Create a new lot with multiple rolls
const createLot = async (lotData, rollsData) => {
  // First, get existing lots
  const lots = await getAllLots();
  
  // Create the lot record
  const newLot = {
    lot_number: lotData.lot_number,
    date_received: lotData.date_received,
    total_rolls: rollsData.length,
    total_weight: rollsData.reduce((sum, roll) => sum + parseFloat(roll.weight), 0).toFixed(2)
  };
  
  // Add to the array
  lots.push(newLot);
  
  // Write back to the file
  await writeCSV(LOTS_FILE, lots);
  
  // Now create all the rolls with proper IDs
  const createdRolls = [];
  
  for (let i = 0; i < rollsData.length; i++) {
    const rollId = `${lotData.lot_number}-${i + 1}`;
    
    const roll = {
      ...rollsData[i],
      roll_id: rollId,
      status: 'in_stock'
    };
    
    const createdRoll = await rollService.createRollWithId(roll);
    createdRolls.push(createdRoll);
  }
  
  return {
    lot: newLot,
    rolls: createdRolls
  };
};

// Get rolls by lot number
const getRollsByLotNumber = async (lotNumber) => {
  const allRolls = await rollService.getAllRolls();
  return allRolls.filter(roll => roll.roll_id.startsWith(`${lotNumber}-`));
};

// Delete a lot and its rolls
const deleteLot = async (lotNumber) => {
  // First, get the rolls for this lot
  const lotRolls = await getRollsByLotNumber(lotNumber);
  
  // Delete each roll
  for (const roll of lotRolls) {
    await rollService.deleteRoll(roll.roll_id);
  }
  
  // Now delete the lot record
  const lots = await getAllLots();
  const lotIndex = lots.findIndex(lot => lot.lot_number === lotNumber);
  
  if (lotIndex === -1) {
    throw new Error(`Lot with number ${lotNumber} not found`);
  }
  
  lots.splice(lotIndex, 1);
  await writeCSV(LOTS_FILE, lots);
  
  return true;
};

module.exports = {
  getAllLots,
  getLotById,
  getNextLotNumber,
  createLot,
  getRollsByLotNumber,
  deleteLot
}; 