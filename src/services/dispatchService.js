const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const DISPATCHES_FILE = 'dispatches.csv';

// Get all dispatches
const getAllDispatches = async () => {
  return await readCSV(DISPATCHES_FILE);
};

// Get dispatch by ID
const getDispatchById = async (dispatchId) => {
  const dispatches = await getAllDispatches();
  return dispatches.find(dispatch => dispatch.dispatch_id === dispatchId);
};

// Get dispatches by date range
const getDispatchesByDateRange = async (startDate, endDate) => {
  const dispatches = await getAllDispatches();
  return dispatches.filter(dispatch => {
    const dispatchDate = dispatch.dispatch_date;
    return dispatchDate >= startDate && dispatchDate <= endDate;
  });
};

// Get dispatches by customer
const getDispatchesByCustomer = async (customerName) => {
  const dispatches = await getAllDispatches();
  return dispatches.filter(dispatch => 
    dispatch.customer_name.toLowerCase().includes(customerName.toLowerCase())
  );
};

// Create a new dispatch
const createDispatch = async (dispatchData) => {
  const dispatches = await getAllDispatches();
  
  // Generate a new dispatch ID
  const dispatchId = await generateId('DISP');
  
  // Create a new dispatch object
  const newDispatch = {
    dispatch_id: dispatchId,
    dispatch_date: dispatchData.dispatch_date || new Date().toISOString().split('T')[0],
    customer_name: dispatchData.customer_name,
    box_ids: dispatchData.box_ids, // Comma-separated string of box IDs
    total_weight: dispatchData.total_weight,
    total_bobbins: dispatchData.total_bobbins
  };
  
  // Add to the array
  dispatches.push(newDispatch);
  
  // Write back to the file
  await writeCSV(DISPATCHES_FILE, dispatches);
  
  return newDispatch;
};

// Update a dispatch
const updateDispatch = async (dispatchId, updatedProperties) => {
  const dispatches = await getAllDispatches();
  
  // Find the dispatch to update
  const dispatchIndex = dispatches.findIndex(dispatch => dispatch.dispatch_id === dispatchId);
  
  if (dispatchIndex === -1) {
    throw new Error(`Dispatch with ID ${dispatchId} not found`);
  }
  
  // Update the properties
  dispatches[dispatchIndex] = {
    ...dispatches[dispatchIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(DISPATCHES_FILE, dispatches);
  
  return dispatches[dispatchIndex];
};

// Delete a dispatch
const deleteDispatch = async (dispatchId) => {
  const dispatches = await getAllDispatches();
  
  // Find the dispatch to delete
  const dispatchIndex = dispatches.findIndex(dispatch => dispatch.dispatch_id === dispatchId);
  
  if (dispatchIndex === -1) {
    throw new Error(`Dispatch with ID ${dispatchId} not found`);
  }
  
  // Remove the dispatch
  dispatches.splice(dispatchIndex, 1);
  
  // Write back to the file
  await writeCSV(DISPATCHES_FILE, dispatches);
  
  return true;
};

module.exports = {
  getAllDispatches,
  getDispatchById,
  getDispatchesByDateRange,
  getDispatchesByCustomer,
  createDispatch,
  updateDispatch,
  deleteDispatch
}; 