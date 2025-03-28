const { readCSV, writeCSV, generateId } = require('./csvService');

// Constants
const BOBBIN_TYPES_FILE = 'bobbin_types.csv';

// Get all bobbin types
const getAllBobbinTypes = async () => {
  return await readCSV(BOBBIN_TYPES_FILE);
};

// Get bobbin type by ID
const getBobbinTypeById = async (bobbinTypeId) => {
  const bobbinTypes = await getAllBobbinTypes();
  return bobbinTypes.find(bobbinType => bobbinType.bobbin_type_id === bobbinTypeId);
};

// Get bobbin type by name
const getBobbinTypeByName = async (typeName) => {
  const bobbinTypes = await getAllBobbinTypes();
  return bobbinTypes.find(bobbinType => 
    bobbinType.type_name.toLowerCase() === typeName.toLowerCase()
  );
};

// Create a new bobbin type
const createBobbinType = async (bobbinTypeData) => {
  const bobbinTypes = await getAllBobbinTypes();
  
  // Check if bobbin type with same name already exists
  const existingType = bobbinTypes.find(
    t => t.type_name.toLowerCase() === bobbinTypeData.type_name.toLowerCase()
  );
  
  if (existingType) {
    throw new Error(`Bobbin type with name "${bobbinTypeData.type_name}" already exists`);
  }
  
  // Generate a new bobbin type ID
  const bobbinTypeId = await generateId('BT');
  
  // Create a new bobbin type object
  const newBobbinType = {
    bobbin_type_id: bobbinTypeId,
    type_name: bobbinTypeData.type_name,
    description: bobbinTypeData.description || '',
    weight: bobbinTypeData.weight || 0,
    notes: bobbinTypeData.notes || ''
  };
  
  // Add to the array
  bobbinTypes.push(newBobbinType);
  
  // Write back to the file
  await writeCSV(BOBBIN_TYPES_FILE, bobbinTypes);
  
  return newBobbinType;
};

// Update a bobbin type
const updateBobbinType = async (bobbinTypeId, updatedProperties) => {
  const bobbinTypes = await getAllBobbinTypes();
  
  // Find the bobbin type to update
  const typeIndex = bobbinTypes.findIndex(bobbinType => bobbinType.bobbin_type_id === bobbinTypeId);
  
  if (typeIndex === -1) {
    throw new Error(`Bobbin type with ID ${bobbinTypeId} not found`);
  }
  
  // If name is being updated, check for duplicates
  if (updatedProperties.type_name) {
    const nameExists = bobbinTypes.some(
      (t, i) => i !== typeIndex && 
      t.type_name.toLowerCase() === updatedProperties.type_name.toLowerCase()
    );
    
    if (nameExists) {
      throw new Error(`Bobbin type with name "${updatedProperties.type_name}" already exists`);
    }
  }
  
  // Update the properties
  bobbinTypes[typeIndex] = {
    ...bobbinTypes[typeIndex],
    ...updatedProperties
  };
  
  // Write back to the file
  await writeCSV(BOBBIN_TYPES_FILE, bobbinTypes);
  
  return bobbinTypes[typeIndex];
};

// Delete a bobbin type
const deleteBobbinType = async (bobbinTypeId) => {
  const bobbinTypes = await getAllBobbinTypes();
  
  // Find the bobbin type to delete
  const typeIndex = bobbinTypes.findIndex(bobbinType => bobbinType.bobbin_type_id === bobbinTypeId);
  
  if (typeIndex === -1) {
    throw new Error(`Bobbin type with ID ${bobbinTypeId} not found`);
  }
  
  // Remove the bobbin type
  bobbinTypes.splice(typeIndex, 1);
  
  // Write back to the file
  await writeCSV(BOBBIN_TYPES_FILE, bobbinTypes);
  
  return true;
};

module.exports = {
  getAllBobbinTypes,
  getBobbinTypeById,
  getBobbinTypeByName,
  createBobbinType,
  updateBobbinType,
  deleteBobbinType
}; 