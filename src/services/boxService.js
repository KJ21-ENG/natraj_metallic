const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const BOXES_FILE = 'boxes.csv';

// Get all boxes
const getAllBoxes = async () => {
  return await readCSV(BOXES_FILE);
};

// Get boxes by status
const getBoxesByStatus = async (status) => {
  const boxes = await getAllBoxes();
  return boxes.filter(box => box.status === status);
};

// Get boxes by roll ID
const getBoxesByRollId = async (rollId) => {
  const boxes = await getAllBoxes();
  return boxes.filter(box => box.roll_id === rollId);
};

// Get box by ID
const getBoxById = async (boxId) => {
  const boxes = await getAllBoxes();
  return boxes.find(box => box.box_id === boxId);
};

// Create a new box
const createBox = async (boxData) => {
  const boxes = await getAllBoxes();
  
  // Generate a new box ID if not provided
  let boxId = boxData.box_id;
  if (!boxId) {
    boxId = await generateId('BOX');
  }
  
  // Create a new box object
  const newBox = {
    box_id: boxId,
    roll_id: boxData.roll_id,
    date_created: boxData.date_created || new Date().toISOString().split('T')[0],
    gross_weight: boxData.gross_weight,
    tare_weight: boxData.tare_weight,
    net_weight: boxData.net_weight || (boxData.gross_weight - boxData.tare_weight),
    bobbin_count: boxData.bobbin_count,
    bobbin_type: boxData.bobbin_type,
    status: boxData.status || 'ready_to_dispatch'
  };
  
  // Add to the array
  boxes.push(newBox);
  
  // Write back to the file
  await writeCSV(BOXES_FILE, boxes);
  
  return newBox;
};

// Update a box's status
const updateBoxStatus = async (boxId, status) => {
  const boxes = await getAllBoxes();
  
  // Find the box to update
  const boxIndex = boxes.findIndex(box => box.box_id === boxId);
  
  if (boxIndex === -1) {
    throw new Error(`Box with ID ${boxId} not found`);
  }
  
  // Update the status
  boxes[boxIndex].status = status;
  
  // Write back to the file
  await writeCSV(BOXES_FILE, boxes);
  
  return boxes[boxIndex];
};

// Update a box's properties
const updateBox = async (boxId, updatedProperties) => {
  const boxes = await getAllBoxes();
  
  // Find the box to update
  const boxIndex = boxes.findIndex(box => box.box_id === boxId);
  
  if (boxIndex === -1) {
    throw new Error(`Box with ID ${boxId} not found`);
  }
  
  // Update the properties
  boxes[boxIndex] = {
    ...boxes[boxIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(BOXES_FILE, boxes);
  
  return boxes[boxIndex];
};

// Delete a box
const deleteBox = async (boxId) => {
  const boxes = await getAllBoxes();
  
  // Find the box to delete
  const boxIndex = boxes.findIndex(box => box.box_id === boxId);
  
  if (boxIndex === -1) {
    throw new Error(`Box with ID ${boxId} not found`);
  }
  
  // Remove the box
  boxes.splice(boxIndex, 1);
  
  // Write back to the file
  await writeCSV(BOXES_FILE, boxes);
  
  return true;
};

module.exports = {
  getAllBoxes,
  getBoxesByStatus,
  getBoxesByRollId,
  getBoxById,
  createBox,
  updateBoxStatus,
  updateBox,
  deleteBox
}; 