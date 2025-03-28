const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const BOX_TYPES_FILE = 'box_types.csv';

// Get all box types
const getAllBoxTypes = async () => {
  return await readCSV(BOX_TYPES_FILE);
};

// Get box type by ID
const getBoxTypeById = async (boxTypeId) => {
  const boxTypes = await getAllBoxTypes();
  return boxTypes.find(boxType => boxType.box_type_id === boxTypeId);
};

// Get box type by name
const getBoxTypeByName = async (typeName) => {
  const boxTypes = await getAllBoxTypes();
  return boxTypes.find(boxType => 
    boxType.type_name.toLowerCase() === typeName.toLowerCase()
  );
};

// Create a new box type
const createBoxType = async (boxTypeData) => {
  const boxTypes = await getAllBoxTypes();
  
  // Check if box type with same name already exists
  const existingType = boxTypes.find(
    t => t.type_name.toLowerCase() === boxTypeData.type_name.toLowerCase()
  );
  
  if (existingType) {
    throw new Error(`Box type with name "${boxTypeData.type_name}" already exists`);
  }
  
  // Generate a new box type ID
  const boxTypeId = await generateId('BX');
  
  // Create a new box type object
  const newBoxType = {
    box_type_id: boxTypeId,
    type_name: boxTypeData.type_name,
    description: boxTypeData.description || '',
    dimensions: boxTypeData.dimensions || '', // e.g. "30x40x25 cm"
    tare_weight: boxTypeData.tare_weight || 0,
    notes: boxTypeData.notes || ''
  };
  
  // Add to the array
  boxTypes.push(newBoxType);
  
  // Write back to the file
  await writeCSV(BOX_TYPES_FILE, boxTypes);
  
  return newBoxType;
};

// Update a box type
const updateBoxType = async (boxTypeId, updatedProperties) => {
  const boxTypes = await getAllBoxTypes();
  
  // Find the box type to update
  const typeIndex = boxTypes.findIndex(boxType => boxType.box_type_id === boxTypeId);
  
  if (typeIndex === -1) {
    throw new Error(`Box type with ID ${boxTypeId} not found`);
  }
  
  // If name is being updated, check for duplicates
  if (updatedProperties.type_name) {
    const nameExists = boxTypes.some(
      (t, i) => i !== typeIndex && 
      t.type_name.toLowerCase() === updatedProperties.type_name.toLowerCase()
    );
    
    if (nameExists) {
      throw new Error(`Box type with name "${updatedProperties.type_name}" already exists`);
    }
  }
  
  // Update the properties
  boxTypes[typeIndex] = {
    ...boxTypes[typeIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(BOX_TYPES_FILE, boxTypes);
  
  return boxTypes[typeIndex];
};

// Delete a box type
const deleteBoxType = async (boxTypeId) => {
  const boxTypes = await getAllBoxTypes();
  
  // Find the box type to delete
  const typeIndex = boxTypes.findIndex(boxType => boxType.box_type_id === boxTypeId);
  
  if (typeIndex === -1) {
    throw new Error(`Box type with ID ${boxTypeId} not found`);
  }
  
  // Remove the box type
  boxTypes.splice(typeIndex, 1);
  
  // Write back to the file
  await writeCSV(BOX_TYPES_FILE, boxTypes);
  
  return true;
};

module.exports = {
  getAllBoxTypes,
  getBoxTypeById,
  getBoxTypeByName,
  createBoxType,
  updateBoxType,
  deleteBoxType
}; 