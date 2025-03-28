const { readCSV, writeCSV } = require('./csvService');
const { updateRollStatus } = require('./rollService');
const inboundBobbinService = require('./inboundBobbinService');

// Constants
const GOODS_ON_MACHINE_FILE = 'goods_on_machine.csv';

// Get all goods on machine
const getAllGoodsOnMachine = async () => {
  return await readCSV(GOODS_ON_MACHINE_FILE);
};

// Get goods on machine by roll ID
const getGoodsOnMachineByRollId = async (rollId) => {
  const goods = await getAllGoodsOnMachine();
  return goods.find(item => item.roll_id === rollId);
};

// Issue a roll to machine
const issueToMachine = async (issueData) => {
  const goods = await getAllGoodsOnMachine();
  
  // Check if the roll is already on a machine
  const existingIndex = goods.findIndex(item => item.roll_id === issueData.roll_id);
  
  const goodsOnMachineData = {
    roll_id: issueData.roll_id,
    issued_date: issueData.issued_date || new Date().toISOString().split('T')[0],
    operator: issueData.operator,
    machine_id: issueData.machine_id || '',
    machine_number: issueData.machine_number || 'N/A',
    cut: issueData.cut || 0,
    bobbin_quantity: issueData.bobbin_quantity || 0,
    bobbin_type: issueData.bobbin_type || '',
    initial_weight: issueData.initial_weight,
    weight_received_so_far: 0,
    wastage_marked: false
  };
  
  if (existingIndex !== -1) {
    // Update the existing record
    goods[existingIndex] = {
      ...goods[existingIndex],
      ...goodsOnMachineData
    };
  } else {
    // Add a new record
    goods.push(goodsOnMachineData);
  }
  
  // Update the roll status
  await updateRollStatus(issueData.roll_id, 'issued_to_machine');
  
  // If bobbin quantity is specified, update the inbound bobbin inventory
  if (issueData.bobbin_quantity > 0 && issueData.bobbin_type) {
    await inboundBobbinService.deductBobbinsFromInventory(issueData.bobbin_type, issueData.bobbin_quantity);
  }
  
  // Write back to the file
  await writeCSV(GOODS_ON_MACHINE_FILE, goods);
  
  return goodsOnMachineData;
};

// Update goods on machine
const updateGoodsOnMachine = async (rollId, updatedData) => {
  const goods = await getAllGoodsOnMachine();
  
  // Find the record to update
  const goodsIndex = goods.findIndex(item => item.roll_id === rollId);
  
  if (goodsIndex === -1) {
    throw new Error(`Goods on machine for roll ID ${rollId} not found`);
  }
  
  // Update the record
  goods[goodsIndex] = {
    ...goods[goodsIndex],
    ...updatedData
  };
  
  // Write back to the file
  await writeCSV(GOODS_ON_MACHINE_FILE, goods);
  
  return goods[goodsIndex];
};

// Remove goods from machine (when a roll is fully processed or marked as wastage)
const removeFromMachine = async (rollId) => {
  const goods = await getAllGoodsOnMachine();
  
  // Find the record to remove
  const goodsIndex = goods.findIndex(item => item.roll_id === rollId);
  
  if (goodsIndex === -1) {
    throw new Error(`Goods on machine for roll ID ${rollId} not found`);
  }
  
  // Remove the record
  goods.splice(goodsIndex, 1);
  
  // Write back to the file
  await writeCSV(GOODS_ON_MACHINE_FILE, goods);
  
  return true;
};

module.exports = {
  getAllGoodsOnMachine,
  getGoodsOnMachineByRollId,
  issueToMachine,
  updateGoodsOnMachine,
  removeFromMachine
}; 