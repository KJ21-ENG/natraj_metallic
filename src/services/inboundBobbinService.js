const { readCSV, writeCSV } = require('./csvService');

// Constants
const INBOUND_BOBBINS_FILE = 'inbound_bobbins.csv';

// Get all inbound bobbins
const getAllInboundBobbins = async () => {
  return await readCSV(INBOUND_BOBBINS_FILE);
};

// Get inbound bobbin by ID
const getInboundBobbinById = async (bobbinId) => {
  const bobbins = await getAllInboundBobbins();
  return bobbins.find(bobbin => bobbin.inbound_bobbin_id === bobbinId);
};

// Get available bobbins of a specific type
const getAvailableBobbinsByType = async (bobbinType) => {
  const bobbins = await getAllInboundBobbins();
  return bobbins.filter(
    bobbin => bobbin.bobbin_type === bobbinType && bobbin.status === 'in_stock'
  );
};

// Get all available bobbins
const getAvailableBobbins = async () => {
  const bobbins = await getAllInboundBobbins();
  return bobbins.filter(bobbin => bobbin.status === 'in_stock');
};

// Create inbound bobbin
const createInboundBobbin = async (bobbinData) => {
  const bobbins = await getAllInboundBobbins();
  
  // Add to the array
  bobbins.push(bobbinData);
  
  // Write back to the file
  await writeCSV(INBOUND_BOBBINS_FILE, bobbins);
  
  return bobbinData;
};

// Update inbound bobbin status
const updateInboundBobbinStatus = async (bobbinId, status) => {
  const bobbins = await getAllInboundBobbins();
  
  // Find the bobbin to update
  const bobbinIndex = bobbins.findIndex(bobbin => bobbin.inbound_bobbin_id === bobbinId);
  
  if (bobbinIndex === -1) {
    throw new Error(`Inbound bobbin with ID ${bobbinId} not found`);
  }
  
  // Update the status
  bobbins[bobbinIndex].status = status;
  
  // Write back to the file
  await writeCSV(INBOUND_BOBBINS_FILE, bobbins);
  
  return bobbins[bobbinIndex];
};

// Update inbound bobbin quantity
const updateInboundBobbinQuantity = async (bobbinId, quantity) => {
  const bobbins = await getAllInboundBobbins();
  
  // Find the bobbin to update
  const bobbinIndex = bobbins.findIndex(bobbin => bobbin.inbound_bobbin_id === bobbinId);
  
  if (bobbinIndex === -1) {
    throw new Error(`Inbound bobbin with ID ${bobbinId} not found`);
  }
  
  // Update the quantity
  bobbins[bobbinIndex].quantity = quantity.toString();
  
  // Write back to the file
  await writeCSV(INBOUND_BOBBINS_FILE, bobbins);
  
  return bobbins[bobbinIndex];
};

// Delete inbound bobbin by lot number
const deleteInboundBobbinsByLot = async (lotNumber) => {
  const bobbins = await getAllInboundBobbins();
  
  // Filter out bobbins for the specified lot
  const updatedBobbins = bobbins.filter(bobbin => bobbin.lot_no !== lotNumber);
  
  // Write back to the file
  await writeCSV(INBOUND_BOBBINS_FILE, updatedBobbins);
  
  return true;
};

// Deduct bobbins from inventory (used when issuing to machine)
const deductBobbinsFromInventory = async (bobbinType, quantity) => {
  try {
    // Get all available bobbins of the specified type
    const availableBobbins = await getAvailableBobbinsByType(bobbinType);
    
    if (availableBobbins.length === 0) {
      throw new Error(`No ${bobbinType} bobbins available in stock`);
    }
    
    // Calculate total available quantity
    const totalAvailable = availableBobbins.reduce(
      (sum, bobbin) => sum + parseInt(bobbin.quantity), 
      0
    );
    
    if (totalAvailable < quantity) {
      throw new Error(`Not enough ${bobbinType} bobbins in stock. Available: ${totalAvailable}`);
    }
    
    // Deduct from inventory
    let remainingToDeduct = quantity;
    const allBobbins = await getAllInboundBobbins();
    
    const updatedBobbins = allBobbins.map(bobbin => {
      // Skip if not the right type or not in stock
      if (bobbin.bobbin_type !== bobbinType || bobbin.status !== 'in_stock') {
        return bobbin;
      }
      
      // Skip if we've already deducted all we need
      if (remainingToDeduct <= 0) {
        return bobbin;
      }
      
      // Calculate how much to deduct from this entry
      const currentQty = parseInt(bobbin.quantity);
      const deductFromCurrent = Math.min(currentQty, remainingToDeduct);
      
      remainingToDeduct -= deductFromCurrent;
      
      // If we're using all of this entry's quantity, mark it as in_use
      if (deductFromCurrent >= currentQty) {
        return {
          ...bobbin,
          quantity: '0',
          status: 'in_use'
        };
      } 
      // Otherwise reduce the quantity
      else {
        return {
          ...bobbin,
          quantity: (currentQty - deductFromCurrent).toString()
        };
      }
    });
    
    // Write the updated bobbins back to the file
    await writeCSV(INBOUND_BOBBINS_FILE, updatedBobbins);
    
    return true;
  } catch (error) {
    console.error('Error deducting bobbins from inventory:', error);
    throw error;
  }
};

module.exports = {
  getAllInboundBobbins,
  getInboundBobbinById,
  getAvailableBobbinsByType,
  getAvailableBobbins,
  createInboundBobbin,
  updateInboundBobbinStatus,
  updateInboundBobbinQuantity,
  deleteInboundBobbinsByLot,
  deductBobbinsFromInventory
}; 